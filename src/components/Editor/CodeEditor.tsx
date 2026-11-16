import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { EditorState, Compartment, Extension } from '@codemirror/state';
import { EditorView, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentMore, indentLess } from '@codemirror/commands';
import { cpp } from '@codemirror/lang-cpp';
import { bracketMatching, foldGutter, foldKeymap, indentOnInput, indentUnit } from '@codemirror/language';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { keymap } from '@codemirror/view';
import { Diagnostic as CMDiagnostic, setDiagnostics } from '@codemirror/lint';
import { getThemeExtension, getThemeDefinition } from './theme';
import { getFontOption } from '../../services/fonts';
import { Diagnostic } from '../../compiler/types';

export interface CodeEditorHandle {
  getEditorView: () => EditorView | null;
  jumpToLine: (line: number, col?: number) => void;
  insertText: (text: string) => void;
  formatCode?: () => void;
}

interface CodeEditorProps {
  value: string;
  language: 'cpp' | 'c';
  onChange: (value: string) => void;
  diagnostics?: Diagnostic[];
  themeId?: string;
  fontFamily?: string;
  fontSize?: number;
  lineHeight?: number;
  fontWeight?: string;
  fontLigatures?: boolean;
  letterSpacing?: number;
  tabSize?: number;
  useSoftTabs?: boolean;
  lineWrapping?: boolean;
  lineNumbersEnabled?: boolean;
  activeLineHighlight?: boolean;
  bracketMatchingEnabled?: boolean;
  autoCloseBracketsEnabled?: boolean;
  codeFoldingEnabled?: boolean;
  cursorStyle?: 'line' | 'block' | 'underline';
}

