// Web Audio API Synthesizer for Void Signal Lab
// Replaces dead remote MP3 links with zero-dependency generative audio

let audioCtx: AudioContext | null = null;
let ambientOsc1: OscillatorNode | null = null;
let ambientOsc2: OscillatorNode | null = null;
let ambientGain: GainNode | null = null;

export const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
};

export const playUiClick = (volume = 0.2) => {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(800, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.05);
  
  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  osc.start();
  osc.stop(audioCtx.currentTime + 0.05);
};

export const playUiError = (volume = 0.3) => {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(150, audioCtx.currentTime);
  osc.frequency.linearRampToValueAtTime(100, audioCtx.currentTime + 0.3);
  
  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  osc.start();
  osc.stop(audioCtx.currentTime + 0.3);
};

export const playUiSuccess = (volume = 0.2) => {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(400, audioCtx.currentTime);
  osc.frequency.setValueAtTime(600, audioCtx.currentTime + 0.1);
  osc.frequency.setValueAtTime(800, audioCtx.currentTime + 0.2);
  
  gain.gain.setValueAtTime(0, audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(volume, audioCtx.currentTime + 0.05);
  gain.gain.setValueAtTime(volume, audioCtx.currentTime + 0.2);
  gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  osc.start();
  osc.stop(audioCtx.currentTime + 0.4);
};

export const startAmbientDrone = (volume = 0.05) => {
  if (!audioCtx) return;
  if (ambientOsc1) return; // Already playing

  ambientGain = audioCtx.createGain();
  ambientGain.gain.value = volume;

  ambientOsc1 = audioCtx.createOscillator();
  ambientOsc1.type = 'sine';
  ambientOsc1.frequency.value = 55; // Low bass drone

  ambientOsc2 = audioCtx.createOscillator();
  ambientOsc2.type = 'triangle';
  ambientOsc2.frequency.value = 54.5; // Slight detune for phasing

  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 400;

  ambientOsc1.connect(filter);
  ambientOsc2.connect(filter);
  filter.connect(ambientGain);
  ambientGain.connect(audioCtx.destination);

  ambientOsc1.start();
  ambientOsc2.start();
};

export const setAmbientVolume = (vol: number) => {
  if (ambientGain && audioCtx) {
    ambientGain.gain.setTargetAtTime(Math.max(0, Math.min(1, vol)), audioCtx.currentTime, 0.5);
  }
};

export const playStaticBurst = (duration = 0.5, volume = 0.1) => {
  if (!audioCtx) return;
  const bufferSize = audioCtx.sampleRate * duration;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  
  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;
  
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 1000;
  
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
  
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);
  
  noise.start();
};

export const playWhisper = (volume = 0.1) => {
  if (!audioCtx) return;
  // Synthesize a creepy whisper using heavily filtered pink noise and amplitude modulation
  const bufferSize = audioCtx.sampleRate * 2; // 2 seconds
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    data[i] = (lastOut + (0.02 * white)) / 1.02; // Pink noise approximation
    lastOut = data[i];
    // Modulate with a slow sine shape to sound like syllables
    data[i] *= Math.sin(i / audioCtx.sampleRate * Math.PI * 4);
  }
  
  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;
  noise.playbackRate.value = 0.5 + Math.random() * 0.5;
  
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 2000;
  filter.Q.value = 2; // Resonant filter
  
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0, audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(volume, audioCtx.currentTime + 1);
  gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 2);
  
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);
  
  noise.start();
};
let lastOut = 0;

// NEW HORROR SOUNDS

export const playBreathing = (volume = 0.2) => {
  if (!audioCtx) return;
  const duration = 4.0; // 2s inhale, 2s exhale
  const bufferSize = audioCtx.sampleRate * duration;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  
  // Generate brown-ish noise
  let noiseLevel = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    noiseLevel = (noiseLevel + (0.02 * white)) / 1.02;
    data[i] = noiseLevel * 3.5;
  }
  
  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;
  
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  
  // Sweep filter frequency (Inhale -> Exhale)
  filter.frequency.setValueAtTime(200, audioCtx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 1.5);
  filter.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 4.0);
  
  // Volume swell
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0, audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(volume, audioCtx.currentTime + 1.5); // Peak of inhale
  gain.gain.linearRampToValueAtTime(volume * 0.3, audioCtx.currentTime + 2.0); // Pause
  gain.gain.linearRampToValueAtTime(volume * 0.8, audioCtx.currentTime + 2.5); // Start exhale
  gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 4.0); // End
  
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);
  
  noise.start();
};

