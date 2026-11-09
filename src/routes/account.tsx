import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Wallet, Users, ReceiptText, Gift, Trophy, Settings, HelpCircle, ChevronRight, LogOut, Pencil, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { Avatar, Coin, SettingsBody } from "@/components/snow/Shell";
import { celebrate, updateGame, useGame } from "@/lib/game-store";
import { addHistory, redeemPromo } from "@/lib/game-logic";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { WITHDRAW_MIN_AMOUNT, WITHDRAW_MIN_FEE, withdrawFee, withdrawTotal } from "@/lib/wallet-config";
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
  const [sheet, setSheet] = useState<string | null>(null);
  const navigate = useNavigate();
  function open(t: string) {
    sfx.tap();
    if (t === "Wallet") setPanel("withdraw");
    else if (t === "My Referrals") void navigate({ to: "/events" });
    else setSheet(t);
  }
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
          <div key={l}><p className="text-xs text-ice/75">{l}</p>{v.endsWith(" IQ") ? <span className="reward-ember flex items-center justify-center gap-1 font-display text-xl"><Coin className="h-4 w-4" />{v.replace(" IQ", "")}</span> : <p className="text-3d text-xl">{v}</p>}</div>
        ))}
      </section>

      <div className="space-y-4">
        {rows.map(({ t, s, I, g }) => (
          <Button variant="ghost" key={t} onClick={() => open(t)} className="ice-panel grid h-auto w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center justify-normal gap-3 whitespace-normal p-2.5 text-left active:scale-[0.98]">
            <span className="ice-tile grid h-12 w-12 shrink-0 place-items-center"><span className={`grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br ${g} shadow-[inset_0_2px_0_oklch(1_0_0/0.5),0_2px_0_oklch(0_0_0/0.45)]`}><I size={18} /></span></span>
            <span className="min-w-0"><span className="block truncate text-3d">{t}</span><span className="block truncate text-xs text-ice/75">{s}</span></span>
            <ChevronRight className="text-crystal drop-shadow-[0_0_6px_var(--cyan)]" />
          </Button>
        ))}
      </div>

      <div className="mx-auto w-3/4"><Button variant="iceRose" className="h-12 w-full text-lg"><LogOut /> Logout</Button></div>

      <WalletDialog panel={panel} onClose={() => setPanel(null)} />
      <AccountSheet sheet={sheet} onClose={() => setSheet(null)} />
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
    updateGame((s) => addHistory(s, panel === "deposit" ? { label: "Deposit request (demo)", amount: value, pending: true } : { label: "Withdrawal request (demo)", amount: -total, pending: true }));
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
                  <p className="flex justify-between"><span className="text-crystal">Withdrawal fee (5%, min {WITHDRAW_MIN_FEE} IQ)</span><span className="reward-ember flex items-center gap-1 font-display">{validAmount ? <><Coin className="h-3.5 w-3.5" />{fee.toLocaleString("en-US")}</> : "—"}</span></p>
                  <p className="flex justify-between"><span className="text-crystal">Total deducted</span><span className="reward-ember flex items-center gap-1 font-display">{validAmount ? <><Coin className="h-3.5 w-3.5" />{total.toLocaleString("en-US")}</> : "—"}</span></p>
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

function AccountSheet({ sheet, onClose }: { sheet: string | null; onClose: () => void }) {
  const game = useGame();
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  function close() { setCode(""); setMsg(null); onClose(); }
  function redeem(el: Element) {
    let r = { reward: 0, error: undefined as string | undefined };
    updateGame((s) => { const x = redeemPromo(s, code); r = x; return x.state; });
    if (r.error) { setMsg({ ok: false, text: r.error }); return; }
    sfx.chime(); celebrate(r.reward, el, "__skip"); setMsg({ ok: true, text: `+${r.reward} added to your balance!` }); setCode("");
  }
  const bests = Object.entries(game.best ?? {});
  return (
    <Dialog open={sheet !== null} onOpenChange={(v) => { if (!v) close(); }}>
      <DialogContent className="ice-panel w-[calc(100%-32px)] max-w-sm gap-3 p-5">
        <DialogTitle className="text-3d text-center text-2xl">{sheet?.toUpperCase()}</DialogTitle>
        <DialogDescription className="text-center text-crystal">
          {sheet === "Promo Code" ? "Enter a code from our community channels" : sheet === "Transaction History" ? "Your latest rewards and requests" : sheet === "Achievements" ? "Your best run in each game" : sheet === "Settings" ? "Sound effects and menu wind" : "We're here to help"}
        </DialogDescription>
        {sheet === "Promo Code" && (
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); redeem(e.currentTarget); }}>
            <input value={code} onChange={(e) => { setCode(e.target.value.toUpperCase()); setMsg(null); }} placeholder="e.g. SNOW100" aria-label="Promo code" className="w-full rounded-lg border px-3 py-2.5 text-center font-display tracking-[0.2em] text-ice outline-none focus:border-cyan" />
            {msg && <p className={`text-center text-sm ${msg.ok ? "text-gold" : "text-crystal"}`}>{msg.text}</p>}
            <Button variant="iceAmber" type="submit" disabled={!code.trim()} className="h-11 w-full text-lg"><Gift />Redeem</Button>
          </form>
        )}
        {sheet === "Transaction History" && (
          <ul className="max-h-[50vh] space-y-2 overflow-y-auto">
            {(game.history ?? []).length === 0 && <li className="py-6 text-center text-sm text-crystal">No activity yet. Play a game or claim a task!</li>}
            {(game.history ?? []).map((h) => (
              <li key={h.id} className="ice-tile flex items-center justify-between gap-2 px-3 py-2 text-sm">
                <span className="min-w-0"><span className="block truncate text-ice">{h.label}</span><span className="text-xs text-crystal">{new Date(h.at).toLocaleString()}{h.pending ? " · Pending" : ""}</span></span>
                <span className="reward-ember flex shrink-0 items-center gap-1 font-display"><Coin className="h-3.5 w-3.5" />{h.amount > 0 ? "+" : ""}{h.amount.toLocaleString("en-US")}</span>
              </li>
            ))}
          </ul>
        )}
        {sheet === "Achievements" && (
          <ul className="space-y-2">
            {bests.length === 0 && <li className="py-6 text-center text-sm text-crystal">Finish a game run to set your first record.</li>}
            {bests.map(([g, v]) => <li key={g} className="ice-tile flex justify-between px-3 py-2 text-sm"><span className="flex items-center gap-2 text-ice"><Trophy size={16} className="text-gold" />{g}</span><span className="reward-ember flex items-center gap-1 font-display"><Coin className="h-3.5 w-3.5" />{v}</span></li>)}
          </ul>
        )}
        {sheet === "Settings" && <SettingsBody sound={game.sound} ambient={game.ambient} />}
        {sheet === "Help & Support" && (
          <div className="space-y-2 text-sm text-crystal">
            <p><strong className="text-ice">How do I earn?</strong> Play games, finish tasks, spin daily and keep your streak.</p>
            <p><strong className="text-ice">Withdrawals?</strong> Coming soon. Payouts are a demo right now.</p>
            <p><strong className="text-ice">Need more help?</strong> Ask in our community channels on the Home tab.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
