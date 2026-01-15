import { useCallback } from 'react';
import { useLotteryMachine } from '~/hooks/useLotteryMachine';
import { useDrawAnimation } from '~/hooks/useDrawAnimation';
import { SettingsDialog } from '~/components/settings/SettingsDialog';
import { StatusBar } from './StatusBar';
import { DrawButton } from './DrawButton';
import { ResultDisplay } from './ResultDisplay';
import { HistoryList } from './HistoryList';
import { Button } from '~/components/ui/button';
import { RotateCcw } from 'lucide-react';
import { cn } from '~/lib/utils';

/**
 * 행운번호 추첨기 메인 컨테이너
 */
export function LotteryMachine() {
  const {
    phase,
    settings,
    settingsOpen,
    history,
    excludedNumbers,
    currentResult,
    remainingCount,
    totalRange,
    canDrawNow,
    openSettings,
    closeSettings,
    updateSettings,
    confirmSettings,
    startDraw,
    updateDisplay,
    finishDraw,
    restoreNumber,
    drawAgain,
    resetAll,
  } = useLotteryMachine();

  // 애니메이션 완료 핸들러
  const handleAnimationComplete = useCallback(
    (numbers: number[]) => {
      finishDraw(numbers);
    },
    [finishDraw]
  );

  // 애니메이션 훅
  const {
    isAnimating,
    currentDisplay,
    start: startAnimation,
  } = useDrawAnimation({
    startNumber: settings.startNumber,
    endNumber: settings.endNumber,
    excludedNumbers,
    drawCount: settings.drawCount,
    allowDuplicates: settings.allowDuplicates,
    onTick: updateDisplay,
    onComplete: handleAnimationComplete,
  });

  // 추첨 시작
  const handleDraw = useCallback(() => {
    startDraw();
    startAnimation();
  }, [startDraw, startAnimation]);

  // 설정 버튼 클릭 (초기 상태)
  const handleSetupClick = useCallback(() => {
    openSettings();
  }, [openSettings]);

  // Phase에 따른 렌더링
  const isInitial = phase === 'initial';
  const isReady = phase === 'ready';
  const isDrawing = phase === 'drawing';
  const isResult = phase === 'result';
  const showStatusBar = isReady || isDrawing || isResult;
  const showDrawButton = isReady || isDrawing;
  const showResult = isResult && currentResult.length > 0;
  const showHistory = (isReady || isResult) && history.length > 0;
  const showFooter = isReady || isResult;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* 설정 다이얼로그 */}
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={closeSettings}
        settings={settings}
        onSettingsChange={updateSettings}
        onConfirm={confirmSettings}
      />

      {/* 상단 상태바 */}
      {showStatusBar && (
        <header className="pt-safe px-4 pt-4">
          <StatusBar
            remainingCount={remainingCount}
            totalCount={totalRange}
            allowDuplicates={settings.allowDuplicates}
          />
        </header>
      )}

      {/* 메인 콘텐츠 영역 */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 gap-8">
        {/* 초기 상태: 세팅하기 버튼 */}
        {isInitial && (
          <DrawButton
            variant="setup"
            size="lg"
            onClick={handleSetupClick}
          />
        )}

        {/* 결과 표시 */}
        {showResult && (
          <ResultDisplay
            numbers={currentResult}
            isVisible={true}
          />
        )}

        {/* 추첨 버튼 (ready/drawing 상태) */}
        {showDrawButton && (
          <DrawButton
            variant="draw"
            size="lg"
            disabled={!canDrawNow}
            isAnimating={isAnimating}
            displayNumber={currentDisplay}
            onClick={handleDraw}
          />
        )}

        {/* 결과 상태: 다시 추첨하기 버튼 */}
        {isResult && canDrawNow && (
          <Button
            onClick={drawAgain}
            variant="default"
            size="lg"
            className="mt-4"
          >
            다시 추첨하기
          </Button>
        )}

        {/* 추첨 불가 메시지 */}
        {isResult && !canDrawNow && !settings.allowDuplicates && (
          <p className="text-sm text-muted-foreground text-center mt-4">
            모든 번호가 추첨되었습니다.<br />
            히스토리에서 번호를 복원하거나 다시 설정하세요.
          </p>
        )}
      </main>

      {/* 히스토리 영역 */}
      {showHistory && (
        <div className="px-4 pb-4">
          <HistoryList
            history={history}
            allowRestore={!settings.allowDuplicates}
            onRestore={restoreNumber}
          />
        </div>
      )}

      {/* 하단 푸터 */}
      {showFooter && (
        <footer className="pb-safe px-4 pb-6">
          <Button
            onClick={resetAll}
            variant="ghost"
            size="sm"
            className={cn(
              'w-full',
              'text-muted-foreground hover:text-foreground mb-4'
            )}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            다시 설정하기
          </Button>
        </footer>
      )}
    </div>
  );
}
