import { memo } from 'react';
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
 * 상태 표시 바 - 남은 번호 수 + 진행률
 */
export const StatusBar = memo(function StatusBar({
  remainingCount,
  totalCount,
  allowDuplicates,
  className,
}: StatusBarProps) {
  const isLow = !allowDuplicates && remainingCount <= 3 && remainingCount > 0;
  const isEmpty = !allowDuplicates && remainingCount === 0;

  const usedCount = allowDuplicates ? 0 : totalCount - remainingCount;
  const progressPct = allowDuplicates || totalCount === 0 ? 0 : (usedCount / totalCount) * 100;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="남은 번호 현황"
      className={cn(
        'flex flex-col gap-2 py-3 px-4',
        'bg-muted/50 rounded-lg',
        className
      )}
    >
      <div className="flex items-center justify-center gap-2 text-md">
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

      {/* 진행률 바 (중복 허용이 아닐 때만 표시) */}
      {!allowDuplicates && totalCount > 0 && (
        <div
          className="w-full h-1 bg-border rounded-full overflow-hidden"
          aria-hidden="true"
        >
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              isEmpty && 'bg-destructive',
              isLow && 'bg-gradient-to-r from-orange-400 to-orange-500',
              !isEmpty && !isLow && 'bg-gradient-to-r from-primary/80 to-primary'
            )}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}
    </div>
  );
});
