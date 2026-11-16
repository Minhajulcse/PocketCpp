import React from 'react';
import {
  Play,
  Square,
  Hammer,
  Settings as SettingsIcon,
  Command,
  CheckCircle2,
  HardDrive,
  FlaskConical,
  User,
  RotateCcw,
} from 'lucide-react';
import { FileMenu } from './FileMenu';
import { SourceFile } from '../../services/storage';
import { ExecutionStatus } from '../../compiler/types';

interface HeaderProps {
  files: SourceFile[];
  activeFileId: string;
  onSelectFile: (id: string) => void;
  onNewFile: () => void;
  onSaveFile: () => void;
  onExportFile: () => void;
  onOpenProjects: () => void;
  onDeleteFile: (id: string) => void;

  language: 'cpp' | 'c';
  onLanguageChange: (lang: 'cpp' | 'c') => void;
  standard: string;
  onStandardChange: (std: any) => void;
  optimization: string;
  onOptimizationChange: (opt: any) => void;

  status: ExecutionStatus;
  onCompileAndRun: () => void;
  onCompileOnly: () => void;
  onStop: () => void;

  isCompilerCached: boolean;
  onOpenCompilerSetup: () => void;
  onOpenSettings: () => void;
  onOpenShortcuts: () => void;
  onOpenDeveloper: () => void;
  onResetLayout?: () => void;

