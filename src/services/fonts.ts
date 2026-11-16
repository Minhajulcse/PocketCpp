export interface FontOption {
  id: string;
  name: string;
  fontFamily: string;
  category: 'web' | 'system';
  description: string;
}

export const FONTS_LIST: FontOption[] = [
  {
    id: 'jetbrains-mono',
    name: 'JetBrains Mono',
    fontFamily: '"JetBrains Mono", "SF Mono", Menlo, Consolas, monospace',
    category: 'web',
    description: 'Designed specifically for developers; clean, modern and legible.',
  },
  {
    id: 'fira-code',
    name: 'Fira Code',
    fontFamily: '"Fira Code", "SF Mono", Menlo, Consolas, monospace',
    category: 'web',
    description: 'Classic programming font with distinguished character shapes.',
  },
  {
    id: 'ibm-plex-mono',
    name: 'IBM Plex Mono',
    fontFamily: '"IBM Plex Mono", Menlo, Consolas, monospace',
    category: 'web',
    description: 'Grotesque monospace engineered for code readability.',
  },
  {
    id: 'source-code-pro',
    name: 'Source Code Pro',
    fontFamily: '"Source Code Pro", Menlo, Monaco, Consolas, monospace',
    category: 'web',
    description: 'Adobe’s open-source typeface designed for UI and code.',
  },
  {
    id: 'cascadia-code',
    name: 'Cascadia Code',
    fontFamily: '"Cascadia Code", "Cascadia Mono", Consolas, monospace',
    category: 'system',
    description: 'Modern Microsoft developer font designed for terminals.',
  },
  {
    id: 'consolas',
    name: 'Consolas',
    fontFamily: 'Consolas, "Courier New", monospace',
    category: 'system',
    description: 'Clear, balanced monospace with proportional digits.',
  },
  {
    id: 'sf-mono',
    name: 'SF Mono',
    fontFamily: '"SF Mono", "SFMono-Regular", -apple-system-ui-monospace, Menlo, monospace',
    category: 'system',
    description: 'Apple native monospace optimized for iPadOS and macOS.',
  },
  {
    id: 'system-mono',
    name: 'System Monospace',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
    category: 'system',
    description: 'Standard device default monospace font.',
  },
];

export function getFontOption(fontNameOrId: string): FontOption {
  const found = FONTS_LIST.find((f) => f.id === fontNameOrId || f.name === fontNameOrId);
  return found || FONTS_LIST[0];
}
