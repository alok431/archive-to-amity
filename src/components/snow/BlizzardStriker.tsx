import { useEffect, useRef, useState } from "react";
import { ArcadeFrame, Hearts, drawFlakes, loadImages, makeFlakes, setupCanvas, type Phase } from "./ArcadeFrame";
import { ARCADE_LIVES, STRIKER_BOSS_AT, STRIKER_SECONDS, arcadeReward } from "@/lib/arcade-config";
import { sfx } from "@/lib/sfx";
import jetSrc from "@/assets/sp-jet.webp";
import twinSrc from "@/assets/sp-jet-twin.webp";
import auroraSrc from "@/assets/sp-jet-aurora.webp";
import { STRIKER_GUNS as GUNS, STRIKER_BOSS_HP as BOSS_HP, STRIKER_BOSS_VOLLEY_SECONDS, STRIKER_BOSS_FAN_SECONDS, STRIKER_MAX_HOSTILE, STRIKER_UPGRADE_EVERY, strikerDifficulty, strikerEnemyVolley, strikerPlaneSize, strikerUpgrade, strikerWeapon, type StrikerEnemyKind } from "@/lib/striker-config";
import rockSrc from "@/assets/sp-boulder.webp";
import cubeSrc from "@/assets/ice-cube.webp";
import enemySrc from "@/assets/sp-enemy.webp";
import interceptorSrc from "@/assets/sp-interceptor.webp";
import bomberSrc from "@/assets/sp-bomber.webp";
import bossSrc from "@/assets/sp-boss.webp";

const W = 360, H = 600, BOSS_AT = STRIKER_BOSS_AT;

