---
name: FTC Ultimate Inventory
description: Parts inventory for FTC robotics teams, live on every teammate's phone and computer.
colors:
  accent: "#5b9bff"
  accent-light: "#2563d9"
  accent-gradient-from: "#5aa9ff"
  accent-gradient-to: "#3d6ff2"
  accent-text: "#ffffff"
  tag-text: "#9cc2ff"
  tag-text-light: "#1f56c4"
  bg: "#151b30"
  bg-light: "#eef1f7"
  surface: "#1f2640"
  surface-light: "#ffffff"
  raised: "#2a3354"
  raised-light: "#e3e8f2"
  raised-hover: "#343e66"
  raised-hover-light: "#d5dcea"
  row-hover: "#262e4c"
  row-hover-light: "#eef2fa"
  field: "#181e36"
  field-light: "#ffffff"
  field-border: "#5c6894"
  field-border-light: "#8a94b2"
  border: "#34406a"
  border-light: "#d3d9e6"
  text: "#eef1f8"
  text-light: "#141a2e"
  muted: "#9aa3c0"
  muted-light: "#586180"
  placeholder: "#6b7493"
  placeholder-light: "#8a92ad"
  danger: "#ff6b7d"
  danger-light: "#d0263f"
  pending: "#f2b84b"
  pending-light: "#a05f00"
  topo-to: "#3f6ae0"
  topo-to-light: "#b9cdf7"
  competition-orange: "#ffa53d"
  competition-orange-light: "#c25f08"
  design-green: "#45d08f"
  design-green-light: "#16804d"
typography:
  brand:
    fontFamily: "Orbitron, sans-serif"
    fontSize: "1.6rem"
    fontWeight: 800
    lineHeight: 1.15
  brand-app-name:
    fontFamily: "Orbitron, sans-serif"
    fontSize: "1.6rem"
    fontWeight: 500
    lineHeight: 1.15
  headline:
    fontFamily: "Saira, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Saira, system-ui, sans-serif"
    fontSize: "1.2rem"
    fontWeight: 600
  body:
    fontFamily: "Saira, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.45
    fontFeature: "tnum"
  label:
    fontFamily: "Saira, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
  badge:
    fontFamily: "Saira, system-ui, sans-serif"
    fontSize: "0.8rem"
    fontWeight: 600
  quantity:
    fontFamily: "Saira, system-ui, sans-serif"
    fontSize: "1.3rem"
    fontWeight: 700
rounded:
  badge: "4px"
  chip-square: "6px"
  photo: "8px"
  control: "10px"
  menu: "12px"
  panel: "14px"
  card: "16px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  xxl: "24px"
components:
  button-primary:
    textColor: "{colors.accent-text}"
    rounded: "{rounded.control}"
    padding: "8px 16px"
    height: "42px"
  button-secondary:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.text}"
    rounded: "{rounded.control}"
    padding: "8px 16px"
    height: "42px"
  button-secondary-hover:
    backgroundColor: "{colors.raised-hover}"
  button-icon:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.muted}"
    rounded: "{rounded.control}"
    width: "42px"
    height: "42px"
  button-link:
    textColor: "{colors.accent}"
    padding: "4px"
  button-step:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.text}"
    rounded: "{rounded.pill}"
    size: "32px"
  input:
    backgroundColor: "{colors.field}"
    textColor: "{colors.text}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
    height: "42px"
  tag-chip:
    textColor: "{colors.tag-text}"
    rounded: "{rounded.pill}"
    padding: "2px 10px"
    typography: "{typography.badge}"
  status-badge:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.muted}"
    rounded: "{rounded.badge}"
    padding: "2px 8px 2px 6px"
    typography: "{typography.badge}"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.card}"
    padding: "20px"
  menu:
    backgroundColor: "{colors.raised}"
    rounded: "{rounded.menu}"
    padding: "6px"
  menu-item-hover:
    backgroundColor: "{colors.row-hover}"
  dialog:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.card}"
    width: "480px"
---

# Design System: FTC Ultimate Inventory

## Overview

**Creative North Star: "The Shop Map"**

The app reads like a well-kept parts map for a robotics shop. Behind the first screens and the guides sits a dark navy topographic map, fading to a brighter blue in one corner, with thin blue contour lines drifting slowly as you scroll. Once you're inside the inventory, the map pulls back to a faint band behind the header and the work takes over: dense, scannable rows of parts, big quantity numbers, and controls sized for quick taps between builds.

It's a tool first. Expression lives in a few precise places: the split cube logo, the Orbitron lockup ("FTC Ultimate" heavy, "Inventory" lighter and blue), the contour lines, and one blue gradient reserved for the action that matters. Everything else is calm navy layers that separate by tone and soft shadow, never by outlines.

