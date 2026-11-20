# PROJECT_MAP.md — UPGRADER Project Structure

## Root Directory
```
UPGRADER_RECOVERY/
├── public/                 # Static assets (served as-is)
│   ├── backgrounds/        # (empty folder)
│   ├── case/               # (empty folder)
│   ├── fonts/              # Local WOFF2 fonts (Exo 2, Tektur)
│   ├── sounds/             # WAV sound files
│   ├── *.png               # UI images (panels, buttons, wheels, etc.)
│   ├── skins.json          # 8MB skin catalog (~2000+ skins from Steam CDN)
│   └── case/case-open.webm # Case opening video clip
├── src/                    # Source code
│   ├── components/         # React components
│   │   ├── profile/        # Profile page components
│   │   ├── AnimatedBalance.tsx
│   │   ├── CaseOpening.tsx
│   │   ├── FastAmountBar.tsx
│   │   ├── ImproveButton.tsx
│   │   ├── LockIcon.tsx
│   │   ├── SelectedSkinPanel.tsx
│   │   ├── SettingsModal.tsx
│   │   ├── SkinCatalog.tsx
│   │   ├── SkinsPanel.tsx
│   │   ├── SupportChat.tsx
│   │   ├── Tooltip.tsx
│   │   ├── UpgraderWheel.tsx
│   │   ├── WheelToolbar.tsx
│   │   └── WinEffect.tsx
│   ├── hooks/              # Custom React hooks
│   │   ├── useAnimatedNumber.ts
│   │   ├── useInventory.ts
│   │   ├── useProfileLog.ts
│   │   └── useSkins.ts
│   ├── *.ts                # Core logic modules
│   │   ├── compensation.ts     # Compensation drop logic
│   │   ├── profileStore.ts     # Profile types & ID generators
│   │   ├── quickSettings.ts    # Settings persistence (localStorage)
│   │   ├── rouletteProfile.ts  # Case opening animation timings
│   │   ├── sound.ts            # Web Audio API sound system
│   │   ├── spinProfiles.ts     # Wheel spin animation profiles
│   │   ├── upgraderMath.ts     # Math: chance, max bet, spin stop
│   │   ├── ...
│   ├── *.css               # Component & page styles
│   ├── App.tsx             # Main app: routing, global state, pages
│   ├── main.tsx            # Entry point
│   └── index.css           # Global base styles
├── _unused/                # Not connected to site (not in tsconfig include)
│   ├── CompensationCase.tsx  # Unfinished compensation animation (case + smoke + reel)
│   └── compensation.css      # Styles for CompensationCase
├── package.json            # Dependencies: react 19, react-router-dom 7, vite 8
├── vite.config.ts          # Vite config (react plugin only)
├── tsconfig.json           # TypeScript config (project references)
├── index.html              # HTML entry (title: "CS2 Skin Upgrade & CSGO Upgrader")
└── README.md               # Default Vite template readme
```

## Source Files Detail

### Core Application (`src/`)
| File | Purpose |
|------|---------|
| `App.tsx` | **Main component** — Router, global state (balance, inventory, profile), page components (UpgraderPage, WeeklyWheel, BattlesPage, ProfilePage), site header, counters, modals |
| `main.tsx` | Entry point — renders `<App />` + global `<Tooltip />` |
| `index.css` | Global base: CSS variables, fonts (Exo 2, Tektur via @font-face), #root container |

### Components (`src/components/`)
| File | Purpose |
|------|---------|
| `UpgraderWheel.tsx` | Central wheel: SVG arcs for chance %, animated arrow (CSS transform), labels 100%/50%/0%, result overlays (NO PROBLEM / Upgrade successful!) |
| `SkinCatalog.tsx` | Right catalog: 5×4 grid (19 skins/page), pagination, sort (price asc/desc), filters (price from/to, name search), reserved top-left cell |
| `SelectedSkinPanel.tsx` | Target skin panel (right side): weapon, name, image, price, optional win animation, close button, compensation label |
| `SkinsPanel.tsx` | Left panel (My Skins / Shop tabs): inventory grid (5×4), shop grid with qty picker, cart, buy flow, pagination, filters, balance slider |
| `FastAmountBar.tsx` | Quick buttons under wheel: x2/x4/x8 (multipliers) + 25%/55%/75% (percents) + settings gear |
| `ImproveButton.tsx` | Main action button: "Improve" / "Loading..." / "Add to upgrade", double-arrow icon |
| `WheelToolbar.tsx` | Icon row above left panel: info, settings, sound (with volume slider on hover), fast spin |
| `SettingsModal.tsx` | Modal (portal): quick selection multipliers/percents, sound toggle, scroll type (normal/fast) |
| `CaseOpening.tsx` | Full-screen case opening (normal spin): blur → WebM clip → roulette belt → flash → drop screen (Sell / Back to upgrade) |
| `WinEffect.tsx` | Canvas firework on selected skin: red tint, border, double chevron, particle bursts, smoke |
| `AnimatedBalance.tsx` | Slot-machine digit roll animation for balance changes |
| `Tooltip.tsx` | Global tooltip: `data-tooltip` on any element, fixed positioning, smooth show/hide |
| `LockIcon.tsx` | Lock SVG for disabled skins |
| `SupportChat.tsx` | Bottom-right support widget with screenshot + Telegram link (in `src/components/`, not in profile/) |

