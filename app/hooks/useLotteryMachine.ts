import { useReducer, useCallback, useMemo } from 'react';
import type {
  LotteryState,
  LotteryAction,
  Settings,
  Phase,
} from '~/types/lottery';
import { INITIAL_STATE, DEFAULT_SETTINGS } from '~/types/lottery';
import { getRemainingCount, canDraw, getTotalRange, validateSettings } from '~/lib/lottery';

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
      };

    case 'CLOSE_SETTINGS':
      return {
        ...state,
        settingsOpen: false,
        phase: state.history.length > 0 ? 'result' : 'initial',
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
        // 설정 확정 시 히스토리 초기화
        history: [],
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
        excludedNumbers: newExcluded,
      };
    }

    case 'RESTORE_NUMBER':
      return {
        ...state,
        excludedNumbers: state.excludedNumbers.filter((n) => n !== action.payload),
        history: state.history.filter((n) => n !== action.payload),
      };

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
  const [state, dispatch] = useReducer(lotteryReducer, INITIAL_STATE);

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
