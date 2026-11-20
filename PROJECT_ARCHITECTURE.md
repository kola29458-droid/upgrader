# PROJECT_ARCHITECTURE.md — UPGRADER Architecture & Component Relationships

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser                                  │
├─────────────────────────────────────────────────────────────────┤
│  React 19 + React Router 7 (BrowserRouter)                      │
│  Vite 8 (dev server, HMR, build)                                │
│  TypeScript 6 (strict, project references)                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        App.tsx (Root)                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │ Global State │  │   Routing    │  │   Shared Providers   │   │
│  │              │  │              │  │                      │   │
│  │ • balance    │  │ /en          │  │ • Tooltip (portal)   │   │
│  │ • inventory  │  │ /en/weekly-  │  │ • Sound context      │   │
│  │ • profileLog │  │   drop       │  │   (module-level)     │   │
│  │ • settings   │  │ /en/battles  │  │ • Fonts (CSS @font-  │   │
│  │ • quickSettings│ /en/profile  │  │   face in index.css) │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│  UpgraderPage │    │ WeeklyDropPage│    │  ProfilePage  │
│  (main game)  │    │ (rewards)     │    │  (profile)    │
└───────────────┘    └───────────────┘    └───────────────┘
        │                     │                     │
        ▼                     ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Shared Component Layer                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │UpgraderW │ │ SkinCat- │ │SkinsPan- │ │FastAmtBar│           │
│  │heel      │ │alog      │ │el        │ │          │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │Selected  │ │ImproveBtn│ │WheelTool-│ │Settings  │           │
│  │SkinPanel │ │          │ │bar       │ │Modal     │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐ ┌──────────────┐   │
│  │CaseOpen- │ │WinEffect │ │Animated  │ │ProfileItem   │ │  _unused/    │   │
│  │ing       │ │          │ │Balance   │ │Card          │ │Compensation- │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```
**Note**: `CompensationCase.tsx` and `compensation.css` moved to `_unused/` — not connected to site (not in `tsconfig.app.json` include). Unfinished compensation animation for normal spin (case drop + reel + smoke), kept for future use.
        │                     │                     │
        ▼                     ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Core Logic Modules                          │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             │
│  │upgraderMath  │ │ spinProfiles │ │ compensation │             │
│  │(chance, bet, │ │(animation    │ │(drop logic)  │             │
│  │ spin stop)   │ │ curves)      │ │              │             │
│  └──────────────┘ └──────────────┘ └──────────────┘             │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             │
│  │   sound.ts   │ │rouletteProf. │ │profileStore  │             │
│  │(Web Audio)   │ │(case anim)   │ │(types, IDs)  │             │
│  └──────────────┘ └──────────────┘ └──────────────┘             │
│  ┌──────────────┐ ┌──────────────┐                             │
│  │quickSettings │ │  hooks/      │                             │
│  │(localStorage)│ │(useInventory,│                             │
│  │              │ │ useProfileLog│                             │
│  │              │ │ useSkins,    │                             │
│  │              │ │ useAnimated) │                             │
│  └──────────────┘ └──────────────┘                             │
└─────────────────────────────────────────────────────────────────┘
```

## Page Architecture

### 1. Upgrader Page (`/en`) — Core Gameplay

**State Ownership**: `UpgraderPage` component (inside `App.tsx`)

