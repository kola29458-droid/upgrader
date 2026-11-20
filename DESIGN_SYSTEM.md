# DESIGN_SYSTEM.md — UPGRADER Visual Design System

## Color Palette

### Primary Brand Colors
| Name | Value | Usage |
|------|-------|-------|
| Gold/Yellow (Primary) | `#FCD711` / `#FBD506` | Buttons, highlights, progress rings, win amounts, active nav |
| Gold Gradient | `linear-gradient(93deg, #FBC206 1.16%, #FFDD23 50.58%, #FBD506 100%)` | Main buttons, "Sell all", Save button, balance arrow |
| Gold Light | `#FFE44D` | Hover states on gold buttons |
| Gold Dark | `#E8D414` | Percent button borders (yellow) |

### Semantic Colors
| Name | Value | Usage |
|------|-------|-------|
| Red (Danger/Error) | `#E8532B` / `#E7463D` | Error states, "Lose" badge, fail shake, percent button border (red) |
| Red Gradient | `linear-gradient(to bottom, #FF6B6B, #FFC9C9)` | "NO PROBLEM" text |
| Green (Success) | `#2FDC12` / `#24D17A` | "Win" badge, success states, percent button border (green) |
| Green Gradient | `linear-gradient(to bottom, #25D80D, #BBE313...#E24F2A)` | Wheel chance arc (bottom→top) |
| Blue (Info) | `#5E98D9` | Default rarity (Consumer Grade) |

### UI Surface Colors (Dark Theme — Actual)
| Name | Value | Usage |
|------|-------|-------|
| Background | `#101012` / `#16171D` | Page background (via background.png) |
| Panel Dark | `#17181C` | Card backgrounds, skin cards, modals |
| Panel Medium | `#1E1F23` | Headers, active tabs, input backgrounds |
| Panel Light | `#292A2E` | Borders, disabled inputs, toggle tracks |
| Border Subtle | `#FFFFFF1A` / `rgba(255,255,255,0.1)` | Card borders, input borders |
| Border Accent | `#FBD506` | Focus rings, active states, gold buttons |
| Text Primary | `#FFFFFF` | Main text |
| Text Secondary | `#A7A7A7` / `#ADADB2` | Labels, placeholders, disabled text |
| Text Muted | `#88888F` / `#9A9AA2` | Wear names, weapon names, empty states |
| Text Disabled | `#6B6C72` / `#7B7C80` | Disabled buttons, invalid inputs |

### Rarity Colors (from Steam/skins.json)
| Tier | Color (rgb) | Hex Approx | Example Skins |
|------|-------------|------------|---------------|
| Consumer Grade | `rgb(94, 152, 217)` | `#5E98D9` | Polished Malachite |
| Industrial Grade | `rgb(94, 152, 217)` | `#5E98D9` | — |
| Mil-Spec | `rgb(76, 182, 229)` | `#4CB6E5` | — |
| Restricted | `rgb(136, 71, 255)` | `#8847FF` | — |
| Classified | `rgb(211, 44, 230)` | `#D32CE6` | — |
| Covert | `rgb(235, 75, 75)` | `#EB4B4B` | — |
| Contraband/★ | `rgb(235, 175, 75)` | `#EBAF4B` | Knives, gloves |
| Gold (Weekly) | `rgb(252, 215, 17)` | `#FCD711` | Weekly drop wheel |

### Gradient Definitions
```css
/* Gold button gradient (used everywhere) */
--gold-gradient: linear-gradient(93deg, #FBC206 1.16%, #FFDD23 50.58%, #FBD506 100%);

/* Wheel chance arc (bottom=green → top=red) */
--wheel-gradient: linear-gradient(
  to bottom,
  #25D80D,    /* 0% - green */
  #BBD313,    /* ~15% */
  #D8D214,    /* ~30% */
  #E7D215,    /* ~40% */
  #EBC715,    /* ~50% */
  #ECB116,    /* ~60% */
  #E67F1D,    /* ~70% */
  #E36620,    /* ~80% */
  #E24F2A     /* 100% - red */
);

/* Rarity glow radial (used in skin cards) */
radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--rarity) 30%, transparent), transparent 65%)
```

## Typography

### Font Families
| Family | Weights | Source | Usage |
|--------|---------|--------|-------|
| **Exo 2** | 100–900 (variable) | Local WOFF2 (`public/fonts/exo-2-*.woff2`) | Primary UI: buttons, labels, prices, weapon names, most text |
| **Tektur** | 400–900 (variable) | Local WOFF2 (`public/fonts/tektur-*.woff2`) | Display numbers: balance amounts, prices, counters, percentages |
| **System UI** | — | Fallback | `index.css` fallback stack |

