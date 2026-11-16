import { openDB, DBSchema, IDBPDatabase } from 'idb';
import JSZip from 'jszip';

export interface SourceFile {
  id: string;
  projectId: string;
  name: string;
  content: string;
  language: 'cpp' | 'c';
  updatedAt: number;
}

export interface Project {
  id: string;
  name: string;
  activeFileId: string;
  updatedAt: number;
}

export interface TestCase {
  id: string;
  fileId: string;
  name: string;
  input: string;
  expectedOutput: string;
}

export interface Settings {
  editor: {
    themeId: string;
    fontFamily: string;
    fontSize: number;
    lineHeight: number;
    fontWeight: string;
    fontLigatures: boolean;
    letterSpacing: number;
    tabSize: number;
    useSoftTabs: boolean;
    lineWrapping: boolean;
    lineNumbers: boolean;
    activeLineHighlight: boolean;
    indentationGuides: boolean;
    bracketMatching: boolean;
    autoCloseBrackets: boolean;
    autoIndent: boolean;
    codeFolding: boolean;
    smoothScrolling: boolean;
    cursorStyle: 'line' | 'block' | 'underline';
    showAccessoryBar: boolean;
  };
  layout: {
    editorWidthPercent: number;
    inputHeightPercent: number;
  };
  compiler: {
    language: 'cpp' | 'c';
    standard: 'c++17' | 'c++20' | 'c11' | 'c17';
    optimization: 'O0' | 'O1' | 'O2' | 'O3';
    warnings: boolean;
    compileTimeoutMs: number;
    initialMemoryMb?: number;
    maxMemoryMb?: number;
    stackSizeMb?: number;
  };
  execution: {
    timeLimitMs: number;
    memoryLimitMb: number;
    outputLimitBytes: number;
  };
}

export interface RecoverySnapshot {
  fileId: string;
  content: string;
  input: string;
  timestamp: number;
}

interface PocketCppDB extends DBSchema {
  files: {
    key: string;
    value: SourceFile;
    indexes: { 'by-project': string };
  };
  projects: {
    key: string;
    value: Project;
  };
  settings: {
    key: string;
    value: any;
  };
  testCases: {
    key: string;
    value: TestCase;
    indexes: { 'by-file': string };
  };
  recovery: {
    key: string;
    value: RecoverySnapshot;
  };
}

const DB_NAME = 'pocket-cpp-ide-db';
const DB_VERSION = 1;

export const DEFAULT_SETTINGS: Settings = {
  editor: {
    themeId: 'one-dark',
    fontFamily: 'JetBrains Mono',
    fontSize: 14,
    lineHeight: 1.6,
    fontWeight: '400',
    fontLigatures: false,
    letterSpacing: 0,
    tabSize: 4,
    useSoftTabs: true,
    lineWrapping: false,
    lineNumbers: true,
    activeLineHighlight: true,
    indentationGuides: true,
    bracketMatching: true,
    autoCloseBrackets: true,
    autoIndent: true,
    codeFolding: true,
    smoothScrolling: true,
    cursorStyle: 'line',
    showAccessoryBar: true,
  },
  layout: {
    editorWidthPercent: 65,
    inputHeightPercent: 40,
  },
  compiler: {
    language: 'cpp',
    standard: 'c++17',
    optimization: 'O2',
    warnings: true,
    compileTimeoutMs: 180000,
    initialMemoryMb: 128,
    maxMemoryMb: 256,
    stackSizeMb: 16,
  },
  execution: {
    timeLimitMs: 5000,
    memoryLimitMb: 256,
    outputLimitBytes: 1048576, // 1 MB
  },
};