export const playHeartbeat = (volume = 0.5, speed = 1.0) => {
  if (!audioCtx) return;
  const duration = 1.0 / speed;
  const t0 = audioCtx.currentTime;
  const t1 = t0 + (0.15 / speed); // Second beat gap
  
  // Lub
  const osc1 = audioCtx.createOscillator();
  const gain1 = audioCtx.createGain();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(50, t0);
  osc1.frequency.exponentialRampToValueAtTime(30, t0 + 0.1);
  gain1.gain.setValueAtTime(0, t0);
  gain1.gain.linearRampToValueAtTime(volume, t0 + 0.02);
  gain1.gain.exponentialRampToValueAtTime(0.01, t0 + 0.15);
  osc1.connect(gain1);
  gain1.connect(audioCtx.destination);
  osc1.start(t0);
  osc1.stop(t0 + 0.2);

  // Dub
  const osc2 = audioCtx.createOscillator();
  const gain2 = audioCtx.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(60, t1);
  osc2.frequency.exponentialRampToValueAtTime(35, t1 + 0.15);
  gain2.gain.setValueAtTime(0, t1);
  gain2.gain.linearRampToValueAtTime(volume * 0.8, t1 + 0.02);
  gain2.gain.exponentialRampToValueAtTime(0.01, t1 + 0.3);
  osc2.connect(gain2);
  gain2.connect(audioCtx.destination);
  osc2.start(t1);
  osc2.stop(t1 + 0.4);
};

export const playDistantClank = (volume = 0.3) => {
  if (!audioCtx) return;
  const t0 = audioCtx.currentTime;
  
  // Metallic impact uses multiple inharmonic frequencies
  const freqs = [350, 412, 575, 820, 1105];
  const masterGain = audioCtx.createGain();
  masterGain.gain.setValueAtTime(volume, t0);
  masterGain.gain.exponentialRampToValueAtTime(0.01, t0 + 1.5);
  
  // Bandpass filter to make it sound hollow and distant
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 600;
  filter.Q.value = 1.5;
  
  masterGain.connect(filter);
  filter.connect(audioCtx.destination);
  
  freqs.forEach(freq => {
    const osc = audioCtx.createOscillator();
    osc.type = Math.random() > 0.5 ? 'square' : 'sawtooth';
    osc.frequency.setValueAtTime(freq, t0);
    // Slight pitch bend on impact
    osc.frequency.exponentialRampToValueAtTime(freq * 0.95, t0 + 0.5);
    
    // Each partial decays at slightly different rates
    const partialGain = audioCtx.createGain();
    partialGain.gain.setValueAtTime(1.0 / freqs.length, t0);
    partialGain.gain.exponentialRampToValueAtTime(0.01, t0 + 0.2 + Math.random() * 1.0);
    
    osc.connect(partialGain);
    partialGain.connect(masterGain);
    osc.start(t0);
    osc.stop(t0 + 1.5);
  });
};

export const playRumble = (volume = 0.4, duration = 3.0) => {
  if (!audioCtx) return;
  const bufferSize = audioCtx.sampleRate * duration;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  
  // Deep brown noise
  let last = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + (0.02 * white)) / 1.02;
    data[i] = last * 4.0; 
  }
  
  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;
  
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(40, audioCtx.currentTime);
  // Rumble filter sweep to simulate movement
  filter.frequency.linearRampToValueAtTime(120, audioCtx.currentTime + duration * 0.5);
  filter.frequency.linearRampToValueAtTime(30, audioCtx.currentTime + duration);
  
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0, audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(volume, audioCtx.currentTime + duration * 0.2); // Fade in
  gain.gain.setValueAtTime(volume, audioCtx.currentTime + duration * 0.8); // Sustain
  gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + duration); // Fade out
  
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);
  
  noise.start();
};

export const playDemonicVoice = async (base64AudioUrl: string, gainMultiplier = 4.0) => {
  if (!audioCtx) return;

  try {
    const response = await fetch(base64AudioUrl);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    
    // Drop pitch and speed to sound huge and demonic
    source.playbackRate.value = 0.65;

    const lowpass = audioCtx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 500;

    const delay = audioCtx.createDelay(5.0);
    delay.delayTime.value = 0.4;
    
    const feedback = audioCtx.createGain();
    feedback.gain.value = 0.5;

    const masterGain = audioCtx.createGain();
    masterGain.gain.value = gainMultiplier;

    source.connect(lowpass);
    lowpass.connect(delay);
    lowpass.connect(masterGain);
    
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(masterGain);

    masterGain.connect(audioCtx.destination);
    
    source.start(0);

  } catch(e) {
    console.warn("VANTAGE CORP AUDIO PROCESSING FAILURE: ", e);
  }
};

