import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Flame } from "lucide-react";
import { STREAK_REWARDS, canClaimStreak, claimStreak, currentStreak, dayKey } from "@/lib/game-logic";
import { celebrate, updateGame, useGame, useTicker } from "@/lib/game-store";
import { sfx } from "@/lib/sfx";
import icEarn from "@/assets/ic-earn.webp";
import icWallet from "@/assets/ic-wallet.webp";
import icInvite from "@/assets/ic-invite.webp";
import crystal from "@/assets/crystal.webp";
import iceTex from "@/assets/ice-tex.webp";
import chest from "@/assets/chest.webp";
import tools from "@/assets/tools.webp";
import wheel from "@/assets/wheel.webp";
import village from "@/assets/village.webp";
import lantern from "@/assets/lantern.webp";
import iceCube from "@/assets/ice-cube.webp";
import { Button } from "@/components/ui/button";
import { CommunityCards } from "@/components/snow/CommunityCards";
import { LuckySpin } from "@/components/snow/LuckySpin";

export const Route = createFileRoute("/")({
  head: () => ({
    links: [{ rel: "preload", as: "image", href: iceCube, fetchPriority: "high" }],
    meta: [
      { title: "SnowQuest — Frozen Kingdom" },
      { name: "description", content: "Your SnowQuest balance, daily streak, lucky spin and winter events." },
      { property: "og:title", content: "SnowQuest — Frozen Kingdom" },
      { property: "og:description", content: "Your balance, daily streak, lucky spin and winter events." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const game = useGame();
  const balance = useTicker(game.balance);
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => setToday(dayKey(new Date())), []);
  const streakNow = today ? currentStreak(game, today) : 0;
  const claimable = today ? canClaimStreak(game, today) : false;
  const claimToday = (el: Element) => {
    if (!today) return;
    let reward = 0;
    updateGame((s) => { const r = claimStreak(s, today); reward = r.reward; return r.state; });
    if (reward) { sfx.crack(); sfx.chime(); celebrate(reward, el); }
  };
  return (
    <>
      {/* Balance */}
      <section className="ice-panel balance-panel relative">
        <img src={iceTex} alt="" className="absolute inset-0 h-full w-full rounded-xl object-cover opacity-70" />
        <div className="absolute inset-0 rounded-xl bg-[linear-gradient(160deg,oklch(0.55_0.16_235/0.55),oklch(0.16_0.08_258/0.85))]" />
        <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-background/20 to-background/60" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1/3 rounded-t-xl bg-gradient-to-b from-crystal/35 to-transparent" />
        <Lantern className="left-1.5" />
        <Lantern className="right-1.5" />
        <div className="relative flex items-center gap-2 px-8 py-6">
          <img src={iceCube} alt="Ice cube currency" fetchPriority="high" width={80} height={80} className="h-20 w-20 shrink-0 object-contain" />
          <div className="min-w-0 flex-1 text-center">
            <p className="text-3d flex items-center justify-center gap-1.5 text-sm"><img src={iceCube} alt="" width={18} height={18} className="h-[18px] w-[18px] object-contain" />YOUR BALANCE</p>
            <p className="balance-amount flex items-center justify-center gap-2 font-display text-4xl leading-none tabular-nums"><img src={iceCube} alt="" width={30} height={30} className="h-[30px] w-[30px] object-contain" /><span className="text-gold-grad">{balance.toLocaleString("en-US")}</span></p>
            <p className="ice-badge mt-1.5 inline-block rounded-full px-3 py-0.5 text-sm text-ice/90">≈ $0.56 (0.59 TON)</p>
          </div>
        </div>
      </section>

      {/* Quick actions */}
      <section className="grid grid-cols-3 gap-3 pt-2">
        {[
          { l: "Earn", img: icEarn },
          { l: "Withdraw", img: icWallet },
          { l: "Invite", img: icInvite },
        ].map(({ l, img }) => (
          <Button variant="ghost" key={l} className="stone relative flex h-auto flex-col items-center gap-1 rounded-lg pb-2 pt-3">
            <img src={img} alt="" width={64} height={64} className="h-16 w-16 animate-floaty object-contain drop-shadow-[0_6px_6px_oklch(0_0_0/0.6)]" />
            <span className="text-3d text-lg leading-none">{l}</span>
          </Button>
        ))}
      </section>

      {/* Streak */}
      <section className="ice-panel p-3">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-3d flex items-center gap-1 text-lg"><Flame size={18} className="text-gold" fill="currentColor" /> Daily Streak</h2>
          <span className="font-display text-gold">{streakNow} / 7 Days</span>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {STREAK_REWARDS.map((v, i) => {
            const done = i < streakNow, last = i === 6, isToday = claimable && i === streakNow;
            const cls = `flex flex-col items-center gap-1 ice-tile py-1 ${last ? "!border-gold" : ""} ${done ? "!border-cyan" : ""} ${isToday ? "streak-today !border-cyan" : ""} ${!done && !isToday ? "streak-locked" : ""}`;
            const inner = (
              <>
                <span className={`text-[10px] ${last ? "text-gold" : "text-ice/80"}`}>{isToday ? "Today" : `Day ${i + 1}`}</span>
                {done ? <span className="ice-glyph grid h-6 w-6 place-items-center rounded-full"><Check size={14} strokeWidth={4} /></span>
                  : last ? <img src={chest} alt="Treasure chest" className="h-7 w-7 object-contain" />
                  : <img src={isToday ? iceCube : crystal} alt="" className="h-6 w-6 object-contain" />}
                <span className="reward-ember font-display text-[11px]">+{v}</span>
              </>
            );
            return isToday
              ? <Button variant="ghost" key={i} type="button" aria-label={`Claim day ${i + 1} reward`} className={`${cls} h-auto px-0`} onClick={(e) => claimToday(e.currentTarget)}>{inner}</Button>
              : <div key={i} className={cls}>{inner}</div>;
          })}
        </div>
        <p className="mt-2 text-center text-xs text-ice/75">{claimable ? "Tap today's ice to claim your reward!" : "Come back tomorrow to keep your streak."}</p>
      </section>

      {/* Task center + spin */}
      <section className="grid grid-cols-2 gap-3">
        <MiniCard img={tools} title="Task Center" sub="Complete Tasks" cta="Go" to="/tasks" />
        <MiniCard img={wheel} title="Lucky Spin" sub="Win Rewards" cta="Spin" spin />
      </section>

      <CommunityCards />

      {/* Event */}
      <section className="ice-panel snow-cap relative overflow-hidden">
        <img src={village} alt="Snow village" className="absolute inset-0 h-full w-full object-cover object-right" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent" />
        <div className="relative p-4">
          <p className="font-display text-gold">SPECIAL EVENT</p>
          <p className="font-display text-3xl leading-tight text-ice text-glow">SNOW VILLAGE</p>
          <p className="font-display text-crystal">Build · Trade · Earn</p>
          <Button variant="ice" className="mt-4 h-auto px-7 py-2 text-xl">Play Now</Button>
        </div>
      </section>
    </>
  );
}

function MiniCard({ img, title, sub, cta, to, spin }: { img: string; title: string; sub: string; cta: string; to?: "/tasks"; spin?: boolean }) {
  return (
    <div className="ice-panel snow-cap p-3">
      <div className="flex items-center gap-2">
        <img src={img} alt="" className={`h-12 w-12 shrink-0 object-contain ${spin ? "animate-[spin_7s_linear_infinite] drop-shadow-[0_0_8px_var(--cyan)]" : ""}`} />
        <div className="min-w-0">
          <p className="text-3d truncate">{title}</p>
          <p className="truncate text-xs text-ice/75">{sub}</p>
        </div>
      </div>
      <div className="mt-3">{to ? <Button variant="ice" asChild className="w-full"><Link to={to}>{cta}</Link></Button> : spin ? <LuckySpin /> : <Button variant="ice" className="w-full">{cta}</Button>}</div>
    </div>
  );
}

function Lantern({ className }: { className: string }) {
  return (
    <div className={`absolute top-1/2 z-[3] -translate-y-1/2 ${className}`}>
      <img src={lantern} alt="" width={28} height={42} className="h-11 w-auto drop-shadow-[0_0_14px_var(--gold)] animate-shimmer" />
    </div>
  );
}

