import { describe, it, expect, vi } from 'vitest';
import { EditorState, Compartment, Extension } from '@codemirror/state';
import { indentUnit, getIndentUnit } from '@codemirror/language';
import { indentMore, indentLess } from '@codemirror/commands';

// In-memory mock for IndexedDB
const memoryStores: Record<string, Map<string, any>> = {
  projects: new Map(),
  files: new Map(),
  settings: new Map(),
  testCases: new Map(),
  recovery: new Map(),
};

vi.mock('idb', () => ({
  openDB: vi.fn().mockResolvedValue({
    get: vi.fn(async (store: string, key: string) => {
      return memoryStores[store]?.get(key);
    }),
    put: vi.fn(async (store: string, val: any, customKey?: string) => {
      const k = customKey || val.id || 'user_settings';
      memoryStores[store]?.set(k, val);
      return k;
    }),
    getAll: vi.fn(async (store: string) => {
      return Array.from(memoryStores[store]?.values() || []);
    }),
    getAllFromIndex: vi.fn(async (store: string, _index: string, val: string) => {
      const items = Array.from(memoryStores[store]?.values() || []);
      return items.filter((item: any) => item.projectId === val || item.fileId === val);
    }),
    delete: vi.fn(async (store: string, key: string) => {
      memoryStores[store]?.delete(key);
    }),
  }),
}));

import {
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  resetAllSettings,
  saveProject,
  getProjects,
  saveFile,
  getFiles,
  Settings,
} from '../src/services/storage';

// Helper to replicate the CodeMirror Tab command used in CodeEditor
function createTabHandler(tabSize: number, useSoftTabs: boolean) {
  return (view: { state: EditorState; dispatch: (tr: any) => void }) => {
    const hasSelection = view.state.selection.ranges.some(
      (r) => !r.empty || view.state.doc.lineAt(r.from).number !== view.state.doc.lineAt(r.to).number
    );
    if (hasSelection) {
      return indentMore(view);
    }
    const indentStr = useSoftTabs ? ' '.repeat(tabSize) : '\t';
    view.dispatch(
      view.state.update(view.state.replaceSelection(indentStr), {
        scrollIntoView: true,
        userEvent: 'input',
      })
    );
    return true;
  };
}

function createMockEditor(tabSize: number, useSoftTabs: boolean, initialDoc = '', selection = { anchor: 0, head: 0 }) {
  const indentCompartment = new Compartment();
  const getIndentExtensions = (size: number, soft: boolean): Extension[] => [
    EditorState.tabSize.of(size),
    indentUnit.of(soft ? ' '.repeat(size) : '\t'),
  ];

  let state = EditorState.create({
    doc: initialDoc,
    selection,
    extensions: [indentCompartment.of(getIndentExtensions(tabSize, useSoftTabs))],
  });

  let currentTabSize = tabSize;
  let currentUseSoftTabs = useSoftTabs;

  const view = {
    get state() {
      return state;
    },
    dispatch(tr: any) {
      state = tr.state || state.update(tr).state;
    },
    pressTab() {
      createTabHandler(currentTabSize, currentUseSoftTabs)(view);
    },
    pressShiftTab() {
      indentLess(view);
    },
    reconfigure(newSize: number, newSoft: boolean) {
      currentTabSize = newSize;
      currentUseSoftTabs = newSoft;
      view.dispatch({
        effects: indentCompartment.reconfigure(getIndentExtensions(newSize, newSoft)),
      });
    },
  };

  return view;
}

describe('Pocket C++ IDE — CodeMirror Indentation & Tab Size Verification', () => {
  it('Test A: 2 Spaces — Tab key inserts exactly 2 spaces', () => {
    const editor = createMockEditor(2, true, '');
    editor.pressTab();
    expect(editor.state.doc.toString()).toBe('  ');
    expect(editor.state.doc.toString().length).toBe(2);
    expect(getIndentUnit(editor.state)).toBe(2);
  });

  it('Test B: 4 Spaces (Default) — Tab key inserts exactly 4 spaces', () => {
    const editor = createMockEditor(4, true, '');
    editor.pressTab();
    expect(editor.state.doc.toString()).toBe('    ');
    expect(editor.state.doc.toString().length).toBe(4);
    expect(getIndentUnit(editor.state)).toBe(4);
  });

  it('Test C: 6 Spaces — Tab key inserts exactly 6 spaces', () => {
    const editor = createMockEditor(6, true, '');
    editor.pressTab();
    expect(editor.state.doc.toString()).toBe('      ');
    expect(editor.state.doc.toString().length).toBe(6);
    expect(getIndentUnit(editor.state)).toBe(6);
  });

  it('Test D: 8 Spaces — Tab key inserts exactly 8 spaces', () => {
    const editor = createMockEditor(8, true, '');
    editor.pressTab();
    expect(editor.state.doc.toString()).toBe('        ');
    expect(editor.state.doc.toString().length).toBe(8);
    expect(getIndentUnit(editor.state)).toBe(8);
  });

  it('Test E: Multiline Indentation — Selecting multiple lines indents all lines by selected spaces', () => {
    const initialText = 'int a = 1;\nint b = 2;\nint c = 3;';
    const editor = createMockEditor(2, true, initialText, { anchor: 0, head: initialText.length });
    editor.pressTab();
    expect(editor.state.doc.toString()).toBe('  int a = 1;\n  int b = 2;\n  int c = 3;');

    // Test with 4 spaces on another multiline block
    const editor4 = createMockEditor(4, true, initialText, { anchor: 0, head: initialText.length });
    editor4.pressTab();
    expect(editor4.state.doc.toString()).toBe('    int a = 1;\n    int b = 2;\n    int c = 3;');
  });

  it('Test F: Outdent (Shift+Tab) — Successfully outdents multiple indented lines', () => {
    const indentedText = '    int a = 1;\n    int b = 2;';
    const editor = createMockEditor(4, true, indentedText, { anchor: 0, head: indentedText.length });
    editor.pressShiftTab();
    expect(editor.state.doc.toString()).toBe('int a = 1;\nint b = 2;');
  });

  it('Test J: Hard Tabs Mode — Inserts literal tab character \\t', () => {
    const editor = createMockEditor(4, false, '');
    editor.pressTab();
    expect(editor.state.doc.toString()).toBe('\t');

    // Multiline with Hard Tabs
    const multiline = 'line1\nline2';
    const editorMulti = createMockEditor(4, false, multiline, { anchor: 0, head: multiline.length });
    editorMulti.pressTab();
    expect(editorMulti.state.doc.toString()).toBe('\tline1\n\tline2');
  });

  it('Test Dynamic Reconfiguration — Switches tab size from 4 to 2 to 8 without losing text', () => {
    const editor = createMockEditor(4, true, 'hello');
    expect(getIndentUnit(editor.state)).toBe(4);

    editor.reconfigure(2, true);
    expect(getIndentUnit(editor.state)).toBe(2);
    expect(editor.state.doc.toString()).toBe('hello');

    editor.reconfigure(8, true);
    expect(getIndentUnit(editor.state)).toBe(8);
    expect(editor.state.doc.toString()).toBe('hello');
  });
});

