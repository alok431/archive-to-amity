import { useEffect, useRef, useState } from "react";
import { ArcadeFrame, drawFlakes, loadImages, makeFlakes, setupCanvas, type Phase } from "./ArcadeFrame";
import { arcadeReward, icicleStageTarget } from "@/lib/arcade-config";
import { sfx } from "@/lib/sfx";
import targetSrc from "@/assets/sp-target.webp";
import cubeSrc from "@/assets/ice-cube.webp";

const W = 360, H = 560, CX = W / 2, CY = 190, R = 86, LEN = 70, GAP = 0.2;
const norm = (a: number) => ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);

function icicle(ctx: CanvasRenderingContext2D, x: number, y: number, ang: number) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  const gr = ctx.createLinearGradient(-6, 0, 6, 0);
  gr.addColorStop(0, "#5ec8ff"); gr.addColorStop(0.5, "#f2fdff"); gr.addColorStop(1, "#3aa0e8");
  ctx.fillStyle = gr; ctx.shadowColor = "#00cfff"; ctx.shadowBlur = 10;
  ctx.beginPath(); ctx.moveTo(0, -LEN / 2); ctx.lineTo(7, LEN / 2 - 16); ctx.lineTo(4, LEN / 2); ctx.lineTo(-4, LEN / 2); ctx.lineTo(-7, LEN / 2 - 16); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#ffffff"; ctx.fillRect(-8, LEN / 2 - 6, 16, 6);
  ctx.restore();
}

