export type SoundStyle = 'phone-tap' | 'ios-click' | 'keyboard' | 'subtle';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
  } catch {
    return null;
  }
  return audioCtx;
}

/**
 * Generates an instant, zero-latency phone-like click or tap sound using the Web Audio API.
 * Emulates the tactile audio-haptic feedback of modern smartphones (iOS, Pixel, Samsung).
 */
export function playPhoneClick(
  style: SoundStyle = 'phone-tap',
  volume = 0.35
): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.connect(ctx.destination);

    // Limit master volume safely between 0.05 and 1.0
    const finalVolume = Math.max(0.05, Math.min(1.0, volume));

    if (style === 'ios-click') {
      // iPhone-style crisp wooden tick
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, now);
      filter.Q.setValueAtTime(3.0, now);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(950, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.014);

      masterGain.gain.setValueAtTime(finalVolume * 0.75, now);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.014);

      osc.connect(filter);
      filter.connect(masterGain);

      osc.start(now);
      osc.stop(now + 0.016);
    } else if (style === 'keyboard') {
      // Mechanical tactile phone keyboard click
      const osc = ctx.createOscillator();
      const oscLow = ctx.createOscillator();
      const gainLow = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.02);

      oscLow.type = 'sine';
      oscLow.frequency.setValueAtTime(180, now);
      oscLow.frequency.exponentialRampToValueAtTime(40, now + 0.022);

      gainLow.gain.setValueAtTime(finalVolume * 0.4, now);
      gainLow.gain.exponentialRampToValueAtTime(0.0001, now + 0.022);
      oscLow.connect(gainLow);
      gainLow.connect(masterGain);

      masterGain.gain.setValueAtTime(finalVolume * 0.8, now);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);

      osc.connect(masterGain);

      osc.start(now);
      oscLow.start(now);
      osc.stop(now + 0.025);
      oscLow.stop(now + 0.025);
    } else if (style === 'subtle') {
      // Very soft, non-intrusive whisper tap
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, now);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.018);

      masterGain.gain.setValueAtTime(finalVolume * 0.5, now);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.018);

      osc.connect(filter);
      filter.connect(masterGain);

      osc.start(now);
      osc.stop(now + 0.02);
    } else {
      // 'phone-tap' (Default) - Warm, modern tactile smartphone tap (Pixel/Android haptic tap)
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(480, now);
      filter.Q.setValueAtTime(2.2, now);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(75, now + 0.022);

      masterGain.gain.setValueAtTime(finalVolume, now);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.022);

      osc.connect(filter);
      filter.connect(masterGain);

      osc.start(now);
      osc.stop(now + 0.025);
    }
  } catch {
    // Fail silently if browser blocks audio
  }
}
