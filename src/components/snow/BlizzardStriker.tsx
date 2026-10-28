import { useEffect, useRef, useState } from "react";
import { ArcadeFrame, Hearts, drawFlakes, loadImages, makeFlakes, setupCanvas, type Phase } from "./ArcadeFrame";
import { ARCADE_LIVES, STRIKER_SECONDS, arcadeReward } from "@/lib/arcade-config";
import { sfx } from "@/lib/sfx";
import jetSrc from "@/assets/sp-jet.webp";
import rockSrc from "@/assets/sp-boulder.webp";
import cubeSrc from "@/assets/ice-cube.webp";
import enemySrc from "@/assets/sp-enemy.webp";
import bossSrc from "@/assets/sp-boss.webp";

const W = 360, H = 600, BOSS_AT = 45, BOSS_HP = 70, POWER_SECONDS = 10;
const GUNS = ["Blaster", "Twin", "Spread"] as const;

type Enemy = { x: number; y: number; px: number; py: number; t: number; hp: number; s: number; fire: number; rock?: boolean; rot: number; step: (e: Enemy, dt: number) => void; leave?: boolean };
type Bullet = { x: number; y: number; vx: number; vy: number };
type Drop = { x: number; y: number; kind: "gem" | "gun" | "shield" | "drone" };
type Bit = { x: number; y: number; vx: number; vy: number; l: number; c: string };
type Txt = { x: number; y: number; l: number; s: string };

