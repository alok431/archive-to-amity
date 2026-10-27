import { Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Bell, Settings, Plus, Crown, Volume2, VolumeX } from "lucide-react";
import { loadGame, updateGame, useGame } from "@/lib/game-store";
import { sfx } from "@/lib/sfx";
import { RewardFloats } from "./RewardFloats";
import { Button } from "@/components/ui/button";
import icHome from "@/assets/ic-home.webp";
import icTasks from "@/assets/ic-tasks.webp";
import icEvents from "@/assets/ic-events.webp";
import icAccount from "@/assets/ic-account.webp";
import avatar from "@/assets/avatar.webp";
import crystal from "@/assets/crystal.webp";
import bg from "@/assets/bg.webp";
import village from "@/assets/village.webp";
import iceCube from "@/assets/ice-cube.webp";

export const IMG = { avatar, crystal };

const artwork = Object.values(import.meta.glob("/src/assets/*.webp", { eager: true, query: "?url", import: "default" })) as string[];
// Keep decoded images referenced for the whole session so the browser never evicts them.
const warmed: HTMLImageElement[] = [];
function warmArtwork() {
  if (warmed.length || typeof window === "undefined") return;
  for (const src of artwork) {
    const image = new Image();
    image.decoding = "async";
    image.src = src;
    void image.decode?.().catch(() => {});
    warmed.push(image);
  }
}
if (typeof window !== "undefined") warmArtwork();
function ArtworkWarmup() {
  useEffect(() => { warmArtwork(); }, []);
  return (
    <div aria-hidden className="pointer-events-none fixed -left-[9999px] top-0 h-px w-px overflow-hidden opacity-0">
      {artwork.map((src) => <img key={src} src={src} alt="" width={1} height={1} />)}
    </div>
  );
}

function Snowfall() {
  const [flakes, setFlakes] = useState<{ l: number; d: number; s: number; delay: number; o: number }[]>([]);
  useEffect(() => {
    setFlakes(Array.from({ length: 40 }, () => ({
      l: Math.random() * 100, d: 7 + Math.random() * 10, s: 2 + Math.random() * 4,
      delay: -Math.random() * 15, o: 0.4 + Math.random() * 0.6,
    })));
  }, []);
  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden" aria-hidden>
      {flakes.map((f, i) => (
        <span key={i} className="absolute top-0 rounded-full bg-ice"
          style={{ left: `${f.l}%`, width: f.s, height: f.s, opacity: f.o,
            animation: `snowfall ${f.d}s linear ${f.delay}s infinite` }} />
      ))}
    </div>
  );
}

export function XpBar({ value = 380, max = 1000, className = "" }: { value?: number; max?: number; className?: string }) {
  return (
    <div className={`xp-track relative h-3.5 rounded-full bg-background/90 p-[1px] ${className}`}>
      <div className="h-full rounded-full bg-[linear-gradient(180deg,oklch(1_0_0/0.6),transparent_50%),linear-gradient(90deg,var(--royal),var(--cyan))] shadow-[0_0_8px_var(--cyan)] transition-[width] duration-1000" style={{ width: `${(value / max) * 100}%` }} />
    </div>
  );
}

export function Avatar({ size = 56, src = avatar }: { size?: number; src?: string }) {
  return (
    <div className="frozen-avatar relative shrink-0" style={{ width: size, height: size }}>
      <img src={src} alt="Player avatar" width={size} height={size}
        className="h-full w-full rounded-full border-2 border-crystal object-cover shadow-[var(--glow-cyan)]" />
    </div>
  );
}

function IconBtn({ children, label, onClick, pressed }: { children: ReactNode; label: string; onClick?: () => void; pressed?: boolean }) {
  return (
    <Button variant="ghost" size="icon" aria-label={label} aria-pressed={pressed} onClick={onClick} className="ice-tile grid h-10 w-10 shrink-0 place-items-center">
      {children}
    </Button>
  );
}

function SoundToggle() {
  const { sound } = useGame();
  return (
    <IconBtn label="Sound effects" pressed={sound} onClick={() => { updateGame((s) => ({ ...s, sound: !s.sound })); if (!sound) setTimeout(() => sfx.tap(), 0); }}>
      {sound ? <Volume2 size={18} className="text-crystal" /> : <VolumeX size={18} className="text-ice/60" />}
    </IconBtn>
  );
}

