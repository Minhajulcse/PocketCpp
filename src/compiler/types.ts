export type ExecutionStatus =
  | 'idle'
  | 'initializing'
  | 'compiling'
  | 'linking'
  | 'running'
  | 'completed'
  | 'compilation_error'
  | 'compilation_timeout'
  | 'runtime_error'
  | 'time_limit_exceeded'
  | 'output_limit_exceeded'
  | 'memory_limit_exceeded'
  | 'stopped'
  | 'offline_not_ready';

export interface Diagnostic {
  file: string;
  line: number;
  col: number;
  severity: 'error' | 'warning' | 'note';
  message: string;
  raw: string;
}

export interface CompilerOptions {
  language: 'c' | 'cpp';
  standard: 'c11' | 'c17' | 'c++17' | 'c++20' | 'gnu++17';
  optimization: 'O0' | 'O1' | 'O2' | 'O3' | 'Os';
  warnings: boolean;
  extraFlags?: string[];
  compileTimeoutMs?: number; // e.g. 180000ms
  initialMemoryMb?: number; // e.g. 128MB (2048 pages)
  maxMemoryMb?: number; // e.g. 256MB (4096 pages)
  stackSizeMb?: number; // e.g. 16MB (256 pages)
}

export interface ExecutionOptions {
  timeLimitMs: number; // e.g. 5000ms
  memoryLimitMb: number; // e.g. 256MB
  outputLimitBytes: number; // e.g. 1MB (1048576)
  stdin: string;
}

export interface ExecutionResult {
  runId: string;
  status: ExecutionStatus;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  compilationOutput: string;
  diagnostics: Diagnostic[];
  executionDurationMs: number;
  compilationDurationMs: number;
  compilerInitDurationMs?: number;
  runtimeInitDurationMs?: number;
  sourceCompilationDurationMs?: number;
  linkingDurationMs?: number;
  wasmLoadingDurationMs?: number;
  wasmInitialMemoryMb?: number;
  wasmMaxMemoryMb?: number | null;
  programMemoryAllocatedMb?: number;
  globalDataSizeBytes?: number;
  wasmBinarySizeBytes?: number;
  outputTruncated: boolean;
  errorMessage?: string;
}

// Compiler Worker Messages
export type CompilerWorkerRequest =
  | {
      type: 'COMPILE';
      runId: string;
      sourceName: string;
      sourceCode: string;
      additionalFiles?: Record<string, string>;
      options: CompilerOptions;
    }
  | {
      type: 'PRELOAD';
    };

export type CompilerWorkerResponse =
  | {
      type: 'COMPILE_STAGE';
      runId: string;
      stage: 'initializing' | 'compiling' | 'linking';
    }
  | {
      type: 'COMPILE_PROGRESS';
      runId: string;
      progress: { doneLength: number; totalLength: number; percent: number };
    }
  | {
      type: 'COMPILE_SUCCESS';
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
    }
  | {
      type: 'COMPILE_ERROR';
      runId: string;
      diagnostics: Diagnostic[];
      output: string;
      durationMs: number;
      compilerInitDurationMs?: number;
      sourceCompilationDurationMs?: number;
      linkingDurationMs?: number;
      errorMessage: string;
    }
  | {
      type: 'PRELOAD_SUCCESS';
    };

// Execution Worker Messages
export type ExecutionWorkerRequest = {
  type: 'EXECUTE';
  runId: string;
  wasmBinary: Uint8Array;
  options: ExecutionOptions;
};

export type ExecutionWorkerResponse =
  | {
      type: 'EXECUTION_STARTED';
      runId: string;
      runtimeInitDurationMs: number;
      wasmLoadingDurationMs?: number;
      programMemoryAllocatedMb?: number;
    }
  | {
      type: 'STDOUT';
      runId: string;
      chunk: string;
    }
  | {
      type: 'STDERR';
      runId: string;
      chunk: string;
    }
  | {
      type: 'EXECUTION_DONE';
      runId: string;
      exitCode: number;
      durationMs: number;
      runtimeInitDurationMs?: number;
      wasmLoadingDurationMs?: number;
      programMemoryAllocatedMb?: number;
    }
  | {
      type: 'EXECUTION_ERROR';
      runId: string;
      errorType: 'runtime_error' | 'output_limit_exceeded' | 'memory_limit_exceeded';
      message: string;
      durationMs: number;
      runtimeInitDurationMs?: number;
      wasmLoadingDurationMs?: number;
      programMemoryAllocatedMb?: number;
    };