describe('Pocket C++ IDE — Settings Persistence & Reset Verification', () => {
  it('Test G: Persistence — Persists custom tab size and indentation settings in storage', async () => {
    const customSettings: Settings = {
      ...DEFAULT_SETTINGS,
      editor: {
        ...DEFAULT_SETTINGS.editor,
        tabSize: 2,
        useSoftTabs: false,
      },
    };

    await saveSettings(customSettings);
    const loaded = await loadSettings();

    expect(loaded.editor.tabSize).toBe(2);
    expect(loaded.editor.useSoftTabs).toBe(false);
  });

  it('Test H: Reset — Restores all settings to default values', async () => {
    // Apply multiple customized settings
    const modified: Settings = {
      editor: {
        ...DEFAULT_SETTINGS.editor,
        themeId: 'dracula',
        fontFamily: 'Fira Code',
        fontSize: 18,
        lineHeight: 1.8,
        fontWeight: '700',
        fontLigatures: true,
        tabSize: 8,
        useSoftTabs: false,
        lineWrapping: true,
      },
      layout: {
        editorWidthPercent: 80,
        inputHeightPercent: 55,
      },
      compiler: {
        ...DEFAULT_SETTINGS.compiler,
        optimization: 'O3',
      },
      execution: {
        ...DEFAULT_SETTINGS.execution,
        timeLimitMs: 10000,
      },
    };

    await saveSettings(modified);
    const loadedModified = await loadSettings();
    expect(loadedModified.editor.tabSize).toBe(8);
    expect(loadedModified.editor.themeId).toBe('dracula');

    // Reset all settings
    const resetResult = await resetAllSettings();
    expect(resetResult.editor.themeId).toBe('one-dark');
    expect(resetResult.editor.fontFamily).toBe('JetBrains Mono');
    expect(resetResult.editor.fontSize).toBe(14);
    expect(resetResult.editor.lineHeight).toBe(1.6);
    expect(resetResult.editor.fontLigatures).toBe(false);
    expect(resetResult.editor.tabSize).toBe(4);
    expect(resetResult.editor.useSoftTabs).toBe(true);
    expect(resetResult.layout.editorWidthPercent).toBe(65);
    expect(resetResult.layout.inputHeightPercent).toBe(40);

    const reloaded = await loadSettings();
    expect(reloaded.editor.tabSize).toBe(4);
    expect(reloaded.editor.themeId).toBe('one-dark');
  });

  it('Test I: Data Preservation — Resetting settings never deletes projects or source files', async () => {
    // 1. Create a project and source file
    const sampleProject = {
      id: 'user-project-99',
      name: 'Important CP Solutions',
      activeFileId: 'user-file-99',
      updatedAt: Date.now(),
    };
    await saveProject(sampleProject);

    const sampleFile = {
      id: 'user-file-99',
      projectId: 'user-project-99',
      name: 'segment_tree.cpp',
      content: '#include <iostream>\nint main() { return 0; }',
      language: 'cpp' as const,
      updatedAt: Date.now(),
    };
    await saveFile(sampleFile);

    // 2. Perform Reset All Settings
    await resetAllSettings();

    // 3. Verify project and file still exist intact
    const projects = await getProjects();
    const foundProject = projects.find((p) => p.id === sampleProject.id);
    expect(foundProject).toBeDefined();
    expect(foundProject?.name).toBe('Important CP Solutions');

    const files = await getFiles(sampleProject.id);
    const foundFile = files.find((f) => f.id === sampleFile.id);
    expect(foundFile).toBeDefined();
    expect(foundFile?.content).toBe(sampleFile.content);
  });
});
