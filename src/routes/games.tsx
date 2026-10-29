import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useState } from "react";
import { Play } from "lucide-react";
import drift from "@/assets/game-drift.webp";
import icicle from "@/assets/game-icicle.webp";
import striker from "@/assets/game-striker.webp";
import tower from "@/assets/game-tower.webp";
import { Reward } from "@/components/snow/Shell";
import { GlacierMiner } from "@/components/snow/GlacierMiner";
import { IceButton } from "@/components/snow/IceButton";
import { ARCADE_REWARD_CAP } from "@/lib/arcade-config";

const GlacierDrift = lazy(() => import("@/components/snow/GlacierDrift").then((m) => ({ default: m.GlacierDrift })));
const IcicleThrow = lazy(() => import("@/components/snow/IcicleThrow").then((m) => ({ default: m.IcicleThrow })));
const FrostTower = lazy(() => import("@/components/snow/FrostTower").then((m) => ({ default: m.FrostTower })));
const BlizzardStriker = lazy(() => import("@/components/snow/BlizzardStriker").then((m) => ({ default: m.BlizzardStriker })));

export const Route = createFileRoute("/games")({
  head: () => ({
    meta: [
      { title: "Frozen Arcade — SnowQuest" },
      { name: "description", content: "Play Glacier Drift, Icicle Throw, Blizzard Striker, Frost Tower and Glacier Miner — quick winter games that earn ice cubes." },
      { property: "og:title", content: "Frozen Arcade — SnowQuest" },
      { property: "og:description", content: "Quick 1–2 minute ice games with cube rewards." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Games,
});

type Id = "drift" | "icicle" | "striker" | "tower";
const games: { id: Id; n: string; d: string; img: string; len: string }[] = [
  { id: "drift", n: "Glacier Drift", d: "Dodge · Drift · Earn", img: drift, len: "60s" },
  { id: "icicle", n: "Icicle Throw", d: "Aim · Stick · Earn", img: icicle, len: "1–2 min" },
  { id: "striker", n: "Blizzard Striker", d: "Fly · Shoot · Earn", img: striker, len: "90s" },
  { id: "tower", n: "Frost Tower", d: "Hold · Smash · Earn", img: tower, len: "1–2 min" },
];

function Games() {
  const [open, setOpen] = useState<Id | null>(null);
  const close = () => setOpen(null);
  return (
    <>
      <GlacierMiner />
      <h2 className="ice-title px-1 text-xl">FROZEN ARCADE</h2>
      <div className="grid grid-cols-2 gap-3">
        {games.map((g, i) => (
          <article key={g.id} className={`ice-panel snow-cap overflow-hidden p-1.5 ${i === 0 ? "col-span-2" : ""}`}>
            <div className={`relative overflow-hidden rounded-md ${i === 0 ? "aspect-[16/8]" : "aspect-[4/3.4]"}`}>
              <img src={g.img} alt={g.n} width={480} height={400} className="h-full w-full object-cover transition duration-500 hover:scale-110" />
              <div className="ice-badge absolute right-1 top-1 rounded-lg px-1.5 py-0.5 text-xs"><Reward v={`≤${ARCADE_REWARD_CAP}`} /></div>
              <div className="ice-badge absolute left-1 top-1 rounded-lg px-1.5 py-0.5 text-[10px] text-ice">{g.len}</div>
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background to-transparent" />
            </div>
            <div className="px-1 pb-1 pt-1 text-center">
              <p className="text-3d text-lg leading-tight">{g.n}</p>
              <p className="text-xs text-cyan">{g.d}</p>
              <IceButton wide className="mt-2 w-full" onClick={() => setOpen(g.id)}><Play size={16} fill="currentColor" />PLAY</IceButton>
            </div>
          </article>
        ))}
      </div>
      <Suspense fallback={null}>
        {open === "drift" && <GlacierDrift onExit={close} />}
        {open === "icicle" && <IcicleThrow onExit={close} />}
        {open === "striker" && <BlizzardStriker onExit={close} />}
      </Suspense>
    </>
  );
}
