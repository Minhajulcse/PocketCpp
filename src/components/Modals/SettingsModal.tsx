import React, { useState } from 'react';
import {
  X,
  Palette,
  Type,
  Layout,
  Sliders,
  Cpu,
  Shield,
  HardDrive,
  User,
  RotateCcw,
  Check,
  ExternalLink,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { Settings, DEFAULT_SETTINGS } from '../../services/storage';
import { THEMES_LIST, getThemeDefinition } from '../Editor/theme';
import { FONTS_LIST, getFontOption } from '../../services/fonts';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onSaveSettings: (settings: Settings) => void;
  storageInfo?: { quotaMb: number; usageMb: number; percent: number; isPersistent: boolean };
  onResetLayout?: () => void;
  onResetAllSettings?: () => void;
  onOpenCompilerSetup?: () => void;
}

type SettingsTab =
  | 'appearance'
  | 'typography'
  | 'layout'
  | 'editor'
  | 'compiler'
  | 'execution'
  | 'storage'
  | 'developer';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  storageInfo,
  onResetLayout,
  onResetAllSettings,
  onOpenCompilerSetup,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');
  const [themeFilter, setThemeFilter] = useState<'all' | 'dark' | 'light'>('all');
  const [devImgError, setDevImgError] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  if (!isOpen) return null;

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((curr) => (curr === msg ? null : curr));
    }, 2800);
  };

  const handleResetAll = () => {
    if (onResetAllSettings) {
      onResetAllSettings();
    } else {
      onSaveSettings(DEFAULT_SETTINGS);
      onResetLayout?.();
    }
    setShowResetConfirm(false);
    showNotification('Settings restored to defaults.');
  };

  const resetAppearance = () => {
    onSaveSettings({
      ...settings,
      editor: {
        ...settings.editor,
        themeId: DEFAULT_SETTINGS.editor.themeId,
      },
    });
    showNotification('Appearance restored to default theme.');
  };

  const resetTypography = () => {
    onSaveSettings({
      ...settings,
      editor: {
        ...settings.editor,
        fontFamily: DEFAULT_SETTINGS.editor.fontFamily,
        fontSize: DEFAULT_SETTINGS.editor.fontSize,
        lineHeight: DEFAULT_SETTINGS.editor.lineHeight,
        fontWeight: DEFAULT_SETTINGS.editor.fontWeight,
        fontLigatures: DEFAULT_SETTINGS.editor.fontLigatures,
        letterSpacing: DEFAULT_SETTINGS.editor.letterSpacing,
      },
    });
    showNotification('Typography restored to defaults.');
  };

  const resetWorkspaceLayout = () => {
    onSaveSettings({
      ...settings,
      layout: { ...DEFAULT_SETTINGS.layout },
    });
    onResetLayout?.();
    showNotification('Workspace layout restored to defaults.');
  };

  const resetEditorSettings = () => {
    onSaveSettings({
      ...settings,
      editor: {
        ...settings.editor,
        tabSize: DEFAULT_SETTINGS.editor.tabSize,
        useSoftTabs: DEFAULT_SETTINGS.editor.useSoftTabs,
        lineWrapping: DEFAULT_SETTINGS.editor.lineWrapping,
        lineNumbers: DEFAULT_SETTINGS.editor.lineNumbers,
        activeLineHighlight: DEFAULT_SETTINGS.editor.activeLineHighlight,
        indentationGuides: DEFAULT_SETTINGS.editor.indentationGuides,
        bracketMatching: DEFAULT_SETTINGS.editor.bracketMatching,
        autoCloseBrackets: DEFAULT_SETTINGS.editor.autoCloseBrackets,
        autoIndent: DEFAULT_SETTINGS.editor.autoIndent,
        codeFolding: DEFAULT_SETTINGS.editor.codeFolding,
        smoothScrolling: DEFAULT_SETTINGS.editor.smoothScrolling,
        cursorStyle: DEFAULT_SETTINGS.editor.cursorStyle,
        showAccessoryBar: DEFAULT_SETTINGS.editor.showAccessoryBar,
      },
    });
    showNotification('Editor settings restored to defaults.');
  };

  const resetCompilerSettings = () => {
    onSaveSettings({
      ...settings,
      compiler: { ...DEFAULT_SETTINGS.compiler },
    });
    showNotification('Compiler settings restored to defaults.');
  };

  const resetExecutionSettings = () => {
    onSaveSettings({
      ...settings,
      execution: { ...DEFAULT_SETTINGS.execution },
    });
    showNotification('Execution safety settings restored to defaults.');
  };

  const updateEditor = (key: keyof Settings['editor'], value: any) => {
    onSaveSettings({
      ...settings,
      editor: { ...settings.editor, [key]: value },
    });
  };

  const updateLayout = (key: keyof Settings['layout'], value: any) => {
    onSaveSettings({
      ...settings,
      layout: { ...settings.layout, [key]: value },
    });
  };

  const updateCompiler = (key: keyof Settings['compiler'], value: any) => {
    onSaveSettings({
      ...settings,
      compiler: { ...settings.compiler, [key]: value },
    });
  };

  const updateExecution = (key: keyof Settings['execution'], value: any) => {
    onSaveSettings({
      ...settings,
      execution: { ...settings.execution, [key]: value },
    });
  };

  const currentTheme = getThemeDefinition(settings.editor.themeId || 'one-dark');
  const currentFont = getFontOption(settings.editor.fontFamily || 'JetBrains Mono');

  const filteredThemes = THEMES_LIST.filter((t) => {
    if (themeFilter === 'dark') return t.isDark;
    if (themeFilter === 'light') return !t.isDark;
    return true;
  });

  const navItems = [
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'typography', label: 'Typography', icon: Type },
    { id: 'layout', label: 'Workspace', icon: Layout },
    { id: 'editor', label: 'Editor Behaviors', icon: Sliders },
    { id: 'compiler', label: 'Compiler', icon: Cpu },
    { id: 'execution', label: 'Execution & Safety', icon: Shield },
    { id: 'storage', label: 'Storage & Offline', icon: HardDrive },
    { id: 'developer', label: 'Developer Profile', icon: User },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-5 backdrop-blur-sm">
      <div className="bg-ide-panel border border-ide-border rounded-xl w-full max-w-4xl h-[92vh] max-h-[820px] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-ide-subpanel border-b border-ide-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-semibold text-white">Settings</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-ide-hover transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Layout: Sidebar Navigation + Main Content */}
        <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
          {/* Sidebar Navigation */}
          <nav className="sm:w-56 bg-ide-subpanel border-b sm:border-b-0 sm:border-r border-ide-border p-2 sm:p-3 flex sm:flex-col gap-1 overflow-x-auto sm:overflow-y-auto flex-shrink-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id as SettingsTab)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors text-left min-h-[38px] ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white hover:bg-ide-panel'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Tab Content Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-ide-bg text-zinc-200">
            {/* 1. APPEARANCE / THEMES */}
            {activeTab === 'appearance' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-ide-border">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Editor Theme</h3>
                    <p className="text-xs text-zinc-400">
                      Choose from 11 professionally balanced dark and light themes with instant live preview.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Filter Pills */}
                    <div className="flex items-center p-0.5 rounded-lg bg-ide-panel border border-ide-border text-xs">
                      {(['all', 'dark', 'light'] as const).map((filter) => (
                        <button
                          key={filter}
                          type="button"
                          onClick={() => setThemeFilter(filter)}
                          className={`px-3 py-1 rounded-md capitalize transition-colors ${
                            themeFilter === filter
                              ? 'bg-blue-600 text-white font-medium shadow-sm'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          {filter}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={resetAppearance}
                      title="Reset Appearance to default theme"
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-ide-panel hover:bg-ide-hover border border-ide-border text-zinc-300 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
                      <span>Reset Section</span>
                    </button>
                  </div>
                </div>

                {/* Theme Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {filteredThemes.map((t) => {
                    const isSelected = settings.editor.themeId === t.id;
                    const c = t.colors;
                    return (
                      <div
                        key={t.id}
                        onClick={() => updateEditor('themeId', t.id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'border-blue-500 ring-2 ring-blue-500/30 shadow-md'
                            : 'border-ide-border hover:border-zinc-500'
                        }`}
                        style={{ backgroundColor: c.bg }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className="text-xs font-bold"
                            style={{ color: c.fg }}
                          >
                            {t.name}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded font-mono uppercase"
                              style={{
                                backgroundColor: t.isDark ? '#ffffff15' : '#00000015',
                                color: c.fg,
                              }}
                            >
                              {t.isDark ? 'Dark' : 'Light'}
                            </span>
                            {isSelected && (
                              <span className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Theme Syntax Sample Preview Card */}
                        <div
                          className="p-2.5 rounded font-mono text-[11px] leading-relaxed border select-none overflow-hidden"
                          style={{
                            backgroundColor: c.gutter,
                            borderColor: c.border,
                          }}
                        >
                          <div>
                            <span style={{ color: c.comment }}>// C++ Sample</span>
                          </div>
                          <div>
                            <span style={{ color: c.keyword }}>#include </span>
                            <span style={{ color: c.string }}>&lt;iostream&gt;</span>
                          </div>
                          <div>
                            <span style={{ color: c.keyword }}>int </span>
                            <span style={{ color: c.function }}>main</span>() {'{'}
                          </div>
                          <div className="pl-3">
                            <span style={{ color: c.function }}>cout </span>
                            <span style={{ color: c.operator }}>&lt;&lt; </span>
                            <span style={{ color: c.string }}>"Hello" </span>
                            <span style={{ color: c.operator }}>&lt;&lt; </span>
                            <span style={{ color: c.number }}>42</span>;
                          </div>
                          <div>{'}'}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. TYPOGRAPHY */}
            {activeTab === 'typography' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-ide-border">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Fonts and Typography</h3>
                    <p className="text-xs text-zinc-400">
                      Customize the monospace font family, size, line height, ligatures, and spacing for optimal coding comfort.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={resetTypography}
                    title="Reset Typography to defaults"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-ide-panel hover:bg-ide-hover border border-ide-border text-zinc-300 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
                    <span>Reset Section</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                  {/* Font Family */}
                  <div className="space-y-1.5">
                    <label className="text-zinc-300 font-medium">Font Family</label>
                    <select
                      value={settings.editor.fontFamily}
                      onChange={(e) => updateEditor('fontFamily', e.target.value)}
                      className="w-full bg-ide-panel border border-ide-border rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                    >
                      {FONTS_LIST.map((f) => (
                        <option key={f.id} value={f.name}>
                          {f.name} ({f.category === 'web' ? 'Bundled Webfont' : 'System'})
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-zinc-500">{currentFont.description}</p>
                  </div>

                  {/* Font Size */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <label className="text-zinc-300 font-medium">Font Size</label>
                      <span className="text-blue-400 font-mono font-bold">
                        {settings.editor.fontSize} px
                      </span>
                    </div>
                    <input
                      type="range"
                      min="12"
                      max="22"
                      step="1"
                      value={settings.editor.fontSize}
                      onChange={(e) => updateEditor('fontSize', parseInt(e.target.value, 10))}
                      className="w-full accent-blue-500"
                    />
                    <div className="flex justify-between text-[10px] text-zinc-500">
                      <span>12px</span>
                      <span>14px (Default)</span>
                      <span>18px</span>
                      <span>22px</span>
                    </div>
                  </div>

                  {/* Line Height */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <label className="text-zinc-300 font-medium">Line Height (Spacing)</label>
                      <span className="text-blue-400 font-mono font-bold">
                        {settings.editor.lineHeight}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1.2"
                      max="2.2"
                      step="0.1"
                      value={settings.editor.lineHeight}
                      onChange={(e) => updateEditor('lineHeight', parseFloat(e.target.value))}
                      className="w-full accent-blue-500"
                    />
                    <div className="flex justify-between text-[10px] text-zinc-500">
                      <span>1.2 (Compact)</span>
                      <span>1.6 (Default)</span>
                      <span>2.2 (Relaxed)</span>
                    </div>
                  </div>

                  {/* Font Weight */}
                  <div className="space-y-1.5">
                    <label className="text-zinc-300 font-medium">Font Weight</label>
                    <select
                      value={settings.editor.fontWeight || '400'}
                      onChange={(e) => updateEditor('fontWeight', e.target.value)}
                      className="w-full bg-ide-panel border border-ide-border rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="400">Regular (400)</option>
                      <option value="500">Medium (500)</option>
                      <option value="600">Semi-Bold (600)</option>
                      <option value="700">Bold (700)</option>
                    </select>
                  </div>

                  {/* Letter Spacing */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <label className="text-zinc-300 font-medium">Letter Spacing</label>
                      <span className="text-blue-400 font-mono font-bold">
                        {settings.editor.letterSpacing || 0} px
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-0.5"
                      max="2"
                      step="0.25"
                      value={settings.editor.letterSpacing || 0}
                      onChange={(e) => updateEditor('letterSpacing', parseFloat(e.target.value))}
                      className="w-full accent-blue-500"
                    />
                  </div>

                  {/* Font Ligatures Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-ide-panel border border-ide-border">
                    <div>
                      <span className="text-xs font-medium text-white block">Font Ligatures</span>
                      <span className="text-[11px] text-zinc-400">
                        Render compound symbols like &lt;=, !=, =&gt;, -&gt;
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.editor.fontLigatures}
                        onChange={(e) => updateEditor('fontLigatures', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                {/* Live Typography Preview Box */}
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
                    Interactive Typography Preview
                  </span>
                  <div
                    className="p-4 rounded-lg border select-text transition-all overflow-x-auto"
                    style={{
                      backgroundColor: currentTheme.colors.bg,
                      color: currentTheme.colors.fg,
                      borderColor: currentTheme.colors.border,
                      fontFamily: currentFont.fontFamily,
                      fontSize: `${settings.editor.fontSize}px`,
                      lineHeight: settings.editor.lineHeight,
                      fontWeight: settings.editor.fontWeight || '400',
                      letterSpacing: `${settings.editor.letterSpacing || 0}px`,
                      fontFeatureSettings: settings.editor.fontLigatures ? '"liga" 1, "calt" 1' : '"liga" 0, "calt" 0',
                    }}
                  >
                    <div><span style={{ color: currentTheme.colors.comment }}>// Quick preview test: {currentFont.name}</span></div>
                    <div>
                      <span style={{ color: currentTheme.colors.keyword }}>#include </span>
                      <span style={{ color: currentTheme.colors.string }}>&lt;bits/stdc++.h&gt;</span>
                    </div>
                    <div><span style={{ color: currentTheme.colors.keyword }}>using namespace </span>std;</div>
                    <div className="my-1"></div>
                    <div>
                      <span style={{ color: currentTheme.colors.keyword }}>int </span>
                      <span style={{ color: currentTheme.colors.function }}>main</span>() {'{'}
                    </div>
                    <div className="pl-4">
                      <span style={{ color: currentTheme.colors.type }}>vector</span>&lt;<span style={{ color: currentTheme.colors.keyword }}>int</span>&gt; v = {'{'}3, 1, 4, 1, 5{'}'};
                    </div>
                    <div className="pl-4">
                      <span style={{ color: currentTheme.colors.function }}>sort</span>(v.<span style={{ color: currentTheme.colors.function }}>begin</span>(), v.<span style={{ color: currentTheme.colors.function }}>end</span>());
                    </div>
                    <div className="pl-4">
                      <span style={{ color: currentTheme.colors.function }}>cout </span>
                      <span style={{ color: currentTheme.colors.operator }}>&lt;&lt; </span>
                      <span style={{ color: currentTheme.colors.string }}>"OK" </span>
                      <span style={{ color: currentTheme.colors.operator }}>&lt;&lt; </span>
                      <span style={{ color: currentTheme.colors.string }}>"\\n"</span>; <span style={{ color: currentTheme.colors.comment }}>// ligatures test: != &lt;= &gt;= -&gt; ==</span>
                    </div>
                    <div>{'}'}</div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. WORKSPACE LAYOUT & SPLITTERS */}
            {activeTab === 'layout' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-ide-border">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Workspace Layout & Splitters</h3>
                    <p className="text-xs text-zinc-400">
                      Fine-tune the relative proportions between the code editor and Input/Output panels. Custom sizes are saved automatically.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={resetWorkspaceLayout}
                    title="Reset Workspace Layout to defaults"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-ide-panel hover:bg-ide-hover border border-ide-border text-zinc-300 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
                    <span>Reset Section</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                  {/* Editor Width Slider */}
                  <div className="space-y-2 p-4 rounded-lg bg-ide-panel border border-ide-border">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-white">Editor Width (Horizontal Splitter)</span>
                      <span className="text-blue-400 font-mono font-bold text-sm">
                        {Math.round(settings.layout?.editorWidthPercent || 65)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="35"
                      max="85"
                      step="1"
                      value={settings.layout?.editorWidthPercent || 65}
                      onChange={(e) => updateLayout('editorWidthPercent', parseInt(e.target.value, 10))}
                      className="w-full accent-blue-500"
                    />
                    <div className="flex justify-between text-[11px] text-zinc-500">
                      <span>35% (Compact)</span>
                      <span>65% (Recommended)</span>
                      <span>85% (Wide)</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 pt-1">
                      Remaining {100 - Math.round(settings.layout?.editorWidthPercent || 65)}% is allocated to the Input & Output workspace.
                    </p>
                  </div>

                  {/* Input Height Slider */}
                  <div className="space-y-2 p-4 rounded-lg bg-ide-panel border border-ide-border">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-white">Input Panel Height (Vertical Splitter)</span>
                      <span className="text-blue-400 font-mono font-bold text-sm">
                        {Math.round(settings.layout?.inputHeightPercent || 40)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="80"
                      step="1"
                      value={settings.layout?.inputHeightPercent || 40}
                      onChange={(e) => updateLayout('inputHeightPercent', parseInt(e.target.value, 10))}
                      className="w-full accent-blue-500"
                    />
                    <div className="flex justify-between text-[11px] text-zinc-500">
                      <span>20% (Short)</span>
                      <span>40% (Recommended)</span>
                      <span>80% (Tall)</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 pt-1">
                      Output panel occupies the remaining {100 - Math.round(settings.layout?.inputHeightPercent || 40)}%.
                    </p>
                  </div>
                </div>

                {/* Reset Layout Option */}
                <div className="p-4 rounded-lg bg-ide-subpanel border border-ide-border flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-white block">Reset Default Proportions</span>
                    <span className="text-[11px] text-zinc-400">
                      Restores default layout: Editor 65%, I/O 35%, Input 40%, Output 60%.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={resetWorkspaceLayout}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-ide-panel hover:bg-ide-hover border border-ide-border text-zinc-200 transition-colors min-h-[38px]"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
                    <span>Reset Layout</span>
                  </button>
                </div>
              </div>
            )}

            {/* 4. EDITOR BEHAVIORS & INDENTATION */}
            {activeTab === 'editor' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-ide-border">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Code Editor Behaviors</h3>
                    <p className="text-xs text-zinc-400">
                      Configure indentation width, tab behavior, bracket matching, and touch helpers.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={resetEditorSettings}
                    title="Reset Editor Settings to defaults"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-ide-panel hover:bg-ide-hover border border-ide-border text-zinc-300 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
                    <span>Reset Section</span>
                  </button>
                </div>

                {/* Indentation & Formatting Card */}
                <div className="p-4 rounded-xl bg-ide-panel border border-ide-border space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2 border-b border-ide-border pb-2.5">
                    <div>
                      <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
                        Indentation & Formatting
                      </h4>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        Choose how many spaces are inserted when you press Tab in the code editor.
                      </p>
                    </div>
                    <span className="text-[11px] font-mono font-medium text-blue-400 bg-blue-950/60 px-2.5 py-1 rounded-full border border-blue-800/60">
                      Current: {settings.editor.tabSize || 4} Spaces ({settings.editor.useSoftTabs !== false ? 'Soft Tabs' : 'Hard Tabs'})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* Tab Size / Indentation Width */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-zinc-200 font-medium">
                          Tab Size / Indentation Width
                        </label>
                        <span className="text-[11px] text-zinc-500 font-mono">
                          Default: 4 Spaces
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5 bg-ide-subpanel p-1 rounded-lg border border-ide-border">
                        {[2, 4, 6, 8].map((size) => {
                          const isSelected = (settings.editor.tabSize || 4) === size;
                          return (
                            <button
                              key={size}
                              type="button"
                              onClick={() => updateEditor('tabSize', size)}
                              className={`py-1.5 px-2 rounded text-xs font-medium transition-all text-center min-h-[34px] ${
                                isSelected
                                  ? 'bg-blue-600 text-white shadow-sm font-semibold'
                                  : 'text-zinc-400 hover:text-white hover:bg-ide-panel'
                              }`}
                            >
                              {size} Spaces
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        When pressing Tab, exactly <strong className="text-white">{settings.editor.tabSize || 4} spaces</strong> are inserted or indented.
                      </p>
                    </div>

                    {/* Use Spaces Instead of Tab Character (Indentation Mode) */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-zinc-200 font-medium">
                          Use Spaces Instead of Tab Character
                        </label>
                        <span className="text-[11px] text-zinc-500 font-mono">
                          Default: Soft Tabs
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 bg-ide-subpanel p-1 rounded-lg border border-ide-border">
                        <button
                          type="button"
                          onClick={() => updateEditor('useSoftTabs', true)}
                          className={`py-1.5 px-2 rounded text-xs font-medium transition-all text-center min-h-[34px] ${
                            settings.editor.useSoftTabs !== false
                              ? 'bg-blue-600 text-white shadow-sm font-semibold'
                              : 'text-zinc-400 hover:text-white hover:bg-ide-panel'
                          }`}
                        >
                          Soft Tabs (Spaces)
                        </button>
                        <button
                          type="button"
                          onClick={() => updateEditor('useSoftTabs', false)}
                          className={`py-1.5 px-2 rounded text-xs font-medium transition-all text-center min-h-[34px] ${
                            settings.editor.useSoftTabs === false
                              ? 'bg-blue-600 text-white shadow-sm font-semibold'
                              : 'text-zinc-400 hover:text-white hover:bg-ide-panel'
                          }`}
                        >
                          Hard Tabs (Tab Character)
                        </button>
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        {settings.editor.useSoftTabs !== false
                          ? 'Soft Tabs: Tab key inserts spaces instead of tab characters.'
                          : `Hard Tabs: Tab key inserts a literal \\t character with ${settings.editor.tabSize || 4} column alignment.`}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Line Numbers */}
                  <label className="flex items-center justify-between p-3 rounded-lg bg-ide-panel border border-ide-border cursor-pointer">
                    <span className="font-medium text-white">Line Numbers</span>
                    <input
                      type="checkbox"
                      checked={settings.editor.lineNumbers}
                      onChange={(e) => updateEditor('lineNumbers', e.target.checked)}
                      className="rounded border-ide-border bg-ide-subpanel text-blue-500 focus:ring-0 w-4 h-4"
                    />
                  </label>

                  {/* Active Line Highlight */}
                  <label className="flex items-center justify-between p-3 rounded-lg bg-ide-panel border border-ide-border cursor-pointer">
                    <span className="font-medium text-white">Active Line Highlight</span>
                    <input
                      type="checkbox"
                      checked={settings.editor.activeLineHighlight ?? true}
                      onChange={(e) => updateEditor('activeLineHighlight', e.target.checked)}
                      className="rounded border-ide-border bg-ide-subpanel text-blue-500 focus:ring-0 w-4 h-4"
                    />
                  </label>

                  {/* Line Wrapping */}
                  <label className="flex items-center justify-between p-3 rounded-lg bg-ide-panel border border-ide-border cursor-pointer">
                    <div>
                      <span className="font-medium text-white block">Word Wrapping (Soft Wrap)</span>
                      <span className="text-[11px] text-zinc-400">Wrap long lines instead of horizontal scroll</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.editor.lineWrapping}
                      onChange={(e) => updateEditor('lineWrapping', e.target.checked)}
                      className="rounded border-ide-border bg-ide-subpanel text-blue-500 focus:ring-0 w-4 h-4"
                    />
                  </label>

                  {/* Auto Close Brackets */}
                  <label className="flex items-center justify-between p-3 rounded-lg bg-ide-panel border border-ide-border cursor-pointer">
                    <span className="font-medium text-white">Auto Close Brackets & Quotes</span>
                    <input
                      type="checkbox"
                      checked={settings.editor.autoCloseBrackets}
                      onChange={(e) => updateEditor('autoCloseBrackets', e.target.checked)}
                      className="rounded border-ide-border bg-ide-subpanel text-blue-500 focus:ring-0 w-4 h-4"
                    />
                  </label>

                  {/* Bracket Matching */}
                  <label className="flex items-center justify-between p-3 rounded-lg bg-ide-panel border border-ide-border cursor-pointer">
                    <span className="font-medium text-white">Bracket Matching Highlight</span>
                    <input
                      type="checkbox"
                      checked={settings.editor.bracketMatching ?? true}
                      onChange={(e) => updateEditor('bracketMatching', e.target.checked)}
                      className="rounded border-ide-border bg-ide-subpanel text-blue-500 focus:ring-0 w-4 h-4"
                    />
                  </label>

                  {/* Code Folding */}
                  <label className="flex items-center justify-between p-3 rounded-lg bg-ide-panel border border-ide-border cursor-pointer">
                    <span className="font-medium text-white">Code Folding in Gutters</span>
                    <input
                      type="checkbox"
                      checked={settings.editor.codeFolding ?? true}
                      onChange={(e) => updateEditor('codeFolding', e.target.checked)}
                      className="rounded border-ide-border bg-ide-subpanel text-blue-500 focus:ring-0 w-4 h-4"
                    />
                  </label>

                  {/* iPad Symbols Accessory Bar */}
                  <label className="flex items-center justify-between p-3 rounded-lg bg-ide-panel border border-ide-border cursor-pointer">
                    <div>
                      <span className="font-medium text-white block">iPad Symbols Accessory Bar</span>
                      <span className="text-[11px] text-zinc-400">Quick-tap brackets, operators and semicolons</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.editor.showAccessoryBar}
                      onChange={(e) => updateEditor('showAccessoryBar', e.target.checked)}
                      className="rounded border-ide-border bg-ide-subpanel text-blue-500 focus:ring-0 w-4 h-4"
                    />
                  </label>

                  {/* Cursor Style */}
                  <div className="p-3 rounded-lg bg-ide-panel border border-ide-border space-y-1">
                    <label className="text-zinc-300 font-medium block">Cursor Style</label>
                    <select
                      value={settings.editor.cursorStyle || 'line'}
                      onChange={(e) => updateEditor('cursorStyle', e.target.value)}
                      className="w-full bg-ide-subpanel border border-ide-border rounded p-2 text-white focus:outline-none"
                    >
                      <option value="line">Line Cursor (Standard)</option>
                      <option value="block">Block Cursor (Terminal Style)</option>
                      <option value="underline">Underline Cursor</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* 5. COMPILER SETTINGS */}
            {activeTab === 'compiler' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-ide-border">
                  <div>
                    <h3 className="text-sm font-semibold text-white">C/C++ Compiler Configuration</h3>
                    <p className="text-xs text-zinc-400">
                      Adjust language standard, optimization flags, and compilation timeouts for the local WebAssembly toolchain.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={resetCompilerSettings}
                    title="Reset Compiler settings to defaults"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-ide-panel hover:bg-ide-hover border border-ide-border text-zinc-300 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
                    <span>Reset Section</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="text-zinc-400 block mb-1">Default Language</label>
                    <select
                      value={settings.compiler.language}
                      onChange={(e) => updateCompiler('language', e.target.value)}
                      className="w-full bg-ide-panel border border-ide-border rounded-lg p-2.5 text-white focus:outline-none"
                    >
                      <option value="cpp">C++</option>
                      <option value="c">C</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-zinc-400 block mb-1">Standard</label>
                    <select
                      value={settings.compiler.standard}
                      onChange={(e) => updateCompiler('standard', e.target.value)}
                      className="w-full bg-ide-panel border border-ide-border rounded-lg p-2.5 text-white focus:outline-none"
                    >
                      {settings.compiler.language === 'cpp' ? (
                        <>
                          <option value="c++17">C++17 (Recommended default)</option>
                          <option value="c++20">C++20</option>
                        </>
                      ) : (
                        <>
                          <option value="c11">C11 (Recommended default)</option>
                          <option value="c17">C17</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="text-zinc-400 block mb-1">Optimization Level</label>
                    <select
                      value={settings.compiler.optimization}
                      onChange={(e) => updateCompiler('optimization', e.target.value)}
                      className="w-full bg-ide-panel border border-ide-border rounded-lg p-2.5 text-white focus:outline-none"
                    >
                      <option value="O0">-O0 (Fast Compile / Debug)</option>
                      <option value="O1">-O1 (Balanced)</option>
                      <option value="O2">-O2 (Fast Execution / CP Standard)</option>
                      <option value="O3">-O3 (Aggressive Optimization)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-zinc-400 block mb-1">Compiler Warnings</label>
                    <select
                      value={settings.compiler.warnings ? 'true' : 'false'}
                      onChange={(e) => updateCompiler('warnings', e.target.value === 'true')}
                      className="w-full bg-ide-panel border border-ide-border rounded-lg p-2.5 text-white focus:outline-none"
                    >
                      <option value="true">Enable (-Wall -Wextra)</option>
                      <option value="false">Minimal Warnings</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-zinc-400 block mb-1">Compilation Timeout</label>
                    <select
                      value={settings.compiler.compileTimeoutMs || 180000}
                      onChange={(e) => updateCompiler('compileTimeoutMs', parseInt(e.target.value, 10))}
                      className="w-full bg-ide-panel border border-ide-border rounded-lg p-2.5 text-white focus:outline-none"
                    >
                      <option value={30000}>30 seconds</option>
                      <option value={60000}>60 seconds</option>
                      <option value={120000}>120 seconds</option>
                      <option value={180000}>180 seconds (Default / Standard CP)</option>
                      <option value={300000}>300 seconds (Large DP Arrays / Extended)</option>
                    </select>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      Independent safety limit for Clang compilation and linking.
                    </p>
                  </div>

                  <div>
                    <label className="text-zinc-400 block mb-1">WASM Initial Memory</label>
                    <select
                      value={settings.compiler.initialMemoryMb || 128}
                      onChange={(e) => updateCompiler('initialMemoryMb', parseInt(e.target.value, 10))}
                      className="w-full bg-ide-panel border border-ide-border rounded-lg p-2.5 text-white focus:outline-none"
                    >
                      <option value={64}>64 MB (1,024 pages)</option>
                      <option value={128}>128 MB (2,048 pages - Default)</option>
                      <option value={256}>256 MB (4,096 pages - Massive Arrays)</option>
                    </select>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      Initial WebAssembly linear memory allocated for globals, BSS, and stack.
                    </p>
                  </div>

                  <div>
                    <label className="text-zinc-400 block mb-1">WASM Maximum Memory</label>
                    <select
                      value={settings.compiler.maxMemoryMb || 256}
                      onChange={(e) => updateCompiler('maxMemoryMb', parseInt(e.target.value, 10))}
                      className="w-full bg-ide-panel border border-ide-border rounded-lg p-2.5 text-white focus:outline-none"
                    >
                      <option value={128}>128 MB (2,048 pages)</option>
                      <option value={256}>256 MB (4,096 pages - Default)</option>
                      <option value={512}>512 MB (8,192 pages - High Memory)</option>
                    </select>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      Ceiling on dynamic heap growth via WebAssembly memory.grow.
                    </p>
                  </div>

                  <div>
                    <label className="text-zinc-400 block mb-1">WASM Stack Size</label>
                    <select
                      value={settings.compiler.stackSizeMb || 16}
                      onChange={(e) => updateCompiler('stackSizeMb', parseInt(e.target.value, 10))}
                      className="w-full bg-ide-panel border border-ide-border rounded-lg p-2.5 text-white focus:outline-none"
                    >
                      <option value={8}>8 MB (128 pages)</option>
                      <option value={16}>16 MB (256 pages - Default)</option>
                      <option value={32}>32 MB (512 pages - Deep Recursion)</option>
                    </select>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      Reserved stack size for local call frames and deep recursion.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 6. EXECUTION & SAFETY */}
            {activeTab === 'execution' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-ide-border">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Execution Safety & Watchdog</h3>
                    <p className="text-xs text-zinc-400">
                      Pocket C++ executes programs inside an isolated Web Worker protected by a hard watchdog timer. Runaway loops are forcibly terminated.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={resetExecutionSettings}
                    title="Reset Execution settings to defaults"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-ide-panel hover:bg-ide-hover border border-ide-border text-zinc-300 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
                    <span>Reset Section</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-lg bg-ide-panel border border-ide-border space-y-2">
                    <label className="font-semibold text-white block">Execution Time Limit (Watchdog)</label>
                    <select
                      value={settings.execution.timeLimitMs}
                      onChange={(e) => updateExecution('timeLimitMs', parseInt(e.target.value, 10))}
                      className="w-full bg-ide-subpanel border border-ide-border rounded p-2 text-white focus:outline-none"
                    >
                      <option value={1000}>1 second</option>
                      <option value={3000}>3 seconds</option>
                      <option value={5000}>5 seconds (Default)</option>
                      <option value={10000}>10 seconds</option>
                      <option value={15000}>15 seconds</option>
                      <option value={30000}>30 seconds</option>
                    </select>
                    <p className="text-[11px] text-zinc-400">
                      When exceeded, Worker.terminate() forcibly ends execution without freezing the editor.
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-ide-panel border border-ide-border space-y-2">
                    <label className="font-semibold text-white block">Max Console Output Limit</label>
                    <select
                      value={settings.execution.outputLimitBytes}
                      onChange={(e) => updateExecution('outputLimitBytes', parseInt(e.target.value, 10))}
                      className="w-full bg-ide-subpanel border border-ide-border rounded p-2 text-white focus:outline-none"
                    >
                      <option value={262144}>256 KB</option>
                      <option value={524288}>512 KB</option>
                      <option value={1048576}>1 MB (Default)</option>
                      <option value={2097152}>2 MB</option>
                    </select>
                    <p className="text-[11px] text-zinc-400">
                      Prevents infinite output loops (e.g. while(true) cout) from consuming browser memory.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 7. STORAGE & OFFLINE */}
            {activeTab === 'storage' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-white">Storage & Offline Status</h3>
                  <p className="text-xs text-zinc-400">
                    Verify local offline readiness, browser quota, and IndexedDB database persistence.
                  </p>
                </div>

                {storageInfo && (
                  <div className="p-4 rounded-lg bg-ide-panel border border-ide-border space-y-2 text-xs">
                    <span className="font-semibold text-white block">iPad Storage Availability</span>
                    <p className="text-zinc-300">
                      Used: <strong className="text-white">{storageInfo.usageMb} MB</strong> / {storageInfo.quotaMb} MB ({storageInfo.percent}%)
                    </p>
                    {storageInfo.isPersistent && (
                      <span className="inline-block text-emerald-400 font-semibold text-[11px]">
                        ✓ Persistent Storage Mode active (protected against automatic Safari eviction)
                      </span>
                    )}
                  </div>
                )}

                <div className="p-4 rounded-lg bg-ide-subpanel border border-ide-border flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-white block">Offline Compiler Management</span>
                    <span className="text-[11px] text-zinc-400">
                      Check cached assets (~105 MB) or trigger re-download for 100% offline usage.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenCompilerSetup?.();
                    }}
                    className="px-3 py-2 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors min-h-[38px]"
                  >
                    Manage Offline Assets
                  </button>
                </div>
              </div>
            )}

            {/* 8. DEVELOPER & ABOUT */}
            {activeTab === 'developer' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-white">About & Developer Profile</h3>
                  <p className="text-xs text-zinc-400">
                    Pocket C++ IDE personal signature and developer identification.
                  </p>
                </div>

                <div className="p-6 rounded-xl bg-ide-panel border border-ide-border space-y-5">
                  {/* Developer Photograph Portrait */}
                  <div className="flex flex-col items-center justify-center pt-1">
                    <div className="relative group">
                      {/* Subtle ambient halo */}
                      <div className="absolute -inset-1.5 rounded-full bg-gradient-to-tr from-blue-600/35 via-indigo-500/25 to-emerald-500/30 blur-md opacity-80 group-hover:opacity-100 transition-opacity" />

                      {/* Circular portrait container */}
                      <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-2 border-blue-500/50 ring-4 ring-blue-500/10 shadow-2xl bg-zinc-900 flex items-center justify-center">
                        {!devImgError ? (
                          <img
                            src="/images/developer/image.jpeg"
                            alt="Minhajul Islam"
                            className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                            onError={() => setDevImgError(true)}
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 bg-zinc-900">
                            <User className="w-10 h-10 text-zinc-500" />
                            <span className="text-[10px] text-zinc-500 mt-1">Photo unavailable</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <h4 className="text-2xl font-bold text-white tracking-tight">
                        Minhajul Islam
                      </h4>
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-blue-400 bg-blue-950/60 px-2.5 py-0.5 rounded-full border border-blue-800/60">
                        <Sparkles className="w-3 h-3" />
                        Developer
                      </span>
                    </div>
                    <div className="flex items-center justify-center gap-1.5 text-xs text-zinc-300">
                      <GraduationCap className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>CSE, Daffodil International University</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-ide-subpanel border border-ide-border text-xs text-zinc-300 flex items-center justify-between">
                    <span className="text-zinc-400">Development Tool:</span>
                    <span className="font-semibold text-white px-2 py-0.5 rounded bg-ide-panel border border-ide-border text-[11px]">
                      Developed with Antigravity
                    </span>
                  </div>

                  <div className="space-y-2 pt-2">
                    <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">
                      Social Profiles
                    </span>

                    <a
                      href="https://github.com/Minhajulcse"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-lg bg-ide-subpanel hover:bg-ide-hover border border-ide-border transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-white">
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                          </svg>
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-white block group-hover:text-blue-400">
                            GitHub
                          </span>
                          <span className="text-[11px] font-mono text-zinc-400">@Minhajulcse</span>
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-zinc-500 group-hover:text-blue-400" />
                    </a>

                    <a
                      href="https://codeforces.com/profile/NoObMin"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-lg bg-ide-subpanel hover:bg-ide-hover border border-ide-border transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center">
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                            <rect x="2.5" y="11" width="4.5" height="10" rx="1.5" fill="#facc15" />
                            <rect x="9.5" y="5" width="4.5" height="16" rx="1.5" fill="#3b82f6" />
                            <rect x="16.5" y="8" width="4.5" height="13" rx="1.5" fill="#ef4444" />
                          </svg>
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-white block group-hover:text-blue-400">
                            Codeforces
                          </span>
                          <span className="text-[11px] font-mono text-zinc-400">@NoObMin</span>
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-zinc-500 group-hover:text-blue-400" />
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 bg-ide-subpanel border-t border-ide-border flex-shrink-0">
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-colors min-h-[38px]"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
            <span>Reset All Settings</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors min-h-[38px]"
          >
            Done
          </button>
        </div>

        {/* Reset All Settings Confirmation Dialog */}
        {showResetConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="bg-ide-panel border border-ide-border rounded-xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 flex-shrink-0">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">
                    Reset all settings to default values?
                  </h3>
                  <span className="text-xs text-rose-400 font-medium">Action will restore default preferences</span>
                </div>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed bg-ide-subpanel p-3.5 rounded-lg border border-ide-border">
                This will restore your editor appearance, typography, indentation, workspace layout, and application preferences to their default values. Your saved source code and projects will not be deleted.
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="px-4 py-2 text-xs font-medium rounded-lg bg-ide-subpanel hover:bg-ide-hover border border-ide-border text-zinc-300 transition-colors min-h-[38px]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleResetAll}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 transition-colors min-h-[38px] flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Settings</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Toast Notification */}
        {notification && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-950/95 border border-emerald-500/80 text-emerald-200 text-xs font-medium shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200">
            <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{notification}</span>
          </div>
        )}
      </div>
    </div>
  );
};
