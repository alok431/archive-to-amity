import type { MutableRefObject } from "react";

/** One retained frame; no polling while paused or in a hidden browser tab. */
export function createFrameScheduler(paused: MutableRefObject<boolean>, onResume: () => void) {
  let pending: FrameRequestCallback | null = null;
  let id = 0;
  let disposed = false;
  const blocked = () => document.hidden || paused.current;
  const schedule = () => {
    if (disposed || blocked() || id || !pending) return;
    id = requestAnimationFrame((time) => {
      id = 0;
      if (disposed || blocked()) return;
      const callback = pending;
      pending = null;
      callback?.(time);
    });
  };
  const refresh = () => {
    if (blocked()) { cancelAnimationFrame(id); id = 0; }
    else { onResume(); schedule(); }
  };
  document.addEventListener("visibilitychange", refresh);
  document.addEventListener("arcade-pause-change", refresh);
  return {
    request(callback: FrameRequestCallback) { pending = callback; schedule(); return id; },
    dispose() {
      disposed = true; pending = null; cancelAnimationFrame(id);
      document.removeEventListener("visibilitychange", refresh);
      document.removeEventListener("arcade-pause-change", refresh);
    },
  };
}