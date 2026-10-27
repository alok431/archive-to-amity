import { useEffect, useRef, useState } from "react";
import { ArcadeFrame, drawFlakes, loadImages, makeFlakes, setupCanvas, type Phase } from "./ArcadeFrame";
import { ARCADE_LIVES, STRIKER_SECONDS, arcadeReward } from "@/lib/arcade-config";
import { sfx } from "@/lib/sfx";
import jetSrc from "@/assets/sp-jet.webp";
import rockSrc from "@/assets/sp-boulder.webp";
import cubeSrc from "@/assets/ice-cube.webp";

const W = 360, H = 560;
type Rock = { x: number; y: number; s: number; v: number; hp: number; rot: number; vr: number };

export function BlizzardStriker({ onExit }: { onExit: () => void }) {
  const cv = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<Phase>("ready");
  const [hud, setHud] = useState({ kills: 0, gems: 0, lives: ARCADE_LIVES, time: STRIKER_SECONDS });
  const target = useRef(W / 2);

  useEffect(() => {
    if (phase !== "playing") return;
    const ctx = setupCanvas(cv.current!, W, H);
    const flakes = makeFlakes(60, W, H);
    let x = W / 2, kills = 0, gems = 0, lives = ARCADE_LIVES, time = STRIKER_SECONDS, hurt = 0, fireT = 0, spawnT = 0.5, t = 0, hudT = 0;
    target.current = W / 2;
    let rocks: Rock[] = [], shots: { x: number; y: number }[] = [], drops: { x: number; y: number }[] = [], bits: { x: number; y: number; vx: number; vy: number; l: number }[] = [];
    let raf = 0, last = performance.now(), alive = true;
    const key = (e: KeyboardEvent) => { if (e.key === "ArrowLeft") target.current -= 40; if (e.key === "ArrowRight") target.current += 40; };
    window.addEventListener("keydown", key);
    loadImages({ jet: jetSrc, rock: rockSrc, gem: cubeSrc }).then((img) => {
      const frame = (now: number) => {
        if (!alive) return;
        const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt; time -= dt; hurt = Math.max(0, hurt - dt);
        target.current = Math.max(28, Math.min(W - 28, target.current));
        x += (target.current - x) * Math.min(1, dt * 12);
        const py = H - 70;
        fireT -= dt;
        if (fireT <= 0) { shots.push({ x: x - 11, y: py - 30 }, { x: x + 11, y: py - 30 }); fireT = 0.2; }
        spawnT -= dt;
        if (spawnT <= 0) { const s = 34 + Math.random() * 30; rocks.push({ x: 24 + Math.random() * (W - 48), y: -40, s, v: 90 + Math.random() * 70 + t * 1.6, hp: s > 52 ? 3 : s > 42 ? 2 : 1, rot: 0, vr: (Math.random() - 0.5) * 2 }); spawnT = Math.max(0.32, 0.9 - t / 160); }
        for (const s of shots) s.y -= 620 * dt;
        for (const r of rocks) { r.y += r.v * dt; r.rot += r.vr * dt; }
        for (const d of drops) d.y += 140 * dt;
        for (const s of shots) for (const r of rocks) if (r.hp > 0 && s.y > -10 && Math.hypot(s.x - r.x, s.y - r.y) < r.s / 2) {
          s.y = -99; r.hp--;
          if (r.hp <= 0) { kills++; sfx.mine(); for (let i = 0; i < 8; i++) bits.push({ x: r.x, y: r.y, vx: (Math.random() - 0.5) * 260, vy: (Math.random() - 0.5) * 260, l: 0.6 }); if (Math.random() < 0.16) drops.push({ x: r.x, y: r.y }); }
        }
        for (const r of rocks) if (r.hp > 0 && hurt <= 0 && Math.hypot(r.x - x, r.y - py) < r.s / 2 + 20) { r.hp = 0; lives--; hurt = 1.3; sfx.crack(); }
        drops = drops.filter((d) => { if (Math.hypot(d.x - x, d.y - py) < 34) { gems++; sfx.chime(); return false; } return d.y < H + 20; });
        rocks = rocks.filter((r) => r.hp > 0 && r.y < H + 50);
        shots = shots.filter((s) => s.y > -10);

        const sky = ctx.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, "#030a1f"); sky.addColorStop(0.6, "#0a2350"); sky.addColorStop(1, "#0f3a73");
        ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
        for (let i = 0; i < 3; i++) {
          ctx.fillStyle = ["rgba(60,255,200,.10)", "rgba(80,190,255,.10)", "rgba(170,120,255,.08)"][i];
          ctx.beginPath(); ctx.moveTo(0, 80 + i * 40);
          for (let xx = 0; xx <= W; xx += 20) ctx.lineTo(xx, 80 + i * 40 + Math.sin(xx / 50 + t * (0.6 + i * 0.2)) * 26);
          ctx.lineTo(W, 0); ctx.lineTo(0, 0); ctx.fill();
        }
        ctx.fillStyle = "#cfefff"; ctx.beginPath(); ctx.moveTo(0, H); for (let xx = 0; xx <= W; xx += 40) ctx.lineTo(xx, H - 18 - ((xx * 7) % 22)); ctx.lineTo(W, H); ctx.fill();

        ctx.shadowColor = "#7ff0ff"; ctx.shadowBlur = 12; ctx.fillStyle = "#eafcff";
        for (const s of shots) { ctx.beginPath(); ctx.moveTo(s.x, s.y - 10); ctx.lineTo(s.x + 3, s.y + 6); ctx.lineTo(s.x - 3, s.y + 6); ctx.fill(); }
        ctx.shadowBlur = 0;
        for (const r of rocks) { ctx.save(); ctx.translate(r.x, r.y); ctx.rotate(r.rot); ctx.drawImage(img.rock, -r.s / 2, -r.s / 2, r.s, r.s); ctx.restore(); }
        for (const d of drops) { ctx.shadowColor = "#7ff0ff"; ctx.shadowBlur = 18; ctx.drawImage(img.gem, d.x - 16, d.y - 16, 32, 32); ctx.shadowBlur = 0; }
        for (const b of bits) { b.x += b.vx * dt; b.y += b.vy * dt; b.l -= dt; ctx.fillStyle = `rgba(190,240,255,${Math.max(0, b.l * 1.6)})`; ctx.fillRect(b.x, b.y, 5, 5); }
        bits = bits.filter((b) => b.l > 0);
        if (hurt <= 0 || Math.floor(hurt * 12) % 2 === 0) {
          ctx.fillStyle = "rgba(0,207,255,.5)"; ctx.beginPath(); ctx.ellipse(x - 9, py + 34 + Math.random() * 4, 4, 10, 0, 0, 7); ctx.ellipse(x + 9, py + 34 + Math.random() * 4, 4, 10, 0, 0, 7); ctx.fill();
          ctx.shadowColor = "#00cfff"; ctx.shadowBlur = 18; ctx.drawImage(img.jet, x - 34, py - 34, 68, 68); ctx.shadowBlur = 0;
        }
        drawFlakes(ctx, flakes, dt, W, H, 60);

        hudT -= dt;
        if (hudT <= 0) { hudT = 0.1; setHud({ kills, gems, lives, time: Math.max(0, time) }); }
        if (lives <= 0 || time <= 0) { setHud({ kills, gems, lives: Math.max(0, lives), time: Math.max(0, time) }); setPhase("over"); return; }
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    });
    return () => { alive = false; cancelAnimationFrame(raf); window.removeEventListener("keydown", key); };
  }, [phase]);

  const steer = (e: React.PointerEvent<HTMLCanvasElement>) => { const r = e.currentTarget.getBoundingClientRect(); target.current = ((e.clientX - r.left) / r.width) * W; };
  const reward = arcadeReward("striker", { score: hud.kills, gems: hud.gems });
  return (
    <ArcadeFrame title="BLIZZARD STRIKER" hint="Drag to fly your crystal jet. It fires icicle shards automatically — shatter the meteors!"
      phase={phase} score={`${hud.kills} shattered`} lives={hud.lives} time={hud.time} reward={reward}
      summary={`${hud.kills} meteors shattered · ${hud.gems} cubes caught`} onStart={() => setPhase("playing")} onExit={onExit}>
      <canvas ref={cv} className="arcade-canvas touch-none" style={{ aspectRatio: `${W}/${H}` }} onPointerDown={steer} onPointerMove={(e) => { if (e.buttons || e.pointerType !== "mouse") steer(e); }} />
    </ArcadeFrame>
  );
}
