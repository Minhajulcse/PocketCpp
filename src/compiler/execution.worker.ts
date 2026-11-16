import { WASI, OpenFile, File, ConsoleStdout } from '@bjorn3/browser_wasi_shim';
import { ExecutionWorkerRequest } from './types';

self.onmessage = async (e: MessageEvent<ExecutionWorkerRequest>) => {
  const req = e.data;
  if (req.type !== 'EXECUTE') return;

  const { runId, wasmBinary, options } = req;
  const initStartTime = performance.now();
  let execStartTime = 0;
  let wasmLoadingDurationMs = 0;
  let runtimeInitDurationMs = 0;
  let programMemoryAllocatedMb = 0;
  let totalBytes = 0;
  const textDecoder = new TextDecoder('utf-8', { fatal: false });

  try {
    // Standard Input
    const stdinBytes = new TextEncoder().encode(options.stdin || '');
    const stdin = new OpenFile(new File(stdinBytes));

    // Standard Output with byte counting and limit enforcement
    const stdout = new ConsoleStdout((buf: Uint8Array) => {
      totalBytes += buf.length;
      if (totalBytes > options.outputLimitBytes) {
        throw new Error('OUTPUT_LIMIT_EXCEEDED');
      }
      const text = textDecoder.decode(buf, { stream: true });
      self.postMessage({
        type: 'STDOUT',
        runId,
        chunk: text,
      });
    });

    // Standard Error with byte counting and limit enforcement
    const stderr = new ConsoleStdout((buf: Uint8Array) => {
      totalBytes += buf.length;
      if (totalBytes > options.outputLimitBytes) {
        throw new Error('OUTPUT_LIMIT_EXCEEDED');
      }
      const text = textDecoder.decode(buf, { stream: true });
      self.postMessage({
        type: 'STDERR',
        runId,
        chunk: text,
      });
    });

    const wasi = new WASI(['program'], [], [stdin, stdout, stderr]);

    // 1. Compile WASM module
    const wasmLoadT0 = performance.now();
    const wasmModule = await WebAssembly.compile(wasmBinary as any);
    wasmLoadingDurationMs = performance.now() - wasmLoadT0;

    // 2. Instantiate module with WASI imports
    const instantiateT0 = performance.now();
    const instance = await WebAssembly.instantiate(wasmModule, {
      wasi_snapshot_preview1: wasi.wasiImport,
    });
    runtimeInitDurationMs = performance.now() - instantiateT0;

    const mem = instance.exports.memory as WebAssembly.Memory;
    if (mem && mem.buffer) {
      programMemoryAllocatedMb = Number((mem.buffer.byteLength / (1024 * 1024)).toFixed(2));
    }

    // Verify initial allocation against memory limit
    if (options.memoryLimitMb && programMemoryAllocatedMb > options.memoryLimitMb) {
      throw new Error(`MEMORY_LIMIT_EXCEEDED: Initial allocation (${programMemoryAllocatedMb} MB) exceeds limit (${options.memoryLimitMb} MB)`);
    }

    // Notify main thread that worker initialization is done and execution starts now
    self.postMessage({
      type: 'EXECUTION_STARTED',
      runId,
      runtimeInitDurationMs,
      wasmLoadingDurationMs,
      programMemoryAllocatedMb,
    });

    // Pure program execution timing
    execStartTime = performance.now();
    const exitCode = wasi.start(instance as any);
    const durationMs = performance.now() - execStartTime;

    // Re-check memory allocation after execution (e.g. heap growth via memory.grow)
    if (mem && mem.buffer) {
      programMemoryAllocatedMb = Number((mem.buffer.byteLength / (1024 * 1024)).toFixed(2));
    }

    if (options.memoryLimitMb && programMemoryAllocatedMb > options.memoryLimitMb) {
      throw new Error(`MEMORY_LIMIT_EXCEEDED: Memory usage (${programMemoryAllocatedMb} MB) exceeded limit (${options.memoryLimitMb} MB)`);
    }

    self.postMessage({
      type: 'EXECUTION_DONE',
      runId,
      exitCode: typeof exitCode === 'number' ? exitCode : 0,
      durationMs,
      runtimeInitDurationMs,
      wasmLoadingDurationMs,
      programMemoryAllocatedMb,
    });
  } catch (err: any) {
    const durationMs = execStartTime > 0 ? performance.now() - execStartTime : 0;
    const msg = err?.message || String(err);

    if (msg.includes('OUTPUT_LIMIT_EXCEEDED')) {
      self.postMessage({
        type: 'EXECUTION_ERROR',
        runId,
        errorType: 'output_limit_exceeded',
        message: 'Execution stopped: Output Limit Exceeded (1 MB limit reached).',
        durationMs,
        runtimeInitDurationMs,
        wasmLoadingDurationMs,
        programMemoryAllocatedMb,
      });
    } else if (
      msg.includes('MEMORY_LIMIT_EXCEEDED') ||
      msg.includes('memory') ||
      msg.includes('allocation') ||
      msg.includes('out of bounds') ||
      msg.includes('Cannot allocate')
    ) {
      self.postMessage({
        type: 'EXECUTION_ERROR',
        runId,
        errorType: 'memory_limit_exceeded',
        message: `Execution stopped: Program memory requirement exceeds configured WASM memory limit (${msg}).`,
        durationMs,
        runtimeInitDurationMs,
        wasmLoadingDurationMs,
        programMemoryAllocatedMb,
      });
    } else if (msg.includes('call stack') || msg.includes('recursion') || msg.includes('maximum call stack')) {
      self.postMessage({
        type: 'EXECUTION_ERROR',
        runId,
        errorType: 'runtime_error',
        message: 'Execution stopped: Runtime Error (Stack Overflow / Infinite Recursion).',
        durationMs,
        runtimeInitDurationMs,
        wasmLoadingDurationMs,
        programMemoryAllocatedMb,
      });
    } else {
      self.postMessage({
        type: 'EXECUTION_ERROR',
        runId,
        errorType: 'runtime_error',
        message: `Runtime Error: ${msg}`,
        durationMs,
        runtimeInitDurationMs,
        wasmLoadingDurationMs,
        programMemoryAllocatedMb,
      });
    }
  }
};
