# FTC Ultimate suite notes

The FTC Ultimate apps, Inventory, [Competition](https://github.com/HuskerTheCat/FTC_Ultimate_Competition) and [Design](https://github.com/HuskerTheCat/FTC_Ultimate_Design), share one Firebase project per team. This file lists what they share and what the other apps still have to copy. Finished changes are in [docs/SUITE-HISTORY.md](docs/SUITE-HISTORY.md) (no need to read it).

## Shared

- **Firebase project**: one per team, set up once from either app ([SETUP.md](SETUP.md)).
- **Accounts**: the project's Firebase Auth, email and password.
- **Team docs**: `team/info`, `team/owner`, `join/info`, `members/{uid}`. Same shapes and join flow in every app.
- **Join codes**: `<projectId>-<secret>`, link `#join=<code>`. Sign in by team number through the hub's `teams/{key}`.
- **Rules**: one `firestore.rules`, identical in every app's repo, since publishing replaces the whole file. Each app checks its own version number: Inventory `rulesVersion()`, Competition `scoutRulesVersion()`, Design `designRulesVersion()`.
- **Hub**: `ultimate-inventory-hub` ([hub.rules](hub.rules)). Team-level data only, never anything about a person.
- **Collection names**: Inventory's are unprefixed; Competition's start with `scout` (kept from its old name, Scout), Design's with `design`.
- **Brand**: the split cube logo, Orbitron for names, Saira for all other text (`@fontsource/saira`, weights 400-700), the topo background. App colors, dark mode / light mode: Inventory blue `#5b9bff` / `#2563d9`, Competition orange `#ffa53d` / `#c25f08`, Design green `#45d08f` / `#16804d`. The app switcher shows each app's name in Orbitron in its color. New screens in any app use these.

## Open for other apps

Add one line when a change needs the other apps to act; delete it once every app has it.

| Change | Who | Copy from |
|---|---|---|
| Rules v10 (v8: custom parts, `builds`, order `status`; v9: condition `'damaged'`; v10: part `damaged`/`broken` counts; includes v7) | Competition, Design | `validPart()`, `validBuild()`, `validOrder()`, `builds` match, log action `'made'`, `rulesVersion()` in Inventory's `firestore.rules` |
| Topo lines smooth with soft glow (2026-11-01): curves instead of straight segments, graded halo instead of one hard 5px halo | Competition, Design, if wanted | `src/topo.svg` (same file; Inventory's `/mnt/project-files/topo-sharper/smooth.mjs` regenerates it) |
| Buttons have no border; filled buttons use `--btn-shadow` (2026-11-01) | Competition, Design, if wanted | `--btn-shadow` in both themes, the `button:is(...)` shadow rule at the end of `src/style.css`, `#apps-toggle` and `button.icon` with a transparent border |
| Every button highlights on hover (2026-11-01) | Competition, Design, if wanted | the `@media (hover: hover)` block after `button:disabled` in `src/style.css` |
| Inventory screen uses the sign-in topo background (2026-11-02): gradient + full-page drifting lines on every screen | Competition, Design, if wanted | the `body`, `body::before`, `body::after` topo rules in `src/style.css` (replace the `:has(> #app > .center)` selectors with `body`, drop the separate faded inventory-header rule) |
| Brighter dark theme (2026-11-01): navy tones lifted | Competition, Design, if wanted | dark-theme color variables at the top of `src/style.css`, `--topo-from`/`--topo-to` in the two topo rules, `THEME_COLORS.dark` in `src/main.js`, theme-color in `index.html` |
| Update banner re-checks on resume and every 15 min (Windows/Android) | Competition, Design, only if they have the banner | `startStatusBanners` in `src/status.js` |
| ☰ → What's new: shows the repo's WHATS-NEW.md, blue dot until opened | Competition, Design, if wanted | `src/whatsnew.js`, `openWhatsNewDialog` + `.new-dot`/`.whats-new` styles, `raw.githubusercontent.com` in the CSP (`index.html`), `marked` as a dependency |
| Inventory skeleton only once someone is signed in (2026-11-02): signing in by team number no longer flashes it before the email/password screen | Competition, Design, if they show a loader before sign-in | `renderLoading()` moved from `start()` into `enterTeam` after `if (!user) return renderSignIn();` in `src/main.js` |
| Loading screen (turning cube) on every page load until the first screen is drawn, and the sign-in screen or skeleton drawn before Firebase has checked who is signed in (2026-11-02) | Competition, Design, if wanted | `public/switching.js` (no `ftc-ultimate-switching` flag; drop its `sessionStorage.setItem` in `src/switching.js`), `SIGNED_IN_KEY` in `start()`/`enterTeam` in `src/main.js` |
