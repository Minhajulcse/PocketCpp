import React, { useState } from 'react';
import { X, FileCode, Plus } from 'lucide-react';
import { CP_TEMPLATE_CPP, HELLO_WORLD_CPP, STANDARD_C, VECTOR_SORT_CPP } from '../../services/templates';

interface NewFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFile: (name: string, content: string, language: 'cpp' | 'c') => void;
}

export const NewFileModal: React.FC<NewFileModalProps> = ({
  isOpen,
  onClose,
  onCreateFile,
}) => {
  const [filename, setFilename] = useState('solution.cpp');
  const [template, setTemplate] = useState<'cp' | 'hello' | 'c' | 'vector' | 'empty'>('cp');

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = filename.trim() || 'solution.cpp';
    const isC = cleanName.endsWith('.c');
    let content = '';

    if (template === 'cp') content = CP_TEMPLATE_CPP;
    else if (template === 'hello') content = HELLO_WORLD_CPP;
    else if (template === 'c') content = STANDARD_C;
    else if (template === 'vector') content = VECTOR_SORT_CPP;

    onCreateFile(cleanName, content, isC ? 'c' : 'cpp');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="bg-ide-panel border border-ide-border rounded-lg w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-ide-subpanel border-b border-ide-border">
          <div className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-semibold text-white">New File</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-ide-hover transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleCreate} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-zinc-300 block mb-1">
              File Name (e.g. solution.cpp, main.c, helper.h)
            </label>
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="filename.cpp"
              autoFocus
              className="w-full bg-ide-subpanel border border-ide-border rounded p-2.5 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-300 block mb-1">
              Starter Template
            </label>
            <div className="grid grid-cols-1 gap-2 text-xs">
              <label className="flex items-center gap-2.5 p-2 rounded bg-ide-subpanel border border-ide-border cursor-pointer hover:bg-ide-hover">
                <input
                  type="radio"
                  name="template"
                  checked={template === 'cp'}
                  onChange={() => setTemplate('cp')}
                  className="text-blue-500 focus:ring-0"
                />
                <div>
                  <span className="font-semibold text-white block">Competitive Programming C++</span>
                  <span className="text-zinc-400 text-[11px]">Includes &lt;bits/stdc++.h&gt; and fast I/O setup</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-2 rounded bg-ide-subpanel border border-ide-border cursor-pointer hover:bg-ide-hover">
                <input
                  type="radio"
                  name="template"
                  checked={template === 'hello'}
                  onChange={() => setTemplate('hello')}
                  className="text-blue-500 focus:ring-0"
                />
                <div>
                  <span className="font-semibold text-white block">Standard C++ Hello World</span>
                  <span className="text-zinc-400 text-[11px]">Standard &lt;iostream&gt; starter</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-2 rounded bg-ide-subpanel border border-ide-border cursor-pointer hover:bg-ide-hover">
                <input
                  type="radio"
                  name="template"
                  checked={template === 'c'}
                  onChange={() => setTemplate('c')}
                  className="text-blue-500 focus:ring-0"
                />
                <div>
                  <span className="font-semibold text-white block">Standard C Starter</span>
                  <span className="text-zinc-400 text-[11px]">Includes &lt;stdio.h&gt; with scanf/printf</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-2 rounded bg-ide-subpanel border border-ide-border cursor-pointer hover:bg-ide-hover">
                <input
                  type="radio"
                  name="template"
                  checked={template === 'empty'}
                  onChange={() => setTemplate('empty')}
                  className="text-blue-500 focus:ring-0"
                />
                <div>
                  <span className="font-semibold text-white block">Empty File</span>
                  <span className="text-zinc-400 text-[11px]">Blank slate</span>
                </div>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-ide-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded bg-ide-panel hover:bg-ide-hover border border-ide-border text-zinc-300 min-h-[38px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded bg-ide-accent hover:bg-ide-accentHover text-white min-h-[38px]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create File</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
