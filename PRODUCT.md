# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

One Vite site, also shipped as a Windows app (Electron) and an Android app (Capacitor). iPhone and iPad use the website added to the Home Screen; there is no native iOS app. On phones the parts table becomes cards.

## Users

Students on an FTC robotics team, of any role and experience, tracking parts in the shop and at competitions on phones and shop computers. One owner per team (usually a student or a mentor) sets the team up, invites members and manages the Firebase rules.

## Product Purpose

Track a team's parts on every teammate's phone and computer, with live updates: what the team has, where it is, what's in use by which project, and what needs ordering or making. Success is a teammate finding or updating a part in a few taps without asking anyone.

## Positioning

- Free and open source (AGPL v3).
- Each team runs its own Firebase project, so the developer never sees team data. Only team-level lookup info (name, program, number, project ID) goes to the central hub.
- Works the same on web, Windows and Android.
- Built-in supplier catalog (goBILDA, REV, AndyMark, ServoCity, TETRIX, Studica, SWYFT, Axon, Limelight, The Thrifty Bot) fills in part details.
- One of three FTC Ultimate apps sharing one Firebase project per team: Inventory, Competition (match scouting) and Design.

## Operating Context

- Teammates join by link or QR code, or sign in on a new device by program and team number.
- Shop use: scanning QR bin labels and supplier package barcodes, quick −/+ quantity changes, printed QR labels and inventory sheets, a printed quick-start poster.
- Inventories, projects and packing lists; order list and make list; locations; change log, Undo and Trash; CSV import/export and backups.

## Capabilities and Constraints

- Shared suite contract lives in `SUITE.md` (team docs, join codes, one shared `firestore.rules`, hub, collection names, brand). Changes affecting the other apps get logged there.
- Docs and guides live in `docs/` and are published to GitHub Pages; a demo runs at `?demo` with no setup.

## Brand Commitments

- Split cube logo; Orbitron for names, Saira for all other text (weights 400-700).
- Inventory blue: `#5b9bff` in dark mode, `#2563d9` in light mode. Sibling apps: Competition orange, Design green.
- Dark mode by default, plus light mode.
- Thin topo-line background.
- Plain, direct voice. Nothing that looks AI-generated.

## Evidence on Hand

- Screenshots and guide images in `docs/` (hero, how-to, help, header banners in dark and light).
- No testimonials, user counts or team stats exist; don't invent any.

## Product Principles

1. Speed in the shop: the common action (find a part, take one, put some back) is a couple of taps.
2. The team owns its data; never design anything that implies the developer can see it.
3. Same app everywhere; differences between devices are layout, not features.
4. Consistency with the suite: new screens follow the shared brand so the three apps feel like one family.