### Font Loading (index.css)
```css
@font-face {
  font-family: 'Exo 2';
  font-weight: 100 900;
  font-display: swap;
  src: url('/fonts/exo-2-latin-wght-normal.woff2') format('woff2-variations');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, ...;
}
@font-face { /* Cyrillic */ ... }
@font-face {
  font-family: 'Tektur';
  font-weight: 400 900;
  font-display: swap;
  src: url('/fonts/tektur-latin-wght-normal.woff2') format('woff2-variations');
  unicode-range: U+0000-00FF, ...;
}
@font-face { /* Cyrillic */ ... }
```

### Type Scale (Rem-based, base 18px in index.css / 16px in App.css)
| Element | Font | Size | Weight | Line Height | Letter Spacing |
|---------|------|------|--------|-------------|----------------|
| Page Title (h1) | Exo 2 | 56px / 3.5rem | 500 | 118% | -1.68px |
| Section Title (h2) | Exo 2 | 24px / 1.5rem | 500 | 118% | -0.24px |
| Balance Amount | Tektur | 32px / 2rem | 700 | 1 | tabular-nums |
| Skin Price | Tektur | 13-15px | 700 | 1.2 | tabular-nums |
| Button Text | Exo 2 | 14-20px | 600-700 | 1.25 | — |
| Body / Label | Exo 2 | 12-14px | 400-500 | 1.2-1.6 | — |
| Small / Caption | Exo 2 | 10-12px | 500-600 | 1.2 | — |
| Skin Name | Exo 2 | 11-12px | 700-800 | 1.25 | — |
| Skin Weapon | Exo 2 | 7-9px | 600 | 1.2 | uppercase |

### Special Text Effects
```css
/* Gold gradient text (balance, prices, stats) */
.pf-gradient-text {
  background: linear-gradient(93deg, #FBC206 1.16%, #FFDD23 50.58%, #FBD506 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

/* Wheel percentage labels */
.upgrader-wheel__labels text {
  font-family: 'Exo 2';
  font-size: 10px;
  font-weight: 550;
  fill: #8F8F97;           /* default */
  fill: #FFFEFE7A;         /* .is-covered (over arc) */
}

/* "NO PROBLEM" lose text */
.upgrader-wheel__lose {
  font-family: 'Exo 2';
  font-size: 36px;
  font-weight: 700;
  line-height: 1.08;
  background: linear-gradient(to bottom, #FF6B6B, #FFC9C9);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
```

## Spacing & Layout

### Base Unit
- **4px** (0.25rem) — fundamental spacing unit
- Most paddings/margins are multiples of 4px: 4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64

### Layout Grid (Upgrader Page)
All positions absolute, based on 1920px design width:

| Element | Left | Top | Width | Height |
|---------|------|-----|-------|--------|
| Wheel (center) | 879px | 90px | 365px | 365px |
| My Skin (left bg) | 464px | 539px | 597px | 597px |
| Select Skin (left target) | 477px | 87px | 373px | 373px |
| Selected Skin (right target) | 1265px | 87px | 373px | 373px |
| Selected Skin Panel | 1265px | 101px | 373px | 345px |
| Selected Skin (right bg) | 1052px | 540px | 595px | 595px |
| Improve Button | 897px | 448px | 322px | 100px |
| Fast Amount Bar | 50% (+496px) | 477px | 372px | — |
| Skin Catalog | 1064px | 617px | 565px | — |
| Skins Panel (left) | 475px | 547px | 575px | 580px |
| Multi Panel | 477px | 100px | 373px | 345px |
| Balance Block | 477px | 460-467px | 373px | — |
| Wheel Toolbar | 482px | 74px | — | 16px |

### Page Heights (min-height)
| Page | min-height | Bottom Section Top |
|------|------------|-------------------|
| Upgrader | 1640px | 1265px |
| Weekly Drop | 150vh | 1002px |
| Battles | 860px | 520px |
| Profile | 110vh | 750px |

### Border Radius Scale
| Size | Value | Usage |
|------|-------|-------|
| xs | 4px / 0.25rem | Small badges, chips |
| sm | 6px / 0.375rem | Skin cards, profile cards |
| md | 8px / 0.5rem | Buttons, inputs, modals |
| lg | 10px / 0.625rem | Large buttons, tabs, panels |
| xl | 12px / 0.75rem | Modal containers, profile blocks |
| 2xl | 16px / 1rem | Settings modal |
| 3xl | 24px / 1.5rem | Settings modal (mobile) |
| full | 999px / 50% | Circular: avatars, toggles, badges |

