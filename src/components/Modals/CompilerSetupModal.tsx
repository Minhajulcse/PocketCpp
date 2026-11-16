import React, { useState } from 'react';
import { X, Download, CheckCircle2, AlertCircle, RefreshCw, HardDrive, Cpu, Play } from 'lucide-react';
import { cacheCompilerAssets, CacheProgress } from '../../services/compilerCache';

interface CompilerSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  isCached: boolean;
  onCompilerReady: () => void;
  storageInfo?: { quotaMb: number; usageMb: number; percent: number; isPersistent: boolean };
}

export const CompilerSetupModal: React.FC<CompilerSetupModalProps> = ({
  isOpen,
  onClose,
  isCached,
  onCompilerReady,
  storageInfo,
}) => {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState<CacheProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  if (!isOpen) return null;

  const handleDownload = async () => {
    setDownloading(true);
    setError(null);
    setTestResult(null);

    try {
      await cacheCompilerAssets((p) => {
        setProgress(p);
      });
      setDownloading(false);
      onCompilerReady();
    } catch (err: any) {
      setDownloading(false);
      setError(err?.message || 'Failed to download and cache compiler assets');
    }
  };

  const handleTestCompiler = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const bundleUrl = '/clang/bundle.js';
      const clangModule: any = await import(/* @vite-ignore */ bundleUrl);
      const { runClang } = clangModule;
      const res = await runClang(['clang', '--version'], {}, {});
      setTestResult('Compiler verified successfully! Local offline execution is ready.');
    } catch (err: any) {
      setTestResult(`Verification error: ${err.message}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="bg-ide-panel border border-ide-border rounded-lg w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-ide-subpanel border-b border-ide-border">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-semibold text-white">
              Prepare Your Offline Compiler
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-ide-hover transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <p className="text-xs text-zinc-300 leading-relaxed">
            Pocket C++ uses a genuine WebAssembly build of <strong className="text-white">LLVM/Clang</strong> with full standard library support (<code className="text-blue-300">iostream</code>, <code className="text-blue-300">vector</code>, <code className="text-blue-300">bits/stdc++.h</code>).
            Download and store the compiler assets (~105 MB) in your iPad browser cache to enable <strong className="text-white">100% offline compilation and execution</strong> without internet access.
          </p>

          {/* Status Box */}
          <div className={`p-4 rounded-lg border flex items-start gap-3 ${
            isCached
              ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300'
              : 'bg-zinc-900 border-ide-border text-zinc-300'
          }`}>
            {isCached ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : (
              <HardDrive className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="text-xs space-y-1">
              <span className="font-semibold text-white block">
                {isCached ? 'Offline Compiler Ready' : 'Compiler Not Cached for Offline'}
              </span>
              <p className="text-zinc-400">
                {isCached
                  ? 'All LLVM/Clang binaries and headers are cached in iPad Cache Storage.'
                  : 'Assets are loaded on-demand. Click below to cache all assets for offline use.'}
              </p>
            </div>
          </div>

          {/* Storage Info */}
          {storageInfo && (
            <div className="text-xs text-zinc-400 flex items-center justify-between bg-ide-subpanel p-3 rounded border border-ide-border">
              <span>iPad Available Storage Quota:</span>
              <span className="text-white font-mono font-medium">
                {storageInfo.usageMb} MB used / {storageInfo.quotaMb} MB total
              </span>
            </div>
          )}

          {/* Download Progress Bar */}
          {downloading && progress && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-zinc-300">
                <span>Downloading {progress.currentAsset} ({progress.assetIndex}/{progress.totalAssets})...</span>
                <span className="font-mono font-bold text-blue-400">{progress.percent}%</span>
              </div>
              <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-200"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
              <p className="text-[11px] text-zinc-500">
                {(progress.loadedBytes / (1024 * 1024)).toFixed(1)} MB / {(progress.totalBytes / (1024 * 1024)).toFixed(1)} MB
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-950/50 border border-red-800 rounded text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {testResult && (
            <div className="p-3 bg-zinc-900 border border-ide-border rounded text-xs text-zinc-200 font-mono">
              {testResult}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-5 py-4 bg-ide-subpanel border-t border-ide-border">
          <button
            type="button"
            onClick={handleTestCompiler}
            disabled={testing}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded bg-ide-panel hover:bg-ide-hover border border-ide-border text-zinc-300 transition-colors min-h-[38px]"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{testing ? 'Testing...' : 'Verify Compiler'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded bg-ide-accent hover:bg-ide-accentHover text-white transition-colors disabled:opacity-50 min-h-[38px]"
            >
              {downloading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Downloading...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>{isCached ? 'Re-download Assets' : 'Download Offline Compiler'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded bg-ide-panel hover:bg-ide-hover border border-ide-border text-white transition-colors min-h-[38px]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
