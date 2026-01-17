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
 * - 1~3개: 큰 크기 (기본)
 * - 4~9개: 중간 크기
 * - 10개 이상: 작은 크기
 */
function getResultSize(count: number): {
  container: string;
  text: string;
  gap: string;
} {
  if (count <= 3) {
    return {
      container: 'min-w-32 h-32 px-4 rounded-2xl sm:min-w-40 sm:h-40 sm:px-6',
      text: 'text-5xl sm:text-7xl',
      gap: 'gap-4',
    };
  }
  if (count <= 9) {
    return {
      container: 'min-w-20 h-20 px-3 rounded-xl sm:min-w-24 sm:h-24 sm:px-4',
      text: 'text-3xl sm:text-4xl',
      gap: 'gap-3',
    };
  }
  // 10개 이상
  return {
    container: 'min-w-14 h-14 px-2 rounded-lg sm:min-w-16 sm:h-16 sm:px-3',
    text: 'text-xl sm:text-2xl',
    gap: 'gap-2',
  };
}

/**
 * 추첨 결과 표시 컴포넌트
 */
export function ResultDisplay({
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
              'bg-primary text-primary-foreground',
              'shadow-lg',
              size.text,
              'font-bold tabular-nums'
            )}
            style={{
              animationDelay: `${index * 50}ms`,
            }}
          >
            {num}
          </div>
        ))}
      </div>

      {/* 추첨 완료 메시지 */}
      <p className="text-sm text-muted-foreground">
        {numbers.length === 1
          ? '행운의 번호가 선택되었습니다!'
          : `${numbers.length}개의 번호가 선택되었습니다!`}
      </p>
    </div>
  );
}
