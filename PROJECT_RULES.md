# PROJECT_RULES.md — UPGRADER Development Rules

## Core Principles

1. **Preserve Existing Design** — Never change visual design without explicit request. All positions, colors, sizes, animations are calibrated to match the original site (video references).
2. **No Duplicate Components** — Reuse existing components and CSS classes. Check `App.css` and component files before creating new ones.
3. **In-Memory State Only** — Balance, inventory, profile log, games history are session-only (reset on refresh). localStorage used only for settings and counters.
4. **Frame-Perfect Animations** — Wheel spin, case belt, win effects use cubic splines extracted from 60fps video. Do not simplify timing curves.
5. **Sound via Web Audio** — All sounds scheduled on AudioContext clock (`playSound(name, delayMs)`). Negative delay = start early, skip silent prefix.

## Architecture Rules

### State Management
- **Global state lives in `App.tsx`** (Site component): balance, inventory, profileLog, profileSettings, avatar, quickSettings
- **Page components receive callbacks** (`onBuy`, `onSpend`, `onWin`, `onSell`, `onGame`) — never mutate parent state directly
- **Hooks for reusable logic**: `useInventory`, `useProfileLog`, `useSkins`, `useAnimatedNumber`
- **Module singletons for sound**: `sound.ts` exports functions, not React context

### Component Structure
```
App.tsx (routes, global state, page components)
├── UpgraderPage (core gameplay logic)
│   ├── UpgraderWheel (visual only, receives spin prop)
│   ├── SkinCatalog (read-only catalog, onSelect callback)
│   ├── SelectedSkinPanel (target display, win animation)
│   ├── SkinsPanel (my skins/shop, selection + cart)
│   ├── FastAmountBar (quick bet buttons)
│   ├── ImproveButton (main action)
│   ├── WheelToolbar (sound, fast, settings)
│   ├── CaseOpening (conditional, full-screen flow)
│   └── SettingsModal (portal)
├── WeeklyDropPage (timer, wheel, deposit progress)
├── BattlesPage (stub)
└── ProfilePage (ProfileView with tabs)
```

### Data Flow (UpgraderPage)
```
User Action → Handler → Immediate State Update → Async Resolution
                          ↓
                    onSpend/onWin/onSell callbacks
                          ↓
                    App.tsx updates global state
                          ↓
                    ProfileLog updated via callbacks
```

## Coding Standards

### TypeScript
- Strict mode enabled (`tsconfig.json`)
- Explicit return types for exported functions
- Discriminated unions for phase states (`'idle' | 'spinning' | 'result' | 'case'`)
- CSS-in-JS via `style={{ '--var': value } as CSSProperties}` for CSS variables

### React Patterns
- **Functional components only** (hooks)
- **`useCallback` for stable callbacks** passed to children (`useInventory`, `useProfileLog`)
- **`useMemo` for derived data** (filtered/sorted skins, visible pages)
- **`useRef` for mutable values without re-render** (timers, animation frames, previous values)
- **`useLayoutEffect` for DOM measurements** (AnimatedBalance, Tooltip)
- **Cleanup in `useEffect` return** — always clear timers, cancel animation frames, disconnect observers

### CSS Organization
- **`App.css` is the main stylesheet** (4798 lines) — contains all page layouts, component positions, skin catalog, skins panel, selected skin panel, multi-panel, balance block, wheel, rewards, battles, profile, notifications, payments
- **Component-scoped CSS files** for self-contained animations: `caseOpening.css`, `winEffect.css`, `settingsModal.css`, `upgradeSpin.css`, `wheelLabels.css`, `tooltip.css`, `catalogLocks.css`, `improveButton.css`, `wheelToolbar.css`, `SupportChat.css`, `profile.css`
- **CSS Variables for theming** — `--rarity` on skin cards, `--progress` on range slider, `--pf-chevron-*` on Best Drop
- **No CSS Modules / Styled Components** — plain `.css` files imported in components

### Naming Conventions
| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `UpgraderWheel.tsx`, `SkinCatalog.tsx` |
| Hooks | camelCase `use` prefix | `useInventory.ts`, `useAnimatedNumber.ts` |
| Core modules | camelCase | `upgraderMath.ts`, `spinProfiles.ts` |
| CSS classes | kebab-case | `.skin-card`, `.upgrader-wheel`, `.pf-item` |
| CSS variables | kebab-case `--prefix` | `--rarity`, `--pf-chevron-pitch` |
| Props interfaces | `Props` suffix | `UpgraderWheelProps` (implicit) |
| Types | PascalCase | `Skin`, `OwnedSkin`, `GameRecord` |

