/**
 * 애니메이션 유틸리티
 */

/** 이징 함수 모음 */
export const easings = {
  /** 빠르게 시작해서 천천히 끝남 (추첨에 적합) */
  easeOutQuart: (t: number): number => 1 - Math.pow(1 - t, 4),
  /** 더 극적인 감속 */
  easeOutExpo: (t: number): number => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  /** 선형 */
  linear: (t: number): number => t,
};

/** 애니메이션 스케줄 */
export interface AnimationSchedule {
  /** 각 틱의 타임스탬프 (ms) */
  timestamps: number[];
  /** 총 지속 시간 (ms) */
  totalDuration: number;
}

/**
 * 애니메이션 스케줄 생성
 * 처음에는 빠르게, 나중에는 느리게 숫자가 변경되도록 타이밍 배열 생성
 */
export function generateAnimationSchedule(
  duration: number = 2000,
  easing: (t: number) => number = easings.easeOutQuart
): AnimationSchedule {
  const timestamps: number[] = [];
  const minInterval = 50;  // 최소 간격 (가장 빠를 때)
  const maxInterval = 400; // 최대 간격 (가장 느릴 때)
  let elapsed = 0;

  while (elapsed < duration) {
    timestamps.push(elapsed);
    const progress = elapsed / duration;
    const easedProgress = easing(progress);
    const interval = minInterval + (maxInterval - minInterval) * easedProgress;
    elapsed += interval;
  }

  // 마지막 타임스탬프 추가
  timestamps.push(duration);

  return { timestamps, totalDuration: duration };
}

/**
 * requestAnimationFrame 기반 애니메이션 실행
 */
export function runAnimation(
  schedule: AnimationSchedule,
  onTick: (tickIndex: number) => void,
  onComplete: () => void
): () => void {
  let currentIndex = 0;
  let startTime: number | null = null;
  let animationId: number | null = null;
  let cancelled = false;

  const animate = (timestamp: number) => {
    if (cancelled) return;

    if (startTime === null) {
      startTime = timestamp;
    }

    const elapsed = timestamp - startTime;

    // 다음 틱 시간에 도달했는지 확인
    while (
      currentIndex < schedule.timestamps.length &&
      elapsed >= schedule.timestamps[currentIndex]
    ) {
      onTick(currentIndex);
      currentIndex++;
    }

    // 아직 완료되지 않았으면 계속 실행
    if (elapsed < schedule.totalDuration) {
      animationId = requestAnimationFrame(animate);
    } else {
      onComplete();
    }
  };

  animationId = requestAnimationFrame(animate);

  // 취소 함수 반환
  return () => {
    cancelled = true;
    if (animationId !== null) {
      cancelAnimationFrame(animationId);
    }
  };
}

/** 애니메이션 설정 상수 */
export const ANIMATION_CONFIG = {
  /** 총 애니메이션 시간 (ms) */
  duration: 2000,
  /** 최소 틱 간격 (ms) */
  minInterval: 50,
  /** 최대 틱 간격 (ms) */
  maxInterval: 400,
} as const;
