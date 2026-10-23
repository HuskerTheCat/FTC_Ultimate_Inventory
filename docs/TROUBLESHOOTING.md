<h1><picture><source media="(prefers-color-scheme: dark)" srcset="header/troubleshooting-dark.png"><img src="header/troubleshooting-light.png" alt="Troubleshooting and FAQ" width="720"></picture></h1>

What each banner and message means, and how to fix it. **Banners** stay at the top until the problem is fixed or you close them. **Messages** show in red for about 10 seconds.

Examples use the team **12345 Example Team**; your app shows your own.

**Contents**

1. [Banners](#banners)
2. [Joining a team](#joining-a-team)
3. [Signing in](#signing-in)
4. [Setting up a team (admins)](#setting-up-a-team-admins)
5. [Using the app](#using-the-app)
6. [Installing and updating](#installing-and-updating)
7. [Still stuck?](#still-stuck)

---

<picture><source media="(prefers-color-scheme: dark)" srcset="header/divider-dark.png"><img src="header/divider-light.png" alt="" width="720"></picture>

## Banners

### Offline

![Offline. Changes sync when you reconnect.](help/offline-banner.png)

No internet. Keep working: changes are saved on the device and sent when it's back online. Signing in and joining need the internet.

### New version available

![New version available. Refresh →](help/update-banner.png)

- **Website:** tap **New version available. Refresh →**.
- **Windows and Android:** tap **Update available (v0.6.0). Download →**, then install the new installer or APK over the old app. See [Installing and updating](#installing-and-updating).

Your inventory lives in your team's Firebase project, so updating never loses it.

### News

![A news message from the app's developer](help/news-banner.png)

A message from the developer to every team, such as planned downtime. Tap **×** to close it until the next message.

### Firebase rules out of date

![Firebase rules out of date. How to update →](help/rules-banner.png)

New features need newer security rules in your team's Firebase project. Only your admin can fix it: tap the banner for the steps, or send them [Updating the rules](../SETUP.md#updating-the-rules). No data changes. Until then, new features may fail with **The server didn't allow that change**.

### Your Firebase isn’t secure

![Your Firebase isn’t secure. How to fix →](help/open-rules-banner.png)

Your Firebase project isn't using the app's rules (for example, test mode), so anyone could read your inventory and members' emails. Your admin should publish the rules right away: tap the banner or see [Updating the rules](../SETUP.md#updating-the-rules).

### Demo only

**Demo only. Set up your team →** means you're in the demo: sample parts, nothing saved. Tap it to join or set up your team.

---

---

<picture><source media="(prefers-color-scheme: dark)" srcset="header/divider-dark.png"><img src="header/divider-light.png" alt="" width="720"></picture>

## Joining a team

### "That join code is not valid. Ask your team admin to copy it again."

The code was mistyped or cut off. Have your admin use **Copy** on the **Team** screen, or scan the QR code with **Scan QR**.

### "No team found. Ask your team admin for the join code."

No team matches that code or number. Check it with your admin. Admins: make sure you [created the team](../SETUP.md#5-create-your-team-in-the-app) and [published the rules](../SETUP.md#3-create-the-database).

### "You're not on 12345 Example Team. Ask your team admin for the join code."

**Sign in to your team** is for existing members. If you're new, choose **Use a different team**, then **New to the team?** with the join code.

### "Couldn't join 12345 Example Team. Ask your team admin for a fresh join code."

The code is old: it changes when the admin resets it or removes someone. Get the current one from the **Team** screen. If it is current, update the app.

### "Check your email" won't go away, or the email never came.

Check spam or junk: the email comes from your team's Firebase project. Tap **Send it again** if it's missing. After you open the link, the app moves on within seconds. Wrong address? Tap **Use a different email** and create the account again.

### "You no longer have access to 12345 Example Team."

The admin removed you. If that was a mistake, get the current join code, join again, and use **Sign in** (not **Create account**) with your old email and password.

### "Accept the privacy policy to create an account."

Tick the box under the password. Everyone ticks it once when they join a team.

### I joined from the link in Safari, but the Home Screen app asks me to join again.

The Home Screen app has its own sign-in. Join inside it with **Scan QR** or the join code. See [Install on iPhone or iPad](../SETUP.md#install-on-iphone-or-ipad).

### I'm on the wrong team, or want to switch teams.

Use **☰ → Sign out**, then **Use a different team**.

---

<picture><source media="(prefers-color-scheme: dark)" srcset="header/divider-dark.png"><img src="header/divider-light.png" alt="" width="720"></picture>

## Signing in

### "There's already an account with that email. Sign in instead."

You already have an account, maybe from an earlier season. Tap **Sign in**. Forgot the password? See the next entry.

### "Wrong email or password."

Check for typos (tap **Show**). To reset, type your email and tap **Forgot password?**. Check spam if the email doesn't arrive.

### "Too many tries. Wait a few minutes, then try again."

Firebase pauses sign-in after several wrong passwords. Wait, or use **Forgot password?**.

### "Can't reach the server. Check your internet connection."

If other websites work, the network may block Firebase (some school networks do). Try another network.

### "FTC team 12345 can't sign in by number yet. Join with your team's join code instead. Team admins can sign in from Set up a new team."

Your team isn't on the central list yet. Until the admin fixes it, use **New to the team?** with the join code, then **Sign in**.

Admins: on a device that's signed in to the team, open the app online. Otherwise choose **Start setup**, enter your team number, paste your `firebaseConfig` and click **Create team**. The app sees the team exists: click **Sign in to it** and sign in. Your team goes back on the list.

---

<picture><source media="(prefers-color-scheme: dark)" srcset="header/divider-dark.png"><img src="header/divider-light.png" alt="" width="720"></picture>

## Setting up a team (admins)

### "Email sign-in isn't turned on in this team's Firebase project."

[Setup step 2](../SETUP.md#2-turn-on-email-sign-in) was skipped. Tap **Open Authentication**, choose **Email/Password**, switch it on and click **Save**.

### "Your Firebase project doesn't have the app's rules yet (setup step 3)."

Publish the app's rules ([setup step 3](../SETUP.md#3-create-the-database)), then tap **Sign in** with the email and password you just used.

### "Couldn't find "apiKey" in the pasted Firebase config."

Paste the whole `firebaseConfig = { ... }` block from [setup step 4](../SETUP.md#4-copy-your-connection-info).

### Create team lists steps to fix.

Each line names a missed [setup step](../SETUP.md); **Fix it in Firebase** opens the right page:

- **Email/Password sign-in isn't turned on:** [step 2](../SETUP.md#2-turn-on-email-sign-in).
- **There's no Firestore database yet:** [step 3](../SETUP.md#3-create-the-database). Use Firestore, not Realtime Database.
- **The app's rules aren't published yet**, or **the published rules let anyone read your inventory (test mode):** click **Copy rules**, paste them in the database's **Rules** tab and click **Publish**.
- **The pasted connection info doesn't match a Firebase project:** copy the `firebaseConfig` block again ([step 4](../SETUP.md#4-copy-your-connection-info)).
- **This Firebase project already has a team:** click **Sign in to it** and sign in.

Then click **Create team** again.

### "FTC team 12345 is already on the central server's team list, so teammates can't sign in by team number."

Another team registered that number, or the wrong number was typed. Join codes still work. Use **☰ → Report bug** with your team number.

---

<picture><source media="(prefers-color-scheme: dark)" srcset="header/divider-dark.png"><img src="header/divider-light.png" alt="" width="720"></picture>

## Using the app

### "The server didn't allow that change. If the app was just updated, ask your team admin to publish the latest firestore.rules."

Your rules are older than the app. Your admin needs to [update them](../SETUP.md#updating-the-rules).

### "That needs an internet connection. Try again once you're back online."

This device hasn't saved the data for offline use. Try again once the Offline banner is gone.

### "Camera access is blocked" or "No camera found on this device"

Allow camera access. If you said no before: in Chrome or Edge, tap the icon left of the address; on Android, **Settings → Apps → FTC Ultimate Inventory → Permissions**; on Windows, **Settings → Privacy & security → Camera**. Close other apps using the camera. **No camera found** means the device has none: scan with your phone instead.

### "Couldn't load the scanner. Check your internet connection and try again."

Get back online and tap **Scan** again.

### "That label's part isn't in this team's inventory anymore."

The part was deleted, or the label is from another team. Check **☰ → Trash**. A label for a deleted inventory or project says **That label's project isn't in this team anymore.**

### "The Android app can't save files. Export from the website or the Windows app."

Export CSV and Export backup work only on the website and in the Windows app. Restore backup works on Android too.

### "parts.csv isn’t an inventory backup. Choose a .inv file made with Export backup."

Restore backup only opens `.inv` files from **☰ → Export backup**. For a spreadsheet or CSV, use **⋯ → Import spreadsheet**. See [Import, export and backups](HOW-TO.md#9-import-export-and-backups).

### "12345 Example Team backup.inv was made by a newer version of the app. Update the app, then restore it."

Update the app ([Installing and updating](#installing-and-updating)), then restore again.

### "Restoring a backup needs an internet connection."

Try again once the Offline banner is gone.

### Restoring says the team already has everything, but my numbers are different.

**Add** only brings in what's missing. Pick **Replace** to match the backup. See [Import, export and backups](HOW-TO.md#9-import-export-and-backups).

### Restore stays grey after picking Replace.

Type your team number without the program, like `12345`. If the box asks for the team name, type it as shown at the top of the app.

### Replace removed something I needed.

It's in **☰ → Trash** for 30 days. Tap **Restore**.

### "Delete the parts in Pit spares first."

An inventory can only be deleted when empty. Move or delete its parts first.

### "No parts found in pasted cells. Include the row of column names and the parts under it."

Copy the row of column names and at least one row of parts, then paste again. See [Import, export and backups](HOW-TO.md#9-import-export-and-backups).

### A teammate's changes aren't showing up.

Changes show within seconds. If not, one device is probably offline (look for the Offline banner) and will catch up when it reconnects.

### I deleted or changed something by mistake.

Tap **Undo** right away. Deleted items stay in **☰ → Trash** for 30 days. See [Change log, Undo and Trash](HOW-TO.md#10-change-log-undo-and-trash).

### I can't find Team, Report bug or Request feature in the menu.

They're hidden in the demo.

---

<picture><source media="(prefers-color-scheme: dark)" srcset="header/divider-dark.png"><img src="header/divider-light.png" alt="" width="720"></picture>

## Installing and updating

### Windows says "Windows protected your PC".

The installer isn't code-signed, so Windows doesn't recognize it. Click **More info**, then **Run anyway**. To update, download the [newest installer](https://github.com/HuskerTheCat/FTC_Ultimate_Inventory/releases/latest/download/FTC-Ultimate-Inventory-Setup.exe) and run it.

### Android won't install the app.

Allow your browser to install apps when Android asks. To update, download the [newest APK](https://github.com/HuskerTheCat/FTC_Ultimate_Inventory/releases/latest/download/FTC-Ultimate-Inventory.apk) and open it. If Android refuses to install over the old app, open the old one online once, uninstall it, install the new one and sign in again.

### The website still shows the old version after an update.

New versions take a few minutes to arrive. Wait, then refresh (Ctrl+Shift+R on a computer).

### Do I lose my data when I update or reinstall?

No. It lives in your Firebase project. Only unsent offline changes are on the device, so open the app online before uninstalling.

---

<picture><source media="(prefers-color-scheme: dark)" srcset="header/divider-dark.png"><img src="header/divider-light.png" alt="" width="720"></picture>

## Still stuck?

- Admins: see the [team admin guide](ADMIN.md).
- **☰ → Report bug** or **☰ → Request feature** sends a note to the developer, with your team name and app version. Keep personal info out.
- Or open an issue on [GitHub](https://github.com/HuskerTheCat/FTC_Ultimate_Inventory/issues).
