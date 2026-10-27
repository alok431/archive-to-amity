import { useEffect, useRef, useState } from "react";
import { Snowflake, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { SPIN_REWARDS, spinOutcome } from "@/lib/spin-config";
import { celebrate, updateGame } from "@/lib/game-store";
import { sfx } from "@/lib/sfx";
import cube from "@/assets/ice-cube.webp";

export function LuckySpin() {
  const [open, setOpen] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [reward, setReward] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  function spin() {
    if (spinning) return;
    const outcome = spinOutcome(Math.random());
    setReward(null); setSpinning(true); sfx.tap();
    setRotation((prev) => (Math.floor(prev / 360) + 6) * 360 + outcome.angle);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    timer.current = setTimeout(() => {
      updateGame((s) => ({ ...s, balance: s.balance + outcome.reward }));
      setReward(outcome.reward); setSpinning(false); sfx.chime(); celebrate(outcome.reward);
    }, reduced ? 50 : 4300);
  }
  return <>
    <Button variant="ice" className="w-full" onClick={() => setOpen(true)}>Spin</Button>
    <Dialog open={open} onOpenChange={(next) => { if (!spinning) setOpen(next); }}>
      <DialogContent className="ice-panel spin-dialog w-[calc(100%-32px)] max-w-[420px] gap-2 p-5">
        <DialogTitle className="text-3d text-center text-2xl">FROST FORTUNE</DialogTitle>
        <DialogDescription className="text-center text-crystal">Demo spin · simulated IQ only</DialogDescription>
        <div className="spin-stage mx-auto">
          <span className="spin-pointer" aria-hidden />
          <div className="spin-wheel" style={{ transform: `rotate(${rotation}deg)` }}>
            <svg viewBox="0 0 300 300" aria-label="Eight icy reward segments">
              {SPIN_REWARDS.map((v, i) => {
                const start = (i * 45 - 112.5) * Math.PI / 180;
                const end = start + Math.PI / 4;
                return <g key={i}><path className={i % 2 ? "spin-slice-alt" : "spin-slice"} d={`M150,150 L${150 + 142 * Math.cos(start)},${150 + 142 * Math.sin(start)} A142,142 0 0,1 ${150 + 142 * Math.cos(end)},${150 + 142 * Math.sin(end)} Z`} /><g transform={`rotate(${i * 45},150,150)`}><text x="150" y="49" textAnchor="middle" className="spin-value">{v}</text><text x="150" y="68" textAnchor="middle" className="spin-unit">IQ</text><image href={cube} x="137" y="77" width="26" height="26" /></g></g>;
              })}
            </svg>
          </div>
          <div className="spin-hub"><Snowflake size={36} /></div>
        </div>
        <div className="min-h-12 text-center" aria-live="polite">
          {reward !== null ? <><p className="reward-ember font-display text-2xl">+{reward} IQ</p><p className="text-xs text-crystal">Added to your demo balance</p></> : <p className="font-display text-crystal">{spinning ? "The frost is turning…" : "Your next frozen treasure awaits"}</p>}
        </div>
        <Button variant="ice" className="h-11 w-full text-lg" disabled={spinning} onClick={spin}><RotateCw className={spinning ? "animate-spin" : ""} />{spinning ? "Spinning…" : reward !== null ? "Spin Again" : "Spin Now"}</Button>
      </DialogContent>
    </Dialog>
  </>;
}