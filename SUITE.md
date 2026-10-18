# FTC Ultimate suite notes

The FTC Ultimate apps, Inventory, [Scout](https://github.com/HuskerTheCat/FTC_Ultimate_Scout) and [Design](https://github.com/HuskerTheCat/FTC_Ultimate_Design), share one Firebase project per team. This file lists what they share and logs changes that affect the other apps. Read the other apps' `SUITE.md` before changing anything below, and add a dated line to every app's file when you do.

## Shared

- **Firebase project**: one per team, set up once from either app ([SETUP.md](SETUP.md)).
- **Accounts**: the project's Firebase Auth, email and password.
- **Team docs**: `team/info`, `team/owner`, `join/info`, `members/{uid}`. Same shapes and join flow in every app.
- **Join codes**: `<projectId>-<secret>`, link `#join=<code>`. Sign in by team number through the hub's `teams/{key}`.
- **Rules**: one `firestore.rules`, identical in every app's repo, since publishing replaces the whole file. Each app checks its own version number: Inventory `rulesVersion()`, Scout `scoutRulesVersion()`, Design `designRulesVersion()`.
- **Hub**: `ultimate-inventory-hub` ([hub.rules](hub.rules)). Team-level data only, never anything about a person.
- **Collection names**: Inventory's are unprefixed; Scout's start with `scout`, Design's with `design`.
- **Brand**: the split cube logo (Inventory blue, Scout orange, Design green), Orbitron for names, the topo background.

## Changes

- 2026-10-18: Suite notes started. Inventory rules version 5; Scout's and Design's sections not in the rules file yet.
