import { useState } from "react";
import { Megaphone, Percent, MessagesSquare, Send, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import chest from "@/assets/chest.webp";

const channels = [
  { title: "Official Announcements", tag: "NEWS", detail: "Daily news & official updates", Icon: Megaphone, tint: "community-news" },
  { title: "Cashout Proof", tag: "PROOF", detail: "Withdrawal proofs & payments", Icon: null, tint: "community-proof" },
  { title: "Promo Code & Drops", tag: "BONUS", detail: "Free codes & secret drops", Icon: Percent, tint: "community-bonus" },
  { title: "Global Community", tag: "LIVE", detail: "Strategy, discussion & support", Icon: MessagesSquare, tint: "community-live" },
];
export function CommunityCards() {
  const [selected, setSelected] = useState<string | null>(null);
  return <section className="space-y-4 pt-2">
    <div className="flex items-center gap-3"><span className="ice-tile grid h-12 w-12 shrink-0 place-items-center text-cyan"><Send size={25} /></span><div><h2 className="text-3d text-xl">OFFICIAL COMMUNITY</h2><p className="text-xs text-crystal">Updates · Proofs · Drops · Support</p></div></div>
    <div className="grid grid-cols-2 gap-x-4 gap-y-5">
      {channels.map(({ title, tag, detail, Icon, tint }) => <article key={title} className={`ice-panel community-card ${tint} flex min-w-0 flex-col p-3`}>
        <div className="community-emblem mx-auto mb-2 grid h-16 w-16 place-items-center">{Icon ? <Icon size={34} /> : <img src={chest} alt="Frozen treasure chest" className="h-16 w-16 object-contain" />}</div>
        <span className="community-tag self-start text-[10px] font-semibold">{tag}</span>
        <h3 className="text-3d mt-2 min-h-10 text-base leading-5">{title}</h3>
        <p className="mb-4 mt-1 flex-1 text-xs leading-4 text-crystal">{detail}</p>
        <Button variant="ice" className="h-9 w-full gap-1 px-1 text-xs" onClick={() => setSelected(title)}><Send />Join Channel<ChevronRight /></Button>
      </article>)}
    </div>
    <Dialog open={selected !== null} onOpenChange={(v) => { if (!v) setSelected(null); }}><DialogContent className="ice-panel w-[calc(100%-32px)] max-w-sm"><DialogTitle className="text-3d">{selected}</DialogTitle><DialogDescription className="text-crystal">This community channel isn’t connected yet. The join link will be available when the official channel is added.</DialogDescription><Button variant="ice" onClick={() => setSelected(null)}>Got it</Button></DialogContent></Dialog>
  </section>;
}