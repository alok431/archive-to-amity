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
  return <section className="space-y-3 pt-2">
    <div className="flex items-center gap-2.5"><span className="ice-tile grid h-10 w-10 shrink-0 place-items-center text-cyan"><Send size={20} /></span><div><h2 className="text-3d text-lg">OFFICIAL COMMUNITY</h2><p className="text-[10px] text-crystal">Updates · Proofs · Drops · Support</p></div></div>
    <div className="grid grid-cols-2 gap-x-3.5 gap-y-4">
      {channels.map(({ title, tag, detail, Icon, tint }) => <article key={title} className={`ice-panel community-card ${tint} flex min-w-0 flex-col p-2`}>
        <div className="flex items-center gap-2">
          <div className="community-emblem grid h-11 w-11 shrink-0 place-items-center">{Icon ? <Icon size={22} /> : <img src={chest} alt="Frozen treasure chest" className="h-10 w-10 object-contain" />}</div>
          <div className="min-w-0">
            <span className="community-tag text-[9px] font-semibold">{tag}</span>
            <h3 className="text-3d mt-0.5 truncate text-sm leading-4">{title}</h3>
          </div>
        </div>
        <p className="mb-2 mt-1.5 flex-1 truncate text-[10px] leading-3.5 text-crystal">{detail}</p>
        <Button variant="ice" className="h-7 w-full gap-1 px-1 text-[10px]" onClick={() => setSelected(title)}><Send size={12} />Join<ChevronRight size={12} /></Button>
      </article>)}
    </div>
    <Dialog open={selected !== null} onOpenChange={(v) => { if (!v) setSelected(null); }}><DialogContent className="ice-panel w-[calc(100%-32px)] max-w-sm"><DialogTitle className="text-3d">{selected}</DialogTitle><DialogDescription className="text-crystal">This community channel isn’t connected yet. The join link will be available when the official channel is added.</DialogDescription><Button variant="ice" onClick={() => setSelected(null)}>Got it</Button></DialogContent></Dialog>
  </section>;
}