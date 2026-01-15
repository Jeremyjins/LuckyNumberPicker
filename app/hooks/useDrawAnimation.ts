import { useState, useCallback, useRef, useEffect } from 'react';
import {
  generateAnimationSchedule,
  runAnimation,
  ANIMATION_CONFIG,
} from '~/lib/animation';
import { getRandomNumber, getRandomNumbers } from '~/lib/lottery';

export interface UseDrawAnimationOptions {
  /** 시작 번호 */
  startNumber: number;
  /** 종료 번호 */
  endNumber: number;
  /** 제외할 번호들 */
  excludedNumbers: number[];
  /** 추첨할 개수 */
  drawCount: number;
  /** 중복 허용 여부 */
  allowDuplicates: boolean;
  /** 애니메이션 시간 (ms) */
  duration?: number;
  /** 틱마다 호출되는 콜백 */
  onTick?: (currentNumber: number, progress: number) => void;
  /** 완료 시 호출되는 콜백 */
  onComplete?: (finalNumbers: number[]) => void;
}

export interface UseDrawAnimationReturn {
  /** 애니메이션 진행 중 여부 */
  isAnimating: boolean;
  /** 현재 표시 중인 숫자 */
  currentDisplay: number | null;
  /** 애니메이션 시작 */
  start: () => void;
  /** 애니메이션 중지 */
  stop: () => void;
}

/**
 * 추첨 애니메이션 훅
 */
export function useDrawAnimation(
  options: UseDrawAnimationOptions
): UseDrawAnimationReturn {
  const {
    startNumber,
    endNumber,
    excludedNumbers,
    drawCount,
    allowDuplicates,
    duration = ANIMATION_CONFIG.duration,
    onTick,
    onComplete,
  } = options;

  const [isAnimating, setIsAnimating] = useState(false);
  const [currentDisplay, setCurrentDisplay] = useState<number | null>(null);

  const cancelRef = useRef<(() => void) | null>(null);
  const finalNumbersRef = useRef<number[]>([]);

  // 옵션 변경 시 ref 업데이트를 위한 최신 값 유지
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const start = useCallback(() => {
    // 이미 진행 중이면 무시
    if (isAnimating) return;

    // 최종 결과 미리 계산
    const finalNumbers = getRandomNumbers(
      startNumber,
      endNumber,
      drawCount,
      excludedNumbers,
      allowDuplicates
    );

    if (finalNumbers.length === 0) {
      onComplete?.([]);
      return;
    }

    finalNumbersRef.current = finalNumbers;
    setIsAnimating(true);

    // 애니메이션 스케줄 생성
    const schedule = generateAnimationSchedule(duration);

    // 애니메이션 실행
    const totalTicks = schedule.timestamps.length;
    cancelRef.current = runAnimation(
      schedule,
      (tickIndex: number) => {
        // 각 틱마다 랜덤 숫자 표시
        const randomNum = getRandomNumber(
          optionsRef.current.startNumber,
          optionsRef.current.endNumber,
          [] // 애니메이션 중에는 제외 없이 모든 숫자 표시
        );

        // progress 계산 (0 ~ 1)
        const progress = totalTicks > 1 ? tickIndex / (totalTicks - 1) : 1;

        if (randomNum !== null) {
          setCurrentDisplay(randomNum);
          optionsRef.current.onTick?.(randomNum, progress);
        }
      },
      () => {
        // 완료 시 최종 결과 표시
        const final = finalNumbersRef.current;
        setCurrentDisplay(final[0] ?? null);
        setIsAnimating(false);
        optionsRef.current.onComplete?.(final);
      }
    );
  }, [
    isAnimating,
    startNumber,
    endNumber,
    drawCount,
    excludedNumbers,
    allowDuplicates,
    duration,
    onTick,
    onComplete,
  ]);

  const stop = useCallback(() => {
    if (cancelRef.current) {
      cancelRef.current();
      cancelRef.current = null;
    }
    setIsAnimating(false);
    setCurrentDisplay(null);
  }, []);

  // 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (cancelRef.current) {
        cancelRef.current();
      }
    };
  }, []);

  return {
    isAnimating,
    currentDisplay,
    start,
    stop,
  };
}
