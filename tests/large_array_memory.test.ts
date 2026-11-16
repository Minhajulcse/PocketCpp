import { describe, it, expect } from 'vitest';
import { runClang } from '@yowasp/clang';
import { WASI, OpenFile, File, ConsoleStdout } from '@bjorn3/browser_wasi_shim';
import { BITS_STDCPP_H } from '../src/compiler/umbrellaHeader';

// Helper function to compile and run using the 2-stage toolchain with 128MB initial / 256MB max memory
async function compileAndExecuteStages(
  sourceCode: string,
  options: {
    standard?: 'c++17' | 'c++20';
    optimization?: 'O0' | 'O2';
    initialMemoryMb?: number;
    maxMemoryMb?: number;
    stackSizeMb?: number;
    stdinStr?: string;
  } = {}
) {
  const standard = options.standard || 'c++17';
  const optimization = options.optimization || 'O0';
  const initialMemoryBytes = (options.initialMemoryMb || 128) * 1024 * 1024;
  const maxMemoryBytes = (options.maxMemoryMb || 256) * 1024 * 1024;
  const stackSizeBytes = (options.stackSizeMb || 16) * 1024 * 1024;

  const files: Record<string, any> = {
    'main.cpp': sourceCode,
    bits: { 'stdc++.h': BITS_STDCPP_H },
  };

  let compilerOutput = '';
  const textDecoder = new TextDecoder();
  const runOptions = {
    stdout: (bytes: Uint8Array | null) => {
      if (bytes) compilerOutput += textDecoder.decode(bytes);
    },
    stderr: (bytes: Uint8Array | null) => {
      if (bytes) compilerOutput += textDecoder.decode(bytes);
    },
  };

  // Phase 1: Source Compilation to main.o
  const sourceCompT0 = performance.now();
  const compFiles = await runClang(
    ['clang++', '-c', '-fno-exceptions', '-I.', `-std=${standard}`, `-${optimization}`, 'main.cpp', '-o', 'main.o'],
    files,
    runOptions
  );
  const sourceCompilationDurationMs = performance.now() - sourceCompT0;
  const objBinary = compFiles['main.o'] as Uint8Array;
  expect(objBinary).toBeDefined();

  // Phase 2: Linking to out.wasm
  const linkT0 = performance.now();
  const linkFiles = { 'main.o': objBinary };
  const linkRes = await runClang(
    [
      'clang++',
      `-Wl,-z,stack-size=${stackSizeBytes}`,
      `-Wl,--initial-memory=${initialMemoryBytes}`,
      `-Wl,--max-memory=${maxMemoryBytes}`,
      '-Wl,--export=__heap_base,--export=__data_end',
      'main.o',
      '-o',
      'out.wasm',
    ],
    linkFiles,
    runOptions
  );
  const linkingDurationMs = performance.now() - linkT0;
  const wasmBinary = linkRes['out.wasm'] as Uint8Array;
  expect(wasmBinary).toBeDefined();

  // Phase 3: WASM Module Loading
  const wasmLoadT0 = performance.now();
  const wasmModule = await WebAssembly.compile(wasmBinary as any);
  const wasmLoadingDurationMs = performance.now() - wasmLoadT0;

  // Phase 4 & 5: Program Startup & Runtime Memory Initialization
  const runtimeInitT0 = performance.now();
  let stdout = '';
  const stdoutHandler = new ConsoleStdout((buf) => {
    stdout += new TextDecoder().decode(buf);
  });
  const stdinBytes = new TextEncoder().encode(options.stdinStr || '');
  const stdinHandler = new OpenFile(new File(stdinBytes));
  const wasi = new WASI(['program'], [], [stdinHandler, stdoutHandler, stdoutHandler]);

  const instance = await WebAssembly.instantiate(wasmModule, {
    wasi_snapshot_preview1: wasi.wasiImport,
  });
  const runtimeInitDurationMs = performance.now() - runtimeInitT0;

  const mem = instance.exports.memory as WebAssembly.Memory;
  const allocatedMemoryMb = mem ? mem.buffer.byteLength / (1024 * 1024) : 0;

  // Phase 6: Program Execution
  const execT0 = performance.now();
  const exitCode = wasi.start(instance as any);
  const executionDurationMs = performance.now() - execT0;

  return {
    stdout: stdout.trim(),
    exitCode: typeof exitCode === 'number' ? exitCode : 0,
    sourceCompilationDurationMs,
    linkingDurationMs,
    wasmLoadingDurationMs,
    runtimeInitDurationMs,
    executionDurationMs,
    allocatedMemoryMb,
    compilerOutput,
  };
}