export function IcicleThrow({ onExit }: { onExit: () => void }) {
  const cv = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<Phase>("ready");
  const paused = useRef(false);
  const [hud, setHud] = useState({ stage: 1, cleared: 0, gems: 0, left: icicleStageTarget(1) });
  const g = useRef({ throwReq: false });
  const fire = () => { if (phase === "playing") g.current.throwReq = true; };

  useEffect(() => {
    if (phase !== "playing") return;
    const ctx = setupCanvas(cv.current!, W, H);
    const flakes = makeFlakes(35, W, H);
    let stage = 1, cleared = 0, gems = 0, left = icicleStageTarget(1);
    let rot = 0, spin = 1.8, stuck: number[] = [], gemAngles: number[] = [], flying: number | null = null, flash = 0, dead = false, deadT = 0, shards: { x: number; y: number; vx: number; vy: number; l: number }[] = [];
    const newStage = () => {
      left = icicleStageTarget(stage); stuck = [];
      for (let i = 0; i < Math.min(3, stage); i++) stuck.push(Math.random() * Math.PI * 2);
      gemAngles = [Math.random() * Math.PI * 2, Math.random() * Math.PI * 2];
      spin = (1.6 + stage * 0.25) * (stage % 2 ? 1 : -1);
    };
    newStage();
    const sync = () => setHud({ stage, cleared, gems, left });
    sync();
    let raf = 0, last = performance.now(), alive = true, t = 0;
    const key = (e: KeyboardEvent) => { if (e.code === "Space") { e.preventDefault(); g.current.throwReq = true; } };
    window.addEventListener("keydown", key);
    loadImages({ target: targetSrc, gem: cubeSrc }).then((img) => {
      const frame = (now: number) => {
        if (!alive) return;
        if (paused.current) { last = now; raf = requestAnimationFrame(frame); return; }
        const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
        const boss = stage % 4 === 0;
        const wobble = boss ? Math.sin(t * 1.1) * 3.4 : stage > 2 ? Math.sin(t * 1.3) * 0.9 : 0;
        if (!dead) rot += (spin + wobble) * dt;
        if (g.current.throwReq && flying === null && !dead) { flying = H - 70; sfx.tap(); }
        g.current.throwReq = false;
        if (flying !== null) {
          flying -= 1400 * dt;
          if (flying <= CY + R + LEN / 2) {
            flying = null;
            const local = norm(Math.PI / 2 - rot);
            if (stuck.some((a) => Math.abs(Math.atan2(Math.sin(a - local), Math.cos(a - local))) < GAP)) {
              dead = true; sfx.crack();
              for (let i = 0; i < 14; i++) shards.push({ x: CX, y: CY + R + 20, vx: (Math.random() - 0.5) * 300, vy: -Math.random() * 300, l: 1 });
            } else {
              stuck.push(local); left--; flash = 0.12; sfx.mine();
              gemAngles = gemAngles.filter((a) => { const hit = Math.abs(Math.atan2(Math.sin(a - local), Math.cos(a - local))) < 0.28; if (hit) gems++; return !hit; });
              if (left <= 0) { cleared++; stage++; sfx.chime(); newStage(); }
            }
            sync();
          }
        }

        const bg = ctx.createRadialGradient(CX, CY, 20, CX, CY, 420);
        bg.addColorStop(0, "#1b5aa8"); bg.addColorStop(1, "#050f26");
        ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = "rgba(127,240,255,.18)"; ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(CX, CY, R + 30 + i * 26 + Math.sin(t * 2 + i) * 4, 0, 7); ctx.stroke(); }

        for (const a of gemAngles) { const ga = a + rot; ctx.drawImage(img.gem, CX + Math.cos(ga) * (R + 6) - 15, CY + Math.sin(ga) * (R + 6) - 15, 30, 30); }
        for (const a of stuck) { const ga = a + rot; icicle(ctx, CX + Math.cos(ga) * (R + LEN / 2 - 10), CY + Math.sin(ga) * (R + LEN / 2 - 10), ga - Math.PI / 2 + Math.PI); }
        ctx.save(); ctx.translate(CX, CY + (flash > 0 ? -4 : 0)); ctx.rotate(rot);
        ctx.shadowColor = "#7ff0ff"; ctx.shadowBlur = 26; ctx.drawImage(img.target, -R - 6, -R - 6, (R + 6) * 2, (R + 6) * 2); ctx.restore();
        flash = Math.max(0, flash - dt);

        if (flying !== null) icicle(ctx, CX, flying, 0);
        else if (!dead) icicle(ctx, CX, H - 70, 0);
        // Remaining icicles column
        for (let i = 0; i < left - 1 && i < 12; i++) { ctx.fillStyle = "rgba(200,240,255,.75)"; ctx.fillRect(14, H - 30 - i * 16, 22, 8); }

        for (const s of shards) { s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 600 * dt; s.l -= dt; ctx.fillStyle = `rgba(220,248,255,${Math.max(0, s.l)})`; ctx.fillRect(s.x, s.y, 6, 10); }
        drawFlakes(ctx, flakes, dt, W, H);
        if (dead) { deadT += dt; if (deadT > 0.9) { setPhase("over"); return; } }
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    });
    return () => { alive = false; cancelAnimationFrame(raf); window.removeEventListener("keydown", key); };
  }, [phase]);

  const reward = arcadeReward("icicle", { score: hud.cleared, gems: hud.gems });
  return (
    <ArcadeFrame title="ICICLE THROW" hint="Tap to launch icicles into the spinning Frost Core. Never hit another icicle! Every 4th stage a Frost Boss core swings back and forth."
      phase={phase} pausedRef={paused} ratio={W / H} reward={reward}
      stats={[{ label: "STAGE", value: hud.stage % 4 === 0 ? `${hud.stage} BOSS` : hud.stage }, { label: "ICICLES", value: hud.left }, { label: "CLEARED", value: hud.cleared }, { label: "CUBES", value: hud.gems }]}
      summary={`${hud.cleared} stages cleared · ${hud.gems} cubes shattered`} onStart={() => setPhase("playing")} onExit={onExit}>
      <canvas ref={cv} className="arcade-canvas" onPointerDown={fire} />
    </ArcadeFrame>
  );
}
