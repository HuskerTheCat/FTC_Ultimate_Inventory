<h1><picture><source media="(prefers-color-scheme: dark)" srcset="header/how-to-dark.png"><img src="header/how-to-light.png" alt="How to use FTC Ultimate Inventory" width="720"></picture></h1>

The basics and the most useful features. Follow along in the [demo](https://huskerthecat.github.io/FTC_Ultimate_Inventory/?demo), no setup needed.

The website, Windows app and Android app work the same. On a phone, the parts table becomes cards.

Something wrong? [Troubleshooting and FAQ](TROUBLESHOOTING.md). Running the team? [Team admin guide](ADMIN.md). Shop poster: [quick start](QUICK-START.md).

**Contents**

1. [Get into your team](#1-get-into-your-team)
2. [Find your way around](#2-find-your-way-around)
3. [Add and change parts](#3-add-and-change-parts)
4. [Find parts fast](#4-find-parts-fast)
5. [Locations and QR labels](#5-locations-and-qr-labels)
6. [Inventories, projects and packing lists](#6-inventories-projects-and-packing-lists)
7. [Order list and print list](#7-order-list-and-print-list)
8. [Edit many parts at once](#8-edit-many-parts-at-once)
9. [Import, export and backups](#9-import-export-and-backups)
10. [Change log, Undo and Trash](#10-change-log-undo-and-trash)
11. [Team, sign out and other tips](#11-team-sign-out-and-other-tips)

---

<picture><source media="(prefers-color-scheme: dark)" srcset="header/divider-dark.png"><img src="header/divider-light.png" alt="" width="720"></picture>

## 1. Get into your team

Get the app from the [README](../README.md). On an iPhone or iPad, [add the website to your Home Screen](../SETUP.md#install-on-iphone-or-ipad).

The first screen has three ways in:

- **Sign in to your team**: you have an account and you're on a new device. Pick your program, enter your team number, then sign in.
- **New to the team?**: you're new. Paste the join code from your admin, or tap **Scan QR** and scan the team's QR code. The join link does the same.
- **Set up a new team**: one person per team, once. See the [team setup guide](../SETUP.md).

<img src="how-to/welcome.png" alt="The first screen: sign in, join a team, or set up a new team" width="640">

After joining, enter your name (shown in the change log), email and a password, tick the privacy policy box and tap **Create account**. Open the link in the email you get; the app carries on by itself. Next time, just **Sign in**.

<img src="how-to/phone-create-account.png" alt="Creating an account after joining a team" width="220">

A new team's inventory starts with **Add your first parts** and buttons to add a part, scan a package, import a spreadsheet, add locations and invite your team.

> **Admins:** to invite people, open **☰ → Team** and share the QR code, join code or link. Anyone who has them can join. More in the [team admin guide](ADMIN.md).
>
> <img src="how-to/phone-team.png" alt="The Team screen with the join QR code and join code" width="220">

---

<picture><source media="(prefers-color-scheme: dark)" srcset="header/divider-dark.png"><img src="header/divider-light.png" alt="" width="720"></picture>

## 2. Find your way around

<img src="how-to/desktop-tour.png" alt="The inventory on a computer, with numbered buttons" width="800">

1. **List picker.** Switch between inventories, projects and packing lists, or make a new one.
2. **Rename or delete** the inventory, project or list you're looking at.
3. **Scan.** Scan a QR label to open that bin or part, or a supplier package barcode to find or add that part. A part you already have opens with big **−** and **+** buttons, so taking one or putting some back is two taps; **Edit part** opens everything else.
4. **☰ menu.** Orders, Print list, Locations, Change log, Trash, Export backup, Restore backup, Team, Report bug, Request feature, Pain and suffering mode and Sign out.
5. **Search** by name, part number, barcode, supplier, location, category, condition, material or notes. Each word can match anywhere, so `m4 screw` finds *M4 x 8mm socket head screw*.
6. **Filters.** Filter, sort and group the list.
7. **⋯ menu.** Select parts, Print QR labels, Print inventory, Export CSV and Import spreadsheet.
8. **Add part.**
9. **− and +** change the quantity by one.
10. **Add to** puts the part in a project or packing list. **In use** shows how many are free, with a chip for each project using the part. Tap a chip to open that project.
11. **Badges** (square, with an outline) flag parts that are **Low stock**, **to order** (on the order list), **on order** (ordered), **to make** and **in progress** (on the print list), how the team makes it (like **3D printed**), used, damaged or broken. The round chips next to them are the part's tags; click one to show only parts with that tag.

Click a part to open and edit it. On a computer, click a column heading to sort, and again to reverse.

On a phone, each part is a card. **+ Add part** floats at the bottom right.

<p>
  <img src="how-to/phone-inventory.png" alt="The inventory on a phone" width="220">
  <img src="how-to/phone-main-menu.png" alt="The ☰ menu on a phone" width="220">
</p>

---

<picture><source media="(prefers-color-scheme: dark)" srcset="header/divider-dark.png"><img src="header/divider-light.png" alt="" width="720"></picture>

## 3. Add and change parts

Tap **+ Add part**. Quickest: **Search the parts catalog** at the top, type a few words or a part number, like `u-beam 8mm`, and tap the part. It covers goBILDA, REV, AndyMark, ServoCity, TETRIX, Studica, SWYFT, Axon and Limelight; the menu next to the search narrows it to one supplier.

<img src="how-to/catalog-search.png" alt="Searching the parts catalog in Add part" width="440">

The name, part number, supplier, category and link fill in, plus the supplier's photo when online. Add the quantity and location, then **Save**. Only the name and quantity are required, so parts not in the catalog are just typed in. To ask for one to be added, tap **Request a part here** under the search.

<img src="how-to/add-part.png" alt="The Add part dialog, filled in from the catalog" width="440">

- **Part number or barcode:** typing one of those suppliers' part numbers fills in the rest. Or tap **Scan** next to Barcode and scan the package.
- **Low stock at** (optional) flags the part at that quantity or below.
- **Location** comes from your team's list ([section 5](#5-locations-and-qr-labels)). **+ New location…** adds one on the spot.
- **Category** can have subcategories: `Electronics/Sensors` shows as Electronics › Sensors.
- **Tags** are short labels like `spare` or `competition`. Tap one to show only parts with it.
- **Made by:** for a part the team makes, pick 3D printed, CNC machined, Laser cut or Other. Then Material shows, and Link becomes File link for its CAD, STL or slicer file. **Filters → Custom** lists only those parts.
- **More details** holds unit, condition and notes.
- **Save and add another** keeps the location, category and tags, handy for a whole bin.
- Filtered to one location, or just scanned a bin? **+ Add part** starts there.

The app warns you about a duplicate name or part number.

To change a part, tap it, edit and **Save**. For just the quantity, use **−** and **+** on the list. **Delete** is at the bottom of the dialog and goes to [Trash](#10-change-log-undo-and-trash).

---

<picture><source media="(prefers-color-scheme: dark)" srcset="header/divider-dark.png"><img src="header/divider-light.png" alt="" width="720"></picture>

## 4. Find parts fast

**Search** narrows the list as you type. Matches in your other inventories show under the list (*Also found in Pit spares (2)*); tap to search there. **Filters** has more:

- **Filter** by category, location or tag, or tap **Low stock** to see only parts that need restocking.
- **Sort** by any column, or by **Recently changed**.
- **Group** by category, location or supplier.

The Filters button shows how many are on. **Reset filters** clears them.

<img src="how-to/filters.png" alt="Filters showing only low-stock parts, grouped by location" width="800">

---

<picture><source media="(prefers-color-scheme: dark)" srcset="header/divider-dark.png"><img src="header/divider-light.png" alt="" width="720"></picture>

## 5. Locations and QR labels

Your team has one list of locations (bins, shelves, drawers). **☰ → Locations** adds, renames and deletes them (only empty ones) and prints a bin's label. **+ New location…** in a part's Location list opens the same boxes, so a grid can be made right there.

<img src="how-to/locations.png" alt="The Locations list, with + Add location and + Add grid" width="640">

### Storage grids

For a cabinet of small drawers or a shelf of bins, tap **+ Add grid**, type a name, the number of rows and the number of columns, then tap **Create**. Spots are named by row and column: A1 is the top left, C12 the third row, twelfth column. The grid button (**Edit grid**) changes the size later; the app won't make it smaller while a spot it would cut off still has parts.

In a part's dialog, pick the grid location, then tap the part's spot. In the list, the part shows its spot by its location. Tap that spot, or **Find part** in the part's dialog or after scanning its label, to see the grid with it highlighted. Tapping any spot in a grid lists what's in it.

<img src="how-to/find-part.png" alt="Find part: the Hardware drawers grid with spot B3 highlighted" width="800">

**⋯ → Print QR labels** prints labels for bins and parts. Scanning one with **Scan** or any phone camera opens that bin or part, ready to take one with **−**.

Pick a style before printing:

- **Normal** and **Stylized** fit [OnlineLabels OL911](https://www.onlinelabels.com/products/ol911) sticker sheets: 2.5" × 1.25", 21 a page. Stylized has the app's dark map look.
- **Mini** prints half-inch codes to cut out and stick on parts, 110 a page. Each code's name prints below its cut line.

Print at 100% scale (Actual size), not Fit to page, or the labels won't line up with the sheet. The app remembers the style you last picked on that device.

The app remembers which labels are printed, so only new ones are checked. The list follows your filters, so filter to one location to print just its labels. A part's dialog has **Print label** for one.

A grid's label opens the whole grid. To print labels for its drawers too, tap **Choose spots** under it and tap the spots you want, or **All spots**. Scanning one shows that spot and what's in it.

<img src="how-to/labels.png" alt="The QR labels dialog" width="440">

---

<picture><source media="(prefers-color-scheme: dark)" srcset="header/divider-dark.png"><img src="header/divider-light.png" alt="" width="720"></picture>

## 6. Inventories, projects and packing lists

Use the **list picker** at the top to switch views or make a **New inventory, project or list**.

<p>
  <img src="how-to/list-picker.png" alt="The list picker" height="200">
  <img src="how-to/new-list.png" alt="Making a new project" height="200">
</p>

- **Inventory**: holds parts. Teams start with **Main Inventory** and can add more (like *Pit spares*).
- **Project**: the parts a robot or build uses, from any inventory. They stay in their inventory but show as **in use**, so you see how many are free.
- **Packing list**: what to bring to a competition. Check parts off as you pack; only checked parts count as in use (*Packed 3 of 7*). **⋯ → Unpack all** unchecks everything after an event (it asks first).

In a project or packing list, **+ Add parts** lists every part in every inventory; tap one to add one more, or **−** to take one back. **−** and **+** change how many it uses; tap the part to type a number or remove it.

<img src="how-to/project.png" alt="A robot project showing the parts it uses" width="800">

In the inventory, **Add to** on a part sends it to a project or packing list.

<p>
  <img src="how-to/phone-add-to.png" alt="Adding a part to a project or packing list" width="220">
  <img src="how-to/phone-packing.png" alt="A packing list with packed parts checked off" width="220">
</p>

---

<picture><source media="(prefers-color-scheme: dark)" srcset="header/divider-dark.png"><img src="header/divider-light.png" alt="" width="720"></picture>

## 7. Order list and print list

Open **☰ → Orders** to track parts you need, have ordered, and got. The list has three tabs: **Need to order**, **Ordered** and **Arrived**.

<img src="how-to/orders.png" alt="The order list" width="440">

- On **Need to order**, tap **+ Add item**, then search the parts catalog, pick a part you have, or type any item with your own link. A supported part number fills in the rest. Link and notes are optional. New orders go under **Need to order**.
- New items appear in Main Inventory right away as **to order**, so projects and packing lists can use them early.
- Once you've bought it, tap **Ordered** to move it to the Ordered tab.
- When it arrives, tap **Arrived** to add it to the inventory and move it to the Arrived tab. If only some came, enter how many; the rest stays under Ordered.
- **Clear arrived** empties the Arrived tab. The parts stay in the inventory.
- Tap an order to change it. **Print** prints the tab you're on.

### Print list

**☰ → Print list** tracks parts the team makes: 3D prints, CNC and laser cut parts. Tabs: **Not started**, **In progress** and **Complete**.

<img src="how-to/print-list.png" alt="The print list" width="440">

- **+ Add part to make**: pick a part the team makes, or type a new one with how it's made, material and file link. A new one appears in Main Inventory with 0 in stock.
- **Make more** in a made part's dialog puts it on the list too.
- Tap **Start** when you begin, so nobody prints it twice; starting only some? Enter how many and the rest stays under Not started. Tap **Made** when it's done to add it to the inventory; if only some came out, enter how many and the rest stays under In progress.
- **Clear complete** empties the Complete tab. Tap an item to change its quantity or notes. **Print** prints the tab you're on.

---

<picture><source media="(prefers-color-scheme: dark)" srcset="header/divider-dark.png"><img src="header/divider-light.png" alt="" width="720"></picture>

## 8. Edit many parts at once

**⋯ → Select parts**, tap the parts (or **Select all shown** for everything your search and filters show), then **Edit selected**. Set location, category, low-stock number and tags for all at once. Anything left on "Keep" stays as is.

<img src="how-to/bulk-edit.png" alt="Editing two parts at once" width="440">

---

<picture><source media="(prefers-color-scheme: dark)" srcset="header/divider-dark.png"><img src="header/divider-light.png" alt="" width="720"></picture>

## 9. Import, export and backups

Keep your parts in a spreadsheet? Import them whatever the columns are called.

1. In Excel or Google Sheets, copy your parts along with the row of column names.
2. In the app, open the inventory, choose **⋯ → Import spreadsheet** and paste. Or choose a CSV file.
3. Check each column's menu (**Item**, **Qty**, **Location**…). Fix any it got wrong and pick **Leave out** for ones you don't need, like prices. Some column must be **Item**.
4. Click **Import**.

<img src="how-to/import-preview.png" alt="The import preview, with what each column holds" width="440">

Rows the app can't add are listed with the reason (*250 pcs* and *1,200* are fine as quantities). Parts already there (same name or part number) are skipped, so importing twice adds nothing. **Undo** removes the whole import.

**Export CSV** (same menu) saves the inventory as a spreadsheet file, on the website and Windows app but not Android. **Print inventory** prints what's on screen.

<img src="how-to/more-menu.png" alt="The ⋯ menu" height="260">

### Back up the whole team

**☰ → Export backup** saves everything in one `.inv` file: inventories, projects, packing lists, parts, orders, the print list, locations and which QR labels are printed. Not members, the change log or the trash. Works on the website and Windows app, not Android. Keep it on a shared drive.

**☰ → Restore backup** opens a `.inv` file, then you pick how. The app lists what each way will do before anything changes.

- **Add** brings in what the team doesn't have, like parts deleted since. Nothing you have changes. **Exclude duplicates** (on by default) skips parts with the same name or part number in the same inventory; turn it off to add them again as copies.
- **Replace** makes the team match the backup: adds what's missing, resets quantities, names and inventories, and removes what isn't in the backup. Removed items go to [Trash](#10-change-log-undo-and-trash) for 30 days. You type your team number first (or the team name, if you joined with a code or link).

<img src="how-to/restore-backup.png" alt="Restore backup, with Add picked and what it will add" width="440">

A new, empty team skips the choice. IDs are kept, so printed QR labels still work, even in a new Firebase project. Restoring needs internet.

---

<picture><source media="(prefers-color-scheme: dark)" srcset="header/divider-dark.png"><img src="header/divider-light.png" alt="" width="720"></picture>

## 10. Change log, Undo and Trash

- **Undo** shows at the bottom for a few seconds after most changes.
- **☰ → Change log** shows who changed what, and when.
- **☰ → Trash** keeps deleted items for 30 days. Tap **Restore** to bring one back. Only the owner can **Delete forever**.

<p>
  <img src="how-to/change-log.png" alt="The change log" width="380">
  <img src="how-to/trash.png" alt="The trash" width="380">
</p>

---

<picture><source media="(prefers-color-scheme: dark)" srcset="header/divider-dark.png"><img src="header/divider-light.png" alt="" width="720"></picture>

## 11. Team, sign out and other tips

- **☰ → Team** shows the join QR code and code, lets you change your name, and lists members. Owners can remove members, **Reset join code** and delete the team ([admin guide](ADMIN.md)).
- **Works offline.** Edits are saved on the device and sync when you're back online. The website opens offline after one online visit.
- **Changes show live**, so two people can count at once.
- **Banner you don't understand?** See [Troubleshooting and FAQ](TROUBLESHOOTING.md). For a blue rules banner, your admin needs to [update the rules](../SETUP.md#updating-the-rules).
- **☰ → Report bug** and **☰ → Request feature** send a note to the developer with your team name and app version. Keep personal info out.
- **☰ → Pain and suffering mode** switches to a light theme; turn it off for Normal mode. Each device remembers its choice.
- **☰ → Sign out** also removes the team's data from that device, good practice on a shared computer.
