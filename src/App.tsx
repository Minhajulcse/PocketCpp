import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Check } from 'lucide-react';
import { Header } from './components/Header/Header';
import { CodeEditor, CodeEditorHandle } from './components/Editor/CodeEditor';
import { AccessoryBar } from './components/Editor/AccessoryBar';
import { InputPanel } from './components/Panels/InputPanel';
import { OutputPanel } from './components/Panels/OutputPanel';
import { TestCasesPanel, TestCaseResult } from './components/Panels/TestCasesPanel';
import { Splitter } from './components/Workspace/Splitter';
import { SettingsModal } from './components/Modals/SettingsModal';
import { CompilerSetupModal } from './components/Modals/CompilerSetupModal';
import { ShortcutsModal } from './components/Modals/ShortcutsModal';
import { NewFileModal } from './components/Modals/NewFileModal';
import { ProjectManagerModal } from './components/Modals/ProjectManagerModal';
import { DeveloperModal } from './components/Modals/DeveloperModal';
import {
  SourceFile,
  Project,
  Settings,
  TestCase,
  DEFAULT_SETTINGS,
  getFiles,
  saveFile,
  deleteFile,
  getProjects,
  saveProject,
  deleteProject,
  loadSettings,
  saveSettings,
  getTestCases,
  saveTestCase,
  deleteTestCase,
  saveRecoverySnapshot,
  getRecoverySnapshot,
  exportFileAsDownload,
} from './services/storage';
import { isCompilerCached, getStorageEstimate, requestPersistentStorage } from './services/compilerCache';
import { compilerService } from './compiler/compilerService';
import { ExecutionStatus, Diagnostic } from './compiler/types';
import { CP_TEMPLATE_CPP } from './services/templates';
import { getThemeDefinition } from './components/Editor/theme';

