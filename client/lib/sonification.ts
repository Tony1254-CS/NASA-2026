/**
 * Sonification engine using Web Audio API to translate InSAR displacement data into sound.
 */

export class InsarSonifier {
  private audioCtx: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private panner: StereoPannerNode | null = null;
  private isPlaying: boolean = false;

  constructor() {
    // AudioContext will be initialized on user gesture
  }

  public init() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  /**
   * Maps displacement (mm) to a frequency (Hz).
   * Subsidence (-60mm to 0mm) maps to lower frequencies (130Hz to ~400Hz).
   * Uplift (0mm to +60mm) maps to higher frequencies (~400Hz to 880Hz).
   */
  private mapDisplacementToFrequency(displacement: number): number {
    const minDisplacement = -60;
    const maxDisplacement = 60;
    const minFreq = 130;
    const maxFreq = 880;

    const normalized = Math.max(0, Math.min(1, (displacement - minDisplacement) / (maxDisplacement - minDisplacement)));
    return minFreq + normalized * (maxFreq - minFreq);
  }

  public playTone(displacement: number, pan: number = 0, durationMs: number = 150) {
    if (!this.audioCtx) this.init();
    if (!this.audioCtx) return;

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    const freq = this.mapDisplacementToFrequency(displacement);
    const waveType: OscillatorType = displacement < 0 ? 'triangle' : 'sine';

    const osc = this.audioCtx.createOscillator();
    osc.type = waveType;
    osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

    const gain = this.audioCtx.createGain();
    // ADSR envelope
    gain.gain.setValueAtTime(0, this.audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.5, this.audioCtx.currentTime + 0.05);
    gain.gain.linearRampToValueAtTime(0.5, this.audioCtx.currentTime + (durationMs / 1000) - 0.05);
    gain.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + (durationMs / 1000));

    let connectNode: AudioNode = gain;

    if (this.audioCtx.createStereoPanner) {
      const pannerNode = this.audioCtx.createStereoPanner();
      pannerNode.pan.value = Math.max(-1, Math.min(1, pan));
      gain.connect(pannerNode);
      connectNode = pannerNode;
    }

    connectNode.connect(this.audioCtx.destination);

    osc.connect(gain);
    osc.start(this.audioCtx.currentTime);
    osc.stop(this.audioCtx.currentTime + (durationMs / 1000));
  }

  public stop() {
    if (this.audioCtx) {
      this.audioCtx.suspend();
    }
  }
}
