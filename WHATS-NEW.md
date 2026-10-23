# What's new

The app's ☰ → What's new shows this file, newest first. Each version is a `## ` heading. A blue dot shows on ☰ until a user opens What's new after the top section changes.

Before running **Build apps**, rename `Next update` to the version, e.g. `## v0.6.4 · Oct 25, 2026`. Build apps uses that section as the release notes, and stops if it's missing.

## Next update

**Team owners:** re-publish the Firebase rules from [SETUP.md](https://github.com/HuskerTheCat/FTC_Ultimate_Inventory/blob/main/SETUP.md#updating-the-rules) (rules version 9).

- **Custom parts:** a part can be made by your team, with a material and a file link. ☰ → **Print list** tracks parts to make, and finished ones add to stock.
- Parts can be marked **Damaged**, between Used and Broken.
- **QR labels** in Normal, Stylized and Mini styles that fit OnlineLabels OL911 sheets, with several copies per label.
- The Thrifty Bot parts are in the part catalog.
- Orders search the parts catalog when you add an item.
- Inventory badges tell **to order** (blue) apart from **on order** (amber).
- Rename or delete a list from the ⋯ on its row.
- Tidier locations, orders and QR labels dialogs.

## v0.6.3 · Oct 23, 2026

**Team owners:** re-publish the Firebase rules (rules version 7).

- Order list tabs: **Need to order**, **Ordered** and **Arrived**. Arrived adds the parts to the inventory.
- QR labels for each spot of grid storage.
- The app switcher cube turns into the app you pick.
- The Windows and Android apps notice a new version whenever you come back to them.