  showTestCases: boolean;
  onToggleTestCases: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  files,
  activeFileId,
  onSelectFile,
  onNewFile,
  onSaveFile,
  onExportFile,
  onOpenProjects,
  onDeleteFile,
  language,
  onLanguageChange,
  standard,
  onStandardChange,
  optimization,
  onOptimizationChange,
  status,
  onCompileAndRun,
  onCompileOnly,
  onStop,
  isCompilerCached,
  onOpenCompilerSetup,
  onOpenSettings,
  onOpenShortcuts,
  onOpenDeveloper,
  onResetLayout,
  showTestCases,
  onToggleTestCases,
}) => {
  const isBusy = status === 'compiling' || status === 'running';

  return (
    <header className="flex items-center justify-between px-3 py-1.5 bg-ide-header border-b border-ide-border select-none min-h-[46px] flex-wrap gap-y-1">
      {/* Left Area: Logo, File Menu, Tabs */}
      <div className="flex items-center gap-2">
        {/* Pocket C++ Logo */}
        <div className="flex items-center gap-1.5 pr-2 border-r border-ide-border">
          <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center font-bold text-[11px] text-white shadow-sm">
            C++
          </div>
          <span className="text-xs font-bold tracking-tight text-white hidden sm:inline">
            Pocket C++
          </span>
        </div>

        {/* File Menu */}
        <FileMenu
          files={files}
          activeFileId={activeFileId}
          onSelectFile={onSelectFile}
          onNewFile={onNewFile}
          onSaveFile={onSaveFile}
          onExportFile={onExportFile}
          onOpenProjects={onOpenProjects}
          onDeleteFile={onDeleteFile}
          onOpenDeveloper={onOpenDeveloper}
          onResetLayout={onResetLayout}
        />

        {/* Language & Standard Selectors */}
        <div className="hidden md:flex items-center gap-1.5 pl-2 border-l border-ide-border">
          <select
            value={language}
            onChange={(e) => onLanguageChange(e.target.value as 'cpp' | 'c')}
            className="bg-ide-subpanel text-xs text-white border border-ide-border rounded px-2 py-1 focus:outline-none min-h-[32px]"
          >
            <option value="cpp">C++</option>
            <option value="c">C</option>
          </select>

          <select
            value={standard}
            onChange={(e) => onStandardChange(e.target.value)}
            className="bg-ide-subpanel text-xs text-white border border-ide-border rounded px-2 py-1 focus:outline-none min-h-[32px]"
          >
            {language === 'cpp' ? (
              <>
                <option value="c++17">C++17</option>
                <option value="c++20">C++20</option>
              </>
            ) : (
              <>
                <option value="c11">C11</option>
                <option value="c17">C17</option>
              </>
            )}
          </select>

          <select
            value={optimization}
            onChange={(e) => onOptimizationChange(e.target.value)}
            className="bg-ide-subpanel text-xs text-zinc-300 border border-ide-border rounded px-2 py-1 focus:outline-none min-h-[32px]"
          >
            <option value="O0">-O0</option>
            <option value="O2">-O2</option>
            <option value="O3">-O3</option>
          </select>
        </div>
      </div>

      {/* Right Area: Action Buttons, Status & Tools */}
      <div className="flex items-center gap-1.5">
        {/* Run Code Button */}
        <button
          type="button"
          onClick={onCompileAndRun}
          disabled={isBusy}
          title="Compile & Run (⌘Enter)"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-medium text-xs shadow transition-colors disabled:opacity-50 min-h-[34px]"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Run Code</span>
        </button>

        {/* Compile Only Button */}
        <button
          type="button"
          onClick={onCompileOnly}
          disabled={isBusy}
          title="Compile Only (⌘⇧Enter)"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-ide-panel hover:bg-ide-hover border border-ide-border text-zinc-300 text-xs transition-colors disabled:opacity-50 min-h-[34px]"
        >
          <Hammer className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Compile</span>
        </button>

        {/* Manual Stop Button */}
        <button
          type="button"
          onClick={onStop}
          disabled={!isBusy}
          title="Stop Execution immediately"
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded text-xs transition-colors min-h-[34px] ${
            isBusy
              ? 'bg-red-600 hover:bg-red-500 text-white font-bold animate-pulse shadow-md'
              : 'bg-ide-panel border border-ide-border text-zinc-600 opacity-40 cursor-not-allowed'
          }`}
        >
          <Square className="w-3.5 h-3.5 fill-current" />
          <span>Stop</span>
        </button>

        <div className="w-[1px] h-6 bg-ide-border mx-1 hidden sm:block" />

        {/* Competitive Programming Test Cases Toggle */}
        <button
          type="button"
          onClick={onToggleTestCases}
          title="Competitive Programming Test Cases"
          className={`flex items-center gap-1 px-2 py-1.5 rounded text-xs border transition-colors min-h-[34px] ${
            showTestCases
              ? 'bg-purple-950/60 border-purple-800 text-purple-300 font-semibold'
              : 'bg-ide-panel border-ide-border text-zinc-400 hover:text-white'
          }`}
        >
          <FlaskConical className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">Test Cases</span>
        </button>

        {/* Offline Cache Status Badge */}
        <button
          type="button"
          onClick={onOpenCompilerSetup}
          title={isCompilerCached ? 'Offline Compiler Ready' : 'Download Offline Compiler'}
          className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-ide-panel hover:bg-ide-hover border border-ide-border transition-colors min-h-[34px]"
        >
          {isCompilerCached ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <HardDrive className="w-3.5 h-3.5 text-amber-400" />
          )}
          <span className="text-[11px] text-zinc-300 hidden xl:inline">
            {isCompilerCached ? 'Offline Ready' : 'Offline Setup'}
          </span>
        </button>

        {/* Keyboard Shortcuts Reference */}
        <button
          type="button"
          onClick={onOpenShortcuts}
          title="Keyboard Shortcuts"
          className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-ide-hover transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
        >
          <Command className="w-4 h-4" />
        </button>

        {/* Developer Profile */}
        <button
          type="button"
          onClick={onOpenDeveloper}
          title="Developer Profile (Minhajul Islam)"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-white bg-ide-panel hover:bg-ide-hover border border-ide-border transition-colors min-h-[34px]"
        >
          <User className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden sm:inline">Developer</span>
        </button>

        {/* Settings Modal */}
        <button
          type="button"
          onClick={onOpenSettings}
          title="IDE Settings"
          className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-ide-hover transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
        >
          <SettingsIcon className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
