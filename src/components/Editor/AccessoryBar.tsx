import React from 'react';
import { Undo, Redo, Copy, Clipboard, Indent, Outdent, ChevronDown, ChevronUp } from 'lucide-react';
import { EditorView } from '@codemirror/view';
import { undo, redo, indentMore, indentLess } from '@codemirror/commands';

interface AccessoryBarProps {
  editorView: EditorView | null;
  collapsed: boolean;
  onToggleCollapse: () => void;
  tabSize?: number;
  useSoftTabs?: boolean;
}

const SYMBOLS = [
  '{', '}', '(', ')', '[', ']', ';', ':', '"', '\'', '<', '>', '#', '/', '=', '!', '&', '|', '\\'
];

export const AccessoryBar: React.FC<AccessoryBarProps> = ({
  editorView,
  collapsed,
  onToggleCollapse,
  tabSize = 4,
  useSoftTabs = true,
}) => {
  const insertSymbol = (symbol: string) => {
    if (!editorView) return;
    const { state, dispatch } = editorView;
    const mainSel = state.selection.main;
    
    // Check if bracket pair wrapping selected text
    const pairs: Record<string, string> = { '{': '}', '(': ')', '[': ']', '"': '"', '\'': '\'', '<': '>' };
    if (!mainSel.empty && pairs[symbol]) {
      const selectedText = state.sliceDoc(mainSel.from, mainSel.to);
      const wrapped = symbol + selectedText + pairs[symbol];
      dispatch({
        changes: { from: mainSel.from, to: mainSel.to, insert: wrapped },
        selection: { anchor: mainSel.from + 1, head: mainSel.to + 1 },
      });
    } else {
      // Normal insert at cursor
      dispatch({
        changes: { from: mainSel.from, to: mainSel.to, insert: symbol },
        selection: { anchor: mainSel.from + symbol.length },
      });
    }
    editorView.focus();
  };

  const handleTab = () => {
    if (!editorView) return;
    const hasSelection = editorView.state.selection.ranges.some(
      (r) => !r.empty || editorView.state.doc.lineAt(r.from).number !== editorView.state.doc.lineAt(r.to).number
    );
    if (hasSelection) {
      indentMore(editorView);
    } else {
      const indentStr = useSoftTabs ? ' '.repeat(tabSize) : '\t';
      editorView.dispatch(
        editorView.state.update(editorView.state.replaceSelection(indentStr), {
          scrollIntoView: true,
          userEvent: 'input',
        })
      );
    }
    editorView.focus();
  };

  const handleOutdent = () => {
    if (!editorView) return;
    indentLess(editorView);
    editorView.focus();
  };

  const handleUndo = () => {
    if (!editorView) return;
    undo(editorView);
    editorView.focus();
  };

  const handleRedo = () => {
    if (!editorView) return;
    redo(editorView);
    editorView.focus();
  };

  const handleCopy = async () => {
    if (!editorView) return;
    const { state } = editorView;
    const mainSel = state.selection.main;
    const textToCopy = mainSel.empty ? state.doc.toString() : state.sliceDoc(mainSel.from, mainSel.to);
    try {
      await navigator.clipboard.writeText(textToCopy);
    } catch {
      // Fallback
    }
    editorView.focus();
  };

  const handlePaste = async () => {
    if (!editorView) return;
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        const { state, dispatch } = editorView;
        const mainSel = state.selection.main;
        dispatch({
          changes: { from: mainSel.from, to: mainSel.to, insert: text },
          selection: { anchor: mainSel.from + text.length },
        });
      }
    } catch {
      // Clipboard read permissions may be denied in some iOS contexts
    }
    editorView.focus();
  };

  if (collapsed) {
    return (
      <div className="flex items-center justify-end px-2 py-1 bg-ide-subpanel border-t border-ide-border">
        <button
          type="button"
          onClick={onToggleCollapse}
          title="Show iPad Programming Toolbar"
          className="flex items-center gap-1 text-xs text-ide-textMuted hover:text-white px-2 py-1 rounded bg-ide-panel hover:bg-ide-hover border border-ide-border transition-colors min-h-[36px]"
        >
          <span>Symbols Bar</span>
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between bg-ide-subpanel border-t border-ide-border px-1.5 py-1 select-none overflow-x-auto touch-pan-x">
      <div className="flex items-center gap-1 flex-nowrap">
        {/* Quick Editing Actions */}
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); handleTab(); }}
          onTouchStart={(e) => { e.preventDefault(); handleTab(); }}
          className="px-2.5 py-1.5 min-w-[38px] min-h-[38px] text-xs font-mono font-medium rounded bg-ide-panel hover:bg-ide-hover border border-ide-border text-ide-text active:bg-ide-active flex items-center justify-center transition-colors"
          title="Tab / Indent"
        >
          Tab
        </button>

        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); handleOutdent(); }}
          onTouchStart={(e) => { e.preventDefault(); handleOutdent(); }}
          className="px-2 py-1.5 min-w-[38px] min-h-[38px] rounded bg-ide-panel hover:bg-ide-hover border border-ide-border text-ide-text active:bg-ide-active flex items-center justify-center transition-colors"
          title="Outdent"
        >
          <Outdent className="w-4 h-4" />
        </button>

        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); handleUndo(); }}
          onTouchStart={(e) => { e.preventDefault(); handleUndo(); }}
          className="px-2 py-1.5 min-w-[38px] min-h-[38px] rounded bg-ide-panel hover:bg-ide-hover border border-ide-border text-ide-text active:bg-ide-active flex items-center justify-center transition-colors"
          title="Undo"
        >
          <Undo className="w-4 h-4" />
        </button>

        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); handleRedo(); }}
          onTouchStart={(e) => { e.preventDefault(); handleRedo(); }}
          className="px-2 py-1.5 min-w-[38px] min-h-[38px] rounded bg-ide-panel hover:bg-ide-hover border border-ide-border text-ide-text active:bg-ide-active flex items-center justify-center transition-colors"
          title="Redo"
        >
          <Redo className="w-4 h-4" />
        </button>

        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); handleCopy(); }}
          onTouchStart={(e) => { e.preventDefault(); handleCopy(); }}
          className="px-2 py-1.5 min-w-[38px] min-h-[38px] rounded bg-ide-panel hover:bg-ide-hover border border-ide-border text-ide-text active:bg-ide-active flex items-center justify-center transition-colors"
          title="Copy"
        >
          <Copy className="w-4 h-4" />
        </button>

        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); handlePaste(); }}
          onTouchStart={(e) => { e.preventDefault(); handlePaste(); }}
          className="px-2 py-1.5 min-w-[38px] min-h-[38px] rounded bg-ide-panel hover:bg-ide-hover border border-ide-border text-ide-text active:bg-ide-active flex items-center justify-center transition-colors"
          title="Paste"
        >
          <Clipboard className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-6 bg-ide-border mx-1" />

        {/* Programming Symbols */}
        {SYMBOLS.map((symbol) => (
          <button
            key={symbol}
            type="button"
            onMouseDown={(e) => { e.preventDefault(); insertSymbol(symbol); }}
            onTouchStart={(e) => { e.preventDefault(); insertSymbol(symbol); }}
            className="px-2.5 py-1.5 min-w-[38px] min-h-[38px] text-sm font-mono font-bold rounded bg-ide-panel hover:bg-ide-hover border border-ide-border text-ide-text active:bg-ide-accent active:text-white flex items-center justify-center transition-colors"
          >
            {symbol}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onToggleCollapse}
        title="Hide Toolbar"
        className="p-1.5 ml-2 min-w-[34px] min-h-[34px] rounded text-ide-textMuted hover:text-white hover:bg-ide-hover transition-colors flex items-center justify-center"
      >
        <ChevronDown className="w-4 h-4" />
      </button>
    </div>
  );
};
