// Audio constants
const AUDIO = {
  PADDLE_HIT_FREQ: 440,
  PADDLE_HIT_DURATION: 0.1,
  WALL_BOUNCE_FREQ: 220,
  WALL_BOUNCE_DURATION: 0.05,
  WALL_BOUNCE_VOLUME: 0.15,
  BRICK_BASE_FREQ: 200,
  BRICK_FREQ_INCREMENT: 50,
  BRICK_DURATION: 0.15,
  BALL_LOST_START_FREQ: 440,
  BALL_LOST_END_FREQ: 110,
  BALL_LOST_DURATION: 0.5,
  GAME_START_FREQ: 660,
  GAME_START_DURATION: 0.1,
  MASTER_VOLUME: 0.3,
};

class GameAudio {
  private ctx: AudioContext | null = null;
  private enabled = true;
  private initialized = false;

  /**
   * Initialize the AudioContext.
   * Must be called on user interaction (click/keypress) due to browser autoplay policies.
   */
  initialize(): void {
    if (this.initialized) return;

    try {
      this.ctx = new AudioContext();
      // Resume AudioContext if suspended (common on iOS Safari)
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      this.initialized = true;
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
      this.enabled = false;
    }
  }

  /**
   * Check if audio is enabled.
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Enable or disable audio playback.
   */
  setEnabled(value: boolean): void {
    this.enabled = value;
  }

  /**
   * Create a gain node with the master volume applied.
   */
  private createGain(volume: number = 1): GainNode {
    const gain = this.ctx!.createGain();
    gain.gain.value = volume * AUDIO.MASTER_VOLUME;
    gain.connect(this.ctx!.destination);
    return gain;
  }

  /**
   * Play paddle hit sound - 440Hz sine wave with 100ms exponential decay.
   */
  playPaddleHit(): void {
    if (!this.ctx || !this.enabled) return;

    const now = this.ctx.currentTime;
    const oscillator = this.ctx.createOscillator();
    const gain = this.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = AUDIO.PADDLE_HIT_FREQ;
    oscillator.connect(gain);

    gain.gain.setValueAtTime(AUDIO.MASTER_VOLUME, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + AUDIO.PADDLE_HIT_DURATION);

    oscillator.start(now);
    oscillator.stop(now + AUDIO.PADDLE_HIT_DURATION);
  }

  /**
   * Play wall bounce sound - 220Hz sine wave, 50ms, lower volume.
   */
  playWallBounce(): void {
    if (!this.ctx || !this.enabled) return;

    const now = this.ctx.currentTime;
    const oscillator = this.ctx.createOscillator();
    const gain = this.createGain(AUDIO.WALL_BOUNCE_VOLUME);

    oscillator.type = 'sine';
    oscillator.frequency.value = AUDIO.WALL_BOUNCE_FREQ;
    oscillator.connect(gain);

    gain.gain.setValueAtTime(AUDIO.WALL_BOUNCE_VOLUME * AUDIO.MASTER_VOLUME, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + AUDIO.WALL_BOUNCE_DURATION);

    oscillator.start(now);
    oscillator.stop(now + AUDIO.WALL_BOUNCE_DURATION);
  }

  /**
   * Play brick break sound - white noise burst combined with a tone.
   * Pitch increases based on row index (higher rows = higher pitch).
   */
  playBrickBreak(rowIndex: number): void {
    if (!this.ctx || !this.enabled) return;

    const now = this.ctx.currentTime;
    const frequency = AUDIO.BRICK_BASE_FREQ + rowIndex * AUDIO.BRICK_FREQ_INCREMENT;

    // Create white noise buffer
    const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * AUDIO.BRICK_DURATION, this.ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) {
      noiseData[i] = Math.random() * 2 - 1;
    }

    // Noise source
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    const noiseGain = this.createGain(0.3);
    noiseSource.connect(noiseGain);

    noiseGain.gain.setValueAtTime(0.3 * AUDIO.MASTER_VOLUME, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + AUDIO.BRICK_DURATION);

    // Tone oscillator
    const oscillator = this.ctx.createOscillator();
    const toneGain = this.createGain(0.7);

    oscillator.type = 'square';
    oscillator.frequency.value = frequency;
    oscillator.connect(toneGain);

    toneGain.gain.setValueAtTime(0.7 * AUDIO.MASTER_VOLUME, now);
    toneGain.gain.exponentialRampToValueAtTime(0.001, now + AUDIO.BRICK_DURATION);

