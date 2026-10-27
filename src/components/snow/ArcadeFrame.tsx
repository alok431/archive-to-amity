import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Heart } from "lucide-react";
import { IceButton } from "./IceButton";
import { Coin } from "./Shell";
import { celebrate, updateGame } from "@/lib/game-store";
import { sfx } from "@/lib/sfx";
import prism from "@/assets/prism-logo.webp";

export type Phase = "ready" | "playing" | "over";

interface Props {
  title: string; hint: string; phase: Phase; score: string; lives?: number; time?: number;
  reward: number; summary: string; onStart: () => void; onExit: () => void; children: ReactNode;
}

/** Full-screen frozen arcade stage: HUD, start card and claim card shared by all games. */
export function ArcadeFrame({ title, hint, phase, score, lives, time, reward, summary, onStart, onExit, children }: Props) {
  const [claimed, setClaimed] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); const o = document.body.style.overflow; document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = o; }; }, []);
  useEffect(() => { if (phase === "playing") setClaimed(false); }, [phase]);
  const claim = (el: Element) => {
    if (claimed) return;
    setClaimed(true);
    if (reward > 0) { updateGame((s) => ({ ...s, balance: s.balance + reward })); celebrate(reward, el); sfx.chime(); }
  };
  if (!mounted) return null;
  return createPortal(
    <div className="arcade-stage fixed inset-0 z-[60] flex flex-col" role="dialog" aria-modal aria-label={title}>
      <div className="arcade-hud ice-panel mx-3 mt-3 flex items-center gap-2 px-2.5 py-2">
        <IceButton glyph="back" aria-label="Back to games" onClick={onExit} />
        <div className="min-w-0 flex-1 text-center">
          <p className="ice-title truncate text-lg leading-none">{title}</p>
          <p className="mt-1 flex items-center justify-center gap-2 text-xs text-crystal tabular-nums">
            <span className="reward-ember font-display text-sm">{score}</span>
            {time !== undefined && <span>⏱ {Math.ceil(time)}s</span>}
            {lives !== undefined && <span className="flex gap-0.5">{Array.from({ length: 3 }, (_, i) => <Heart key={i} size={13} className={i < lives ? "text-cyan" : "text-ice/25"} fill="currentColor" />)}</span>}
          </p>
        </div>
        <IceButton glyph="close" aria-label="Exit game" onClick={onExit} />
      </div>
      <div className="relative mx-auto mt-6 flex w-full max-w-[420px] flex-1 items-start justify-center px-3 pb-4">
        {children}
        {phase !== "playing" && (
          <div className="absolute inset-0 grid place-items-center bg-background/55 px-6 backdrop-blur-[2px]">
            <div className="ice-panel snow-cap w-full max-w-[300px] p-5 text-center">
              <img src={prism} alt="" className="mx-auto h-16 w-16 object-contain animate-floaty" />
              {phase === "ready" ? <>
                <p className="ice-title mt-1 text-2xl">{title}</p>
                <p className="mt-2 text-sm text-crystal">{hint}</p>
                <IceButton wide className="mt-7 w-full" onClick={onStart}>PLAY</IceButton>
              </> : <>
                <p className="ice-title mt-1 text-2xl">RUN COMPLETE</p>
                <p className="mt-1 text-sm text-crystal">{summary}</p>
                <p className="reward-ember mt-3 flex items-center justify-center gap-1.5 font-display text-3xl"><Coin className="h-7 w-7" />+{reward}</p>
                <div className="mt-7 flex gap-3">
                  <IceButton wide glyph="check" className="flex-1" disabled={claimed} onClick={(e) => claim(e.currentTarget)}>{claimed ? "CLAIMED" : "CLAIM"}</IceButton>
                  <IceButton wide className="flex-1" onClick={() => { if (!claimed) claim(document.body); onStart(); }}>AGAIN</IceButton>
                </div>
              </>}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

/** Canvas helpers shared by the arcade games. */
export function loadImages<T extends Record<string, string>>(srcs: T): Promise<Record<keyof T, HTMLImageElement>> {
  const entries = Object.entries(srcs).map(([k, src]) => new Promise<[string, HTMLImageElement]>((res) => {
    const im = new Image(); im.onload = () => res([k, im]); im.onerror = () => res([k, im]); im.src = src;
  }));
  return Promise.all(entries).then((e) => Object.fromEntries(e) as Record<keyof T, HTMLImageElement>);
}

export function setupCanvas(c: HTMLCanvasElement, w: number, h: number) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  c.width = w * dpr; c.height = h * dpr;
  const ctx = c.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

export type Flake = { x: number; y: number; r: number; v: number };
export function makeFlakes(n: number, w: number, h: number): Flake[] {
  return Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, r: 0.6 + Math.random() * 2, v: 20 + Math.random() * 50 }));
}
export function drawFlakes(ctx: CanvasRenderingContext2D, f: Flake[], dt: number, w: number, h: number, extra = 0) {
  ctx.fillStyle = "rgba(235,248,255,.85)";
  for (const p of f) {
    p.y += (p.v + extra) * dt; p.x += Math.sin(p.y / 30) * 0.3;
    if (p.y > h) { p.y = -4; p.x = Math.random() * w; }
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
  }
}
