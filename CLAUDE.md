# CLAUDE.md — UPGRADER Project Instructions

## Project Overview
**UPGRADER** — CS2 Skin Upgrade Simulator (React 19 + TypeScript 6 + Vite 8)
- Single-page simulator replicating the original UPGRADER site
- Pages: Upgrader (`/en`), Weekly Drop (`/en/weekly-drop`), Battles (`/en/battles` — stub), Profile (`/en/profile`)
- All state in-memory (reset on refresh), localStorage only for settings/counters
- No backend — pure client-side simulation

## Quick Start
```bash
npm run dev      # Development server (Vite HMR)
npm run build    # Production build (currently fails: TS errors in CompensationCase.tsx)
npm run lint     # Oxlint (28 warnings, no errors)
```

## Required Reading Before Work
Read these documentation files in order:
1. **PROJECT_MAP.md** — File structure, component inventory, data flow
2. **PROJECT_ARCHITECTURE.md** — Component relationships, page architecture, animation systems
3. **DESIGN_SYSTEM.md** — Colors, typography, spacing, component specs, animations
4. **PROJECT_RULES.md** — Coding standards, animation/sound/math rules, modification guidelines
5. **PROJECT_STATUS.md** — Current status, known issues, build/lint results, roadmap

## Key Rules (Non-Negotiable)

### 1. Never Change Design Without Explicit Request
- All positions, colors, sizes, animations are calibrated to match the original site (from video references)
- Absolute positions in `App.css` are tied to 1920px design width
- Gold gradient (#FCD711 family) is the brand identity — used consistently

### 2. Never Touch Calibrated Timings & Positions
- **Wheel spin**: `spinProfiles.ts` cubic spline points (63 pts normal, 26 pts fast) — frame-perfect from 60fps video
- **Case opening**: `rouletteProfile.ts` BELT_PROFILE (36 pts), CASE_TIMING, COMP_CARD_TIMING
- **Compensation**: `compensation.ts` ANCHORS [100→25%, 10000→4.49%], SPREAD 0.35–1.65×
- **Math**: `upgraderMath.ts` CHANCE_MULTIPLIER=1.03, MAX_CHANCE=79.99, ARC_DEG_PER_PERCENT=1.72
- **Sound**: `sound.ts` scheduling with negative delays for frame-perfect sync

### 3. No Duplicate Components or CSS
- Reuse existing components in `src/components/` and `src/components/profile/`
- Check `App.css` and component files before creating new ones
- Component-scoped CSS files for self-contained animations only

### 4. In-Memory State Only
- Balance, inventory, profile log, games history reset on refresh
- localStorage used only for: quickSettings, weeklyEnd, counters
- No server calls — Steam CDN only for skin images

### 5. Sound via Web Audio (Module Singleton)
- `sound.ts` exports functions, not React context
- `playSound(name, delayMs)` schedules on AudioContext clock
- `delayMs < 0` = start early, skip silent prefix
- `unlockAudio()` must be called from user gesture first

## Current Build Status
```bash
npm run build  # ❌ FAILS — 3 TS errors in CompensationCase.tsx
```
Errors: Missing exports in `compensation.ts` (`COMPENSATION_WINNER_INDEX`, `Compensation` type), implicit `any` in callback.

## Files to Watch
- `src/App.tsx` — Global state, routing, all page components (1260 lines)
- `src/App.css` — All layouts, positions, overrides (4798 lines)
- `src/components/CompensationCase.tsx` — Has TS errors, needs fixing
- `src/compensation.ts` — Missing exports needed by CompensationCase