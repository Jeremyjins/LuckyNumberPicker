import { Download, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '~/components/ui/button';
import { usePWAInstall } from '~/hooks/usePWAInstall';

export function InstallPrompt() {
  const { canInstall, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);

  if (!canInstall || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/95 p-3 shadow-lg backdrop-blur-sm">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">앱으로 설치하기</p>
          <p className="text-xs text-muted-foreground truncate">홈 화면에 추가하면 더 빠르게 사용할 수 있어요</p>
        </div>
        <Button size="sm" onClick={install} className="shrink-0 gap-1.5">
          <Download className="h-3.5 w-3.5" />
          설치
        </Button>
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 rounded-full p-1 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="닫기"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
