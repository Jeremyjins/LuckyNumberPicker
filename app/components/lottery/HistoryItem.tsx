import { X } from 'lucide-react';
import { cn } from '~/lib/utils';

interface HistoryItemProps {
  /** 번호 */
  number: number;
  /** 삭제(복원) 버튼 표시 여부 */
  showRemoveButton: boolean;
  /** 삭제(복원) 클릭 핸들러 */
  onRemove?: () => void;
  /** 추가 클래스 */
  className?: string;
}

/**
 * 히스토리 아이템 컴포넌트
 */
export function HistoryItem({
  number,
  showRemoveButton,
  onRemove,
  className,
}: HistoryItemProps) {
  return (
    <div
      className={cn(
        'relative inline-flex items-center gap-1',
        'px-3 py-1.5 rounded-full',
        'bg-secondary text-secondary-foreground',
        'text-sm font-medium tabular-nums',
        'transition-all duration-200',
        className
      )}
    >
      <span>{number}</span>

      {showRemoveButton && onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className={cn(
            'ml-1 p-0.5 rounded-full',
            'hover:bg-destructive/20 hover:text-destructive',
            'transition-colors duration-150',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring'
          )}
          aria-label={`${number} 번호 복원`}
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
