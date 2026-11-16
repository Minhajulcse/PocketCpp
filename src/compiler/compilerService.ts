import {
  CompilerOptions,
  ExecutionOptions,
  ExecutionResult,
  ExecutionStatus,
  CompilerWorkerRequest,
  CompilerWorkerResponse,
  ExecutionWorkerRequest,
  ExecutionWorkerResponse,
  Diagnostic,
} from './types';

export class CompilerService {
  private compilerWorker: Worker | null = null;
  private executionWorker: Worker | null = null;
  private currentRunId: string | null = null;
  private compileTimeoutTimer: any = null;
  private workerStartupTimer: any = null;
  private executionTimeoutTimer: any = null;
  private isCompiling = false;
  private isExecuting = false;

  private onStatusChangeCallback: ((status: ExecutionStatus) => void) | null = null;
  private onStdoutCallback: ((chunk: string) => void) | null = null;
  private onStderrCallback: ((chunk: string) => void) | null = null;
  private onProgressCallback: ((progress: { percent: number; done: number; total: number }) => void) | null = null;

  public setCallbacks(callbacks: {
    onStatusChange?: (status: ExecutionStatus) => void;
    onStdout?: (chunk: string) => void;
    onStderr?: (chunk: string) => void;
    onProgress?: (progress: { percent: number; done: number; total: number }) => void;
  }) {
    if (callbacks.onStatusChange) this.onStatusChangeCallback = callbacks.onStatusChange;
    if (callbacks.onStdout) this.onStdoutCallback = callbacks.onStdout;
    if (callbacks.onStderr) this.onStderrCallback = callbacks.onStderr;
    if (callbacks.onProgress) this.onProgressCallback = callbacks.onProgress;
  }