export const playTTSWhisper = (text: string) => {
  if (!window.speechSynthesis) return;
  const utterance = new SpeechSynthesisUtterance(text);
  
  // Try to find a creepy default system voice if possible, or just default.
  // We use standard ones to avoid network calls, OS defaults are usually fine
  // mostly just manipulating pitch and rate does the trick.
  utterance.pitch = 0.1;
  utterance.rate = 0.6;
  utterance.volume = 0.4;
  
  // Stop anything currently speaking so it forces the new alert
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
};

export const playDiscordGhostPing = (volume = 0.3, glitchy = true) => {
  if (!audioCtx) return;
  const t0 = audioCtx.currentTime;
  
  // Discord-like notification frequencies (approximate)
  const freq1 = 440; // A4
  const freq2 = 554.37; // C#5
  
  const masterGain = audioCtx.createGain();
  masterGain.gain.setValueAtTime(0, t0);
  masterGain.gain.linearRampToValueAtTime(volume, t0 + 0.05);
  masterGain.gain.exponentialRampToValueAtTime(0.01, t0 + 0.6);
  
  const panner = audioCtx.createPanner();
  panner.panningModel = 'HRTF';
  // Random spatial offset for disorientation
  panner.positionX.setValueAtTime(glitchy ? (Math.random() * 2 - 1) * 5 : 0, t0);
  
  masterGain.connect(panner);
  panner.connect(audioCtx.destination);
  
  const osc1 = audioCtx.createOscillator();
  const osc2 = audioCtx.createOscillator();
  
  osc1.type = 'sine';
  osc2.type = 'sine';
  
  osc1.frequency.setValueAtTime(freq1, t0);
  osc2.frequency.setValueAtTime(freq2, t0 + 0.05);
  
  if (glitchy) {
     // Sudden pitch drop at the end
     osc1.frequency.exponentialRampToValueAtTime(100, t0 + 0.5);
     osc2.frequency.exponentialRampToValueAtTime(80, t0 + 0.6);
     
     // Add a bit of FM glitching
     const mod = audioCtx.createOscillator();
     const modGain = audioCtx.createGain();
     mod.frequency.value = 50; 
     modGain.gain.value = 20;
     mod.connect(modGain);
     modGain.connect(osc1.frequency);
     mod.start();
     mod.stop(t0 + 0.2);
  }
  
  osc1.connect(masterGain);
  osc2.connect(masterGain);
  
  osc1.start(t0);
  osc1.stop(t0 + 0.6);
  osc2.start(t0 + 0.05);
  osc2.stop(t0 + 0.65);
};

export const playHighParanoiaScare = (volume = 0.5) => {
  if (!audioCtx) return;
  const t0 = audioCtx.currentTime;
  
  // Add static burst
  const staticOsc = audioCtx.createOscillator();
  const staticGain = audioCtx.createGain();
  staticOsc.type = 'square';
  staticOsc.frequency.setValueAtTime(100, audioCtx.currentTime);
  staticGain.gain.setValueAtTime(volume * 0.3, audioCtx.currentTime);
  staticGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
  staticOsc.connect(staticGain);
  staticGain.connect(audioCtx.destination);
  staticOsc.start();
  staticOsc.stop(audioCtx.currentTime + 0.2);

  // Metallic shriek (new element, replacing the previous high-pitched shriek with this one)
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(150, audioCtx.currentTime);
  osc.frequency.linearRampToValueAtTime(100, audioCtx.currentTime + 0.3);
  
  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  osc.start();
  osc.stop(audioCtx.currentTime + 0.3);
  
  // Low-frequency impact (original)
  const osc2 = audioCtx.createOscillator();
  const gain2 = audioCtx.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(60, t0);
  osc2.frequency.exponentialRampToValueAtTime(30, t0 + 0.2);
  
  gain2.gain.setValueAtTime(volume * 0.8, t0);
  gain2.gain.exponentialRampToValueAtTime(0.01, t0 + 0.5);
  
  osc2.connect(gain2);
  gain2.connect(audioCtx.destination);
  osc2.start(t0);
  osc2.stop(t0 + 0.5);
};

export const playDataScream = (duration = 1.0, volume = 0.6) => {
  if (!audioCtx) return;
  const bufferSize = audioCtx.sampleRate * duration;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.sin(i * 0.05); // Modulated white noise
  }
  
  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;
  
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(2000, audioCtx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + duration);
  
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
  
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);
  
  noise.start();
};

const VOID_MESSAGES = [
  "They are behind you",
  "Don't look up",
  "It's already inside",
  "You invited it in",
  "Check the shadows"
];

export const playVoidWhisper = (text?: string) => {
  const message = text || VOID_MESSAGES[Math.floor(Math.random() * VOID_MESSAGES.length)];
  playTTSWhisper(message);
};
