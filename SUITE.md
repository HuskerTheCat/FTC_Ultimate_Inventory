# FTC Ultimate suite notes

The FTC Ultimate apps, Inventory, [Competition](https://github.com/HuskerTheCat/FTC_Ultimate_Competition) and [Design](https://github.com/HuskerTheCat/FTC_Ultimate_Design), share one Firebase project per team. This file lists what they share and what the other apps still have to copy. Finished changes are in [docs/SUITE-HISTORY.md](docs/SUITE-HISTORY.md) (no need to read it).

## Shared

- **Firebase project**: one per team, set up once from either app ([SETUP.md](SETUP.md)).
- **Accounts**: the project's Firebase Auth, email and password.
- **Team docs**: `team/info`, `team/owner`, `join/info`, `members/{uid}`. Same shapes and join flow in every app.
- **Join codes**: `<projectId>-<secret>`, link `#join=<code>`. Sign in by team number through the hub's `teams/{key}`.
- **Rules**: one `firestore.rules`, byte-for-byte identical in every app's repo, since publishing replaces the whole file. Whoever changes it copies the whole file into every other app's repo in the same change (never only your own section), so publishing from any app gives the team every app's rules. Each app checks its own version number in that file: Inventory `rulesVersion()`, Competition `scoutRulesVersion()`, Design `designRulesVersion()`. Current: Inventory 10, Competition 7 (2026-11-15).
- **Hub**: `ultimate-inventory-hub` ([hub.rules](hub.rules)). Team-level data only, never anything about a person.
- **Collection names**: Inventory's are unprefixed; Competition's start with `scout` (kept from its old name, Scout), Design's with `design`.
- **Brand**: the split cube logo, Orbitron for names, Saira for all other text (`@fontsource/saira`, weights 400-700), the topo background. App colors, dark mode / light mode: Inventory blue `#5b9bff` / `#2563d9`, Competition orange `#ffa53d` / `#c25f08`, Design green `#45d08f` / `#16804d`. The app switcher shows each app's name in Orbitron in its color. New screens in any app use these.

## Open for other apps

Add one line when a change needs the other apps to act; delete it once every app has it.

| Change | Who | Copy from |
|---|---|---|
| Topo lines smooth with soft glow (2026-11-01), drawn fast (2026-11-02): curves instead of straight segments, a ready-blurred glow image, the lines file cut into small pieces and repeated 16 times inside (Chrome redraws a full-page lines layer far less, and long pages stay sharp) | Competition, Design, if wanted | `src/topo.svg` and `src/topo-glow.webp` (same files; Inventory's `/mnt/project-files/topo-fast/build.mjs` rebuilds them), the two-layer `mask` in the `body::after` and `#switching::before` rules of `src/style.css`, the glow's preload in `index.html`, and `CONTOURS` in `src/labels.js` if they draw the map's paths |
| Buttons have no border; filled buttons use `--btn-shadow` (2026-11-01) | Competition, Design, if wanted | `--btn-shadow` in both themes, the `button:is(...)` shadow rule at the end of `src/style.css`, `#apps-toggle` and `button.icon` with a transparent border |
| Every button highlights on hover (2026-11-01) | Competition, Design, if wanted | the `@media (hover: hover)` block after `button:disabled` in `src/style.css` |
| Inventory screen uses the sign-in topo background (2026-11-02): gradient + full-page drifting lines on every screen | Competition, Design, if wanted | the `body`, `body::before`, `body::after` topo rules in `src/style.css` (replace the `:has(> #app > .center)` selectors with `body`, drop the separate faded inventory-header rule) |
| Brighter dark theme (2026-11-01): navy tones lifted | Competition, Design, if wanted | dark-theme color variables at the top of `src/style.css`, `--topo-from`/`--topo-to` in the two topo rules, `THEME_COLORS.dark` in `src/main.js`, theme-color in `index.html` |
| Update banner re-checks on resume and every 15 min (Windows/Android) | Competition, Design, only if they have the banner | `startStatusBanners` in `src/status.js` |
| ☰ → What's new: shows the repo's WHATS-NEW.md, blue dot until opened | Competition, Design, if wanted | `src/whatsnew.js`, `openWhatsNewDialog` + `.new-dot`/`.whats-new` styles, `raw.githubusercontent.com` in the CSP (`index.html`), `marked` as a dependency |
