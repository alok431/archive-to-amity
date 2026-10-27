import { Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Settings, Globe, Volume2, VolumeX } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
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

/* Three-shard crystal prism mark: a tall center facet flanked by two angled shards. */
function PrismMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <defs>
        <linearGradient id="prism-face" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#eaf8ff" />
          <stop offset=".45" stopColor="#42c8ff" />
          <stop offset="1" stopColor="#087bff" />
        </linearGradient>
        <linearGradient id="prism-side" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#bdeaff" />
          <stop offset="1" stopColor="#176ccb" />
        </linearGradient>
      </defs>
      <path d="M16 22 L24 6 L29 36 L20 48 Z" fill="url(#prism-side)" opacity=".9" transform="rotate(-13 22 30)" />
      <path d="M48 22 L40 6 L35 36 L44 48 Z" fill="url(#prism-side)" opacity=".9" transform="rotate(13 42 30)" />
      <path d="M32 2 L43 22 L38 52 L32 62 L26 52 L21 22 Z" fill="url(#prism-face)" />
      <path d="M32 2 L43 22 L32 29 Z" fill="#ffffff" opacity=".55" />
      <path d="M32 2 L21 22 L32 29 Z" fill="#bdeaff" opacity=".75" />
      <path d="M32 29 L38 52 L32 62 Z" fill="#087bff" opacity=".45" />
    </svg>
  );
}

export function Header() {
  const [panel, setPanel] = useState<"settings" | "language" | null>(null);
  const { sound } = useGame();
  return (
    <header className="quest-header relative flex min-h-28 items-center justify-between gap-2 px-4 py-6">
      <img src={village} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover object-[70%_40%]" />
      <div className="quest-header-shade pointer-events-none absolute inset-0" />
      <div className="relative flex min-w-0 items-center gap-2"><Snowflake className="header-snowflake h-10 w-10 shrink-0 text-cyan" /><div><p className="text-3d text-2xl leading-none">SNOWQUEST</p><p className="mt-1 text-[10px] text-crystal">PLAY · EXPLORE · EARN</p></div></div>
      <div className="flex gap-2">
        <SoundToggle />
        <IconBtn label="Settings" onClick={() => setPanel("settings")}><Settings size={18} className="text-crystal" /></IconBtn>
        <IconBtn label="Language" onClick={() => setPanel("language")}><Globe size={18} className="text-crystal" /></IconBtn>
      </div>
      <Dialog open={panel !== null} onOpenChange={(v) => { if (!v) setPanel(null); }}><DialogContent className="ice-panel w-[calc(100%-32px)] max-w-sm"><DialogTitle className="text-3d">{panel === "settings" ? "Settings" : "Language"}</DialogTitle><DialogDescription className="text-crystal">{panel === "settings" ? "Sound effects" : "English"}</DialogDescription>{panel === "settings" ? <Button variant="ice" aria-pressed={sound} onClick={() => updateGame((s) => ({ ...s, sound: !s.sound }))}>{sound ? <Volume2 /> : <VolumeX />}{sound ? "Sound On" : "Sound Off"}</Button> : <p className="text-sm text-crystal">More languages coming later.</p>}</DialogContent></Dialog>
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
        <Header />
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
