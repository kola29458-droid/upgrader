import { useEffect, useRef, useState } from 'react'
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import './App.css'
import './caseOpening.css'
import './liveDrops.css'
import './adminPanel.css'
import SupportChat from './SupportChat'
import { Link } from "react-router-dom";
import SkinCatalog from './components/SkinCatalog'
import type { Skin } from './components/SkinCatalog'
import SelectedSkinPanel from './components/SelectedSkinPanel'
import SkinsPanel from './components/SkinsPanel'
import { useInventory } from './hooks/useInventory'
import type { OwnedSkin } from './hooks/useInventory'
import { useAdminPanel } from './hooks/useAdminPanel'
import AnimatedBalance from './components/AnimatedBalance'
import UpgraderWheel from './components/UpgraderWheel'
import FastAmountBar from './components/FastAmountBar'
import ImproveButton from './components/ImproveButton'
import WheelToolbar from './components/WheelToolbar'
import SettingsModal from './components/SettingsModal'
import LiveDrops from './components/LiveDrops'
import AdminPanel from './components/AdminPanel'
import { loadQuickSettings, saveQuickSettings } from './quickSettings'
import type { QuickSettings } from './quickSettings'
import { useSkins } from './hooks/useSkins'
import { calcChance, isChanceTooLow, MAX_CHANCE, rollSpinStop, ARC_DEG_PER_PERCENT } from './upgraderMath'
import { SPIN_PROFILES } from './spinProfiles'
import { playSound, preloadSounds, setSoundSettings, unlockAudio } from './sound'
import CaseOpening from './components/CaseOpening'
import ProfileView from './components/profile/ProfileView'
import type { ProfileViewProps } from './components/profile/ProfileView'
import { useProfileLog } from './hooks/useProfileLog'
import { AVATAR_PLACEHOLDER, DEFAULT_PROFILE_SETTINGS } from './profileStore'
import type { GameRecord, ItemEventKind, ProfileSettings } from './profileStore'
import { CASE_THRESHOLD, pickCompensation } from './compensation'
import { COMP_CARD_TIMING } from './rouletteProfile'

// Статистика в шапке — стартовые значения (менять только здесь)
const STATS_UPGRADES = 639723928
const STATS_BATTLES = 872121

const COUNTER_SETTINGS = {
  onlineMin: 1500,
  onlineMax: 4000,
  onlineSpeed: 2500,
  upgradesStart: STATS_UPGRADES,
  upgradesSpeed: 40,
  upgradesChance: 0.65,
  upgradesMinAdd: 1,
  upgradesMaxAdd: 3,
  battlesStart: STATS_BATTLES,
  battlesSpeed: 8000,
  battlesChance: 0.2,
}

const WHEEL_CONFIG = {
  image: '/weekly-wheel.png',
  size: 360,
  duration: 15,
  fullTurns: 7,
  easing: 'cubic-bezier(0.12, 0.65, 0.08, 1)',
}

const CASE_RESULT_DELAY_MS = 1500 // сколько «NO PROBLEM» висит до появления кейса (по видео-образцу)

// Returns the timestamp of the next Monday 00:00:00 local time
function getNextMondayMidnight(): number {
  const now = new Date()
  const day = now.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  // Days until next Monday: if today is Monday (1), we want 7 days (next Monday), not 0
  const daysUntilMonday = (8 - day) % 7 || 7
  const nextMonday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilMonday, 0, 0, 0)
  return nextMonday.getTime()
}

