import React, { useState } from 'react';
import { X, Folder, Plus, Download, Trash2, Check } from 'lucide-react';
import { Project, exportProjectAsZip } from '../../services/storage';

interface ProjectManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  activeProjectId: string;
  onSelectProject: (id: string) => void;
  onCreateProject: (name: string) => void;
  onDeleteProject: (id: string) => void;
}

export const ProjectManagerModal: React.FC<ProjectManagerModalProps> = ({
  isOpen,
  onClose,
  projects,
  activeProjectId,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
}) => {
  const [newProjectName, setNewProjectName] = useState('');

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectName.trim()) {
      onCreateProject(newProjectName.trim());
      setNewProjectName('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="bg-ide-panel border border-ide-border rounded-lg w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-ide-subpanel border-b border-ide-border">
          <div className="flex items-center gap-2">
            <Folder className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-semibold text-white">Project Manager</h2>
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
        <div className="p-5 space-y-5">
          {/* Create New Project Form */}
          <form onSubmit={handleCreate} className="flex gap-2">
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="New project name..."
              className="flex-1 bg-ide-subpanel border border-ide-border rounded p-2 text-xs text-white focus:outline-none"
            />
            <button
              type="submit"
              disabled={!newProjectName.trim()}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded bg-ide-accent hover:bg-ide-accentHover text-white transition-colors disabled:opacity-50 min-h-[36px]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create</span>
            </button>
          </form>

          {/* Project List */}
          <div className="space-y-2 max-h-64 overflow-auto">
            {projects.map((p) => {
              const isActive = p.id === activeProjectId;
              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-3 rounded border transition-colors ${
                    isActive
                      ? 'bg-blue-950/30 border-blue-800/80 text-white'
                      : 'bg-ide-subpanel border-ide-border text-zinc-300 hover:bg-ide-hover'
                  }`}
                >
                  <div
                    className="flex items-center gap-2.5 flex-1 cursor-pointer"
                    onClick={() => {
                      onSelectProject(p.id);
                      onClose();
                    }}
                  >
                    <Folder className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-zinc-500'}`} />
                    <div>
                      <span className="text-xs font-semibold block">{p.name}</span>
                      <span className="text-[10px] text-zinc-500">
                        Updated: {new Date(p.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    {isActive && (
                      <span className="ml-2 flex items-center gap-1 text-[10px] font-bold text-blue-400 bg-blue-900/50 px-1.5 py-0.5 rounded">
                        <Check className="w-3 h-3" />
                        Active
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => exportProjectAsZip(p)}
                      title="Download Project ZIP"
                      className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-ide-panel transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    {projects.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onDeleteProject(p.id)}
                        title="Delete Project"
                        className="p-1.5 rounded text-zinc-400 hover:text-red-400 hover:bg-ide-panel transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-5 py-3 bg-ide-subpanel border-t border-ide-border">
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
  );
};
