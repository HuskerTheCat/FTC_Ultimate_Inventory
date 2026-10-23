<h1><picture><source media="(prefers-color-scheme: dark)" srcset="header/admin-dark.png"><img src="header/admin-light.png" alt="Team admin guide" width="720"></picture></h1>

For the team's owner, shown as **Owner** in the Members list. Setup is in the [team setup guide](../SETUP.md), everyday use in the [how-to guide](HOW-TO.md).

Everything is on the **☰ → Team** screen unless noted. Teammates see the same screen without the owner buttons.

**Contents**

1. [Invite teammates](#1-invite-teammates)
2. [Keep the Members list clean](#2-keep-the-members-list-clean)
3. [Reset the join code](#3-reset-the-join-code)
4. [Update the Firebase rules](#4-update-the-firebase-rules)
5. [Back up the team](#5-back-up-the-team)
6. [Hand the team to a new admin](#6-hand-the-team-to-a-new-admin)
7. [Delete the team](#7-delete-the-team)

---

<picture><source media="(prefers-color-scheme: dark)" srcset="header/divider-dark.png"><img src="header/divider-light.png" alt="" width="720"></picture>

## 1. Invite teammates

Open **☰ → Team**. New teammates scan the QR code, or you send the join code or link with the **Copy** buttons. Details are in the [setup guide](../SETUP.md#6-invite-your-team).

- Every member can share the code, not just you.
- Anyone who has the code can join, so don't post it anywhere public.
- Existing members on a new device use **Sign in to your team** with your program and team number. They don't need the code.

---

<picture><source media="(prefers-color-scheme: dark)" srcset="header/divider-dark.png"><img src="header/divider-light.png" alt="" width="720"></picture>

## 2. Keep the Members list clean

<img src="help/team-members.png" alt="The Members list with Remove buttons, and Reset join code and Delete team below it" width="220">

Check the list at least once a season:

- **Remove people who've left**, especially graduates with school emails.
- **Remove emails that look wrong**, like `jordan@gmial.com` above. Members who joined before email verification existed may have a typo'd address, and whoever owns that inbox could use **Forgot password?** to get in. If the person is real, ask them to join again with the right email.

Tap **Remove** next to a name to:

- sign them out everywhere with **You no longer have access**,
- make a new join code, so the old one can't bring them back,
- keep their entries in the change log.

Their account still exists but sees nothing. To erase it, open the [Firebase console](https://console.firebase.google.com) → **Security → Authentication → Users** and delete it.

Removed someone by mistake? Send them the new join code. They use **Sign in** (not **Create account**) with their old password, unless you deleted their account.

---

<picture><source media="(prefers-color-scheme: dark)" srcset="header/divider-dark.png"><img src="header/divider-light.png" alt="" width="720"></picture>

## 3. Reset the join code

If the code or link got shared where it shouldn't, tap **Reset join code**. The old code, link and QR code stop working immediately. Current members stay signed in. Reprint any QR code you posted.

---

<picture><source media="(prefers-color-scheme: dark)" srcset="header/divider-dark.png"><img src="header/divider-light.png" alt="" width="720"></picture>

## 4. Update the Firebase rules

A blue **Firebase rules out of date** banner means a new app version needs newer rules. Only the owner of the Firebase project can fix it. Tap the banner for **Copy rules** and a link to your rules. Full steps: [Updating the rules](../SETUP.md#updating-the-rules). No data changes, and the app keeps working until you do it.

A red **Your Firebase isn’t secure** banner means your project isn't using the app's rules, so anyone could read your inventory. Fix it right away.

---

<picture><source media="(prefers-color-scheme: dark)" srcset="header/divider-dark.png"><img src="header/divider-light.png" alt="" width="720"></picture>

## 5. Back up the team

Deleted items stay in **☰ → Trash** for 30 days. A backup file protects against bigger mistakes, like a bad bulk edit or a deleted Firebase project.

**☰ → Export backup** (website or Windows app; Android can't save files) saves one `.inv` file with every inventory, project, packing list, part, order, make list item and location, and which QR labels are printed. It doesn't include members, the change log or the trash. Make one before each season and after a big count, and keep it on a shared drive.

**☰ → Restore backup**: pick the file, then **Add** (only what's missing) or **Replace** (make the team match the backup; type your team number). Replace sends removed items to the Trash. The app previews the result first. See [Import, export and backups](HOW-TO.md#9-import-export-and-backups).

**Moving to a new Firebase project:** export a backup, [set up the new team](../SETUP.md), restore the backup there, and have teammates join with the new code. IDs are kept, so printed QR labels still work.

---

<picture><source media="(prefers-color-scheme: dark)" srcset="header/divider-dark.png"><img src="header/divider-light.png" alt="" width="720"></picture>

## 6. Hand the team to a new admin

Before you graduate or step down, hand over two things.

**The Firebase project.** In the [Firebase console](https://console.firebase.google.com), open the project → **Settings → Users and permissions** → **Add member**, enter their Google email and pick **Owner**. A team or coach Google account avoids this step in future.

**The owner role in the app.** Once the new admin has joined the team in the app, set it in the Firebase console:

1. In the Firebase console, open **Databases & Storage → Firestore** and the **Data** tab.
2. Open the **members** collection and find the document whose **email** is the new admin's. Copy its document ID.
3. Open **team → info**, click the pencil on the **owner** field, paste the new ID, and click **Update**. Leave the other fields alone.
4. The new admin reopens the app and now sees **Owner** and the **Remove**, **Reset join code** and **Delete team** buttons.

The new admin can then remove the old admin from Members.

The same steps work if the owner's account is lost. Anyone who can open the Firebase project can make another member the owner.

---

<picture><source media="(prefers-color-scheme: dark)" srcset="header/divider-dark.png"><img src="header/divider-light.png" alt="" width="720"></picture>

## 7. Delete the team

Only if your team is done with the app for good. For a fresh start, delete parts or inventories instead.

1. Export a backup first if you might want the data.
2. Open **☰ → Team** and tap **Delete team**.
3. Type your team number to confirm, for example `FTC 12345`. An optional reason is logged to a central server, so keep personal info out.

This removes your team from the central list (nobody can sign in by team number) and this device leaves the team. **It doesn't erase your Firebase project**: teammates can still open the inventory until you delete it. To erase the inventory and all accounts, open the project's **Settings → General** and click **Delete project** at the bottom. The app links to it after you delete the team.
