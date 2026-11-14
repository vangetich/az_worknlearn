/**
 * Subtle, Non-Intrusive Web Audio Synthesizer Service for Azure Cloud Explorer
 * Provides three distinct acoustic cues:
 *  - 'ping'  : Crystalline harmonic ping for correct answers
 *  - 'woosh' : Soft frequency-swept woosh for incorrect answers
 *  - 'chime' : Warm ascending triad chime for daily study goal & streak milestones
 *
 * Plus the procedural Web Audio 'Audio Pacing Coach' engine:
 *  - 'ticking' : Subtle studio watch / metronome ticking with 4-beat cadence accent
 *  - 'rain'    : Savannah rainfall ambient soundscape with rhythmic canopy droplets
 *  - 'wind'    : Rift Valley breeze & stream with speed-modulated LFO swells
 *  - 'pulse'   : Deep focus harmonic pulse with soft low-pass rhythm cues
 *
 * Strictly respects the user's `isAudioMuted` state and `az900_audio_muted` localStorage preference.
 */

export type SoundEffectType = 'ping' | 'woosh' | 'chime';
export type PacingSoundscapeType = 'ticking' | 'rain' | 'wind' | 'pulse';

const AUDIO_MUTED_STORAGE_KEY = 'az900_audio_muted';

class AudioManagerService {
  private ctx: AudioContext | null = null;
  private pacingIntervalId: number | null = null;
  private ambientSourceNode: AudioBufferSourceNode | OscillatorNode | null = null;
  private ambientGainNode: GainNode | null = null;
  private ambientFilterNode: BiquadFilterNode | null = null;
  private beatCount = 0;

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

