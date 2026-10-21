// Realistic High-Performance Zero-Latency Chess Board Audio Engine
// Uses Web Audio API with pre-decoded AudioBuffers for instant (0ms) real-time sound playback,
// backed by an HTML5 Audio Pool and high-fidelity wooden acoustic synthesizer fallback.

let audioContext = null;
const audioBuffers = {
  move: null,
  capture: null,
  notify: null,
};
const rawArrayBuffers = {};

// Preload raw audio data via fetch immediately (no AudioContext needed, zero warnings)
const soundUrls = {
  move: '/sounds/move.mp3',
  capture: '/sounds/capture.mp3',
  notify: '/sounds/notify.mp3',
};

if (typeof window !== 'undefined') {
  Object.entries(soundUrls).forEach(async ([key, url]) => {
    try {
      const res = await fetch(url);
      if (res.ok) {
        rawArrayBuffers[key] = await res.arrayBuffer();
      }
    } catch (e) {}
  });
}

// Decode cached array buffers once AudioContext is created
const decodeCachedBuffers = (ctx) => {
  if (!ctx) return;
  Object.entries(rawArrayBuffers).forEach(([key, buf]) => {
    if (!audioBuffers[key] && buf) {
      try {
        ctx.decodeAudioData(
          buf.slice(0),
          (decoded) => { audioBuffers[key] = decoded; },
          () => {}
        );
      } catch (e) {}
    }
  });
};

// Singleton AudioContext getter: only created after user gesture or on sound play
const getAudioContext = (createIfMissing = false) => {
  if (typeof window === 'undefined') return null;
  if (!audioContext && createIfMissing) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      try {
        audioContext = new AudioCtx();
        decodeCachedBuffers(audioContext);
      } catch (e) {}
    }
  }
  if (audioContext && audioContext.state === 'suspended' && createIfMissing) {
    audioContext.resume().catch(() => {});
  }
  return audioContext;
};

// Auto-unlock and create AudioContext strictly on first user interaction anywhere on the page
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    const ctx = getAudioContext(true);
    if (ctx) {
      decodeCachedBuffers(ctx);
    }
    window.removeEventListener('click', unlockAudio, true);
    window.removeEventListener('touchstart', unlockAudio, true);
    window.removeEventListener('keydown', unlockAudio, true);
  };
  window.addEventListener('click', unlockAudio, true);
  window.addEventListener('touchstart', unlockAudio, true);
  window.addEventListener('keydown', unlockAudio, true);
}

// Fast HTML5 Audio pool as an immediate fallback
const audioPool = {
  move: typeof Audio !== 'undefined' ? [new Audio('/sounds/move.mp3'), new Audio('/sounds/move.mp3')] : [],
  capture: typeof Audio !== 'undefined' ? [new Audio('/sounds/capture.mp3'), new Audio('/sounds/capture.mp3')] : [],
  notify: typeof Audio !== 'undefined' ? [new Audio('/sounds/notify.mp3')] : [],
};
const poolIndices = { move: 0, capture: 0, notify: 0 };

const playFromAudioPool = (type) => {
  const list = audioPool[type] || audioPool.move;
  if (!list || list.length === 0) return false;
  try {
    const idx = (poolIndices[type] || 0) % list.length;
    poolIndices[type] = idx + 1;
    const audio = list[idx];
    audio.currentTime = 0;
    audio.volume = type === 'capture' ? 0.95 : 0.85;
    const p = audio.play();
    if (p !== undefined) {
      p.catch(() => {});
    }
    return true;
  } catch (err) {
    return false;
  }
};

// Realistic Web Audio Acoustic Wooden Knock Synthesizer
const playSynthesizedWoodSound = (type = 'move') => {
  try {
    const ctx = getAudioContext(true);
    if (!ctx) return;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'triangle';
    filter.type = 'lowpass';

    if (type === 'capture') {
      // Heavier double acoustic wooden impact with board resonance
      filter.frequency.setValueAtTime(600, t);
      filter.frequency.exponentialRampToValueAtTime(100, t + 0.14);

      osc.frequency.setValueAtTime(280, t);
      osc.frequency.exponentialRampToValueAtTime(70, t + 0.14);

      gain.gain.setValueAtTime(0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.14);
    } else if (type === 'notify' || type === 'success') {
      // Pleasant bright alert chime
      filter.frequency.setValueAtTime(1800, t);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, t); // D5
      osc.frequency.setValueAtTime(880, t + 0.08); // A5
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.35);
    } else {
      // Crisp weighted wooden piece placement snap on wood chessboard
      filter.frequency.setValueAtTime(750, t);
      filter.frequency.exponentialRampToValueAtTime(120, t + 0.09);

      osc.frequency.setValueAtTime(340, t);
      osc.frequency.exponentialRampToValueAtTime(90, t + 0.09);

      gain.gain.setValueAtTime(0.45, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.09);
    }
  } catch (e) {
    // Suppress audio policy edge cases
  }
};

/**
 * Play Real-Time Chess Sound (0ms Latency)
 * @param {'move' | 'capture' | 'notify' | 'success'} type 
 */
export const playChessSound = (type = 'move') => {
  const normType = (type === 'success' ? 'notify' : type) || 'move';

  // 1. Primary Strategy: Zero-latency Web Audio pre-decoded buffer
  try {
    const ctx = getAudioContext(true);
    const buffer = audioBuffers[normType] || audioBuffers.move;

    if (ctx && buffer && ctx.state !== 'closed') {
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      const source = ctx.createBufferSource();
      const gainNode = ctx.createGain();
      gainNode.gain.value = normType === 'capture' ? 0.95 : 0.85;

      source.buffer = buffer;
      source.connect(gainNode);
      gainNode.connect(ctx.destination);
      source.start(0);
      return;
    }
  } catch (e) {
    // Proceed to fallback
  }

  // 2. Secondary Strategy: Preloaded HTML5 Audio Pool
  const played = playFromAudioPool(normType);
  if (played) return;

  // 3. Tertiary Strategy: Acoustic Synthesizer Knock
  playSynthesizedWoodSound(normType);
};

export default playChessSound;
