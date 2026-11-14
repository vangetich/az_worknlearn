import confetti from 'canvas-confetti';

/**
 * African-heritage accented celebratory palette
 * Colors: Azure Blue (#0078D4), Savannah Ochre (#D97706), Safari Terracotta (#C2410C),
 * Emerald Green (#10B981), Maasai Gold (#F59E0B), Sky Blue (#38BDF8)
 */
const CELEBRATION_PALETTE = ['#0078D4', '#D97706', '#C2410C', '#10B981', '#F59E0B', '#38BDF8'];

/**
 * Canvas-based confetti explosion celebrating module completion (Curriculum Mastery)
 */
export function fireModuleCompletionConfetti(moduleTitle?: string) {
  try {
    // Left burst
    confetti({
      particleCount: 50,
      spread: 65,
      origin: { x: 0.2, y: 0.65 },
      colors: CELEBRATION_PALETTE,
      disableForReducedMotion: true,
    });

    // Right burst
    confetti({
      particleCount: 50,
      spread: 65,
      origin: { x: 0.8, y: 0.65 },
      colors: CELEBRATION_PALETTE,
      disableForReducedMotion: true,
    });

    // Center celebratory star burst
    setTimeout(() => {
      confetti({
        particleCount: 75,
        spread: 100,
        origin: { x: 0.5, y: 0.45 },
        colors: CELEBRATION_PALETTE,
        ticks: 220,
        gravity: 0.75,
        scalar: 1.15,
      });
    }, 160);
  } catch (err) {
    console.error('Failed to trigger module completion confetti burst:', err);
  }
}

/**
 * Canvas-based celebratory confetti burst triggered when a user hits their daily study goal
 */
export function fireDailyGoalCompletionConfetti(goalCount?: number) {
  try {
    // 1. Double-cannon blast from bottom corners
    confetti({
      particleCount: 65,
      angle: 60,
      spread: 80,
      origin: { x: 0.08, y: 0.82 },
      colors: CELEBRATION_PALETTE,
      disableForReducedMotion: true,
    });
    confetti({
      particleCount: 65,
      angle: 120,
      spread: 80,
      origin: { x: 0.92, y: 0.82 },
      colors: CELEBRATION_PALETTE,
      disableForReducedMotion: true,
    });

    // 2. Center firework bursts
    setTimeout(() => {
      confetti({
        particleCount: 85,
        spread: 110,
        origin: { x: 0.5, y: 0.4 },
        colors: ['#F59E0B', '#10B981', '#0078D4', '#E11D48', '#FBBF24'],
        ticks: 240,
        gravity: 0.75,
        scalar: 1.2,
      });
    }, 200);

    // 3. Falling gold and azure stars
    setTimeout(() => {
      confetti({
        particleCount: 50,
        spread: 90,
        origin: { x: 0.5, y: 0.3 },
        colors: ['#FDE047', '#38BDF8', '#34D399', '#FB923C'],
        shapes: ['circle'],
        ticks: 280,
        gravity: 0.6,
      });
    }, 450);
  } catch (err) {
    console.error('Failed to trigger daily goal completion confetti:', err);
  }
}

/**
 * Streaming milestone achievement confetti
 */
export function fireMilestoneAchievementConfetti() {
  try {
    const duration = 2.5 * 1000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: CELEBRATION_PALETTE,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: CELEBRATION_PALETTE,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  } catch (err) {
    console.error('Failed to trigger milestone confetti:', err);
  }
}