Dark is the default and the home of the brand. Light mode (named "Pain and suffering mode" in the ☰ menu) is a full, careful equivalent, not an afterthought. The same tokens swap underneath.

**Key Characteristics:**
- Navy tonal layers (bg, surface, raised) with soft shadows instead of borders.
- One blue accent, with a gradient only on primary buttons, switches and the marked storage spot.
- Orbitron only for names (app lockup, app switcher, guide headings, stylized labels); Saira for everything else, with tabular numbers.
- Thin topo-line background on entry screens and guides, a faded band on the inventory header.
- Shop-ready density: 42px controls, big −/+ steppers, cards on phones.

## Colors

A deep navy world with one confident blue, plus red and amber kept for meaning.

### Primary
- **Shop Blue** (`accent`; `accent-light` in light mode): links, focus ring, selected states (picked filter, current menu item, picked tile at 15% mix), tag chips, sort arrows, the What's new dot. It's the brand color of Inventory in the suite.
- **Blue Gradient** (`accent-gradient-from` → `accent-gradient-to`, 135°): the fill of the primary button, the on switch, the marked storage spot, and the update and news banners. Nowhere else.

### Neutral
- **Night Shop** (`bg`): the page.
- **Bench Navy** (`surface`): cards, the parts table, dialogs, icon buttons, toasts.
- **Raised Navy** (`raised`, hover `raised-hover`): menus, secondary buttons, steppers, chips, skeletons.
- **Field Navy** (`field`): inputs, table header, tiles, storage spots, with an inset field shadow.
- **Soft Line** (`border`): row dividers and section rules only; never around a card.
- **Chalk** (`text`) and **Fog** (`muted`): body text and secondary text, labels, icons.

### Semantic
- **Signal Red** (`danger`): low stock, broken, errors, destructive buttons (as tinted text on a 10% red wash).
- **Workshop Amber** (`pending`): on order, damaged, in progress, and the striped "waiting" rows with an amber left edge.

### Suite
- **Competition Orange** and **Design Green**: only in the app switcher and switching screen, each sibling app in its own color.

### Named Rules
**The One Gradient Rule.** A dialog has one gradient button. Actions repeated on every row are secondary, with blue text.

**The Tone, Not Line Rule.** Surfaces separate by tone and `--card-shadow`. Borders stay transparent; `border` is only for dividers between rows and sections.

**The Meaning Colors Rule.** Red means a problem, amber means waiting. Never use them for decoration.

## Typography

**Display Font:** Orbitron (500, 800)
**Body Font:** Saira (400–700), with system-ui fallback
**Mono:** ui-monospace, only for code in guides and raw text areas

**Character:** Orbitron is the engineered, slightly sci-fi voice of the name; Saira is a compact, squared sans that stays readable at small sizes and gives numbers a technical feel.

### Hierarchy
- **Brand** (Orbitron 800 / 500, 1.6rem; 1.3rem in the header, 1.05rem on phones): "FTC Ultimate" over the lighter blue app name.
- **Headline** (Saira 700, 1.75rem, 1.15, −0.01em; 1.5rem on phones): screen titles.
- **Title** (Saira 600, 1.2rem): dialog and section titles.
- **Body** (Saira 400, 16px, 1.45, tabular numbers): everything readable.
- **Label** (Saira 500, 0.875rem, muted): field labels and menu group headings.
- **Badge** (Saira 600, 0.8rem): status badges and chips.
- **Quantity** (Saira 700, 1.3rem; 2rem in the scan take dialog): the part count beside its −/+.

### Named Rules
**The Names In Orbitron Rule.** Orbitron is for names: the app lockup, the app switcher, guide headings and stylized labels. Never for body text, buttons or data.

## Layout

A single centered column, max 1160px, padded 20px/24px (14px/16px on phones). First screens center a 420px column (880px two-across on computers from 760px). The inventory stacks header, list picker, toolbar (search, Scan, Filters, More, Add) and the parts table.

At 700px and below the table becomes cards: name with the stepper beside it, location and part number under it, what uses the part below that. Add part floats as a pill at the bottom right, and the bulk-select bar floats in its place while selecting. At 360px Scan and Filters drop to icons. Dialogs are 480px (720px for the part form, which goes two columns above 700px; 960px for storage grids), with the last row of buttons sticky at the bottom.

Spacing steps by 4: gaps of 4, 8, 12, 16, 20, 24px.

## Elevation & Depth

Hybrid: tonal layers do most of the work, and soft shadows replace borders. Surfaces rest on a low ambient shadow; floating things (menus, dialogs, toasts, the floating Add button) get a deep, diffuse shadow. Inputs are the opposite, pressed in with an inset shadow. Dialog backdrops dim and blur by 3px.

