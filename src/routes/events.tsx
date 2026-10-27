import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Users, BadgeCheck, Copy, Check, Send, Coins, Trophy, Crown, Medal, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Coin } from "@/components/snow/Shell";
import { REFERRAL_COMMISSION } from "@/lib/spin-config";
import gifts from "@/assets/gifts.webp";

export const Route = createFileRoute("/events")({
  head: () => ({ meta: [
    { title: "Refer & Earn — SnowQuest" },
    { name: "description", content: "Your SnowQuest referral link, invited friends and simulated referral earnings." },
    { property: "og:title", content: "Refer & Earn — SnowQuest" },
    { property: "og:description", content: "Invite friends to SnowQuest and track your referral activity." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Events,
});

const referralLink = "https://t.me/snowquest_bot?start=123456";
function Events() {
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState("");
  async function copy() {
    try { await navigator.clipboard.writeText(referralLink); setCopied(true); setNotice("Demo link copied"); }
    catch { setNotice("Copy unavailable. Select the link to copy it."); }
  }
  async function share() {
    if (navigator.share) {
      try { await navigator.share({ title: "SnowQuest", text: "Join me in SnowQuest!", url: referralLink }); setNotice("Share opened"); }
      catch { /* Canceling the share is not an error. */ }
    } else { await copy(); }
  }
  return <>
    <section className="ice-panel referral-banner p-4">
      <div className="flex items-start gap-3 pr-20">
        <span className="referral-emblem grid h-14 w-14 shrink-0 place-items-center text-cyan"><Users size={36} /></span>
        <div><h1 className="text-3d text-2xl">REFER & EARN</h1><p className="mt-1 text-sm text-crystal">Invite friends and get <strong className="text-gold">{REFERRAL_COMMISSION * 100}% commission</strong> for lifetime!</p></div>
      </div>
      <img src={gifts} alt="Frozen referral gifts" className="pointer-events-none absolute right-1 top-2 h-28 w-24 object-contain" />
      <div className="referral-actions mt-5 flex gap-3">
        <div className="referral-link flex min-w-0 flex-1 items-center rounded-lg border border-crystal px-2"><input aria-label="Demo referral link" readOnly value={referralLink} className="min-w-0 flex-1 border-0 bg-transparent py-3 text-xs text-crystal shadow-none" /><Button variant="ghost" size="icon" aria-label="Copy referral link" onClick={copy} className="shrink-0 text-cyan">{copied ? <Check /> : <Copy />}</Button></div>
        <Button variant="ice" onClick={share} className="h-12 px-4"><Send />Share</Button>
      </div>
      <p className="mt-3 min-h-4 text-xs text-crystal" role="status">{notice || "Demo referral link · sample stats"}</p>
    </section>
    <div className="grid grid-cols-3 gap-3 pt-2">
      <article className="ice-panel referral-stat flex flex-col items-center p-3 text-center"><Users className="mb-2 h-8 w-8 text-success" /><p className="text-xs text-crystal">Invited</p><p className="text-3d text-2xl">256</p></article>
      <article className="ice-panel referral-stat flex flex-col items-center p-3 text-center"><BadgeCheck className="mb-2 h-8 w-8 text-cyan" /><p className="text-xs text-crystal">Valid</p><p className="text-3d text-2xl">128</p></article>
      <article className="ice-panel referral-stat flex flex-col items-center p-3 text-center"><Coins className="mb-2 h-8 w-8 text-gold" /><p className="text-xs text-crystal">Earned</p><p className="reward-ember mt-1 flex items-center gap-1 font-display text-sm"><Coin className="h-3.5 w-3.5" />25,680</p></article>
    </div>

    {/* Leaderboard (demo standings) */}
    <SeasonHeading />
    <section className="ice-panel snow-cap p-3">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-3d flex items-center gap-1.5 text-lg"><Trophy size={18} className="text-gold" fill="currentColor" /> Top Inviters</h2>
        <span className="text-xs text-crystal">Demo standings</span>
      </div>
      <div className="space-y-2.5">
        {leaders.map(({ name, earned, invites }, i) => {
          const RankIcon = i === 0 ? Crown : i === 1 ? Medal : i === 2 ? Award : null;
          return (
            <div key={name} className="ice-tile flex items-center gap-2.5 px-2.5 py-2">
              <span className={`grid h-8 w-8 shrink-0 place-items-center font-display ${i === 0 ? "text-gold" : i < 3 ? "text-cyan" : "text-ice/70"}`}>
                {RankIcon ? <RankIcon size={20} fill="currentColor" /> : `#${i + 1}`}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-3d truncate text-sm leading-4">{name}</p>
                <p className="text-[10px] text-crystal">{invites} friends invited</p>
              </div>
              <span className="reward-ember flex items-center gap-1 font-display text-sm"><Coin className="h-3.5 w-3.5" />{earned}</span>
            </div>
          );
        })}
      </div>
    </section>
  </>;
}

/** Weekly season ends every Sunday 23:59:59 UTC (demo countdown). */
function seasonLeft(now: number) {
  const d = new Date(now), end = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + ((7 - d.getUTCDay()) % 7), 23, 59, 59);
  const s = Math.max(0, Math.floor((end - now) / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor(s / 3600) % 24, m: Math.floor(s / 60) % 60, s: s % 60 };
}
function SeasonHeading() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => { setNow(Date.now()); const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const left = now ? seasonLeft(now) : null;
  const pad = (n: number) => String(n).padStart(2, "0");
  return <div className="ice-panel flex items-center justify-between gap-2 px-3 py-2.5">
    <div><h2 className="ice-title text-xl leading-none">ICE LEADERBOARD</h2><p className="mt-1 text-[10px] text-crystal">Weekly season · resets Sunday</p></div>
    <div className="flex gap-1" aria-label="Time left in season">
      {(left ? [[left.d, "D"], [left.h, "H"], [left.m, "M"], [left.s, "S"]] : [["--", "D"], ["--", "H"], ["--", "M"], ["--", "S"]]).map(([v, u]) => <span key={u} className="ice-tile grid w-10 place-items-center py-1"><span className="font-display text-sm leading-none text-ice tabular-nums">{typeof v === "number" ? pad(v) : v}</span><span className="text-[8px] text-crystal">{u}</span></span>)}
    </div>
  </div>;
}

const leaders = [
  { name: "FrostKing", earned: "48,200", invites: 412 },
  { name: "IceQueen", earned: "36,750", invites: 335 },
  { name: "SnowFox", earned: "29,480", invites: 260 },
  { name: "GlacierMax", earned: "21,930", invites: 198 },
  { name: "PolarBear", earned: "17,540", invites: 154 },
];
