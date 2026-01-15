/**
 * Web Audio API 기반 사운드 유틸리티
 */

// AudioContext 싱글톤
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

/**
 * 틱 사운드 재생
 * @param progress 0~1 사이 값, 높을수록 높은 pitch
 */
export function playTick(progress: number = 0): void {
  try {
    const ctx = getAudioContext();

    // Resume if suspended (autoplay policy)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    // Frequency: 440Hz (A4) → 880Hz (A5) based on progress
    const baseFreq = 440;
    const maxFreq = 880;
    const frequency = baseFreq + (maxFreq - baseFreq) * Math.min(progress, 1);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    // Quick fade out to avoid click
    gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.05);
  } catch {
    // Silently fail if audio not supported
  }
}

/**
 * 성공 사운드 재생 (상승 아르페지오)
 */
export function playSuccess(): void {
  try {
    const ctx = getAudioContext();

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    // C5, E5, G5 아르페지오
    const notes = [523.25, 659.25, 783.99];
    const noteDuration = 0.12;
    const noteGap = 0.08;

    notes.forEach((freq, index) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      const startTime = ctx.currentTime + index * (noteDuration + noteGap);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, startTime);

      // Envelope
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + noteDuration);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(startTime);
      oscillator.stop(startTime + noteDuration);
    });
  } catch {
    // Silently fail if audio not supported
  }
}

/**
 * AudioContext 정리 (테스트용)
 */
export function resetAudioContext(): void {
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
}
