import { useEffect, useRef, useState, type MutableRefObject, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Maximize2, Minimize2, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { IceButton } from "./IceButton";
import { Coin } from "./Shell";
import { celebrate, updateGame } from "@/lib/game-store";
import { setSfxEnabled, sfx } from "@/lib/sfx";
import prism from "@/assets/prism-logo.webp";

export type Phase = "ready" | "playing" | "over";
export interface Stat { label: string; value: ReactNode }

interface Props {
  title: string; hint: string; phase: Phase; stats: Stat[]; pausedRef: MutableRefObject<boolean>;
  reward: number; summary: string; onStart: () => void; onExit: () => void; children: ReactNode; controls?: ReactNode;
  /** canvas aspect ratio (width / height) so the board fills the screen without stretching */
  ratio: number;
}

/** Full-screen frozen arcade stage: top bar, stat chips, start / pause / claim cards shared by all games. */
export function ArcadeFrame({ title, hint, phase, stats, pausedRef, reward, summary, onStart, onExit, children, controls, ratio }: Props) {
  const [claimed, setClaimed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [sound, setSound] = useState(true);
  const [full, setFull] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setMounted(true); const o = document.body.style.overflow; document.body.style.overflow = "hidden";
    const fs = () => setFull(!!document.fullscreenElement); document.addEventListener("fullscreenchange", fs);
    return () => { document.body.style.overflow = o; document.removeEventListener("fullscreenchange", fs); setSfxEnabled(true); if (document.fullscreenElement) void document.exitFullscreen?.(); };
  }, []);
  useEffect(() => { if (phase === "playing") setClaimed(false); setPaused(false); pausedRef.current = false; }, [phase, pausedRef]);
  const togglePause = () => { if (phase !== "playing") return; const v = !paused; setPaused(v); pausedRef.current = v; sfx.tap(); };
  const toggleSound = () => { const v = !sound; setSound(v); setSfxEnabled(v); };
  const toggleFull = () => { if (document.fullscreenElement) void document.exitFullscreen?.(); else void stage.current?.requestFullscreen?.().catch(() => {}); };
  const claim = (el: Element) => {
    if (claimed) return;
    setClaimed(true);
    if (reward > 0) { updateGame((s) => ({ ...s, balance: s.balance + reward })); celebrate(reward, el); sfx.chime(); }
  };
  if (!mounted) return null;
  const card = (body: ReactNode) => (
    <div className="absolute inset-0 z-10 grid place-items-center bg-background/55 px-6 backdrop-blur-[3px]">
      <div className="ice-panel snow-cap w-full max-w-[300px] p-5 text-center">
        <img src={prism} alt="" className="mx-auto h-16 w-16 object-contain animate-floaty" />{body}
      </div>
    </div>
  );
  return createPortal(
    <div ref={stage} className="arcade-stage fixed inset-0 z-[60] flex flex-col" role="dialog" aria-modal aria-label={title}>
      <div className="mx-3 mt-[max(12px,env(safe-area-inset-top))] flex items-center gap-2">
        <IceButton glyph="back" aria-label="Back to games" onClick={onExit} />
        <p className="ice-title min-w-0 flex-1 truncate text-center text-lg leading-tight">{title}</p>
        <button type="button" className="arcade-tool" aria-label={sound ? "Mute sound" : "Turn sound on"} onClick={toggleSound}>{sound ? <Volume2 /> : <VolumeX />}</button>
        <button type="button" className="arcade-tool" aria-label={paused ? "Resume" : "Pause"} onClick={togglePause} disabled={phase !== "playing"}>{paused ? <Play /> : <Pause />}</button>
        <button type="button" className="arcade-tool" aria-label="Full screen" onClick={toggleFull}>{full ? <Minimize2 /> : <Maximize2 />}</button>
      </div>
      <div className="mx-3 mt-3 grid gap-2" style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(0,1fr))` }}>
        {stats.map((s) => (
          <div key={s.label} className="arcade-stat">
            <p className="text-[9px] font-bold tracking-[0.14em] text-crystal">{s.label}</p>
            <div className="mt-0.5 truncate font-display text-base leading-tight text-ice tabular-nums">{s.value}</div>
          </div>
        ))}
      </div>
      <div className="relative mx-3 mb-[max(12px,env(safe-area-inset-bottom))] mt-3 flex min-h-0 flex-1 flex-col">
        <div className="arcade-board relative min-h-0 flex-1" style={{ ["--ar" as string]: ratio }}>
          <div className="arcade-fit relative">
            {children}
            {phase === "ready" && card(<>
              <p className="ice-title mt-1 text-2xl">{title}</p>
              <p className="mt-2 text-sm text-crystal">{hint}</p>
              <IceButton wide className="mt-7 w-full" onClick={onStart}>PLAY</IceButton>
            </>)}
            {phase === "playing" && paused && card(<>
              <p className="ice-title mt-1 text-2xl">PAUSED</p>
              <div className="mt-7 flex gap-3">
                <IceButton wide className="flex-1" onClick={togglePause}>RESUME</IceButton>
                <IceButton wide glyph="close" className="flex-1" onClick={onExit}>EXIT</IceButton>
              </div>
            </>)}
            {phase === "over" && card(<>
              <p className="ice-title mt-1 text-2xl">RUN COMPLETE</p>
              <p className="mt-1 text-sm text-crystal">{summary}</p>
              <p className="reward-ember mt-3 flex items-center justify-center gap-1.5 font-display text-3xl"><Coin className="h-7 w-7" />+{reward}</p>
              <div className="mt-7 flex gap-3">
                <IceButton wide glyph="check" className="flex-1" disabled={claimed} onClick={(e) => claim(e.currentTarget)}>{claimed ? "CLAIMED" : "CLAIM"}</IceButton>
                <IceButton wide className="flex-1" onClick={() => { if (!claimed) claim(document.body); onStart(); }}>AGAIN</IceButton>
              </div>
            </>)}
          </div>
        </div>
        {controls && <div className="mt-4 flex justify-between px-4">{controls}</div>}
      </div>
    </div>,
    document.body,
  );
}

/** Hearts row for the LIVES chip. */
export function Hearts({ n, max = 3 }: { n: number; max?: number }) {
  return <span className="flex gap-0.5 text-sm">{Array.from({ length: max }, (_, i) => <span key={i} className={i < n ? "text-cyan" : "text-ice/25"}>♥</span>)}</span>;
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