### Shadows
```css
/* Standard elevation */
--shadow-sm: 0 2px 4px rgba(0,0,0,0.15);
--shadow-md: 0 6px 20px rgba(0,0,0,0.2);
--shadow-lg: 0 10px 30px rgba(0,0,0,0.35);
--shadow-xl: 0 16px 44px rgba(0,0,0,0.42);

/* Gold glow (hover on primary buttons) */
--gold-glow: 0 0 20px 0 rgba(255, 171, 27, 0.8);

/* Inset glow (skin card hover) */
--inset-glow: inset 0 1px 0 rgba(255,255,255,0.45);

/* Wheel arc gradient stroke */
stroke: url(#wheel-grad); /* defined in UpgraderWheel SVG defs */
```

## Component Visual Specifications

### Buttons

#### Primary (Gold Gradient)
```css
.improve-btn, .sp-buy, .pf-topup, .sm-save, .weekly-drop-topup-button {
  background: linear-gradient(93deg, #FBC206 1.16%, #FFDD23 50.58%, #FBD506 100%);
  color: #17181C / #101012;
  border: none;
  border-radius: 10-12px;
  font-family: 'Exo 2' / 'Tektur';
  font-weight: 600-700;
  transition: filter 0.2s, box-shadow 0.2s, transform 0.1s;
}
:hover { filter: brightness(1.07-1.1); box-shadow: var(--gold-glow); }
:active { transform: translateY(1px); }
:disabled { opacity: 0.5-0.6; cursor: not-allowed; }
```

#### Secondary (Dark + Border)
```css
.balance-main, .balance-arrow, .pf-sellall, .pf-loadmore__btn {
  background: #17181C / #1E1F23 / #202022;
  border: 1px solid #FEDB1A33 / #FBD506 / #FFFFFF1A;
  color: #FFFFFF / #FBD506;
  border-radius: 8-10px;
}
:hover { filter: brightness(1.15) / background: #FFFFFF1A; }
```

#### Ghost/Icon (Toolbar, Tabs)
```css
.wt-btn, .pf-tab, .sp-tab, .catalog-arrow {
  background: transparent / #17181C / #FFFFFF0D;
  border: none / 1px solid #FFFFFF1A;
  color: #A7A7A7 (gray) / #FFE02D (yellow active);
  width: 16-40px; height: 16-40px;
  border-radius: 6-10px;
}
:hover { filter: brightness(0.5-1.5); background: #FFFFFF1A; }
.selected/active { background: #FBD506; color: #17181C; }
```

#### Toggle Switch
```css
.pf-toggle {
  width: 36px; height: 20px; border-radius: 999px;
  background: #FFFFFF1A (off) / #FDD911 (on);
}
.pf-toggle__knob {
  width: 16px; height: 16px; border-radius: 50%;
  background: #FFFFFF (off, opacity 0.5) / #17181D (on);
  transform: translateX(0) / translateX(16px);
  transition: transform 0.2s;
}
```

### Inputs
```css
/* Standard dark input */
.sm-input, .pf-set__input, .sp-field input, .skin-filter__field input {
  background: #17181C / #1E1F23 / transparent;
  border: 1px solid #FFFFFF1A;
  border-radius: 6-10px;
  color: #FFFFFF;
  font-family: 'Exo 2' / 'Tektur';
  padding: 0 8-16px;
  height: 38-50px;
}
:focus { border-color: #FBD506; }
.is-invalid { border-color: #E7463D; }

/* Skewed buttons (Fast Amount Bar) */
.fast-bar-btn {
  transform: skewX(-6deg);
  background: #17181C;
  border: 1px solid #FFFFFF1A;
}
.fast-bar-btn span { transform: skewX(6deg); } /* counter-skew text */

/* Range slider (Balance) */
.custom-range {
  -webkit-appearance: none; height: 16px; background: transparent;
}
::-webkit-slider-runnable-track {
  height: 4px; border-radius: 4px;
  border: 1px solid rgba(255,246,168,0.45);
  background: linear-gradient(to right, #FBD506 var(--progress), rgba(255,255,255,0.22) var(--progress));
}
::-webkit-slider-thumb {
  width: 16px; height: 16px; border-radius: 50%;
  background: #FDD807; margin-top: -7px;
}
```

### Cards

