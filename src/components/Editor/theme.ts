import { EditorView } from '@codemirror/view';
import { Extension } from '@codemirror/state';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

export interface ThemeColors {
  bg: string;
  fg: string;
  gutter: string;
  gutterText: string;
  activeLine: string;
  activeLineGutter: string;
  selection: string;
  cursor: string;
  border: string;
  tooltipBg: string;
  keyword: string;
  function: string;
  type: string;
  string: string;
  comment: string;
  number: string;
  operator: string;
}

export interface ThemeDefinition {
  id: string;
  name: string;
  isDark: boolean;
  colors: ThemeColors;
  extension: Extension;
}

function createThemeExtension(colors: ThemeColors, isDark: boolean): Extension {
  const viewTheme = EditorView.theme(
    {
      '&': {
        color: colors.fg,
        backgroundColor: colors.bg,
        height: '100%',
        fontSize: 'var(--editor-font-size, 14px)',
        lineHeight: 'var(--editor-line-height, 1.6)',
        fontFamily: 'var(--editor-font-family, "JetBrains Mono", monospace)',
        fontFeatureSettings: 'var(--editor-font-features, "liga" 0)',
        letterSpacing: 'var(--editor-letter-spacing, 0px)',
        fontWeight: 'var(--editor-font-weight, 400)',
      },
      '.cm-scroller': {
        overflow: 'auto',
        fontFamily: 'inherit',
      },
      '.cm-content': {
        caretColor: colors.cursor,
        padding: '8px 0',
      },
      '&.cm-focused .cm-cursor': {
        borderLeftColor: colors.cursor,
        borderLeftWidth: '2px',
      },
      '&.cm-focused .cm-selectionBackground, ::selection': {
        backgroundColor: `${colors.selection} !important`,
      },
      '.cm-selectionMatch': {
        backgroundColor: `${colors.selection}88`,
      },
      '.cm-gutters': {
        backgroundColor: colors.gutter,
        color: colors.gutterText,
        border: 'none',
        borderRight: `1px solid ${colors.border}`,
        paddingRight: '6px',
        userSelect: 'none',
      },
      '.cm-activeLineGutter': {
        backgroundColor: colors.activeLineGutter,
        color: colors.fg,
      },
      '.cm-activeLine': {
        backgroundColor: colors.activeLine,
      },
      '.cm-foldPlaceholder': {
        backgroundColor: colors.activeLine,
        border: 'none',
        color: colors.gutterText,
        padding: '0 4px',
        borderRadius: '2px',
      },
      '.cm-tooltip': {
        backgroundColor: colors.tooltipBg,
        border: `1px solid ${colors.border}`,
        color: colors.fg,
      },
      '.cm-diagnostic': {
        padding: '4px 8px',
        borderLeft: '4px solid',
      },
      '.cm-diagnostic-error': {
        borderLeftColor: '#ef4444',
        backgroundColor: isDark ? '#3f1818' : '#fee2e2',
      },
      '.cm-diagnostic-warning': {
        borderLeftColor: '#f59e0b',
        backgroundColor: isDark ? '#382e18' : '#fef3c7',
      },
    },
    { dark: isDark }
  );

  const highlightStyle = HighlightStyle.define([
    { tag: t.keyword, color: colors.keyword, fontWeight: 'bold' },
    { tag: [t.name, t.deleted, t.character, t.macroName], color: colors.fg },
    { tag: [t.function(t.variableName), t.labelName], color: colors.function },
    { tag: [t.color, t.constant(t.name), t.standard(t.name)], color: colors.number },
    { tag: [t.definition(t.name), t.separator], color: colors.fg },
    { tag: [t.typeName, t.className, t.changed, t.annotation, t.modifier, t.self, t.namespace], color: colors.type },
    { tag: [t.operator, t.operatorKeyword, t.url, t.escape, t.regexp, t.link, t.special(t.string)], color: colors.operator },
    { tag: [t.meta, t.comment], color: colors.comment, fontStyle: 'italic' },
    { tag: t.strong, fontWeight: 'bold' },
    { tag: t.emphasis, fontStyle: 'italic' },
    { tag: t.strikethrough, textDecoration: 'line-through' },
    { tag: t.link, color: colors.function, textDecoration: 'underline' },
    { tag: t.heading, fontWeight: 'bold', color: colors.fg },
    { tag: [t.atom, t.bool, t.special(t.variableName)], color: colors.keyword },
    { tag: [t.processingInstruction, t.string, t.inserted], color: colors.string },
    { tag: t.number, color: colors.number },
    { tag: t.invalid, color: '#ef4444' },
  ]);

  return [viewTheme, syntaxHighlighting(highlightStyle)];
}

