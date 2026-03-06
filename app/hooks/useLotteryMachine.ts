import { useReducer, useCallback, useMemo, useEffect } from 'react';
import type {
  LotteryState,
  LotteryAction,
  Settings,
  Phase,
} from '~/types/lottery';
import { INITIAL_STATE, DEFAULT_SETTINGS } from '~/types/lottery';
import { getRemainingCount, canDraw, getTotalRange, validateSettings } from '~/lib/lottery';

/**
 * localStorage에서 저장된 설정 로드
 */
function loadSavedSettings(): Partial<Settings> | null {
  try {
    const saved = localStorage.getItem('lottery-settings');
    if (!saved) return null;
    const parsed = JSON.parse(saved) as Partial<Settings>;
    if (
      typeof parsed.startNumber === 'number' &&
      typeof parsed.endNumber === 'number' &&
      typeof parsed.drawCount === 'number' &&
      parsed.startNumber >= 1 &&
      parsed.endNumber >= parsed.startNumber
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * 초기 상태 생성 (localStorage 복원 포함)
 */
function getInitialState(): LotteryState {
  try {
    const savedSettings = loadSavedSettings();
    if (savedSettings) {
      return {
        ...INITIAL_STATE,
        settings: { ...DEFAULT_SETTINGS, ...savedSettings },
      };
    }
  } catch {
    // localStorage 접근 불가 (SSR 등)
  }
  return INITIAL_STATE;
}

/**
 * 상태 리듀서
 */
function lotteryReducer(state: LotteryState, action: LotteryAction): LotteryState {
  switch (action.type) {
    case 'OPEN_SETTINGS':
      return {
        ...state,
        settingsOpen: true,
        phase: 'settings',
        pendingSettings: state.settings,
      };

    case 'CLOSE_SETTINGS':
      return {
        ...state,
        settingsOpen: false,
        phase: state.history.length > 0 ? 'result' : 'initial',
        // 설정 취소 시 다이얼로그 열기 전 상태로 복원
        settings: state.pendingSettings ?? state.settings,
        pendingSettings: null,
      };

    case 'REVERT_SETTINGS':
      return {
        ...state,
        settings: state.pendingSettings ?? state.settings,
        pendingSettings: null,
      };

    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload,
        },
      };

    case 'CONFIRM_SETTINGS': {
      // 방어적 검증: 설정이 유효하지 않으면 변경하지 않음
      const validation = validateSettings(state.settings);
      if (!validation.valid) {
        return state;
      }
      return {
        ...state,
        settingsOpen: false,
        phase: 'ready',
        pendingSettings: null,
        // 설정 확정 시 히스토리 초기화
        history: [],
        drawRounds: [],
        excludedNumbers: [],
        currentResult: [],
      };
    }

    case 'START_DRAW':
      return {
        ...state,
        phase: 'drawing',
        isAnimating: true,
        currentResult: [],
      };

    case 'UPDATE_DISPLAY':
      return {
        ...state,
        displayNumber: action.payload,
      };

    case 'FINISH_DRAW': {
      const newHistory = [...state.history, ...action.payload];
      const newExcluded = state.settings.allowDuplicates
        ? state.excludedNumbers
        : [...state.excludedNumbers, ...action.payload];

      return {
        ...state,
        phase: 'result',
        isAnimating: false,
        displayNumber: null,
        currentResult: action.payload,
        history: newHistory,
        drawRounds: [...state.drawRounds, action.payload],
        excludedNumbers: newExcluded,
      };
    }

    case 'RESTORE_NUMBER': {
      const excludedIdx = state.excludedNumbers.indexOf(action.payload);
      const newExcluded =
        excludedIdx === -1
          ? state.excludedNumbers
          : [
              ...state.excludedNumbers.slice(0, excludedIdx),
              ...state.excludedNumbers.slice(excludedIdx + 1),
            ];
      const historyIdx = state.history.indexOf(action.payload);
      const newHistory =
        historyIdx === -1
          ? state.history
          : [
              ...state.history.slice(0, historyIdx),
              ...state.history.slice(historyIdx + 1),
            ];

      // drawRounds에서도 제거: 번호가 포함된 가장 최근 회차에서 첫 번째 occurrence 제거
      let newDrawRounds = state.drawRounds;
      const roundIdx = [...state.drawRounds]
        .reverse()
        .findIndex((r) => r.includes(action.payload));
      if (roundIdx !== -1) {
        const actualIdx = state.drawRounds.length - 1 - roundIdx;
        const round = state.drawRounds[actualIdx];
        const numIdx = round.indexOf(action.payload);
        const newRound = [...round.slice(0, numIdx), ...round.slice(numIdx + 1)];
        newDrawRounds =
          newRound.length === 0
            ? [
                ...state.drawRounds.slice(0, actualIdx),
                ...state.drawRounds.slice(actualIdx + 1),
              ]
            : [
                ...state.drawRounds.slice(0, actualIdx),
                newRound,
                ...state.drawRounds.slice(actualIdx + 1),
              ];
      }

      return {
        ...state,
        excludedNumbers: newExcluded,
        history: newHistory,
        drawRounds: newDrawRounds,
      };
    }

    case 'DRAW_AGAIN':
      return {
        ...state,
        phase: 'ready',
        currentResult: [],
        displayNumber: null,
      };

    case 'RESET_ALL':
      return {
        ...INITIAL_STATE,
        settings: DEFAULT_SETTINGS,
        pendingSettings: null,
        drawRounds: [],
      };

    default:
      return state;
  }
}

/**
 * useLotteryMachine 훅 반환 타입
 */
export interface UseLotteryMachineReturn {
  // State
  state: LotteryState;
  phase: Phase;
  settings: Settings;
  settingsOpen: boolean;
  history: number[];
  drawRounds: number[][];
  excludedNumbers: number[];
  currentResult: number[];
  displayNumber: number | null;
  isAnimating: boolean;

  // Computed
  remainingCount: number;
  totalRange: number;
  canDrawNow: boolean;

  // Actions
  openSettings: () => void;
  closeSettings: () => void;
  updateSettings: (settings: Partial<Settings>) => void;
  confirmSettings: () => void;
  startDraw: () => void;
  updateDisplay: (num: number) => void;
  finishDraw: (numbers: number[]) => void;
  restoreNumber: (num: number) => void;
  drawAgain: () => void;
  resetAll: () => void;
}

/**
 * 행운번호 추첨기 상태 머신 훅
 */
export function useLotteryMachine(): UseLotteryMachineReturn {
  const [state, dispatch] = useReducer(lotteryReducer, undefined, getInitialState);

  // Computed values
  const totalRange = useMemo(
    () => getTotalRange(state.settings.startNumber, state.settings.endNumber),
    [state.settings.startNumber, state.settings.endNumber]
  );

  const remainingCount = useMemo(
    () =>
      getRemainingCount(
        state.settings.startNumber,
        state.settings.endNumber,
        state.excludedNumbers,
        state.settings.allowDuplicates
      ),
    [
      state.settings.startNumber,
      state.settings.endNumber,
      state.excludedNumbers,
      state.settings.allowDuplicates,
    ]
  );

  const canDrawNow = useMemo(
    () =>
      canDraw(
        state.settings.startNumber,
        state.settings.endNumber,
        state.settings.drawCount,
        state.excludedNumbers,
        state.settings.allowDuplicates
      ),
    [
      state.settings.startNumber,
      state.settings.endNumber,
      state.settings.drawCount,
      state.excludedNumbers,
      state.settings.allowDuplicates,
    ]
  );

  // 설정 변경 시 localStorage에 저장
  useEffect(() => {
    try {
      localStorage.setItem('lottery-settings', JSON.stringify(state.settings));
    } catch {
      // localStorage 접근 불가 (프라이빗 모드, 용량 초과 등)
    }
  }, [state.settings]);

  // Actions
  const openSettings = useCallback(() => dispatch({ type: 'OPEN_SETTINGS' }), []);
  const closeSettings = useCallback(() => dispatch({ type: 'CLOSE_SETTINGS' }), []);
  const updateSettings = useCallback(
    (settings: Partial<Settings>) => dispatch({ type: 'UPDATE_SETTINGS', payload: settings }),
    []
  );
  const confirmSettings = useCallback(() => dispatch({ type: 'CONFIRM_SETTINGS' }), []);
  const startDraw = useCallback(() => dispatch({ type: 'START_DRAW' }), []);
  const updateDisplay = useCallback(
    (num: number) => dispatch({ type: 'UPDATE_DISPLAY', payload: num }),
    []
  );
  const finishDraw = useCallback(
    (numbers: number[]) => dispatch({ type: 'FINISH_DRAW', payload: numbers }),
    []
  );
  const restoreNumber = useCallback(
    (num: number) => dispatch({ type: 'RESTORE_NUMBER', payload: num }),
    []
  );
  const drawAgain = useCallback(() => dispatch({ type: 'DRAW_AGAIN' }), []);
  const resetAll = useCallback(() => dispatch({ type: 'RESET_ALL' }), []);

  return {
    // State
    state,
    phase: state.phase,
    settings: state.settings,
    settingsOpen: state.settingsOpen,
    history: state.history,
    drawRounds: state.drawRounds,
    excludedNumbers: state.excludedNumbers,
    currentResult: state.currentResult,
    displayNumber: state.displayNumber,
    isAnimating: state.isAnimating,

    // Computed
    remainingCount,
    totalRange,
    canDrawNow,

    // Actions
    openSettings,
    closeSettings,
    updateSettings,
    confirmSettings,
    startDraw,
    updateDisplay,
    finishDraw,
    restoreNumber,
    drawAgain,
    resetAll,
  };
}
