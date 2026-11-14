import confetti from 'canvas-confetti';

export type CelebrationIntensityMode = 'minimalist' | 'standard' | 'showstopping';

export const CELEBRATION_INTENSITY_STORAGE_KEY = 'az900_celebration_intensity_v1';

export function getStoredCelebrationIntensity(): CelebrationIntensityMode {
  try {
    if (typeof window === 'undefined') return 'standard';
    const raw = localStorage.getItem(CELEBRATION_INTENSITY_STORAGE_KEY);
    if (raw === 'minimalist' || raw === 'standard' || raw === 'showstopping') {
      return raw;
    }
  } catch {
    // ignore storage errors
  }
  return 'standard';
}

export function saveCelebrationIntensity(mode: CelebrationIntensityMode): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(CELEBRATION_INTENSITY_STORAGE_KEY, mode);
    window.dispatchEvent(
      new CustomEvent('az900-celebration-intensity-changed', {
        detail: { intensity: mode },
      })
    );
  } catch {
    // ignore storage errors
  }
}

function resolveIntensityArg(
  firstArg?: string | number | CelebrationIntensityMode,
  secondArg?: CelebrationIntensityMode
): CelebrationIntensityMode {
  if (secondArg === 'minimalist' || secondArg === 'standard' || secondArg === 'showstopping') {
    return secondArg;
  }
  if (firstArg === 'minimalist' || firstArg === 'standard' || firstArg === 'showstopping') {
    return firstArg;
  }
  return getStoredCelebrationIntensity();
}

/**
 * Triggers a celebratory multi-burst confetti animation when a learner
 * completes a module or achieves 100% mastery in a module, scaled by
 * the user's selected Celebration Intensity mode.
 */
export function fireModuleCompletionConfetti(
  moduleTitleOrIntensity?: string | CelebrationIntensityMode,
  overrideIntensity?: CelebrationIntensityMode
): void {
  try {
    const intensity = resolveIntensityArg(moduleTitleOrIntensity, overrideIntensity);
    const colors = ['#0078D4', '#38BDF8', '#10B981', '#F59E0B', '#D97706', '#6366F1'];

    if (intensity === 'minimalist') {
      confetti({
        particleCount: 28,
        spread: 55,
        startVelocity: 32,
        origin: { y: 0.68 },
        colors: ['#0078D4', '#38BDF8', '#10B981'],
        scalar: 0.85,
        ticks: 140,
        zIndex: 9999,
      });
      return;
    }

    if (intensity === 'showstopping') {
      confetti({
        particleCount: 110,
        spread: 95,
        startVelocity: 52,
        origin: { y: 0.62 },
        colors,
        scalar: 1.15,
        zIndex: 9999,
      });

      setTimeout(() => {
        confetti({
          particleCount: 65,
          angle: 60,
          spread: 70,
          origin: { x: 0.08, y: 0.68 },
          colors,
          zIndex: 9999,
        });
        confetti({
          particleCount: 65,
          angle: 120,
          spread: 70,
          origin: { x: 0.92, y: 0.68 },
          colors,
          zIndex: 9999,
        });
      }, 180);

      setTimeout(() => {
        confetti({
          particleCount: 95,
          spread: 130,
          startVelocity: 45,
          decay: 0.91,
          scalar: 1.25,
          shapes: ['star', 'circle'],
          origin: { x: 0.5, y: 0.45 },
          colors: ['#F59E0B', '#FBBF24', '#38BDF8', '#10B981', '#EC4899'],
          zIndex: 9999,
        });
      }, 420);

      setTimeout(() => {
        confetti({
          particleCount: 70,
          spread: 115,
          startVelocity: 38,
          origin: { x: 0.5, y: 0.55 },
          colors,
          zIndex: 9999,
        });
      }, 700);
      return;
    }

    // Standard mode
    confetti({
      particleCount: 70,
      spread: 75,
      startVelocity: 45,
      origin: { y: 0.65 },
      colors,
      zIndex: 9999,
    });

    setTimeout(() => {
      confetti({
        particleCount: 40,
        angle: 60,
        spread: 55,
        origin: { x: 0.12, y: 0.7 },
        colors,
        zIndex: 9999,
      });
      confetti({
        particleCount: 40,
        angle: 120,
        spread: 55,
        origin: { x: 0.88, y: 0.7 },
        colors,
        zIndex: 9999,
      });
    }, 220);
  } catch {
    // Gracefully ignore in environments without canvas support
  }
}

/**
 * Triggers a celebratory golden-emerald-azure confetti fanfare when the user
 * hits 100% of their daily study question goal for the first time today,
 * respecting the user's configured Celebration Intensity setting.
 */