```
UpgraderPage
├── State
│   ├── selectedSkin: Skin | null           // Target (right panel)
│   ├── mineSelected: OwnedSkin[]           // Selected from inventory (left)
│   ├── bet: number                         // Coins from balance
│   ├── phase: 'idle' | 'spinning' | 'result' | 'case'
│   ├── spin: {id, angle, duration, delay, fast, win, chance} | null
│   ├── wonUid: string | null               // For "Add to upgrade"
│   ├── clearKey: number                    // Forces left panel reset
│   ├── selectRequest: {uid, nonce} | null  // From "Add to upgrade"
│   ├── dropRef: {spinId, skin} | null      // Pending compensation
│   ├── settledSpins: Set<number>           // Processed compensation IDs
│   ├── recentDrops: string[]               // Anti-repeat (last 12)
│   ├── caseDrop: {spinId, skin} | null     // Case opening drop
│   ├── caseInput: number                   // Input total for case
│   ├── compSkin: {skin, stage} | null      // Fast comp card animation
│   └── quickSettings: QuickSettings        // From localStorage
│
├── Callbacks (from App)
│   ├── onBuy(skins) → bool                 // Purchase from shop
│   ├── onSpend(uids, coins)                // Deduct skins + bet
│   ├── onWin(skin, source?) → uid          // Award win/compensation
│   ├── onSell(amount, skin?)               // Sell drop for balance
│   └── onGame(gameRecord)                  // Log to profile
│
├── Child Components
│   ├── UpgraderWheel          // Visual wheel + arrow animation
│   ├── WheelToolbar           // Sound, volume, fast, settings
│   ├── FastAmountBar          // x2/x4/x8, 25%/55%/75%, settings
│   ├── SelectedSkinPanel      // Target skin (right)
│   ├── SkinCatalog            // Catalog (right, 5×4 grid)
│   ├── SkinsPanel             // My Skins / Shop (left)
│   ├── CaseOpening            // Case animation (conditional)
│   └── SettingsModal          // Settings (conditional)
│
└── Key Flows
    ├── Improve Click
    │   ├── Validate: not busy, target selected, input > 0, chance ≤ MAX_CHANCE
    │   ├── rollSpinStop(chance) → {win, stopAngle}
    │   ├── pickCompensation() if loss & input > 100
    │   ├── onSpend() — immediate deduction
    │   ├── Set spin state → phase='spinning'
    │   ├── Schedule: result display, win sound, compensation/case
    │   └── Reset arrow after holdMs (unless case/fast comp)
    │
    ├── Win
    │   ├── playSound('win')
    │   ├── onWin(target) → adds to inventory, returns uid
    │   ├── WinEffect on SelectedSkinPanel (key=spinId)
    │   └── wonUid set → "Add to upgrade" button appears
    │
    ├── Loss with Compensation (fast spin)
    │   ├── settleCompensation() → onWin(skin, 'compensation')
    │   ├── Comp card slides in → shrinks → slides out (COMP_CARD_TIMING)
    │   └── Auto-returns to idle
    │
    ├── Loss with Case (normal spin, input > 100)
    │   ├── Delay 1.5s → phase='case', CaseOpening mounts
    │   ├── CaseOpening: blur → WebM → belt → flash → drop screen
    │   ├── Sell: onSell(price) → balance += price
    │   └── Keep: onWin(skin, 'compensation') → inventory
    │
    └── "Add to upgrade" (wonUid + no mineSelected)
        ├── setSelectRequest({uid, nonce})
        └── SkinsPanel picks up → adds to mineSelected
```

### 2. Weekly Drop Page (`/en/weekly-drop`)

**Components**: `RewardsOverlay` (timer), `WeeklyDepositProgress` (bar), `WeeklyWheel` (rotating wheel + labels), Top-up button

**State**: `weeklyDeposit` (localStorage), `weeklyEnd` (localStorage, 7-day cycle)

**Visual**: Large reference image (`rewards-reference.png`), absolute-positioned wheel at `left: 751px, top: 222px`, counter-rotating percentage labels

### 3. Battles Page (`/en/battles`)

**Status**: Stub — "Temporarily Unavailable" message over battle panel images

### 4. Profile Page (`/en/profile`)

**Props from App**: `balance`, `profileId`, `avatar`, `inventory`, `itemEvents`, `games`, `stats`, callbacks (`onSell`, `onWithdraw`, `onTopUp`), `settings`, `onSaveSettings`

**Layout** (`ProfileView.tsx`):
```
ProfileView
├── Top Section (pf-top, 3-column grid)
│   ├── UserInfo: avatar (file upload), nickname, editable 7-digit ID, settings/logout icons
│   ├── BalanceCard: animated balance, promo code input, Top up button
│   └── StatsBlock: BestDropCard (chevron train animation) + Withdrawn/Upgrades/Battles stats
│
├── Tabs (pf-tabs): Inventory | Items history | Games history | Battle history
│
└── Tab Content (pf-table__body)
    ├── InventoryTab: 8-col grid, Sell/Withdraw buttons per item, "Sell all" modal with confirmation
    ├── ItemsHistoryTab: Same grid, read-only, shows operation label (Bought/Won/Compensation/Upgraded/Sold/Withdrawn)
    ├── GamesHistoryTab: 3-col cards, each shows bet sector → chevrons → target sector with badge (Win/Lose/Compensation), roll ID, chance
    └── BattlesHistoryTab: Empty state
```

