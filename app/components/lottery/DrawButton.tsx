import { cn } from '~/lib/utils';
import { Settings, Shuffle } from 'lucide-react';

interface DrawButtonProps {
  /** 버튼 타입 */
  variant: 'setup' | 'draw';
  /** 크기 */
  size?: 'sm' | 'md' | 'lg';
  /** 비활성화 여부 */
  disabled?: boolean;
  /** 애니메이션 진행 중 여부 */
  isAnimating?: boolean;
  /** 애니메이션 중 표시할 숫자 */
  displayNumber?: number | null;
  /** 클릭 핸들러 */
  onClick?: () => void;
  /** 추가 클래스 */
  className?: string;
}

const sizeClasses = {
  sm: 'w-24 h-24 text-lg',
  md: 'w-32 h-32 text-xl',
  lg: 'w-40 h-40 text-2xl',
};

const shadowClasses = {
  setup: 'shadow-lg shadow-secondary/30 hover:shadow-xl hover:shadow-secondary/40',
  draw: 'shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40',
};

const displaySizeClasses = {
  sm: 'text-3xl',
  md: 'text-5xl',
  lg: 'text-6xl',
};

/**
 * 추첨 버튼 컴포넌트
 */
export function DrawButton({
  variant,
  size = 'lg',
  disabled = false,
  isAnimating = false,
  displayNumber,
  onClick,
  className,
}: DrawButtonProps) {
  const isSetup = variant === 'setup';

  return (
    <div className="relative">
      {/* Pulse ring overlay (GPU accelerated) */}
      {isAnimating && (
        <div
          className={cn(
            'absolute inset-0 rounded-full',
            'bg-primary/40 animate-pulse-ring',
            'pointer-events-none'
          )}
        />
      )}

      <button
        type="button"
        onClick={onClick}
        disabled={disabled || isAnimating}
        className={cn(
          // Base styles
          'relative rounded-full',
          'flex flex-col items-center justify-center gap-2',
          'font-bold transition-all duration-300',
          'outline-none focus-visible:ring-4 focus-visible:ring-ring/50',

          // Size
          sizeClasses[size],

          // Shadow
          shadowClasses[variant],
          'shadow-smooth',

          // Variant styles
          isSetup
            ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            : 'bg-primary text-primary-foreground hover:bg-primary/90',

          // Hover lift effect
          !disabled && !isAnimating && 'hover:-translate-y-1',

          // Disabled state
          disabled && 'opacity-50 cursor-not-allowed shadow-none',

          // Animation state (cursor only, no pulse on button itself)
          isAnimating && 'cursor-wait',

          // Active/pressed state
          !disabled && !isAnimating && 'active:scale-95 active:translate-y-0',

          className
        )}
        aria-label={isSetup ? '세팅하기' : '추첨하기'}
      >
      {isAnimating && displayNumber !== null ? (
        // 애니메이션 중: 숫자 표시
        <span
          className={cn(
            'font-bold tabular-nums animate-number-roll',
            displaySizeClasses[size]
          )}
        >
          {displayNumber}
        </span>
      ) : (
        // 기본 상태: 아이콘 + 텍스트
        <>
          {isSetup ? (
            <Settings className="w-8 h-8" />
          ) : (
            <Shuffle className="w-8 h-8" />
          )}
          <span>{isSetup ? '세팅하기' : '추첨하기'}</span>
        </>
      )}
      </button>
    </div>
  );
}