## Animation Rules

### Wheel Spin (`UpgraderWheel.tsx` + `spinProfiles.ts`)
- **Never change `SPIN_PROFILES` points** without video reference
- `soundLeadMs` calibrates audio start vs visual start (235ms normal, 234ms fast)
- `tickTimesMs` are absolute ms from sound start — do not convert to angles
- Arrow rotation origin: `PIVOT_X = C + OFFSET_X + 0.5`, `PIVOT_Y = C + OFFSET_Y`
- Result display delayed by `delay + resultMs` (7640ms normal, 1540ms fast)

### Case Opening (`CaseOpening.tsx` + `rouletteProfile.ts`)
- `CASE_TIMING` phases: blurIn → clip → beltStart → belt → panelFade → stopHold → pop
- Belt animation uses `makeProgress(BELT_PROFILE)` (36-point cubic spline)
- Winner index fixed at `BELT.winnerIndex = 66` (0-based)
- Travel distance `BELT.travel = 14190px` — do not change without video reference

### Win Effect (`WinEffect.tsx` + `winEffect.css`)
- Canvas particle system: 4 bursts (130+95+60+70), 4 smoke, 16 sparks
- Duration: 3300ms total
- CSS animations for tint, border, chevron — synchronized with canvas via keyframe timings
- Image hue-rotate (50deg) + coin hue-rotate (70deg) on win

### Balance Animation (`AnimatedBalance.tsx`)
- Per-digit slot roll: 900ms, cubic ease-out (1 - (1-t)³)
- Stagger: 12ms per digit from right
- Sequence calculates shortest path (forward/backward through 0-9)

## Sound Rules

### Sound Files (`public/sounds/`)
| File | Purpose | Base Gain |
|------|---------|-----------|
| `click.wav` | Skin clicks, Improve button | 0.45 |
| `spin-start.wav` | Normal spin start (0.7s) | 1.0 |
| `spin-start-fast.wav` | Fast spin start | 1.0 |
| `tick.wav` | Arrow tick (35 per normal spin) | 0.14 |
| `win.wav` | Win firework (~3s) | 0.9 |
| `case-open.wav` | Case opening (~2.65s) | 0.9 |

### Playback Rules
- **`unlockAudio()` must be called from user gesture** (pointerdown/keydown) before any sound
- **`preloadSounds()` called on mount** — fetches ArrayBuffers, decodes on first unlock
- **`playSound(name, delayMs)` schedules on AudioContext clock** — `delayMs < 0` skips prefix
- **Master gain (`master.gain`)** controls volume for all sounds in real-time
- **`setSoundSettings(enabled, volume)` called from `App.tsx`** when quickSettings change

## Math & Game Logic Rules

### Chance Calculation (`upgraderMath.ts`)
```typescript
CHANCE_MULTIPLIER = 1.03
MAX_CHANCE = 79.99
MIN_CHANCE = 0.01

calcChance(input, target) = min(100, (input / target) * 100 * 1.03)
getMaxBet(balance, skinsTotal, targetPrice) = max input for MAX_CHANCE
isTargetAllowed(input, target, slack=0) → MIN_CHANCE ≤ raw ≤ MAX_CHANCE + slack
```

### Spin Stop (`rollSpinStop`)
- Win probability = exact `chance%` (Math.random() < chance/100)
- Stop angle: win → inside colored arc (with margin), lose → outside arc (with margin)
- Arc: `half = chance * ARC_DEG_PER_PERCENT` (1.72° per %)
- Margin: `min(0.4, half * 0.25)` — prevents "edge cases"
- Random side (left/right) for visual variety

### Compensation (`compensation.ts`)
- Eligible only if `input > COMPENSATION_MIN_INPUT (100)`
- Mean ratio: log-linear interpolation between anchors [100→25%, 10000→4.49%]
- Spread: uniform 0.35× to 1.65× of mean (average 1.0×)
- Cap: 95% of target price
- Anti-repeat: excludes last 12 dropped skin IDs
- Kind: common (0-74%), good (74-94%), rare (94-100%) by spread position

### Case Threshold
- Case appears only on **normal spin** (not fast) with `input > CASE_THRESHOLD (100)`
- Fast spin compensation shows as sliding card (no case)

## File Modification Guidelines

### When Editing `App.tsx`
- **Do not reorder imports** — grouped: React, Router, CSS, Components, Hooks, Types, Utils
- **Global constants at top** (COUNTER_SETTINGS, WHEEL_CONFIG, CASE_RESULT_DELAY_MS, WEEK_DURATION)
- **Page components defined before `Site`** (RewardsOverlay, WeeklyWheel, BattlesPage, UpgraderPage, ProfilePage)
- **`Site` component** contains all global UI: header, counters, modals, routing, bottom section