  /**
   * Synthesizes a single subtle rhythm beat for the Audio Pacing Coach.
   */
  public playPacingBeat(
    soundscape: PacingSoundscapeType,
    volume = 0.35,
    isAccent = false,
    isAudioMuted?: boolean
  ): boolean {
    if (this.isAudioMuted(isAudioMuted)) return false;
    const ctx = this.getAudioContext();
    if (!ctx) return false;

    try {
      const now = ctx.currentTime;
      const clampedVol = Math.max(0.02, Math.min(1, volume));

      if (soundscape === 'ticking') {
        // Crisp mechanical studio watch / woodblock tick
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        const baseFreq = isAccent ? 1180 : 860;
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.42, now + 0.032);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(baseFreq, now);
        filter.Q.setValueAtTime(3.2, now);

        const peakGain = (isAccent ? 0.055 : 0.036) * clampedVol;
        gain.gain.setValueAtTime(0.0005, now);
        gain.gain.linearRampToValueAtTime(peakGain, now + 0.004);
        gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.038);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.042);
      } else if (soundscape === 'rain') {
        // Gentle canopy water droplet harmonic chime over ambient rain bed
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        const dropFreq = isAccent ? 660 : 528;
        osc.frequency.setValueAtTime(dropFreq * 0.85, now);
        osc.frequency.exponentialRampToValueAtTime(dropFreq * 1.15, now + 0.055);

        const peakGain = (isAccent ? 0.028 : 0.018) * clampedVol;
        gain.gain.setValueAtTime(0.0005, now);
        gain.gain.linearRampToValueAtTime(peakGain, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.09);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.095);
      } else if (soundscape === 'wind') {
        // Soft harmonic breeze swell pulse
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        const windFreq = isAccent ? 396 : 297;
        osc.frequency.setValueAtTime(windFreq, now);
        osc.frequency.exponentialRampToValueAtTime(windFreq * 1.04, now + 0.16);

        const peakGain = (isAccent ? 0.024 : 0.015) * clampedVol;
        gain.gain.setValueAtTime(0.0005, now);
        gain.gain.linearRampToValueAtTime(peakGain, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.18);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.19);
      } else {
        // 'pulse': Deep focus warm binaural-style rhythm pulse
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        const pulseFreq = isAccent ? 256 : 192;
        osc.frequency.setValueAtTime(pulseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(pulseFreq * 0.88, now + 0.12);

        const peakGain = (isAccent ? 0.042 : 0.026) * clampedVol;
        gain.gain.setValueAtTime(0.0005, now);
        gain.gain.linearRampToValueAtTime(peakGain, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.13);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.14);
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Starts or updates a continuous subtle nature noise bed for 'rain' or 'wind' soundscapes.
   */
  private startAmbientNatureBed(
    soundscape: PacingSoundscapeType,
    volume: number,
    speedMultiplier: number
  ): void {
    this.stopAmbientNatureBed();
    if (soundscape !== 'rain' && soundscape !== 'wind') return;

    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      // Generate warm brown/pink-filtered noise
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 2.4;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = soundscape === 'rain' ? 'lowpass' : 'bandpass';
      const baseCutoff = soundscape === 'rain' ? 680 : 380;
      filter.frequency.setValueAtTime(
        Math.min(1400, baseCutoff * (0.85 + speedMultiplier * 0.25)),
        ctx.currentTime
      );
      filter.Q.setValueAtTime(soundscape === 'rain' ? 0.7 : 1.8, ctx.currentTime);

      const gain = ctx.createGain();
      const bedGain = Math.max(0.004, Math.min(0.06, volume * 0.045));
      gain.gain.setValueAtTime(bedGain, ctx.currentTime);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      whiteNoise.start(0);
      this.ambientSourceNode = whiteNoise;
      this.ambientFilterNode = filter;
      this.ambientGainNode = gain;
    } catch {
      // ignore Web Audio initialization errors in headless environments
    }
  }

  private stopAmbientNatureBed(): void {
    try {
      if (this.ambientSourceNode) {
        this.ambientSourceNode.stop();
        this.ambientSourceNode.disconnect();
      }
    } catch {
      // ignore
    }
    try {
      if (this.ambientFilterNode) this.ambientFilterNode.disconnect();
      if (this.ambientGainNode) this.ambientGainNode.disconnect();
    } catch {
      // ignore
    }
    this.ambientSourceNode = null;
    this.ambientFilterNode = null;
    this.ambientGainNode = null;
  }

  /**
   * Starts the Audio Pacing Coach loop with adjustable speed and soundscape.
   */
  public startPacingCoach(options: {
    soundscape: PacingSoundscapeType;
    speedMultiplier: number; // e.g. 0.5x to 2.0x (1.0x = 72 BPM)
    volume: number; // 0.05 to 1.0
    isAudioMuted?: boolean;
    onBeat?: (beatIndex: number, isAccent: boolean) => void;
  }): void {
    this.stopPacingCoach();

    const {
      soundscape,
      speedMultiplier,
      volume,
      isAudioMuted,
      onBeat,
    } = options;

    if (this.isAudioMuted(isAudioMuted)) return;

    const baseBpm = 72;
    const effectiveBpm = Math.max(30, Math.min(180, Math.round(baseBpm * speedMultiplier)));
    const intervalMs = Math.round(60000 / effectiveBpm);

    this.beatCount = 0;
    this.startAmbientNatureBed(soundscape, volume, speedMultiplier);

    // Fire initial beat immediately
    const triggerStep = () => {
      if (this.isAudioMuted()) return;
      const isAccent = this.beatCount % 4 === 0;
      this.playPacingBeat(soundscape, volume, isAccent, false);
      if (onBeat) {
        onBeat(this.beatCount, isAccent);
      }
      this.beatCount = (this.beatCount + 1) % 64;
    };

    triggerStep();
    if (typeof window !== 'undefined') {
      this.pacingIntervalId = window.setInterval(triggerStep, intervalMs);
    }
  }

  /**
   * Stops the Audio Pacing Coach loop and cleans up Web Audio nodes.
   */
  public stopPacingCoach(): void {
    if (this.pacingIntervalId !== null && typeof window !== 'undefined') {
      window.clearInterval(this.pacingIntervalId);
      this.pacingIntervalId = null;
    }
    this.stopAmbientNatureBed();
  }
}

export const audioManager = new AudioManagerService();
