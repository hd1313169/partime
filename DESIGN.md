---
name: 個人工資管理系統
description: A precise, quiet tool for logging part-time shifts and tracing every NT$ back to its arithmetic.
colors:
  ground: "#fbfbfc"
  surface: "#ffffff"
  sunken: "#f3f4f6"
  ink: "#16171b"
  ink-2: "#3b3e46"
  muted: "#686c78"
  faint: "#9a9ea8"
  line: "#e6e7eb"
  line-strong: "#d4d6dc"
  accent: "#4f46e5"
  accent-hover: "#4338ca"
  accent-soft: "#eef0fe"
  danger: "#c42b2b"
  danger-soft: "#fdf0f0"
typography:
  figure:
    fontSize: "32px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.02em"
    fontFeature: "\"tnum\" 1"
  headline:
    fontSize: "26px"
    fontWeight: 600
    letterSpacing: "-0.02em"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"SF Pro Text\", \"PingFang TC\", \"Noto Sans TC\", \"Microsoft JhengHei\", \"Segoe UI\", system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 600
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"SF Pro Text\", \"PingFang TC\", \"Noto Sans TC\", \"Microsoft JhengHei\", \"Segoe UI\", system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    fontFeature: "\"tnum\" 1"
  body-sm:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"SF Pro Text\", \"PingFang TC\", \"Noto Sans TC\", \"Microsoft JhengHei\", \"Segoe UI\", system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"SF Pro Text\", \"PingFang TC\", \"Noto Sans TC\", \"Microsoft JhengHei\", \"Segoe UI\", system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 500
  caption:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"SF Pro Text\", \"PingFang TC\", \"Noto Sans TC\", \"Microsoft JhengHei\", \"Segoe UI\", system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
rounded:
  inner: "6px"
  ctl: "8px"
  sheet: "14px"
  dot: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
  3xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.surface}"
    typography: "{typography.label}"
    rounded: "{rounded.ctl}"
    padding: "0 14px"
    height: "36px"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
  button-primary-sheet:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.surface}"
    rounded: "{rounded.ctl}"
    padding: "0 20px"
    height: "40px"
  button-ghost:
    textColor: "{colors.ink-2}"
    rounded: "{rounded.ctl}"
    padding: "0 14px"
    height: "36px"
  button-ghost-hover:
    backgroundColor: "{colors.sunken}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.ctl}"
    padding: "0 14px"
    height: "36px"
  button-secondary-hover:
    backgroundColor: "{colors.sunken}"
  button-danger:
    textColor: "{colors.danger}"
    rounded: "{rounded.ctl}"
    padding: "0 14px"
    height: "36px"
  button-danger-hover:
    backgroundColor: "{colors.danger-soft}"
  icon-button:
    textColor: "{colors.muted}"
    rounded: "{rounded.ctl}"
    size: "32px"
  icon-button-hover:
    backgroundColor: "{colors.sunken}"
    textColor: "{colors.ink}"
  field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.ctl}"
    padding: "0 12px"
    height: "44px"
  price-input:
    textColor: "{colors.ink-2}"
    rounded: "{rounded.inner}"
    padding: "0 6px"
    height: "28px"
    width: "64px"
  segmented:
    backgroundColor: "{colors.sunken}"
    rounded: "{rounded.ctl}"
    padding: "2px"
  segmented-item-active:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.inner}"
    padding: "0 12px"
    height: "28px"
  sheet:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.sheet}"
  formula-panel:
    backgroundColor: "{colors.sunken}"
    rounded: "{rounded.ctl}"
    padding: "14px 16px"
  banner-error:
    backgroundColor: "{colors.danger-soft}"
    textColor: "{colors.danger}"
    rounded: "{rounded.ctl}"
    padding: "10px 14px"
---

# Design System: 個人工資管理系統

## Overview

**Creative North Star: "The Traceable Ledger Line"**

A precise productivity tool in the Linear / Things lineage, not a bookkeeping app. The ground is a quiet near-white, structure comes from 1px hairlines and a disciplined type scale, and a single indigo is spent only on what you can act on or what is selected. Every number on screen can be traced: unit price, quantity or hours, and the amount they produce sit side by side in tabular figures, so the arithmetic is visible rather than implied.

