import { createFileRoute } from "@tanstack/react-router";
import { Wallet, Users, ReceiptText, Gift, Trophy, Settings, HelpCircle, ChevronRight, LogOut, Pencil, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { Avatar, Reward } from "@/components/snow/Shell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Player Profile — SnowQuest" },
      { name: "description", content: "Your SnowQuest profile, stats, wallet, referrals and achievements." },
      { property: "og:title", content: "Player Profile — SnowQuest" },
      { property: "og:description", content: "Your profile, stats, wallet and achievements." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Account,
});

const rows = [
  { t: "Wallet", s: "Balance & Withdrawal", I: Wallet, g: "from-cyan to-primary" },
  { t: "My Referrals", s: "Invite Friends & Earn", I: Users, g: "from-primary to-frost" },
  { t: "Transaction History", s: "View All Transactions", I: ReceiptText, g: "from-royal to-[oklch(0.4_0.2_290)]" },
  { t: "Promo Code", s: "Redeem Promo Code", I: Gift, g: "from-destructive to-[oklch(0.45_0.2_15)]" },
  { t: "Achievements", s: "Your Badges & Progress", I: Trophy, g: "from-gold to-[oklch(0.65_0.17_50)]" },
  { t: "Settings", s: "App Settings", I: Settings, g: "from-primary to-[oklch(0.4_0.15_255)]" },
  { t: "Help & Support", s: "Get Help", I: HelpCircle, g: "from-cyan to-frost" },
];

function Account() {
  return (
    <>
      <section className="ice-panel snow-cap p-4">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
          <Avatar size={76} />
          <div className="min-w-0">
            <p className="truncate text-3d text-xl">Snow Explorer</p>
            <p className="truncate text-sm text-crystal">@snowquest_user</p>
            <p className="text-xs text-ice/75">Player ID: 123456789</p>
          </div>
          <Button variant="ice" size="icon" aria-label="Edit profile" className="grid h-10 w-10 place-items-center"><Pencil size={18} /></Button>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 pb-2">
        <Button variant="iceRoyal" className="h-12 text-lg"><ArrowUpFromLine />Withdraw</Button>
        <Button variant="iceEmerald" className="h-12 text-lg"><ArrowDownToLine />Deposit</Button>
      </div>

      <section className="ice-panel panel-royal grid grid-cols-3 divide-x divide-frost/60 py-3 text-center">
        {([["Total Earned", "25,680 IQ"], ["Friends", "128"], ["Rank", "#124"]] as const).map(([l, v]) => (
          <div key={l}><p className="text-xs text-ice/75">{l}</p>{v.endsWith(" IQ") ? <span className="flex justify-center text-xl"><Reward v={v.replace(" IQ", "")} /></span> : <p className="text-3d text-xl">{v}</p>}</div>
        ))}
      </section>

      <div className="space-y-4">
        {rows.map(({ t, s, I, g }) => (
          <Button variant="ghost" key={t} className="ice-panel grid h-auto w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center justify-normal gap-3 whitespace-normal p-2.5 text-left active:scale-[0.98]">
            <span className="ice-tile grid h-12 w-12 shrink-0 place-items-center"><span className={`grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br ${g} shadow-[inset_0_2px_0_oklch(1_0_0/0.5),0_2px_0_oklch(0_0_0/0.45)]`}><I size={18} /></span></span>
            <span className="min-w-0"><span className="block truncate text-3d">{t}</span><span className="block truncate text-xs text-ice/75">{s}</span></span>
            <ChevronRight className="text-crystal drop-shadow-[0_0_6px_var(--cyan)]" />
          </Button>
        ))}
      </div>

      <div className="mx-auto w-3/4"><Button variant="iceRose" className="h-12 w-full text-lg"><LogOut /> Logout</Button></div>
    </>
  );
}