### Unused / Future (`_unused/`)
| File | Purpose |
|------|---------|
| `CompensationCase.tsx` | **Not connected to site** — unfinished compensation animation for normal spin: case drop + 5-card reel (3.2s easeOutQuart), smoke particles, winner highlight. Needs `COMPENSATION_WINNER_INDEX` and `Compensation` type in `compensation.ts`. Kept for future use. |
| `compensation.css` | Styles for `CompensationCase.tsx` (case drop, smoke, reel, cards, marker) |

#### Profile Components (`src/components/profile/`)
| File | Purpose |
|------|---------|
| `ProfileView.tsx` | Profile page layout: user info, balance, stats (best drop, withdrawn, upgrades, battles), tabs |
| `ProfileTabs.tsx` | Four tabs: Inventory (sell/withdraw), Items history, Games history, Battle history |
| `ProfileItemCard.tsx` | Skin card in profile grids: variant `full` (price, wear, name) or `plain` (image only), rarity glow |
| `ProfileSettingsModal.tsx` | Settings: nickname, trade URL, birth (DD.MM.YYYY, once), currency (COINS/USCOINS/EUCOINS/BRCOINS), privacy (private/friends/public), streamer mode toggle |
| `icons.tsx` | SVG icons for profile tabs: InventoryIcon, HistoryIcon, GamesIcon, BattlesIcon |
| `profile.css` | Profile page styles (grid, cards, animations, chevron train) |

### Hooks (`src/hooks/`)
| File | Purpose |
|------|---------|
| `useInventory.ts` | In-memory inventory: `add(skins)`, `remove(uids)`, returns `OwnedSkin[]` (Skin + uid) |
| `useProfileLog.ts` | Event log: `logItems(kind, skins)`, `logGame(game)`, computed stats (bestDrop, upgrades, withdrawn) |
| `useAnimatedNumber.ts` | Smooth number animation (cubic ease-out) for balance display |
| `useSkins.ts` | Singleton fetch + cache for `/skins.json` (Skin[] with id, weapon, name, wear, price, image, rarityColor) |

### Core Logic (`src/`)
| File | Purpose |
|------|---------|
| `upgraderMath.ts` | `calcChance(input, target)`, `getMaxBet(balance, skinsTotal, targetPrice)`, `isTargetAllowed()`, `rollSpinStop(chance)` → `{win, stop}`, constants: `CHANCE_MULTIPLIER=1.03`, `MAX_CHANCE=79.99`, `MIN_CHANCE=0.01`, `ARC_DEG_PER_PERCENT=1.72` |
| `spinProfiles.ts` | `SPIN_PROFILES.normal/fast`: cubic spline points (time→progress), `turns`, `motionMs`, `resultMs`, `holdMs`, `soundLeadMs`, `tickTimesMs` (frame-perfect from video) |
| `rouletteProfile.ts` | `CASE_TIMING`, `BELT` geometry, `BELT_PROFILE` spline, `COMP_CARD_TIMING` (compensation card slide in/shrink/out) |
| `compensation.ts` | `pickCompensation(catalog, input, targetPrice, recentIds)` → `{skin, kind, ratio}`; log-lerp mean ratio (anchors 100→25%, 10000→4.49%), spread 0.35–1.65×; `pickSkinNear()`, `pickBeltSkins()` |
| `sound.ts` | Web Audio: `preloadSounds()`, `unlockAudio()`, `playSound(name, delayMs)` with scheduled start; base gains per sound; master gain for volume |
| `profileStore.ts` | Types: `ItemEventKind`, `ItemEvent`, `GameRecord`, `BestDrop`, `ProfileSettings`, `DEFAULT_PROFILE_SETTINGS`, `AVATAR_PLACEHOLDER`; ID generators |
| `quickSettings.ts` | `loadQuickSettings()` / `saveQuickSettings()` from localStorage; `DEFAULT_QUICK_SETTINGS` (multipliers [2,4,8], percents [25,55,75], sound=true, fastScroll=false, volume=0.74) |