#### Skin Card (Catalog/Inventory)
```css
.skin-card {
  aspect-ratio: 1/1; border-radius: 0.4rem (6.4px);
  overflow: hidden; cursor: pointer;
  background: 
    url(logo-pattern) 2px 0 / 100% no-repeat,
    radial-gradient(circle at 50% 50%, color-mix(var(--rarity) 29%), transparent 65%),
    #17181C;
}
.skin-card::after { /* Gradient border */
  inset: 0; padding: 1.5px; border-radius: inherit;
  background: linear-gradient(135deg, var(--rarity), color-mix(var(--rarity) 42%), transparent 75%);
  -webkit-mask-composite: xor; mask-composite: exclude;
  opacity: 0.7;
}
.skin-card__image { width: 76%; height: 76%; transform: translate(-50%, -52%); }
.skin-card--selected .skin-card__sel-bg { opacity: 1; } /* Yellow overlay */
.skin-card--selected .skin-card__mark { opacity: 1; transform: scale(1); } /* Checkmark */
.skin-card--locked { cursor: not-allowed; filter: brightness(0.42); opacity: 0.7; }
```

#### Profile Item Card
```css
.pf-card {
  width: 100%; height: 100%; padding: 1px; border-radius: 6px;
  background: linear-gradient(137deg, var(--rarity) 10%, #1C1C20 75%);
  box-shadow: 0 0 2.4px rgba(255,255,255,0.1);
}
.pf-card__inner { background: #1D1E22 url(logo-pattern) center/50% no-repeat; }
.pf-card__glow { radial-gradient(circle, color-mix(var(--rarity) 40%), transparent 70%); }
:hover .pf-card__glow { transform: scale(1.1); filter: brightness(2); }
```

### Modals & Overlays
```css
/* Settings Modal */
.sm-overlay {
  backdrop-filter: blur(10px); background: transparent;
  animation: fade-in 220ms ease-out;
}
.sm-modal {
  max-width: 580px; background: #17181C;
  border: 1px solid #FFFFFF14; border-radius: 24px;
  box-shadow: 0 24px 80px rgba(0,0,0,0.6);
  animation: slide-up 260ms cubic-bezier(0.16,1,0.3,1);
}

/* Case Opening */
.co-blur { backdrop-filter: blur(0→8px) brightness(1→0.96); transition: 400ms; }
.co-clip { WebM video, 920×420, absolute positioned; }
.co-panel { 1160×382, bg #17181B, border-radius 12px; }

/* Notifications */
.notifications-panel {
  width: 360px; bg: rgba(25,26,29,0.72) + gradient overlay;
  backdrop-filter: blur(30px) saturate(190%);
  border: 1px solid rgba(255,255,255,0.16);
  animation: slide-down 220ms ease;
}
```

### Animations & Transitions

#### Timing Standards
| Duration | Easing | Usage |
|----------|--------|-------|
| 120ms | linear | Reduced motion |
| 150ms | cubic-bezier(0.4,0,0.2,1) | Button hover, input focus |
| 160-220ms | ease-in / ease-out | Tooltip, modal overlay |
| 250ms | ease | Panel fade, modal close |
| 260ms | cubic-bezier(0.16,1,0.3,1) | Modal enter |
| 280ms | cubic-bezier(0.22,0.7,0.3,1) | Comp card slide in |
| 300ms | ease | Volume slider, sound popover |
| 350ms | cubic ease-out | Chance number animation |
| 400ms | ease-out | Blur in/out |
| 900ms | cubic-bezier(0.35,0,0.2,1) | Balance digit roll |
| 1.5-3.3s | custom cubic | Win effect, wheel spin, case belt |

#### Keyframe Animations (Defined in CSS)
```css
/* Balance digit roll */
@keyframes balance-digit-roll {
  0% { transform: translateY(0); filter: blur(0); }
  18%, 68% { filter: blur(0.8px); }
  100% { transform: translateY(var(--roll-offset)); filter: blur(0); }
}

/* Win effect */
@keyframes winTint { 0%{opacity:0} 15%{.55} 40%{1} 75%{1} 100%{0} }
@keyframes winChevron { 0%{opacity:0;scale:.6} 27%{1;1} 80%{1;1.05} 100%{0;1.35;blur7px} }

/* Case opening */
@keyframes coFlash { 0%{0} 22%{.88} 60%{.6} 100%{0} }
@keyframes coWinnerPop { 0%{1} 35%{1.55} 70%{1.45} 100%{1} }

/* Weekly drop button jump */
@keyframes weeklyTopupJump { 0%,75%,100%{0} 82%{-6px} 89%{0} 94%{-3px} }

/* Chevron train (Best Drop) */
@keyframes pf-chevron-move { 0%,21.25%{0} 51.25%,100%{translateY(-2 steps)} }
@keyframes pf-chevron-tint { 0%,21.25%{color1} 25%,47.5%{color2} 51.25%,100%{color1} }

/* Tooltip */
@keyframes tooltip-show { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:0} }
```

