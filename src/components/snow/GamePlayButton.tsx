import { Play } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function GamePlayButton({ className, children = "PLAY", ...props }: ButtonProps) {
  return <Button variant="icePlay" size="lg" {...props} className={cn("w-full", className)}>
    <Play aria-hidden fill="currentColor" strokeWidth={1.5} />{children}
  </Button>;
}