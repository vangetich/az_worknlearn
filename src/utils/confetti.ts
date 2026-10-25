import confetti from 'canvas-confetti';

/**
 * African-heritage accented confetti burst for celebratory milestones
 * Colors: Azure Blue (#0078D4), Savannah Ochre (#D97706), Safari Terracotta (#C2410C),
 * Emerald Green (#10B981), Maasai Gold (#F59E0B)
 */
const CELEBRATION_PALETTE = ['#0078D4', '#D97706', '#C2410C', '#10B981', '#F59E0B', '#3B82F6'];

export function fireModuleCompletionConfetti(moduleTitle?: string) {
  try {
    // Left burst
    confetti({
      particleCount: 45,
      spread: 60,
      origin: { x: 0.25, y: 0.65 },
      colors: CELEBRATION_PALETTE,
      disableForReducedMotion: true,
    });

    // Right burst
    confetti({
      particleCount: 45,
      spread: 60,
      origin: { x: 0.75, y: 0.65 },
      colors: CELEBRATION_PALETTE,
      disableForReducedMotion: true,
    });

    // Center star burst
    setTimeout(() => {
      confetti({
        particleCount: 65,
        spread: 100,
        origin: { x: 0.5, y: 0.5 },
        colors: CELEBRATION_PALETTE,
        ticks: 200,
        gravity: 0.8,
        scalar: 1.1,
      });
    }, 150);
  } catch (err) {
    console.error('Failed to trigger confetti burst:', err);
  }
}

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
