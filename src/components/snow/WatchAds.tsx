import { useEffect, useState } from "react";
import { Play, Clapperboard, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import iceCube from "@/assets/ice-cube.webp";
import { ADS_PER_BLOCK, watchBlocks } from "./watch-config";
import { AD_BLOCK_REWARD, AD_WATCH_SECONDS, claimAdBlock, watchAd } from "@/lib/game-logic";
import { celebrate, updateGame, useGame } from "@/lib/game-store";
import { sfx } from "@/lib/sfx";

export function WatchAds() {
  const game = useGame();
  const [watching, setWatching] = useState<{ id: string; title: string } | null>(null);
  const [left, setLeft] = useState(AD_WATCH_SECONDS);

  useEffect(() => {
    if (!watching) return;
    setLeft(AD_WATCH_SECONDS);
    const t = setInterval(() => setLeft((n) => n - 1), 1000);
    return () => clearInterval(t);
  }, [watching]);

  useEffect(() => {
    if (!watching || left > 0) return;
    updateGame((s) => watchAd(s, watching.id));
    sfx.chime();
    setWatching(null);
  }, [left, watching]);

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        {watchBlocks.map((block) => {
          const n = game.ads[block.id] ?? 0;
          const full = n >= ADS_PER_BLOCK;
          return (
            <article key={block.id} className="ice-panel watch-block watch-ad flex aspect-square flex-col items-center justify-between p-3 text-center">
              <span className="ice-tile grid h-14 w-14 place-items-center">
                <img src={iceCube} alt="" width={44} height={44} className={`h-11 w-11 object-contain ${full ? "animate-floaty" : ""}`} />
              </span>
              <h2 className="text-3d text-xl leading-none">{block.title}</h2>
              <div className="w-full">
                <p className="mb-1 text-[11px] font-semibold text-ice">{n} / {ADS_PER_BLOCK}</p>
                <div role="progressbar" aria-label={`${block.title} ad progress`} aria-valuenow={n} aria-valuemin={0} aria-valuemax={ADS_PER_BLOCK} className="ad-progress grid">
                  {Array.from({ length: ADS_PER_BLOCK }, (_, i) => <span key={i} className={`rounded-sm ${i < n ? "filled" : ""}`} />)}
                </div>
              </div>
              {full ? (
                <Button variant="iceAmber" className="streak-today h-9 w-full text-base" onClick={(e) => {
                  const el = e.currentTarget;
                  let reward = 0;
                  updateGame((s) => { const r = claimAdBlock(s, block.id); reward = r.reward; return r.state; });
                  sfx.crack(); celebrate(reward, el);
                }}><Gift /> +{AD_BLOCK_REWARD}</Button>
              ) : (
                <Button variant="iceViolet" aria-label="Watch Ad" className="h-9 w-full text-base" onClick={() => { sfx.tap(); setWatching(block); }}><Play fill="currentColor" /> Watch</Button>
              )}
            </article>
          );
        })}
      </div>
      <section className="ice-panel snow-cap flex items-center gap-3 p-4">
        <span className="ice-tile grid h-12 w-12 shrink-0 place-items-center"><Clapperboard size={22} className="text-crystal" /></span>
        <div>
          <p className="text-3d text-lg leading-tight">More Ads</p>
          <p className="text-xs text-ice/75">Coming soon…</p>
        </div>
      </section>
      <Dialog open={watching !== null}>
        <DialogContent className="ice-panel max-w-[calc(100%-32px)] text-center sm:max-w-sm [&>button]:hidden" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogTitle className="font-display text-xl">{watching?.title}</DialogTitle>
          <DialogDescription className="text-muted-foreground">Viewing sponsor… stay to earn your progress.</DialogDescription>
          <img src={iceCube} alt="" className="ad-countdown mx-auto h-24 w-24 object-contain" />
          <p className="text-3d font-display text-5xl" aria-live="polite">{Math.max(left, 0)}</p>
        </DialogContent>
      </Dialog>
    </>
  );
}
