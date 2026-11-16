import React from 'react';
import { X, Command } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: '⌘ / Ctrl + Enter', desc: 'Compile and Run program' },
    { key: '⌘ / Ctrl + ⇧ + Enter', desc: 'Compile only' },
    { key: '⌘ / Ctrl + S', desc: 'Save current file' },
    { key: '⌘ / Ctrl + N', desc: 'Create new file' },
    { key: '⌘ / Ctrl + F', desc: 'Find in file' },
    { key: '⌘ / Ctrl + H', desc: 'Find and Replace' },
    { key: '⌘ / Ctrl + Z', desc: 'Undo' },
    { key: '⌘ / Ctrl + ⇧ + Z', desc: 'Redo' },
    { key: 'Tab', desc: 'Indent selection or insert tab' },
    { key: 'Shift + Tab', desc: 'Outdent selection' },
    { key: 'Escape', desc: 'Close dialog or search panel' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="bg-ide-panel border border-ide-border rounded-lg w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-ide-subpanel border-b border-ide-border">
          <div className="flex items-center gap-2">
            <Command className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-semibold text-white">Keyboard Shortcuts</h2>
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
        <div className="p-5 space-y-3">
          <p className="text-xs text-zinc-400">
            Pocket C++ supports all native iPad external keyboard modifiers (Apple Magic Keyboard, Smart Keyboard Folio, Bluetooth).
          </p>

          <div className="divide-y divide-ide-border">
            {shortcuts.map((sc, i) => (
              <div key={i} className="py-2.5 flex items-center justify-between text-xs">
                <span className="text-zinc-300">{sc.desc}</span>
                <kbd className="px-2 py-1 rounded bg-ide-subpanel border border-ide-border text-blue-400 font-mono font-semibold">
                  {sc.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-5 py-3 bg-ide-subpanel border-t border-ide-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded bg-ide-accent hover:bg-ide-accentHover text-white transition-colors min-h-[38px]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
