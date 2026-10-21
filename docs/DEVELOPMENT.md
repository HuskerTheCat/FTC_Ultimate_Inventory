# Development

A plain JavaScript web app (`src/`), wrapped by Electron for Windows (`electron/`) and Capacitor for Android. It talks directly to the team's Firebase project: Firebase Auth for sign-in and Firestore for the data. [`firestore.rules`](../firestore.rules) lets only team members read or write.

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

Pushing to `main` publishes the website. The build also turns the guides (README and the other `.md` files) into pages on the website ([`vite-guides.js`](../vite-guides.js)), so edit the `.md` files only. The **Build apps** workflow builds the Windows installer and Android APK and attaches them to a release. It signs the APK with the key in the repo secrets `ANDROID_KEYSTORE` (the base64 of `release.jks`, alias `release`) and `ANDROID_KEYSTORE_PASSWORD`, so every release installs over the last one.

## Part catalog

[`src/catalog.json`](../src/catalog.json) is built from each supplier's public product data by [`.github/scripts/build-catalog.mjs`](../.github/scripts/build-catalog.mjs). The [Update part catalog](https://github.com/HuskerTheCat/FTC_Ultimate_Inventory/actions/workflows/catalog.yml) workflow rebuilds it every Monday and republishes the website. The Windows and Android apps download the newest catalog on start and fall back to the one they shipped with when offline.

[![Part catalog last changed](https://img.shields.io/github/last-commit/HuskerTheCat/FTC_Ultimate_Inventory/main?path=src%2Fcatalog.json&label=part%20catalog%20last%20changed)](https://github.com/HuskerTheCat/FTC_Ultimate_Inventory/commits/main/src/catalog.json)
[![Update part catalog](https://github.com/HuskerTheCat/FTC_Ultimate_Inventory/actions/workflows/catalog.yml/badge.svg)](https://github.com/HuskerTheCat/FTC_Ultimate_Inventory/actions/workflows/catalog.yml)

## Central server

The app logs only each new team's name and number, bug reports and feature requests to a separate central Firebase project ([`src/hub.js`](../src/hub.js), [`hub.rules`](../hub.rules)). See the [privacy policy](../PRIVACY.md).
