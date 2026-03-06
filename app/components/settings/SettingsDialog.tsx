import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { Switch } from '~/components/ui/switch';
import { Separator } from '~/components/ui/separator';
import { NumberInput } from './NumberInput';
import type { Settings } from '~/types/lottery';
import { validateSettings } from '~/lib/lottery';
import { cn } from '~/lib/utils';

const PRESETS = [
  { label: '로또 6/45', startNumber: 1, endNumber: 45, drawCount: 6 },
  { label: '빙고 1/75', startNumber: 1, endNumber: 75, drawCount: 5 },
  { label: '주사위', startNumber: 1, endNumber: 6, drawCount: 1 },
] as const;

function isPresetActive(settings: Settings, preset: (typeof PRESETS)[number]): boolean {
  return (
    settings.startNumber === preset.startNumber &&
    settings.endNumber === preset.endNumber &&
    settings.drawCount === preset.drawCount
  );
}

interface SettingsDialogProps {
  /** 다이얼로그 열림 여부 */
  open: boolean;
  /** 다이얼로그 열림 상태 변경 핸들러 */
  onOpenChange: (open: boolean) => void;
  /** 현재 설정 */
  settings: Settings;
  /** 설정 변경 핸들러 */
  onSettingsChange: (settings: Partial<Settings>) => void;
  /** 설정 완료 핸들러 */
  onConfirm: () => void;
}

/**
 * 설정 다이얼로그
 */
export function SettingsDialog({
  open,
  onOpenChange,
  settings,
  onSettingsChange,
  onConfirm,
}: SettingsDialogProps) {
  const validation = validateSettings(settings);

  const handlePresetClick = (preset: (typeof PRESETS)[number]) => {
    onSettingsChange({
      startNumber: preset.startNumber,
      endNumber: preset.endNumber,
      drawCount: preset.drawCount,
    });
  };

  const handleConfirm = () => {
    if (validation.valid) {
      onConfirm();
    }
  };

  // 시작/종료 번호 변경 시 자동 스왑
  const handleStartNumberChange = (value: number) => {
    if (value > settings.endNumber) {
      onSettingsChange({ startNumber: settings.endNumber, endNumber: value });
    } else {
      onSettingsChange({ startNumber: value });
    }
  };

  const handleEndNumberChange = (value: number) => {
    if (value < settings.startNumber) {
      onSettingsChange({ startNumber: value, endNumber: settings.startNumber });
    } else {
      onSettingsChange({ endNumber: value });
    }
  };

  // 추첨 개수 최대값 계산
  const maxDrawCount = settings.endNumber - settings.startNumber + 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-xl">설정</DialogTitle>
          <DialogDescription>
            추첨 범위와 옵션을 설정하세요
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 빠른 설정 프리셋 */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">빠른 설정</p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((preset) => {
                const active = isPresetActive(settings, preset);
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handlePresetClick(preset)}
                    className={cn(
                      'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80 border border-border'
                    )}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 시작 번호 */}
          <NumberInput
            label="시작 번호"
            value={settings.startNumber}
            onChange={handleStartNumberChange}
            min={1}
            max={999}
          />

          {/* 종료 번호 */}
          <NumberInput
            label="종료 번호"
            value={settings.endNumber}
            onChange={handleEndNumberChange}
            min={1}
            max={999}
          />

          {/* 추첨 개수 */}
          <NumberInput
            label="추첨 개수"
            value={settings.drawCount}
            onChange={(value) => onSettingsChange({ drawCount: value })}
            min={1}
            max={maxDrawCount}
          />

          <Separator />

          {/* 중복 허용 옵션 */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-medium">중복 허용</label>
              <p className="text-xs text-muted-foreground">
                {settings.allowDuplicates
                  ? '같은 번호가 다시 나올 수 있습니다'
                  : '한 번 나온 번호는 제외됩니다'}
              </p>
            </div>
            <Switch
              checked={settings.allowDuplicates}
              onCheckedChange={(checked) =>
                onSettingsChange({ allowDuplicates: checked })
              }
            />
          </div>

          {/* 사운드 옵션 */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-medium">효과음</label>
              <p className="text-xs text-muted-foreground">
                {settings.soundEnabled
                  ? '추첨 시 효과음이 재생됩니다'
                  : '효과음이 꺼져 있습니다'}
              </p>
            </div>
            <Switch
              checked={settings.soundEnabled}
              onCheckedChange={(checked) =>
                onSettingsChange({ soundEnabled: checked })
              }
            />
          </div>

          {/* 유효성 검사 에러 메시지 */}
          {!validation.valid && (
            <p className="text-sm text-destructive">{validation.error}</p>
          )}
        </div>

        {/* 확인 버튼 */}
        <Button
          onClick={handleConfirm}
          disabled={!validation.valid}
          className="w-full"
          size="lg"
        >
          설정 완료
        </Button>
      </DialogContent>
    </Dialog>
  );
}
