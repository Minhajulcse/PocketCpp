import { BITS_STDCPP_H } from './umbrellaHeader';
import { parseDiagnostics } from './diagnostics';
import { CompilerWorkerRequest, Diagnostic } from './types';

let clangModule: any = null;

async function getClang(): Promise<{ runClang: any; initDurationMs: number }> {
  if (clangModule) {
    return { runClang: clangModule.runClang, initDurationMs: 0 };
  }
  const t0 = performance.now();
  // Dynamically load the Clang bundle from the public static assets
  // This allows offline caching via Service Worker / Cache Storage
  const bundleUrl = '/clang/bundle.js';
  clangModule = await import(/* @vite-ignore */ bundleUrl);
  const initDurationMs = performance.now() - t0;
  return { runClang: clangModule.runClang, initDurationMs };
}

function parseWasmMetadata(wasmBytes: Uint8Array): {
  wasmInitialMemoryMb: number;
  wasmMaxMemoryMb: number | null;
  globalDataSizeBytes: number;
  wasmBinarySizeBytes: number;
} {
  let pos = 8;
  let initialPages = 0;
  let maxPages: number | null = null;
  let dataSectionBytes = 0;

  function readLeb128(): number {
    let result = 0;
    let shift = 0;
    while (pos < wasmBytes.length) {
      const byte = wasmBytes[pos++];
      result |= (byte & 0x7f) << shift;
      shift += 7;
      if ((byte & 0x80) === 0) break;
    }
    return result;
  }

  while (pos < wasmBytes.length) {
    const sectionId = wasmBytes[pos++];
    const sectionLen = readLeb128();
    const sectionStart = pos;

    if (sectionId === 5) {
      // Section 5: Memory Section
      const count = readLeb128();
      if (count > 0) {
        const flags = readLeb128();
        initialPages = readLeb128();
        if (flags & 1) {
          maxPages = readLeb128();
        }
      }
    } else if (sectionId === 11) {
      // Section 11: Data Section
      dataSectionBytes = sectionLen;
    }

    pos = sectionStart + sectionLen;
  }

  return {
    wasmInitialMemoryMb: (initialPages * 64) / 1024,
    wasmMaxMemoryMb: maxPages !== null ? (maxPages * 64) / 1024 : null,
    globalDataSizeBytes: dataSectionBytes,
    wasmBinarySizeBytes: wasmBytes.byteLength,
  };
}