  private setStatus(status: ExecutionStatus) {
    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback(status);
    }
  }

  private getOrCreateCompilerWorker(): Worker {
    if (!this.compilerWorker) {
      const worker = new Worker(new URL('./compiler.worker.ts', import.meta.url), {
        type: 'module',
      });
      this.compilerWorker = worker;
    }
    return this.compilerWorker;
  }

  /**
   * Preloads the compiler in the background so subsequent compilations are instant.
   */
  public preloadCompiler(): void {
    try {
      const worker = this.getOrCreateCompilerWorker();
      worker.postMessage({ type: 'PRELOAD' });
    } catch {
      // Ignored
    }
  }

  private initExecutionWorker(): Worker {
    if (this.executionWorker) {
      this.executionWorker.terminate();
      this.executionWorker = null;
    }
    const worker = new Worker(new URL('./execution.worker.ts', import.meta.url), {
      type: 'module',
    });
    this.executionWorker = worker;
    return worker;
  }

  public stop(): void {
    this.clearTimers();

    if (this.executionWorker) {
      this.executionWorker.terminate();
      this.executionWorker = null;
    }
    if (this.compilerWorker && this.isCompiling) {
      this.compilerWorker.terminate();
      this.compilerWorker = null;
    }

    this.isCompiling = false;
    this.isExecuting = false;
    this.currentRunId = null;

    this.setStatus('stopped');
  }

  private clearTimers() {
    if (this.compileTimeoutTimer) {
      clearTimeout(this.compileTimeoutTimer);
      this.compileTimeoutTimer = null;
    }
    if (this.workerStartupTimer) {
      clearTimeout(this.workerStartupTimer);
      this.workerStartupTimer = null;
    }
    if (this.executionTimeoutTimer) {
      clearTimeout(this.executionTimeoutTimer);
      this.executionTimeoutTimer = null;
    }
  }

  /**
   * Detects massive static buffers (e.g. 2D DP arrays >= 1M elements) in C++ source
   * to automatically scale the compilation watchdog timeout so legitimate code doesn't falsely time out.
   */
  private hasLargeStaticBuffer(sourceCode: string): boolean {
    const constMap = new Map<string, number>();
    const constRegex = /(?:const\s+(?:int|size_t|long(?:\s+long)?)|#define)\s+([a-zA-Z_]\w*)\s*=?\s*(\d+)/g;
    let match: RegExpExecArray | null;
    while ((match = constRegex.exec(sourceCode)) !== null) {
      constMap.set(match[1], parseInt(match[2], 10));
    }

    const arr2DRegex = /(?:int|long|double|float|bool|char|int32_t|int64_t|signed)\s+[a-zA-Z_]\w*\s*\[\s*([a-zA-Z_]\w*|\d+)\s*\]\s*\[\s*([a-zA-Z_]\w*|\d+)\s*\]/g;
    while ((match = arr2DRegex.exec(sourceCode)) !== null) {
      const d1 = constMap.get(match[1]) || parseInt(match[1], 10);
      const d2 = constMap.get(match[2]) || parseInt(match[2], 10);
      if (d1 && d2 && d1 * d2 >= 1000000) return true;
    }

    const arr1DRegex = /(?:int|long|double|float|bool|char|int32_t|int64_t|signed)\s+[a-zA-Z_]\w*\s*\[\s*([a-zA-Z_]\w*|\d+)\s*\]/g;
    while ((match = arr1DRegex.exec(sourceCode)) !== null) {
      const d = constMap.get(match[1]) || parseInt(match[1], 10);
      if (d && d >= 1000000) return true;
    }

    return false;
  }

  /**
   * Compiles source code in a dedicated web worker (reusing warm worker instance)
   */
  public compile(
    sourceName: string,
    sourceCode: string,
    compilerOptions: CompilerOptions,
    additionalFiles?: Record<string, string>
  ): Promise<{
    runId: string;
    wasmBinary: Uint8Array;
    diagnostics: Diagnostic[];
    output: string;
    durationMs: number;
    compilerInitDurationMs?: number;
    sourceCompilationDurationMs?: number;
    linkingDurationMs?: number;
    wasmInitialMemoryMb?: number;
    wasmMaxMemoryMb?: number | null;
    globalDataSizeBytes?: number;
    wasmBinarySizeBytes?: number;
  }> {
    const runId = 'compile-' + Math.random().toString(36).substring(2, 9);
    this.currentRunId = runId;
    this.isCompiling = true;
    this.setStatus('compiling');

    const baseTimeoutMs = compilerOptions.compileTimeoutMs || 180000;
    let timeoutMs = baseTimeoutMs;
    if (this.hasLargeStaticBuffer(sourceCode)) {
      timeoutMs = Math.max(timeoutMs, 300000);
    }

    const worker = this.getOrCreateCompilerWorker();

    return new Promise((resolve, reject) => {
      // Compilation watchdog timer: hard terminates worker if compilation hangs
      this.compileTimeoutTimer = setTimeout(() => {
        if (this.currentRunId !== runId) return;
        this.clearTimers();
        if (this.compilerWorker) {
          this.compilerWorker.terminate();
          this.compilerWorker = null;
        }
        this.isCompiling = false;
        this.setStatus('compilation_timeout');
        reject(new Error(`Compilation timed out after ${timeoutMs / 1000}s (compiler timeout). Source compilation and linking took longer than allowed.`));
      }, timeoutMs);

      worker.onmessage = (e: MessageEvent<CompilerWorkerResponse>) => {
        const res = e.data;
        if ('runId' in res && res.runId !== runId) return; // Stale run from previous execution

        if (res.type === 'COMPILE_STAGE') {
          if (res.stage === 'initializing') {
            this.setStatus('initializing');
          } else if (res.stage === 'compiling') {
            this.setStatus('compiling');
          } else if (res.stage === 'linking') {
            this.setStatus('linking');
          }
          return;
        }

        if (res.type === 'COMPILE_PROGRESS') {
          if (this.onProgressCallback) {
            this.onProgressCallback({
              percent: res.progress.percent,
              done: res.progress.doneLength,
              total: res.progress.totalLength,
            });
          }
          return;
        }

        this.clearTimers();
        this.isCompiling = false;

        if (res.type === 'COMPILE_SUCCESS') {
          resolve({
            runId,
            wasmBinary: res.wasmBinary,
            diagnostics: res.diagnostics,
            output: res.output,
            durationMs: res.durationMs,
            compilerInitDurationMs: res.compilerInitDurationMs,
            sourceCompilationDurationMs: res.sourceCompilationDurationMs,
            linkingDurationMs: res.linkingDurationMs,
            wasmInitialMemoryMb: res.wasmInitialMemoryMb,
            wasmMaxMemoryMb: res.wasmMaxMemoryMb,
            globalDataSizeBytes: res.globalDataSizeBytes,
            wasmBinarySizeBytes: res.wasmBinarySizeBytes,
          });
        } else if (res.type === 'COMPILE_ERROR') {
          this.setStatus('compilation_error');
          const err = new Error(res.errorMessage || 'Compilation Error') as any;
          err.diagnostics = res.diagnostics;
          err.output = res.output;
          err.durationMs = res.durationMs;
          err.compilerInitDurationMs = res.compilerInitDurationMs;
          err.sourceCompilationDurationMs = res.sourceCompilationDurationMs;
          err.linkingDurationMs = res.linkingDurationMs;
          reject(err);
        }
      };

      worker.onerror = (err) => {
        if (this.currentRunId !== runId) return;
        this.clearTimers();
        if (this.compilerWorker) {
          this.compilerWorker.terminate();
          this.compilerWorker = null;
        }
        this.isCompiling = false;
        this.setStatus('compilation_error');
        reject(new Error(`Compiler worker error: ${err.message}`));
      };

      const req: CompilerWorkerRequest = {
        type: 'COMPILE',
        runId,
        sourceName,
        sourceCode,
        additionalFiles,
        options: compilerOptions,
      };

      worker.postMessage(req);
    });
  }

  /**
   * Executes compiled WebAssembly in a fresh, dedicated execution worker
   * with independent watchdog timeout that starts strictly when execution begins.
   */
  public execute(
    wasmBinary: Uint8Array,
    executionOptions: ExecutionOptions
  ): Promise<ExecutionResult> {
    const runId = 'exec-' + Math.random().toString(36).substring(2, 9);
    this.currentRunId = runId;
    this.isExecuting = true;
    this.setStatus('running');

    const timeLimitMs = executionOptions.timeLimitMs || 5000;
    const worker = this.initExecutionWorker();

    let fullStdout = '';
    let fullStderr = '';
    let actualExecStartTime = 0;
    let runtimeInitDurationMs = 0;
    let wasmLoadingDurationMs = 0;
    let programMemoryAllocatedMb = 0;

    return new Promise((resolve) => {
      // 1. Worker Startup Watchdog (15s): guards against worker script load / WebAssembly compile hangs
      this.workerStartupTimer = setTimeout(() => {
        if (this.currentRunId !== runId) return;
        this.clearTimers();

        if (this.executionWorker) {
          this.executionWorker.terminate();
          this.executionWorker = null;
        }

        this.isExecuting = false;
        this.setStatus('runtime_error');
        resolve({
          runId,
          status: 'runtime_error',
          exitCode: null,
          stdout: fullStdout,
          stderr: fullStderr,
          compilationOutput: '',
          diagnostics: [],
          executionDurationMs: 0,
          compilationDurationMs: 0,
          runtimeInitDurationMs,
          wasmLoadingDurationMs,
          programMemoryAllocatedMb,
          outputTruncated: false,
          errorMessage: 'Runtime Error: Worker initialization or WebAssembly instantiation timed out.',
        });
      }, 15000);

      worker.onmessage = (e: MessageEvent<ExecutionWorkerResponse>) => {
        const res = e.data;
        if (res.runId !== runId) return; // Stale message from terminated worker

        // 2. Program Execution Begins: received EXECUTION_STARTED
        if (res.type === 'EXECUTION_STARTED') {
          // Cancel startup watchdog
          if (this.workerStartupTimer) {
            clearTimeout(this.workerStartupTimer);
            this.workerStartupTimer = null;
          }

          runtimeInitDurationMs = res.runtimeInitDurationMs;
          wasmLoadingDurationMs = res.wasmLoadingDurationMs || 0;
          programMemoryAllocatedMb = res.programMemoryAllocatedMb || 0;
          actualExecStartTime = performance.now();

          // START the true Program Execution Watchdog timer now!
          this.executionTimeoutTimer = setTimeout(() => {
            if (this.currentRunId !== runId) return;
            this.clearTimers();

            // HARD TERMINATE the worker immediately
            if (this.executionWorker) {
              this.executionWorker.terminate();
              this.executionWorker = null;
            }

            this.isExecuting = false;
            const durationMs = actualExecStartTime > 0 ? performance.now() - actualExecStartTime : timeLimitMs;
            this.setStatus('time_limit_exceeded');

            resolve({
              runId,
              status: 'time_limit_exceeded',
              exitCode: null,
              stdout: fullStdout,
              stderr: fullStderr,
              compilationOutput: '',
              diagnostics: [],
              executionDurationMs: durationMs,
              compilationDurationMs: 0,
              runtimeInitDurationMs,
              wasmLoadingDurationMs,
              programMemoryAllocatedMb,
              outputTruncated: false,
              errorMessage: `Execution stopped: Time Limit Exceeded (${timeLimitMs / 1000}s limit). Program exceeded the maximum allowed runtime.`,
            });
          }, timeLimitMs);

          return;
        }

        if (res.type === 'STDOUT') {
          fullStdout += res.chunk;
          if (this.onStdoutCallback) this.onStdoutCallback(res.chunk);
          return;
        }

        if (res.type === 'STDERR') {
          fullStderr += res.chunk;
          if (this.onStderrCallback) this.onStderrCallback(res.chunk);
          return;
        }

        this.clearTimers();
        this.isExecuting = false;

        // Discard worker
        if (this.executionWorker) {
          this.executionWorker.terminate();
          this.executionWorker = null;
        }

        if (res.type === 'EXECUTION_DONE') {
          this.setStatus('completed');
          resolve({
            runId,
            status: 'completed',
            exitCode: res.exitCode,
            stdout: fullStdout,
            stderr: fullStderr,
            compilationOutput: '',
            diagnostics: [],
            executionDurationMs: res.durationMs,
            compilationDurationMs: 0,
            runtimeInitDurationMs: res.runtimeInitDurationMs ?? runtimeInitDurationMs,
            wasmLoadingDurationMs: res.wasmLoadingDurationMs ?? wasmLoadingDurationMs,
            programMemoryAllocatedMb: res.programMemoryAllocatedMb ?? programMemoryAllocatedMb,
            outputTruncated: false,
          });
        } else if (res.type === 'EXECUTION_ERROR') {
          this.setStatus(res.errorType);
          resolve({
            runId,
            status: res.errorType,
            exitCode: null,
            stdout: fullStdout,
            stderr: fullStderr,
            compilationOutput: '',
            diagnostics: [],
            executionDurationMs: res.durationMs,
            compilationDurationMs: 0,
            runtimeInitDurationMs: res.runtimeInitDurationMs ?? runtimeInitDurationMs,
            wasmLoadingDurationMs: res.wasmLoadingDurationMs ?? wasmLoadingDurationMs,
            programMemoryAllocatedMb: res.programMemoryAllocatedMb ?? programMemoryAllocatedMb,
            outputTruncated: res.errorType === 'output_limit_exceeded',
            errorMessage: res.message,
          });
        }
      };

      worker.onerror = (err) => {
        if (this.currentRunId !== runId) return;
        this.clearTimers();
        this.isExecuting = false;

        if (this.executionWorker) {
          this.executionWorker.terminate();
          this.executionWorker = null;
        }

        const durationMs = actualExecStartTime > 0 ? performance.now() - actualExecStartTime : 0;
        this.setStatus('runtime_error');
        resolve({
          runId,
          status: 'runtime_error',
          exitCode: null,
          stdout: fullStdout,
          stderr: fullStderr,
          compilationOutput: '',
          diagnostics: [],
          executionDurationMs: durationMs,
          compilationDurationMs: 0,
          runtimeInitDurationMs,
          wasmLoadingDurationMs,
          programMemoryAllocatedMb,
          outputTruncated: false,
          errorMessage: `Runtime Trap / Worker Crash: ${err.message}`,
        });
      };

      const req: ExecutionWorkerRequest = {
        type: 'EXECUTE',
        runId,
        wasmBinary,
        options: executionOptions,
      };

      worker.postMessage(req);
    });
  }

  /**
   * Helper: Compiles and runs in a single pipeline
   */
  public async compileAndRun(
    sourceName: string,
    sourceCode: string,
    compilerOptions: CompilerOptions,
    executionOptions: ExecutionOptions,
    additionalFiles?: Record<string, string>
  ): Promise<ExecutionResult> {
    try {
      const compileRes = await this.compile(sourceName, sourceCode, compilerOptions, additionalFiles);
      const execRes = await this.execute(compileRes.wasmBinary, executionOptions);
      return {
        ...execRes,
        compilationOutput: compileRes.output,
        diagnostics: compileRes.diagnostics,
        compilationDurationMs: compileRes.durationMs,
        compilerInitDurationMs: compileRes.compilerInitDurationMs,
        sourceCompilationDurationMs: compileRes.sourceCompilationDurationMs,
        linkingDurationMs: compileRes.linkingDurationMs,
        wasmInitialMemoryMb: compileRes.wasmInitialMemoryMb,
        wasmMaxMemoryMb: compileRes.wasmMaxMemoryMb,
        globalDataSizeBytes: compileRes.globalDataSizeBytes,
        wasmBinarySizeBytes: compileRes.wasmBinarySizeBytes,
      };
    } catch (err: any) {
      this.clearTimers();
      this.isCompiling = false;
      this.isExecuting = false;
      const status: ExecutionStatus = err?.message?.includes('Compilation timed out')
        ? 'compilation_timeout'
        : 'compilation_error';
      this.setStatus(status);
      return {
        runId: this.currentRunId || 'error',
        status,
        exitCode: null,
        stdout: '',
        stderr: '',
        compilationOutput: err?.output || err?.message || 'Compilation Error',
        diagnostics: err?.diagnostics || [],
        executionDurationMs: 0,
        compilationDurationMs: err?.durationMs || 0,
        compilerInitDurationMs: err?.compilerInitDurationMs || 0,
        sourceCompilationDurationMs: err?.sourceCompilationDurationMs,
        linkingDurationMs: err?.linkingDurationMs,
        runtimeInitDurationMs: 0,
        wasmLoadingDurationMs: 0,
        outputTruncated: false,
        errorMessage: err?.message || 'Compilation failed',
      };
    }
  }
}

export const compilerService = new CompilerService();
