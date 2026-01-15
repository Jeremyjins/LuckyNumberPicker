/**
 * 행운번호 추첨기 타입 정의
 */

/** 앱 상태 Phase */
export type Phase = 'initial' | 'settings' | 'ready' | 'drawing' | 'result';

/** 설정 인터페이스 */
export interface Settings {
  /** 시작 번호 (default: 1) */
  startNumber: number;
  /** 종료 번호 (default: 12) */
  endNumber: number;
  /** 한 번에 추첨할 개수 (default: 1) */
  drawCount: number;
  /** 중복 허용 여부 (default: false) */
  allowDuplicates: boolean;
  /** 사운드 활성화 여부 (default: true) */
  soundEnabled: boolean;
}

/** 전체 상태 인터페이스 */
export interface LotteryState {
  /** 현재 Phase */
  phase: Phase;
  /** 설정 */
  settings: Settings;
  /** 설정 다이얼로그 열림 여부 */
  settingsOpen: boolean;
  /** 추첨 히스토리 */
  history: number[];
  /** 제외된 번호들 (중복 제외 모드) */
  excludedNumbers: number[];
  /** 현재 추첨 결과 */
  currentResult: number[];
  /** 애니메이션 중 표시되는 숫자 */
  displayNumber: number | null;
  /** 애니메이션 진행 중 여부 */
  isAnimating: boolean;
}

/** 액션 타입 */
export type LotteryAction =
  | { type: 'OPEN_SETTINGS' }
  | { type: 'CLOSE_SETTINGS' }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<Settings> }
  | { type: 'CONFIRM_SETTINGS' }
  | { type: 'START_DRAW' }
  | { type: 'UPDATE_DISPLAY'; payload: number }
  | { type: 'FINISH_DRAW'; payload: number[] }
  | { type: 'RESTORE_NUMBER'; payload: number }
  | { type: 'DRAW_AGAIN' }
  | { type: 'RESET_ALL' };

/** 기본 설정 값 */
export const DEFAULT_SETTINGS: Settings = {
  startNumber: 1,
  endNumber: 12,
  drawCount: 1,
  allowDuplicates: false,
  soundEnabled: true,
};

/** 초기 상태 */
export const INITIAL_STATE: LotteryState = {
  phase: 'initial',
  settings: DEFAULT_SETTINGS,
  settingsOpen: false,
  history: [],
  excludedNumbers: [],
  currentResult: [],
  displayNumber: null,
  isAnimating: false,
};