### Styles (`src/*.css`)
| File | Scope |
|------|-------|
| `App.css` | **Massive** (4798 lines): All page layouts, upgrader element positions, skin catalog grid, skins panel, selected skin panel, multi-panel, balance block, wheel, rewards page, battles page, profile page, bottom section, notifications, payments |
| `caseOpening.css` | Case opening: blur overlay, WebM clip, roulette panel, belt, cards, flash, drop screen buttons |
| `settingsModal.css` | Settings modal: overlay, cards, inputs (skewed), radio groups, save button |
| `wheelLabels.css` | Wheel labels (100%/50%/0%) + `is-covered` state |
| `upgradeSpin.css` | Arrow layer, lose/win result text styles |
| `tooltip.css` | Global tooltip: fixed, 32px height, 160/220ms transitions |
| `catalogLocks.css` | Locked skin appearance: dimmed image, opacity, lock icon |
| `winEffect.css` | Win animation keyframes: tint, border, chevron, hue-rotate on image/coin |
| `improveButton.css` | Improve button: gradient, glow, disabled state, icon |
| `wheelToolbar.css` | Toolbar icons: positions, sound popover volume slider |
| `SupportChat.css` | Support widget: fixed bottom-right, animated window |
| `profile.css` | Profile: grid layout, stats cards, chevron animation, tabs, item grids, modals |

## Public Assets (`public/`)
| Asset | Use |
|-------|-----|
| `background.png` | Site background (fixed, cover) |
| `top-panel.png` | Header background |
| `bottom-section.png` | Footer image |
| `wheel-no-labels.png` | Wheel base image (no text) |
| `weekly-wheel.png` | Weekly drop wheel |
| `wheel-arrow.png` | Weekly drop arrow |
| `arrow.png` | Upgrader wheel arrow |
| `my-skin.png` | "My Skin" placeholder (left panel) |
| `select-skin.png` | "Select Skin" placeholder (left target) |
| `select-skin-for-upgrade.png` | "Select Skin for Upgrade" (right target) |
| `selected-skin.png` | "Selected Skin" frame (right panel) |
| `upgrader-logo.png` | Page logo |
| `coins.png` | Coin icon (yellow) |
| `profile-coin.png` | Profile coin icon |
| `support.png` | Support chat screenshot/avatar |
| `skins.json` | Full skin catalog (~2000 entries from Steam CDN, 8MB) |
| `case/case-open.webm` | Case opening video (transparent WebM) |
| Fonts: `exo-2-*.woff2`, `tektur-*.woff2` | Local fonts (variable weight) |

### Sounds (`public/sounds/`)
| Asset | Use |
|-------|-----|
| `case-open.wav` | Case opening sound (~2.65s) |
| `spin-start.wav` | Normal spin start sound (0.7s) |
| `spin-start-fast.wav` | Fast spin start sound |
| `tick.wav` | Tick sound (35 per normal spin) |
| `win.wav` | Win firework sound (~3s) |
| `click.wav` | Click sound (skin clicks, Improve button) |

## Data Flow Summary
```
App.tsx (global state)
├── balance: number
├── inventory: OwnedSkin[] (via useInventory)
├── profileLog: {itemEvents, games, stats} (via useProfileLog)
├── profileSettings, avatar
└── quickSettings (localStorage)

UpgraderPage (core gameplay)
├── selectedSkin (target)
├── mineSelected[] (from SkinsPanel)
├── bet (coins from balance)
├── phase: idle | spinning | result | case
├── spin: {id, angle, duration, delay, fast, win, chance}
├── onSpend → inventory.remove + balance -= bet
├── onWin → inventory.add + profileLog.logItems('won')
├── onSell → balance += amount + profileLog.logItems('sold')
└── onGame → profileLog.logGame()

SkinsPanel (left)
├── tab: mine | shop
├── mine: toggle select (max 6), shows multi-panel or single panel
├── shop: add to cart (max 50), qty per skin, buy → onBuy(skins[])
└── balance slider (maxBet from upgraderMath)

SkinCatalog (right)
├── filters, sort, pagination
├── onSelect → UpgraderPage.selectedSkin
└── locks when chance out of [MIN_CHANCE, MAX_CHANCE]

CaseOpening (after loss with input > 100)
├── drop (pre-picked via compensation.ts)
├── belt animation (rouletteProfile.ts)
└── onSell/onKeep → closeCase()

ProfileView
├── inventory grid (sell/withdraw)
├── items history (bought/won/compensation/upgraded/sold/withdrawn)
├── games history (bet, target, chance, win/lose, compensation)
└── settings modal
```