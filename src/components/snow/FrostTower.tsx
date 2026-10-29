import { useEffect, useRef, useState } from "react";
import { ArcadeFrame, Hearts, drawFlakes, makeFlakes, setupCanvas, type Phase } from "./ArcadeFrame";
import bgSrc from "@/assets/tower-bg.webp";
import { ARCADE_LIVES, TOWER_RINGS, arcadeReward } from "@/lib/arcade-config";
import { sfx } from "@/lib/sfx";

const W = 360, H = 600, CX = W / 2, BALL_Y = 200, RX = 120, RY = 34, THICK = 18, GAP = 30, SEG = 8;
const TAU = Math.PI * 2;
const norm = (a: number) => ((a % TAU) + TAU) % TAU;
type Ring = { off: number; dark: boolean[] };
type Piece = { x: number; y: number; vx: number; vy: number; r: number; vr: number; l: number; dark: boolean };

function makeRing(level: number, i: number): Ring {
  const darkCount = i < 2 ? 0 : Math.min(5, 1 + Math.floor(level / 2) + (Math.random() < 0.4 ? 1 : 0));
  const dark = Array.from({ length: SEG }, () => false);
  const start = Math.floor(Math.random() * SEG);
  for (let k = 0; k < darkCount; k++) dark[(start + k) % SEG] = true;
  return { off: i * 0.22 + Math.sin(i * 0.5) * 0.6, dark };
}

const IN = 0.34; // inner hole radius ratio (pole shows through)
/** Draw one 3D ice ring segment between angles a0..a1: outer side wall, then a glossy top face. */
function band(ctx: CanvasRenderingContext2D, cy: number, a0: number, a1: number, dark: boolean, shade: number, front: boolean) {
  const steps = 7, pt = (a: number, r: number, dy = 0): [number, number] => [CX + Math.cos(a) * RX * r, cy + Math.sin(a) * RY * r + dy];
  if (front) {
    ctx.beginPath();
    for (let k = 0; k <= steps; k++) ctx.lineTo(...pt(a0 + ((a1 - a0) * k) / steps, 1));
    for (let k = steps; k >= 0; k--) ctx.lineTo(...pt(a0 + ((a1 - a0) * k) / steps, 1, THICK));
    ctx.closePath();
    const g = ctx.createLinearGradient(0, cy, 0, cy + RY + THICK);
    if (dark) { g.addColorStop(0, "#2a3350"); g.addColorStop(1, "#05070f"); }
    else { g.addColorStop(0, `rgba(90,200,255,${0.75 + shade * 0.25})`); g.addColorStop(1, "rgba(10,70,160,.95)"); }
    ctx.fillStyle = g; ctx.fill();
  }
  ctx.beginPath();
  for (let k = 0; k <= steps; k++) ctx.lineTo(...pt(a0 + ((a1 - a0) * k) / steps, 1));
  for (let k = steps; k >= 0; k--) ctx.lineTo(...pt(a0 + ((a1 - a0) * k) / steps, IN));
  ctx.closePath();
  const mid = (a0 + a1) / 2, lit = 0.5 + 0.5 * Math.cos(mid + 2.2); // light from upper-left
  const tg = ctx.createLinearGradient(...pt(mid, IN), ...pt(mid, 1));
  if (dark) { tg.addColorStop(0, "#3a4566"); tg.addColorStop(1, `rgba(${30 + lit * 60},${36 + lit * 60},${60 + lit * 70},1)`); }
  else { tg.addColorStop(0, "rgba(200,245,255,.95)"); tg.addColorStop(1, `rgba(${120 + lit * 120},${215 + lit * 40},255,${0.85 + shade * 0.15})`); }
  ctx.fillStyle = tg; ctx.fill();
  ctx.strokeStyle = dark ? "rgba(140,160,210,.4)" : "rgba(255,255,255,.85)"; ctx.lineWidth = 1.2; ctx.stroke();
  if (!dark && lit > 0.7) { ctx.strokeStyle = "rgba(255,255,255,.7)"; ctx.lineWidth = 2; ctx.beginPath(); for (let k = 1; k < steps; k++) ctx.lineTo(...pt(a0 + ((a1 - a0) * k) / steps, 0.86)); ctx.stroke(); }
}

