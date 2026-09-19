---
version: 2.0
name: Classera-design-system
supersedes: v1.0 (Cursor/Figma-anchored) - fully replaced
sources: DESIGN(3) Clay + DESIGN(4) Expo only
description: >
  A warm, friendly product surface built from exactly two systems: Clay and Expo.
  The page floor is Clay's cream (#fffaf0) - the warmth is what separates this
  from every cool-grey ed-tech dashboard. Cards sit on it in Expo's pure white
  with a single soft drop shadow. Both source systems independently land on a
  near-black primary CTA (Clay #0a0a0a, Expo #000000), so black is the only
  action colour - never a saturated brand button. Colour instead comes from
  Clay's six saturated category cards (pink, teal, lavender, peach, ochre,
  mint), used as large surfaces that carry a section's identity. Radii are
  generous per Clay (12px controls, 16px cards, 24px feature cards, pill tags).
  Inter carries display at 500-600 with negative tracking; JetBrains Mono carries
  every code, metric, score and ID surface per Expo.

# ---------------------------------------------------------------------------
# Provenance - only two sources.
#   Clay  -> cream canvas, saturated category cards, generous radii, 44px
#            controls, cream (never dark) footer, 96px section rhythm.
#   Expo  -> white card surface, pure-black CTA, blue inline text-link,
#            hairlines, the single soft shadow tier, Inter + JetBrains Mono,
#            dark inverse panels for code and featured tiers.
#
# Cursor and Figma are NOT sources for this system. Anything that came from
# them - the warm-grey canvas, the rose accent, the pastel "stage" pills, the
# lime/lilac colour blocks, hairline-only depth - has been removed.
# ---------------------------------------------------------------------------

colors:
  # Action - both sources converge on near-black. This is the ONLY CTA fill.
  primary: "#0a0a0a"
  primary-active: "#1f1f1f"
  primary-disabled: "#e5e5e5"
  on-primary: "#ffffff"

  # Text (Clay ink ramp)
  ink: "#0a0a0a"
  body-strong: "#1a1a1a"
  body: "#3a3a3a"
  muted: "#6a6a6a"
  muted-soft: "#9a9a9a"
  on-dark: "#ffffff"
  on-dark-soft: "#a0a0a0"

  # Surface - Clay cream floor, Expo white card
  canvas: "#fffaf0"
  canvas-soft: "#faf5e8"
  surface-card: "#ffffff"
  surface-strong: "#f5f0e0"
  surface-inverse: "#0a1a1a"
  surface-inverse-elevated: "#1a2a2a"

  # Hairlines
  hairline: "#e5e5e5"
  hairline-soft: "#f0f0f0"
  hairline-strong: "#d6d2c4"

  # Category colours (Clay). Large surfaces, not accents.
  brand-pink: "#ff4d8b"
  brand-teal: "#1a3a3a"
  brand-lavender: "#b8a4ed"
  brand-peach: "#ffb084"
  brand-ochre: "#e8b94a"
  brand-mint: "#a4d4c5"
  brand-coral: "#ff6b5a"

  # Inline links (Expo) - never on a button
  text-link: "#0d74ce"

  # Semantic
  success: "#16a34a"
  warning: "#ab6400"
  error: "#ef4444"
  info: "#0d74ce"

typography:
  display-xl:  { fontFamily: Inter, fontSize: 72px, fontWeight: 500, lineHeight: 1.00, letterSpacing: -2.5px }
  display-lg:  { fontFamily: Inter, fontSize: 56px, fontWeight: 500, lineHeight: 1.05, letterSpacing: -2px }
  display-md:  { fontFamily: Inter, fontSize: 40px, fontWeight: 500, lineHeight: 1.10, letterSpacing: -1px }
  display-sm:  { fontFamily: Inter, fontSize: 32px, fontWeight: 500, lineHeight: 1.15, letterSpacing: -0.5px }
  title-lg:    { fontFamily: Inter, fontSize: 24px, fontWeight: 600, lineHeight: 1.30, letterSpacing: -0.3px }
  title-md:    { fontFamily: Inter, fontSize: 18px, fontWeight: 600, lineHeight: 1.40, letterSpacing: 0 }
  title-sm:    { fontFamily: Inter, fontSize: 16px, fontWeight: 600, lineHeight: 1.40, letterSpacing: 0 }
  body-md:     { fontFamily: Inter, fontSize: 16px, fontWeight: 400, lineHeight: 1.55, letterSpacing: 0 }
  body-sm:     { fontFamily: Inter, fontSize: 14px, fontWeight: 400, lineHeight: 1.55, letterSpacing: 0 }
  caption:     { fontFamily: Inter, fontSize: 13px, fontWeight: 500, lineHeight: 1.40, letterSpacing: 0 }
  eyebrow:     { fontFamily: Inter, fontSize: 12px, fontWeight: 600, lineHeight: 1.40, letterSpacing: 1.5px, textTransform: uppercase }
  code:        { fontFamily: "JetBrains Mono", fontSize: 13px, fontWeight: 400, lineHeight: 1.5, letterSpacing: 0 }
  metric:      { fontFamily: "JetBrains Mono", fontSize: 36px, fontWeight: 500, lineHeight: 1.1, letterSpacing: -1px }
  button:      { fontFamily: Inter, fontSize: 14px, fontWeight: 600, lineHeight: 1.0, letterSpacing: 0 }
  nav-link:    { fontFamily: Inter, fontSize: 14px, fontWeight: 500, lineHeight: 1.4, letterSpacing: 0 }

