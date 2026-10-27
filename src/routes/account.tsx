import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Wallet, Users, ReceiptText, Gift, Trophy, Settings, HelpCircle, ChevronRight, LogOut, Pencil, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { Avatar, Coin } from "@/components/snow/Shell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { WITHDRAW_MIN_AMOUNT, withdrawFee, withdrawTotal } from "@/lib/wallet-config";
import { sfx } from "@/lib/sfx";

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
  const [panel, setPanel] = useState<"deposit" | "withdraw" | null>(null);
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
        <Button variant="iceRoyal" className="h-12 text-lg" onClick={() => { sfx.tap(); setPanel("withdraw"); }}><ArrowUpFromLine />Withdraw</Button>
        <Button variant="iceEmerald" className="h-12 text-lg" onClick={() => { sfx.tap(); setPanel("deposit"); }}><ArrowDownToLine />Deposit</Button>
      </div>

      <section className="ice-panel panel-royal grid grid-cols-3 divide-x divide-frost/60 py-3 text-center">
        {([["Total Earned", "25,680 IQ"], ["Friends", "128"], ["Rank", "#124"]] as const).map(([l, v]) => (
          <div key={l}><p className="text-xs text-ice/75">{l}</p>{v.endsWith(" IQ") ? <span className="text-frost-grad flex items-center justify-center gap-1 font-display text-xl"><Coin className="h-4 w-4" />{v.replace(" IQ", "")}</span> : <p className="text-3d text-xl">{v}</p>}</div>
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

      <WalletDialog panel={panel} onClose={() => setPanel(null)} />
    </>
  );
}

function WalletDialog({ panel, onClose }: { panel: "deposit" | "withdraw" | null; onClose: () => void }) {
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");
  const [sent, setSent] = useState(false);
  const value = Number(amount);
  const validAmount = Number.isFinite(value) && value > 0;
  const fee = withdrawFee(value);
  const total = withdrawTotal(value);
  const tooLow = validAmount && value < WITHDRAW_MIN_AMOUNT;
  const canSubmit = panel === "deposit" ? validAmount : validAmount && !tooLow && address.trim().length >= 8;

  function close() { setAmount(""); setAddress(""); setSent(false); onClose(); }
  function submit() {
    if (!canSubmit) return;
    sfx.chime();
    setSent(true);
  }

  return (
    <Dialog open={panel !== null} onOpenChange={(v) => { if (!v) close(); }}>
      <DialogContent className="ice-panel w-[calc(100%-32px)] max-w-sm gap-3 p-5">
        <DialogTitle className="text-3d text-center text-2xl">{panel === "deposit" ? "DEPOSIT IQ" : "WITHDRAW IQ"}</DialogTitle>
        <DialogDescription className="text-center text-crystal">Demo only · no real funds move</DialogDescription>
        {sent ? (
          <div className="space-y-3 text-center">
            <p className="text-frost-grad font-display text-xl">{panel === "deposit" ? "Deposit request noted" : "Withdrawal request submitted"}</p>
            <p className="text-sm text-crystal">{panel === "deposit" ? "This is a simulation. Real deposits will be available when payments are connected." : `Simulated payout of ${value.toLocaleString("en-US")} IQ with a ${fee.toLocaleString("en-US")} IQ fee. Real withdrawals need the backend.`}</p>
            <Button variant="ice" className="w-full" onClick={close}>Done</Button>
          </div>
        ) : (
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); submit(); }}>
            <label className="block space-y-1">
              <span className="text-xs text-crystal">Amount (IQ)</span>
              <input inputMode="numeric" pattern="[0-9]*" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))} placeholder={panel === "withdraw" ? `Min ${WITHDRAW_MIN_AMOUNT} IQ` : "Enter amount"} className="w-full rounded-lg border px-3 py-2.5 text-sm text-ice outline-none focus:border-cyan" />
            </label>
            {panel === "withdraw" && (
              <>
                <label className="block space-y-1">
                  <span className="text-xs text-crystal">Wallet address</span>
                  <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Your TON wallet address" className="w-full rounded-lg border px-3 py-2.5 text-sm text-ice outline-none focus:border-cyan" />
                </label>
                <div className="ice-tile space-y-1 px-3 py-2 text-sm">
                  <p className="flex justify-between"><span className="text-crystal">Withdrawal fee (5%, min {WITHDRAW_MIN_AMOUNT / 10} IQ)</span><span className="font-display text-gold">{validAmount ? `${fee.toLocaleString("en-US")} IQ` : "—"}</span></p>
                  <p className="flex justify-between"><span className="text-crystal">Total deducted</span><span className="text-frost-grad font-display">{validAmount ? `${total.toLocaleString("en-US")} IQ` : "—"}</span></p>
                </div>
                {tooLow && <p className="text-xs text-gold">Minimum withdrawal is {WITHDRAW_MIN_AMOUNT} IQ.</p>}
              </>
            )}
            <Button variant={panel === "deposit" ? "iceEmerald" : "iceRoyal"} type="submit" disabled={!canSubmit} className="h-11 w-full text-lg disabled:opacity-50">
              {panel === "deposit" ? <ArrowDownToLine /> : <ArrowUpFromLine />}{panel === "deposit" ? "Confirm Deposit" : "Submit Withdrawal"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
