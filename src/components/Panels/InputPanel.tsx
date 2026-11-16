import React from 'react';
import { Copy, Trash2, Clipboard } from 'lucide-react';

interface InputPanelProps {
  value: string;
  onChange: (value: string) => void;
  saved?: boolean;
}

export const InputPanel: React.FC<InputPanelProps> = ({
  value,
  onChange,
  saved = true,
}) => {
  const lineCount = value.split('\n').length;
  const lineNumbers = Array.from({ length: Math.max(lineCount, 1) }, (_, i) => i + 1);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Ignored
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) onChange(text);
    } catch {
      // Ignored
    }
  };

  const handleClear = () => {
    onChange('');
  };

  return (
    <div className="flex flex-col h-full bg-ide-panel border border-ide-border rounded-none overflow-hidden">
      {/* Input Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-ide-subpanel border-b border-ide-border select-none">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-ide-text">
            Input (stdin)
          </span>
          {saved && (
            <span className="flex items-center gap-1 text-[11px] text-ide-success font-medium bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/40">
              <span className="w-1.5 h-1.5 rounded-full bg-ide-success animate-pulse" />
              Saved
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePaste}
            title="Paste into input"
            className="p-1 rounded text-ide-textMuted hover:text-white hover:bg-ide-hover transition-colors min-w-[28px] min-h-[28px] flex items-center justify-center"
          >
            <Clipboard className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleCopy}
            title="Copy input"
            className="p-1 rounded text-ide-textMuted hover:text-white hover:bg-ide-hover transition-colors min-w-[28px] min-h-[28px] flex items-center justify-center"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleClear}
            title="Clear input"
            className="p-1 rounded text-ide-textMuted hover:text-ide-danger hover:bg-ide-hover transition-colors min-w-[28px] min-h-[28px] flex items-center justify-center"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Input Body with line numbers */}
      <div className="flex-1 flex overflow-hidden relative">
        <div className="w-10 py-2 bg-ide-subpanel text-right pr-2 text-xs font-mono text-zinc-600 select-none border-r border-ide-border overflow-hidden">
          {lineNumbers.map((num) => (
            <div key={num} className="leading-6">
              {num}
            </div>
          ))}
        </div>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter custom standard input here (e.g. 1 2 3)..."
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          className="flex-1 w-full h-full p-2 bg-transparent text-sm font-mono text-ide-text resize-none focus:outline-none leading-6 placeholder:text-zinc-600"
        />
      </div>
    </div>
  );
};
