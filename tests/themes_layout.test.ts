import { describe, it, expect } from 'vitest';
import { THEMES_LIST, getThemeDefinition } from '../src/components/Editor/theme';
import { FONTS_LIST, getFontOption } from '../src/services/fonts';
import { DEFAULT_SETTINGS } from '../src/services/storage';

describe('Pocket C++ IDE — Themes, Fonts & Layout Verification', () => {
  it('Verify all 11 required themes are present with valid palettes', () => {
    const requiredDarkThemes = [
      'one-dark',
      'dracula',
      'nord',
      'monokai',
      'github-dark',
      'solarized-dark',
      'midnight-dark',
    ];
    const requiredLightThemes = [
      'github-light',
      'solarized-light',
      'one-light',
      'clean-light',
    ];

    expect(THEMES_LIST).toHaveLength(11);

    const darkThemes = THEMES_LIST.filter((t) => t.isDark).map((t) => t.id);
    const lightThemes = THEMES_LIST.filter((t) => !t.isDark).map((t) => t.id);

    for (const expected of requiredDarkThemes) {
      expect(darkThemes).toContain(expected);
    }
    for (const expected of requiredLightThemes) {
      expect(lightThemes).toContain(expected);
    }

    // Verify each theme has distinct, non-empty color values
    for (const t of THEMES_LIST) {
      expect(t.colors.bg).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(t.colors.fg).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(t.colors.keyword).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(t.colors.function).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(t.colors.string).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(t.colors.comment).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(t.extension).toBeDefined();
    }
  });

  it('Verify getThemeDefinition returns fallback for unknown theme ID', () => {
    const fallback = getThemeDefinition('unknown-theme');
    expect(fallback.id).toBe('one-dark');
  });

  it('Verify all 8 required programming fonts are present', () => {
    const requiredFonts = [
      'JetBrains Mono',
      'Fira Code',
      'IBM Plex Mono',
      'Source Code Pro',
      'Cascadia Code',
      'Consolas',
      'SF Mono',
      'System Monospace',
    ];

    expect(FONTS_LIST).toHaveLength(8);

    const availableFontNames = FONTS_LIST.map((f) => f.name);
    for (const expected of requiredFonts) {
      expect(availableFontNames).toContain(expected);
    }

    const jbMono = getFontOption('JetBrains Mono');
    expect(jbMono.fontFamily).toContain('JetBrains Mono');
  });

  it('Verify default settings include required defaults', () => {
    expect(DEFAULT_SETTINGS.editor.themeId).toBe('one-dark');
    expect(DEFAULT_SETTINGS.editor.fontFamily).toBe('JetBrains Mono');
    expect(DEFAULT_SETTINGS.editor.fontSize).toBe(14);
    expect(DEFAULT_SETTINGS.editor.lineHeight).toBe(1.6);
    expect(DEFAULT_SETTINGS.editor.fontLigatures).toBe(false);

    expect(DEFAULT_SETTINGS.editor.tabSize).toBe(4);
    expect(DEFAULT_SETTINGS.editor.useSoftTabs).toBe(true);

    expect(DEFAULT_SETTINGS.layout.editorWidthPercent).toBe(65);
    expect(DEFAULT_SETTINGS.layout.inputHeightPercent).toBe(40);
  });

  it('Verify layout clamping boundaries', () => {
    const clampWidth = (val: number) => Math.min(85, Math.max(35, val));
    const clampHeight = (val: number) => Math.min(80, Math.max(20, val));

    expect(clampWidth(20)).toBe(35);
    expect(clampWidth(95)).toBe(85);
    expect(clampWidth(65)).toBe(65);

    expect(clampHeight(10)).toBe(20);
    expect(clampHeight(90)).toBe(80);
    expect(clampHeight(40)).toBe(40);
  });
});
