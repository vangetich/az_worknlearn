/**
 * Subtle, Non-Intrusive Web Audio Synthesizer Service for Azure Cloud Explorer
 * Provides three distinct acoustic cues:
 *  - 'ping'  : Crystalline harmonic ping for correct answers
 *  - 'woosh' : Soft frequency-swept woosh for incorrect answers
 *  - 'chime' : Warm ascending triad chime for daily study goal & streak milestones
 *
 * Strictly respects the user's `isAudioMuted` state and `az900_audio_muted` localStorage preference.
 */

export type SoundEffectType = 'ping' | 'woosh' | 'chime';

const AUDIO_MUTED_STORAGE_KEY = 'az900_audio_muted';

class AudioManagerService {
  private ctx: AudioContext | null = null;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      if (!this.ctx || this.ctx.state === 'closed') {
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  /**
   * Checks whether audio is muted via explicit parameter or persisted localStorage state.
   */
  public isAudioMuted(explicitMuted?: boolean): boolean {
    if (typeof explicitMuted === 'boolean') {
      return explicitMuted;
    }
    if (typeof window === 'undefined') return true;
    try {
      return localStorage.getItem(AUDIO_MUTED_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Plays a subtle, non-intrusive crystalline 'ping' for a correct answer.
   */
  public playPing(isAudioMuted?: boolean): boolean {
    if (this.isAudioMuted(isAudioMuted)) return false;
    const ctx = this.getAudioContext();
    if (!ctx) return false;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      // Subtle ascending two-tone harmonic ping (D5 -> A5)
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.085);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.06, now + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.19);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Plays a soft, non-intrusive 'woosh' for an incorrect answer.
   */
  public playWoosh(isAudioMuted?: boolean): boolean {
    if (this.isAudioMuted(isAudioMuted)) return false;
    const ctx = this.getAudioContext();
    if (!ctx) return false;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      // Gentle downward frequency sweep ('woosh')
      osc.frequency.setValueAtTime(310, now);
      osc.frequency.exponentialRampToValueAtTime(135, now + 0.21);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(680, now);
      filter.frequency.exponentialRampToValueAtTime(220, now + 0.21);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.05, now + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.22);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.23);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Plays a warm, uplifting 'chime' for daily goal and streak milestones.
   */
  public playChime(isAudioMuted?: boolean): boolean {
    if (this.isAudioMuted(isAudioMuted)) return false;
    const ctx = this.getAudioContext();
    if (!ctx) return false;

    try {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

      notes.forEach((freq, idx) => {
        const start = now + idx * 0.065;
        const duration = 0.24;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.001, start);
        gain.gain.linearRampToValueAtTime(0.055, start + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0008, start + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + duration + 0.01);
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Unified sound effect dispatcher for answer evaluation and goal milestones.
   */
  public playEffect(effect: SoundEffectType, isAudioMuted?: boolean): boolean {
    if (this.isAudioMuted(isAudioMuted)) return false;
    switch (effect) {
      case 'ping':
        return this.playPing(isAudioMuted);
      case 'woosh':
        return this.playWoosh(isAudioMuted);
      case 'chime':
        return this.playChime(isAudioMuted);
      default:
        return false;
    }
  }

  /**
   * Integrated helper for `handleAnswerQuestion`:
   * Triggers 'ping' on correct, 'woosh' on incorrect, and 'chime' when a goal milestone is hit.
   */
  public handleQuestionFeedback(options: {
    isCorrect: boolean;
    isMilestoneReached?: boolean;
    isAudioMuted?: boolean;
  }): void {
    const { isCorrect, isMilestoneReached = false, isAudioMuted } = options;
    if (this.isAudioMuted(isAudioMuted)) return;

    if (isCorrect) {
      this.playPing(isAudioMuted);
    } else {
      this.playWoosh(isAudioMuted);
    }

    if (isMilestoneReached) {
      setTimeout(() => {
        this.playChime(isAudioMuted);
      }, 140);
    }
  }
}

export const audioManager = new AudioManagerService();
