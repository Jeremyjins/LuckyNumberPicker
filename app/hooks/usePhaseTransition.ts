import { useEffect, useRef, useState } from 'react';
import type { Phase } from '~/types/lottery';

export type TransitionState = 'idle' | 'exiting' | 'entering';

interface PhaseTransitionResult {
  /** Current transition state */
  transitionState: TransitionState;
  /** The phase currently being displayed (previous during exit, next during enter) */
  displayPhase: Phase;
  /** CSS class to apply to the phase content wrapper */
  transitionClass: string;
}

/** Exit duration in ms */
const EXIT_DURATION = 300;
/** Enter duration in ms */
const ENTER_DURATION = 400;

/**
 * Maps phase transitions to their exit CSS class.
 * If a transition is not listed, no exit animation plays.
 */
function getExitClass(from: Phase, to: Phase): string | null {
  if (from === 'initial' && to === 'ready') return 'animate-scale-fade-out';
  if (from === 'result' && to === 'ready') return 'animate-fade-out-down';
  if (from === 'drawing' && to === 'result') return 'animate-scale-fade-out';
  return null;
}

/**
 * Maps phase transitions to their enter CSS class.
 */
function getEnterClass(from: Phase, to: Phase): string {
  if (from === 'initial' && to === 'ready') return 'animate-fade-in-up';
  if (from === 'result' && to === 'ready') return 'animate-fade-in-up';
  if (from === 'drawing' && to === 'result') return 'animate-fade-in';
  return 'animate-fade-in';
}

/**
 * Manages enter/exit animations when the lottery phase changes.
 *
 * Usage:
 * ```tsx
 * const { displayPhase, transitionClass } = usePhaseTransition(phase);
 * // Render based on displayPhase, apply transitionClass to content wrapper
 * ```
 */
export function usePhaseTransition(phase: Phase): PhaseTransitionResult {
  const [transitionState, setTransitionState] = useState<TransitionState>('idle');
  const [displayPhase, setDisplayPhase] = useState<Phase>(phase);
  const [transitionClass, setTransitionClass] = useState<string>('');
  const prevPhaseRef = useRef<Phase>(phase);

  useEffect(() => {
    const prevPhase = prevPhaseRef.current;
    prevPhaseRef.current = phase;

    // Same phase — no transition needed
    if (prevPhase === phase) return;

    // ready -> drawing has no exit animation (button handles it internally)
    if (prevPhase === 'ready' && phase === 'drawing') {
      setDisplayPhase(phase);
      setTransitionState('idle');
      setTransitionClass('');
      return;
    }

    const exitClass = getExitClass(prevPhase, phase);

    if (exitClass) {
      // Start exit phase — keep showing previous content
      setTransitionState('exiting');
      setTransitionClass(exitClass);
      // displayPhase stays as prevPhase during exit

      let enterTimer: ReturnType<typeof setTimeout> | null = null;
      const exitTimer = setTimeout(() => {
        // Exit done — switch to new phase, start enter
        setDisplayPhase(phase);
        setTransitionState('entering');
        setTransitionClass(getEnterClass(prevPhase, phase));

        enterTimer = setTimeout(() => {
          setTransitionState('idle');
          setTransitionClass('');
        }, ENTER_DURATION);
      }, EXIT_DURATION);

      return () => {
        clearTimeout(exitTimer);
        if (enterTimer !== null) clearTimeout(enterTimer);
      };
    } else {
      // No exit animation — go straight to enter
      setDisplayPhase(phase);
      setTransitionState('entering');
      setTransitionClass(getEnterClass(prevPhase, phase));

      const enterTimer = setTimeout(() => {
        setTransitionState('idle');
        setTransitionClass('');
      }, ENTER_DURATION);

      return () => clearTimeout(enterTimer);
    }
  }, [phase]);

  return { transitionState, displayPhase, transitionClass };
}
