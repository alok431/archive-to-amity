import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { initialState, type GameState } from "./game-logic";
import { setSfxEnabled } from "./sfx";

const KEY = "snowquest-game-v1";
const SERVER = initialState();
let state: GameState = SERVER;
const subs = new Set<() => void>();

export interface FloatReward { id: number; amount: number; x: number; y: number }
let floats: FloatReward[] = [];
const floatSubs = new Set<() => void>();
let fid = 0;

function emit() { subs.forEach((f) => f()); }

export function loadGame() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = { ...initialState(), ...JSON.parse(raw) };
  } catch { /* ignore corrupt save */ }
  if (!state.energyAt) state = { ...state, energyAt: Date.now() };
  setSfxEnabled(state.sound);
  emit();
}

export function updateGame(fn: (s: GameState) => GameState) {
  const next = fn(state);
  if (next === state) return;
  state = next;
  setSfxEnabled(state.sound);
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage full */ }
  emit();
}

export function useGame() {
  return useSyncExternalStore(
    (cb) => { subs.add(cb); return () => subs.delete(cb); },
    () => state,
    () => SERVER,
  );
}

/** Show a floating "+N" at a point (e.g. the tapped button). */
export function celebrate(amount: number, el?: Element | null) {
  if (amount <= 0 || typeof window === "undefined") return;
  const r = el?.getBoundingClientRect();
  const f = { id: ++fid, amount, x: r ? r.left + r.width / 2 : window.innerWidth / 2, y: r ? r.top : window.innerHeight / 2 };
  floats = [...floats, f];
  floatSubs.forEach((cb) => cb());
  setTimeout(() => { floats = floats.filter((x) => x.id !== f.id); floatSubs.forEach((cb) => cb()); }, 1300);
}

const EMPTY: FloatReward[] = [];
export function useFloats() {
  return useSyncExternalStore(
    (cb) => { floatSubs.add(cb); return () => floatSubs.delete(cb); },
    () => floats,
    () => EMPTY,
  );
}

/** Smoothly counts toward the target number. */
export function useTicker(target: number) {
  const [shown, setShown] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    const start = performance.now(), a = from.current, d = target - a;
    if (d === 0) return;
    let raf = 0;
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / 700);
      const v = Math.round(a + d * (1 - Math.pow(1 - p, 3)));
      from.current = v;
      setShown(v);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return shown;
}
