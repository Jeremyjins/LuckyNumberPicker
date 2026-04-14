import { memo } from 'react';
import { cn } from '~/lib/utils';

interface ResultDisplayProps {
  /** 추첨된 번호들 */
  numbers: number[];
  /** 표시 여부 */
  isVisible: boolean;
  /** 추가 클래스 */
  className?: string;
}

/**
 * 숫자 개수에 따른 크기 결정
 */
function getResultSize(count: number): {
  container: string;
  text: string;
  gap: string;
} {
  if (count <= 3) {
    return {
      container: 'min-w-32 h-32 px-4 rounded-2xl sm:min-w-40 sm:h-40',
      text: 'text-5xl sm:text-7xl',
      gap: 'gap-4',
    };
  }
  if (count <= 9) {
    return {
      container: 'min-w-20 h-20 px-3 rounded-xl sm:min-w-24 sm:h-24',
      text: 'text-3xl sm:text-4xl',
      gap: 'gap-3',
    };
  }
  return {
    container: 'min-w-14 h-14 px-2 rounded-lg sm:min-w-16 sm:h-16',
    text: 'text-xl sm:text-2xl',
    gap: 'gap-2',
  };
}

/** 회차 위치 기반 로또볼 색상 */
const BALL_BG_CLASSES = [
  'bg-primary text-primary-foreground',    // 오렌지
  'bg-blue-500 text-white',                // 파랑
  'bg-emerald-500 text-white',             // 초록
  'bg-violet-600 text-white',              // 보라
  'bg-rose-500 text-white',                // 빨강
];

const BALL_GLOW_CLASSES = [
  'ball-glow-orange',
  'ball-glow-blue',
  'ball-glow-emerald',
  'ball-glow-violet',
  'ball-glow-rose',
];

/**
 * 추첨 결과 표시 컴포넌트
 */
export const ResultDisplay = memo(function ResultDisplay({
  numbers,
  isVisible,
  className,
}: ResultDisplayProps) {
  if (!isVisible || numbers.length === 0) {
    return null;
  }

  const size = getResultSize(numbers.length);

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 w-full',
        'animate-result-pop',
        className
      )}
    >
      {/* 메인 결과 */}
      <div
        className={cn(
          'flex items-center justify-center flex-wrap',
          'max-w-full',
          size.gap
        )}
      >
        {numbers.map((num, index) => (
          <div
            key={`${num}-${index}`}
            className={cn(
              'flex items-center justify-center',
              size.container,
              BALL_BG_CLASSES[index % BALL_BG_CLASSES.length],
              'ball-shimmer',
              BALL_GLOW_CLASSES[index % BALL_GLOW_CLASSES.length],
              'shadow-lg',
              size.text,
              'font-bold tabular-nums',
              'animate-result-pop'
            )}
            style={{
              animationDelay: `${index * 80}ms`,
            }}
          >
            {num}
          </div>
        ))}
      </div>

      {/* 추첨 완료 메시지 */}
      <p className="text-base font-medium text-muted-foreground">
        {numbers.length === 1
          ? '행운의 번호가 선택되었습니다!'
          : `${numbers.length}개의 번호가 선택되었습니다!`}
      </p>
    </div>
  );
});
