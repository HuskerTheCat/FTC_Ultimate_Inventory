# Troubleshooting and FAQ

What each banner and message in the app means, and how to fix it. The app shows two kinds of messages:

- **Banners** stay across the top of the screen until the problem is fixed (or you close them).
- **Messages** show in red at the top for about 10 seconds after something goes wrong.

The examples use the team **12345 Example Team**; your app shows your own team's name and number.

**Contents**

1. [Banners](#banners)
2. [Joining a team](#joining-a-team)
3. [Signing in](#signing-in)
4. [Setting up a team (admins)](#setting-up-a-team-admins)
5. [Using the app](#using-the-app)
6. [Installing and updating](#installing-and-updating)
7. [Still stuck?](#still-stuck)

---

## Banners

### Offline

![Offline, changes will sync when you reconnect](help/offline-banner.png)

The device has no internet connection. Keep working: changes are saved on the device and sent to your team as soon as it's back online. A few things need the internet, like signing in and joining a team.

### New version available

![New version available, tap to refresh](help/update-banner.png)

- On the website it says **New version available, tap to refresh**. Tap it to load the new version.
- In the Windows and Android apps it says **Update available (v0.6.0), tap to download** (with the newest version number). Tap it, download the new installer or APK, and install it over the old app. See [Installing and updating](#installing-and-updating).

Your inventory is stored in your team's Firebase project, not in the app, so updating never loses it.

### News

![A news message from the app's developer](help/news-banner.png)

A message from the app's developer to every team, for example planned downtime. Tap **×** to close it. It stays closed on that device until there's a new message.

### Your Firebase rules are out of date

![Your Firebase rules are out of date, click for update instructions](help/rules-banner.png)

This version of the app has new features that need newer security rules in your team's Firebase project. Only your team's admin (the person who set up the Firebase project) can fix it. Tap the banner for the steps, with a **Copy rules** button and a link to your project's rules, or send your admin the [steps to update the rules](../SETUP.md#updating-the-rules). Updating the rules doesn't change any of your data.

The app keeps working in the meantime, but new features may fail with **The server didn't allow that change** until the rules are updated.

### Your Firebase is configured incorrectly

![Your Firebase is configured incorrectly and your account is not secure. Click here to fix](help/open-rules-banner.png)

Your team's Firebase project isn't using the app's security rules (for example, it was created in test mode), so anyone on the internet could read your inventory and your members' emails. Your admin should publish the app's rules right away: tap the banner for the steps, or see [Updating the rules](../SETUP.md#updating-the-rules). The banner goes away once they're in use.

### Demo only

**Demo only. Click to set up an account** means you're in the demo. It shows sample parts and nothing you change is saved. Tap the banner to go back to the first screen and join or set up your team.

---

---

## Joining a team

### "That join code is not valid. Ask your team admin to copy it again."

The code was mistyped or cut off. Ask your admin to use the **Copy** button next to the join code on the **Team** screen, or scan the team's QR code with **Scan QR** instead of typing.

### "No team found. Ask your team admin for the join code."

The app couldn't find a team for that code or number. Check the code with your admin. If you're the admin and this happens right after setup, make sure you finished [creating the team in the app](../SETUP.md#5-create-your-team-in-the-app) and [published the rules](../SETUP.md#3-create-the-database).

### "You're not on 12345 Example Team. Ask your team admin for the join code."

**Sign in to your team** is only for people already on the team. If you're new, choose **Use a different team**, then **Join a team** with the join code and create your account.

### "Couldn't join 12345 Example Team. Ask your team admin for a fresh join code."

That join code is old. The code changes whenever the admin resets it or removes someone from the team. Get the current one from the **Team** screen. If the code is current, update the app: older versions can't join teams whose rules check emails.

### "Check your email" won't go away, or the email never came.

New members confirm their email once, when they join. Look in your spam or junk folder: the email comes from your team's Firebase project, not from the app. Tap **Send it again** if it's not there. Once you open the link, the app moves on within a few seconds. If the address shown is wrong, tap **Use a different email** and create the account again.

### "You no longer have access to 12345 Example Team."

The team admin removed you from the team. If that was a mistake, ask them for the current join code, join again, and use **Sign in** (not **Create account**) with your old email and password.

### "Accept the privacy policy to create an account."

Tick the box under the password. Everyone ticks it once when they join a team.

### I joined from the link in Safari, but the Home Screen app asks me to join again.

The iPhone Home Screen app keeps its own sign-in. Join from inside the Home Screen app with **Scan QR** or the join code. See [Install on iPhone or iPad](../SETUP.md#install-on-iphone-or-ipad).

### I'm on the wrong team, or want to switch teams.

Use **☰ → Sign out**, then **Use a different team**.

---

## Signing in

### "There's already an account with that email. Sign in instead."

You already have an account on this team, maybe from an earlier season. Tap **Sign in** with the same email and password. Forgot it? See the next one.

### "Wrong email or password."

Check for typos (tap **Show** to see the password). To reset it, type your email and tap **Forgot password?**. The email comes from your team's Firebase project, so check your spam or junk folder if it doesn't arrive.

### "Too many tries. Wait a few minutes, then try again."

Firebase pauses sign-in after several wrong passwords. Wait, then try again or use **Forgot password?**.

### "Can't reach the server. Check your internet connection."

Signing in and joining need the internet. If other websites work, the network may be blocking Firebase (some school networks do), so try another network.

### "FTC team 12345 can't sign in by number yet. Join with your team's join code instead. Team admins can sign in from Set up a new team."

Your team isn't on the central team list. It gets added (or added back) the next time the admin opens the app online on a device where they set up the team or signed in by team number. Until then, use **Join a team** with the join code, then **Sign in** with your existing email and password.

If you're the admin and no device is signed in to the team, choose **Start setup**, fill in your team number and paste your team's `firebaseConfig` again, then click **Create team**. The app sees the team already exists: click **Sign in to it** and sign in with your admin email and password. Your team goes back on the list, so teammates can sign in by number again.

---

## Setting up a team (admins)

### "Email sign-in isn't turned on in this team's Firebase project."

The team admin skipped [step 2 of the setup guide](../SETUP.md#2-turn-on-email-sign-in). The admin can tap **Open Authentication** in the message to go straight to the page, choose **Email/Password**, switch it on and click **Save**.

### "Your Firebase project doesn't have the app's rules yet (setup step 3)."

Only the admin sees this, when creating the team. Publish the app's rules ([step 3 of the setup guide](../SETUP.md#3-create-the-database)), then tap **Sign in** with the email and password you just used.

### "Couldn't find "apiKey" in the pasted Firebase config."

When setting up a team, paste the whole `firebaseConfig = { ... }` block from [step 4 of the setup guide](../SETUP.md#4-copy-your-connection-info), not just part of it.

### Create team lists steps to fix.

Before creating the team, the app checks your Firebase project. Each line names the [setup guide](../SETUP.md) step that was missed, and **Fix it in Firebase** opens the right page of your project:

- **Email/Password sign-in isn't turned on:** [step 2](../SETUP.md#2-turn-on-email-sign-in).
- **There's no Firestore database yet:** [step 3](../SETUP.md#3-create-the-database). Make sure it's Firestore, not Realtime Database.
- **The app's rules aren't published yet:** on the setup screen, click **Copy rules**, then paste them in the database's **Rules** tab and click **Publish**.
- **The published rules let anyone read your inventory (test mode):** same fix. Test mode leaves the inventory open to anyone.
- **The pasted connection info doesn't match a Firebase project:** copy the `firebaseConfig` block again ([step 4](../SETUP.md#4-copy-your-connection-info)).
- **This Firebase project already has a team:** the team was already created. Click **Sign in to it** and sign in with your email and password.

Then click **Create team** again.

### "FTC team 12345 is already on the central server's team list, so teammates can't sign in by team number."

Only the admin sees this. Another team already registered that number, or the wrong number was typed at setup. Join codes still work for everyone. Use **☰ → Report bug** with your team number to get it fixed.

---

## Using the app

### "The server didn't allow that change. If the app was just updated, ask your team admin to publish the latest firestore.rules."

Your team's Firebase rules are older than the app. Your admin needs to [update the rules](../SETUP.md#updating-the-rules).

### "That needs an internet connection. Try again once you're back online."

That action needs data this device hasn't saved for offline use yet. Try again once the Offline banner is gone.

### "Couldn't open the camera"

Allow camera access when the browser or app asks. If you said no before, turn it back on: in Chrome or Edge, tap the icon left of the web address; on Android, open **Settings → Apps → FTC Ultimate Inventory → Permissions**; on Windows, open **Settings → Privacy & security → Camera**. Close other apps that might be using the camera.

### "Couldn't load the scanner. Check your internet connection and try again."

The scanner loads when the app opens. Get back online and tap **Scan** again.

### "That label's part isn't in this team's inventory anymore."

The part was deleted, or the label was printed by another team. Look in **☰ → Trash** to bring a deleted part back. A bin label for a deleted inventory or project says **That label's project isn't in this team anymore.**

### "The Android app can't save files. Export from the website or the Windows app."

Export CSV and Export backup only work on the website and in the Windows app. Sign in to the website on a computer to export. Restore backup works on Android too.

### "parts.csv isn’t an inventory backup. Choose a .inv file made with Export backup."

Restore backup only opens the `.inv` files the app saves with **☰ → Export backup**. To bring in parts from a spreadsheet or a CSV file, use **⋯ → Import spreadsheet** instead. See [Import, export and backups](HOW-TO.md#9-import-export-and-backups).

### "12345 Example Team backup.inv was made by a newer version of the app. Update the app, then restore it."

The backup was saved by a newer version of the app than this one. Update the app (see [Installing and updating](#installing-and-updating)), then restore it again.

### "Restoring a backup needs an internet connection."

Restoring checks what your team already has on the server first. Try again once the Offline banner is gone.

### Restoring says the team already has everything, but my numbers are different.

Restoring only adds what's missing; it doesn't undo changes made since the backup. Tick **Also change back** in the preview to set those back to how they were in the backup.

### "Delete the parts in Pit spares first."

An inventory can only be deleted once it's empty. Move its parts somewhere else or delete them first.

### "No parts found in pasted cells. Include the row of column names and the parts under it."

Import needs the row of column names and at least one row of parts under it. Select both in your spreadsheet, copy them and paste again. A CSV file needs the same. See [Import, export and backups](HOW-TO.md#9-import-export-and-backups).

### A teammate's changes aren't showing up.

Changes show on every device within a few seconds. If they don't, one of the two devices is probably offline (look for the Offline banner). Its changes are sent once it reconnects.

### I deleted or changed something by mistake.

Tap **Undo** at the bottom of the screen right away. Deleted parts, projects, packing lists and orders stay in **☰ → Trash** for 30 days. See [Change log, Undo and Trash](HOW-TO.md#10-change-log-undo-and-trash).

### I can't find Team, Report bug or Request feature in the menu.

They're hidden in the demo. Join or set up a real team to use them.

---

## Installing and updating

### Windows says "Windows protected your PC".

The installer isn't code-signed (that costs money each year), so Windows doesn't recognize it yet. Click **More info**, then **Run anyway**. To update, download the [newest installer](https://github.com/HuskerTheCat/FTC_Ultimate_Inventory/releases/latest/download/FTC-Ultimate-Inventory-Setup.exe) and run it.

### Android won't install the app.

Android asks before installing apps from outside the Play Store. When it does, allow your browser to install apps. To update, download the [newest APK](https://github.com/HuskerTheCat/FTC_Ultimate_Inventory/releases/latest/download/FTC-Ultimate-Inventory.apk) and open it. If Android says the app can't be installed over the old one, open the old app online once so any offline changes are sent, uninstall it, install the new one, and sign in again.

### The website still shows the old version after an update.

New versions can take a few minutes to reach everyone. Wait a few minutes, then refresh the page (Ctrl+Shift+R on a computer).

### Do I lose my data when I update or reinstall?

No. Your team's inventory lives in its Firebase project. Only changes made offline and not yet sent are stored on the device, so open the app online before uninstalling.

---

## Still stuck?

- Team admins: the [team admin guide](ADMIN.md) covers members, join codes, rules, backups and handing the team on.
- Use **☰ → Report bug** to tell the app's developer what went wrong. It's logged to a central server with your team name and app version. Please don't include personal info.
- Have an idea? **☰ → Request feature** sends it to the developer the same way.
- Or open an issue on [GitHub](https://github.com/HuskerTheCat/FTC_Ultimate_Inventory/issues).
