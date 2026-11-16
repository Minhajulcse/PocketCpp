import React, { useState } from 'react';
import { Copy, Trash2, CheckCircle2, AlertTriangle, XCircle, Clock, Terminal, Activity } from 'lucide-react';
import { ExecutionStatus, Diagnostic } from '../../compiler/types';

export type OutputTab = 'stdout' | 'stderr' | 'compile' | 'info';

interface OutputPanelProps {
  status: ExecutionStatus;
  stdout: string;
  stderr: string;
  compileOutput: string;
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
  exitCode: number | null;
  errorMessage?: string;
  onClear: () => void;
  onJumpToLine?: (line: number, col: number) => void;
}

export const OutputPanel: React.FC<OutputPanelProps> = ({
  status,
  stdout,
  stderr,
  compileOutput,
  diagnostics,
  executionDurationMs,
  compilationDurationMs,
  compilerInitDurationMs,
  runtimeInitDurationMs,
  sourceCompilationDurationMs,
  linkingDurationMs,
  wasmLoadingDurationMs,
  wasmInitialMemoryMb,
  wasmMaxMemoryMb,
  programMemoryAllocatedMb,
  globalDataSizeBytes,
  wasmBinarySizeBytes,
  exitCode,
  errorMessage,
  onClear,
  onJumpToLine,
}) => {
  const [activeTab, setActiveTab] = useState<OutputTab>('stdout');

  const handleCopy = async () => {
    let textToCopy = stdout;
    if (activeTab === 'stderr') textToCopy = stderr;
    else if (activeTab === 'compile') textToCopy = compileOutput;
    else if (activeTab === 'info') {
      textToCopy = [
        `Status: ${status}`,
        `Exit Code: ${exitCode !== null ? exitCode : 'N/A'}`,
        `Program Execution: ${(executionDurationMs / 1000).toFixed(3)}s`,
        `Total Compilation: ${(compilationDurationMs / 1000).toFixed(3)}s`,
        sourceCompilationDurationMs !== undefined ? `Source Compilation: ${(sourceCompilationDurationMs / 1000).toFixed(3)}s` : null,
        linkingDurationMs !== undefined ? `Linking: ${(linkingDurationMs / 1000).toFixed(3)}s` : null,
        wasmLoadingDurationMs !== undefined ? `WASM Module Loading: ${(wasmLoadingDurationMs / 1000).toFixed(3)}s` : null,
        runtimeInitDurationMs !== undefined ? `Runtime Init: ${(runtimeInitDurationMs / 1000).toFixed(3)}s` : null,
        wasmInitialMemoryMb !== undefined ? `WASM Initial Memory: ${wasmInitialMemoryMb} MB` : null,
        wasmMaxMemoryMb !== undefined ? `WASM Max Memory: ${wasmMaxMemoryMb ? `${wasmMaxMemoryMb} MB` : 'Dynamic'}` : null,
        programMemoryAllocatedMb !== undefined ? `Program Memory Allocation: ${programMemoryAllocatedMb} MB` : null,
        globalDataSizeBytes !== undefined ? `Global Data / BSS Size: ${(globalDataSizeBytes / 1024).toFixed(1)} KB` : null,
        wasmBinarySizeBytes !== undefined ? `WASM Binary Size: ${(wasmBinarySizeBytes / 1024).toFixed(1)} KB` : null,
      ].filter(Boolean).join('\n');
    }
    try {
      await navigator.clipboard.writeText(textToCopy);
    } catch {
      // Ignored
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'initializing':
        return (
          <span className="flex items-center gap-1 text-[11px] text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
            <Activity className="w-3 h-3 animate-spin" />
            Initializing Compiler...
          </span>
        );
      case 'compiling':
        return (
          <span className="flex items-center gap-1 text-[11px] text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
            <Activity className="w-3 h-3 animate-spin" />
            Compiling...
          </span>
        );
      case 'linking':
        return (
          <span className="flex items-center gap-1 text-[11px] text-purple-400 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-800/40">
            <Activity className="w-3 h-3 animate-spin" />
            Linking...
          </span>
        );
      case 'running':
        return (
          <span className="flex items-center gap-1 text-[11px] text-blue-400 bg-blue-950/40 px-2 py-0.5 rounded border border-blue-800/40">
            <Activity className="w-3 h-3 animate-spin" />
            Running...
          </span>
        );
      case 'completed':
        return (
          <span className="flex items-center gap-1 text-[11px] text-ide-success bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
            <CheckCircle2 className="w-3 h-3" />
            Completed ({(executionDurationMs / 1000).toFixed(2)}s)
          </span>
        );
      case 'compilation_timeout':
        return (
          <span className="flex items-center gap-1 text-[11px] text-red-400 bg-red-950/40 px-2 py-0.5 rounded border border-red-800/40 font-semibold animate-pulse">
            <Clock className="w-3 h-3" />
            Compilation Timeout
          </span>
        );
      case 'time_limit_exceeded':
        return (
          <span className="flex items-center gap-1 text-[11px] text-red-400 bg-red-950/40 px-2 py-0.5 rounded border border-red-800/40 font-semibold animate-pulse">
            <Clock className="w-3 h-3" />
            Execution Time Limit Exceeded
          </span>
        );
      case 'output_limit_exceeded':
        return (
          <span className="flex items-center gap-1 text-[11px] text-red-400 bg-red-950/40 px-2 py-0.5 rounded border border-red-800/40 font-semibold">
            <AlertTriangle className="w-3 h-3" />
            Output Limit Exceeded
          </span>
        );
      case 'memory_limit_exceeded':
        return (
          <span className="flex items-center gap-1 text-[11px] text-red-400 bg-red-950/40 px-2 py-0.5 rounded border border-red-800/40 font-semibold">
            <AlertTriangle className="w-3 h-3" />
            Memory Limit Exceeded
          </span>
        );
      case 'runtime_error':
        return (
          <span className="flex items-center gap-1 text-[11px] text-red-400 bg-red-950/40 px-2 py-0.5 rounded border border-red-800/40">
            <XCircle className="w-3 h-3" />
            Runtime Error
          </span>
        );
      case 'compilation_error':
        return (
          <span className="flex items-center gap-1 text-[11px] text-red-400 bg-red-950/40 px-2 py-0.5 rounded border border-red-800/40">
            <XCircle className="w-3 h-3" />
            Compilation Error
          </span>
        );
      case 'stopped':
        return (
          <span className="flex items-center gap-1 text-[11px] text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
            Stopped
          </span>
        );
      default:
        return null;
    }
  };

  const currentContent = activeTab === 'stdout' ? stdout : activeTab === 'stderr' ? stderr : compileOutput;
  const lines = currentContent ? currentContent.split('\n') : [];

  return (
    <div className="flex flex-col h-full bg-ide-panel border border-ide-border rounded-none overflow-hidden">
      {/* Tab Header */}
      <div className="flex items-center justify-between px-2 bg-ide-subpanel border-b border-ide-border select-none min-h-[36px]">
        {/* Tabs */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('stdout')}
            className={`px-3 py-1.5 text-xs font-medium rounded-t transition-colors relative ${
              activeTab === 'stdout'
                ? 'text-white bg-ide-panel border-t-2 border-ide-accent font-semibold'
                : 'text-ide-textMuted hover:text-white hover:bg-ide-hover'
            }`}
          >
            stdout
            {stdout && (
              <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-blue-500" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('stderr')}
            className={`px-3 py-1.5 text-xs font-medium rounded-t transition-colors relative ${
              activeTab === 'stderr'
                ? 'text-white bg-ide-panel border-t-2 border-ide-accent font-semibold'
                : 'text-ide-textMuted hover:text-white hover:bg-ide-hover'
            }`}
          >
            stderr
            {stderr && (
              <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-amber-500" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('compile')}
            className={`px-3 py-1.5 text-xs font-medium rounded-t transition-colors relative ${
              activeTab === 'compile'
                ? 'text-white bg-ide-panel border-t-2 border-ide-accent font-semibold'
                : 'text-ide-textMuted hover:text-white hover:bg-ide-hover'
            }`}
          >
            compile output
            {diagnostics.length > 0 && (
              <span className="ml-1.5 px-1 py-0.2 rounded-full text-[10px] bg-red-500/20 text-red-400 font-bold border border-red-500/40">
                {diagnostics.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`px-3 py-1.5 text-xs font-medium rounded-t transition-colors relative ${
              activeTab === 'info'
                ? 'text-white bg-ide-panel border-t-2 border-ide-accent font-semibold'
                : 'text-ide-textMuted hover:text-white hover:bg-ide-hover'
            }`}
          >
            info
          </button>
        </div>

        {/* Status & Actions */}
        <div className="flex items-center gap-2">
          {getStatusBadge()}
          <button
            type="button"
            onClick={handleCopy}
            title="Copy Output"
            className="p-1 rounded text-ide-textMuted hover:text-white hover:bg-ide-hover transition-colors min-w-[28px] min-h-[28px] flex items-center justify-center"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onClear}
            title="Clear Output"
            className="p-1 rounded text-ide-textMuted hover:text-ide-danger hover:bg-ide-hover transition-colors min-w-[28px] min-h-[28px] flex items-center justify-center"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Status Warning Banner for Failures */}
      {errorMessage && (
        <div
          className={`px-3 py-1.5 text-xs font-mono flex items-center gap-2 border-b ${
            status === 'time_limit_exceeded'
              ? 'bg-red-950/60 text-red-200 border-red-800'
              : status === 'output_limit_exceeded'
              ? 'bg-amber-950/60 text-amber-200 border-amber-800'
              : 'bg-red-950/40 text-red-300 border-red-900'
          }`}
        >
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span className="font-semibold">{errorMessage}</span>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto bg-ide-bg font-mono text-xs">
        {activeTab === 'info' ? (
          <div className="p-4 space-y-3 text-zinc-300">
            <div className="flex items-center gap-2 text-sm font-semibold text-white border-b border-ide-border pb-2">
              <Terminal className="w-4 h-4 text-blue-400" />
              <span>Execution Summary</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-zinc-500">Execution Status:</span>
                <p className="font-semibold text-white uppercase">{status}</p>
              </div>
              <div>
                <span className="text-zinc-500">Exit Code:</span>
                <p className="font-semibold text-white">{exitCode !== null ? exitCode : 'N/A'}</p>
              </div>
              <div>
                <span className="text-zinc-500">Program Execution:</span>
                <p className="font-semibold text-white">{(executionDurationMs / 1000).toFixed(3)} s</p>
              </div>
              <div>
                <span className="text-zinc-500">Source Compilation:</span>
                <p className="font-semibold text-white">
                  {sourceCompilationDurationMs !== undefined
                    ? `${(sourceCompilationDurationMs / 1000).toFixed(3)} s`
                    : `${(compilationDurationMs / 1000).toFixed(3)} s`}
                </p>
              </div>
              <div>
                <span className="text-zinc-500">Linking Duration:</span>
                <p className="font-semibold text-white">
                  {linkingDurationMs !== undefined ? `${(linkingDurationMs / 1000).toFixed(3)} s` : 'N/A'}
                </p>
              </div>
              <div>
                <span className="text-zinc-500">WASM Module Load:</span>
                <p className="font-semibold text-white">
                  {wasmLoadingDurationMs !== undefined ? `${(wasmLoadingDurationMs / 1000).toFixed(3)} s` : 'N/A'}
                </p>
              </div>
              <div>
                <span className="text-zinc-500">Runtime Init Time:</span>
                <p className="font-semibold text-white">
                  {runtimeInitDurationMs !== undefined ? `${(runtimeInitDurationMs / 1000).toFixed(3)} s` : 'N/A'}
                </p>
              </div>
              <div>
                <span className="text-zinc-500">WASM Initial Memory:</span>
                <p className="font-semibold text-white">
                  {wasmInitialMemoryMb !== undefined ? `${wasmInitialMemoryMb} MB` : '128 MB'}
                </p>
              </div>
              <div>
                <span className="text-zinc-500">WASM Max Memory:</span>
                <p className="font-semibold text-white">
                  {wasmMaxMemoryMb ? `${wasmMaxMemoryMb} MB` : '256 MB'}
                </p>
              </div>
              <div>
                <span className="text-zinc-500">Program Memory Allocated:</span>
                <p className="font-semibold text-white">
                  {programMemoryAllocatedMb !== undefined && programMemoryAllocatedMb > 0
                    ? `${programMemoryAllocatedMb} MB`
                    : wasmInitialMemoryMb ? `${wasmInitialMemoryMb} MB` : 'N/A'}
                </p>
              </div>
              <div>
                <span className="text-zinc-500">Global Data / BSS Size:</span>
                <p className="font-semibold text-white">
                  {globalDataSizeBytes !== undefined
                    ? `${(globalDataSizeBytes / 1024).toFixed(1)} KB (${(globalDataSizeBytes / (1024 * 1024)).toFixed(2)} MB)`
                    : 'N/A'}
                </p>
              </div>
              <div>
                <span className="text-zinc-500">WASM Binary Size:</span>
                <p className="font-semibold text-white">
                  {wasmBinarySizeBytes !== undefined
                    ? `${(wasmBinarySizeBytes / 1024).toFixed(1)} KB`
                    : 'N/A'}
                </p>
              </div>
            </div>
            {diagnostics.length > 0 && (
              <div className="mt-4 pt-3 border-t border-ide-border">
                <span className="text-zinc-500 block mb-2">Diagnostics Detected ({diagnostics.length}):</span>
                <div className="space-y-1">
                  {diagnostics.map((d, idx) => (
                    <div
                      key={idx}
                      onClick={() => onJumpToLine && onJumpToLine(d.line, d.col)}
                      className="p-2 rounded bg-ide-panel hover:bg-ide-hover border border-ide-border cursor-pointer transition-colors"
                    >
                      <span className={`font-bold mr-2 uppercase ${d.severity === 'error' ? 'text-red-400' : 'text-amber-400'}`}>
                        {d.severity}
                      </span>
                      <span className="text-zinc-400">Line {d.line}:{d.col}</span>
                      <p className="text-zinc-200 mt-1">{d.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-full">
            {/* Line Numbers */}
            <div className="w-9 py-2 bg-ide-subpanel text-right pr-2 text-zinc-600 select-none border-r border-ide-border flex-shrink-0">
              {lines.length > 0
                ? lines.map((_, i) => (
                    <div key={i} className="leading-5">
                      {i + 1}
                    </div>
                  ))
                : (
                    <div className="leading-5">1</div>
                  )}
            </div>

            {/* Output Lines */}
            <div className="flex-1 p-2 overflow-auto whitespace-pre leading-5 text-zinc-200">
              {lines.length > 0 ? (
                lines.map((line, i) => (
                  <div key={i} className="hover:bg-zinc-800/40 rounded px-1">
                    {line || '\u00A0'}
                  </div>
                ))
              ) : (
                <span className="text-zinc-600 italic">No output yet. Run your program to see output.</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