**Profile Components**:
- `ProfileItemCard.tsx`: Skin card with variant `full` (price, wear, weapon, name) or `plain` (image only), rarity glow via `--rarity` CSS variable, used in Inventory/Items history (full) and Games history (plain + showPrice)
- `ProfileSettingsModal.tsx`: Modal (portal) with nickname (max 24 chars), trade URL (link to Steam), birth date (DD.MM.YYYY, masked input, set once), currency (COINS/USCOINS/EUCOINS/BRCOINS with hex/icon), privacy (private/friends/public with descriptions), streamer mode (toggle switch)
- `icons.tsx`: SVG icons for tabs — InventoryIcon, HistoryIcon, GamesIcon, BattlesIcon

## Component Communication Patterns

### 1. Props Down, Callbacks Up (Primary)
```
App.tsx (state owner)
  └── UpgraderPage (receives callbacks)
        ├── SkinCatalog: onSelect(skin) → sets selectedSkin
        ├── SkinsPanel: onSelectionChange(skins, bet) → sets mineSelected, bet
        ├── FastAmountBar: onSelectTargetSkin(skin) → sets selectedSkin
        └── UpgraderWheel: receives chance, active, spin, result (read-only)
```

### 2. Shared Module State (Sound)
```typescript
// sound.ts — module-level singleton
let ctx: AudioContext | null = null
let master: GainNode | null = null
let settings = { enabled: true, volume: 0.74 }

// Called by App on quickSettings change
export function setSoundSettings(enabled, volume) { ... }

// Called by components
export function playSound(name, delayMs) { ... }
```

### 3. LocalStorage Persistence
| Key | Module | Data |
|-----|--------|------|
| `upgrader-quick-settings` | `quickSettings.ts` | multipliers, percents, sound, fastScroll, volume |
| `rewards-week-end` | `App.tsx` (RewardsOverlay) | Timestamp (7-day cycle) |
| `upgrader-online` | `App.tsx` (useSiteCounters) | Online counter |
| `upgrader-upgrades` | `App.tsx` (useSiteCounters) | Upgrades counter |
| `upgrader-battles` | `App.tsx` (useSiteCounters) | Battles counter |

### 4. React Portal (Modals/Tooltips)
- `SettingsModal` → `createPortal(..., document.body)`
- `Tooltip` → Fixed-position div at root level
- `CaseOpening` → Inline in upgrader-layout (z-index 40-42)
- `SupportChat` → Fixed bottom-right (z-index 9999)

## Data Models

### Skin (from `skins.json` & `SkinCatalog.tsx`)
```typescript
type Skin = {
  id: string              // e.g. "83"
  weapon: string          // "Dual Berettas"
  name: string            // "Polished Malachite"
  wear: string            // "FN" | "MW" | "FT" | "WW" | "BS"
  price: number           // Float (e.g. 3.22)
  image: string           // Steam CDN URL (360×360)
  rarityColor: string     // CSS rgb() string, e.g. "rgb(94, 152, 217)"
}
```

### OwnedSkin (extends Skin)
```typescript
type OwnedSkin = Skin & { uid: string }  // uid = `${Date.now()}-${index}-${random}`
```

### GameRecord (from `profileStore.ts`)
```typescript
type GameRecord = {
  id: string              // "600000000" + random
  time: number            // Date.now()
  betSkins: Skin[]        // Skins used (without uid)
  betCoins: number        // Coin bet
  betTotal: number        // Total input
  target: Skin            // Target skin
  chance: number          // Calculated chance %
  win: boolean            // Result
  compensation: Skin | null  // If loss & eligible
}
```

### ItemEvent
```typescript
type ItemEvent = {
  id: string              // `${Date.now()}-${counter}`
  kind: 'bought' | 'won' | 'compensation' | 'upgraded' | 'sold' | 'withdrawn'
  skin: Skin
  time: number
}
```

## Animation Architecture

### Wheel Spin (`UpgraderWheel.tsx` + `spinProfiles.ts`)
1. **Trigger**: `spin` prop changes (new `id`)
2. **Sound Scheduling**: `playSound(profile.startSound, -soundLeadMs)` — negative delay = start early, skip silent prefix
3. **Tick Scheduling**: `profile.tickTimesMs.forEach(t => playSound('tick', startIn + t))`
4. **Visual Animation**: `requestAnimationFrame` loop, progress from `makeProgress(profile.points)` (monotonic cubic spline)
5. **Result Display**: After `delay + resultMs` → `phase='result'`, show "NO PROBLEM" or "Upgrade successful!"

