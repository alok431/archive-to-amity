import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import runner from "@/assets/game-runner.webp";
import rider from "@/assets/game-rider.webp";
import miner from "@/assets/game-miner.webp";
import yeti from "@/assets/game-yeti.webp";
import tower from "@/assets/game-tower.webp";
import match from "@/assets/game-match.webp";
import bg from "@/assets/bg.webp";
import { Chips, Reward } from "@/components/snow/Shell";
import { GlacierMiner } from "@/components/snow/GlacierMiner";

export const Route = createFileRoute("/games")({
  head: () => ({
    meta: [
      { title: "Frozen Arcade — SnowQuest" },
      { name: "description", content: "Play Ice Runner, Snow Rider, Crystal Miner and more winter games to earn IQ." },
      { property: "og:title", content: "Frozen Arcade — SnowQuest" },
      { property: "og:description", content: "Play winter games and earn IQ rewards." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Games,
});

const games = [
  { n: "Ice Runner", d: "Run · Collect · Earn", img: runner, c: "Action", r: 120 },
  { n: "Snow Rider", d: "Race · Drift · Earn", img: rider, c: "Racing", r: 150 },
  { n: "Crystal Miner", d: "Mine · Craft · Earn", img: miner, c: "Strategy", r: 100 },
  { n: "Yeti Blast", d: "Puzzle · Win · Earn", img: yeti, c: "Action", r: 130 },
  { n: "Ice Tower", d: "Build · Defend · Earn", img: tower, c: "Strategy", r: 180 },
  { n: "Frozen Match", d: "Match · Score · Earn", img: match, c: "Puzzle", r: 90 },
];

function Games() {
  const [cat, setCat] = useState("All");
  return (
    <>
      <GlacierMiner />
      <Chips items={["All", "Action", "Puzzle", "Racing", "Strategy"]} active={cat} onChange={setCat} />
      <div className="grid grid-cols-2 gap-3">
        {games.filter((g) => cat === "All" || g.c === cat).map((g) => (
          <article key={g.n} className="ice-panel snow-cap overflow-hidden p-1.5">
            <div className="relative aspect-[4/3.4] overflow-hidden rounded-md">
              <img src={g.img} alt={g.n} loading="eager" width={320} height={272} className="h-full w-full object-cover transition duration-500 hover:scale-110" />
              <div className="ice-badge absolute right-1 top-1 rounded-lg px-1.5 py-0.5 text-xs"><Reward v={`+${g.r}`} /></div>
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background to-transparent" />
            </div>
            <div className="px-1 pb-1 pt-1 text-center">
              <p className="text-3d text-lg leading-tight">{g.n}</p>
              <p className="text-xs text-cyan">{g.d}</p>
              <Button variant="iceAmber" className="mt-2 w-full"><Play fill="currentColor" />Play</Button>
            </div>
          </article>
        ))}
      </div>
      <section className="ice-panel snow-cap relative h-24 overflow-hidden">
        <img src={bg} alt="" className="absolute inset-0 h-full w-full object-cover object-[50%_60%] opacity-60 brightness-50" />
        <div className="relative p-4">
          <p className="text-3d text-2xl">More Games</p>
          <p className="text-ice/80">Coming Soon…</p>
        </div>
      </section>
    </>
  );
}
