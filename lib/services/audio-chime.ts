/**
 * Web Audio API synthesized harmonic reminder chime for ShasthyaHub-AI.
 * Generates a soothing dual-tone medical chime (C5 + E5 harmonic major third)
 * with a smooth exponential gain decay. No external audio assets needed.
 */

class AudioChimeService {
  private audioCtx: AudioContext | null = null

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!this.audioCtx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass()
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {})
    }
    return this.audioCtx
  }

  /**
   * Play a gentle, soothing 2-tone chime for medication reminder.
   */
  public playReminderChime(volume: number = 0.25) {
    try {
      const ctx = this.getContext()
      if (!ctx) return

      const now = ctx.currentTime

      // Tone 1: 523.25 Hz (C5)
      const osc1 = ctx.createOscillator()
      const gain1 = ctx.createGain()
      osc1.type = 'sine'
      osc1.frequency.setValueAtTime(523.25, now)
      gain1.gain.setValueAtTime(0, now)
      gain1.gain.linearRampToValueAtTime(volume, now + 0.05)
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.8)

      osc1.connect(gain1)
      gain1.connect(ctx.destination)
      osc1.start(now)
      osc1.stop(now + 0.8)

      // Tone 2: 659.25 Hz (E5) delayed by 120ms
      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()
      osc2.type = 'sine'
      osc2.frequency.setValueAtTime(659.25, now + 0.12)
      gain2.gain.setValueAtTime(0, now + 0.12)
      gain2.gain.linearRampToValueAtTime(volume * 0.9, now + 0.18)
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.2)

      osc2.connect(gain2)
      gain2.connect(ctx.destination)
      osc2.start(now + 0.12)
      osc2.stop(now + 1.2)

      // Tone 3: 783.99 Hz (G5) subtle harmonic top
      const osc3 = ctx.createOscillator()
      const gain3 = ctx.createGain()
      osc3.type = 'sine'
      osc3.frequency.setValueAtTime(783.99, now + 0.24)
      gain3.gain.setValueAtTime(0, now + 0.24)
      gain3.gain.linearRampToValueAtTime(volume * 0.7, now + 0.3)
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 1.4)

      osc3.connect(gain3)
      gain3.connect(ctx.destination)
      osc3.start(now + 0.24)
      osc3.stop(now + 1.4)
    } catch (e) {
      console.warn('[AudioChime] Failed to synthesize reminder chime:', e)
    }
  }

  /**
   * Play an urgent but calm double alert for missed doses.
   */
  public playMissedDoseChime(volume: number = 0.3) {
    try {
      const ctx = this.getContext()
      if (!ctx) return

      const now = ctx.currentTime

      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(440, now) // A4
      osc.frequency.setValueAtTime(440, now + 0.15)
      osc.frequency.setValueAtTime(392, now + 0.3) // G4

      gain.gain.setValueAtTime(volume, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.9)
    } catch (e) {
      console.warn('[AudioChime] Failed to synthesize missed chime:', e)
    }
  }
}

export const audioChime = new AudioChimeService()