export function BlizzardStriker({ onExit }: { onExit: () => void }) {
  const cv = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<Phase>("ready");
  const paused = useRef(false);
  const [hud, setHud] = useState({ score: 0, kills: 0, gems: 0, lives: ARCADE_LIVES, gun: 0, boss: BOSS_AT as number | "NOW" | "DOWN", time: STRIKER_SECONDS });
  const target = useRef({ x: W / 2, y: H - 80 });

  useEffect(() => {
    if (phase !== "playing") return;
    const ctx = setupCanvas(cv.current!, W, H);
    const flakes = makeFlakes(40, W, H);
    const stars = Array.from({ length: 70 }, () => ({ x: Math.random() * W, y: Math.random() * H, z: 0.3 + Math.random() }));
    let x = W / 2, y = H - 80, score = 0, kills = 0, gems = 0, lives = ARCADE_LIVES, time = STRIKER_SECONDS, t = 0;
    let hurt = 0, fireT = 0, waveT = 1, wave = 0, rockT = 3, gun = 0, gunT = 0, shield = 0, drone = 0, shake = 0, hudT = 0;
    let boss: { x: number; y: number; hp: number; t: number; a: number; b: number } | null = null, bossState: "wait" | "live" | "down" = "wait";
    target.current = { x, y };
    let foes: Enemy[] = [], shots: Bullet[] = [], hostile: Bullet[] = [], drops: Drop[] = [], bits: Bit[] = [], txts: Txt[] = [];
    let raf = 0, last = performance.now(), alive = true;
    const key = (e: KeyboardEvent) => { const k = e.key; if (k === "ArrowLeft") target.current.x -= 40; if (k === "ArrowRight") target.current.x += 40; if (k === "ArrowUp") target.current.y -= 40; if (k === "ArrowDown") target.current.y += 40; };
    window.addEventListener("keydown", key);

    const add = (step: Enemy["step"], x0: number, y0: number, delay = 0, hp = 1, s = 40) => foes.push({ x: x0, y: y0, px: x0, py: y0, t: -delay, hp, s, fire: 1 + Math.random() * 2, rot: 0, step });
    const aimAt = (e: Enemy, speed: number) => { const a = Math.atan2(y - e.y, x - e.x); hostile.push({ x: e.x, y: e.y + 12, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed }); };

    // Formations that fly like a real shooter: V-wing, snake, side swoops, divers and a box grid.
    const waves = [
      () => { const cx = 90 + Math.random() * (W - 180); for (let i = 0; i < 5; i++) { const off = i - 2, hold = 100 + Math.abs(off) * 30; add((e) => { e.x = cx + off * 44 + Math.sin(e.t * 1.4) * 22; e.y = e.t < 1.5 ? -40 + (hold + 40) * (e.t / 1.5) : e.t < 6 ? hold : hold + (e.t - 6) * 240; }, cx + off * 44, -40); } },
      () => { const dir = Math.random() < 0.5 ? 1 : -1; for (let i = 0; i < 7; i++) add((e) => { e.y = -30 + e.t * 115; e.x = W / 2 + dir * Math.sin(e.t * 2.3) * 130; }, W / 2, -30, i * 0.32); },
      () => { const side = Math.random() < 0.5 ? 0 : 1; for (let i = 0; i < 6; i++) add((e) => { const a = e.t * 1.05, R = 300, d = side ? -1 : 1; e.x = (side ? W + 30 : -30) + d * Math.sin(a) * R; e.y = 30 + (1 - Math.cos(a)) * R * 0.85; }, side ? W + 30 : -30, 30, i * 0.28); },
      () => { for (let i = 0; i < 3; i++) { const sx = 70 + i * 110; let tx = sx, vy = 0; add((e, dt) => { if (e.t < 1) { e.y = -40 + e.t * 170; e.x = sx; tx = x; } else if (e.t < 1.7) { e.x += Math.sin(e.t * 30) * 1.2; } else { vy += 620 * dt; e.y += vy * dt; e.x += (tx - e.x) * Math.min(1, dt * 2); } }, sx, -40, i * 0.5, 2, 44); } },
      () => { for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) add((e) => { const hx = 60 + c * 80 + Math.sin(t * 0.9) * 40, hy = 70 + r * 56; e.x = hx; e.y = e.t < 1.4 ? -60 + (hy + 60) * (e.t / 1.4) : e.t < 7 ? hy : hy + (e.t - 7) * 260; }, 60 + c * 80, -60, r * 0.2 + c * 0.1, 2); },
    ];
    const burst = (bx: number, by: number, n: number, c: string, sp = 260) => { for (let i = 0; i < n; i++) bits.push({ x: bx, y: by, vx: (Math.random() - 0.5) * sp, vy: (Math.random() - 0.5) * sp, l: 0.5 + Math.random() * 0.4, c }); };
    const hitPlayer = () => {
      if (hurt > 0) return;
      if (shield > 0) { shield = 0; hurt = 0.8; sfx.crack(); return; }
      lives--; hurt = 1.4; shake = 0.4; gun = Math.max(0, gun - 1); sfx.crack(); burst(x, y, 16, "#9feaff", 320);
    };
    const killFoe = (e: Enemy) => {
      kills++; const pts = e.rock ? 5 : 10 * (e.s > 42 ? 2 : 1); score += pts; txts.push({ x: e.x, y: e.y, l: 0.8, s: `+${pts}` }); sfx.mine();
      burst(e.x, e.y, 12, e.rock ? "#cfefff" : "#ff7ad9");
      const r = Math.random();
      if (r < 0.12) drops.push({ x: e.x, y: e.y, kind: "gem" });
      else if (r < 0.19) drops.push({ x: e.x, y: e.y, kind: "gun" });
      else if (r < 0.23) drops.push({ x: e.x, y: e.y, kind: "shield" });
      else if (r < 0.26) drops.push({ x: e.x, y: e.y, kind: "drone" });
    };

    loadImages({ jet: jetSrc, rock: rockSrc, gem: cubeSrc, foe: enemySrc, boss: bossSrc }).then((img) => {
      const frame = (now: number) => {
        if (!alive) return;
        if (paused.current) { last = now; raf = requestAnimationFrame(frame); return; }
        const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt; time -= dt;
        hurt = Math.max(0, hurt - dt); shield = Math.max(0, shield - dt); drone = Math.max(0, drone - dt); shake = Math.max(0, shake - dt);
        if (gun > 0) { gunT -= dt; if (gunT <= 0) gun = 0; }
        const tg = target.current; tg.x = Math.max(24, Math.min(W - 24, tg.x)); tg.y = Math.max(H * 0.45, Math.min(H - 40, tg.y));
        x += (tg.x - x) * Math.min(1, dt * 12); y += (tg.y - y) * Math.min(1, dt * 12);

        // Player guns
        fireT -= dt;
        if (fireT <= 0) {
          fireT = 0.17;
          if (gun === 0) shots.push({ x, y: y - 30, vx: 0, vy: -640 });
          if (gun === 1) shots.push({ x: x - 10, y: y - 26, vx: 0, vy: -660 }, { x: x + 10, y: y - 26, vx: 0, vy: -660 });
          if (gun === 2) for (const a of [-0.3, -0.15, 0, 0.15, 0.3]) shots.push({ x, y: y - 28, vx: Math.sin(a) * 640, vy: -Math.cos(a) * 640 });
          if (drone > 0) for (const d of [-34, 34]) shots.push({ x: x + d, y: y - 6, vx: 0, vy: -600 });
        }

        // Waves until the boss arrives, then escorts only
        if (bossState === "wait" && t >= BOSS_AT && foes.length === 0) { bossState = "live"; boss = { x: W / 2, y: -90, hp: BOSS_HP, t: 0, a: 1.2, b: 0.5 }; sfx.crack(); }
        waveT -= dt;
        if (waveT <= 0 && (bossState !== "live" || foes.length < 3) && !(bossState === "wait" && t > BOSS_AT - 3)) {
          if (bossState === "live") waves[3]!(); else waves[wave % waves.length]!();
          wave++; waveT = bossState === "live" ? 6 : Math.max(2.4, 4.2 - t / 40);
        }
        rockT -= dt;
        if (rockT <= 0 && bossState !== "live") { const s = 34 + Math.random() * 26, sx = 30 + Math.random() * (W - 60), v = 120 + Math.random() * 80, vr = (Math.random() - 0.5) * 2; foes.push({ x: sx, y: -40, px: sx, py: -40, t: 0, hp: s > 50 ? 3 : 2, s, fire: 99, rock: true, rot: 0, step: (e, d) => { e.y += v * d; e.rot += vr * d; } }); rockT = 2.5 + Math.random() * 2; }

        for (const e of foes) {
          e.px = e.x; e.py = e.y; e.t += dt; if (e.t < 0) continue;
          e.step(e, dt);
          if (!e.rock && e.y > 20 && e.y < H * 0.6) { e.fire -= dt; if (e.fire <= 0) { aimAt(e, 190 + t); e.fire = 1.8 + Math.random() * 2.2; } }
        }
        if (boss) {
          boss.t += dt;
          boss.y += ((boss.t < 2.5 ? 100 : 100 + Math.sin(boss.t * 0.8) * 22) - boss.y) * Math.min(1, dt * 1.5);
          boss.x = W / 2 + Math.sin(boss.t * 0.7) * 90;
          boss.a -= dt; boss.b -= dt;
          if (boss.a <= 0 && boss.t > 2) { const n = 12, off = boss.t; for (let i = 0; i < n; i++) { const a = off + (i / n) * Math.PI * 2; hostile.push({ x: boss.x, y: boss.y + 20, vx: Math.cos(a) * 150, vy: Math.sin(a) * 150 + 40 }); } boss.a = 1.8; }
          if (boss.b <= 0 && boss.t > 2) { for (const dx of [-60, 60]) { const a = Math.atan2(y - boss.y, x - (boss.x + dx)); for (const sp of [-0.12, 0, 0.12]) hostile.push({ x: boss.x + dx, y: boss.y + 30, vx: Math.cos(a + sp) * 230, vy: Math.sin(a + sp) * 230 }); } boss.b = 1.1; }
        }

        for (const s of shots) { s.x += s.vx * dt; s.y += s.vy * dt; }
        for (const b of hostile) { b.x += b.vx * dt; b.y += b.vy * dt; }
        for (const d of drops) d.y += 120 * dt;

        for (const s of shots) {
          if (s.y < -20) continue;
          for (const e of foes) if (e.t >= 0 && e.hp > 0 && Math.abs(s.x - e.x) < e.s / 2 && Math.abs(s.y - e.y) < e.s / 2) { s.y = -99; e.hp--; if (e.hp <= 0) killFoe(e); else burst(s.x, s.y, 2, "#ffffff", 120); break; }
          if (boss && s.y > -20 && Math.abs(s.x - boss.x) < 80 && Math.abs(s.y - boss.y) < 40) {
            s.y = -99; boss.hp--; burst(s.x, boss.y + 20, 2, "#c9a8ff", 140);
            if (boss.hp <= 0) { score += 500; kills += 15; txts.push({ x: boss.x, y: boss.y, l: 1.5, s: "+500" }); for (let i = 0; i < 5; i++) burst(boss.x + (Math.random() - 0.5) * 120, boss.y + (Math.random() - 0.5) * 50, 14, i % 2 ? "#c9a8ff" : "#9feaff", 380); for (let i = 0; i < 4; i++) drops.push({ x: boss.x - 60 + i * 40, y: boss.y, kind: "gem" }); shake = 0.6; sfx.chime(); boss = null; bossState = "down"; hostile = []; waveT = 2; }
          }
        }
        for (const e of foes) if (e.t >= 0 && e.hp > 0 && Math.hypot(e.x - x, e.y - y) < e.s / 2 + 16) { e.hp = 0; burst(e.x, e.y, 10, "#ff7ad9"); hitPlayer(); }
        hostile = hostile.filter((b) => { if (Math.hypot(b.x - x, b.y - y) < 14) { hitPlayer(); return false; } return b.y < H + 10 && b.y > -20 && b.x > -20 && b.x < W + 20; });
        drops = drops.filter((d) => {
          if (Math.hypot(d.x - x, d.y - y) < 34) {
            if (d.kind === "gem") { gems++; txts.push({ x: d.x, y: d.y, l: 0.8, s: "+cube" }); }
            if (d.kind === "gun") { gun = Math.min(2, gun + 1); gunT = POWER_SECONDS; txts.push({ x: d.x, y: d.y, l: 0.9, s: GUNS[gun]!.toUpperCase() }); }
            if (d.kind === "shield") shield = 8;
            if (d.kind === "drone") drone = 9;
            sfx.chime(); return false;
          }
          return d.y < H + 20;
        });
        foes = foes.filter((e) => e.hp > 0 && e.y < H + 60 && e.x > -120 && e.x < W + 120);
        shots = shots.filter((s) => s.y > -20 && s.x > -10 && s.x < W + 10);

        // --- draw ---
        ctx.save();
        if (shake > 0) ctx.translate((Math.random() - 0.5) * 14 * shake, (Math.random() - 0.5) * 14 * shake);
        const sky = ctx.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, "#020716"); sky.addColorStop(0.55, "#071a3e"); sky.addColorStop(1, "#0c2f5e");
        ctx.fillStyle = sky; ctx.fillRect(-10, -10, W + 20, H + 20);
        for (let i = 0; i < 3; i++) {
          ctx.fillStyle = ["rgba(60,255,200,.09)", "rgba(80,190,255,.09)", "rgba(170,120,255,.07)"][i]!;
          ctx.beginPath(); ctx.moveTo(0, 70 + i * 40);
          for (let xx = 0; xx <= W; xx += 20) ctx.lineTo(xx, 70 + i * 40 + Math.sin(xx / 50 + t * (0.6 + i * 0.2)) * 24);
          ctx.lineTo(W, 0); ctx.lineTo(0, 0); ctx.fill();
        }
        // frozen planet
        const pg = ctx.createRadialGradient(W - 70, 210, 6, W - 60, 220, 70);
        pg.addColorStop(0, "#d9f6ff"); pg.addColorStop(0.5, "#5ab4e6"); pg.addColorStop(1, "rgba(20,60,120,0)");
        ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(W - 60, 220 + ((t * 4) % (H + 200)) - 100, 54, 0, 7); ctx.fill();
        for (const s of stars) { s.y += s.z * 40 * dt; if (s.y > H) { s.y = 0; s.x = Math.random() * W; } ctx.fillStyle = `rgba(220,240,255,${0.3 + s.z * 0.5})`; ctx.fillRect(s.x, s.y, s.z * 1.6, s.z * 1.6); }

        for (const d of drops) {
          ctx.save(); ctx.translate(d.x, d.y); ctx.shadowColor = "#7ff0ff"; ctx.shadowBlur = 18;
          if (d.kind === "gem") ctx.drawImage(img.gem, -16, -16, 32, 32);
          else {
            const col = d.kind === "gun" ? "#a8ff6a" : d.kind === "shield" ? "#7ff0ff" : "#c9a8ff";
            ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.fillStyle = "rgba(6,20,50,.8)"; ctx.beginPath(); ctx.roundRect(-22, -14, 44, 28, 14); ctx.fill(); ctx.stroke();
            ctx.fillStyle = col; ctx.font = "bold 13px system-ui"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
            ctx.fillText(d.kind === "gun" ? `${Math.min(3, gun + 2)}x` : d.kind === "shield" ? "◈" : "✦✦", 0, 1);
          }
          ctx.restore();
        }
        for (const e of foes) {
          if (e.t < 0) continue;
          ctx.save(); ctx.translate(e.x, e.y);
          if (e.rock) { ctx.rotate(e.rot); ctx.drawImage(img.rock, -e.s / 2, -e.s / 2, e.s, e.s); }
          else { const vx = e.x - e.px, vy = e.y - e.py; if (Math.abs(vx) + Math.abs(vy) > 0.2) e.rot += (-Math.atan2(vx, Math.max(0.5, vy)) * 0.8 - e.rot) * 0.2; ctx.rotate(e.rot); ctx.shadowColor = "#ff5ccf"; ctx.shadowBlur = 12; ctx.drawImage(img.foe, -e.s / 2, -e.s / 2, e.s, e.s); }
          ctx.restore();
        }
        if (boss) {
          ctx.save(); ctx.shadowColor = "#a46bff"; ctx.shadowBlur = 30; ctx.drawImage(img.boss, boss.x - 95, boss.y - 64, 190, 128); ctx.restore();
          ctx.fillStyle = "rgba(4,12,30,.8)"; ctx.beginPath(); ctx.roundRect(40, 12, W - 80, 10, 5); ctx.fill();
          const bar = ctx.createLinearGradient(40, 0, W - 40, 0); bar.addColorStop(0, "#c9a8ff"); bar.addColorStop(1, "#7ff0ff");
          ctx.fillStyle = bar; ctx.beginPath(); ctx.roundRect(40, 12, (W - 80) * (boss.hp / BOSS_HP), 10, 5); ctx.fill();
          ctx.fillStyle = "#eafcff"; ctx.font = "bold 10px system-ui"; ctx.textAlign = "center"; ctx.fillText("FROST TITAN", W / 2, 36);
        }
        for (const b of hostile) { ctx.fillStyle = "#ff6fd1"; ctx.shadowColor = "#ff3fbf"; ctx.shadowBlur = 10; ctx.beginPath(); ctx.arc(b.x, b.y, 4, 0, 7); ctx.fill(); }
        ctx.shadowColor = "#7ff0ff"; ctx.shadowBlur = 12; ctx.fillStyle = "#eafcff";
        for (const s of shots) { ctx.beginPath(); ctx.roundRect(s.x - 2.5, s.y - 9, 5, 18, 3); ctx.fill(); }
        ctx.shadowBlur = 0;
        for (const b of bits) { b.x += b.vx * dt; b.y += b.vy * dt; b.l -= dt; ctx.globalAlpha = Math.max(0, b.l * 1.6); ctx.fillStyle = b.c; ctx.fillRect(b.x, b.y, 4, 4); }
        ctx.globalAlpha = 1; bits = bits.filter((b) => b.l > 0);

        if (hurt <= 0 || Math.floor(hurt * 12) % 2 === 0) {
          ctx.fillStyle = "rgba(0,207,255,.55)"; ctx.beginPath(); ctx.ellipse(x - 8, y + 32 + Math.random() * 5, 4, 11, 0, 0, 7); ctx.ellipse(x + 8, y + 32 + Math.random() * 5, 4, 11, 0, 0, 7); ctx.fill();
          ctx.shadowColor = "#00cfff"; ctx.shadowBlur = 18; ctx.drawImage(img.jet, x - 32, y - 32, 64, 64); ctx.shadowBlur = 0;
          if (drone > 0) for (const d of [-34, 34]) { ctx.fillStyle = "#c9e8ff"; ctx.shadowColor = "#7ff0ff"; ctx.shadowBlur = 12; ctx.beginPath(); ctx.moveTo(x + d, y - 14); ctx.lineTo(x + d + 8, y + 6); ctx.lineTo(x + d - 8, y + 6); ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0; }
        }
        if (shield > 0) { ctx.strokeStyle = `rgba(127,240,255,${0.45 + Math.sin(t * 10) * 0.25})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 40, 0, 7); ctx.stroke(); }
        ctx.font = "bold 15px system-ui"; ctx.textAlign = "center";
        for (const tx of txts) { tx.y -= 40 * dt; tx.l -= dt; ctx.fillStyle = `rgba(255,255,255,${Math.max(0, tx.l)})`; ctx.fillText(tx.s, tx.x, tx.y); }
        txts = txts.filter((tx) => tx.l > 0);
        drawFlakes(ctx, flakes, dt, W, H, 70);
        if (gun > 0 || drone > 0) { ctx.fillStyle = "rgba(6,20,50,.75)"; ctx.beginPath(); ctx.roundRect(10, H - 34, 70, 24, 12); ctx.fill(); ctx.fillStyle = "#bff6ff"; ctx.font = "bold 12px system-ui"; ctx.textAlign = "left"; ctx.fillText(`⚡ ${Math.ceil(Math.max(gun > 0 ? gunT : 0, drone))}s`, 20, H - 17); }
        ctx.restore();

        hudT -= dt;
        const bossV = bossState === "down" ? "DOWN" as const : bossState === "live" ? "NOW" as const : Math.max(0, Math.ceil(BOSS_AT - t));
        const done = lives <= 0 || time <= 0;
        if (hudT <= 0 || done) { hudT = 0.1; setHud({ score, kills, gems, lives: Math.max(0, lives), gun, boss: bossV, time: Math.max(0, time) }); }
        if (done) { setPhase("over"); return; }
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    });
    return () => { alive = false; cancelAnimationFrame(raf); window.removeEventListener("keydown", key); };
  }, [phase]);

  // Relative drag: the jet follows your finger's movement, not jumping under it.
  const drag = useRef<{ x: number; y: number } | null>(null);
  const scale = (el: HTMLElement) => W / el.getBoundingClientRect().width;
  const reward = arcadeReward("striker", { score: hud.kills, gems: hud.gems });
  return (
    <ArcadeFrame title="BLIZZARD STRIKER" hint="Drag anywhere to fly. Your jet fires automatically — grab 2x / 3x guns, shields and wing drones. Survive the waves and beat the Frost Titan!"
      phase={phase} pausedRef={paused} ratio={W / H} reward={reward}
      stats={[{ label: "SCORE", value: hud.score }, { label: "LIVES", value: <Hearts n={hud.lives} /> }, { label: "GUN", value: GUNS[hud.gun] }, { label: "BOSS IN", value: typeof hud.boss === "number" ? `${hud.boss}s` : hud.boss }]}
      summary={`${hud.score} points · ${hud.kills} kills · ${hud.gems} cubes`} onStart={() => setPhase("playing")} onExit={onExit}>
      <canvas ref={cv} className="arcade-canvas touch-none"
        onPointerDown={(e) => { drag.current = { x: e.clientX, y: e.clientY }; e.currentTarget.setPointerCapture(e.pointerId); }}
        onPointerMove={(e) => { if (!drag.current) return; const k = scale(e.currentTarget); target.current.x += (e.clientX - drag.current.x) * k * 1.3; target.current.y += (e.clientY - drag.current.y) * k * 1.3; drag.current = { x: e.clientX, y: e.clientY }; }}
        onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }} />
    </ArcadeFrame>
  );
}