export const CodeEditor = forwardRef<CodeEditorHandle, CodeEditorProps>(
  (
    {
      value,
      language,
      onChange,
      diagnostics = [],
      themeId = 'one-dark',
      fontFamily = 'JetBrains Mono',
      fontSize = 14,
      lineHeight = 1.6,
      fontWeight = '400',
      fontLigatures = false,
      letterSpacing = 0,
      tabSize = 4,
      useSoftTabs = true,
      lineWrapping = false,
      lineNumbersEnabled = true,
      activeLineHighlight = true,
      bracketMatchingEnabled = true,
      autoCloseBracketsEnabled = true,
      codeFoldingEnabled = true,
      cursorStyle = 'line',
    },
    ref
  ) => {
    const editorContainerRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);
    const valueRef = useRef(value);
    valueRef.current = value;

    // Compartments for dynamic reconfiguration without recreating the editor
    const themeCompartment = useRef(new Compartment());
    const lineWrappingCompartment = useRef(new Compartment());
    const indentationCompartment = useRef(new Compartment());
    const tabKeymapCompartment = useRef(new Compartment());
    const lineNumbersCompartment = useRef(new Compartment());
    const activeLineCompartment = useRef(new Compartment());
    const bracketMatchingCompartment = useRef(new Compartment());
    const closeBracketsCompartment = useRef(new Compartment());
    const foldGutterCompartment = useRef(new Compartment());
    const cursorStyleCompartment = useRef(new Compartment());

    // Expose handle methods to parent
    useImperativeHandle(ref, () => ({
      getEditorView: () => viewRef.current,
      jumpToLine: (line: number, col = 1) => {
        const view = viewRef.current;
        if (!view) return;
        try {
          const doc = view.state.doc;
          const targetLine = Math.max(1, Math.min(line, doc.lines));
          const lineInfo = doc.line(targetLine);
          const pos = Math.min(lineInfo.from + Math.max(0, col - 1), lineInfo.to);
          view.dispatch({
            selection: { anchor: pos, head: pos },
            scrollIntoView: true,
          });
          view.focus();
        } catch {
          // Line out of range
        }
      },
      insertText: (text: string) => {
        const view = viewRef.current;
        if (!view) return;
        const main = view.state.selection.main;
        view.dispatch({
          changes: { from: main.from, to: main.to, insert: text },
          selection: { anchor: main.from + text.length },
        });
        view.focus();
      },
    }));

    // Helper for cursor style extension
    const getCursorExtension = (style: 'line' | 'block' | 'underline'): Extension => {
      if (style === 'block') {
        return EditorView.theme({
          '.cm-cursor': {
            borderLeftWidth: '0.6em !important',
            opacity: '0.6 !important',
          },
        });
      }
      if (style === 'underline') {
        return EditorView.theme({
          '.cm-cursor': {
            borderLeftWidth: '0.6em !important',
            borderBottom: '2px solid currentColor !important',
            height: '2px !important',
            marginTop: '1.2em !important',
          },
        });
      }
      return EditorView.theme({
        '.cm-cursor': {
          borderLeftWidth: '2px !important',
        },
      });
    };

    // Helper for indentation configuration (tabSize & indentUnit)
    const getIndentationExtensions = (size: number, soft: boolean): Extension[] => [
      EditorState.tabSize.of(size),
      indentUnit.of(soft ? ' '.repeat(size) : '\t'),
    ];

    // Helper for custom Tab / Shift-Tab keymap
    const getTabKeymapExtension = (size: number, soft: boolean): Extension =>
      keymap.of([
        {
          key: 'Tab',
          run: (view: EditorView) => {
            const hasSelection = view.state.selection.ranges.some(
              (r) => !r.empty || view.state.doc.lineAt(r.from).number !== view.state.doc.lineAt(r.to).number
            );
            if (hasSelection) {
              return indentMore(view);
            }
            const indentStr = soft ? ' '.repeat(size) : '\t';
            view.dispatch(
              view.state.update(view.state.replaceSelection(indentStr), {
                scrollIntoView: true,
                userEvent: 'input',
              })
            );
            return true;
          },
          shift: indentLess,
        },
      ]);

    // Initialize CodeMirror 6 EditorView
    useEffect(() => {
      if (!editorContainerRef.current) return;

      const updateListener = EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          const newDoc = update.state.doc.toString();
          if (newDoc !== valueRef.current) {
            valueRef.current = newDoc;
            onChange(newDoc);
          }
        }
      });

      const startState = EditorState.create({
        doc: value,
        extensions: [
          themeCompartment.current.of(getThemeExtension(themeId)),
          cpp(),
          history(),
          indentOnInput(),
          highlightSelectionMatches(),
          cursorStyleCompartment.current.of(getCursorExtension(cursorStyle)),
          activeLineCompartment.current.of(
            activeLineHighlight ? [highlightActiveLine(), highlightActiveLineGutter()] : []
          ),
          bracketMatchingCompartment.current.of(bracketMatchingEnabled ? bracketMatching() : []),
          closeBracketsCompartment.current.of(autoCloseBracketsEnabled ? closeBrackets() : []),
          foldGutterCompartment.current.of(codeFoldingEnabled ? foldGutter() : []),
          lineWrappingCompartment.current.of(lineWrapping ? EditorView.lineWrapping : []),
          indentationCompartment.current.of(getIndentationExtensions(tabSize, useSoftTabs)),
          tabKeymapCompartment.current.of(getTabKeymapExtension(tabSize, useSoftTabs)),
          lineNumbersCompartment.current.of(lineNumbersEnabled ? lineNumbers() : []),
          keymap.of([
            ...closeBracketsKeymap,
            ...defaultKeymap,
            ...historyKeymap,
            ...foldKeymap,
            ...searchKeymap,
          ]),
          updateListener,
        ],
      });

      const view = new EditorView({
        state: startState,
        parent: editorContainerRef.current,
      });

      viewRef.current = view;

      return () => {
        view.destroy();
        viewRef.current = null;
      };
    }, []); // Run once on mount

    // Update document content when active file changes externally
    useEffect(() => {
      const view = viewRef.current;
      if (!view) return;
      const currentDoc = view.state.doc.toString();
      if (value !== currentDoc) {
        view.dispatch({
          changes: { from: 0, to: currentDoc.length, insert: value },
        });
      }
    }, [value]);

    // Dynamic theme reconfiguration
    useEffect(() => {
      const view = viewRef.current;
      if (!view) return;
      view.dispatch({
        effects: themeCompartment.current.reconfigure(getThemeExtension(themeId)),
      });
    }, [themeId]);

    // Dynamic cursor style reconfiguration
    useEffect(() => {
      const view = viewRef.current;
      if (!view) return;
      view.dispatch({
        effects: cursorStyleCompartment.current.reconfigure(getCursorExtension(cursorStyle)),
      });
    }, [cursorStyle]);

    // Dynamic line wrapping reconfiguration
    useEffect(() => {
      const view = viewRef.current;
      if (!view) return;
      view.dispatch({
        effects: lineWrappingCompartment.current.reconfigure(
          lineWrapping ? EditorView.lineWrapping : []
        ),
      });
    }, [lineWrapping]);

    // Dynamic tab size & indentation reconfiguration
    useEffect(() => {
      const view = viewRef.current;
      if (!view) return;
      view.dispatch({
        effects: [
          indentationCompartment.current.reconfigure(getIndentationExtensions(tabSize, useSoftTabs)),
          tabKeymapCompartment.current.reconfigure(getTabKeymapExtension(tabSize, useSoftTabs)),
        ],
      });
    }, [tabSize, useSoftTabs]);

    // Dynamic line numbers reconfiguration
    useEffect(() => {
      const view = viewRef.current;
      if (!view) return;
      view.dispatch({
        effects: lineNumbersCompartment.current.reconfigure(
          lineNumbersEnabled ? lineNumbers() : []
        ),
      });
    }, [lineNumbersEnabled]);

    // Dynamic active line highlight reconfiguration
    useEffect(() => {
      const view = viewRef.current;
      if (!view) return;
      view.dispatch({
        effects: activeLineCompartment.current.reconfigure(
          activeLineHighlight ? [highlightActiveLine(), highlightActiveLineGutter()] : []
        ),
      });
    }, [activeLineHighlight]);

    // Dynamic bracket matching reconfiguration
    useEffect(() => {
      const view = viewRef.current;
      if (!view) return;
      view.dispatch({
        effects: bracketMatchingCompartment.current.reconfigure(
          bracketMatchingEnabled ? bracketMatching() : []
        ),
      });
    }, [bracketMatchingEnabled]);

    // Dynamic close brackets reconfiguration
    useEffect(() => {
      const view = viewRef.current;
      if (!view) return;
      view.dispatch({
        effects: closeBracketsCompartment.current.reconfigure(
          autoCloseBracketsEnabled ? closeBrackets() : []
        ),
      });
    }, [autoCloseBracketsEnabled]);

    // Dynamic code folding reconfiguration
    useEffect(() => {
      const view = viewRef.current;
      if (!view) return;
      view.dispatch({
        effects: foldGutterCompartment.current.reconfigure(
          codeFoldingEnabled ? foldGutter() : []
        ),
      });
    }, [codeFoldingEnabled]);

    // Apply compilation diagnostics to CodeMirror gutter and inline marks
    useEffect(() => {
      const view = viewRef.current;
      if (!view) return;

      const cmDiagnostics: CMDiagnostic[] = [];
      const doc = view.state.doc;

      for (const diag of diagnostics) {
        if (diag.line >= 1 && diag.line <= doc.lines) {
          const lineInfo = doc.line(diag.line);
          const from = Math.min(lineInfo.from + Math.max(0, diag.col - 1), lineInfo.to);
          const to = Math.min(from + 5, lineInfo.to);

          cmDiagnostics.push({
            from: from,
            to: Math.max(from, to),
            severity: diag.severity === 'error' ? 'error' : diag.severity === 'warning' ? 'warning' : 'info',
            message: diag.message,
          });
        }
      }

      view.dispatch(setDiagnostics(view.state, cmDiagnostics));
    }, [diagnostics]);

    const fontOption = getFontOption(fontFamily);
    const themeDef = getThemeDefinition(themeId);

    return (
      <div
        className="w-full h-full flex flex-col relative overflow-hidden"
        style={
          {
            '--editor-font-size': `${fontSize}px`,
            '--editor-line-height': `${lineHeight}`,
            '--editor-font-family': fontOption.fontFamily,
            '--editor-font-weight': fontWeight,
            '--editor-letter-spacing': `${letterSpacing}px`,
            '--editor-font-features': fontLigatures ? '"liga" 1, "calt" 1' : '"liga" 0, "calt" 0',
            backgroundColor: themeDef.colors.bg,
          } as React.CSSProperties
        }
      >
        <div ref={editorContainerRef} className="w-full h-full" />
      </div>
    );
  }
);