// Formats seconds as "1d 02:38:04" or "02:38:04" (if days === 0)
function formatTimeLeft(totalSeconds: number): string {
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (days > 0) {
    return `${days}d ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function RewardsOverlay({ isUnlocked = false, timeLeft }: { isUnlocked: boolean; timeLeft: string }) {
  return (
    <div className="rewards-top-left">
      <div className="rewards-timer">
        <svg viewBox="0 0 24 24" fill="none" className="rewards-clock">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
          <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        <span className="rewards-timer-label">{isUnlocked ? 'Draw in' : 'Week ends in'}</span>
        <strong className="rewards-timer-value">{timeLeft}</strong>
      </div>
    </div>
  )
}

// Unlocked state overlay — covers static "Weekly Drop" title and description in PNG
function UnlockedOverlay() {
  return (
    <div className="rewards-unlocked-overlay">
      <div className="rewards-unlocked-content">
        <h1 className="rewards-unlocked-title">Unlocked!</h1>
        <p className="rewards-unlocked-desc">Weekly goal reached. Open Weekly Drop on Monday and claim your skin.</p>
      </div>
    </div>
  )
}

// Top up / Claim button — switches based on isUnlocked
function WeeklyDropTopUpButton({ isUnlocked, time, onClick }: { isUnlocked: boolean; time: string; onClick: () => void }) {
  if (isUnlocked) {
    return (
      <button
        type="button"
        className="weekly-drop-topup-button weekly-drop-topup-button--disabled"
        aria-disabled="true"
        disabled
      >
        <svg viewBox="0 0 24 24" fill="none" className="rewards-claim-clock" aria-hidden="true" width="20" height="20">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
          <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>Claim in {time}</span>
      </button>
    )
  }
  return (
    <button
      type="button"
      className="weekly-drop-topup-button"
      onClick={onClick}
    >
      Top up
    </button>
  )
}

function WeeklyWheel() {
  return (
    <div className="weekly-wheel-container">
      <img
        src="/wheel-arrow.png"
        alt="Wheel Arrow"
        className="weekly-wheel-arrow"
        draggable={false}
      />

      <img
        src={WHEEL_CONFIG.image}
        alt="Weekly Wheel"
        className="weekly-wheel"
        draggable={false}
        style={{
          width: `${WHEEL_CONFIG.size}px`,
          height: `${WHEEL_CONFIG.size}px`,
          animation: 'wheelRotate 30s linear infinite',
        }}
      />

      <div
        className="weekly-wheel-labels"
        style={{
          width: `${WHEEL_CONFIG.size}px`,
          height: `${WHEEL_CONFIG.size}px`,
        }}
      >
        <span className="wheel-percent wheel-percent-5">5%</span>
        <span className="wheel-percent wheel-percent-15">15%</span>
        <span className="wheel-percent wheel-percent-30">30%</span>
        <span className="wheel-percent wheel-percent-50">50%</span>
      </div>
    </div>
  )
}

function formatCounter(value: number) {
  return Math.floor(value).toLocaleString('en-US').replace(/,/g, ' ')
}

function useSiteCounters() {
  const [online, setOnline] = useState(() => {
    const saved = localStorage.getItem('upgrader-online')
    return saved ? Number(saved) : 1645
  })

  const [upgrades, setUpgrades] = useState(() => {
    const saved = localStorage.getItem('upgrader-upgrades')
    return saved ? Number(saved) : COUNTER_SETTINGS.upgradesStart
  })

  const [battles, setBattles] = useState(() => {
    const saved = localStorage.getItem('upgrader-battles')
    return saved ? Number(saved) : COUNTER_SETTINGS.battlesStart
  })

  useEffect(() => {
    localStorage.setItem('upgrader-online', String(online))
  }, [online])

  useEffect(() => {
    localStorage.setItem('upgrader-upgrades', String(upgrades))
  }, [upgrades])

  useEffect(() => {
    localStorage.setItem('upgrader-battles', String(battles))
  }, [battles])

  useEffect(() => {
    const onlineTimer = window.setInterval(() => {
      setOnline((current) => {
        const direction = Math.random() < 0.5 ? -1 : 1
        const change = Math.floor(Math.random() * 25) + 1
        const next = current + direction * change

        if (next < COUNTER_SETTINGS.onlineMin) {
          return COUNTER_SETTINGS.onlineMin + change
        }

        if (next > COUNTER_SETTINGS.onlineMax) {
          return COUNTER_SETTINGS.onlineMax - change
        }

        return next
      })
    }, COUNTER_SETTINGS.onlineSpeed)

    const upgradesTimer = window.setInterval(() => {
      if (Math.random() < COUNTER_SETTINGS.upgradesChance) {
        const amount =
          Math.floor(
            Math.random() *
              (COUNTER_SETTINGS.upgradesMaxAdd -
                COUNTER_SETTINGS.upgradesMinAdd +
                1),
          ) + COUNTER_SETTINGS.upgradesMinAdd

        setUpgrades((current) => current + amount)
      }
    }, COUNTER_SETTINGS.upgradesSpeed)

    const battlesTimer = window.setInterval(() => {
      if (Math.random() < COUNTER_SETTINGS.battlesChance) {
        setBattles((current) => current + 1)
      }
    }, COUNTER_SETTINGS.battlesSpeed)

    return () => {
      window.clearInterval(onlineTimer)
      window.clearInterval(upgradesTimer)
      window.clearInterval(battlesTimer)
    }
  }, [])

  return {
    online: formatCounter(online),
    upgrades: formatCounter(upgrades),
    battles: formatCounter(battles),
  }
}

type ButtonName = 'battle' | 'upgrader' | 'vip'

type DepositNotification = {
  id: number
  date: string
  coins: string
}

function WeeklyDepositProgress({ value }: { value: number }) {
  const displayedProgress = Math.max(0, value)
  const barProgress = Math.min(100, displayedProgress)

  return (
    <div className="weekly-deposit-progress">
      <div
        className="weekly-deposit-values"
        data-testid="weekly-drop-progress-value"
      >
        <span className="weekly-deposit-current">
          {displayedProgress.toLocaleString('en-US', {
            maximumFractionDigits: 2,
          })}
        </span>

        <span className="weekly-deposit-divider">/</span>

        <span className="weekly-deposit-target">100</span>

        <img src="/coins.png" alt="" className="weekly-deposit-coin" />
      </div>

      <div
        className="weekly-deposit-bar"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={barProgress}
        aria-label="Weekly deposit progress"
      >
        {Array.from({ length: 20 }, (_, index) => {
          const segmentProgress = Math.max(
            0,
            Math.min(1, (barProgress - index * 5) / 5)
          )

          return (
            <div className="weekly-deposit-segment" key={index}>
              <div
                className="weekly-deposit-segment-fill"
                style={{ opacity: segmentProgress }}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function RewardsPage({ weeklyDeposit, onTopUp, onWeekReset }: { weeklyDeposit: number; onTopUp: () => void; onWeekReset: () => void }) {
  const isUnlocked = weeklyDeposit >= 100

  // Single source of time: updates every second + on visibility change
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000)

    const onVisibilityChange = () => {
      if (!document.hidden) setNow(Date.now())
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])

  // Derive timeLeft from now
  const end = getNextMondayMidnight()
  const total = Math.max(0, Math.floor((end - now) / 1000))
  const timeLeft = formatTimeLeft(total)

  // Trigger week reset when timer hits zero
  useEffect(() => {
    if (total === 0) onWeekReset()
  }, [total, onWeekReset])

  // Preload unlocked background image
  useEffect(() => {
    const img = new Image()
    img.src = '/rewards-reference-unlocked.png'
  }, [])

  return (
    <div className="rewards-page-wrapper">
      <img
        className="rewards-reference"
        src={isUnlocked ? '/rewards-reference-unlocked.png' : '/rewards-reference.png'}
        alt="Weekly Drop"
      />

      <RewardsOverlay isUnlocked={isUnlocked} timeLeft={timeLeft} />

      <WeeklyDepositProgress value={weeklyDeposit} />

      {isUnlocked && <UnlockedOverlay />}

      <WeeklyDropTopUpButton
        isUnlocked={isUnlocked}
        time={timeLeft}
        onClick={onTopUp}
      />

      <WeeklyWheel />
    </div>
  )
}

function BattlesPage() {
  return (
    <div className="battles-page">
      <img
        src="/upgrade-battle-title.png"
        alt="Upgrade Battle"
        className="battles-title-image"
        draggable={false}
      />

      <img
        src="/upgrade-battle-panel.png"
        alt="Battle panel"
        className="battles-panel-image"
        draggable={false}
      />

      <div className="battles-unavailable">
        <h2>Temporarily Unavailable</h2>
        <p>
          This section is temporarily unavailable due to technical issues.
          We're working on it and it will be back soon!
        </p>
      </div>
    </div>
  )
}

function UpgraderPage({
  inventory,
  onBuy,
  balance,
  onSpend,
  onWin,
  onSell,
  onGame,
}: {
  inventory: OwnedSkin[]
  onBuy: (skins: Skin[]) => boolean
  balance: number
  onSpend: (uids: string[], coins: number) => void // списать скины и ставку после нажатия Improve
  onWin: (skin: Skin, source?: 'won' | 'compensation') => string // выдать выигранный скин (или компенсацию), возвращает его uid
  onSell: (amount: number, skin?: Skin) => void    // продать выпавший скин: вернуть его стоимость на виртуальный баланс
  onGame: (game: Omit<GameRecord, 'id' | 'time'>) => void // записать игру в историю профиля
}) {
  const [selectedSkin, setSelectedSkin] = useState<Skin | null>(null)
  const [mineSelected, setMineSelected] = useState<OwnedSkin[]>([])
  const [bet, setBet] = useState(0)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [quickSettings, setQuickSettings] = useState<QuickSettings>(loadQuickSettings)

  // Крутка: idle (ждём) -> spinning (стрелка крутится) -> result (показываем итог 3 секунды) -> idle
  const [phase, setPhase] = useState<'idle' | 'spinning' | 'result' | 'case'>('idle')
  const [spin, setSpin] = useState<{
    id: number
    angle: number
    duration: number
    delay: number
    fast: boolean
    win: boolean
    chance: number
  } | null>(null)
  const [wonUid, setWonUid] = useState<string | null>(null) // uid выигранного скина (для кнопки Add to upgrade)
  const [clearKey, setClearKey] = useState(0)
  const [selectRequest, setSelectRequest] = useState<{ uid: string; nonce: number } | null>(null)
  const timers = useRef<number[]>([])
  const pending = useRef<{ win: boolean; target: Skin } | null>(null)
  const gameRef = useRef<Omit<GameRecord, 'id' | 'time'> | null>(null) // игра ждёт записи в историю до конца крутки

  // Компенсация за проигрыш (виртуальная): выпавший скин ещё не выдан, пока он лежит в dropRef
  const dropRef = useRef<{ spinId: number; skin: Skin } | null>(null)
  const settledSpins = useRef<Set<number>>(new Set()) // за какие крутки компенсация уже выдана/продана: повторно за одну и ту же не начисляется
  const recentDrops = useRef<string[]>([]) // последние выпавшие скины: чтобы не повторялись подряд
  const [caseDrop, setCaseDrop] = useState<{ spinId: number; skin: Skin } | null>(null) // открыт кейс (обычная прокрутка, вход больше порога)
  const [caseInput, setCaseInput] = useState(0) // сумма входа той крутки, после которой открылся кейс
  const [compSkin, setCompSkin] = useState<{ skin: Skin; stage: 'in' | 'shrunk' | 'out' } | null>(null) // компенсация в левой карточке (быстрая прокрутка): выезжает справа, уменьшается, уезжает вниз

  const busy = phase !== 'idle'

  // Admin panel: force win/lose once
  const { consumeForceWin, consumeForceLose } = useAdminPanel()

  // Настройки звука (динамик и громкость над колесом) и разблокировка звука первым действием пользователя
  useEffect(() => {
    setSoundSettings(quickSettings.sound, quickSettings.volume)
  }, [quickSettings.sound, quickSettings.volume])

  useEffect(() => {
    preloadSounds()
    fetch('/case/case-open.webm').catch(() => {}) // клип кейса заранее в кэш браузера
    const unlock = () => unlockAudio()
    window.addEventListener('pointerdown', unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  const { skins: allCatalogSkins } = useSkins()

  const inputTotal = mineSelected.reduce((sum, s) => sum + s.price, 0) + bet
  const chance = selectedSkin ? calcChance(inputTotal, selectedSkin.price) : 0
  const wheelActive = Boolean(selectedSkin) && inputTotal > 0

  // Если ушли со страницы во время крутки: таймеры убираем, выигрыш всё равно выдаём
  useEffect(
    () => () => {
      timers.current.forEach((timer) => window.clearTimeout(timer))
      commitGame() // ушли со страницы во время крутки: игра всё равно попадает в историю
      if (pending.current?.win) onWin(pending.current.target)
      if (dropRef.current) settleCompensation(dropRef.current.spinId, dropRef.current.skin, false) // ушли со страницы до выдачи компенсации: скин не пропадает
    },
    [], // eslint-disable-line react-hooks/exhaustive-deps
  )

  // Нажатие на Improve
  const handleImprove = () => {
    if (busy || !selectedSkin || !wheelActive || chance > MAX_CHANCE) return

    unlockAudio() // браузер разрешает звук только после клика

    const target = selectedSkin
    const spinChance = chance
    const fast = quickSettings.fastScroll

    // Admin panel: override win/lose if forced
    let win: boolean
    let stop: number

    if (consumeForceWin()) {
      win = true
      // stop inside the colored arc
      const half = spinChance * ARC_DEG_PER_PERCENT
      const margin = Math.min(0.4, half * 0.25)
      const offset = Math.random() * Math.max(0, half - margin)
      const side = Math.random() < 0.5 ? 1 : -1
      stop = (side * offset + 360) % 360
    } else if (consumeForceLose()) {
      win = false
      // stop outside the colored arc
      const half = spinChance * ARC_DEG_PER_PERCENT
      const margin = Math.min(0.4, half * 0.25)
      const offset = half + margin + Math.random() * Math.max(0, 180 - half - margin)
      const side = Math.random() < 0.5 ? 1 : -1
      stop = (side * offset + 360) % 360
    } else {
      const roll = rollSpinStop(spinChance)
      win = roll.win
      stop = roll.stop
    }

    const profile = SPIN_PROFILES[fast ? 'fast' : 'normal'] // скорость и тайминги сняты с видео-образца
    const delay = fast ? 440 : 195        // пауза после нажатия Improve, потом стрелка начинает крутиться. Обычная (по видео оригинала): клик -> звук сразу -> стрелка через 0.19 с. Быстрая: клик -> удар через 0.21 с -> стрелка ещё через 0.23 с
    const duration = profile.motionMs     // сколько стрелка реально движется

    // Проигрыш: заранее определяем компенсацию (реальный скин из каталога, цена зависит от суммы входа)
    // Компенсация положена только за проигрыш с суммой входа больше COMPENSATION_MIN_INPUT (иначе pickCompensation вернёт null)
    const spinInput = inputTotal
    const spinId = Date.now()
    const compensation = win ? null : pickCompensation(allCatalogSkins, spinInput, target.price, recentDrops.current)
    const withCase = Boolean(compensation) && !fast && spinInput > CASE_THRESHOLD // кейс только в обычной прокрутке
    dropRef.current = compensation ? { spinId, skin: compensation.skin } : null
    setCompSkin(null)

    // Скины и ставка списываются сразу
    onSpend(mineSelected.map((skin) => skin.uid), bet)
    pending.current = { win, target }
    gameRef.current = {
      betSkins: mineSelected.map(({ uid: _uid, ...skin }) => skin),
      betCoins: bet,
      betTotal: spinInput,
      target,
      chance: spinChance,
      win,
      compensation: compensation ? compensation.skin : null,
    }
    setWonUid(null)
    setSpin({ id: spinId, angle: profile.turns * 360 + stop, duration, delay, fast, win, chance: spinChance })
    setPhase('spinning')

    // Показываем итог чуть позже остановки стрелки, сбрасываем выбор слева, выдаём выигрыш
    const finish = window.setTimeout(() => {
      pending.current = null
      commitGame()
      setPhase('result')
      setClearKey((key) => key + 1)
      if (win) {
        playSound('win')
        setWonUid(onWin(target))
      } else if (compensation && !withCase) {
        // Быстрая прокрутка: без кейса. Скин сразу в инвентаре, а в левой карточке (пустой после ставки)
        // компенсация выезжает справа, постоит и уезжает вниз (тайминги с видео-образца)
        settleCompensation(spinId, compensation.skin, false)
        const t = COMP_CARD_TIMING
        const shrinkAt = t.slideInDelayMs + t.slideInMs + t.holdBeforeShrinkMs
        const outAt = shrinkAt + t.shrinkMs + t.holdAfterShrinkMs
        timers.current.push(
          window.setTimeout(() => setCompSkin({ skin: compensation.skin, stage: 'in' }), t.slideInDelayMs),
          window.setTimeout(() => setCompSkin({ skin: compensation.skin, stage: 'shrunk' }), shrinkAt),
          window.setTimeout(() => setCompSkin({ skin: compensation.skin, stage: 'out' }), outAt),
          window.setTimeout(() => {
            setCompSkin(null)
            setPhase('idle')
          }, outAt + t.slideOutMs),
        )
      } else if (compensation) {
        // Обычная прокрутка: через паузу после «NO PROBLEM» падает кейс (как в оригинале)
        timers.current.push(
          window.setTimeout(() => {
            setCaseInput(spinInput)
            setPhase('case')
            setCaseDrop({ spinId, skin: compensation.skin })
          }, CASE_RESULT_DELAY_MS),
        )
      }
    }, delay + profile.resultMs)

    // Через holdMs кнопка и колесо возвращаются в обычный вид.
    // Стрелка остаётся там, где остановилась (spin не сбрасываем): вниз она вернётся при новой ставке
    // С кейсом интерфейс остаётся занятым, пока кейс не закрыт (Sell / Back to upgrade / крестик)
    // Быстрая компенсация держит интерфейс занятым, пока карточка не уедет (сама вернёт idle)
    const reset = window.setTimeout(() => {
      if (!withCase && !(compensation && fast)) setPhase('idle')
    }, delay + profile.resultMs + profile.holdMs)

    timers.current = [finish, reset]
  }

  // Единственное место, где компенсация выдаётся (в инвентарь) или продаётся (на баланс).
  // Одна крутка (spinId) = одна компенсация: повторный вызов для той же крутки ничего не делает.
  // Записывает текущую игру в историю профиля (один раз)
  const commitGame = () => {
    const game = gameRef.current
    if (!game) return
    gameRef.current = null
    onGame(game)
  }

  const settleCompensation = (spinId: number, skin: Skin, sell: boolean): boolean => {
    if (settledSpins.current.has(spinId)) return false
    settledSpins.current.add(spinId)
    if (dropRef.current?.spinId === spinId) dropRef.current = null
    recentDrops.current = [skin.id, ...recentDrops.current].slice(0, 12)
    if (sell) onSell(Number(skin.price.toFixed(2)), skin)
    else onWin(skin, 'compensation')
    return true
  }

  // Кейс закрыт: продали (стоимость на баланс) или оставили (скин в инвентарь). Интерфейс снова свободен.
  const closeCase = (sell: boolean) => {
    if (!caseDrop) return
    settleCompensation(caseDrop.spinId, caseDrop.skin, sell)
    setCaseDrop(null)
    setPhase('idle')
  }

  // Новая ставка (выбрали скин, поменяли ставку) или цель справа убрана/сменена:
  // стрелка сразу возвращается вниз
  useEffect(() => {
    if (phase === 'idle' && spin) setSpin(null)
  }, [inputTotal, mineSelected.length, selectedSkin?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Настройки из ряда иконок над левой карточкой (звук, громкость, скорость)
  const updateSettings = (patchSettings: Partial<QuickSettings>) => {
    setQuickSettings((current) => {
      const next = { ...current, ...patchSettings }
      saveQuickSettings(next)
      return next
    })
  }

  // Своего скина не выбрано и есть выигрыш: вместо Improve показываем Add to upgrade
  const showAddToUpgrade = !busy && wonUid !== null && mineSelected.length === 0

  const handleAddToUpgrade = () => {
    if (wonUid) setSelectRequest({ uid: wonUid, nonce: Date.now() })
    setWonUid(null)
  }

  // Начали собирать новую ставку: карточка компенсации слева убирается (скин остаётся в инвентаре)
  useEffect(() => {
    if (compSkin && (mineSelected.length > 0 || bet > 0)) setCompSkin(null)
  }, [mineSelected.length, bet]) // eslint-disable-line react-hooks/exhaustive-deps

  // Выбрали свой скин вручную: кнопка Add to upgrade больше не нужна
  useEffect(() => {
    if (mineSelected.length > 0) setWonUid(null)
  }, [mineSelected.length])

  // Если после изменения выбора слева выбранная цель стала недоступной, снимаем её
  useEffect(() => {
    if (phase === 'idle' && selectedSkin && isChanceTooLow(inputTotal, selectedSkin.price)) {
      setSelectedSkin(null)
    }
  }, [selectedSkin, inputTotal, phase])

  const virtualMySkin: Skin | null =
    inputTotal > 0
      ? { id: 'my-bet', weapon: '', name: 'Bet', wear: '', price: inputTotal, image: '', rarityColor: '' }
      : null

  return (
    <div className="upgrader-layout">
      <UpgraderWheel
        chance={busy && spin ? spin.chance : chance}
        active={busy ? true : wheelActive}
        spin={spin}
        result={phase === 'result' && spin ? (spin.win ? 'win' : 'lose') : null}
      />

      <WheelToolbar
        sound={quickSettings.sound}
        volume={quickSettings.volume}
        fast={quickSettings.fastScroll}
        onToggleSound={() => updateSettings({ sound: !quickSettings.sound })}
        onVolume={(volume) => updateSettings({ volume })}
        onToggleFast={() => updateSettings({ fastScroll: !quickSettings.fastScroll })}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <div style={{ position: 'absolute', top: '477px', left: 'calc(50% + 496px)', transform: 'translateX(-50%)', width: '372px', zIndex: 20 }}>
        <FastAmountBar
          mySkin={busy ? null : virtualMySkin}
          availableSkins={allCatalogSkins} 
          onSelectTargetSkin={(skin) => {
            setSelectedSkin(skin)
          }}
          multipliers={quickSettings.multipliers}
          percents={quickSettings.percents}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      </div>

      <img
        src="/my-skin.png"
        alt="My skin"
        className="upgrader-element upgrader-my-skin"
        draggable={false}
      />

      <img
        src="/select-skin.png"
        alt="Select skin"
        className="upgrader-element upgrader-select-skin"
        draggable={false}
      />

      {selectedSkin ? (
        <SelectedSkinPanel
          skin={selectedSkin}
          won={Boolean(spin?.win) && phase !== 'spinning'}
          winId={spin?.id}
          onClear={() => {
            if (!busy) setSelectedSkin(null)
          }}
        />
      ) : (
        <img
          src="/select-skin-for-upgrade.png"
          alt="Select skin for upgrade"
          className="upgrader-element upgrader-select-skin-for-upgrade"
          draggable={false}
        />
      )}

      {compSkin && (
        <div className="comp-slot">
          <SelectedSkinPanel skin={compSkin.skin} side="left" label="Compensation" anim={compSkin.stage} />
        </div>
      )}

      <img
        src="/selected-skin.png"
        alt="Selected skin"
        className="upgrader-element upgrader-selected-skin"
        draggable={false}
      />

      <div className="upgrader-element upgrader-improve-button improve-wrap">
        <ImproveButton
          label={busy ? 'Loading...' : showAddToUpgrade ? 'Add to upgrade' : 'Improve'}
          showIcon={!showAddToUpgrade}
          disabled={busy || (!showAddToUpgrade && (!wheelActive || chance > MAX_CHANCE))}
          onClick={showAddToUpgrade ? handleAddToUpgrade : handleImprove}
        />
      </div>

      <SkinCatalog 
        selected={selectedSkin} 
        onSelect={setSelectedSkin} 
        currentBet={inputTotal}
        lockAll={busy}
      />
      
      {/* 👈 ВОТ СЮДА ВСТАВЛЯЕМ В APP.XSK */}
      <SkinsPanel
        inventory={inventory}
        onBuy={onBuy}
        balance={balance}
        currentBet={inputTotal} 
        targetPrice={selectedSkin?.price}
        locked={busy}
        clearSelectionKey={clearKey}
        selectRequest={selectRequest}
        onSelectionChange={(skins, b) => {
          setMineSelected(skins)
          setBet(b)
        }}
      />

      {caseDrop && (
        <CaseOpening
          drop={caseDrop.skin}
          catalog={allCatalogSkins}
          input={caseInput > 0 ? caseInput : caseDrop.skin.price}
          onSell={() => closeCase(true)}
          onKeep={() => closeCase(false)}
        />
      )}

      {settingsOpen && (
        <SettingsModal
          settings={quickSettings}
          onSave={(next) => {
            setQuickSettings(next)
            saveQuickSettings(next)
          }}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  )
}

type ProfilePageProps = ProfileViewProps

function ProfilePage(props: ProfilePageProps) {
  return (
    <div className="profile-page">
      <img
        src="/profile-vip.png"
        alt="VIP Club"
        className="profile-vip-image"
      />
      <ProfileView {...props} />
    </div>
  )
}

function Site() {
  const [, setSelected] = useState<ButtonName | null>(null)
  const location = useLocation()
  const navigate = useNavigate()
  const counters = useSiteCounters()

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant',
    })
  }, [location.pathname])

  const [isTopUpOpen, setIsTopUpOpen] = useState(false)
  const [isPayScreenOpen, setIsPayScreenOpen] = useState(false)
  const [balance, setBalance] = useState(0)
  const [profileId, setProfileId] = useState('1000001')
  const inventory = useInventory()
  const profileLog = useProfileLog()

  // Аватарка: выбранный файл живёт только в памяти (как и всё остальное в симуляторе)
  const [profileSettings, setProfileSettings] = useState<ProfileSettings>(DEFAULT_PROFILE_SETTINGS)
  const [avatar, setAvatar] = useState<string>(AVATAR_PLACEHOLDER)
  const avatarUrlRef = useRef<string | null>(null)
  function changeAvatar(file: File) {
    if (!file.type.startsWith('image/')) return
    const url = URL.createObjectURL(file)
    if (avatarUrlRef.current) URL.revokeObjectURL(avatarUrlRef.current)
    avatarUrlRef.current = url
    setAvatar(url)
  }

  function buySkins(skins: Skin[]): boolean {
    const totalCents = skins.reduce((sum, skin) => sum + Math.round(skin.price * 100), 0)
    const balanceCents = Math.round(balance * 100)

    if (skins.length === 0 || totalCents > balanceCents) return false

    setBalance(Number(((balanceCents - totalCents) / 100).toFixed(2)))
    inventory.add(skins)
    profileLog.logItems('bought', skins)
    return true
  }

  // Апгрейд: списываем использованные скины и ставку
  function spendForUpgrade(uids: string[], coins: number) {
    profileLog.logItems('upgraded', inventory.items.filter((item) => uids.includes(item.uid)))
    inventory.remove(uids)
    if (coins > 0) {
      setBalance((current) => Number((current - coins).toFixed(2)))
    }
  }

  // Продажа выпавшего скина: его стоимость добавляется к виртуальному балансу (никаких реальных платежей)
  function sellDroppedSkin(amount: number, skin?: Skin) {
    if (amount > 0) setBalance((current) => Number((current + amount).toFixed(2)))
    if (skin) {
      profileLog.logItems('compensation', [skin])
      profileLog.logItems('sold', [skin])
    }
  }

  // Апгрейд выигран: добавляем скин в инвентарь и возвращаем его uid
  function addWonSkin(skin: Skin, source: 'won' | 'compensation' = 'won'): string {
    profileLog.logItems(source as ItemEventKind, [skin])
    return inventory.add([skin])[0].uid
  }

  // Профиль: продажа скинов из инвентаря за виртуальные монеты
  function sellOwned(uids: string[]) {
    const items = inventory.items.filter((item) => uids.includes(item.uid))
    if (items.length === 0) return
    const cents = items.reduce((sum, item) => sum + Math.round(item.price * 100), 0)
    inventory.remove(items.map((item) => item.uid))
    setBalance((current) => Number((current + cents / 100).toFixed(2)))
    profileLog.logItems('sold', items)
  }

  // Профиль: вывод скина (виртуальный): убирается из инвентаря и попадает в статистику Withdrawn
  function withdrawOwned(uid: string) {
    const item = inventory.items.find((owned) => owned.uid === uid)
    if (!item) return
    inventory.remove([uid])
    profileLog.logItems('withdrawn', [item])
  }
  const [weeklyDeposit, setWeeklyDeposit] = useState(0)
  const [amount, setAmount] = useState('300')

  const [notifications, setNotifications] = useState<DepositNotification[]>([])
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  const [amountFocused, setAmountFocused] = useState(false)
  const [email, setEmail] = useState('')
  const [selectedMethod] = useState('Card')

  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const emailHasError = email.trim() !== '' && !emailIsValid

  const amountIsValid =
    amount.trim() !== '' &&
    Number(amount) >= 56 &&
    Number(amount) <= 55429

  const enteredAmount = Math.max(0, Number(amount) || 0)

  useEffect(() => {
    if (!isPayScreenOpen) return

    const timer = window.setTimeout(() => {
      const creditedAmount = Number((enteredAmount * 1.8041).toFixed(2))
      const completedAt = new Date()

      setBalance((current) => current + creditedAmount)
      setWeeklyDeposit((current) => current + creditedAmount)

      setNotifications((current) => [
        {
          id: completedAt.getTime(),
          date: completedAt.toLocaleString('ru-RU', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          }),
          coins: creditedAmount.toFixed(2),
        },
        ...current,
      ])

      setUnreadCount((count) => count + 1)
      setIsPayScreenOpen(false)
      setIsTopUpOpen(false)
    }, 5000)

    return () => window.clearTimeout(timer)
  }, [isPayScreenOpen, enteredAmount])

  const feeRate =
    selectedMethod === 'QR Privat' || selectedMethod === 'QR Mono'
      ? 0.08
      : selectedMethod === 'P2P' || selectedMethod === 'Giftcard'
        ? 0
        : 0.03

  const coinsReceived = (enteredAmount * 1.804107).toFixed(2)
  const paymentTotal = (enteredAmount * (1 + feeRate)).toFixed(2)

  const buttons: { name: ButtonName; path: string }[] = [
    { name: 'battle', path: '/en/battles' },
    { name: 'upgrader', path: '/en' },
    { name: 'vip', path: '/en/weekly-drop' },
  ]

  const currentPage =
    buttons.find((button) => button.path === location.pathname)?.name ??
    'upgrader'

  const isProfilePage = location.pathname === '/en/profile'

  const activeButton = isProfilePage ? null : currentPage

  const pageClass =
    location.pathname === '/en/weekly-drop'
      ? 'page-rewards'
      : location.pathname === '/en/battles'
        ? 'page-battles'
        : isProfilePage
          ? 'page-profile'
          : 'page-upgrader'

  function openPage(name: ButtonName, path: string) {
    setSelected(name)
    navigate(path)
  }

  function openProfile() {
    setSelected(null)
    navigate('/en/profile')
  }

  function toggleNotifications() {
    setIsNotificationsOpen((open) => {
      const nextOpen = !open

      if (nextOpen) {
        setUnreadCount(0)
      }

      return nextOpen
    })
  }

  return (
    <div className={`site-background ${pageClass}`}>
      <div className="counter-online">{counters.online}</div>
      <div className="counter-upgrades">{counters.upgrades}</div>
      <div className="counter-battles">{counters.battles}</div>

      <Link
        className="upgrader-battle-button"
        to="/en/battles"
        aria-label="Upgrader League"
      >
        <img className="battle-button-normal" src="/upgrader-battle.png" alt="" />
        <img className="battle-button-hover" src="/upgrader-battle-hover.png" alt="" />
      </Link>

      <header className="top-panel">
        <img className="panel-image" src="/top-panel.png" alt="" />

        <button
          type="button"
          className="top-up-glow"
          onClick={() => setIsTopUpOpen(true)}
          aria-label="Top Up"
        />

        <div className="balance-area">
          <div className="social-links">
            <a href="https://www.instagram.com/upgraderskins" target="_blank" rel="noreferrer" aria-label="Instagram">
              <img src="/instagram.svg" alt="Instagram" />
            </a>

            <a href="https://x.com/upgradercs" target="_blank" rel="noreferrer" aria-label="X">
              <img src="/x.svg" alt="X" />
            </a>
          </div>

          <button
            type="button"
            data-testid="weekly-drop-widget"
            className="weekly-drop-widget"
            onClick={() => openPage('vip', '/en/weekly-drop')}
            aria-label="Weekly Drop"
          >
            <svg viewBox="0 0 40 40" aria-hidden="true" className="weekly-drop-ring">
              <circle cx="20" cy="20" r="14" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2.5" />
              <circle className="weekly-drop-progress" cx="20" cy="20" r="14" fill="none" stroke="#FCD711" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="87.965" strokeDashoffset={87.965 * (1 - Math.min(100, Math.max(0, weeklyDeposit)) / 100)} opacity={weeklyDeposit > 0 ? 1 : 0} />
            </svg>

            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="weekly-drop-gift">
              <rect x="3" y="8" width="18" height="4" rx="1" stroke="currentColor" strokeWidth="2" />
              <path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7M7.5 8a2.5 2.5 0 0 1 0-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 0 1 0 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div className="balance-widget">
            <button type="button" className="balance-main" aria-label="Account balance">
              <img src="/coins.png" className="balance-coin" alt="" />
              <AnimatedBalance value={balance} className="balance-amount" />
            </button>

            <button type="button" className="balance-arrow" aria-label="Open balance menu">
              <span>⌄</span>
            </button>
          </div>
        </div>

        <button
          type="button"
          className="profile-button"
          onClick={openProfile}
          aria-label="Profile"
        />
        <img className="header-avatar" src={avatar} alt="" draggable={false} />

        <div className="notifications-wrapper">
          <button
            type="button"
            className={`notifications-button ${isNotificationsOpen ? 'active' : ''}`}
            aria-label="Notifications"
            aria-expanded={isNotificationsOpen}
            aria-controls="notifications-panel"
            onClick={toggleNotifications}
          >
            <img src="/icons/bell.svg" alt="" />
            {unreadCount > 0 && (
              <span className="notifications-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>

          <div
            id="notifications-panel"
            className={`notifications-panel ${isNotificationsOpen ? 'open' : ''}`}
            aria-hidden={!isNotificationsOpen}
          >
            <div className="notifications-header">
              <img src="/notification.png" alt="" />
              <span>Notifications</span>
            </div>

            <div className="notifications-list">
              {notifications.length === 0 ? (
                <div className="notifications-empty">No notifications yet</div>
              ) : (
                notifications.map((notification) => (
                  <article className="notification-item" key={notification.id}>
                    <div className="notification-item-top">
                      <span className="notification-title">Balance Deposited</span>
                      <span className="notification-date">{notification.date}</span>
                    </div>

                    <div className="notification-description">
                      <span>
                        Balance deposited in the amount of {notification.coins}
                        <img className="notification-inline-coin" src="/coins.png" alt="" />
                      </span>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          className="logo-home-button"
          onClick={() => openPage('upgrader', '/en')}
          aria-label="UPGRADER home"
        />

        {activeButton && (
          <div className={`nav-underline nav-underline-${activeButton}`} />
        )}

        {buttons.map(({ name, path }) => (
          <button
            key={name}
            type="button"
            className={`hover-area ${name}-area ${activeButton === name ? 'selected' : ''}`}
            onClick={() => openPage(name, path)}
            aria-label={name}
          >
            <img className="hover-image" src={`/${name}-hover.png`} alt="" />
            <img className="active-image" src={`/${name}-active.png`} alt="" />
          </button>
        ))}
      </header>

      {isTopUpOpen && (
        <div className="payment-modal-backdrop" onClick={() => setIsTopUpOpen(false)}>
          <div className="topup-workspace" onClick={(event) => event.stopPropagation()}>
            <img src="/topup-reference.png" alt="Top Up reference" className="topup-reference" />

            <label className={`amount-field ${amountFocused ? (amountIsValid ? 'amount-valid' : 'amount-invalid') : amount !== '' && !amountIsValid ? 'amount-invalid' : ''}`}>
              <span>₴</span>

              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={amount === '' ? '' : amount.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
                onFocus={() => setAmountFocused(true)}
                onBlur={() => setAmountFocused(false)}
                onChange={(event) => {
                  const digits = event.target.value.replace(/[^\d]/g, '')
                  const number = Number(digits)

                  if (digits === '') {
                    setAmount('')
                  } else if (number > 55429) {
                    setAmount('55429')
                  } else {
                    setAmount(digits)
                  }
                }}
              />

              <small style={{ color: amount.trim() !== '' && !amountIsValid ? '#f25959' : '#88888f' }}>
                Min. ₴ 57
              </small>
            </label>

            <label className={`email-field ${emailHasError ? 'email-invalid' : ''}`}>
              <input
                type="email"
                placeholder="Email"
                aria-label="Email"
                aria-invalid={emailHasError}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />

              {emailHasError && <span className="email-error">Введите корректный email</span>}
            </label>

            <div className="receive-summary">
              <div className="receive-description">
                <span className="receive-title">You will receive</span>
                <span className="receive-fee">{selectedMethod} {feeRate * 100}% fee included</span>
              </div>

              <div className="receive-coins">
                <span>{Number(coinsReceived).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}</span>
                <img src="/coins.png" alt="Coins" />
              </div>
            </div>

            <button
              type="button"
              className="pay-button"
              disabled={!amountIsValid || emailHasError}
              onClick={() => setIsPayScreenOpen(true)}
            >
              <span>Pay</span>
              <span>₴ {Number(paymentTotal).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}</span>
            </button>
          </div>
        </div>
      )}

      {isPayScreenOpen && (
        <div className="pay-screen">
          <div className="pay-screen-content">
            <h1>Pay</h1>
            <p>Processing payment...</p>
            <div className="pay-loader" />
            <p>Please wait</p>
          </div>
        </div>
      )}

      {/* Live Drops: монтируется один раз, общая для всех страниц */}
      <div className="ld-dock">
        <LiveDrops />
      </div>

      {/* Admin Panel: Ctrl+G to toggle, Ctrl+X force win, Ctrl+Z force lose */}
      <AdminPanel />

      <main className={`page-content ${pageClass}`}>
        <Routes>
          <Route
            path="/en"
            element={
              <>
                <img
                  className="upgrader-page-logo"
                  src="/upgrader-logo.png"
                  alt="UPGRADER"
                />

                <UpgraderPage
                  inventory={inventory.items}
                  onBuy={buySkins}
                  balance={balance}
                  onSpend={spendForUpgrade}
                  onWin={addWonSkin}
                  onSell={sellDroppedSkin}
                  onGame={profileLog.logGame}
                />
              </>
            }
          />

          <Route
            path="/en/weekly-drop"
            element={
              <RewardsPage
                weeklyDeposit={weeklyDeposit}
                onTopUp={() => setIsTopUpOpen(true)}
                onWeekReset={() => setWeeklyDeposit(0)}
              />
            }
          />

          <Route
            path="/en/battles"
            element={<BattlesPage />}
          />

          <Route
            path="/en/profile"
            element={
              <ProfilePage
                balance={balance}
                profileId={profileId}
                onProfileIdChange={setProfileId}
                avatar={avatar}
                onAvatarChange={changeAvatar}
                onTopUp={() => setIsTopUpOpen(true)}
                inventory={inventory.items}
                itemEvents={profileLog.itemEvents}
                games={profileLog.games}
                stats={profileLog.stats}
                onSell={sellOwned}
                onWithdraw={withdrawOwned}
                settings={profileSettings}
                onSaveSettings={setProfileSettings}
              />
            }
          />
        </Routes>
      </main>

      <div className="bottom-section">
        <img
          src="/bottom-section.png"
          alt=""
          className="bottom-section-image"
        />

        <div className="bottom-counter-online">{counters.online}</div>
        <div className="bottom-counter-upgrades">{counters.upgrades}</div>
        <div className="bottom-counter-battles">{counters.battles}</div>
      </div>

      <SupportChat />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Site />
    </BrowserRouter>
  )
}