### When Editing `App.css`
- **Positions are absolute** — changing one element may require adjusting others
- **Page-specific overrides at bottom** (`.page-upgrader`, `.page-rewards`, etc.)
- **Skin catalog/styles near line 2366** — grid, cards, pagination, filters, selected states
- **Skins panel/styles near line 2993** — tabs, grid, cart, buy flow
- **Selected skin panel/styles near line 2786** — smooth selection animation
- **Multi-panel/styles near line 3958** — 2-6 skins + bet cell
- **Balance block/styles near line 4175** — slider, disabled state
- **Wheel positions near line 4509** — wheel, labels, arrow

### When Adding New Components
1. Create in `src/components/` (or `src/components/profile/`)
2. Add corresponding `.css` if needed (import in component)
3. Export from component file (default export)
4. Import in `App.tsx` where used
5. Follow existing patterns: `useState`/`useRef`/`useEffect` for animation, `CSSProperties` for CSS vars

### When Modifying Core Logic
- **`upgraderMath.ts`** — pure functions, no side effects, fully testable
- **`spinProfiles.ts`** — data + `makeProgress` spline generator (do not modify points)
- **`rouletteProfile.ts`** — data + timing constants (do not modify without video)
- **`compensation.ts`** — pure functions, uses `pickSkinNear` with binary search
- **`sound.ts`** — module singleton, Web Audio API, no React dependencies

## Testing & Verification

### Manual Checks After Changes
1. **Run dev server**: `npm run dev`
2. **Upgrader page**: 
   - Select skin from catalog → appears in right panel
   - Select skins from left → appear in multi-panel / single panel
   - Adjust bet slider → chance updates, max bet respected
   - Click Improve → spin animation, sound, result (win/lose)
   - Win → WinEffect plays, "Add to upgrade" appears
   - Lose (input>100) → Case opens → Sell/Keep works
   - Fast spin toggle → faster animation, different sound
3. **Weekly Drop**: Timer counts down, wheel rotates, deposit progress updates
4. **Profile**: Inventory grid, sell/withdraw, tabs switch, history loads
5. **Settings modal**: Multipliers/percents save, sound/fast toggles work
6. **Build**: `npm run build` — no TypeScript errors, no Oxlint warnings

### Common Issues
- **Arrow not rotating**: Check `spin` prop passed to `UpgraderWheel`, `arrowRef` animation cleanup
- **Sound not playing**: `unlockAudio()` not called, AudioContext suspended, file not loaded
- **Chance wrong**: `calcChance` uses `CHANCE_MULTIPLIER=1.03`, verify input/target
- **Compensation not appearing**: `input > 100`, normal spin, `pickCompensation` returns non-null
- **Case not opening**: `CASE_RESULT_DELAY_MS=1500`, check `phase='case'` set
- **Balance not animating**: `AnimatedBalance` needs `value` prop change, `useLayoutEffect` triggers

## Performance Budget
- **Initial JS**: < 200KB gzipped (React 19 + Router 7 + app code)
- **Skin catalog**: 8MB JSON loaded once, cached in memory
- **Images**: Steam CDN, lazy loaded, 360×360 max
- **Fonts**: 4 WOFF2 files ~80KB total, variable weight
- **Animations**: 60fps via `requestAnimationFrame`, `will-change: transform`

## Accessibility Checklist
- [ ] All buttons have `aria-label` or visible text
- [ ] Inputs have associated `<label>` or `aria-label`
- [ ] Modals use `role="dialog" aria-modal="true"`
- [ ] Tooltips use `role="tooltip"`
- [ ] Focus visible on all interactive elements
- [ ] Color contrast meets WCAG AA (gold on dark, red/green badges)
- [ ] Reduced motion respected (`@media (prefers-reduced-motion: reduce)`)
- [ ] Keyboard navigation works (Tab, Enter, Space, Escape)

## Do Not Touch Without Discussion
- `spinProfiles.ts` points arrays (frame-perfect from video)
- `rouletteProfile.ts` BELT_PROFILE, CASE_TIMING, COMP_CARD_TIMING
- `compensation.ts` ANCHORS, SPREAD_MIN/MAX (calibrated to original site)
- `upgraderMath.ts` CHANCE_MULTIPLIER, MAX_CHANCE, ARC_DEG_PER_PERCENT
- Absolute positions in `App.css` (calibrated to 1920px design)
- `skins.json` — sourced from Steam, do not edit manually