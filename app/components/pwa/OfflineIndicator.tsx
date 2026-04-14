import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '~/hooks/useOnlineStatus';

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-2 left-1/2 z-50 -translate-x-1/2 animate-in fade-in slide-in-from-top-2 duration-300"
    >
      <div className="flex items-center gap-1.5 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs font-medium text-yellow-600 dark:text-yellow-400 backdrop-blur-sm">
        <WifiOff className="h-3 w-3" />
        오프라인
      </div>
    </div>
  );
}
