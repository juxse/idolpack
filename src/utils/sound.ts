class SoundEngine {
  private ctx: AudioContext | null = null;
  public muted = false;

  private ensureContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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

  public tone(
    freq: number,
    duration = 0.14,
    type: OscillatorType = 'triangle',
    volume = 0.08,
    slideToFreq?: number
  ) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      const now = ctx.currentTime;
      // Add slight pitch variance (±4%) for natural game feel
      const startFreq = freq * (0.98 + Math.random() * 0.04);
      osc.frequency.setValueAtTime(startFreq, now);
      if (slideToFreq) {
        osc.frequency.exponentialRampToValueAtTime(slideToFreq, now + duration);
      }
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + duration);
    } catch {
      // Ignore audio errors
    }
  }

  public playClick() {
    this.tone(680, 0.06, 'sine', 0.05, 880);
  }

  public playPackSlice() {
    // Crisp metallic foil rip sound
    this.tone(320, 0.18, 'sawtooth', 0.07, 1280);
    setTimeout(() => this.tone(920, 0.22, 'triangle', 0.09, 1760), 70);
  }

  public playCardReveal(rarity: number) {
    const base = 440 + rarity * 130;
    this.tone(base, 0.16, 'triangle', 0.08, base * 1.25);
    if (rarity >= 3) {
      setTimeout(() => this.tone(base * 1.5, 0.28, 'sine', 0.1, base * 2), 90);
    }
    if (rarity === 4) {
      setTimeout(() => this.tone(base * 2, 0.4, 'triangle', 0.12, base * 2.5), 180);
    }
  }

  public playHit(isCrit = false) {
    if (isCrit) {
      this.tone(180, 0.2, 'sawtooth', 0.1, 75);
      setTimeout(() => this.tone(540, 0.16, 'square', 0.07, 980), 40);
    } else {
      this.tone(240, 0.11, 'square', 0.06, 110);
    }
  }

  public playUltimate() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) => {
      setTimeout(() => this.tone(f, 0.25, 'triangle', 0.09, f * 1.15), idx * 65);
    });
  }

  public playVictory() {
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, idx) => {
      setTimeout(() => this.tone(f, 0.3, 'triangle', 0.09), idx * 95);
    });
  }

  public playDefeat() {
    [340, 290, 220, 155].forEach((f, idx) => {
      setTimeout(() => this.tone(f, 0.28, 'sawtooth', 0.07), idx * 120);
    });
  }
}

export const sound = new SoundEngine();
