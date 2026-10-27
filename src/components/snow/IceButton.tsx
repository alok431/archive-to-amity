import type { ButtonHTMLAttributes, ReactNode } from "react";
import { ArrowLeft, Check, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Glyph = "close" | "check" | "back" | "left" | "right";
const glyphs: Record<Glyph, ReactNode> = {
  close: <X strokeWidth={4} />, check: <Check strokeWidth={4} />, back: <ArrowLeft strokeWidth={3.5} />,
  left: <ChevronLeft strokeWidth={4} />, right: <ChevronRight strokeWidth={4} />,
};

/** Cracked ice block with a snow cap and dripping icicles (game UI controls). */
export function IceButton({ glyph, children, wide, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { glyph?: Glyph; wide?: boolean }) {
  return (
    <button type="button" {...props} className={cn("ice-chunk", wide ? "ice-chunk-wide" : "ice-chunk-square", className)}>
      <span aria-hidden className="ice-chunk-snow" />
      <span className="relative z-[1] flex items-center justify-center gap-1.5">{glyph && glyphs[glyph]}{children}</span>
      <span aria-hidden className="ice-chunk-icicles" />
    </button>
  );
}
