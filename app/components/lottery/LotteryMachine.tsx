import { useCallback, useEffect, useRef, useState } from 'react';
import { useLotteryMachine } from '~/hooks/useLotteryMachine';
import { useDrawAnimation } from '~/hooks/useDrawAnimation';
import { SettingsDialog } from '~/components/settings/SettingsDialog';
import { ThemeSelector } from '~/components/ui/theme-selector';
import { StatusBar } from './StatusBar';
import { DrawButton } from './DrawButton';
import { ResultDisplay } from './ResultDisplay';
import { HistoryList } from './HistoryList';
import { Button } from '~/components/ui/button';
import { RotateCcw, Share2 } from 'lucide-react';
import { cn } from '~/lib/utils';
import { playTick, playSuccess } from '~/lib/sound';

/** 번호 순차 공개 간격 (ms) */
const REVEAL_INTERVAL_MS = 600;

/**
 * 행운번호 추첨기 메인 컨테이너
 */
export function LotteryMachine() {
  const {
    phase,
    settings,
    settingsOpen,
    drawRounds,
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

  // 순차 공개 상태
  const [revealedCount, setRevealedCount] = useState(0);
  const drawAgainButtonRef = useRef<HTMLButtonElement>(null);

  // 재설정 확인 UI 표시 여부
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // currentResult 변경 시 순차 공개 초기화 (첫 번호 즉시 표시)
  useEffect(() => {
    if (currentResult.length > 0) {
      setRevealedCount(1);
    } else {
      setRevealedCount(0);
    }
  }, [currentResult]);

  // 남은 번호를 순차적으로 공개
  useEffect(() => {
    if (revealedCount === 0 || revealedCount >= currentResult.length) return;
    const timer = setTimeout(() => {
      setRevealedCount((prev) => prev + 1);
    }, REVEAL_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [revealedCount, currentResult.length]);

  const revealedNumbers = currentResult.slice(0, revealedCount);
  const allRevealed = revealedCount >= currentResult.length && currentResult.length > 0;

  // 전체 공개 시 포커스 이동 + confetti (복수 추첨)
  useEffect(() => {
    if (!allRevealed) return;

    // 포커스를 "다시 추첨하기" 버튼으로 이동
    if (drawAgainButtonRef.current) {
      drawAgainButtonRef.current.focus();
    }

    // 복수 추첨 시 confetti
    if (currentResult.length > 1) {
      import('canvas-confetti').then(({ default: confetti }) => {
        confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
      }).catch(() => {});
    }
  }, [allRevealed, currentResult.length]);

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

  // Web Share API 핸들러
  const handleShare = useCallback(async () => {
    const text = `행운번호 추첨기로 뽑은 번호: ${currentResult.join(', ')}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: '행운번호 추첨 결과', text });
      } catch {
        // 사용자 취소 또는 공유 실패 - 무시
      }
    } else {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        // 클립보드 접근 실패 - 무시
      }
    }
  }, [currentResult]);

  // 추첨 시작
  const handleDraw = useCallback(() => {
    startDraw();
    startAnimation();
  }, [startDraw, startAnimation]);

  // 설정 버튼 클릭 (초기 상태)
  const handleSetupClick = useCallback(() => {
    openSettings();
  }, [openSettings]);

  // 재설정 확인 핸들러
  const handleResetConfirm = useCallback(() => {
    resetAll();
    setShowResetConfirm(false);
  }, [resetAll]);

  // Phase에 따른 렌더링
  const isInitial = phase === 'initial';
  const isReady = phase === 'ready';
  const isDrawing = phase === 'drawing';
  const isResult = phase === 'result';
  const showStatusBar = isReady || isDrawing || isResult;
  const showDrawButton = isReady || isDrawing;
  const showResult = isResult && revealedNumbers.length > 0;
  const showHistory = (isReady || isResult) && drawRounds.length > 0;
  const showFooter = isReady || isResult;

  return (
    <div
      className={cn(
        'flex flex-col bg-background relative min-h-dvh',
        isInitial && 'h-dvh overflow-hidden'
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

      {/* 상단 상태바 */}
      {showStatusBar && (
        <header
          className={cn(
            'pt-safe px-4 pt-4 shrink-0 bg-background z-40',
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
          isInitial && 'flex-1 justify-center',
          (isReady || isDrawing) && 'flex-1 justify-center'
        )}
      >
        {/* 초기 상태: Hero Section + 세팅하기 버튼 */}
        {isInitial && (
          <div className="flex flex-col items-center gap-6">
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
            <div className="animate-stagger animate-fade-in-up delay-300">
              <DrawButton
                variant="setup"
                size="lg"
                onClick={handleSetupClick}
              />
            </div>
          </div>
        )}

        {/* 결과 표시 - aria-live for screen readers */}
        <div
          aria-live="assertive"
          role="status"
          aria-atomic="true"
          aria-label="추첨 결과"
        >
          {showResult && (
            <ResultDisplay
              numbers={revealedNumbers}
              isVisible={true}
            />
          )}
        </div>

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

        {/* 공유 버튼 */}
        {isResult && allRevealed && currentResult.length > 0 && (
          <Button
            onClick={handleShare}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Share2 className="w-4 h-4" />
            공유하기
          </Button>
        )}

        {/* 결과 상태: 다시 추첨하기 버튼 */}
        {isResult && canDrawNow && allRevealed && (
          <Button
            ref={drawAgainButtonRef}
            onClick={drawAgain}
            variant="default"
            size="lg"
            className="mt-4"
          >
            다시 추첨하기
          </Button>
        )}

        {/* 추첨 불가 메시지 */}
        {isResult && !canDrawNow && !settings.allowDuplicates && allRevealed && (
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
            drawRounds={drawRounds}
            allowRestore={!settings.allowDuplicates}
            onRestore={restoreNumber}
          />
        </div>
      )}

      {/* 하단 푸터 */}
      <footer className="pb-safe px-4 pb-4 flex flex-col items-center gap-3 shrink-0 mt-auto">
        {showFooter && !showResetConfirm && (
          <Button
            onClick={() => setShowResetConfirm(true)}
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            다시 설정하기
          </Button>
        )}

        {/* 재설정 확인 UI */}
        {showFooter && showResetConfirm && (
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm text-muted-foreground">정말 초기화하시겠습니까?</p>
            <div className="flex gap-2">
              <Button
                onClick={handleResetConfirm}
                variant="destructive"
                size="sm"
              >
                초기화
              </Button>
              <Button
                onClick={() => setShowResetConfirm(false)}
                variant="outline"
                size="sm"
              >
                취소
              </Button>
            </div>
          </div>
        )}

        {/* 브랜드 로고 */}
        <div className="flex flex-col items-center gap-1 pb-2">
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
