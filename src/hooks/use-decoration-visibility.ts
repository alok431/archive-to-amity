import { useEffect } from "react";

/** Preserve visible effects, suspend only decorations nobody can see. */
export function useDecorationVisibility() {
  useEffect(() => {
    const observed = new Set<Element>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) entry.target.toggleAttribute("data-motion-paused", !entry.isIntersecting);
    });
    const scan = () => {
      document.querySelectorAll('.snowquest-shell [class*="animate-"], .snowquest-shell .header-prism, .snowquest-shell .btn-ice, .snowquest-shell .streak-today').forEach((el) => {
        if (!observed.has(el)) { observed.add(el); observer.observe(el); }
      });
      for (const el of observed) if (!el.isConnected) { observer.unobserve(el); observed.delete(el); }
    };
    const visibility = () => document.body.toggleAttribute("data-page-hidden", document.hidden);
    const mutations = new MutationObserver(scan);
    mutations.observe(document.querySelector(".snowquest-shell") ?? document.body, { childList: true, subtree: true });
    document.addEventListener("visibilitychange", visibility);
    scan(); visibility();
    return () => { observer.disconnect(); mutations.disconnect(); document.removeEventListener("visibilitychange", visibility); document.body.removeAttribute("data-page-hidden"); };
  }, []);
}