import { useCallback, useRef } from 'react';

const SOUNDS_KEY = 'admin-desktop-sounds-enabled';

export function loadSoundsEnabled(): boolean {
  try {
    const val = localStorage.getItem(SOUNDS_KEY);
    return val === null ? false : val === 'true';
  } catch { return false; }
}

export function saveSoundsEnabled(enabled: boolean) {
  localStorage.setItem(SOUNDS_KEY, String(enabled));
}

// Generate simple tones using Web Audio API
function playTone(frequency: number, duration: number, volume: number, type: OscillatorType = 'sine') {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
    setTimeout(() => ctx.close(), (duration + 0.1) * 1000);
  } catch {
    // Silently fail if audio is blocked
  }
}

export function useDesktopSounds(enabled: boolean) {
  const playOpen = useCallback(() => {
    if (!enabled) return;
    playTone(880, 0.12, 0.06, 'sine');
    setTimeout(() => playTone(1100, 0.1, 0.04, 'sine'), 60);
  }, [enabled]);

  const playMinimize = useCallback(() => {
    if (!enabled) return;
    playTone(600, 0.1, 0.04, 'sine');
  }, [enabled]);

  const playClose = useCallback(() => {
    if (!enabled) return;
    playTone(440, 0.15, 0.05, 'sine');
    setTimeout(() => playTone(330, 0.12, 0.03, 'sine'), 70);
  }, [enabled]);

  const playClick = useCallback(() => {
    if (!enabled) return;
    playTone(1200, 0.04, 0.02, 'square');
  }, [enabled]);

  return { playOpen, playMinimize, playClose, playClick };
}
