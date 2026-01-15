import { cn } from '~/lib/utils';

interface StatusBarProps {
  /** 남은 번호 개수 */
  remainingCount: number;
  /** 전체 번호 개수 */
  totalCount: number;
  /** 중복 허용 여부 */
  allowDuplicates: boolean;
  /** 추가 클래스 */
  className?: string;
}

/**
 * 상태 표시 바
 */
export function StatusBar({
  remainingCount,
  totalCount,
  allowDuplicates,
  className,
}: StatusBarProps) {
  const isLow = !allowDuplicates && remainingCount <= 3 && remainingCount > 0;
  const isEmpty = !allowDuplicates && remainingCount === 0;

  return (
    <div
      className={cn(
        'flex items-center justify-center py-3 px-4',
        'bg-muted/50 rounded-lg',
        className
      )}
    >
      <div className="flex items-center gap-2 text-md">
        <span className="text-muted-foreground">남은 번호:</span>
        <span
          className={cn(
            'font-semibold tabular-nums',
            isEmpty && 'text-destructive',
            isLow && 'text-orange-500 dark:text-orange-400',
            !isEmpty && !isLow && 'text-foreground'
          )}
        >
          {allowDuplicates ? (
            <span className="text-muted-foreground">무제한</span>
          ) : (
            <>
              {remainingCount}
              <span className="text-muted-foreground">/{totalCount}개</span>
            </>
          )}
        </span>
      </div>
    </div>
  );
}
