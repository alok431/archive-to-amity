// Synthesized ice sounds + haptics (browser only, called from event handlers).
let ctx: AudioContext | null = null;
let enabled = true;
let crackBuffer: AudioBuffer | null = null;
const activeSources = new Set<AudioScheduledSourceNode>();
export function stopActiveSounds() {
  for (const source of activeSources) { try { source.stop(); } catch { /* already ended */ } source.onended?.(new Event("ended")); }
}
function track(source: AudioScheduledSourceNode, nodes: AudioNode[]) {
  activeSources.add(source);
  source.onended = () => { activeSources.delete(source); source.disconnect(); nodes.forEach((node) => node.disconnect()); source.onended = null; };
}
export const setSfxEnabled = (v: boolean) => { enabled = v; if (!v) stopActiveSounds(); };

function ac() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const C = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!C) return null;
    ctx = new C();
  }
  if (ctx.state === "suspended") void ctx.resume().catch(() => {});
  return ctx;
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = "sine", vol = 0.12) {
  const c = ac();
  if (!c) return;
  const t = c.currentTime + start;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  track(o, [g]);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function buzz(ms: number | number[]) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(ms);
}

export const sfx = {
  shoot(gun = 0) {
    if (!enabled) return;
    const c = ac(); if (!c) return;
    const t = c.currentTime, o = c.createOscillator(), g = c.createGain();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(1400 + gun * 180, t);
    o.frequency.exponentialRampToValueAtTime(260, t + 0.065);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.045, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.075);
    o.connect(g).connect(c.destination); track(o, [g]); o.start(t); o.stop(t + 0.085);
  },
  tap() { if (!enabled) return; tone(1800, 0, 0.06, "triangle", 0.06); buzz(8); },
  chime() { if (!enabled) return; [1318, 1760, 2637].forEach((f, i) => tone(f, i * 0.08, 0.35, "sine", 0.1)); buzz([12, 40, 18]); },
  crack() {
    if (!enabled) return;
    const c = ac(); if (!c) return;
    if (!crackBuffer) {
      const len = Math.floor(c.sampleRate * 0.18);
      crackBuffer = c.createBuffer(1, len, c.sampleRate);
      const d = crackBuffer.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    }
    const s = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter();
    f.type = "highpass"; f.frequency.value = 1500; g.gain.value = 0.25;
    s.buffer = crackBuffer; s.connect(f).connect(g).connect(c.destination); track(s, [f, g]); s.start();
    tone(2400, 0.05, 0.3, "sine", 0.08); buzz([20, 30, 20]);
  },
  mine() { if (!enabled) return; tone(900 + Math.random() * 600, 0, 0.08, "square", 0.04); buzz(6); },
};