Density is calm but working: mobile reads as hairline-ruled day groups of 52px rows; desktop becomes a full week table with sticky job and total columns. Surfaces are flat. The only lift belongs to things that genuinely float (the bottom sheet, the selected segment). Job colors are data, never decoration: they appear as 8px dots and as segments of a stacked bar, and nowhere else.

The confirmed rejections, from the user's world choice: no dark-first UI, no generic green bookkeeping look with rounded shadowed total cards, no ornament, no cuteness, no physical-object metaphors, no gradient, no glass.

**Key Characteristics:**
- Near-white ground, white surfaces, cool grey hairlines; depth by tone and line, not shadow.
- One indigo action color; job colors live only in dots and bars.
- Tabular numerals on every figure; NT$ prefix set smaller and muted.
- The formula line: arithmetic shown live wherever an amount is produced.
- 8px controls, 14px sheets; nothing else is rounded except dots and the stacked bar.

## Colors

A cool, almost colorless neutral field with one saturated indigo and one red reserved for destruction.

### Primary
- **Signal Indigo** (accent): primary buttons, focus outlines, the field focus border, today's date and the 今天 marker, the 本週 jump control, caret color. Used for action and selection only.
- **Pressed Indigo** (accent-hover): hover and pressed state of the primary button; also the selection text color.
- **Indigo Wash** (accent-soft): the 3px focus halo around fields, text selection background, and the tint on today's column in the desktop table (at 40-60% opacity).

### Tertiary
- **Ledger Red** (danger): delete actions and validation text such as 結束時間要晚於開始時間。
- **Red Wash** (danger-soft): hover fill under danger actions and the error banner background (with a danger border at 25% opacity).

### Neutral
- **Paper Ground** (ground): page background and the sticky top bar.
- **Sheet White** (surface): tables, sheets, fields, the active segment, secondary buttons.
- **Recess Grey** (sunken): hover fills, the segmented track, the formula panel, table footers (at 70% opacity), the empty track behind the stacked bar.
- **Ink** (ink): primary text, all figures, the app mark tile.
- **Ink Secondary** (ink-2): job names in meta lines, secondary button labels, links in the demo footer.
- **Slate Muted** (muted): labels, column headers, NT$ prefixes, formula detail, icon color at rest. Holds 5:1 on the ground.
- **Fog** (faint): placeholders, disabled text, decorative icons inside fields, the "—" empty marker. 2.6:1 on the ground, so never for information a user must read.
- **Hairline** (line): every rule, card border and table divider (dividers inside lists at 70% opacity).
- **Hairline Strong** (line-strong): hover border on fields and secondary buttons, the mobile price-input underline, scrollbar thumb, dashed add-row border.

### Job colors (data, not tokens)
Each job carries its own user-chosen color from a fixed picker set (emerald, amber, pink, sky, teal, rose, violet and indigo families). They are identity, consistent across the weekly list, desktop table, monthly table, stacked bar and log sheet.

### Named Rules
**The One Voice Rule.** Indigo means "you can act here" or "this is selected/today". It never fills a container, never colors a figure for emphasis, never decorates.

**The Color-Is-Data Rule.** A job color appears only as an 8px round dot (16px inside the color picker swatch) or as its proportional segment of the stacked bar. Never as a text color, row tint, border, or background.

## Typography

**Body Font:** the system CJK stack (-apple-system, SF Pro Text, PingFang TC, Noto Sans TC, Microsoft JhengHei, Segoe UI, system-ui).
**Display / Figure Font:** unresolved. The build currently renders headlines and the large totals in the same system stack; that is a carried gap, not a rule (see Do's and Don'ts).

**Character:** quiet, functional CJK text with tight, negative-tracked figures. Hierarchy comes from size and weight steps, never from color or decoration.

`font-feature-settings: "tnum" 1` is set on the body, so every numeral in the app is tabular. Figures that carry money or time additionally take `letter-spacing: -0.01em`.

