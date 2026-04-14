import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('PWA Manifest', () => {
  const manifest = JSON.parse(
    readFileSync(resolve(__dirname, '../../public/manifest.json'), 'utf-8')
  );

  it('has required fields', () => {
    expect(manifest.name).toBeTruthy();
    expect(manifest.short_name).toBeTruthy();
    expect(manifest.start_url).toBe('/');
    expect(manifest.display).toBe('standalone');
    expect(manifest.icons).toBeDefined();
    expect(manifest.icons.length).toBeGreaterThanOrEqual(3);
  });

  it('has proper icon sizes', () => {
    const sizes = manifest.icons.map((i: { sizes: string }) => i.sizes);
    expect(sizes).toContain('192x192');
    expect(sizes).toContain('512x512');
  });

  it('has a dedicated maskable icon', () => {
    const maskable = manifest.icons.filter((i: { purpose: string }) => i.purpose === 'maskable');
    expect(maskable.length).toBeGreaterThanOrEqual(1);
    const anyIcons = manifest.icons.filter((i: { purpose: string }) => i.purpose === 'any');
    const maskableSrcs = maskable.map((i: { src: string }) => i.src);
    const anySrcs = anyIcons.map((i: { src: string }) => i.src);
    const overlap = maskableSrcs.filter((s: string) => anySrcs.includes(s));
    expect(overlap.length).toBe(0);
  });

  it('has Korean language set', () => {
    expect(manifest.lang).toBe('ko');
  });
});