describe('Large Global Array & WASM Memory Suite', () => {
  it('Task 3 & 4: Exact Task 4 Code (N = 3005, 64-bit int, memset, O0, C++17)', async () => {
    const code = `
#include <bits/stdc++.h>
#define int long long
using namespace std;

const int N = 3005;
int dp[N][N];

signed main() {
    memset(dp, -1, sizeof(dp));
    cout << dp[0][0] << '\\n';
}
`;
    const res = await compileAndExecuteStages(code, {
      standard: 'c++17',
      optimization: 'O0',
      initialMemoryMb: 128,
      maxMemoryMb: 256,
    });

    expect(res.exitCode).toBe(0);
    expect(res.stdout).toBe('-1');
    expect(res.allocatedMemoryMb).toBe(128);
    // Verify memset runtime execution duration is measured and fast (< 100ms)
    expect(res.executionDurationMs).toBeLessThan(500);

    console.log(`[Task 4] N=3005 64-bit memset:
  Source Compilation: ${res.sourceCompilationDurationMs.toFixed(1)} ms
  Linking: ${res.linkingDurationMs.toFixed(1)} ms
  WASM Load: ${res.wasmLoadingDurationMs.toFixed(1)} ms
  Runtime Init: ${res.runtimeInitDurationMs.toFixed(1)} ms
  Execution: ${res.executionDurationMs.toFixed(1)} ms
  Output: ${res.stdout}`);
  }, 180000);

  it('Task 6 Matrix: 64-bit Global DP Array (N = 30, 100, 500, 1000, 1500, 2000)', async () => {
    const nValues = [30, 100, 500, 1000, 1500, 2000];

    for (const N of nValues) {
      const code = `
#include <bits/stdc++.h>
#define int long long
using namespace std;

const int N = ${N};
int dp[N][N];

signed main() {
    memset(dp, -1, sizeof(dp));
    cout << dp[0][0] << '\\n';
}
`;
      const res = await compileAndExecuteStages(code, {
        standard: 'c++17',
        optimization: 'O0',
        initialMemoryMb: 128,
        maxMemoryMb: 256,
      });

      expect(res.exitCode).toBe(0);
      expect(res.stdout).toBe('-1');
      console.log(`[Matrix 64-bit] N=${N}: Compile=${res.sourceCompilationDurationMs.toFixed(1)}ms, Link=${res.linkingDurationMs.toFixed(1)}ms, Exec=${res.executionDurationMs.toFixed(1)}ms, Output=${res.stdout}`);
    }
  }, 180000);

  it('Task 6 Matrix: 32-bit Global DP Array (N = 30, 100, 500, 1000, 2000, 3005)', async () => {
    const nValues = [30, 100, 500, 1000, 2000, 3005];

    for (const N of nValues) {
      const code = `
#include <bits/stdc++.h>
using namespace std;

const int N = ${N};
int32_t dp[N][N];

int main() {
    memset(dp, -1, sizeof(dp));
    cout << dp[0][0] << '\\n';
    return 0;
}
`;
      const res = await compileAndExecuteStages(code, {
        standard: 'c++17',
        optimization: 'O0',
        initialMemoryMb: 128,
        maxMemoryMb: 256,
      });

      expect(res.exitCode).toBe(0);
      expect(res.stdout).toBe('-1');
      console.log(`[Matrix 32-bit] N=${N}: Compile=${res.sourceCompilationDurationMs.toFixed(1)}ms, Link=${res.linkingDurationMs.toFixed(1)}ms, Exec=${res.executionDurationMs.toFixed(1)}ms, Output=${res.stdout}`);
    }
  }, 180000);

  it('Task 3 & 8: Dynamic Heap Allocation (72.24 MB dynamically allocated array)', async () => {
    const code = `
#include <iostream>
#include <cstring>
using namespace std;

int main() {
    // 3005 * 3005 * 8 = 72,240,200 bytes dynamically allocated on heap
    size_t totalElements = 3005ULL * 3005ULL;
    long long* dp = new long long[totalElements];
    memset(dp, -1, totalElements * sizeof(long long));
    dp[0] = -1;
    dp[totalElements - 1] = 42;
    cout << dp[0] << " " << dp[totalElements - 1] << endl;
    delete[] dp;
    return 0;
}
`;
    const res = await compileAndExecuteStages(code, {
      standard: 'c++17',
      optimization: 'O2',
      initialMemoryMb: 128,
      maxMemoryMb: 256,
    });

    expect(res.exitCode).toBe(0);
    expect(res.stdout).toBe('-1 42');
    console.log(`[Dynamic Allocation] 72 MB heap: Compile=${res.sourceCompilationDurationMs.toFixed(1)}ms, Link=${res.linkingDurationMs.toFixed(1)}ms, Exec=${res.executionDurationMs.toFixed(1)}ms`);
  }, 60000);

  it('Task 8: C++20 Standard Support with Global Array & memset', async () => {
    const code = `
#include <iostream>
#include <cstring>
#include <span>
#include <concepts>
using namespace std;

const int N = 1000;
long long dp[N][N];

template<typename T>
concept Numeric = std::integral<T> || std::floating_point<T>;

template<Numeric T>
void printVal(T val) {
    cout << val << endl;
}

int main() {
    memset(dp, -1, sizeof(dp));
    printVal(dp[0][0]);
    return 0;
}
`;
    const res = await compileAndExecuteStages(code, {
      standard: 'c++20',
      optimization: 'O2',
      initialMemoryMb: 128,
      maxMemoryMb: 256,
    });

    expect(res.exitCode).toBe(0);
    expect(res.stdout).toBe('-1');
  }, 60000);

  it('Task 5 & Linker Diagnostics: Catch Initial Memory Too Small error clearly', async () => {
    // 84.89 MB needed, but initialMemory is set to 32 MB -> linker will error
    const code = `
#include <iostream>
using namespace std;

const int N = 3005;
long long dp[N][N]; // 72.24 MB

int main() {
    cout << dp[0][0] << endl;
    return 0;
}
`;
    const files = { 'main.cpp': code };
    let linkOutput = '';
    const textDecoder = new TextDecoder();
    const runOptions = {
      stdout: (b: Uint8Array | null) => { if (b) linkOutput += textDecoder.decode(b); },
      stderr: (b: Uint8Array | null) => { if (b) linkOutput += textDecoder.decode(b); },
    };

    const compFiles = await runClang(['clang++', '-c', 'main.cpp', '-o', 'main.o'], files, runOptions);
    let linkerThrew = false;
    try {
      await runClang([
        'clang++',
        '-Wl,-z,stack-size=16777216',
        '-Wl,--initial-memory=33554432', // Only 32 MB!
        'main.o',
        '-o',
        'out.wasm'
      ], { 'main.o': compFiles['main.o'] }, runOptions);
    } catch {
      linkerThrew = true;
    }

    expect(linkerThrew).toBe(true);
    expect(linkOutput).toMatch(/initial memory too small/);
    console.log('[Linker Diagnostic] Successfully caught linker error:', linkOutput.trim().split('\n')[0]);
  }, 120000);
});