let dbPromise: Promise<IDBPDatabase<PocketCppDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<PocketCppDB>> {
  if (!dbPromise) {
    dbPromise = openDB<PocketCppDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('projects')) {
          db.createObjectStore('projects', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('files')) {
          const fileStore = db.createObjectStore('files', { keyPath: 'id' });
          fileStore.createIndex('by-project', 'projectId');
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }
        if (!db.objectStoreNames.contains('testCases')) {
          const testStore = db.createObjectStore('testCases', { keyPath: 'id' });
          testStore.createIndex('by-file', 'fileId');
        }
        if (!db.objectStoreNames.contains('recovery')) {
          db.createObjectStore('recovery', { keyPath: 'fileId' });
        }
      },
    });
  }
  return dbPromise;
}

// File Operations
export async function getFiles(projectId: string): Promise<SourceFile[]> {
  const db = await getDB();
  return db.getAllFromIndex('files', 'by-project', projectId);
}

export async function getFile(id: string): Promise<SourceFile | undefined> {
  const db = await getDB();
  return db.get('files', id);
}

export async function saveFile(file: SourceFile): Promise<void> {
  const db = await getDB();
  await db.put('files', { ...file, updatedAt: Date.now() });
}

export async function deleteFile(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('files', id);
  // Also delete test cases for this file
  const testCases = await db.getAllFromIndex('testCases', 'by-file', id);
  for (const tc of testCases) {
    await db.delete('testCases', tc.id);
  }
}

// Project Operations
export async function getProjects(): Promise<Project[]> {
  const db = await getDB();
  return db.getAll('projects');
}

export async function getProject(id: string): Promise<Project | undefined> {
  const db = await getDB();
  return db.get('projects', id);
}

export async function saveProject(project: Project): Promise<void> {
  const db = await getDB();
  await db.put('projects', { ...project, updatedAt: Date.now() });
}

export async function deleteProject(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('projects', id);
  const files = await db.getAllFromIndex('files', 'by-project', id);
  for (const f of files) {
    await deleteFile(f.id);
  }
}

// Settings Operations
export async function loadSettings(): Promise<Settings> {
  const db = await getDB();
  const saved = await db.get('settings', 'user_settings');
  if (!saved) return DEFAULT_SETTINGS;
  return {
    editor: { ...DEFAULT_SETTINGS.editor, ...saved.editor },
    layout: { ...DEFAULT_SETTINGS.layout, ...saved.layout },
    compiler: { ...DEFAULT_SETTINGS.compiler, ...saved.compiler },
    execution: { ...DEFAULT_SETTINGS.execution, ...saved.execution },
  };
}

export async function saveSettings(settings: Settings): Promise<void> {
  const db = await getDB();
  await db.put('settings', settings, 'user_settings');
}

export async function resetAllSettings(): Promise<Settings> {
  const db = await getDB();
  await db.put('settings', DEFAULT_SETTINGS, 'user_settings');
  return DEFAULT_SETTINGS;
}

// Test Cases Operations
export async function getTestCases(fileId: string): Promise<TestCase[]> {
  const db = await getDB();
  return db.getAllFromIndex('testCases', 'by-file', fileId);
}

export async function saveTestCase(testCase: TestCase): Promise<void> {
  const db = await getDB();
  await db.put('testCases', testCase);
}

export async function deleteTestCase(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('testCases', id);
}

// Recovery Snapshot
export async function saveRecoverySnapshot(snapshot: RecoverySnapshot): Promise<void> {
  const db = await getDB();
  await db.put('recovery', snapshot);
}

export async function getRecoverySnapshot(fileId: string): Promise<RecoverySnapshot | undefined> {
  const db = await getDB();
  return db.get('recovery', fileId);
}

export async function clearRecoverySnapshot(fileId: string): Promise<void> {
  const db = await getDB();
  await db.delete('recovery', fileId);
}

// Export / Import
export function exportFileAsDownload(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportProjectAsZip(project: Project): Promise<void> {
  const db = await getDB();
  const files = await db.getAllFromIndex('files', 'by-project', project.id);
  const zip = new JSZip();

  for (const f of files) {
    zip.file(f.name, f.content);
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.name.toLowerCase().replace(/\s+/g, '_')}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