export function FrostTower({ onExit }: { onExit: () => void }) {
  const cv = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<Phase>("ready");
  const paused = useRef(false);
  const hold = useRef(false);
  const [hud, setHud] = useState({ level: 1, rings: 0, cleared: 0, lives: ARCADE_LIVES, left: TOWER_RINGS, fever: false });

  useEffect(() => {
    if (phase !== "playing") return;
    const ctx = setupCanvas(cv.current!, W, H);
    const flakes = makeFlakes(40, W, H);
    const bgImg = new Image(); bgImg.src = bgSrc;
    let level = 1, broken = 0, cleared = 0, lives = ARCADE_LIVES, left = TOWER_RINGS, rot = 0, t = 0, bounce = 0, smashT = 0, streak = 0, fever = 0, hurt = 0, scroll = 0, flash = 0;
    let rings: Ring[] = Array.from({ length: TOWER_RINGS }, (_, i) => makeRing(level, i));
    let pieces: Piece[] = [];
    const sync = () => setHud({ level, rings: broken, cleared, lives: Math.max(0, lives), left, fever: fever > 0 });
    sync();
    let raf = 0, last = performance.now(), alive = true;
    const kd = (e: KeyboardEvent) => { if (e.code === "Space") { e.preventDefault(); hold.current = true; } };
    const ku = (e: KeyboardEvent) => { if (e.code === "Space") hold.current = false; };
    window.addEventListener("keydown", kd); window.addEventListener("keyup", ku);

    const shatter = (ring: Ring, cy: number) => {
      for (let k = 0; k < SEG; k++) {
        const a = (k + 0.5) * (TAU / SEG) + ring.off + rot;
        pieces.push({ x: CX + Math.cos(a) * RX * 0.8, y: cy + Math.sin(a) * RY, vx: Math.cos(a) * (220 + Math.random() * 160), vy: -120 - Math.random() * 200, r: 0, vr: (Math.random() - 0.5) * 10, l: 1, dark: ring.dark[k]! });
      }
    };

    const frame = (now: number) => {
      if (!alive) return;
      if (paused.current) { last = now; raf = requestAnimationFrame(frame); return; }
      const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
      rot += (1.3 + level * 0.12) * dt;
      fever = Math.max(0, fever - dt); hurt = Math.max(0, hurt - dt); flash = Math.max(0, flash - dt);
      scroll = Math.max(0, scroll - scroll * Math.min(1, dt * 14));

      if (hold.current && hurt <= 0 && rings.length) {
        smashT -= dt;
        if (smashT <= 0) {
          smashT = 0.075;
          const top = rings[0]!;
          const front = Math.floor(norm(Math.PI / 2 - rot - top.off) / (TAU / SEG));
          if (top.dark[front] && fever <= 0) {
            lives--; hurt = 1; streak = 0; flash = 0.3; sfx.crack(); hold.current = false;
            for (let k = 0; k < 14; k++) pieces.push({ x: CX, y: BALL_Y + 20, vx: (Math.random() - 0.5) * 300, vy: -Math.random() * 260, r: 0, vr: 6, l: 0.8, dark: false });
          } else {
            shatter(top, BALL_Y + 22); rings.shift(); broken++; left--; streak++; scroll += GAP; sfx.mine();
            if (streak >= 10 && fever <= 0) { fever = 2.5; streak = 0; sfx.chime(); }
            if (!rings.length) { cleared++; level++; left = TOWER_RINGS; rings = Array.from({ length: TOWER_RINGS }, (_, i) => makeRing(level, i)); sfx.chime(); hold.current = false; }
          }
          sync();
        }
      } else { streak = Math.max(0, streak - dt * 6); bounce += dt * 7; }

      // background
      if (bgImg.complete && bgImg.naturalWidth) { const k = Math.max(W / bgImg.naturalWidth, H / bgImg.naturalHeight); ctx.drawImage(bgImg, (W - bgImg.naturalWidth * k) / 2, (H - bgImg.naturalHeight * k) / 2 - 20 + Math.sin(t * 0.3) * 6, bgImg.naturalWidth * k, bgImg.naturalHeight * k); }
      else { ctx.fillStyle = "#0a1c48"; ctx.fillRect(0, 0, W, H); }
      const vg = ctx.createRadialGradient(CX, H * 0.45, 80, CX, H * 0.45, 420); vg.addColorStop(0, "rgba(0,10,30,0)"); vg.addColorStop(1, "rgba(0,10,30,.55)");
      ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
      // frosted crystal pole with facets
      const PR = RX * IN * 0.92;
      const pg = ctx.createLinearGradient(CX - PR, 0, CX + PR, 0);
      pg.addColorStop(0, "rgba(120,190,235,.95)"); pg.addColorStop(0.35, "rgba(255,255,255,.98)"); pg.addColorStop(0.6, "rgba(200,235,255,.95)"); pg.addColorStop(1, "rgba(90,160,220,.95)");
      ctx.fillStyle = pg; ctx.fillRect(CX - PR, 0, PR * 2, H);
      ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 1;
      for (let yy = (-scroll * 0.5 + t * 0) % 46 - 46; yy < H; yy += 46) { ctx.beginPath(); ctx.moveTo(CX - PR, yy); ctx.lineTo(CX + PR * 0.2, yy + 30); ctx.lineTo(CX + PR, yy + 12); ctx.stroke(); }
      ctx.shadowColor = "#7ff0ff"; ctx.shadowBlur = 24; ctx.fillStyle = "rgba(255,255,255,.4)"; ctx.fillRect(CX - PR * 0.55, 0, 5, H); ctx.shadowBlur = 0;
      // rings (bottom first so upper rings overlap)
      const visible = Math.min(rings.length, 16);
      for (let i = visible - 1; i >= 0; i--) {
        const r = rings[i]!, cy = BALL_Y + 22 + i * GAP + scroll;
        if (cy > H + 40) continue;
        const shade = 1 - Math.min(1, i / 14);
        // back half, then front half
        for (const pass of [0, 1]) for (let k = 0; k < SEG; k++) {
          const a0 = k * (TAU / SEG) + r.off + rot, mid = a0 + TAU / SEG / 2;
          if ((Math.sin(mid) > 0 ? 1 : 0) !== pass) continue;
          band(ctx, cy, a0 + 0.03, a0 + TAU / SEG - 0.03, r.dark[k]!, shade * (pass ? 1 : 0.6), pass === 1);
        }
      }
      // shattered pieces
      for (const p of pieces) {
        p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 900 * dt; p.r += p.vr * dt; p.l -= dt;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.globalAlpha = Math.max(0, p.l);
        ctx.fillStyle = p.dark ? "#1b2236" : "rgba(170,235,255,.9)"; ctx.strokeStyle = "rgba(255,255,255,.8)"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(-16, -4); ctx.lineTo(10, -9); ctx.lineTo(16, 4); ctx.lineTo(-8, 9); ctx.closePath(); ctx.fill(); if (!p.dark) ctx.stroke();
        ctx.restore();
      }
      ctx.globalAlpha = 1; pieces = pieces.filter((p) => p.l > 0 && p.y < H + 40);
      // ball + trail
      const smashing = hold.current && hurt <= 0;
      const by = smashing ? BALL_Y : BALL_Y - Math.abs(Math.sin(bounce)) * 70;
      if (smashing) { const tr = ctx.createLinearGradient(0, by - 90, 0, by); tr.addColorStop(0, "rgba(127,240,255,0)"); tr.addColorStop(1, fever > 0 ? "rgba(255,200,120,.8)" : "rgba(127,240,255,.75)"); ctx.fillStyle = tr; ctx.beginPath(); ctx.moveTo(CX - 4, by - 90); ctx.lineTo(CX + 4, by - 90); ctx.lineTo(CX + 14, by); ctx.lineTo(CX - 14, by); ctx.fill(); }
      if (hurt <= 0 || Math.floor(hurt * 12) % 2 === 0) {
        const bgr = ctx.createRadialGradient(CX - 5, by - 6, 2, CX, by, 16);
        bgr.addColorStop(0, "#ffffff"); bgr.addColorStop(0.4, fever > 0 ? "#ffd27a" : "#5fd0ff"); bgr.addColorStop(1, fever > 0 ? "#ff7a3a" : "#0b5fb8");
        ctx.shadowColor = fever > 0 ? "#ffb35a" : "#7ff0ff"; ctx.shadowBlur = 20; ctx.fillStyle = bgr;
        ctx.beginPath(); ctx.ellipse(CX, by, 15, smashing ? 17 : 15, 0, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
      }
      if (flash > 0) { ctx.fillStyle = `rgba(255,80,140,${flash})`; ctx.fillRect(0, 0, W, H); }
      // level progress bar
      ctx.fillStyle = "rgba(4,14,36,.7)"; ctx.beginPath(); ctx.roundRect(70, 18, W - 140, 12, 6); ctx.fill();
      ctx.fillStyle = "#7ff0ff"; ctx.beginPath(); ctx.roundRect(70, 18, (W - 140) * (1 - left / TOWER_RINGS), 12, 6); ctx.fill();
      for (const [n, xx] of [[level, 58], [level + 1, W - 58]] as const) { ctx.fillStyle = "#1d7fd0"; ctx.strokeStyle = "#eafcff"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(xx, 24, 16, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#fff"; ctx.font = "bold 15px system-ui"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(String(n), xx, 25); }
      if (fever > 0) { ctx.fillStyle = "#ffd27a"; ctx.font = "bold 18px system-ui"; ctx.fillText("FROST FEVER!", CX, 62); }
      drawFlakes(ctx, flakes, dt, W, H, 20);

      if (lives <= 0) { sync(); setPhase("over"); return; }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { alive = false; cancelAnimationFrame(raf); window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); };
  }, [phase]);

  const reward = arcadeReward("tower", { score: hud.rings, gems: hud.cleared });
  return (
    <ArcadeFrame title="FROST TOWER" hint="Hold to smash down through the spinning ice rings. Let go before you hit a dark frozen stone! Smash 10 in a row for Frost Fever."
      phase={phase} pausedRef={paused} ratio={W / H} reward={reward}
      stats={[{ label: "LEVEL", value: hud.level }, { label: "LIVES", value: <Hearts n={hud.lives} /> }, { label: "RINGS", value: hud.rings }, { label: "LEFT", value: hud.left }]}
      summary={`${hud.rings} rings smashed · ${hud.cleared} towers cleared`} onStart={() => setPhase("playing")} onExit={onExit}>
      <canvas ref={cv} className="arcade-canvas touch-none select-none"
        onPointerDown={(e) => { hold.current = true; e.currentTarget.setPointerCapture(e.pointerId); }}
        onPointerUp={() => { hold.current = false; }} onPointerCancel={() => { hold.current = false; }} onContextMenu={(e) => e.preventDefault()} />
    </ArcadeFrame>
  );
}