    noiseSource.start(now);
    noiseSource.stop(now + AUDIO.BRICK_DURATION);
    oscillator.start(now);
    oscillator.stop(now + AUDIO.BRICK_DURATION);
  }

  /**
   * Play ball lost sound - frequency slide from 440Hz to 110Hz over 500ms.
   */
  playBallLost(): void {
    if (!this.ctx || !this.enabled) return;

    const now = this.ctx.currentTime;
    const oscillator = this.ctx.createOscillator();
    const gain = this.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(AUDIO.BALL_LOST_START_FREQ, now);
    oscillator.frequency.exponentialRampToValueAtTime(AUDIO.BALL_LOST_END_FREQ, now + AUDIO.BALL_LOST_DURATION);
    oscillator.connect(gain);

    gain.gain.setValueAtTime(AUDIO.MASTER_VOLUME, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + AUDIO.BALL_LOST_DURATION);

    oscillator.start(now);
    oscillator.stop(now + AUDIO.BALL_LOST_DURATION);
  }

  /**
   * Play game over sound - sad descending melody (G4, E4, C4 sequence).
   */
  playGameOver(): void {
    if (!this.ctx || !this.enabled) return;

    const now = this.ctx.currentTime;
    const notes = [392, 330, 262]; // G4, E4, C4
    const noteDuration = 0.2;
    const noteGap = 0.15;

    notes.forEach((freq, index) => {
      const startTime = now + index * (noteDuration + noteGap);
      const oscillator = this.ctx!.createOscillator();
      const gain = this.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.value = freq;
      oscillator.connect(gain);

      gain.gain.setValueAtTime(AUDIO.MASTER_VOLUME, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + noteDuration);

      oscillator.start(startTime);
      oscillator.stop(startTime + noteDuration);
    });
  }

  /**
   * Play level win sound - C-E-G arpeggio (262Hz, 330Hz, 392Hz).
   */
  playLevelWin(): void {
    if (!this.ctx || !this.enabled) return;

    const now = this.ctx.currentTime;
    const notes = [262, 330, 392]; // C4, E4, G4
    const noteDuration = 0.15;
    const noteGap = 0.1;

    notes.forEach((freq, index) => {
      const startTime = now + index * (noteDuration + noteGap);
      const oscillator = this.ctx!.createOscillator();
      const gain = this.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.value = freq;
      oscillator.connect(gain);

      gain.gain.setValueAtTime(AUDIO.MASTER_VOLUME, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + noteDuration);

      oscillator.start(startTime);
      oscillator.stop(startTime + noteDuration);
    });
  }

  /**
   * Play game start sound - ready beep (660Hz, 100ms).
   */
  playGameStart(): void {
    if (!this.ctx || !this.enabled) return;

    const now = this.ctx.currentTime;
    const oscillator = this.ctx.createOscillator();
    const gain = this.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = AUDIO.GAME_START_FREQ;
    oscillator.connect(gain);

    gain.gain.setValueAtTime(AUDIO.MASTER_VOLUME, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + AUDIO.GAME_START_DURATION);

    oscillator.start(now);
    oscillator.stop(now + AUDIO.GAME_START_DURATION);
  }

  /**
   * Play power-up collect sound - ascending arpeggio (C5, E5, G5).
   */
  playPowerUpCollect(): void {
    if (!this.ctx || !this.enabled) return;

    const now = this.ctx.currentTime;

    // Ascending arpeggio
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0, now + i * 0.05);
      gain.gain.linearRampToValueAtTime(0.2 * AUDIO.MASTER_VOLUME, now + i * 0.05 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.05 + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now + i * 0.05);
      osc.stop(now + i * 0.05 + 0.2);
    });
  }

  /**
   * Play extra life sound - celebratory fanfare (C5, E5, G5, C6).
   */
  playExtraLife(): void {
    if (!this.ctx || !this.enabled) return;

    const now = this.ctx.currentTime;

    // Celebratory fanfare
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0, now + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.25 * AUDIO.MASTER_VOLUME, now + i * 0.08 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.35);
    });
  }

  /**
   * Play laser shoot sound - short zap/pew with frequency sweep.
   */
  playLaserShoot(): void {
    if (!this.ctx || !this.enabled) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.1);

    gain.gain.setValueAtTime(0.15 * AUDIO.MASTER_VOLUME, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.1);
  }
}

export const gameAudio = new GameAudio();
