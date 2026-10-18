<h1><picture><source media="(prefers-color-scheme: dark)" srcset="docs/header/setup-dark.png"><img src="docs/header/setup-light.png" alt="Team setup guide" width="720"></picture></h1>

One person per team does this once, in about 10 minutes. Everyone else just needs the join link.

Your team gets its own free Firebase project, separate from every other team. The free plan (Spark) has no credit card attached, so it can't charge you.

<picture><source media="(prefers-color-scheme: dark)" srcset="docs/header/divider-dark.png"><img src="docs/header/divider-light.png" alt="" width="720"></picture>

## 1. Create a Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and sign in with a Google account the team can keep, such as a coach account.
2. Click **Create a project**, name it (for example `example-team-12345`), accept the terms and click **Continue**. Switch Google Analytics off and click **Create project**.
   The project ID under the name starts your join code, so a short one keeps the code short.

   <img src="docs/setup/1-project-name.png" alt="Naming the Firebase project, with the project ID under the name" width="460">

<picture><source media="(prefers-color-scheme: dark)" srcset="docs/header/divider-dark.png"><img src="docs/header/divider-light.png" alt="" width="720"></picture>

## 2. Turn on email sign-in

1. In the left menu, open **Security → Authentication** and click **Get started**.

   <img src="docs/setup/2-menu.png" alt="Security, then Authentication, in the left menu" width="280">

2. On the **Sign-in method** tab, choose **Email/Password**, switch on the first toggle, and click **Save**.

   <img src="docs/setup/2-email-password.png" alt="Email/Password switched on, with the Save button" width="560">

<picture><source media="(prefers-color-scheme: dark)" srcset="docs/header/divider-dark.png"><img src="docs/header/divider-light.png" alt="" width="720"></picture>

## 3. Create the database

1. Open **Databases & Storage → Firestore** (under NoSQL) and click **Create database**. Use Firestore, not Realtime Database.

   <img src="docs/setup/3-menu.png" alt="Databases & Storage, then Firestore, in the left menu" width="460">

2. Choose **Standard edition**, leave the database ID as **(default)**, pick a location close to you, and choose **Start in production mode**.

   <img src="docs/setup/3-production-mode.png" alt="Start in production mode" width="460">

3. In the app ([web](https://huskerthecat.github.io/FTC_Ultimate_Inventory/), Windows or Android), click **Start setup** under **Set up a new team**, then **Copy rules**.
4. In Firebase, open the database's **Rules** tab, replace everything with the pasted rules, and click **Publish**.

   <img src="docs/setup/3-rules-editor.png" alt="The Rules tab with the app's rules pasted in, and the Publish button" width="560">

These rules keep your inventory private: only people who joined with your team's code can read or change it.

<picture><source media="(prefers-color-scheme: dark)" srcset="docs/header/divider-dark.png"><img src="docs/header/divider-light.png" alt="" width="720"></picture>

## 4. Copy your connection info

1. In the left menu, open **Settings → General** and scroll down to **Your apps**.

   <img src="docs/setup/4-menu.png" alt="Settings, then General, in the left menu" width="280">

2. Click the web icon (`</>`), enter any nickname, and click **Register app**. Leave Firebase Hosting unticked.

   <img src="docs/setup/4-your-apps.png" alt="Your apps, with the web icon" width="560">

   <img src="docs/setup/4-register-app.png" alt="Registering the web app with a nickname" width="420">

3. Copy the code block with its copy button (bottom right). Copying the whole block is fine.

   <img src="docs/setup/4-firebase-config.png" alt="The firebaseConfig block to copy" width="420">

<picture><source media="(prefers-color-scheme: dark)" srcset="docs/header/divider-dark.png"><img src="docs/header/divider-light.png" alt="" width="720"></picture>

## 5. Create your team in the app

1. On the app's **Set up a new team** screen, enter your team name and number, paste the block you copied, and click **Create team**.
2. The app checks your Firebase project. If a step was missed, it says which one with a **Fix it in Firebase** link. Fix it, then click **Create team** again.
3. Enter your name, email and a password, and click **Create account**.
4. Open the link in the email Firebase sends you (check spam). The app moves on by itself, and you're the team's first member.

<picture><source media="(prefers-color-scheme: dark)" srcset="docs/header/divider-dark.png"><img src="docs/header/divider-light.png" alt="" width="720"></picture>

## 6. Invite your team

Click **Team**. Teammates scan the QR code or open the link, or choose **Scan QR** under **New to the team?** in the app (or type the join code, for example `example-team-12345-k7qm3x9p2r`). Then they create an account and open the link in the email Firebase sends them. On another device, choose **Sign in to your team**, pick your program, enter your team number and use the same email and password.

Only share the join code with your team: anyone who has it can join. If it leaks, use **Reset join code**. Owners can also remove people from the **Team** screen, which makes a new code.

Send your team the [how-to guide](docs/HOW-TO.md). The [team admin guide](docs/ADMIN.md) covers members, backups and handing the team to a new admin.

<picture><source media="(prefers-color-scheme: dark)" srcset="docs/header/divider-dark.png"><img src="docs/header/divider-light.png" alt="" width="720"></picture>

## Install on iPhone or iPad

There is no App Store app. The website installs like one instead:

1. Open the [web version](https://huskerthecat.github.io/FTC_Ultimate_Inventory/) in **Safari**.
2. Tap the **Share** button (the square with an arrow pointing up).
3. Scroll down and tap **Add to Home Screen**, then tap **Add**.
4. Open the app from the new icon on your Home Screen.

Then join with **Scan QR** or the join code inside that app. It keeps its own sign-in, separate from Safari.

<picture><source media="(prefers-color-scheme: dark)" srcset="docs/header/divider-dark.png"><img src="docs/header/divider-light.png" alt="" width="720"></picture>

## Updating the rules

A blue **Your Firebase rules are out of date** banner means a new app version needs newer rules. Only your team's admin (who set up the Firebase project) can update them, so send them this section. It doesn't change any data, and the app keeps working meanwhile, but new features won't until you update.

A red **Your Firebase is configured incorrectly and your account is not secure** banner means your project isn't using the app's rules (for example, test mode), so anyone could read your inventory and members' emails. Follow the same steps right away.

On a computer:

1. Click the banner in the app, then **Copy rules**.
2. Click **Open your Firebase rules** and sign in with the Google account that owns your team's project.
3. In the rules editor, select all (Ctrl+A, or Cmd+A on a Mac), paste the rules (Ctrl+V, or Cmd+V) and click **Publish**.
4. Wait a minute, then reopen the app or refresh the page. The banner disappears once the new rules are in use.

Teams set up before short join codes: after publishing, open **Team** and use **Reset join code** once. People already on the team stay signed in.