### Shadow Vocabulary
- **Button rest** (`--btn-shadow`): every filled button. Text-only and pill buttons stay flat.
- **Card rest** (`--card-shadow`): cards, the table, filters, tiles, photos, phone part cards.
- **Float** (`--float-shadow`: `0 18px 48px rgb(0 0 0 / 0.5)` dark): menus, dialogs, toasts, the floating Add.
- **Field inset** (`--field-shadow`): inputs and selects.
- **Focus** (`--focus`: 3px blue ring at 85%): every focusable element, replacing the outline.

### Named Rules
**The No Border Rule.** Buttons and surfaces have no visible border. Depth comes from tone and shadow.

## Shapes

Softly rounded, never pill-shaped by default. Controls use 10px, menus 12px, panels and phone cards 12–14px, cards and dialogs 16px. Round pills are reserved for tag chips, steppers, the switch and the floating Add button. Status badges are deliberately squared (4px) so they never read as tag chips. Storage spots are 4px drawer fronts with a small pull bar.

## Components

### Buttons
- **Shape:** gently rounded (10px), 42px tall, no border, resting on `--btn-shadow`.
- **Primary:** the blue gradient with white text, weight 600. One per dialog. Hover brightens 8%.
- **Secondary:** raised navy with chalk text; repeated row actions add blue text. Hover goes to `raised-hover`.
- **Icon:** 42px square on the surface color, muted icon that lightens on hover.
- **Danger:** red text on a 10% red wash, pushed to the far side of a row.
- **Link:** blue text only, no shadow.
- **Hover:** on hover-capable devices every grey button lights to the same `raised-hover`; touch skips it so nothing stays lit after a tap. Disabled is 40% opacity.

### Chips and Badges
- **Tag chip:** round pill, blue at 12% with `tag-text`, 0.8rem. Click filters by that tag. Removable chips are bigger with a round × target.
- **Status badge:** squared (4px), 0.8rem/600, tinted by meaning: red (low, broken), amber (on order, damaged, in progress), blue (to order, to make), with a small masked icon for low stock, to order, on order and making.
- **Use / Find / Spots chips:** small 6px raised chips for the projects using a part and its storage spot.

### Cards / Containers
- **Corner Style:** 16px (cards, dialogs), 14px (table, filters, toast), 12px (phone part cards, menus, catalog box).
- **Background:** surface, with field or bg for inset areas like the catalog search.
- **Shadow Strategy:** card rest; float for anything over the page.
- **Border:** transparent.
- **Internal Padding:** 20px cards, 24px in dialogs.

### Inputs / Fields
- **Style:** field navy, 10px, 42px tall, inset shadow, no border. Selects use a custom chevron and an app-styled open list where supported.
- **Focus:** the 3px blue focus ring.
- **Error:** a 2px red ring. Labels sit above in muted 0.875rem/500.

### Navigation
- **Header:** the cube tile (app switcher, with a chevron so it reads as a button) beside the Orbitron lockup and team name, Scan and ☰ on the right.
- **List picker:** a wide button with the current list's type icon and name, opening a grouped menu.
- **Menus:** raised navy panels, 6px padding, items with muted icons, hover to `row-hover`, current item in blue at 15%.

### Parts Table (signature)
Surface table with a field-colored header, 12px/14px cells and thin row dividers. Names are 600 with a 44px white photo tile (supplier photos are shot on white) or a faint box icon showing how the part is made. Quantities are big and bold between round −/+ steppers. Waiting rows are diagonally striped with an amber left edge; selected rows get a blue wash and a blue left edge. Loading rows use shimmering skeleton bars.

### Topo Background (signature)
A navy-to-blue gradient (110°) with `src/topo.svg` contour lines and their glow (`src/topo-glow.webp`) masked in the accent color at 65% (45% light), drifting at 30% of scroll speed where scroll-driven animation exists and motion is allowed. The inventory screen shows it as a 320px band behind the header at 30% (22% light), fading down.

## Do's and Don'ts

### Do:
- **Do** use the CSS custom properties in `src/style.css` for every color and shadow, so dark and light both work.
- **Do** keep one gradient button per dialog; make repeated row actions secondary.
- **Do** separate surfaces with tone and `--card-shadow`, and keep borders transparent.
- **Do** set Orbitron only on names, and Saira with tabular numbers everywhere else.
- **Do** keep controls at least 42px tall (steppers 32–56px) and respect `prefers-reduced-motion` for the drift, shimmer, switch and found pulse.
- **Do** put supplier photos on a white tile in both themes.

### Don't:
- **Don't** add visible borders around buttons, cards or menus.
- **Don't** use red or amber for decoration; they mean problem and waiting.
- **Don't** make status badges round; round is for tag chips.
- **Don't** use the blue gradient beyond primary buttons, switches, the marked spot and the update and news banners.
- **Don't** add anything that looks AI-generated: no generic glassmorphism, glows, sparkle icons or stock gradients outside the brand's own.
- **Don't** use the other apps' orange or green outside the app switcher.
