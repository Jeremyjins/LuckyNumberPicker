import { RotateCcw } from 'lucide-react';
import { cn } from '~/lib/utils';

interface HistoryItemProps {
  /** 번호 */
  number: number;
  /** 복원 버튼 표시 여부 */
  showRemoveButton: boolean;
  /** 복원 클릭 핸들러 */
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
          // WCAG 2.1: minimum 44×44px touch target
          className={cn(
            'ml-0.5 flex items-center justify-center',
            'min-w-[44px] min-h-[44px] -my-3 -mr-3 rounded-full px-2',
            'hover:bg-primary/10 hover:text-primary',
            'transition-colors duration-150',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring'
          )}
          aria-label={`${number} 번호 복원`}
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
