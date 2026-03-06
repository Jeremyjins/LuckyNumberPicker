import { memo } from 'react';
import { HistoryItem } from './HistoryItem';
import { cn } from '~/lib/utils';

interface HistoryListProps {
  /** 회차별 추첨 결과 */
  drawRounds: number[][];
  /** 복원 버튼 표시 여부 (중복 제외 모드일 때만) */
  allowRestore: boolean;
  /** 번호 복원 핸들러 */
  onRestore: (num: number) => void;
  /** 추가 클래스 */
  className?: string;
}

/**
 * 추첨 히스토리 목록 - 회차별 그룹 표시
 */
export const HistoryList = memo(function HistoryList({
  drawRounds,
  allowRestore,
  onRestore,
  className,
}: HistoryListProps) {
  const totalCount = drawRounds.reduce((sum, round) => sum + round.length, 0);

  if (totalCount === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-2', className)}>
      <p className="text-xs text-muted-foreground text-center">
        추첨 기록 ({totalCount}개)
      </p>

      <ol className="space-y-2" role="list" aria-label="회차별 추첨 기록">
        {drawRounds.map((round, roundIndex) => (
          <li
            key={roundIndex}
            className="flex items-center gap-2"
            aria-label={`${roundIndex + 1}회차`}
          >
            <span className="text-xs text-muted-foreground min-w-[36px] shrink-0 text-right">
              {roundIndex + 1}회차
            </span>
            <div className="flex flex-wrap gap-1.5">
              {round.map((num, numIndex) => (
                <HistoryItem
                  key={`${num}-${numIndex}`}
                  number={num}
                  showRemoveButton={allowRestore}
                  onRemove={() => onRestore(num)}
                />
              ))}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
});