// 7 Dark Themes + 4 Light Themes
export const THEMES_LIST: ThemeDefinition[] = [
  // 1. One Dark
  {
    id: 'one-dark',
    name: 'One Dark',
    isDark: true,
    colors: {
      bg: '#1e1e24',
      fg: '#abb2bf',
      gutter: '#17171c',
      gutterText: '#5c6370',
      activeLine: '#24242c',
      activeLineGutter: '#2c2c36',
      selection: '#3e4451',
      cursor: '#528bff',
      border: '#2c2c34',
      tooltipBg: '#21252b',
      keyword: '#c678dd',
      function: '#61afef',
      type: '#e5c07b',
      string: '#98c379',
      comment: '#5c6370',
      number: '#d19a66',
      operator: '#56b6c2',
    },
    extension: [],
  },

  // 2. Dracula
  {
    id: 'dracula',
    name: 'Dracula',
    isDark: true,
    colors: {
      bg: '#282a36',
      fg: '#f8f8f2',
      gutter: '#21222c',
      gutterText: '#6272a4',
      activeLine: '#44475a33',
      activeLineGutter: '#343746',
      selection: '#44475a',
      cursor: '#f8f8f2',
      border: '#3c3f58',
      tooltipBg: '#21222c',
      keyword: '#ff79c6',
      function: '#50fa7b',
      type: '#8be9fd',
      string: '#f1fa8c',
      comment: '#6272a4',
      number: '#bd93f9',
      operator: '#ff79c6',
    },
    extension: [],
  },

  // 3. Nord
  {
    id: 'nord',
    name: 'Nord',
    isDark: true,
    colors: {
      bg: '#2e3440',
      fg: '#d8dee9',
      gutter: '#252a34',
      gutterText: '#4c566a',
      activeLine: '#3b425255',
      activeLineGutter: '#3b4252',
      selection: '#434c5e',
      cursor: '#88c0d0',
      border: '#3b4252',
      tooltipBg: '#2e3440',
      keyword: '#81a1c1',
      function: '#88c0d0',
      type: '#8fbcbb',
      string: '#a3be8c',
      comment: '#616e88',
      number: '#b48ead',
      operator: '#81a1c1',
    },
    extension: [],
  },

  // 4. Monokai
  {
    id: 'monokai',
    name: 'Monokai',
    isDark: true,
    colors: {
      bg: '#272822',
      fg: '#f8f8f2',
      gutter: '#1e1f1c',
      gutterText: '#75715e',
      activeLine: '#3e3d3266',
      activeLineGutter: '#3e3d32',
      selection: '#49483e',
      cursor: '#f8f8f0',
      border: '#3e3d32',
      tooltipBg: '#1e1f1c',
      keyword: '#f92672',
      function: '#a6e22e',
      type: '#66d9ef',
      string: '#e6db74',
      comment: '#75715e',
      number: '#ae81ff',
      operator: '#f92672',
    },
    extension: [],
  },

  // 5. GitHub Dark
  {
    id: 'github-dark',
    name: 'GitHub Dark',
    isDark: true,
    colors: {
      bg: '#0d1117',
      fg: '#c9d1d9',
      gutter: '#070a0e',
      gutterText: '#6e7681',
      activeLine: '#161b22',
      activeLineGutter: '#21262d',
      selection: '#1f6feb44',
      cursor: '#58a6ff',
      border: '#30363d',
      tooltipBg: '#161b22',
      keyword: '#ff7b72',
      function: '#d2a8ff',
      type: '#79c0ff',
      string: '#a5d6ff',
      comment: '#8b949e',
      number: '#79c0ff',
      operator: '#ff7b72',
    },
    extension: [],
  },

  // 6. Solarized Dark
  {
    id: 'solarized-dark',
    name: 'Solarized Dark',
    isDark: true,
    colors: {
      bg: '#002b36',
      fg: '#839496',
      gutter: '#073642',
      gutterText: '#586e75',
      activeLine: '#07364288',
      activeLineGutter: '#0e4654',
      selection: '#073642',
      cursor: '#268bd2',
      border: '#0e4654',
      tooltipBg: '#073642',
      keyword: '#859900',
      function: '#268bd2',
      type: '#b58900',
      string: '#2aa198',
      comment: '#586e75',
      number: '#d33682',
      operator: '#859900',
    },
    extension: [],
  },

  // 7. Midnight Dark (Custom Theme)
  {
    id: 'midnight-dark',
    name: 'Midnight Dark',
    isDark: true,
    colors: {
      bg: '#0a0a0f',
      fg: '#f1f5f9',
      gutter: '#050508',
      gutterText: '#64748b',
      activeLine: '#13131e',
      activeLineGutter: '#1c1c2a',
      selection: '#242f4c',
      cursor: '#38bdf8',
      border: '#20202e',
      tooltipBg: '#111118',
      keyword: '#c084fc',
      function: '#38bdf8',
      type: '#34d399',
      string: '#f472b6',
      comment: '#64748b',
      number: '#fbbf24',
      operator: '#818cf8',
    },
    extension: [],
  },

  // 8. GitHub Light
  {
    id: 'github-light',
    name: 'GitHub Light',
    isDark: false,
    colors: {
      bg: '#ffffff',
      fg: '#24292f',
      gutter: '#f6f8fa',
      gutterText: '#8c959f',
      activeLine: '#f3f4f6',
      activeLineGutter: '#eaeef2',
      selection: '#0969da25',
      cursor: '#0969da',
      border: '#d0d7de',
      tooltipBg: '#ffffff',
      keyword: '#cf222e',
      function: '#8250df',
      type: '#0550ae',
      string: '#0a3069',
      comment: '#6e7781',
      number: '#0550ae',
      operator: '#cf222e',
    },
    extension: [],
  },

  // 9. Solarized Light
  {
    id: 'solarized-light',
    name: 'Solarized Light',
    isDark: false,
    colors: {
      bg: '#fdf6e3',
      fg: '#657b83',
      gutter: '#eee8d5',
      gutterText: '#93a1a1',
      activeLine: '#eee8d588',
      activeLineGutter: '#e4dcc7',
      selection: '#d8d2be',
      cursor: '#268bd2',
      border: '#e4dcc7',
      tooltipBg: '#eee8d5',
      keyword: '#859900',
      function: '#268bd2',
      type: '#b58900',
      string: '#2aa198',
      comment: '#93a1a1',
      number: '#d33682',
      operator: '#859900',
    },
    extension: [],
  },

  // 10. One Light
  {
    id: 'one-light',
    name: 'One Light',
    isDark: false,
    colors: {
      bg: '#fafafa',
      fg: '#383a42',
      gutter: '#f0f0f0',
      gutterText: '#a0a1a7',
      activeLine: '#f0f0f0',
      activeLineGutter: '#e5e5e6',
      selection: '#e5e5e6',
      cursor: '#526fff',
      border: '#e0e0e0',
      tooltipBg: '#f0f0f0',
      keyword: '#a626a4',
      function: '#4078f2',
      type: '#c18401',
      string: '#50a14f',
      comment: '#a0a1a7',
      number: '#986801',
      operator: '#0184bc',
    },
    extension: [],
  },

  // 11. Clean Light (Custom Theme)
  {
    id: 'clean-light',
    name: 'Clean Light',
    isDark: false,
    colors: {
      bg: '#f8fafc',
      fg: '#1e293b',
      gutter: '#f1f5f9',
      gutterText: '#94a3b8',
      activeLine: '#f1f5f9',
      activeLineGutter: '#e2e8f0',
      selection: '#cbd5e1',
      cursor: '#0284c7',
      border: '#e2e8f0',
      tooltipBg: '#ffffff',
      keyword: '#0284c7',
      function: '#6366f1',
      type: '#0d9488',
      string: '#16a34a',
      comment: '#94a3b8',
      number: '#ea580c',
      operator: '#0284c7',
    },
    extension: [],
  },
];

// Initialize extensions for each theme
for (const theme of THEMES_LIST) {
  theme.extension = createThemeExtension(theme.colors, theme.isDark);
}

export function getThemeDefinition(themeId: string): ThemeDefinition {
  return THEMES_LIST.find((t) => t.id === themeId) || THEMES_LIST[0];
}

export function getThemeExtension(themeId: string): Extension {
  return getThemeDefinition(themeId).extension;
}

// Default export for backwards compatibility
export const ideTheme = THEMES_LIST[0].extension;
export const ideSyntaxHighlighting: Extension = [];
