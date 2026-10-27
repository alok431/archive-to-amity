import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Play, Globe, Send, Gamepad2, ClipboardList, Gift, Check, Loader2 } from "lucide-react";
import chest from "@/assets/chest.webp";
import { Chips, Reward } from "@/components/snow/Shell";
import { Button } from "@/components/ui/button";
import { WatchAds } from "@/components/snow/WatchAds";
import { TASK_VERIFY_SECONDS, claimTask, setTask } from "@/lib/game-logic";
import { celebrate, updateGame, useGame } from "@/lib/game-store";
import { sfx } from "@/lib/sfx";

function TaskAction({ id, reward }: { id: string; reward: number }) {
  const status = useGame().tasks[id] ?? "idle";
  const [left, setLeft] = useState(TASK_VERIFY_SECONDS);
  useEffect(() => {
    if (status !== "verifying") return;
    setLeft(TASK_VERIFY_SECONDS);
    const t = setInterval(() => setLeft((n) => {
      if (n <= 1) { clearInterval(t); updateGame((s) => setTask(s, id, "claim")); sfx.tap(); return 0; }
      return n - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [status, id]);
  if (status === "done") return <span className="ice-glyph grid h-9 w-9 place-items-center rounded-full" aria-label="Completed"><Check size={18} strokeWidth={4} /></span>;
  if (status === "verifying") return <Button variant="iceEmerald" disabled className="px-3 py-1.5 tabular-nums"><Loader2 className="animate-spin" />{left}s</Button>;
  if (status === "claim") return (
    <Button variant="iceAmber" className="streak-today px-3 py-1.5" onClick={(e) => {
      const el = e.currentTarget; let got = 0;
      updateGame((s) => { const r = claimTask(s, id, reward); got = r.reward; return r.state; });
      sfx.chime(); celebrate(got, el);
    }}>Claim</Button>
  );
  return <Button variant="iceEmerald" className="px-3 py-1.5" onClick={() => { sfx.tap(); updateGame((s) => setTask(s, id, "verifying")); }}>Start</Button>;
}

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "Quest Center — SnowQuest" },
      { name: "description", content: "Complete daily quests, offers and promo codes to earn IQ in SnowQuest." },
      { property: "og:title", content: "Quest Center — SnowQuest" },
      { property: "og:description", content: "Complete daily quests and offers to earn IQ." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Tasks,
});

const XIcon = (p: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={p.size} height={p.size} fill="currentColor"><path d="M17.5 3h3.1l-6.8 7.8 8 10.2h-6.3l-4.9-6.4L5 21H1.9l7.3-8.3L1.6 3h6.4l4.4 5.9L17.5 3Zm-1.1 16.2h1.7L7.2 4.7H5.4l11 14.5Z" /></svg>
);

const tasks = [
  { t: "Watch Ad", d: "Watch 30 sec video", r: 50, I: Play, c: "Watch", g: "from-royal to-primary" },
  { t: "Visit Website", d: "Explore for 30 sec", r: 80, I: Globe, c: "Offers", g: "from-primary to-frost" },
  { t: "Join Telegram", d: "Join our channel", r: 100, I: Send, c: "Follow", g: "from-cyan to-primary" },
  { t: "Follow on X", d: "Follow our page", r: 100, I: XIcon, c: "Follow", g: "from-deep to-background" },
  { t: "Play Game", d: "Play 2 minutes", r: 150, I: Gamepad2, c: "Daily", g: "from-royal to-[oklch(0.4_0.2_290)]" },
  { t: "Complete Survey", d: "Answer survey", r: 200, I: ClipboardList, c: "Offers", g: "from-royal to-primary" },
];

function Tasks() {
  const [view, setView] = useState<"watch" | "tasks">("watch");
  const [cat, setCat] = useState("All");
  const list = tasks.filter((t) => cat === "All" || t.c === cat || (cat === "Daily" && t.c !== "Offers"));
  return (
    <>
      <div className="quest-switch grid grid-cols-2 gap-2 p-1.5" role="tablist" aria-label="Quest views">
        <Button variant={view === "watch" ? "iceViolet" : "ghost"} role="tab" aria-selected={view === "watch"} aria-controls="watch-panel" id="watch-tab" className="h-11 text-lg" onClick={() => setView("watch")}><Play fill="currentColor" />Watch</Button>
        <Button variant={view === "tasks" ? "iceEmerald" : "ghost"} role="tab" aria-selected={view === "tasks"} aria-controls="tasks-panel" id="tasks-tab" className="h-11 text-lg" onClick={() => setView("tasks")}><ClipboardList />Tasks</Button>
      </div>
      <div id="watch-panel" role="tabpanel" aria-labelledby="watch-tab" hidden={view !== "watch"} className="space-y-4"><WatchAds /></div>
      <div id="tasks-panel" role="tabpanel" aria-labelledby="tasks-tab" hidden={view !== "tasks"} className="space-y-4">
      <Chips items={["All", "Daily", "Offers", "Watch", "Follow"]} active={cat} onChange={setCat} />
      <div className="space-y-4">
        {list.map(({ t, d, r, I, g }) => (
          <div key={t} className="ice-panel grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-3 p-2.5">
            <span className="ice-tile grid h-12 w-12 shrink-0 place-items-center"><span className={`grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br ${g} shadow-[inset_0_2px_0_oklch(1_0_0/0.5),0_2px_0_oklch(0_0_0/0.45)]`}><I size={18} /></span></span>
            <div className="min-w-0">
              <p className="truncate text-3d">{t}</p>
              <p className="truncate text-xs text-ice/75">{d}</p>
            </div>
            <Reward v={r} />
            <TaskAction id={t} reward={r} />
          </div>
        ))}
      </div>

      <section className="ice-panel panel-crystal snow-cap relative overflow-hidden !border-royal bg-gradient-to-r from-royal/70 via-[oklch(0.3_0.15_280)] to-primary/60 p-4">
        <div className="relative z-[1] max-w-[60%]">
          <p className="font-display text-gold">SPECIAL OFFERS</p>
          <p className="font-display text-3xl leading-tight text-gold-grad">3X REWARDS</p>
          <p className="text-3d">Limited Time Only!</p>
        </div>
        <img src={chest} alt="Treasure chest" className="absolute -right-2 bottom-0 h-32 w-32 animate-floaty object-contain" />
      </section>

      <section className="ice-panel p-3">
        <div className="flex items-center gap-3">
          <span className="ice-tile grid h-12 w-12 shrink-0 place-items-center"><Gift size={24} className="text-gold" /></span>
          <div><p className="text-3d text-lg">Promo Code</p><p className="text-xs text-ice/75">Enter promo code to get bonus</p></div>
        </div>
        <form className="mt-3 flex gap-2" onSubmit={(e) => e.preventDefault()}>
          <input placeholder="Enter code here" className="min-w-0 flex-1 rounded-xl border-2 border-frost bg-background/90 px-3 py-2 text-sm shadow-[inset_0_3px_6px_oklch(0_0_0/0.6)] outline-none focus:border-cyan focus:shadow-[inset_0_3px_6px_oklch(0_0_0/0.6),0_0_12px_var(--cyan)]" />
          <Button variant="iceEmerald" type="submit" className="h-auto px-4">Redeem</Button>
        </form>
      </section>
      </div>
    </>
  );
}