### Hierarchy
- **Figure** (600, 28px mobile / 32px desktop, line-height 1, -0.02em): the week or month total. The NT$ prefix inside it drops to 15px / 500 / muted. Inside the log sheet the amount is 26px with a 14px prefix.
- **Headline** (600, 22px mobile / 26px desktop, -0.02em): page titles 薪資週報表, 薪資月報表.
- **Title** (600, 17px): sheet titles such as 新增紀錄, 工作項目管理.
- **Body** (400-500, 15px): job names in rows, field values, row amounts (500), day dates (600).
- **Body Small** (400-500, 14px): table cells, daily totals, the demo footer.
- **Label** (500, 13px): field labels, segmented items, week range, summary captions like 本週總計, page subtitles (400).
- **Caption** (400-500, 12px): column headers, formula detail under amounts, 單價 labels, the 今天 marker. 11px is used once for formula detail inside desktop cells.

### Named Rules
**The Tabular Rule.** Every figure is tabular and right-aligned in its column. Money is written `NT$ 1,234` with the prefix lighter than the number.

**The Formula Line Rule.** Wherever an amount appears with its source, show the arithmetic: `180 × 5h · 13:00–18:00`, `15 × 55`, `NT$ 180 × 5 小時`. The detail line is caption size in muted, directly under or beside the amount.

## Layout

A single centered column capped at 80rem with 16 / 24 / 32px side padding at mobile / sm / lg. The top bar is 56px, sticky, on the ground color with a bottom hairline. Main content starts 20px (32px at sm) below it and stacks sections 20-24px apart.

Mobile: day groups separated by 20px; each opens with a 36px hairline header (date, weekday, day total, report icon) followed by 52px-minimum job rows divided by hairlines. Rows bleed 8px into the gutter so their hover fill reads as a full-width band. Desktop (lg, 1024px): the same data becomes one table inside a white, hairline-bordered 14px container with a sticky lead column (job) and sticky trailing column (週合計); cells are 56px-tall buttons.

The summary block is not a card: it sits between top and bottom hairlines with 16-20px vertical padding, the label left and the figure right on a shared baseline, then an 8px stacked bar and a wrapped legend.

Spacing follows Tailwind's 4px grid; the values that recur are 4, 6, 8, 10, 12, 14, 16, 20, 24, 32px. Sheet interiors use 20px padding with a header and footer each ruled off by a hairline.

## Elevation & Depth

Flat by default. Depth is tonal: ground, white surface, recessed grey, separated by hairlines. Shadows exist in exactly two places, both for things that physically sit above the page.

### Shadow Vocabulary
- **Segment lift** (`box-shadow: 0 1px 2px rgb(22 23 27 / 0.08), 0 0 0 1px rgb(22 23 27 / 0.04)`): the selected item of a segmented control.
- **Sheet float** (`box-shadow: 0 24px 48px -12px rgb(22 23 27 / 0.22), 0 4px 12px -4px rgb(22 23 27 / 0.08)`): dialogs and bottom sheets, over a scrim of ink at 30%.
- **Focus halo** (`box-shadow: 0 0 0 3px var(--color-accent-soft)`): fields and price inputs on focus. A state, not elevation.

### Named Rules
**The Only-What-Floats Rule.** A shadow is allowed only on an element that overlays content or is a pressed-out selection. Cards, tables, totals and banners stay flat with a hairline.

## Shapes

Two radii carry the system: 8px for anything you press or type into, 14px for containers that hold a whole view (sheets, the desktop tables, the unlock panel). Elements nested inside an 8px control use 6px (segment items, price inputs, the app mark). Full rounding is reserved for job dots and the stacked bar. Bottom sheets round only their top corners on mobile and all four from sm up. Borders are always 1px; the add-row button is the only dashed border.

## Components

### Buttons
Compact and quiet; weight comes from the single indigo fill, not from size.
- **Shape:** gently rounded (8px), 36px tall, 14px horizontal padding, 13-14px / 500 label, 6px gap to a 16px icon.
- **Primary:** indigo fill, white label; grows to 40px tall with 20px padding in sheet footers and 44px full-width for single-action sheets (解鎖, 複製回報文字).
- **Hover / Focus:** color transitions only; hover deepens to pressed indigo. Focus is a 2px indigo outline at 2px offset. Disabled drops to 45% opacity.
- **Secondary:** white with a hairline border and ink-2 label; hover strengthens the border and fills recess grey. Used in the top bar (工作項目, 重置示範資料) and for export, with a muted 16px icon leading.
- **Ghost:** no fill, ink-2 label, recess-grey hover. Cancel actions and week navigation.
- **Danger:** red label, red-wash hover, no fill.
- **Icon button:** 32px square, muted glyph, ink plus recess-grey on hover. Close, report, year-step.

