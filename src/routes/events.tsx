import { Reward } from "@/components/snow/Shell";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Timer } from "lucide-react";
import trophy from "@/assets/trophy.webp";
import snowmobile from "@/assets/snowmobile.webp";
import gifts from "@/assets/gifts.webp";
import avatar from "@/assets/avatar.webp";
import warrior from "@/assets/warrior.webp";
import { Chips } from "@/components/snow/Shell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Ice Tournament — SnowQuest" },
      { name: "description", content: "Climb the Ice Leaderboard, join the Snow Race and win the Invite Contest." },
      { property: "og:title", content: "Ice Tournament — SnowQuest" },
      { property: "og:description", content: "Leaderboards, races and contests in the frozen kingdom." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Events,
});

const players = [
  ["SnowKing", "2,580", "5 TON"], ["IceQueen", "1,980", "3 TON"], ["FrostDragon", "1,650", "1 TON"],
  ["GlacierX", "1,320", "500 IQ"], ["PolarMaster", "1,100", "500 IQ"],
];
const medal = "border-2 shadow-[0_2px_0_oklch(0_0_0/0.5),inset_0_2px_0_oklch(1_0_0/0.6)] text-background";
const rankStyle = [`${medal} border-[oklch(0.95_0.1_95)] bg-[radial-gradient(circle_at_35%_30%,oklch(0.98_0.08_95),var(--gold)_60%,oklch(0.55_0.14_55))]`, `${medal} border-ice bg-[radial-gradient(circle_at_35%_30%,oklch(1_0_0),oklch(0.8_0.02_250)_60%,oklch(0.5_0.02_250))]`, `${medal} border-[oklch(0.85_0.1_60)] bg-[radial-gradient(circle_at_35%_30%,oklch(0.9_0.08_60),oklch(0.62_0.13_50)_60%,oklch(0.4_0.1_45))]`];

function Countdown({ t }: { t: string }) {
  return <span className="ice-badge inline-flex items-center gap-1 rounded-lg px-2 py-0.5 font-display text-gold"><Timer size={14} /> {t}</span>;
}

function Events() {
  const [cat, setCat] = useState("Leaderboard");
  return (
    <>
      <Chips items={["Leaderboard", "Contests", "Special", "History"]} active={cat} onChange={setCat} />
      <section className="ice-panel snow-cap overflow-hidden">
        <div className="relative bg-gradient-to-r from-primary/40 to-royal/30 p-4 pr-24">
          <p className="text-3d text-2xl">ICE LEADERBOARD</p>
          <p className="text-sm text-crystal">Top Players Win Huge Rewards</p>
          <div className="mt-2"><Countdown t="6D 12H 30M" /></div>
          <img src={trophy} alt="Trophy" width={80} height={80} className="absolute right-2 top-3 h-20 w-20 object-contain" />
        </div>
        <div className="grid grid-cols-[28px_minmax(0,1fr)_auto_64px] gap-2 px-3 pt-2 text-xs text-ice/70">
          <span>#</span><span>Player</span><span>Invites / IQ</span><span className="text-right">Reward</span>
        </div>
        <ul className="space-y-1 p-2">
          {players.map(([n, s, r], i) => (
            <li key={n} className="grid grid-cols-[28px_minmax(0,1fr)_auto_64px] items-center gap-2 ice-tile px-1.5 py-1.5">
              <span className={`grid h-6 w-6 place-items-center rounded-full font-display text-sm ${rankStyle[i] ?? "ice-tile !rounded-full"}`}>{i + 1}</span>
              <span className="flex min-w-0 items-center gap-2">
                <img src={i % 2 ? avatar : warrior} alt="" className="h-7 w-7 shrink-0 rounded-full border border-crystal object-cover" />
                <span className="truncate text-sm">{n}</span>
              </span>
              <span className="text-sm">{s}</span>
              <span className="flex justify-end"><Reward v={String(r).replace(" IQ", "")} /></span>
            </li>
          ))}
        </ul>
        <div className="p-3 pt-0"><Button variant="ice" className="h-auto w-full py-2">View Full Leaderboard</Button></div>
      </section>

      <Promo title="SNOW RACE EVENT" sub="Race · Play · Earn" time="3D 08H 20M" cta="Join Now" img={snowmobile} />
      <Promo title="INVITE CONTEST" sub="Invite Friends & Earn Extra" time="5D 06H 40M" cta="Invite Now" img={gifts} purple />
    </>
  );
}

function Promo({ title, sub, time, cta, img, purple }: { title: string; sub: string; time: string; cta: string; img: string; purple?: boolean }) {
  return (
    <section className={`ice-panel snow-cap relative overflow-hidden p-4 ${purple ? "bg-gradient-to-r from-deep to-royal/50" : "bg-gradient-to-r from-deep to-primary/40"}`}>
      <div className="relative z-[1] max-w-[62%] space-y-1.5">
        <p className="text-3d text-xl leading-tight">{title}</p>
        <p className="text-sm text-cyan">{sub}</p>
        <Countdown t={time} />
        <div><Button variant="ice" className="mt-1 px-5 py-1.5">{cta}</Button></div>
      </div>
      <img src={img} alt="" className="absolute -right-2 bottom-0 h-36 w-36 animate-floaty object-contain" />
    </section>
  );
}
