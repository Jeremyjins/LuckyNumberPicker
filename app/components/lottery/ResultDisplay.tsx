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

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4',
        'animate-result-pop',
        className
      )}
    >
      {/* 메인 결과 */}
      <div className="flex items-center justify-center gap-4 flex-wrap">
        {numbers.map((num, index) => (
          <div
            key={`${num}-${index}`}
            className={cn(
              'flex items-center justify-center',
              'min-w-40 h-40 px-6',
              'bg-primary text-primary-foreground',
              'rounded-2xl shadow-lg',
              'text-7xl font-bold tabular-nums'
            )}
            style={{
              animationDelay: `${index * 100}ms`,
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