### Case Opening (`CaseOpening.tsx` + `rouletteProfile.ts`)
1. **Blur**: Immediate (400ms)
2. **WebM Clip**: Plays at `beltStartMs` (3165ms)
3. **Belt Animation**: `requestAnimationFrame` with `makeProgress(BELT_PROFILE)`, travels `BELT.travel` px
4. **Flash**: At `stopHoldMs` (650ms) after belt stop
5. **Drop Screen**: At `popMs` (1100ms) after flash → "Here's your drop!"

### Win Effect (`WinEffect.tsx` + `winEffect.css`)
- Canvas particle system: 4 bursts (130+95+60+70 particles), 4 smoke puffs, 16 sparks
- CSS animations: red tint (3.3s), border (3.3s), chevron grow+fade (1.7s)
- Image hue-rotate (50deg) + coin hue-rotate (70deg)

### Compensation Case (`_unused/CompensationCase.tsx` + `_unused/compensation.css`)
**Moved to `_unused/` — not connected to site** (not in `tsconfig.app.json` include). Kept for future use.

**Fast spin** (`CompensationPanel`):
- Renders as `SelectedSkinPanel` with "Компенсация" label, slides in (180ms, cubic-bezier(0.16,1,0.3,1))
- No close button, image positioned higher (top: 48%, height: 62%)

**Normal spin** (full `CompensationCase`):
1. **Case drop**: SVG case falls from top (620ms, cubic-bezier(0.34,1.35,0.64,1)), lid opens (520ms delay), smoke particles (6 puffs, radial gradient, 1.7s)
2. **Reel animation**: 5 cards wide (232.2px each), track translates with easeOutQuart (3.2s), tick sound per card change
3. **Winner highlight**: Center marker (yellow line + triangle), non-winner cards fade to 35% opacity + desaturate, winner card full opacity + white border
4. **Cleanup**: Hold 1s, fade out 260ms, callback `onReveal()` at stop, `onDone()` after fade

**To activate**: Need to export `COMPENSATION_WINNER_INDEX` and `Compensation` type (with `reel: Skin[]`) from `compensation.ts`, then import and use in `UpgraderPage`.

### Balance Animation (`AnimatedBalance.tsx`)
- Per-digit slot machine roll (900ms, cubic ease-out)
- Staggered by position (12ms per digit from right)

## Routing & Navigation

```typescript
// App.tsx — Site component
const buttons = [
  { name: 'battle', path: '/en/battles' },
  { name: 'upgrader', path: '/en' },
  { name: 'vip', path: '/en/weekly-drop' },
]

<Routes>
  <Route path="/en" element={<UpgraderPage />} />
  <Route path="/en/weekly-drop" element={<WeeklyDropPage />} />
  <Route path="/en/battles" element={<BattlesPage />} />
  <Route path="/en/profile" element={<ProfilePage />} />
</Routes>
```

- Navigation via `useNavigate()` + `useLocation()`
- Active button tracked by `location.pathname`
- Yellow underline (`.nav-underline`) animates `left`/`width` on change
- Page class on `.site-background` (`.page-upgrader`, `.page-rewards`, etc.) controls bottom-section position

## Performance Considerations

1. **Skin Catalog**: 2000+ skins loaded once via `useSkins` (cached in module variable), filtered/sorted via `useMemo`
2. **Images**: Steam CDN URLs, `loading="lazy"`, `decoding="async"` on catalog cards
3. **Sounds**: Preloaded via `preloadSounds()` on mount, decoded once, played via scheduled `AudioBufferSourceNode`
4. **Animations**: `requestAnimationFrame` loops cleaned up in `useEffect` returns; `will-change: transform` on animated elements
5. **Inventory/Profile**: In-memory only (reset on refresh), no server sync

## Error Handling & Edge Cases

- `skins.json` fetch failure → `SkinCatalog` shows error message
- AudioContext unavailable → sounds silently disabled
- localStorage unavailable → settings fall back to defaults
- Compensation pick fails (catalog empty) → no compensation awarded
- Spin during page unload → `useEffect` cleanup commits game, awards pending win/compensation
- Duplicate compensation prevention → `settledSpins` Set by `spinId`
- Recent drops anti-repeat → `recentDrops` array (max 12)

## Build & Deployment

```json
// package.json scripts
"dev": "vite",
"build": "tsc -b && vite build",
"lint": "oxlint",
"preview": "vite preview"
```

- TypeScript: Project references (`tsconfig.app.json`, `tsconfig.node.json`)
- Linting: Oxlint (fast, Rust-based)
- Output: `dist/` (static files, ready for any static host)