export const App: React.FC = () => {
  // Projects & Files State
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>('default-project');
  const [files, setFiles] = useState<SourceFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string>('default-main-cpp');

  // Input & Editor State
  const [stdin, setStdin] = useState<string>('1 2 3\n');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const editorRef = useRef<CodeEditorHandle>(null);

  // Settings State
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [storageInfo, setStorageInfo] = useState<{ quotaMb: number; usageMb: number; percent: number; isPersistent: boolean }>();

  // Workspace Resizing Proportions State
  const workspaceContainerRef = useRef<HTMLDivElement>(null);
  const ioContainerRef = useRef<HTMLDivElement>(null);
  const [editorWidthPercent, setEditorWidthPercent] = useState<number>(65);
  const [inputHeightPercent, setInputHeightPercent] = useState<number>(40);

  // Portrait Mode Mobile/iPad State
  const [isPortrait, setIsPortrait] = useState<boolean>(false);
  const [portraitTab, setPortraitTab] = useState<'editor' | 'input' | 'output' | 'tests'>('editor');

  // Compiler & Execution State
  const [executionStatus, setExecutionStatus] = useState<ExecutionStatus>('idle');
  const [stdout, setStdout] = useState<string>('');
  const [stderr, setStderr] = useState<string>('');
  const [compileOutput, setCompileOutput] = useState<string>('');
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  const [execDurationMs, setExecDurationMs] = useState<number>(0);
  const [compileDurationMs, setCompileDurationMs] = useState<number>(0);
  const [compilerInitDurationMs, setCompilerInitDurationMs] = useState<number>(0);
  const [runtimeInitDurationMs, setRuntimeInitDurationMs] = useState<number>(0);
  const [sourceCompilationDurationMs, setSourceCompilationDurationMs] = useState<number | undefined>();
  const [linkingDurationMs, setLinkingDurationMs] = useState<number | undefined>();
  const [wasmLoadingDurationMs, setWasmLoadingDurationMs] = useState<number | undefined>();
  const [wasmInitialMemoryMb, setWasmInitialMemoryMb] = useState<number | undefined>();
  const [wasmMaxMemoryMb, setWasmMaxMemoryMb] = useState<number | null | undefined>();
  const [programMemoryAllocatedMb, setProgramMemoryAllocatedMb] = useState<number | undefined>();
  const [globalDataSizeBytes, setGlobalDataSizeBytes] = useState<number | undefined>();
  const [wasmBinarySizeBytes, setWasmBinarySizeBytes] = useState<number | undefined>();
  const [exitCode, setExitCode] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [isCached, setIsCached] = useState<boolean>(false);

  // UI Panels & Modals State
  const [accessoryBarCollapsed, setAccessoryBarCollapsed] = useState(false);
  const [showTestCases, setShowTestCases] = useState(false);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [testResults, setTestResults] = useState<Record<string, TestCaseResult>>({});
  const [isRunningAllTests, setIsRunningAllTests] = useState(false);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCompilerSetupOpen, setIsCompilerSetupOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isNewFileModalOpen, setIsNewFileModalOpen] = useState(false);
  const [isProjectsModalOpen, setIsProjectsModalOpen] = useState(false);
  const [isDeveloperModalOpen, setIsDeveloperModalOpen] = useState(false);

  // Active File Helper
  const activeFile = files.find((f) => f.id === activeFileId) || files[0] || null;

  // Auto-save timer ref
  const saveTimeoutRef = useRef<any>(null);

  // Check orientation and screen geometry
  useEffect(() => {
    const handleResize = () => {
      const isNarrow = window.innerWidth < 768;
      const isPortraitOrientation = window.innerHeight > window.innerWidth && window.innerWidth < 900;
      setIsPortrait(isNarrow || isPortraitOrientation);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Initialize App on mount
  useEffect(() => {
    async function initApp() {
      // 1. Request persistent storage if supported
      await requestPersistentStorage();
      const estimate = await getStorageEstimate();
      setStorageInfo(estimate);

      // 2. Check compiler cache status
      const cached = await isCompilerCached();
      setIsCached(cached);

      // 3. Load user settings
      const loadedSettings = await loadSettings();
      setSettings(loadedSettings);
      if (loadedSettings.layout?.editorWidthPercent) {
        setEditorWidthPercent(loadedSettings.layout.editorWidthPercent);
      }
      if (loadedSettings.layout?.inputHeightPercent) {
        setInputHeightPercent(loadedSettings.layout.inputHeightPercent);
      }

      // 4. Load projects or seed default project
      let storedProjects = await getProjects();
      let currentProjId = 'default-project';

      if (storedProjects.length === 0) {
        const defaultProj: Project = {
          id: 'default-project',
          name: 'My C++ Project',
          activeFileId: 'default-main-cpp',
          updatedAt: Date.now(),
        };
        await saveProject(defaultProj);
        storedProjects = [defaultProj];

        const defaultFile: SourceFile = {
          id: 'default-main-cpp',
          projectId: 'default-project',
          name: 'main.cpp',
          content: CP_TEMPLATE_CPP,
          language: 'cpp',
          updatedAt: Date.now(),
        };
        await saveFile(defaultFile);
      }

      setProjects(storedProjects);
      currentProjId = storedProjects[0].id;
      setActiveProjectId(currentProjId);

      // 5. Load project files
      const projFiles = await getFiles(currentProjId);
      setFiles(projFiles);

      const targetFileId = storedProjects[0].activeFileId || projFiles[0]?.id;
      setActiveFileId(targetFileId);

      // 6. Check crash recovery snapshot
      if (targetFileId) {
        const snapshot = await getRecoverySnapshot(targetFileId);
        if (snapshot && snapshot.content) {
          const fileToRestore = projFiles.find((f) => f.id === targetFileId);
          if (fileToRestore && snapshot.timestamp > fileToRestore.updatedAt) {
            fileToRestore.content = snapshot.content;
            if (snapshot.input) setStdin(snapshot.input);
            await saveFile(fileToRestore);
            setFiles([...projFiles]);
          }
        }

        // Load test cases
        const loadedTestCases = await getTestCases(targetFileId);
        setTestCases(loadedTestCases);
      }
    }

    initApp();

    // Preload compiler worker and LLVM toolchain in the background
    compilerService.preloadCompiler();

    // Register Service Worker for offline PWA functionality
    if ('serviceWorker' in navigator && !window.location.hostname.includes('localhost')) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  // Update compilerService callbacks
  useEffect(() => {
    compilerService.setCallbacks({
      onStatusChange: (status) => setExecutionStatus(status),
      onStdout: (chunk) => setStdout((prev) => prev + chunk),
      onStderr: (chunk) => setStderr((prev) => prev + chunk),
    });
  }, []);

  // Handle Editor Code Change with Debounced Auto-Save
  const handleCodeChange = useCallback(
    (newContent: string) => {
      if (!activeFile) return;
      setSaveStatus('unsaved');

      setFiles((prev) =>
        prev.map((f) => (f.id === activeFile.id ? { ...f, content: newContent } : f))
      );

      // Save crash recovery snapshot immediately
      saveRecoverySnapshot({
        fileId: activeFile.id,
        content: newContent,
        input: stdin,
        timestamp: Date.now(),
      }).catch(() => {});

      // Debounce saving full file to IndexedDB
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(async () => {
        setSaveStatus('saving');
        try {
          await saveFile({
            ...activeFile,
            content: newContent,
          });
          setSaveStatus('saved');
        } catch {
          setSaveStatus('unsaved');
        }
      }, 600);
    },
    [activeFile, stdin]
  );

  // Manual Save (⌘S)
  const handleSave = async () => {
    if (!activeFile) return;
    setSaveStatus('saving');
    try {
      await saveFile(activeFile);
      setSaveStatus('saved');
    } catch {
      setSaveStatus('unsaved');
    }
  };

  // Compile and Run
  const handleCompileAndRun = async () => {
    if (!activeFile) return;
    setStdout('');
    setStderr('');
    setCompileOutput('');
    setDiagnostics([]);
    setErrorMessage(undefined);
    setExitCode(null);

    // Switch portrait tab to output so user immediately sees results
    if (isPortrait) {
      setPortraitTab('output');
    }

    // Collect additional headers from current project
    const additionalFiles: Record<string, string> = {};
    for (const f of files) {
      if (f.id !== activeFile.id) {
        additionalFiles[f.name] = f.content;
      }
    }

    const result = await compilerService.compileAndRun(
      activeFile.name,
      activeFile.content,
      {
        language: settings.compiler.language,
        standard: settings.compiler.standard,
        optimization: settings.compiler.optimization,
        warnings: settings.compiler.warnings,
        compileTimeoutMs: settings.compiler.compileTimeoutMs,
        initialMemoryMb: settings.compiler.initialMemoryMb,
        maxMemoryMb: settings.compiler.maxMemoryMb,
        stackSizeMb: settings.compiler.stackSizeMb,
      },
      {
        timeLimitMs: settings.execution.timeLimitMs,
        memoryLimitMb: settings.execution.memoryLimitMb,
        outputLimitBytes: settings.execution.outputLimitBytes,
        stdin,
      },
      additionalFiles
    );

    setStdout(result.stdout);
    setStderr(result.stderr);
    setCompileOutput(result.compilationOutput);
    setDiagnostics(result.diagnostics);
    setExecDurationMs(result.executionDurationMs);
    setCompileDurationMs(result.compilationDurationMs);
    setCompilerInitDurationMs(result.compilerInitDurationMs || 0);
    setRuntimeInitDurationMs(result.runtimeInitDurationMs || 0);
    setSourceCompilationDurationMs(result.sourceCompilationDurationMs);
    setLinkingDurationMs(result.linkingDurationMs);
    setWasmLoadingDurationMs(result.wasmLoadingDurationMs);
    setWasmInitialMemoryMb(result.wasmInitialMemoryMb);
    setWasmMaxMemoryMb(result.wasmMaxMemoryMb);
    setProgramMemoryAllocatedMb(result.programMemoryAllocatedMb);
    setGlobalDataSizeBytes(result.globalDataSizeBytes);
    setWasmBinarySizeBytes(result.wasmBinarySizeBytes);
    setExitCode(result.exitCode);
    setErrorMessage(result.errorMessage);
  };

  // Compile Only
  const handleCompileOnly = async () => {
    if (!activeFile) return;
    setCompileOutput('');
    setDiagnostics([]);
    setErrorMessage(undefined);

    if (isPortrait) {
      setPortraitTab('output');
    }

    const additionalFiles: Record<string, string> = {};
    for (const f of files) {
      if (f.id !== activeFile.id) {
        additionalFiles[f.name] = f.content;
      }
    }

    try {
      const result = await compilerService.compile(
        activeFile.name,
        activeFile.content,
        {
          language: settings.compiler.language,
          standard: settings.compiler.standard,
          optimization: settings.compiler.optimization,
          warnings: settings.compiler.warnings,
          compileTimeoutMs: settings.compiler.compileTimeoutMs,
          initialMemoryMb: settings.compiler.initialMemoryMb,
          maxMemoryMb: settings.compiler.maxMemoryMb,
          stackSizeMb: settings.compiler.stackSizeMb,
        },
        additionalFiles
      );

      setCompileOutput(result.output || 'Compilation finished successfully with 0 errors.');
      setDiagnostics(result.diagnostics);
      setCompileDurationMs(result.durationMs);
      setCompilerInitDurationMs(result.compilerInitDurationMs || 0);
      setSourceCompilationDurationMs(result.sourceCompilationDurationMs);
      setLinkingDurationMs(result.linkingDurationMs);
      setWasmInitialMemoryMb(result.wasmInitialMemoryMb);
      setWasmMaxMemoryMb(result.wasmMaxMemoryMb);
      setGlobalDataSizeBytes(result.globalDataSizeBytes);
      setWasmBinarySizeBytes(result.wasmBinarySizeBytes);
      setExecutionStatus('completed');
    } catch (err: any) {
      setCompileOutput(err.output || err.message || 'Compilation failed');
      setDiagnostics(err.diagnostics || []);
      setCompileDurationMs(err.durationMs || 0);
      setCompilerInitDurationMs(err.compilerInitDurationMs || 0);
      setSourceCompilationDurationMs(err.sourceCompilationDurationMs);
      setLinkingDurationMs(err.linkingDurationMs);
      setErrorMessage(err.message || 'Compilation failed');
      const status: ExecutionStatus = err?.message?.includes('Compilation timed out')
        ? 'compilation_timeout'
        : 'compilation_error';
      setExecutionStatus(status);
    }
  };

  // Manual Stop
  const handleStop = () => {
    compilerService.stop();
  };

  // Clear Output
  const handleClearOutput = () => {
    setStdout('');
    setStderr('');
    setCompileOutput('');
    setDiagnostics([]);
    setErrorMessage(undefined);
    setExecutionStatus('idle');
  };

  // Jump to line from compilation error
  const handleJumpToLine = (line: number, col = 1) => {
    if (isPortrait) {
      setPortraitTab('editor');
    }
    setTimeout(() => {
      editorRef.current?.jumpToLine(line, col);
    }, 50);
  };

  // Splitter Layout Persistence
  const handleSaveLayout = (editorWidth: number, inputHeight: number) => {
    const updated: Settings = {
      ...settings,
      layout: {
        editorWidthPercent: Math.round(editorWidth),
        inputHeightPercent: Math.round(inputHeight),
      },
    };
    setSettings(updated);
    saveSettings(updated);
  };

  // Reset Proportions
  const handleResetLayout = () => {
    setEditorWidthPercent(65);
    setInputHeightPercent(40);
    handleSaveLayout(65, 40);
  };

  // Toast Notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 3000);
  };

  // Reset All Settings to Defaults
  const handleResetAllSettings = async () => {
    setSettings(DEFAULT_SETTINGS);
    await saveSettings(DEFAULT_SETTINGS);
    setEditorWidthPercent(DEFAULT_SETTINGS.layout.editorWidthPercent);
    setInputHeightPercent(DEFAULT_SETTINGS.layout.inputHeightPercent);
    showToast('Settings restored to defaults.');
  };

  // Global Keyboard Shortcuts (⌘S, ⌘Enter, ⌘ShiftEnter, ⌘N)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      if (isCmdOrCtrl && e.key === 'Enter') {
        e.preventDefault();
        if (e.shiftKey) {
          handleCompileOnly();
        } else {
          handleCompileAndRun();
        }
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave();
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setIsNewFileModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFile, stdin, settings, files, isPortrait]);

  // Test Case Execution Handler
  const handleRunTestCase = async (tc: TestCase): Promise<TestCaseResult> => {
    if (!activeFile) {
      return { testId: tc.id, actualOutput: '', passed: false, durationMs: 0, status: 'error' };
    }
    const additionalFiles: Record<string, string> = {};
    for (const f of files) {
      if (f.id !== activeFile.id) additionalFiles[f.name] = f.content;
    }

    const res = await compilerService.compileAndRun(
      activeFile.name,
      activeFile.content,
      {
        language: settings.compiler.language,
        standard: settings.compiler.standard,
        optimization: settings.compiler.optimization,
        warnings: settings.compiler.warnings,
        compileTimeoutMs: settings.compiler.compileTimeoutMs,
        initialMemoryMb: settings.compiler.initialMemoryMb,
        maxMemoryMb: settings.compiler.maxMemoryMb,
        stackSizeMb: settings.compiler.stackSizeMb,
      },
      {
        timeLimitMs: settings.execution.timeLimitMs,
        memoryLimitMb: settings.execution.memoryLimitMb,
        outputLimitBytes: settings.execution.outputLimitBytes,
        stdin: tc.input,
      },
      additionalFiles
    );

    const actual = res.stdout.trim();
    const expected = tc.expectedOutput.trim();
    const passed = tc.expectedOutput ? actual === expected : res.status === 'completed';

    const testRes: TestCaseResult = {
      testId: tc.id,
      actualOutput: res.stdout,
      passed,
      durationMs: res.executionDurationMs,
      status: res.status,
    };

    setTestResults((prev) => ({ ...prev, [tc.id]: testRes }));
    return testRes;
  };

  const handleRunAllTestCases = async () => {
    setIsRunningAllTests(true);
    for (const tc of testCases) {
      await handleRunTestCase(tc);
    }
    setIsRunningAllTests(false);
  };

  // File & Project Switchers
  const handleSelectFile = async (id: string) => {
    setActiveFileId(id);
    const loadedTC = await getTestCases(id);
    setTestCases(loadedTC);
    setTestResults({});
  };

  const handleCreateFile = async (name: string, content: string, language: 'cpp' | 'c') => {
    const newFile: SourceFile = {
      id: 'file-' + Date.now(),
      projectId: activeProjectId,
      name,
      content,
      language,
      updatedAt: Date.now(),
    };
    await saveFile(newFile);
    setFiles((prev) => [...prev, newFile]);
    setActiveFileId(newFile.id);
  };

  const handleDeleteFile = async (id: string) => {
    await deleteFile(id);
    const updated = files.filter((f) => f.id !== id);
    setFiles(updated);
    if (activeFileId === id && updated.length > 0) {
      setActiveFileId(updated[0].id);
    }
  };

  const handleCreateProject = async (name: string) => {
    const newProj: Project = {
      id: 'proj-' + Date.now(),
      name,
      activeFileId: '',
      updatedAt: Date.now(),
    };
    const defaultFile: SourceFile = {
      id: 'file-' + Date.now(),
      projectId: newProj.id,
      name: 'main.cpp',
      content: CP_TEMPLATE_CPP,
      language: 'cpp',
      updatedAt: Date.now(),
    };
    newProj.activeFileId = defaultFile.id;

    await saveProject(newProj);
    await saveFile(defaultFile);

    setProjects((prev) => [...prev, newProj]);
    setActiveProjectId(newProj.id);
    setFiles([defaultFile]);
    setActiveFileId(defaultFile.id);
  };

  const handleSelectProject = async (id: string) => {
    setActiveProjectId(id);
    const projFiles = await getFiles(id);
    setFiles(projFiles);
    if (projFiles.length > 0) {
      setActiveFileId(projFiles[0].id);
    }
  };

  const handleDeleteProject = async (id: string) => {
    await deleteProject(id);
    const updated = projects.filter((p) => p.id !== id);
    setProjects(updated);
    if (updated.length > 0) {
      handleSelectProject(updated[0].id);
    }
  };

  const currentTheme = getThemeDefinition(settings.editor.themeId || 'one-dark');

  return (
    <div
      className="flex flex-col h-screen w-screen overflow-hidden text-ide-text select-none"
      style={{ backgroundColor: currentTheme.colors.bg }}
    >
      {/* Top Application Toolbar */}
      <Header
        files={files}
        activeFileId={activeFileId}
        onSelectFile={handleSelectFile}
        onNewFile={() => setIsNewFileModalOpen(true)}
        onSaveFile={handleSave}
        onExportFile={() => activeFile && exportFileAsDownload(activeFile.name, activeFile.content)}
        onOpenProjects={() => setIsProjectsModalOpen(true)}
        onDeleteFile={handleDeleteFile}
        language={settings.compiler.language}
        onLanguageChange={(lang) => {
          const updated = { ...settings, compiler: { ...settings.compiler, language: lang } };
          setSettings(updated);
          saveSettings(updated);
        }}
        standard={settings.compiler.standard}
        onStandardChange={(std) => {
          const updated = { ...settings, compiler: { ...settings.compiler, standard: std } };
          setSettings(updated);
          saveSettings(updated);
        }}
        optimization={settings.compiler.optimization}
        onOptimizationChange={(opt) => {
          const updated = { ...settings, compiler: { ...settings.compiler, optimization: opt } };
          setSettings(updated);
          saveSettings(updated);
        }}
        status={executionStatus}
        onCompileAndRun={handleCompileAndRun}
        onCompileOnly={handleCompileOnly}
        onStop={handleStop}
        isCompilerCached={isCached}
        onOpenCompilerSetup={() => setIsCompilerSetupOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenDeveloper={() => setIsDeveloperModalOpen(true)}
        onResetLayout={handleResetLayout}
        showTestCases={showTestCases}
        onToggleTestCases={() => setShowTestCases(!showTestCases)}
      />

      {/* Portrait Mode Tab Bar (iPad portrait / phone viewports) */}
      {isPortrait && (
        <div className="flex items-center justify-around bg-ide-subpanel border-b border-ide-border px-2 py-1 select-none flex-shrink-0">
          <button
            type="button"
            onClick={() => setPortraitTab('editor')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              portraitTab === 'editor'
                ? 'bg-blue-600 text-white font-bold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Code Editor
          </button>
          <button
            type="button"
            onClick={() => setPortraitTab('input')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              portraitTab === 'input'
                ? 'bg-blue-600 text-white font-bold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Input (stdin)
          </button>
          <button
            type="button"
            onClick={() => setPortraitTab('output')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors relative ${
              portraitTab === 'output'
                ? 'bg-blue-600 text-white font-bold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Output
            {stdout && (
              <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-blue-400" />
            )}
            {diagnostics.length > 0 && (
              <span className="ml-1.5 px-1 rounded-full text-[10px] bg-red-500 text-white font-bold">
                {diagnostics.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setPortraitTab('tests')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              portraitTab === 'tests'
                ? 'bg-blue-600 text-white font-bold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Test Cases ({testCases.length})
          </button>
        </div>
      )}

      {/* Main Workspace Layout (Landscape: Resizable Splitters, Portrait: Active Tab) */}
      <main
        ref={workspaceContainerRef}
        className="flex-1 flex flex-col md:flex-row overflow-hidden relative"
      >
        {/* Left Section: Source Code Editor */}
        <section
          style={{
            width: isPortrait ? '100%' : `${editorWidthPercent}%`,
            display: isPortrait && portraitTab !== 'editor' ? 'none' : 'flex',
          }}
          className="flex-col h-full relative overflow-hidden"
        >
          {/* File Tab Header with Save Status */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-ide-subpanel border-b border-ide-border min-h-[36px] flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-medium text-white px-2 py-0.5 rounded bg-ide-panel border border-ide-border">
                {activeFile?.name || 'untitled.cpp'}
              </span>
              <span className="text-[10px] uppercase font-bold text-blue-400 bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-900/60">
                {activeFile?.language || 'cpp'}
              </span>
              <span className="text-[10px] text-zinc-400 font-mono hidden xl:inline">
                Theme: {currentTheme.name}
              </span>
            </div>

            {/* Save Status Indicator */}
            <div className="flex items-center gap-1.5 text-xs">
              {saveStatus === 'saved' ? (
                <span className="flex items-center gap-1 text-[11px] text-ide-success font-medium bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-ide-success" />
                  Saved
                </span>
              ) : saveStatus === 'saving' ? (
                <span className="flex items-center gap-1 text-[11px] text-amber-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Saving...
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] text-zinc-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                  Unsaved
                </span>
              )}
            </div>
          </div>

          {/* CodeMirror 6 Editor with Advanced Typography & Themes */}
          <div className="flex-1 overflow-hidden relative">
            {activeFile && (
              <CodeEditor
                ref={editorRef}
                value={activeFile.content}
                language={activeFile.language}
                onChange={handleCodeChange}
                diagnostics={diagnostics}
                themeId={settings.editor.themeId}
                fontFamily={settings.editor.fontFamily}
                fontSize={settings.editor.fontSize}
                lineHeight={settings.editor.lineHeight}
                fontWeight={settings.editor.fontWeight}
                fontLigatures={settings.editor.fontLigatures}
                letterSpacing={settings.editor.letterSpacing}
                tabSize={settings.editor.tabSize}
                useSoftTabs={settings.editor.useSoftTabs ?? true}
                lineWrapping={settings.editor.lineWrapping}
                lineNumbersEnabled={settings.editor.lineNumbers}
                activeLineHighlight={settings.editor.activeLineHighlight}
                bracketMatchingEnabled={settings.editor.bracketMatching}
                autoCloseBracketsEnabled={settings.editor.autoCloseBrackets}
                codeFoldingEnabled={settings.editor.codeFolding}
                cursorStyle={settings.editor.cursorStyle}
              />
            )}
          </div>

          {/* iPad Programming Symbols Toolbar */}
          {settings.editor.showAccessoryBar && (
            <AccessoryBar
              editorView={editorRef.current?.getEditorView() || null}
              collapsed={accessoryBarCollapsed}
              onToggleCollapse={() => setAccessoryBarCollapsed(!accessoryBarCollapsed)}
              tabSize={settings.editor.tabSize}
              useSoftTabs={settings.editor.useSoftTabs ?? true}
            />
          )}
        </section>

        {/* Draggable Vertical Splitter (between Editor and I/O workspace in Landscape) */}
        {!isPortrait && (
          <Splitter
            direction="vertical"
            containerRef={workspaceContainerRef}
            currentPercent={editorWidthPercent}
            onResize={(pct) => setEditorWidthPercent(pct)}
            onResizeEnd={(finalPct) => handleSaveLayout(finalPct, inputHeightPercent)}
            onReset={handleResetLayout}
            minPercent={35}
            maxPercent={85}
          />
        )}

        {/* Right Section: Standard Input & Execution Output Workspace */}
        <section
          ref={ioContainerRef}
          style={{
            width: isPortrait ? '100%' : `${100 - editorWidthPercent}%`,
            display: isPortrait && portraitTab === 'editor' ? 'none' : 'flex',
          }}
          className="flex-col h-full overflow-hidden flex-1"
        >
          {showTestCases || (isPortrait && portraitTab === 'tests') ? (
            <div className="flex-1 overflow-hidden">
              <TestCasesPanel
                testCases={testCases}
                onAddTestCase={async () => {
                  if (!activeFile) return;
                  const newTC: TestCase = {
                    id: 'tc-' + Date.now(),
                    fileId: activeFile.id,
                    name: `Case ${testCases.length + 1}`,
                    input: '1 2 3\n',
                    expectedOutput: '6\n',
                  };
                  await saveTestCase(newTC);
                  setTestCases((prev) => [...prev, newTC]);
                }}
                onUpdateTestCase={async (tc) => {
                  await saveTestCase(tc);
                  setTestCases((prev) => prev.map((t) => (t.id === tc.id ? tc : t)));
                }}
                onDeleteTestCase={async (id) => {
                  await deleteTestCase(id);
                  setTestCases((prev) => prev.filter((t) => t.id !== id));
                }}
                onRunTest={handleRunTestCase}
                onRunAll={handleRunAllTestCases}
                isRunningAll={isRunningAllTests}
                results={testResults}
              />
            </div>
          ) : isPortrait ? (
            /* Portrait Mode Single Active Panel */
            <div className="flex-1 overflow-hidden">
              {portraitTab === 'input' && (
                <InputPanel value={stdin} onChange={setStdin} saved={true} />
              )}
              {portraitTab === 'output' && (
                <OutputPanel
                  status={executionStatus}
                  stdout={stdout}
                  stderr={stderr}
                  compileOutput={compileOutput}
                  diagnostics={diagnostics}
                  executionDurationMs={execDurationMs}
                  compilationDurationMs={compileDurationMs}
                  compilerInitDurationMs={compilerInitDurationMs}
                  runtimeInitDurationMs={runtimeInitDurationMs}
                  sourceCompilationDurationMs={sourceCompilationDurationMs}
                  linkingDurationMs={linkingDurationMs}
                  wasmLoadingDurationMs={wasmLoadingDurationMs}
                  wasmInitialMemoryMb={wasmInitialMemoryMb}
                  wasmMaxMemoryMb={wasmMaxMemoryMb}
                  programMemoryAllocatedMb={programMemoryAllocatedMb}
                  globalDataSizeBytes={globalDataSizeBytes}
                  wasmBinarySizeBytes={wasmBinarySizeBytes}
                  exitCode={exitCode}
                  errorMessage={errorMessage}
                  onClear={handleClearOutput}
                  onJumpToLine={handleJumpToLine}
                />
              )}
            </div>
          ) : (
            /* Landscape Mode Resizable Input/Output Split */
            <>
              {/* Top: Standard Input Panel */}
              <div
                style={{ height: `${inputHeightPercent}%` }}
                className="overflow-hidden flex-shrink-0"
              >
                <InputPanel value={stdin} onChange={setStdin} saved={true} />
              </div>

              {/* Draggable Horizontal Splitter (between Input and Output) */}
              <Splitter
                direction="horizontal"
                containerRef={ioContainerRef}
                currentPercent={inputHeightPercent}
                onResize={(pct) => setInputHeightPercent(pct)}
                onResizeEnd={(finalPct) => handleSaveLayout(editorWidthPercent, finalPct)}
                onReset={handleResetLayout}
                minPercent={20}
                maxPercent={80}
              />

              {/* Bottom: Execution Output & Diagnostics Panel */}
              <div
                style={{ height: `${100 - inputHeightPercent}%` }}
                className="overflow-hidden flex-1"
              >
                <OutputPanel
                  status={executionStatus}
                  stdout={stdout}
                  stderr={stderr}
                  compileOutput={compileOutput}
                  diagnostics={diagnostics}
                  executionDurationMs={execDurationMs}
                  compilationDurationMs={compileDurationMs}
                  compilerInitDurationMs={compilerInitDurationMs}
                  runtimeInitDurationMs={runtimeInitDurationMs}
                  sourceCompilationDurationMs={sourceCompilationDurationMs}
                  linkingDurationMs={linkingDurationMs}
                  wasmLoadingDurationMs={wasmLoadingDurationMs}
                  wasmInitialMemoryMb={wasmInitialMemoryMb}
                  wasmMaxMemoryMb={wasmMaxMemoryMb}
                  programMemoryAllocatedMb={programMemoryAllocatedMb}
                  globalDataSizeBytes={globalDataSizeBytes}
                  wasmBinarySizeBytes={wasmBinarySizeBytes}
                  exitCode={exitCode}
                  errorMessage={errorMessage}
                  onClear={handleClearOutput}
                  onJumpToLine={handleJumpToLine}
                />
              </div>
            </>
          )}
        </section>
      </main>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={(s) => {
          setSettings(s);
          saveSettings(s);
        }}
        storageInfo={storageInfo}
        onResetLayout={handleResetLayout}
        onResetAllSettings={handleResetAllSettings}
        onOpenCompilerSetup={() => setIsCompilerSetupOpen(true)}
      />

      <DeveloperModal
        isOpen={isDeveloperModalOpen}
        onClose={() => setIsDeveloperModalOpen(false)}
      />

      <CompilerSetupModal
        isOpen={isCompilerSetupOpen}
        onClose={() => setIsCompilerSetupOpen(false)}
        isCached={isCached}
        onCompilerReady={() => setIsCached(true)}
        storageInfo={storageInfo}
      />

      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      <NewFileModal
        isOpen={isNewFileModalOpen}
        onClose={() => setIsNewFileModalOpen(false)}
        onCreateFile={handleCreateFile}
      />

      <ProjectManagerModal
        isOpen={isProjectsModalOpen}
        onClose={() => setIsProjectsModalOpen(false)}
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={handleSelectProject}
        onCreateProject={handleCreateProject}
        onDeleteProject={handleDeleteProject}
      />

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-950/95 border border-emerald-500/80 text-emerald-200 text-xs font-medium shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
