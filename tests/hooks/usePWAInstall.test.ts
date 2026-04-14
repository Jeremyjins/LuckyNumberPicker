import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePWAInstall } from '~/hooks/usePWAInstall';

describe('usePWAInstall', () => {
  beforeEach(() => {
    vi.stubGlobal('addEventListener', vi.fn());
    vi.stubGlobal('removeEventListener', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns canInstall=false initially', () => {
    const { result } = renderHook(() => usePWAInstall());
    expect(result.current.canInstall).toBe(false);
  });

  it('sets canInstall=true when beforeinstallprompt fires', () => {
    let capturedHandler: ((e: Event) => void) | null = null;
    vi.stubGlobal('addEventListener', (event: string, handler: (e: Event) => void) => {
      if (event === 'beforeinstallprompt') capturedHandler = handler;
    });

    const { result } = renderHook(() => usePWAInstall());

    act(() => {
      const event = new Event('beforeinstallprompt');
      Object.assign(event, {
        preventDefault: vi.fn(),
        prompt: vi.fn().mockResolvedValue(undefined),
        userChoice: Promise.resolve({ outcome: 'accepted', platform: '' }),
      });
      capturedHandler?.(event);
    });

    expect(result.current.canInstall).toBe(true);
  });

  it('sets canInstall=false after appinstalled fires', () => {
    let installHandler: ((e: Event) => void) | null = null;
    let promptHandler: ((e: Event) => void) | null = null;
    vi.stubGlobal('addEventListener', (event: string, handler: (e: Event) => void) => {
      if (event === 'beforeinstallprompt') promptHandler = handler;
      if (event === 'appinstalled') installHandler = handler;
    });

    const { result } = renderHook(() => usePWAInstall());

    act(() => {
      const event = new Event('beforeinstallprompt');
      Object.assign(event, { preventDefault: vi.fn(), prompt: vi.fn(), userChoice: Promise.resolve({ outcome: 'accepted', platform: '' }) });
      promptHandler?.(event);
    });
    expect(result.current.canInstall).toBe(true);

    act(() => {
      installHandler?.(new Event('appinstalled'));
    });
    expect(result.current.canInstall).toBe(false);
  });
});
