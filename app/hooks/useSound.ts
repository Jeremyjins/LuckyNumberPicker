import { useState, useEffect, useCallback, useRef } from 'react';
import { playTick as playSoundTick, playSuccess as playSoundSuccess } from '~/lib/sound';

const STORAGE_KEY = 'sound-enabled';

/**
 * 사운드 상태 관리 훅
 */
export interface UseSoundReturn {
  /** 사운드 활성화 여부 */
  enabled: boolean;
  /** 사운드 활성화 설정 */
  setEnabled: (enabled: boolean) => void;
  /** 틱 사운드 재생 */
  playTick: (progress?: number) => void;
  /** 성공 사운드 재생 */
  playSuccess: () => void;
}

function getStoredEnabled(): boolean {
  if (typeof window === 'undefined') return true;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === null) return true;
    return stored === 'true';
  } catch {
    return true;
  }
}

export function useSound(): UseSoundReturn {
  const [enabled, setEnabledState] = useState<boolean>(() => getStoredEnabled());
  const enabledRef = useRef(enabled);

  // Keep ref in sync
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  // Save to localStorage when enabled changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(enabled));
    } catch {
      // Ignore storage errors
    }
  }, [enabled]);

  const setEnabled = useCallback((value: boolean) => {
    setEnabledState(value);
  }, []);

  const playTick = useCallback((progress: number = 0) => {
    if (enabledRef.current) {
      playSoundTick(progress);
    }
  }, []);

  const playSuccess = useCallback(() => {
    if (enabledRef.current) {
      playSoundSuccess();
    }
  }, []);

  return {
    enabled,
    setEnabled,
    playTick,
    playSuccess,
  };
}