export function fireDailyGoalCompletionConfetti(
  goalOrIntensity?: number | CelebrationIntensityMode,
  overrideIntensity?: CelebrationIntensityMode
): void {
  try {
    const intensity = resolveIntensityArg(goalOrIntensity, overrideIntensity);
    const palette = ['#10B981', '#34D399', '#F59E0B', '#FBBF24', '#0078D4', '#38BDF8'];

    if (intensity === 'minimalist') {
      confetti({
        particleCount: 32,
        spread: 60,
        startVelocity: 34,
        origin: { x: 0.5, y: 0.65 },
        colors: ['#10B981', '#38BDF8', '#F59E0B'],
        scalar: 0.85,
        ticks: 150,
        zIndex: 9999,
      });
      return;
    }

    if (intensity === 'showstopping') {
      // Grand multi-stage Harambee Finale Fanfare
      confetti({
        particleCount: 130,
        spread: 105,
        startVelocity: 58,
        origin: { x: 0.5, y: 0.6 },
        colors: palette,
        scalar: 1.2,
        zIndex: 9999,
      });

      setTimeout(() => {
        confetti({
          particleCount: 75,
          angle: 58,
          spread: 75,
          startVelocity: 52,
          origin: { x: 0.05, y: 0.72 },
          colors: palette,
          zIndex: 9999,
        });
        confetti({
          particleCount: 75,
          angle: 122,
          spread: 75,
          startVelocity: 52,
          origin: { x: 0.95, y: 0.72 },
          colors: palette,
          zIndex: 9999,
        });
      }, 180);

      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 140,
          startVelocity: 46,
          decay: 0.91,
          scalar: 1.3,
          shapes: ['star', 'circle'],
          origin: { x: 0.5, y: 0.42 },
          colors: ['#F59E0B', '#FBBF24', '#10B981', '#38BDF8', '#A855F7'],
          zIndex: 9999,
        });
      }, 420);

      setTimeout(() => {
        confetti({
          particleCount: 65,
          angle: 65,
          spread: 80,
          origin: { x: 0.15, y: 0.62 },
          colors: palette,
          zIndex: 9999,
        });
        confetti({
          particleCount: 65,
          angle: 115,
          spread: 80,
          origin: { x: 0.85, y: 0.62 },
          colors: palette,
          zIndex: 9999,
        });
      }, 720);
      return;
    }

    // Standard mode
    confetti({
      particleCount: 90,
      spread: 85,
      startVelocity: 50,
      origin: { x: 0.5, y: 0.62 },
      colors: palette,
      zIndex: 9999,
    });

    setTimeout(() => {
      confetti({
        particleCount: 55,
        angle: 58,
        spread: 65,
        startVelocity: 48,
        origin: { x: 0.08, y: 0.72 },
        colors: palette,
        zIndex: 9999,
      });
      confetti({
        particleCount: 55,
        angle: 122,
        spread: 65,
        startVelocity: 48,
        origin: { x: 0.92, y: 0.72 },
        colors: palette,
        zIndex: 9999,
      });
    }, 200);

    setTimeout(() => {
      confetti({
        particleCount: 65,
        spread: 110,
        startVelocity: 38,
        decay: 0.92,
        scalar: 1.15,
        origin: { x: 0.5, y: 0.48 },
        colors: palette,
        zIndex: 9999,
      });
    }, 450);
  } catch {
    // Gracefully ignore in environments without canvas support
  }
}

/**
 * Triggers a milestone confetti burst scaled to the learner's Celebration Intensity setting
 * and milestone tier (25%, 50%, or 100%).
 */
export function fireMilestoneTierConfetti(
  tier: 25 | 50 | 100,
  overrideIntensity?: CelebrationIntensityMode
): void {
  try {
    const intensity = overrideIntensity || getStoredCelebrationIntensity();
    const colors =
      tier === 100
        ? ['#10B981', '#F59E0B', '#0078D4', '#34D399', '#FBBF24']
        : tier === 50
        ? ['#F59E0B', '#10B981', '#0078D4', '#FBBF24']
        : ['#0078D4', '#38BDF8', '#10B981'];

    if (intensity === 'minimalist') {
      confetti({
        particleCount: tier === 100 ? 30 : tier === 50 ? 22 : 16,
        spread: 52,
        startVelocity: 30,
        origin: { y: 0.25 },
        colors,
        scalar: 0.85,
        ticks: 130,
        zIndex: 9999,
      });
      return;
    }

    if (intensity === 'showstopping') {
      confetti({
        particleCount: tier === 100 ? 120 : tier === 50 ? 95 : 75,
        spread: tier === 100 ? 110 : 90,
        startVelocity: 48,
        origin: { y: 0.24 },
        colors,
        scalar: 1.18,
        zIndex: 9999,
      });
      setTimeout(() => {
        confetti({
          particleCount: tier === 100 ? 75 : 55,
          angle: 60,
          spread: 70,
          origin: { x: 0.1, y: 0.35 },
          colors,
          zIndex: 9999,
        });
        confetti({
          particleCount: 75,
          angle: 120,
          spread: 70,
          origin: { x: 0.9, y: 0.35 },
          colors,
          zIndex: 9999,
        });
      }, 200);
      return;
    }

    // Standard mode
    confetti({
      particleCount: tier === 100 ? 90 : tier === 50 ? 65 : 42,
      spread: tier === 100 ? 90 : tier === 50 ? 75 : 60,
      origin: { y: 0.22 },
      colors,
      zIndex: 9999,
    });
  } catch {
    // ignore
  }
}
