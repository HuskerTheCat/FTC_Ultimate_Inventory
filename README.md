<h1><picture><source media="(prefers-color-scheme: dark)" srcset="docs/brand-dark.png"><img src="docs/brand-light.png" alt="FTC Ultimate Inventory" height="76"></picture></h1>

The inventory tool for FTC teams. Track each part's name, part number, quantity, location, supplier and category, with live updates on every teammate's device.

- **Inventories and projects:** keep several inventories, and build robot projects from parts in any of them. Each part shows how many are free and which projects use it.
- **Packing lists:** check parts off as you pack for a competition. Packed parts show as in use.
- **Order list:** track parts on order. Tap **Arrived** to add one to the inventory.
- **QR labels:** print labels for bins and parts. Scanning one opens that bin or part.
- **Barcode scan and catalog:** scan a goBILDA, REV, AndyMark, ServoCity, TETRIX or Studica package, or type its part number, and the app fills in the name, supplier, category and link from a built-in offline catalog. You can also search the catalog by name when adding a part.
- **Organizing:** locations, units, condition, notes, links, grouping, sorting, subcategories (`Hardware/Screws`), tags and a printable sheet.
- **Low-stock alerts:** set **Low stock at** on a part and use the **Low stock** filter to list what's running out.
- **Trash:** deleted items stay in **Trash** for 30 days.
- **Import and export:** paste parts from Excel or Google Sheets, or export a CSV.
- **Team backups:** save everything to one `.inv` file and restore it later, or move to a new Firebase project.
- **Offline:** keep editing without wifi. Changes sync when you're back online.

**Get the app**

- **Try it:** [live demo](https://huskerthecat.github.io/FTC_Ultimate_Inventory/?demo) with sample parts, nothing saved.
- **Web:** [huskerthecat.github.io/FTC_Ultimate_Inventory](https://huskerthecat.github.io/FTC_Ultimate_Inventory/) works on any computer or phone and can be installed from Chrome or Edge.
- **Windows:** [download the installer](https://github.com/HuskerTheCat/FTC_Ultimate_Inventory/releases/latest/download/FTC-Ultimate-Inventory-Setup.exe)
- **Android:** [download the app](https://github.com/HuskerTheCat/FTC_Ultimate_Inventory/releases/latest/download/FTC-Ultimate-Inventory.apk)
- **iPhone and iPad:** [add the website to your Home Screen](SETUP.md#install-on-iphone-or-ipad)

**Guides**

- [Team setup](SETUP.md): one person, about 10 minutes. Each team stores its data in its own free Firebase project.
- [How to use it](docs/HOW-TO.md): every main feature, with pictures.
- [Quick start](docs/QUICK-START.md): one page to print for the shop.
- [Troubleshooting and FAQ](docs/TROUBLESHOOTING.md)
- [Team admin guide](docs/ADMIN.md)

<picture><source media="(prefers-color-scheme: dark)" srcset="docs/header/divider-dark.png"><img src="docs/header/divider-light.png" alt="" width="720"></picture>

## Screenshots

![Inventory on a computer](docs/screenshots/desktop-inventory.png)

<p>
  <img src="docs/screenshots/phone-inventory.png" alt="Inventory on a phone" width="260">
  <img src="docs/screenshots/phone-packing.png" alt="Packing list on a phone" width="260">
</p>

![A robot project with the parts it uses](docs/screenshots/desktop-project.png)

![Order list](docs/screenshots/desktop-orders.png)

![Low stock filter, spreadsheet import and CSV export](docs/screenshots/desktop-low-stock-csv.png)

<picture><source media="(prefers-color-scheme: dark)" srcset="docs/header/divider-dark.png"><img src="docs/header/divider-light.png" alt="" width="720"></picture>

## How it works

A plain JavaScript web app (`src/`), wrapped by Electron for Windows (`electron/`) and Capacitor for Android. It talks directly to the team's Firebase project: Firebase Auth for sign-in and Firestore for the data. [`firestore.rules`](firestore.rules) lets only team members read or write.

The supplier catalog ([`src/catalog.json`](src/catalog.json)) is built from each supplier's public product data by [`.github/scripts/build-catalog.mjs`](.github/scripts/build-catalog.mjs). The **Update part catalog** workflow rebuilds it every Monday and republishes the website. The Windows and Android apps download the newest catalog on start and fall back to the one they shipped with when offline.

[![Part catalog last changed](https://img.shields.io/github/last-commit/HuskerTheCat/FTC_Ultimate_Inventory/main?path=src%2Fcatalog.json&label=part%20catalog%20last%20changed)](https://github.com/HuskerTheCat/FTC_Ultimate_Inventory/commits/main/src/catalog.json)
[![Update part catalog](https://github.com/HuskerTheCat/FTC_Ultimate_Inventory/actions/workflows/catalog.yml/badge.svg)](https://github.com/HuskerTheCat/FTC_Ultimate_Inventory/actions/workflows/catalog.yml)

Run it by hand: [Update part catalog](https://github.com/HuskerTheCat/FTC_Ultimate_Inventory/actions/workflows/catalog.yml)

<picture><source media="(prefers-color-scheme: dark)" srcset="docs/header/divider-dark.png"><img src="docs/header/divider-light.png" alt="" width="720"></picture>

## Privacy

The app logs only each new team's name and number, bug reports and feature requests to a separate central Firebase project ([`src/hub.js`](src/hub.js), [`hub.rules`](hub.rules)). Nothing about individual users is sent. See the [privacy policy](PRIVACY.md).

<picture><source media="(prefers-color-scheme: dark)" srcset="docs/header/divider-dark.png"><img src="docs/header/divider-light.png" alt="" width="720"></picture>

## Development

```sh
npm install
npm run dev          # web app at http://localhost:5173
npm run emulators    # local Firebase (needs Java)
npm run desktop      # run the Windows/desktop app
```

For the local emulators, create a team with a config whose `projectId` starts with `demo-`:

```
apiKey: "x", authDomain: "x", projectId: "demo-inventory", appId: "x"
```

Pushing to `main` publishes the website. The **Build apps** workflow builds the Windows installer and Android APK and attaches them to a release.

<picture><source media="(prefers-color-scheme: dark)" srcset="docs/header/divider-dark.png"><img src="docs/header/divider-light.png" alt="" width="720"></picture>

## License

Copyright (C) 2026 HuskerTheCat. Licensed under the [GNU AGPL v3](LICENSE): modified versions, including hosted ones, must publish their source under the same license.