export function Header() {
  return (
    <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 pt-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="relative">
          <Avatar size={58} />
          <span className="absolute -bottom-0.5 -left-0.5 grid h-5 w-5 place-items-center rounded-full border border-ice bg-primary"><Plus size={12} strokeWidth={3} /></span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-3d truncate text-lg leading-tight">Snow Explorer</p>
          <p className="flex items-center gap-1 text-sm text-gold"><Crown size={13} fill="currentColor" /> Lv. 12</p>
          <div className="mt-1 flex items-center gap-2">
            <XpBar className="flex-1" />
            <span className="shrink-0 text-xs text-ice/90">380/1000</span>
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <SoundToggle />
        <IconBtn label="Notifications"><Bell size={18} className="text-gold" fill="currentColor" /><span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-destructive" /></IconBtn>
        <IconBtn label="Settings"><Settings size={18} className="text-crystal" /></IconBtn>
      </div>
    </header>
  );
}

const tabs = [
  { to: "/", label: "Home", icon: icHome },
  { to: "/tasks", label: "Tasks", icon: icTasks },
  { to: "/games", label: "Games", icon: null },
  { to: "/events", label: "Events", icon: icEvents },
  { to: "/account", label: "Account", icon: icAccount },
] as const;

function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto w-[calc(100%-40px)] max-w-[420px] pb-[max(env(safe-area-inset-bottom),14px)]">
      <div className="ice-panel nav-dock relative grid grid-cols-5 items-end px-1 pb-2 pt-2">
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
          <span className="animate-dock absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-transparent via-crystal/25 to-transparent" />
        </div>
        {tabs.map((t) => (
          <Link key={t.to} to={t.to} preload="render" activeOptions={{ exact: true }}
            className="group relative flex flex-col items-center outline-none focus-visible:[&>span:first-child]:ring-2 focus-visible:[&>span:first-child]:ring-cyan rounded-xl gap-0.5 text-xs text-ice/75 data-[status=active]:text-cyan">
            {t.icon ? (
              <span className="relative grid h-12 w-12 place-items-center transition-transform duration-200 group-data-[status=active]:-translate-y-1">
                <img src={t.icon} alt="" width={40} height={40} className="nav-cube relative h-10 w-10 object-contain" />
              </span>
            ) : (
              <span className="grid h-12 w-14 place-items-center">
                <img src={iceCube} alt="" width={52} height={52} className="nav-cube relative h-[52px] w-[52px] object-contain transition-transform duration-200" />
              </span>
            )}
            <span className="font-display tracking-wide group-data-[status=active]:[text-shadow:0_0_8px_var(--cyan)]">{t.label}</span>
            <span className="h-1 w-5 rounded-full bg-cyan opacity-0 shadow-[0_0_8px_var(--cyan)] group-data-[status=active]:opacity-100" />
          </Link>
        ))}
      </div>
    </nav>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  useEffect(() => { loadGame(); }, []);
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 z-0">
        <img src={bg} alt="" className="h-full w-full object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/70 to-background/95" />
      </div>
      <Snowfall />
      <ArtworkWarmup />
      <RewardFloats />
      <div className="relative z-10 mx-auto max-w-[480px] pb-36">
        <div className="relative h-20 overflow-hidden">
          <img src={village} alt="" className="h-full w-full object-cover object-[70%_40%]" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
          <div className="absolute left-4 top-3 flex items-center gap-1.5">
            <img src={crystal} alt="" className="h-8 w-8 animate-shimmer" />
            <div>
              <p className="text-3d text-xl leading-none">SNOWQUEST</p>
              <p className="text-[9px] tracking-[0.25em] text-crystal">PLAY · EXPLORE · EARN</p>
            </div>
          </div>
        </div>
        <div className="-mt-4"><Header /></div>
        <main className="space-y-5 px-5 pt-6">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}

export function Coin({ className = "h-4 w-4" }: { className?: string }) {
  return <img src={iceCube} alt="" width={20} height={20} className={`shrink-0 object-contain drop-shadow-[0_1px_2px_var(--background)] ${className}`} />;
}

export function Reward({ v, unit = "IQ" }: { v: string | number; unit?: string }) {
  return <span className="reward-ember flex items-center gap-1 whitespace-nowrap font-display"><Coin />{v} {unit}</span>;
}

export function Chips({ items, active, onChange }: { items: string[]; active: string; onChange: (s: string) => void }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1">
      {items.map((c) => (
        <Button variant="ghost" key={c} aria-pressed={c === active} data-active={c === active} onClick={() => onChange(c)} className="chip h-auto shrink-0 px-3.5 py-1.5 text-sm">{c}</Button>
      ))}
    </div>
  );
}
