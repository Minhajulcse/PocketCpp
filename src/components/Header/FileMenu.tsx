import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, FilePlus, Save, Download, Folder, Trash2, User, RotateCcw } from 'lucide-react';
import { SourceFile } from '../../services/storage';

interface FileMenuProps {
  files: SourceFile[];
  activeFileId: string;
  onSelectFile: (id: string) => void;
  onNewFile: () => void;
  onSaveFile: () => void;
  onExportFile: () => void;
  onOpenProjects: () => void;
  onDeleteFile: (id: string) => void;
  onOpenDeveloper?: () => void;
  onResetLayout?: () => void;
}

export const FileMenu: React.FC<FileMenuProps> = ({
  files,
  activeFileId,
  onSelectFile,
  onNewFile,
  onSaveFile,
  onExportFile,
  onOpenProjects,
  onDeleteFile,
  onOpenDeveloper,
  onResetLayout,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded hover:bg-ide-hover text-zinc-300 hover:text-white transition-colors min-h-[36px]"
      >
        <span>File</span>
        <ChevronDown className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1 w-56 bg-ide-panel border border-ide-border rounded-lg shadow-2xl py-1.5 z-50 text-xs">
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onNewFile();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-ide-hover text-zinc-200 min-h-[36px]"
          >
            <FilePlus className="w-4 h-4 text-blue-400" />
            <span>New File...</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onSaveFile();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-ide-hover text-zinc-200 min-h-[36px]"
          >
            <Save className="w-4 h-4 text-emerald-400" />
            <span>Save (⌘S)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onExportFile();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-ide-hover text-zinc-200 min-h-[36px]"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Export File</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onOpenProjects();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-ide-hover text-zinc-200 min-h-[36px]"
          >
            <Folder className="w-4 h-4 text-purple-400" />
            <span>Project Manager...</span>
          </button>

          {onResetLayout && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onResetLayout();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-ide-hover text-zinc-200 min-h-[36px]"
            >
              <RotateCcw className="w-4 h-4 text-cyan-400" />
              <span>Reset Layout (65/35)</span>
            </button>
          )}

          {onOpenDeveloper && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenDeveloper();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-ide-hover text-zinc-200 min-h-[36px]"
            >
              <User className="w-4 h-4 text-pink-400" />
              <span>Developer Profile...</span>
            </button>
          )}

          <div className="my-1 border-t border-ide-border" />
          <div className="px-3 py-1 text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
            Project Files
          </div>

          <div className="max-h-48 overflow-auto">
            {files.map((file) => (
              <div
                key={file.id}
                className={`flex items-center justify-between px-3 py-1.5 hover:bg-ide-hover cursor-pointer ${
                  file.id === activeFileId ? 'bg-ide-subpanel text-blue-400 font-semibold' : 'text-zinc-300'
                }`}
                onClick={() => {
                  setIsOpen(false);
                  onSelectFile(file.id);
                }}
              >
                <span className="truncate flex-1">{file.name}</span>
                {files.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteFile(file.id);
                    }}
                    title="Delete File"
                    className="p-1 rounded text-zinc-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
