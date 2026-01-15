import { HistoryItem } from './HistoryItem';
import { cn } from '~/lib/utils';

interface HistoryListProps {
  /** 히스토리 번호 목록 */
  history: number[];
  /** 복원 버튼 표시 여부 (중복 제외 모드일 때만) */
  allowRestore: boolean;
  /** 번호 복원 핸들러 */
  onRestore: (num: number) => void;
  /** 추가 클래스 */
  className?: string;
}

/**
 * 추첨 히스토리 목록 컴포넌트
 */
export function HistoryList({
  history,
  allowRestore,
  onRestore,
  className,
}: HistoryListProps) {
  if (history.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-2', className)}>
      <p className="text-xs text-muted-foreground text-center">
        추첨 기록 ({history.length}개)
      </p>

      <div
        className={cn(
          'flex flex-wrap items-center justify-center gap-2',
          'max-h-24 overflow-y-auto',
          'px-4 py-2'
        )}
      >
        {history.map((num, index) => (
          <HistoryItem
            key={`${num}-${index}`}
            number={num}
            showRemoveButton={allowRestore}
            onRemove={() => onRestore(num)}
          />
        ))}
      </div>
    </div>
  );
}