rounded:
  xs: 6px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  pill: 9999px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  base: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  section: 96px
---

## Overview

Classera reads as a **warm, confident product surface**. Cream floor, white cards,
black actions, and big saturated colour cards that give each area of the app its
own identity.

**Key characteristics**

- Cream canvas (`{colors.canvas}` #fffaf0). Never cool grey, never pure white.
- **Black is the only action colour.** No saturated brand buttons, ever.
- Six saturated category cards carry colour - as surfaces, not accents.
- Generous radii: 12px controls, 16px cards, 24px feature cards, pill tags.
- **One** soft shadow tier (Expo). No stacked elevation.
- Inter 500-600 display with negative tracking; JetBrains Mono on every number.
- 96px section rhythm. Controls are 44px tall.

## Colors

### Action
- **Primary** (`{colors.primary}` #0a0a0a) - every primary CTA, active nav pill,
  selected tab. White text on it is 19.6:1.
- **Primary Active** (`{colors.primary-active}` #1f1f1f) - press state.
- **Disabled** (`{colors.primary-disabled}` #e5e5e5) with `{colors.muted}` text.

Both source systems chose a near-black CTA independently. That agreement is the
backbone here: colour lives in *surfaces*, restraint lives in *actions*.

### Surface
| Token | Hex | Use |
|---|---|---|
| `{colors.canvas}` | #fffaf0 | Page floor |
| `{colors.canvas-soft}` | #faf5e8 | Nested panes, table headers, sidebar rail |
| `{colors.surface-card}` | #ffffff | Cards - the primary depth cue |
| `{colors.surface-strong}` | #f5f0e0 | Tag pills, progress tracks, icon plates |
| `{colors.surface-inverse}` | #0a1a1a | Dark feature panels, code blocks, featured tier |

### Category Colours (signature)
Clay's saturated palette. These are **large surfaces** - a feature card, a
category tile, an empty-state panel - never button fills or icon tints.

| Area | Token | Hex | Text on it |
|---|---|---|---|
| Courses | `brand-ochre` | #e8b94a | ink |
| Communities | `brand-lavender` | #b8a4ed | ink |
| Projects | `brand-mint` | #a4d4c5 | ink |
| Live Sessions | `brand-peach` | #ffb084 | ink |
| Tests | `brand-pink` | #ff4d8b | **white** |
| Achievements | `brand-coral` | #ff6b5a | ink |
| Featured / Pro | `brand-teal` | #1a3a3a | **white** |

Pink and teal are dark/saturated enough for white text. The other four take ink.
Never repeat the same category colour in two adjacent cards.

### Text
`{colors.ink}` #0a0a0a headings · `{colors.body}` #3a3a3a running text ·
`{colors.muted}` #6a6a6a sub-labels · `{colors.muted-soft}` #9a9a9a disabled only.

### Links & Semantic
- **Inline link** `{colors.text-link}` #0d74ce - body copy only, **never on a button** (Expo rule).
- Success #16a34a · Warning #ab6400 · Error #ef4444 · Info #0d74ce.

## Typography

**Inter** everywhere (Clay's documented substitute for Plain Black; Expo's native
family). Display sits at **500** with negative tracking - Clay is explicit that
700 reads bombastic. **JetBrains Mono** carries every code, metric, score,
duration and ID surface (Expo rule).

Numbers that get compared are Mono with tabular figures - a column of
proportional digits reads visibly ragged.

## Layout

- Base unit 4px. Section rhythm **96px**. Max content width **1280px**.
- Dashboard shell: **260px** sidebar rail, **64px** header, 32px content padding.
- Card padding 24px; feature/category card padding 32px.

## Elevation & Depth

Clay uses colour contrast for depth; Expo permits exactly one soft shadow. Combined:

| Level | Treatment | Use |
|---|---|---|
| Flat | `{colors.canvas}` | Page bands, header, footer |
| Card | `{colors.surface-card}` + `0 4px 12px rgba(0,0,0,0.04)` | Content cards |
| Hairline | 1px `{colors.hairline}` | Inputs, dividers, table rows |
| Saturated | `brand-*` fill, no shadow | Category / feature cards |
| Inverse | `{colors.surface-inverse}` | Dark panels, code, featured tier |
| Modal | card + `0 12px 32px rgba(0,0,0,0.10)`, scrim `rgba(10,10,10,0.5)` | Dialogs |

No second shadow tier. No glow. No stacked elevation.

## Shapes

| Token | Value | Use |
|---|---|---|
| `{rounded.xs}` | 6px | Small badges, dropdown items |
| `{rounded.sm}` | 8px | Compact rows, checkboxes |
| `{rounded.md}` | 12px | Buttons, inputs, selects |
| `{rounded.lg}` | 16px | Content cards, panels |
| `{rounted.xl}` | 24px | Category / feature cards, hero panels |
| `{rounded.pill}` | 9999px | Tags, status pills, avatars, nav pills |

## Components

### Buttons
Height **44px**, radius **12px**, padding 12x20, label Inter 14/600.

| Variant | Background | Text | Border |
|---|---|---|---|
| `primary` | `{colors.primary}` | white | - |
| `secondary` | `{colors.surface-card}` | ink | 1px hairline |
| `on-color` | white | ink | - (for use on saturated cards) |
| `ghost` | transparent | ink | - |
| `danger` | `{colors.error}` | white | - |

One primary per view. Disabled -> `primary-disabled` fill, `muted` text.

### Header (64px)
Wordmark left · search field centre (pill, 44px, `canvas-soft`) · notification
bell + avatar right. Cream background, 1px bottom hairline. Avatar is a circle
with initials fallback on `{colors.primary}`.

### Sidebar (260px)
Rail on `{colors.canvas-soft}` with a 1px right hairline. Rows are 44px,
radius 12px, icon + label.
- **Active: solid `{colors.primary}` fill with white text and white icon.**
  This is the reference pattern - a filled dark pill - and is consistent with
  black being the action colour.
- Hover: `{colors.surface-strong}`. Section labels use the eyebrow style.

### Cards
`{colors.surface-card}`, radius 16px, padding 24px, soft shadow. Hover raises
the shadow slightly - no lift, no scale.

- **Stat card** - eyebrow label, Mono metric, semantic delta with a worded direction.
- **Category card** - saturated `brand-*` fill, radius 24px, padding 32px.
- **Featured card** - `surface-inverse` or `brand-teal`, white text.

### Forms
Inputs 44px, radius 12px, white fill, 1px `hairline-strong`.
Focus thickens the border to `{colors.ink}` (Expo) plus a 3px neutral ring.
Errors: 1px error border, message below, `aria-invalid` set.

### Status pills
Pill radius, 4x12 padding, caption type. Semantic colour at 12% opacity fill
with the full-strength colour as text. Never colour alone - always a label.

### Tables
Header row `canvas-soft`, title-sm type. Rows separated by 1px `hairline-soft`,
12px vertical padding, hover `canvas-soft`. Numeric columns Mono, right-aligned.

## Motion

- 150ms micro / 250ms panels, `cubic-bezier(0.4, 0, 0.2, 1)`.
- Animate `opacity` and `transform` only.
- Honour `prefers-reduced-motion`.

## Accessibility

- White on `{colors.primary}` = 19.6:1.
- Ink on cream = 18.4:1. `{colors.body}` on cream = 10.4:1. `{colors.muted}` = 5.4:1.
- `{colors.muted-soft}` is disabled/decorative only.
- On category cards: ink on ochre/lavender/peach/mint/coral; **white only on pink and teal**.
- Focus visible on every control. Targets 44px.

## Do's and Don'ts

**Do**
- Anchor every page on cream. The warm tint is the system's signature.
- Keep CTAs black.
- Let category colour arrive as a large surface.
- Put comparable numbers in Mono.
- Keep the cream footer - never dark (Clay is explicit).

**Don't**
- Don't make a saturated brand-coloured button.
- Don't use `text-link` blue on a CTA.
- Don't exceed display weight 500.
- Don't add a second shadow tier or any glow.
- Don't use cool grey anywhere.
- Don't repeat a category colour in adjacent cards.

## Responsive

| Breakpoint | Width | Changes |
|---|---|---|
| Mobile | < 768px | Sidebar -> bottom bar; grids 1-up; display 72->36px |
| Tablet | 768-1024px | Sidebar -> icon rail; grids 2-up |
| Desktop | 1024-1440px | Full 260px sidebar; grids 3-up |
| Wide | > 1440px | Content caps at 1280px |

## Scope

The marketing landing page (`/`) is **out of scope and must not be modified**.
Everything else - auth, onboarding, dashboards, courses, communities, projects,
tests, roadmaps, guides, portfolio, AI tools - follows this system.
