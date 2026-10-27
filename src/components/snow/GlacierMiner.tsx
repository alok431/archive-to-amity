import { useEffect, useRef, useState } from "react";
import { Zap } from "lucide-react";
import crystal from "@/assets/crystal.webp";
import iceCube from "@/assets/ice-cube.webp";
import { MINER_MAX_ENERGY, mine, regenEnergy } from "@/lib/game-logic";
import { celebrate, updateGame, useGame, useTicker } from "@/lib/game-store";
import { sfx } from "@/lib/sfx";

export function GlacierMiner() {
  const game = useGame();
  const balance = useTicker(game.balance);
  const [combo, setCombo] = useState(0);
  const comboTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const t = setInterval(() => updateGame((s) => regenEnergy(s, Date.now())), 1000);
    return () => clearInterval(t);
  }, []);

  const tap = (el: Element) => {
    let got = 0;
    updateGame((s) => { const r = mine(s, combo, Date.now()); got = r.reward; return r.state; });
    if (!got) return;
    sfx.mine(); celebrate(got, el);
    setCombo((c) => c + 1);
    clearTimeout(comboTimer.current);
    comboTimer.current = setTimeout(() => setCombo(0), 1200);
  };

  const pct = (game.energy / MINER_MAX_ENERGY) * 100;
  return (
    <section className="ice-panel snow-cap p-4 text-center" aria-label="Glacier Miner game">
      <div className="flex items-center justify-between">
        <p className="text-3d text-xl">Glacier Miner</p>
        <p className="flex items-center gap-1 font-display text-lg text-frost-grad tabular-nums">
          <img src={iceCube} alt="" className="h-6 w-6 object-contain" />{balance.toLocaleString("en-US")}
        </p>
      </div>
      <p className="text-xs text-ice/75">Tap the crystal to mine ice cubes · every 10th combo tap gives +5</p>
      <button type="button" aria-label="Mine crystal" disabled={game.energy <= 0} onClick={(e) => tap(e.currentTarget)}
        className="miner-crystal mx-auto my-3 block select-none touch-manipulation disabled:opacity-50">
        <img src={crystal} alt="" draggable={false} className="h-40 w-40 object-contain animate-floaty" />
      </button>
      <p className={`h-6 font-display text-lg text-gold transition-opacity ${combo > 1 ? "opacity-100" : "opacity-0"}`}>Combo x{combo}</p>
      <div className="mt-1 flex items-center gap-2">
        <Zap size={18} className="text-gold" fill="currentColor" />
        <div className="xp-track h-3 flex-1 overflow-hidden rounded-full" role="progressbar" aria-label="Energy" aria-valuenow={game.energy} aria-valuemin={0} aria-valuemax={MINER_MAX_ENERGY}>
          <div className="h-full rounded-full bg-gradient-to-r from-cyan to-crystal transition-[width] duration-300" style={{ width: `${pct}%` }} />
        </div>
        <span className="w-16 text-right text-xs text-ice tabular-nums">{game.energy}/{MINER_MAX_ENERGY}</span>
      </div>
      {game.energy <= 0 && <p className="mt-2 text-xs text-ice/75">Out of energy — it refills 1 every 3 seconds.</p>}
    </section>
  );
}