#### Wheel Spin (Procedural — spinProfiles.ts)
- **Normal**: 6 turns, 6826ms motion, cubic spline with 63 points (frame-perfect from 60fps video)
- **Fast**: 3 turns, 1457ms motion, 26 points
- **Sound lead**: 235ms (audio starts before visual)
- **Ticks**: 35 scheduled at exact ms from video analysis

#### Case Belt (Procedural — rouletteProfile.ts)
- 73 cards, 217px + 16px gap = 233px pitch
- Travel: 14190px over 8867ms
- Cubic spline with 36 points (frame-perfect from video)

## Responsive Behavior

### Breakpoints
| Breakpoint | Value | Changes |
|------------|-------|---------|
| Mobile | ≤ 600px | Notifications panel fixed, settings modal full-width |
| Tablet | ≤ 1024px | Base font 16px (from 18px), lock icon 20px (from 28px) |
| Desktop | > 1024px | Full layout, all animations enabled |

### Media Queries (Found in CSS)
```css
@media (max-width: 1024px) { font-size: 16px; .lock-size: 20px; }
@media (max-width: 640px) { .sm-cards { flex-direction: column; } }
@media (max-width: 600px) { .notifications-panel { position: fixed; right: 12px; } }
@media (prefers-reduced-motion: reduce) { /* disable transitions */ }
@media (prefers-color-scheme: dark) { /* CSS vars overridden in index.css */ }
```

## Images & Assets

### Key UI Images (public/)
| File | Dimensions | Purpose |
|------|------------|---------|
| background.png | ~1920×2000+ | Full-page fixed background |
| top-panel.png | 1920×52 | Header bar background |
| bottom-section.png | 1710×~300 | Footer section |
| wheel-no-labels.png | 365×365 | Wheel base (no text) |
| weekly-wheel.png | 360×360 | Weekly drop wheel |
| my-skin.png | 597×597 | Left "My Skin" placeholder |
| select-skin.png | 373×373 | Left target placeholder |
| select-skin-for-upgrade.png | 373×373 | Right target placeholder |
| selected-skin.png | 595×595 | Right "Selected Skin" frame |
| upgrader-logo.png | 177×auto | Page logo |
| coins.png | 21×21 | Coin icon (yellow) |
| profile-coin.png | 16×16 | Profile coin icon |
| arrow.png | 26×54 | Wheel arrow |
| wheel-arrow.png | 34×auto | Weekly wheel arrow |
| case-open.webm | 920×420 | Transparent case opening video |

### Skin Images
- Source: Steam CDN (`community.akamai.steamstatic.com/economy/image/.../360fx360f`)
- Format: WebP/PNG via Steam CDN, 360×360
- Loading: `loading="lazy" decoding="async"` on all catalog/profile cards

### Fonts (public/fonts/)
- `exo-2-latin-wght-normal.woff2` — 39.9 KB
- `exo-2-cyrillic-wght-normal.woff2` — 19.1 KB
- `tektur-latin-wght-normal.woff2` — 11.9 KB
- `tektur-cyrillic-wght-normal.woff2` — 8.5 KB
- All variable weight (100-900 or 400-900), `font-display: swap`

## Icon System
- **Inline SVG** — Most icons (arrows, chevrons, lock, gear, speaker, etc.)
- **External SVG** — Some from `https://s3.upgrader.pro/cdn/fa/icons/...` (Steam, bell, trash, shop, etc.)
- **PNG** — Coin icons, avatar placeholder (data URI), support avatar
- **CSS Mask** — Gradient borders using `-webkit-mask-composite: xor`

## Accessibility
- Semantic HTML: `<button>`, `<label>`, `<input>`, `<nav>`, `<main>`, `<article>`
- ARIA: `aria-label`, `aria-expanded`, `aria-pressed`, `aria-disabled`, `aria-live="polite"` (AnimatedBalance), `role="tooltip"`, `role="dialog" aria-modal="true"`
- Focus visible: `outline: 2px solid #FBD50680; outline-offset: 2-3px`
- Color contrast: Gold on dark meets WCAG AA; red/green badges have sufficient contrast
- Reduced motion: `@media (prefers-reduced-motion: reduce)` disables transitions/animations
- Keyboard: All interactive elements reachable, `Enter`/`Space` handlers on custom buttons