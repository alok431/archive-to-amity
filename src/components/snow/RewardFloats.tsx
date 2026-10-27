import iceCube from "@/assets/ice-cube.webp";
import { useFloats } from "@/lib/game-store";

export function RewardFloats() {
  const floats = useFloats();
  return (
    <div className="pointer-events-none fixed inset-0 z-[60]" aria-live="polite">
      {floats.map((f) => (
        <span key={f.id} style={{ left: f.x, top: f.y }}
          className="reward-float reward-ember absolute flex -translate-x-1/2 items-center gap-1 font-display text-2xl">
          +{f.amount} IQ<img src={iceCube} alt="ice cubes" className="h-7 w-7 object-contain" />
        </span>
      ))}
    </div>
  );
}
