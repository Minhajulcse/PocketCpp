import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Pocket C++ IDE — Developer Profile & Photograph Asset Verification', () => {
  const rootDir = path.resolve(__dirname, '..');
  const originalImagePath = path.join(rootDir, 'image.jpeg');
  const publicImagePath = path.join(rootDir, 'public', 'images', 'developer', 'image.jpeg');
  const swPath = path.join(rootDir, 'public', 'sw.js');
  const developerModalPath = path.join(rootDir, 'src', 'components', 'Modals', 'DeveloperModal.tsx');
  const settingsModalPath = path.join(rootDir, 'src', 'components', 'Modals', 'SettingsModal.tsx');

  it('Verify original image.jpeg exists and was preserved in project root', () => {
    expect(fs.existsSync(originalImagePath)).toBe(true);
    const stats = fs.statSync(originalImagePath);
    expect(stats.size).toBeGreaterThan(10000); // 206KB
  });

  it('Verify bundled public asset public/images/developer/image.jpeg exists and matches original', () => {
    expect(fs.existsSync(publicImagePath)).toBe(true);
    const origStats = fs.statSync(originalImagePath);
    const publicStats = fs.statSync(publicImagePath);
    expect(publicStats.size).toBe(origStats.size);
  });

  it('Verify public/sw.js includes /images/developer/image.jpeg in STATIC_ASSETS for offline caching', () => {
    expect(fs.existsSync(swPath)).toBe(true);
    const swContent = fs.readFileSync(swPath, 'utf-8');
    expect(swContent).toContain('/images/developer/image.jpeg');
  });

  it('Verify DeveloperModal.tsx displays Minhajul Islam portrait with object-cover and error handling', () => {
    const modalContent = fs.readFileSync(developerModalPath, 'utf-8');
    expect(modalContent).toContain('/images/developer/image.jpeg');
    expect(modalContent).toContain('object-cover');
    expect(modalContent).toContain('Minhajul Islam');
    expect(modalContent).toContain('CSE, Daffodil International University');
    expect(modalContent).toContain('Developed with Antigravity');
    expect(modalContent).toContain('https://github.com/Minhajulcse');
    expect(modalContent).toContain('https://codeforces.com/profile/NoObMin');
  });

  it('Verify SettingsModal.tsx includes developer profile with photograph', () => {
    const settingsContent = fs.readFileSync(settingsModalPath, 'utf-8');
    expect(settingsContent).toContain('/images/developer/image.jpeg');
    expect(settingsContent).toContain('object-cover');
    expect(settingsContent).toContain('Minhajul Islam');
    expect(settingsContent).toContain('CSE, Daffodil International University');
    expect(settingsContent).toContain('https://github.com/Minhajulcse');
    expect(settingsContent).toContain('https://codeforces.com/profile/NoObMin');
  });
});
