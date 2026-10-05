import confetti from 'canvas-confetti';

/**
 * Triggers a gold/osrs celebratory confetti burst
 */
export function fireMilestoneConfetti(title?: string) {
  // Fire multiple bursts for dramatic effect
  const count = 200;
  const defaults = {
    origin: { y: 0.7 },
    colors: ['#E5B842', '#F6D268', '#10B981', '#38BDF8', '#FFFFFF']
  };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio)
    });
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
  });
  fire(0.2, {
    spread: 60,
  });
  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 45,
  });
}
