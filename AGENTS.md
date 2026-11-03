<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- Shared app frame (header, bottom nav, snowfall) lives in src/components/snow/Shell.tsx and wraps <Outlet /> in __root; pages only render their content.
- Shared icy perimeters and material tints live in global CSS; new ice actions use the UI Button's ice variants so rims and interaction states stay consistent.
- Shared ice surfaces use a nine-slice transparent painted frame through CSS border-image; keep decorations pointer-transparent and preserve content space so snow and icicles never cover controls.
- Load artwork on its owning screen and cache only the active game's decoded sprites until exit; retain intent-based tab preloading to keep navigation quick without downloading the whole asset library.
- Display bundled artwork through resized WebP derivatives; preserve original source images for future edits while keeping downloads small.
- Watch configuration is separate from its presentation so block count and ad limits can be tested; without an ad provider, never simulate completed views or credit rewards.
- Pre-optimize the route-split Watch dialog alongside React at Vite startup to avoid a late optimizer refresh mixing React module versions in an open preview.
- Keep spin outcomes in a pure shared configuration module, separate from the wheel dialog, so the pointer and credited demo reward use the same selection.
- Community cards without configured destinations show an unavailable-link dialog; never invent official URLs.
- Keep Blizzard Striker balancing, enemy volley ports/delays and plane progression in a pure shared configuration module used by gameplay and tests, so attack patterns, upgrades and difficulty stay consistent.
- Use GamePlayButton backed by the UI Button icePlay variant for arcade launch, start and replay controls, so all game entry actions share one clean ice treatment.
- Use the shared frame scheduler for canvas games and visibility observation for shell decorations, so hidden or paused screens do not consume animation frames.
