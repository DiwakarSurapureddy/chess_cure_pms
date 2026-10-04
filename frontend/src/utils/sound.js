// Realistic Wooden Chess Board Piece Audio Feedback
// Uses authentic wooden piece audio files with a Web Audio wooden acoustic synthesizer fallback

const sounds = {
  move: typeof Audio !== 'undefined' ? new Audio('/sounds/move.mp3') : null,
  capture: typeof Audio !== 'undefined' ? new Audio('/sounds/capture.mp3') : null,
  notify: typeof Audio !== 'undefined' ? new Audio('/sounds/notify.mp3') : null,
};

// Pre-configure volume and clone for instant zero-latency playback
const playAudioElement = (audioObj) => {
  if (!audioObj) return false;
  try {
    const clone = audioObj.cloneNode();
    clone.volume = 0.85;
    const promise = clone.play();
    if (promise !== undefined) {
      promise.catch(() => {
        // If browser blocks audio element autoplay policy, fallback to synthesizer
        playSynthesizedWoodSound('move');
      });
    }
    return true;
  } catch (err) {
    return false;
  }
};

// Realistic Web Audio Acoustic Wooden Knock Synthesizer
const playSynthesizedWoodSound = (type = 'move') => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'triangle';
    filter.type = 'lowpass';

    if (type === 'capture') {
      // Deeper double wooden impact for taking pieces
      filter.frequency.setValueAtTime(550, t);
      filter.frequency.exponentialRampToValueAtTime(120, t + 0.12);

      osc.frequency.setValueAtTime(260, t);
      osc.frequency.exponentialRampToValueAtTime(80, t + 0.12);

      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.12);
    } else {
      // Crisp authentic weighted wooden piece placement on wood board
      filter.frequency.setValueAtTime(650, t);
      filter.frequency.exponentialRampToValueAtTime(140, t + 0.08);

      osc.frequency.setValueAtTime(320, t);
      osc.frequency.exponentialRampToValueAtTime(95, t + 0.08);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.08);
    }
  } catch (e) {
    // restricted by browser policy before first interaction
  }
};

export const playChessSound = (type = 'move') => {
  const target = sounds[type] || sounds.move;
  const played = playAudioElement(target);
  if (!played) {
    playSynthesizedWoodSound(type);
  }
};

export default playChessSound;