type Enemy = { kind?: StrikerEnemyKind; x: number; y: number; px: number; py: number; t: number; hp: number; s: number; fire: number; rock?: boolean; rot: number; step: (e: Enemy, dt: number) => void; leave?: boolean };
type Bullet = { x: number; y: number; vx: number; vy: number; delay?: number; kind?: StrikerEnemyKind };
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
    const canvas = cv.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    const theme = getComputedStyle(canvas);
    const palette = { ice: theme.getPropertyValue("--ice").trim(), cyan: theme.getPropertyValue("--cyan").trim(), gold: theme.getPropertyValue("--gold").trim(), danger: theme.getPropertyValue("--destructive").trim() };
    // Medium-width, velocity-aligned ice bolts with sharp tips and short wakes.
    const drawNeedle = (b: Bullet, width: number, length: number, color: string) => {
      ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(Math.atan2(b.vy, b.vx) + Math.PI / 2);
      const trail = ctx.createLinearGradient(0, -length / 2, 0, length * 1.6);
      trail.addColorStop(0, color); trail.addColorStop(1, "transparent");
      ctx.fillStyle = trail; ctx.beginPath(); ctx.moveTo(0, -length / 2); ctx.lineTo(width, length / 2); ctx.lineTo(0, length * 1.6); ctx.lineTo(-width, length / 2); ctx.closePath(); ctx.fill();
      ctx.shadowColor = color; ctx.shadowBlur = 3; ctx.fillStyle = palette.ice;
      ctx.beginPath(); ctx.moveTo(0, -length / 2); ctx.lineTo(width / 2, length / 4); ctx.lineTo(0, length / 2); ctx.lineTo(-width / 2, length / 4); ctx.closePath(); ctx.fill(); ctx.restore();
    };
    const flakes = makeFlakes(40, W, H);
    const stars = Array.from({ length: 70 }, () => ({ x: Math.random() * W, y: Math.random() * H, z: 0.3 + Math.random() }));
    let x = W / 2, y = H - 80, score = 0, kills = 0, gems = 0, lives = ARCADE_LIVES, time = STRIKER_SECONDS, t = 0;
    let hurt = 0, fireT = 0, waveT = 1, wave = 0, rockT = 5, gun = 0, shield = 0, drone = 0, shake = 0, hudT = 0, upgradeT = 12, evolution = 0;
    let boss: { x: number; y: number; hp: number; t: number; a: number; b: number } | null = null, bossState: "wait" | "live" | "down" = "wait";
    target.current = { x, y };
    let foes: Enemy[] = [], shots: Bullet[] = [], hostile: Bullet[] = [], drops: Drop[] = [], bits: Bit[] = [], txts: Txt[] = [];
    let raf = 0, last = performance.now(), alive = true;
    const key = (e: KeyboardEvent) => { const k = e.key; if (k === "ArrowLeft") target.current.x -= 40; if (k === "ArrowRight") target.current.x += 40; if (k === "ArrowUp") target.current.y -= 40; if (k === "ArrowDown") target.current.y += 40; };
    window.addEventListener("keydown", key);

    const add = (step: Enemy["step"], x0: number, y0: number, delay = 0, hp = 1, s = 40, kind: Enemy["kind"] = "fighter") => foes.push({ kind, x: x0, y: y0, px: x0, py: y0, t: -delay, hp: hp + strikerDifficulty(t).hpBonus, s, fire: 2 + Math.random() * 2, rot: 0, step });
    const enemyFire = (e: Enemy) => {
      const volley = strikerEnemyVolley(e.kind ?? "fighter");
      const speed = strikerDifficulty(t).bulletSpeed * volley.speedMultiplier;
      const angle = volley.aimed ? Math.atan2(y - e.y, x - e.x) : Math.PI / 2;
      if (hostile.length + volley.offsets.length <= STRIKER_MAX_HOSTILE) volley.offsets.forEach((offset, i) => hostile.push({ x: e.x + (volley.ports[i] ?? 0), y: e.y + e.s * 0.3, vx: Math.cos(angle + offset) * speed, vy: Math.sin(angle + offset) * speed, delay: volley.delays[i] ?? 0, kind: e.kind ?? "fighter" }));
      e.fire = (volley.cooldown + Math.random() * 0.8) / strikerDifficulty(t).fireRate;
    };

    // Formations that fly like a real shooter: V-wing, snake, side swoops, divers and a box grid.
    const waves = [
      () => { const cx = 90 + Math.random() * (W - 180); for (let i = 0; i < 5; i++) { const off = i - 2, hold = 100 + Math.abs(off) * 30; add((e) => { e.x = cx + off * 44 + Math.sin(e.t * 1.4) * 22; e.y = e.t < 1.5 ? -40 + (hold + 40) * (e.t / 1.5) : e.t < 6 ? hold : hold + (e.t - 6) * 240; }, cx + off * 44, -40); } },
      () => { const dir = Math.random() < 0.5 ? 1 : -1; for (let i = 0; i < 7; i++) add((e) => { e.y = -30 + e.t * 115; e.x = W / 2 + dir * Math.sin(e.t * 2.3) * 130; }, W / 2, -30, i * 0.32); },
      () => { const side = Math.random() < 0.5 ? 0 : 1; for (let i = 0; i < 6; i++) add((e) => { const a = e.t * 1.05, R = 300, d = side ? -1 : 1; e.x = (side ? W + 30 : -30) + d * Math.sin(a) * R; e.y = 30 + (1 - Math.cos(a)) * R * 0.85; }, side ? W + 30 : -30, 30, i * 0.28); },
      () => { for (let i = 0; i < 3; i++) { const sx = 70 + i * 110; let tx = sx, vy = 0; add((e, dt) => { if (e.t < 1) { e.y = -40 + e.t * 170; e.x = sx; tx = x; } else if (e.t < 1.7) { e.x += Math.sin(e.t * 30) * 1.2; } else { vy += 620 * dt; e.y += vy * dt; e.x += (tx - e.x) * Math.min(1, dt * 2); } }, sx, -40, i * 0.5, 2, 44); } },
      () => { for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) add((e) => { const hx = 60 + c * 80 + Math.sin(t * 0.9) * 40, hy = 70 + r * 56; e.x = hx; e.y = e.t < 1.4 ? -60 + (hy + 60) * (e.t / 1.4) : e.t < 7 ? hy : hy + (e.t - 7) * 260; }, 60 + c * 80, -60, r * 0.2 + c * 0.1, 2); },
      // Heavy ice tank: slow, readable three-shot fans.
      () => { const cx = 80 + Math.random() * (W - 160); add((e) => { e.x = cx + Math.sin(e.t * 0.8) * 60; e.y = e.t < 2 ? -50 + e.t * 75 : e.t < 10 ? 100 : 100 + (e.t - 10) * 120; }, cx, -50, 0, 4, 70, "tank"); },
      // Snipers: slide in from both sides and fire fast aimed shots
      () => { for (const side of [0, 1]) add((e) => { const hx = side ? W - 40 : 40; e.x = side ? W + 40 - Math.min(80, e.t * 90) : -40 + Math.min(80, e.t * 90); e.y = 160 + Math.sin(e.t * 1.6) * 70; if (e.t > 7) e.x += (side ? 1 : -1) * (e.t - 7) * 160; void hx; }, side ? W + 40 : -40, 160, side * 0.4, 2, 38, "sniper"); },
      () => { for (let i = 0; i < 2; i++) { const sx = 95 + i * 170; add((e) => { e.x = sx + Math.sin(e.t * 1.2) * 36; e.y = e.t < 2 ? -40 + e.t * 75 : e.t < 8 ? 110 : 110 + (e.t - 8) * 100; }, sx, -40, i * 0.7, 2, 48, "twin"); } },
      // Fast curved interceptors cross in staggered pairs; shots travel downward.
      () => { const side = wave % 2 ? 1 : -1; for (let i = 0; i < 3; i++) add((e) => { e.y = -45 + e.t * 100; e.x = W / 2 + side * Math.sin(e.t * 1.5 + i * 0.5) * 125; }, W / 2, -45, i * 0.65, 1, 44, "interceptor"); },
      // One broad bomber hovers, releases slow fans, then drifts offscreen.
      () => { add((e) => { e.x = W / 2 + Math.sin(e.t * 0.65) * 95; e.y = e.t < 2 ? -60 + e.t * 80 : e.t < 8 ? 100 : 100 + (e.t - 8) * 105; }, W / 2, -60, 0, 4, 76, "bomber"); },
    ];
    const burst = (bx: number, by: number, n: number, c: string, sp = 260) => { for (let i = 0; i < n; i++) bits.push({ x: bx, y: by, vx: (Math.random() - 0.5) * sp, vy: (Math.random() - 0.5) * sp, l: 0.5 + Math.random() * 0.4, c }); };
    const hitPlayer = () => {
      if (hurt > 0) return;
      if (shield > 0) { shield = 0; hurt = 0.8; sfx.crack(); return; }
      lives--; hurt = 2.4; shake = 0.4; sfx.crack(); burst(x, y, 16, "#9feaff", 320);
    };
    const killFoe = (e: Enemy) => {
      kills++; const pts = e.rock ? 5 : e.kind === "tank" ? 60 : e.kind === "sniper" ? 30 : 10 * (e.s > 42 ? 2 : 1); score += pts; txts.push({ x: e.x, y: e.y, l: 0.8, s: `+${pts}` }); sfx.mine();
      burst(e.x, e.y, 12, e.rock ? "#cfefff" : "#ff7ad9");
      const r = Math.random();
      if (r < 0.12) drops.push({ x: e.x, y: e.y, kind: "gem" });
      else if (r < 0.20) drops.push({ x: e.x, y: e.y, kind: "gun" });
      else if (r < 0.25) drops.push({ x: e.x, y: e.y, kind: "shield" });
      else if (r < 0.29) drops.push({ x: e.x, y: e.y, kind: "drone" });
    };

    loadImages({ jet: jetSrc, twin: twinSrc, aurora: auroraSrc, rock: rockSrc, gem: cubeSrc, foe: enemySrc, interceptor: interceptorSrc, bomber: bomberSrc, boss: bossSrc }).then((img) => {
      const frame = (now: number) => {
        if (!alive) return;
        if (paused.current) { last = now; raf = requestAnimationFrame(frame); return; }
        const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt; time -= dt;
        hurt = Math.max(0, hurt - dt); shield = Math.max(0, shield - dt); drone = Math.max(0, drone - dt); shake = Math.max(0, shake - dt);
        evolution = Math.max(0, evolution - dt);
        upgradeT -= dt;
        if (upgradeT <= 0) { if (gun < 2) drops.push({ x: Math.max(30, Math.min(W - 30, x)), y: y - 140, kind: "gun" }); upgradeT = STRIKER_UPGRADE_EVERY; }
        const tg = target.current; tg.x = Math.max(24, Math.min(W - 24, tg.x)); tg.y = Math.max(H * 0.45, Math.min(H - 40, tg.y));
        x += (tg.x - x) * Math.min(1, dt * 12); y += (tg.y - y) * Math.min(1, dt * 12);

        // Player guns
        fireT -= dt;
        if (fireT <= 0) {
          const weapon = strikerWeapon(gun); fireT = weapon.cooldown;
          sfx.shoot(gun);
          weapon.offsets.forEach((a, i) => shots.push({ x: x + (gun === 1 ? (i === 0 ? -15 : 15) : 0), y: y - strikerPlaneSize(gun) * 0.4, vx: Math.sin(a) * 660, vy: -Math.cos(a) * 660 }));
          if (drone > 0) for (const d of [-34, 34]) shots.push({ x: x + d, y: y - 6, vx: 0, vy: -600 });
        }

        // Waves until the boss arrives, then escorts only
        if (bossState === "wait" && t >= BOSS_AT && foes.length === 0) { bossState = "live"; hostile = []; drops.push({ x, y: y - 100, kind: "shield" }); boss = { x: W / 2, y: -90, hp: BOSS_HP, t: 0, a: 4.5, b: 3 }; sfx.crack(); }
        waveT -= dt;
        if (waveT <= 0 && bossState !== "live" && foes.length < 9 && !(bossState === "wait" && t > BOSS_AT - 8)) {
          const pool = t < 20 ? 3 : t < 45 ? 5 : waves.length;
          const nextWave = waves[wave % pool];
          nextWave?.();
          wave++; waveT = strikerDifficulty(t).waveSeconds;
        }
        rockT -= dt;
        if (rockT <= 0 && bossState !== "live" && !(bossState === "wait" && t > BOSS_AT - 8)) { const s = 34 + Math.random() * 26, sx = 30 + Math.random() * (W - 60), v = 90 + Math.random() * 55, vr = (Math.random() - 0.5) * 2; foes.push({ x: sx, y: -40, px: sx, py: -40, t: 0, hp: s > 50 ? 3 : 2, s, fire: 99, rock: true, rot: 0, step: (e, d) => { e.y += v * d; e.rot += vr * d; } }); rockT = 5 + Math.random() * 2; }

        for (const e of foes) {
          e.px = e.x; e.py = e.y; const moveDt = e.rock ? dt : dt * strikerDifficulty(t).movementSpeed; e.t += moveDt; if (e.t < 0) continue;
          e.step(e, moveDt);
          if (!e.rock && e.x > 12 && e.x < W - 12 && e.y > 20 && e.y < H * 0.6) { e.fire -= dt; if (e.fire <= 0) enemyFire(e); }
        }
        if (boss) {
          boss.t += dt;
          boss.y += ((boss.t < 2.5 ? 100 : 100 + Math.sin(boss.t * 0.8) * 22) - boss.y) * Math.min(1, dt * 1.5);
          boss.x = W / 2 + Math.sin(boss.t * 0.7) * 90;
          boss.a -= dt; boss.b -= dt;
          const pressure = strikerDifficulty(t);
          if (boss.a <= 0 && boss.t > 3) { const speed = pressure.bulletSpeed * 0.75; if (hostile.length + 5 <= STRIKER_MAX_HOSTILE) for (const a of [-0.6, -0.3, 0, 0.3, 0.6]) hostile.push({ x: boss.x, y: boss.y + 20, vx: Math.sin(a) * speed, vy: Math.cos(a) * speed }); boss.a = STRIKER_BOSS_FAN_SECONDS / pressure.fireRate; }
          if (boss.b <= 0 && boss.t > 3) { const a = Math.atan2(y - boss.y, x - boss.x), speed = pressure.bulletSpeed * 0.9; if (hostile.length + 3 <= STRIKER_MAX_HOSTILE) for (const sp of [-0.2, 0, 0.2]) hostile.push({ x: boss.x, y: boss.y + 30, vx: Math.cos(a + sp) * speed, vy: Math.sin(a + sp) * speed }); boss.b = STRIKER_BOSS_VOLLEY_SECONDS / pressure.fireRate; }
        }

        for (const s of shots) { s.x += s.vx * dt; s.y += s.vy * dt; }
        for (const b of hostile) { if ((b.delay ?? 0) > 0) { b.delay = Math.max(0, (b.delay ?? 0) - dt); continue; } b.x += b.vx * dt; b.y += b.vy * dt; }
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
        hostile = hostile.filter((b) => { if ((b.delay ?? 0) > 0) return true; if (Math.hypot(b.x - x, b.y - y) < 14) { hitPlayer(); return false; } return b.y < H + 10 && b.y > -20 && b.x > -20 && b.x < W + 20; });
        drops = drops.filter((d) => {
          if (Math.hypot(d.x - x, d.y - y) < 42) {
            if (d.kind === "gem") { gems++; txts.push({ x: d.x, y: d.y, l: 0.8, s: "+cube" }); }
            if (d.kind === "gun") { const previous = gun; gun = strikerUpgrade(gun); if (gun === previous) drone = 8; else evolution = 0.9; txts.push({ x: d.x, y: d.y, l: 1.5, s: gun === previous ? "WING SUPPORT" : `${GUNS[gun]} EVOLUTION`.toUpperCase() }); burst(x, y, 20, "#7ff0ff"); }
            if (d.kind === "shield") shield = 7;
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
          ctx.fillStyle = ["rgba(60,255,200,.09)", "rgba(80,190,255,.09)", "rgba(170,120,255,.07)"][i] ?? "rgba(60,255,200,.09)";
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
            ctx.fillText(d.kind === "gun" ? (gun >= 2 ? "MAX" : `${gun + 2}x`) : d.kind === "shield" ? "◈" : "✦✦", 0, 1);
          }
          ctx.restore();
        }
        for (const e of foes) {
          if (e.t < 0) continue;
          ctx.save(); ctx.translate(e.x, e.y);
          if (e.rock) { ctx.rotate(e.rot); ctx.drawImage(img.rock, -e.s / 2, -e.s / 2, e.s, e.s); }
          else {
            const vx = e.x - e.px, vy = e.y - e.py;
            if (Math.abs(vx) + Math.abs(vy) > 0.2) e.rot += (Math.max(-0.5, Math.min(0.5, -Math.atan2(vx, Math.max(0.5, vy)) * 0.5)) - e.rot) * 0.2;
            ctx.rotate(e.rot);
            const heavy = e.kind === "tank" || e.kind === "bomber";
            const color = heavy ? palette.gold : e.kind === "sniper" ? palette.danger : palette.cyan;
            ctx.shadowColor = color; ctx.shadowBlur = 8;
            const sprite = heavy ? img.bomber : e.kind === "interceptor" || e.kind === "sniper" ? img.interceptor : img.foe;
            if (e.kind === "sniper") ctx.scale(0.72, 1.12);
            ctx.drawImage(sprite, -e.s / 2, -e.s / 2, e.s, e.s);
            ctx.shadowBlur = 0;
            if (e.fire < 0.55 && e.y > 20 && e.y < H * 0.6) {
              ctx.globalAlpha = 0.45 + Math.sin(t * 28) * 0.25;
              ctx.strokeStyle = color; ctx.lineWidth = 1;
              ctx.beginPath(); ctx.arc(0, e.s * 0.3, 4 + (0.55 - e.fire) * 7, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
            }
            if (e.kind === "twin") { ctx.fillStyle = palette.ice; for (const dx of [-13, 13]) ctx.fillRect(dx - 1.5, e.s * 0.15, 3, 10); }
          }
          ctx.restore();
        }
        if (boss) {
          ctx.save(); ctx.shadowColor = "#a46bff"; ctx.shadowBlur = 30; ctx.drawImage(img.boss, boss.x - 95, boss.y - 64, 190, 128); ctx.restore();
          ctx.fillStyle = "rgba(4,12,30,.8)"; ctx.beginPath(); ctx.roundRect(40, 12, W - 80, 10, 5); ctx.fill();
          const bar = ctx.createLinearGradient(40, 0, W - 40, 0); bar.addColorStop(0, "#c9a8ff"); bar.addColorStop(1, "#7ff0ff");
          ctx.fillStyle = bar; ctx.beginPath(); ctx.roundRect(40, 12, (W - 80) * (boss.hp / BOSS_HP), 10, 5); ctx.fill();
          ctx.fillStyle = "#eafcff"; ctx.font = "bold 10px system-ui"; ctx.textAlign = "center"; ctx.fillText("FROST TITAN", W / 2, 36);
        }
        for (const b of hostile) if ((b.delay ?? 0) <= 0) drawNeedle(b, 2.8, b.kind === "sniper" ? 13 : 10, b.kind === "bomber" || b.kind === "tank" ? palette.gold : palette.danger);
        const shotWidth = strikerWeapon(gun).width;
        for (const s of shots) drawNeedle(s, shotWidth / 2, 12, gun === 2 ? palette.gold : gun === 1 ? palette.cyan : palette.ice);
        ctx.shadowBlur = 0;
        for (const b of bits) { b.x += b.vx * dt; b.y += b.vy * dt; b.l -= dt; ctx.globalAlpha = Math.max(0, b.l * 1.6); ctx.fillStyle = b.c; ctx.fillRect(b.x, b.y, 4, 4); }
        ctx.globalAlpha = 1; bits = bits.filter((b) => b.l > 0);

        if (hurt <= 0 || Math.floor(hurt * 12) % 2 === 0) {
          ctx.fillStyle = "rgba(0,207,255,.55)"; ctx.beginPath(); ctx.ellipse(x - 8, y + 32 + Math.random() * 5, 4, 11, 0, 0, 7); ctx.ellipse(x + 8, y + 32 + Math.random() * 5, 4, 11, 0, 0, 7); ctx.fill();
          const size = strikerPlaneSize(gun), plane = gun === 2 ? img.aurora : gun === 1 ? img.twin : img.jet;
          ctx.shadowColor = gun === 2 ? "#fff1ac" : "#00cfff"; ctx.shadowBlur = 18; ctx.drawImage(plane, x - size / 2, y - size / 2, size, size); ctx.shadowBlur = 0;
          if (evolution > 0) { ctx.save(); ctx.globalAlpha = evolution / 0.9; ctx.strokeStyle = palette.ice; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, size / 2 + (0.9 - evolution) * 50, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
          if (drone > 0) for (const d of [-34, 34]) { ctx.fillStyle = "#c9e8ff"; ctx.shadowColor = "#7ff0ff"; ctx.shadowBlur = 12; ctx.beginPath(); ctx.moveTo(x + d, y - 14); ctx.lineTo(x + d + 8, y + 6); ctx.lineTo(x + d - 8, y + 6); ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0; }
        }
        if (shield > 0) { ctx.strokeStyle = `rgba(127,240,255,${0.45 + Math.sin(t * 10) * 0.25})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, strikerPlaneSize(gun) / 2 + 8, 0, 7); ctx.stroke(); }
        ctx.font = "bold 15px system-ui"; ctx.textAlign = "center";
        for (const tx of txts) { tx.y -= 40 * dt; tx.l -= dt; ctx.fillStyle = `rgba(255,255,255,${Math.max(0, tx.l)})`; ctx.fillText(tx.s, tx.x, tx.y); }
        txts = txts.filter((tx) => tx.l > 0);
        drawFlakes(ctx, flakes, dt, W, H, 70);
        ctx.fillStyle = "rgba(6,20,50,.75)"; ctx.beginPath(); ctx.roundRect(10, H - 34, 110, 24, 6); ctx.fill(); ctx.fillStyle = "#bff6ff"; ctx.font = "bold 12px system-ui"; ctx.textAlign = "left"; ctx.fillText(`${Math.ceil(time)}s · ${GUNS[gun]}`, 20, H - 17);
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
    <ArcadeFrame title="BLIZZARD STRIKER" hint="200s · Frostwing → Twinwing → Aurora · Frost Titan at 100s"
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