### Segmented control
A recess-grey track with a hairline border and 2px inset; items are 28px tall, 13px / 500 muted text. The pressed item becomes white ink with the segment-lift shadow. Used for 週報 / 月報.

### Inputs / Fields
- **Style:** 44px tall, white, hairline border, 8px radius, 15px ink text, fog placeholder, indigo caret.
- **Focus:** border turns indigo and gains the 3px indigo-wash halo; hover strengthens the border first.
- **Label:** 13px / 500 muted, 6px above the field.
- **Price input:** an inline, borderless 28px numeric field that reveals a hairline and white fill on hover and the indigo focus treatment on focus. On mobile it renders as an underline in line-strong with a 40px touch height.
- **Error:** inline danger text under the formula; the field keeps its shape.

### Cards / Containers
- **Corner Style:** 14px.
- **Background:** sheet white on the paper ground.
- **Shadow Strategy:** none at rest (see Elevation & Depth).
- **Border:** 1px hairline.
- **Internal Padding:** 16px horizontal in tables; table headers 12px tall-padding with 12px / 500 muted labels; footers on 70% recess grey.

### Navigation
- **Top bar:** 56px, sticky, paper ground, bottom hairline. Left: a 24px ink tile holding the app mark, the product name at 15px / 600 (hidden under 400px), and the segmented view switch. Right: secondary buttons that collapse to icon-only below sm.
- **Period navigator:** a 36px white strip with hairline border and 8px radius; chevron buttons divided by internal hairlines, the range in 13px / 500 tabular figures between them.

### Bottom Sheet
White, 14px top radius on mobile (all corners at sm+), hairline border, sheet-float shadow, safe-area bottom padding. Header and footer are ruled off with hairlines; the title row carries a job dot, name and date meta line. Enters with opacity 0 to 1 and a 24px rise over 320ms on `cubic-bezier(0.16, 1, 0.3, 1)`.

### Formula Panel (signature)
A recess-grey, 8px-radius block (14px by 16px padding) inside the log sheet: the top line is the arithmetic in 13px muted tabular figures (`NT$ 180 × 5 小時`, with 無條件進位 at right for hourly jobs), the second line pairs 金額 with the live amount at 26px / 600. Price changes and validation messages appear inside the same panel. It updates on every keystroke and is announced politely.

### Week Summary + Stacked Bar (signature)
Total figure on the hairline-ruled band, then an 8px fully rounded bar on recess grey split into job-colored segments with 1px gaps, then a legend of dot, name and muted tabular subtotal at 13px. The month view reuses the band and bar.

### Feedback banner
8px radius, 1px border, 10px by 14px padding, 14px / 500. Loading: white with hairline and muted text. Error: red wash, red border at 25%, red text.

## Do's and Don'ts

### Do:
- **Do** keep indigo for actions, focus, selection and today; everything else is ink, slate and hairline.
- **Do** show the arithmetic beside any amount that has a source, in tabular caption figures.
- **Do** set every figure tabular and right-aligned, with a lighter, smaller NT$ prefix.
- **Do** separate content with 1px hairlines and tonal steps (paper, white, recess grey) instead of shadows.
- **Do** use 8px radius for controls, 14px for view-level containers, 6px for elements nested inside a control.
- **Do** keep touch targets at least 44px for fields, steppers and sheet actions, and 52px rows on mobile lists.
- **Do** use Lucide line icons at 14-16px in muted, inheriting ink on hover.

### Don't:
- **Don't** use a job color as text, background, border or row tint; it is a dot or a bar segment only.
- **Don't** put totals in rounded, shadowed cards or color them green; totals sit on a hairline band in ink.
- **Don't** add gradients, glass, blur, dark-first surfaces, ornament, mascots or physical-object metaphors.
- **Don't** add a shadow to anything that does not overlay the page or represent the selected segment.
- **Don't** use fog (faint) for any text a user must read; it is for placeholders, disabled state and decoration.
- **Don't** introduce a second action color; secondary emphasis is a bordered white button, not a new hue.
