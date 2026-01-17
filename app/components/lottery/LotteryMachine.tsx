import { useCallback } from 'react';
import { useLotteryMachine } from '~/hooks/useLotteryMachine';
import { useDrawAnimation } from '~/hooks/useDrawAnimation';
import { SettingsDialog } from '~/components/settings/SettingsDialog';
import { ThemeSelector } from '~/components/ui/theme-selector';
import { StatusBar } from './StatusBar';
import { DrawButton } from './DrawButton';
import { ResultDisplay } from './ResultDisplay';
import { HistoryList } from './HistoryList';
import { Button } from '~/components/ui/button';
import { RotateCcw } from 'lucide-react';
import { cn } from '~/lib/utils';
import { playTick, playSuccess } from '~/lib/sound';

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

  // 틱 핸들러 (숫자 변경 + 사운드)
  const handleTick = useCallback(
    (num: number, progress: number) => {
      updateDisplay(num);
      if (settings.soundEnabled) {
        playTick(progress);
      }
    },
    [updateDisplay, settings.soundEnabled]
  );

  // 애니메이션 완료 핸들러
  const handleAnimationComplete = useCallback(
    (numbers: number[]) => {
      if (settings.soundEnabled) {
        playSuccess();
      }
      finishDraw(numbers);
    },
    [finishDraw, settings.soundEnabled]
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
    onTick: handleTick,
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
    <div
      className={cn(
        'flex flex-col bg-background relative',
        // 초기 상태: 고정 뷰포트 높이, 스크롤 없음
        isInitial && 'h-dvh overflow-hidden',
        // 결과 상태: 최소 뷰포트 높이, 스크롤 허용
        !isInitial && 'min-h-dvh'
      )}
    >
      {/* 테마 선택 버튼 - 우상단 고정 */}
      <div className="fixed top-4 right-4 z-50 pt-safe">
        <ThemeSelector />
      </div>

      {/* 설정 다이얼로그 */}
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={closeSettings}
        settings={settings}
        onSettingsChange={updateSettings}
        onConfirm={confirmSettings}
      />

      {/* 상단 상태바 - 결과 화면에서 sticky */}
      {showStatusBar && (
        <header
          className={cn(
            'pt-safe px-4 pt-4 shrink-0 bg-background z-40',
            // 결과 화면에서 스크롤 시 상단 고정
            isResult && 'sticky top-0'
          )}
        >
          <StatusBar
            remainingCount={remainingCount}
            totalCount={totalRange}
            allowDuplicates={settings.allowDuplicates}
          />
        </header>
      )}

      {/* 메인 콘텐츠 영역 */}
      <main
        className={cn(
          'flex flex-col items-center px-4 py-4 gap-4',
          // 초기 상태: flex-1로 중앙 정렬
          isInitial && 'flex-1 justify-center',
          // ready/drawing 상태: 중앙 정렬
          (isReady || isDrawing) && 'flex-1 justify-center'
        )}
      >
        {/* 초기 상태: Hero Section + 세팅하기 버튼 */}
        {isInitial && (
          <div className="flex flex-col items-center gap-6">
            {/* Hero Title */}
            <div className="text-center animate-stagger animate-fade-in-up">
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
                행운번호
              </h1>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
                추첨기
              </h1>
              <p className="mt-4 text-base text-muted-foreground animate-stagger animate-fade-in-up delay-200">
                나만의 행운을 만들어보세요
              </p>
            </div>

            {/* Setup Button */}
            <div className="animate-stagger animate-fade-in-up delay-300">
              <DrawButton
                variant="setup"
                size="lg"
                onClick={handleSetupClick}
              />
            </div>
          </div>
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
        <div className="px-4 py-4 shrink-0">
          <HistoryList
            history={history}
            allowRestore={!settings.allowDuplicates}
            onRestore={restoreNumber}
          />
        </div>
      )}

      {/* 하단 푸터 */}
      <footer className="pb-safe px-4 pb-4 flex flex-col items-center gap-3 shrink-0 mt-auto">
        {showFooter && (
          <Button
            onClick={resetAll}
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            다시 설정하기
          </Button>
        )}
        {/* 브랜드 로고 */}
        <div className="flex flex-col items-center gap-1">
          <p className="text-muted-foreground tracking-tighter font-semibold text-[10px]">SPONSORED BY</p>
          <img
            src="/images/eb_icon.png"
            alt="EB"
            className={cn(
              'w-8 h-8',
              'opacity-40 hover:opacity-60',
              'transition-opacity duration-300',
              'dark:opacity-30 dark:hover:opacity-50',
              isInitial && 'animate-stagger animate-fade-in delay-500'
            )}
          />
        </div>
      </footer>
    </div>
  );
}
