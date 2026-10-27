import { useEffect, useRef, useState } from "react";
import { ArcadeFrame, drawFlakes, loadImages, makeFlakes, setupCanvas, type Phase } from "./ArcadeFrame";
import { IceButton } from "./IceButton";
import { ARCADE_LIVES, DRIFT_SECONDS, arcadeReward } from "@/lib/arcade-config";
import { sfx } from "@/lib/sfx";
import sledSrc from "@/assets/sp-sled.webp";
import boulderSrc from "@/assets/sp-boulder.webp";
import cubeSrc from "@/assets/ice-cube.webp";

const W = 360, H = 560, LANES = 3, ROAD_X = 40, ROAD_W = W - 80, LANE_W = ROAD_W / LANES;
const laneX = (l: number) => ROAD_X + LANE_W * (l + 0.5);
type Thing = { lane: number; y: number; kind: "rock" | "gem"; size: number };

export function GlacierDrift({ onExit }: { onExit: () => void }) {
  const cv = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<Phase>("ready");
  const [hud, setHud] = useState({ dist: 0, gems: 0, lives: ARCADE_LIVES, time: DRIFT_SECONDS });
  const g = useRef({ lane: 1, x: laneX(1), things: [] as Thing[], spawn: 0, speed: 260, dist: 0, gems: 0, lives: ARCADE_LIVES, time: DRIFT_SECONDS, hurt: 0, scroll: 0 });
  const move = (d: number) => { const s = g.current; s.lane = Math.max(0, Math.min(LANES - 1, s.lane + d)); sfx.tap(); };

  useEffect(() => {
    if (phase !== "playing") return;
    g.current = { lane: 1, x: laneX(1), things: [], spawn: 0.6, speed: 260, dist: 0, gems: 0, lives: ARCADE_LIVES, time: DRIFT_SECONDS, hurt: 0, scroll: 0 };
    const ctx = setupCanvas(cv.current!, W, H);
    const flakes = makeFlakes(45, W, H);
    let raf = 0, last = performance.now(), alive = true, hudT = 0;
    const key = (e: KeyboardEvent) => { if (e.key === "ArrowLeft" || e.key === "a") move(-1); if (e.key === "ArrowRight" || e.key === "d") move(1); };
    window.addEventListener("keydown", key);
    loadImages({ sled: sledSrc, rock: boulderSrc, gem: cubeSrc }).then((img) => {
      const frame = (now: number) => {
        if (!alive) return;
        const dt = Math.min(0.05, (now - last) / 1000); last = now;
        const s = g.current;
        s.time -= dt; s.speed += dt * 9; s.dist += s.speed * dt / 10; s.scroll = (s.scroll + s.speed * dt) % 60;
        s.hurt = Math.max(0, s.hurt - dt);
        s.x += (laneX(s.lane) - s.x) * Math.min(1, dt * 14);
        s.spawn -= dt;
        if (s.spawn <= 0) {
          const lane = Math.floor(Math.random() * LANES);
          s.things.push({ lane, y: -60, kind: Math.random() < 0.28 ? "gem" : "rock", size: 64 + Math.random() * 14 });
          if (Math.random() < 0.3) s.things.push({ lane: (lane + 1 + Math.floor(Math.random() * 2)) % LANES, y: -150, kind: "rock", size: 66 });
          s.spawn = Math.max(0.42, 1.05 - s.speed / 900);
        }
        const py = H - 110;
        for (const t of s.things) t.y += s.speed * dt;
        s.things = s.things.filter((t) => {
          const hit = Math.abs(laneX(t.lane) - s.x) < LANE_W * 0.55 && Math.abs(t.y - py) < (t.size * 0.5 + 34);
          if (hit && t.kind === "gem") { s.gems++; sfx.mine(); return false; }
          if (hit && t.kind === "rock" && s.hurt <= 0) { s.lives--; s.hurt = 1.2; sfx.crack(); return false; }
          return t.y < H + 80;
        });

        // Glacier highway
        const sky = ctx.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, "#0b2a5c"); sky.addColorStop(1, "#06142e");
        ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#e8f6ff"; ctx.fillRect(0, 0, ROAD_X, H); ctx.fillRect(W - ROAD_X, 0, ROAD_X, H);
        ctx.fillStyle = "#b8dcf5";
        for (let y = -60 + s.scroll; y < H; y += 60) { ctx.beginPath(); ctx.arc(ROAD_X - 4, y, 12, 0, 7); ctx.arc(W - ROAD_X + 4, y + 30, 12, 0, 7); ctx.fill(); }
        const road = ctx.createLinearGradient(ROAD_X, 0, ROAD_X + ROAD_W, 0);
        road.addColorStop(0, "#5fc6f2"); road.addColorStop(0.5, "#a9e6ff"); road.addColorStop(1, "#5fc6f2");
        ctx.fillStyle = road; ctx.fillRect(ROAD_X, 0, ROAD_W, H);
        ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 1;
        for (let y = -60 + s.scroll * 1.5 % 120; y < H; y += 120) { ctx.beginPath(); ctx.moveTo(ROAD_X + 20, y); ctx.lineTo(ROAD_X + 70, y + 40); ctx.moveTo(W - 90, y + 60); ctx.lineTo(W - 50, y + 90); ctx.stroke(); }
        ctx.shadowColor = "#00cfff"; ctx.shadowBlur = 10; ctx.strokeStyle = "#e9fbff"; ctx.lineWidth = 4; ctx.setLineDash([26, 22]); ctx.lineDashOffset = -s.scroll * 2;
        for (let l = 1; l < LANES; l++) { ctx.beginPath(); ctx.moveTo(ROAD_X + LANE_W * l, 0); ctx.lineTo(ROAD_X + LANE_W * l, H); ctx.stroke(); }
        ctx.setLineDash([]); ctx.shadowBlur = 0;
        ctx.fillStyle = "#1d7fd0"; ctx.fillRect(ROAD_X - 3, 0, 4, H); ctx.fillRect(W - ROAD_X - 1, 0, 4, H);

        for (const t of s.things) {
          const im = t.kind === "gem" ? img.gem : img.rock, sz = t.kind === "gem" ? 44 : t.size;
          if (t.kind === "gem") { ctx.shadowColor = "#7ff0ff"; ctx.shadowBlur = 18; }
          ctx.drawImage(im, laneX(t.lane) - sz / 2, t.y - sz / 2, sz, sz);
          ctx.shadowBlur = 0;
        }
        // Snow trail + sled
        ctx.fillStyle = "rgba(255,255,255,.5)";
        for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(s.x + (Math.random() - 0.5) * 24, py + 50 + i * 8, 5 - i * 0.6, 0, 7); ctx.fill(); }
        if (s.hurt <= 0 || Math.floor(s.hurt * 12) % 2 === 0) {
          const tilt = (laneX(s.lane) - s.x) / 300;
          ctx.save(); ctx.translate(s.x, py); ctx.rotate(tilt);
          ctx.shadowColor = "#00cfff"; ctx.shadowBlur = 16;
          ctx.drawImage(img.sled, -30, -46, 60, 90); ctx.restore();
        }
        drawFlakes(ctx, flakes, dt, W, H, s.speed * 0.4);

        hudT -= dt;
        if (hudT <= 0) { hudT = 0.1; setHud({ dist: Math.floor(s.dist), gems: s.gems, lives: s.lives, time: Math.max(0, s.time) }); }
        if (s.lives <= 0 || s.time <= 0) { setHud({ dist: Math.floor(s.dist), gems: s.gems, lives: Math.max(0, s.lives), time: Math.max(0, s.time) }); setPhase("over"); return; }
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    });
    return () => { alive = false; cancelAnimationFrame(raf); window.removeEventListener("keydown", key); };
  }, [phase]);

  const touch = useRef(0);
  const reward = arcadeReward("drift", { score: hud.dist, gems: hud.gems });
  return (
    <ArcadeFrame title="GLACIER DRIFT" hint="Switch lanes to dodge ice boulders and grab glowing cubes. Survive 60 seconds!"
      phase={phase} score={`${hud.dist} m · ${hud.gems} cubes`} lives={hud.lives} time={hud.time} reward={reward}
      summary={`${hud.dist} m drifted · ${hud.gems} cubes grabbed`} onStart={() => setPhase("playing")} onExit={onExit}>
      <div className="w-full">
        <canvas ref={cv} className="arcade-canvas" style={{ aspectRatio: `${W}/${H}` }}
          onPointerDown={(e) => { touch.current = e.clientX; }}
          onPointerUp={(e) => { const dx = e.clientX - touch.current; if (Math.abs(dx) > 25) move(dx > 0 ? 1 : -1); else { const r = e.currentTarget.getBoundingClientRect(); move(e.clientX < r.left + r.width / 2 ? -1 : 1); } }} />
        <div className="mt-6 flex justify-between px-4">
          <IceButton glyph="left" aria-label="Steer left" className="ice-chunk-big" onClick={() => move(-1)} />
          <IceButton glyph="right" aria-label="Steer right" className="ice-chunk-big" onClick={() => move(1)} />
        </div>
      </div>
    </ArcadeFrame>
  );
}