self.onmessage = async (e: MessageEvent<CompilerWorkerRequest>) => {
  const req = e.data;

  if (req.type === 'PRELOAD') {
    try {
      const { runClang } = await getClang();
      // Trigger a warm-up check
      await runClang(['clang', '--version'], {}, {});
      self.postMessage({ type: 'PRELOAD_SUCCESS' });
    } catch {
      // Ignored
    }
    return;
  }

  if (req.type === 'COMPILE') {
    const { runId, sourceName, sourceCode, additionalFiles, options } = req;
    let compilerOutput = '';
    const textDecoder = new TextDecoder();
    let initDurationMs = 0;
    let compileStartTime = 0;
    let sourceCompilationDurationMs = 0;
    let linkingDurationMs = 0;

    try {
      self.postMessage({ type: 'COMPILE_STAGE', runId, stage: 'initializing' });
      const clangRes = await getClang();
      const runClang = clangRes.runClang;
      initDurationMs = clangRes.initDurationMs;

      compileStartTime = performance.now();

      const isCpp = options.language === 'cpp';
      const cmd = isCpp ? 'clang++' : 'clang';

      const initialMemoryMb = options.initialMemoryMb || 128;
      const maxMemoryMb = options.maxMemoryMb || 256;
      const stackSizeMb = options.stackSizeMb || 16;
      const initialMemoryBytes = initialMemoryMb * 1024 * 1024;
      const maxMemoryBytes = maxMemoryMb * 1024 * 1024;
      const stackSizeBytes = stackSizeMb * 1024 * 1024;

      // Build virtual file tree
      const files: Record<string, any> = {
        [sourceName]: sourceCode,
        ...(isCpp
          ? {
              bits: {
                'stdc++.h': BITS_STDCPP_H,
              },
            }
          : {}),
      };

      // Add additional project files (headers, other sources)
      if (additionalFiles) {
        for (const [filename, content] of Object.entries(additionalFiles)) {
          if (filename.includes('/')) {
            const parts = filename.split('/');
            let current = files;
            for (let i = 0; i < parts.length - 1; i++) {
              current[parts[i]] = current[parts[i]] || {};
              current = current[parts[i]];
            }
            current[parts[parts.length - 1]] = content;
          } else {
            files[filename] = content;
          }
        }
      }

      const runOptions = {
        stdout: (bytes: Uint8Array | null) => {
          if (bytes) compilerOutput += textDecoder.decode(bytes);
        },
        stderr: (bytes: Uint8Array | null) => {
          if (bytes) compilerOutput += textDecoder.decode(bytes);
        },
        fetchProgress: (progress: { doneLength: number; totalLength: number }) => {
          if (progress && progress.totalLength > 0) {
            self.postMessage({
              type: 'COMPILE_PROGRESS',
              runId,
              progress: {
                doneLength: progress.doneLength,
                totalLength: progress.totalLength,
                percent: Math.min(100, Math.round((progress.doneLength / progress.totalLength) * 100)),
              },
            });
          }
        },
      };

      // Stage 1: Source Compilation to object file (main.o)
      self.postMessage({ type: 'COMPILE_STAGE', runId, stage: 'compiling' });
      const compileT0 = performance.now();
      const objName = 'main.o';
      const compileArgs = [
        cmd,
        '-c',
        ...(isCpp ? ['-fno-exceptions', '-I.'] : []),
        `-std=${options.standard}`,
        `-${options.optimization}`,
        ...(options.warnings ? ['-Wall', '-Wextra'] : []),
        ...(options.extraFlags || []),
        sourceName,
        '-o',
        objName,
      ];

      const compileResultFiles = await runClang(compileArgs, files, runOptions);
      sourceCompilationDurationMs = performance.now() - compileT0;

      const objBinary = compileResultFiles[objName] as Uint8Array;
      if (!objBinary || !(objBinary instanceof Uint8Array)) {
        throw new Error('Compilation produced no intermediate object file');
      }

      // Stage 2: Linking object file to WebAssembly binary (out.wasm)
      self.postMessage({ type: 'COMPILE_STAGE', runId, stage: 'linking' });
      const linkT0 = performance.now();
      const linkArgs = [
        cmd,
        `-Wl,-z,stack-size=${stackSizeBytes}`,
        `-Wl,--initial-memory=${initialMemoryBytes}`,
        `-Wl,--max-memory=${maxMemoryBytes}`,
        '-Wl,--export=__heap_base,--export=__data_end',
        objName,
        '-o',
        'out.wasm',
      ];

      const linkFiles: Record<string, any> = {
        [objName]: objBinary,
      };

      const linkResultFiles = await runClang(linkArgs, linkFiles, runOptions);
      linkingDurationMs = performance.now() - linkT0;
      const wasmBinary = linkResultFiles['out.wasm'] as Uint8Array;

      if (!wasmBinary || !(wasmBinary instanceof Uint8Array)) {
        throw new Error('Linking produced no executable WebAssembly output');
      }

      const durationMs = performance.now() - compileStartTime;
      const diagnostics = parseDiagnostics(compilerOutput);
      const wasmMetadata = parseWasmMetadata(wasmBinary);

      self.postMessage({
        type: 'COMPILE_SUCCESS',
        runId,
        wasmBinary,
        diagnostics,
        output: compilerOutput,
        durationMs,
        compilerInitDurationMs: initDurationMs,
        sourceCompilationDurationMs,
        linkingDurationMs,
        wasmInitialMemoryMb: wasmMetadata.wasmInitialMemoryMb,
        wasmMaxMemoryMb: wasmMetadata.wasmMaxMemoryMb,
        globalDataSizeBytes: wasmMetadata.globalDataSizeBytes,
        wasmBinarySizeBytes: wasmMetadata.wasmBinarySizeBytes,
      });
    } catch (err: any) {
      const durationMs = compileStartTime > 0 ? performance.now() - compileStartTime : 0;
      const diagnostics = parseDiagnostics(compilerOutput);
      let errorMessage = err?.message || 'Compilation failed';

      // Diagnose initial memory exhaustion during linking
      const memMatch = compilerOutput.match(/initial memory too small, (\d+) bytes needed/);
      if (memMatch) {
        const neededBytes = parseInt(memMatch[1], 10);
        const neededMb = Math.ceil(neededBytes / (1024 * 1024));
        const currentMb = Math.round(options.initialMemoryMb || 128);
        errorMessage = `Program memory requirement (${neededMb} MB) exceeds configured WASM memory limit (${currentMb} MB initial). Please increase WASM Initial Memory in Settings.`;
      }

      self.postMessage({
        type: 'COMPILE_ERROR',
        runId,
        diagnostics,
        output: compilerOutput,
        durationMs,
        compilerInitDurationMs: initDurationMs,
        sourceCompilationDurationMs,
        linkingDurationMs,
        errorMessage,
      });
    }
  }
};
