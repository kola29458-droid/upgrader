import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import './App.css'
import SupportChat from './SupportChat'
import { Link } from "react-router-dom";
import SkinCatalog from './components/SkinCatalog'
import type { Skin } from './components/SkinCatalog'
import SelectedSkinPanel from './components/SelectedSkinPanel'
import SkinsPanel from './components/SkinsPanel'
import { useInventory } from './hooks/useInventory'
import type { OwnedSkin } from './hooks/useInventory'
import UpgraderWheel from './components/UpgraderWheel'
import FastAmountBar from './components/FastAmountBar'
import ImproveButton from './components/ImproveButton'
import SettingsModal from './components/SettingsModal'
import { loadQuickSettings, saveQuickSettings } from './quickSettings'
import type { QuickSettings } from './quickSettings'
import { useSkins } from './hooks/useSkins'
import { calcChance, isTargetAllowed } from './upgraderMath'

const COUNTER_SETTINGS = {
  onlineMin: 1500,
  onlineMax: 4000,
  onlineSpeed: 2500,
  upgradesStart: 566442440,
  upgradesSpeed: 40,
  upgradesChance: 0.65,
  upgradesMinAdd: 1,
  upgradesMaxAdd: 3,
  battlesStart: 484516,
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

const WEEK_DURATION = 7 * 24 * 60 * 60 * 1000

function getWeeklyEnd() {
  const saved = localStorage.getItem('rewards-week-end')

  if (saved && Number(saved) > Date.now()) {
    return Number(saved)
  }

  const end = Date.now() + WEEK_DURATION
  localStorage.setItem('rewards-week-end', String(end))
  return end
}

function RewardsOverlay() {
  const [weeklyEnd, setWeeklyEnd] = useState(getWeeklyEnd)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const interval = window.setInterval(() => {
      const current = Date.now()
      setNow(current)

      if (current >= weeklyEnd) {
        const nextEnd = current + WEEK_DURATION
        localStorage.setItem('rewards-week-end', String(nextEnd))
        setWeeklyEnd(nextEnd)
      }
    }, 1000)

    return () => window.clearInterval(interval)
  }, [weeklyEnd])

  const total = Math.max(0, Math.floor((weeklyEnd - now) / 1000))
  const days = Math.floor(total / 86400)
  const hours = Math.floor((total % 86400) / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60

  const time = `${days}d ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  return (
    <div className="rewards-top-left">
      <div className="rewards-timer">
        <svg viewBox="0 0 24 24" fill="none" className="rewards-clock">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
          <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        <span className="rewards-timer-label">Week ends in</span>
        <strong className="rewards-timer-value">{time}</strong>
      </div>
    </div>
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


function AdminPanel({
  open,
  onClose,
  onForce,
  forceNext,
  fastSpin,
  onFastSpin,
  onReset,
}: {
  open: boolean
  onClose: () => void
  onForce: (value: 'win' | 'lose') => void
  forceNext: 'win' | 'lose' | null
  fastSpin: boolean
  onFastSpin: (value: boolean) => void
  onReset: () => void
}) {
  if (!open) return null

  const selectedButton = (active: boolean, color: string): CSSProperties => ({
    width: '100%',
    minHeight: '76px',
    padding: '13px 16px',
    borderRadius: '10px',
    cursor: 'pointer',
    textAlign: 'left',
    color: '#fff',
    border: `1px solid ${active ? color : '#343e51'}`,
    background: active
      ? `linear-gradient(110deg, ${color}44, ${color}22)`
      : 'linear-gradient(110deg, #202838, #171e2b)',
    boxShadow: active ? `0 0 22px ${color}44, inset 0 0 15px ${color}12` : 'none',
    transition: 'all 0.2s ease',
  })

  const smallButton: CSSProperties = {
    border: '1px solid #354258',
    background: '#202939',
    color: '#c7d3e5',
    borderRadius: '8px',
    padding: '12px',
    cursor: 'pointer',
    fontWeight: 800,
    letterSpacing: '1px',
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99998,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        background: 'rgba(3, 7, 15, 0.86)',
        backdropFilter: 'blur(9px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '390px',
          maxWidth: '100%',
          padding: '25px',
          color: '#fff',
          borderRadius: '16px',
          border: '1px solid #344e73',
          background: 'linear-gradient(145deg, #192538, #0c121e)',
          boxShadow: '0 0 55px rgba(40, 119, 255, 0.2), 0 25px 80px #000',
          fontFamily: 'Arial, sans-serif',
          animation: 'adminAppear 0.2s ease-out',
        }}
        onClick={(event) => event.stopPropagation()}
      >
        {/* HEADER */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '22px',
        }}>
          <div>
            <div style={{
              fontSize: '10px',
              color: '#69aaff',
              letterSpacing: '2px',
              fontWeight: 900,
              marginBottom: '6px',
            }}>
              UPGRADER / SYSTEM
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: 900,
              letterSpacing: '1px',
            }}>
              ADMIN PANEL
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              width: '35px',
              height: '35px',
              borderRadius: '8px',
              border: '1px solid #39475d',
              background: '#202b3d',
              color: '#aabbd3',
              fontSize: '19px',
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>

        {/* CURRENT STATUS */}
        <div style={{
          padding: '14px',
          marginBottom: '20px',
          borderRadius: '10px',
          border: `1px solid ${
            forceNext === 'win' ? '#20c982'
            : forceNext === 'lose' ? '#ed526c'
            : '#354258'
          }`,
          background: forceNext === 'win'
            ? 'rgba(24, 180, 112, 0.12)'
            : forceNext === 'lose'
              ? 'rgba(220, 55, 82, 0.12)'
              : 'rgba(100, 120, 150, 0.08)',
        }}>
          <div style={{
            fontSize: '10px',
            color: '#899bb5',
            letterSpacing: '1.5px',
            fontWeight: 800,
            marginBottom: '7px',
          }}>
            NEXT UPGRADE STATUS
          </div>

          <div style={{
            fontSize: '14px',
            fontWeight: 900,
            color: forceNext === 'win'
              ? '#48e6a0'
              : forceNext === 'lose'
                ? '#ff7188'
                : '#b8c5d8',
          }}>
            {forceNext === 'win'
              ? '✓ GUARANTEED WIN'
              : forceNext === 'lose'
                ? '✕ GUARANTEED LOSE'
                : '● NORMAL CHANCE'}
          </div>

          <div style={{
            fontSize: '11px',
            color: '#8292aa',
            marginTop: '6px',
          }}>
            {forceNext
              ? 'Selected mode will apply to the next upgrade'
              : 'Original chance calculation is active'}
          </div>
        </div>

        {/* FORCE WIN */}
        <div style={{
          fontSize: '10px',
          color: '#8495ad',
          letterSpacing: '1.5px',
          fontWeight: 800,
          marginBottom: '9px',
        }}>
          RESULT CONTROL
        </div>

        <button
          type="button"
          aria-pressed={forceNext === 'win'}
          style={selectedButton(forceNext === 'win', '#20d58a')}
          onClick={() => onForce('win')}
        >
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 900 }}>
                🏆 FORCE WIN
              </div>
              <div style={{ fontSize: '11px', color: '#a6b6c9', marginTop: '6px' }}>
                Guarantee the next upgrade wins
              </div>
            </div>
            <div style={{
              fontSize: '11px',
              fontWeight: 900,
              color: forceNext === 'win' ? '#54f0ad' : '#75849a',
            }}>
              {forceNext === 'win' ? '✓ ACTIVE' : 'SELECT'}
            </div>
          </div>
        </button>

        {/* FORCE LOSE */}
        <button
          type="button"
          aria-pressed={forceNext === 'lose'}
          style={{
            ...selectedButton(forceNext === 'lose', '#f04f70'),
            marginTop: '10px',
          }}
          onClick={() => onForce('lose')}
        >
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 900 }}>
                ✕ FORCE LOSE
              </div>
              <div style={{ fontSize: '11px', color: '#a6b6c9', marginTop: '6px' }}>
                Guarantee the next upgrade loses
              </div>
            </div>
            <div style={{
              fontSize: '11px',
              fontWeight: 900,
              color: forceNext === 'lose' ? '#ff7188' : '#75849a',
            }}>
              {forceNext === 'lose' ? '✓ ACTIVE' : 'SELECT'}
            </div>
          </div>
        </button>

        {/* FAST SPIN */}
        <div style={{
          marginTop: '20px',
          padding: '15px',
          borderRadius: '10px',
          border: `1px solid ${fastSpin ? '#397ed5' : '#354258'}`,
          background: fastSpin ? 'rgba(42, 115, 220, 0.13)' : '#151e2c',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div>
              <div style={{ fontWeight: 900, fontSize: '14px' }}>
                ⚡ FAST SPIN
              </div>
              <div style={{ fontSize: '11px', color: '#8c9db5', marginTop: '5px' }}>
                Faster upgrade animation
              </div>
            </div>

            <button
              type="button"
              aria-pressed={fastSpin}
              onClick={() => onFastSpin(!fastSpin)}
              style={{
                width: '64px',
                height: '31px',
                borderRadius: '30px',
                border: `1px solid ${fastSpin ? '#459cff' : '#596477'}`,
                background: fastSpin ? '#2479e8' : '#343e50',
                position: 'relative',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <span style={{
                position: 'absolute',
                top: '3px',
                left: fastSpin ? '34px' : '3px',
                width: '23px',
                height: '23px',
                borderRadius: '50%',
                background: '#fff',
                transition: 'left 0.2s',
              }} />
            </button>
          </div>

          <div style={{
            fontSize: '10px',
            fontWeight: 900,
            color: fastSpin ? '#65b2ff' : '#8290a5',
            marginTop: '10px',
          }}>
            {fastSpin ? '● FAST SPIN ENABLED' : '● FAST SPIN DISABLED'}
          </div>
        </div>

        {/* FOOTER */}
        <div style={{
          display: 'flex',
          gap: '10px',
          marginTop: '20px',
        }}>
          <button
            type="button"
            style={{ ...smallButton, flex: 1 }}
            onClick={onReset}
          >
            ↻ RESET
          </button>

          <button
            type="button"
            style={{
              ...smallButton,
              flex: 1,
              background: '#263c5b',
              borderColor: '#416ba1',
              color: '#fff',
            }}
            onClick={onClose}
          >
            CLOSE PANEL
          </button>
        </div>

        <div style={{
          textAlign: 'center',
          color: '#596b85',
          fontSize: '10px',
          letterSpacing: '1px',
          marginTop: '18px',
        }}>
          ADMIN ACCESS · SHIFT + G
        </div>
      </div>

      <style>{`
        @keyframes adminAppear {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  )
}


function UpgraderPage({
  inventory,
  onBuy,
  balance,
  onSpend,
  onWin,
}: {
  inventory: OwnedSkin[]
  onBuy: (skins: Skin[]) => boolean
  balance: number
  onSpend: (uids: string[], coins: number) => void // списать скины и ставку после нажатия Improve
  onWin: (skin: Skin) => string                    // выдать выигранный скин, возвращает его uid
}) {
  const [selectedSkin, setSelectedSkin] = useState<Skin | null>(null)
  const [mineSelected, setMineSelected] = useState<OwnedSkin[]>([])
  const [bet, setBet] = useState(0)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [quickSettings, setQuickSettings] = useState<QuickSettings>(loadQuickSettings)

const [adminOpen, setAdminOpen] = useState(false)
const [forceNext, setForceNext] = useState<'win' | 'lose' | null>(null)
const [adminFastSpin, setAdminFastSpin] = useState(false)


useEffect(() => {
  const handleShortcut = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement

    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target.isContentEditable
    ) {
      return
    }

    if (
      event.ctrlKey &&
      event.key.toLowerCase() === 'x' &&
      !event.repeat
    ) {
      event.preventDefault()
      setForceNext('win')
      return
    }

    if (
      event.ctrlKey &&
      event.key.toLowerCase() === 'z' &&
      !event.repeat
    ) {
      event.preventDefault()
      setForceNext('lose')
      return
    }

    if (
      event.shiftKey &&
      event.key.toLowerCase() === 'g' &&
      !event.repeat
    ) {
      event.preventDefault()
      setAdminOpen((open) => !open)
    }
  }

  window.addEventListener('keydown', handleShortcut)

  return () => window.removeEventListener('keydown', handleShortcut)
}, [])


  // Крутка: idle (ждём) -> spinning (стрелка крутится) -> result (показываем итог 3 секунды) -> idle
  const [phase, setPhase] = useState<'idle' | 'spinning' | 'result'>('idle')
  const [spin, setSpin] = useState<{
    id: number
    angle: number
    duration: number
    win: boolean
    chance: number
  } | null>(null)
  const [wonUid, setWonUid] = useState<string | null>(null) // uid выигранного скина (для кнопки Add to upgrade)
  const [clearKey, setClearKey] = useState(0)
  const [selectRequest, setSelectRequest] = useState<{ uid: string; nonce: number } | null>(null)
  const timers = useRef<number[]>([])
  const pending = useRef<{ win: boolean; target: Skin } | null>(null)

  const busy = phase !== 'idle'

  const { skins: allCatalogSkins } = useSkins()

  const inputTotal = mineSelected.reduce((sum, s) => sum + s.price, 0) + bet
  const chance = selectedSkin ? calcChance(inputTotal, selectedSkin.price) : 0
  const wheelActive = Boolean(selectedSkin) && inputTotal > 0

  // Если ушли со страницы во время крутки: таймеры убираем, выигрыш всё равно выдаём
  useEffect(
    () => () => {
      timers.current.forEach((timer) => window.clearTimeout(timer))
      if (pending.current?.win) onWin(pending.current.target)
    },
    [], // eslint-disable-line react-hooks/exhaustive-deps
  )

  // Нажатие на Improve
  const handleImprove = () => {
    if (busy || !selectedSkin || !wheelActive) return

    const target = selectedSkin
    const spinChance = chance
    const randomStop = Math.random() * 360
const winLimit = Math.min(180, Math.max(0, spinChance * 1.8))

const randomWinStop =
  Math.random() < 0.5
    ? Math.random() * winLimit
    : 360 - Math.random() * winLimit

const loseWidth = 360 - winLimit * 2

const randomLoseStop =
  winLimit + Math.random() * loseWidth

const win = forceNext === 'win'
  ? true
  : forceNext === 'lose'
    ? false
    : Math.min(randomStop, 360 - randomStop) <= winLimit

const stop = forceNext === 'win'
  ? randomWinStop
  : forceNext === 'lose'
    ? randomLoseStop
    : randomStop

const duration = adminFastSpin || quickSettings.fastScroll ? 3500 : 6500

setForceNext(null)
    // Скины и ставка списываются сразу
    onSpend(mineSelected.map((skin) => skin.uid), bet)
    pending.current = { win, target }
    setWonUid(null)
    setSpin({ id: Date.now(), angle: 5 * 360 + stop, duration, win, chance: spinChance })
    setPhase('spinning')

    // Стрелка остановилась: показываем итог, сбрасываем выбор слева, выдаём выигрыш
    const finish = window.setTimeout(() => {
      pending.current = null
      setPhase('result')
      setClearKey((key) => key + 1)
      if (win) setWonUid(onWin(target))
    }, duration)

    // Ещё через 3 секунды всё возвращается в обычный вид
    const reset = window.setTimeout(() => {
      setPhase('idle')
      setSpin(null)
    }, duration + 3000)

    timers.current = [finish, reset]
  }

  // Своего скина не выбрано и есть выигрыш: вместо Improve показываем Add to upgrade
  const showAddToUpgrade = !busy && wonUid !== null && mineSelected.length === 0

  const handleAddToUpgrade = () => {
    if (wonUid) setSelectRequest({ uid: wonUid, nonce: Date.now() })
    setWonUid(null)
  }

  // Выбрали свой скин вручную: кнопка Add to upgrade больше не нужна
  useEffect(() => {
    if (mineSelected.length > 0) setWonUid(null)
  }, [mineSelected.length])

  // Если после изменения выбора слева выбранная цель стала недоступной, снимаем её
  useEffect(() => {
    if (phase === 'idle' && selectedSkin && !isTargetAllowed(inputTotal, selectedSkin.price, 1)) {
      setSelectedSkin(null)
    }
  }, [selectedSkin, inputTotal, phase])

  const virtualMySkin: Skin | null = inputTotal > 0
  ? {
      id: 'my-bet',
      weapon: 'Bet',
      name: 'Bet',
      wear: '',
      price: inputTotal,
      image: '',
      rarityColor: '#ffffff',
    }
  : null

  return (
    <div className="upgrader-layout">
      <UpgraderWheel
        chance={busy && spin ? spin.chance : chance}
        active={busy ? true : wheelActive}
        spin={spin}
        result={phase === 'result' && spin ? (spin.win ? 'win' : 'lose') : null}
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
          disabled={busy || (!showAddToUpgrade && !wheelActive)}
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

       <AdminPanel
  open={adminOpen}
  forceNext={forceNext}
  onClose={() => setAdminOpen(false)}
  onForce={setForceNext}
  fastSpin={adminFastSpin}
  onFastSpin={setAdminFastSpin}
  onReset={() => {
    setForceNext(null)
    setAdminFastSpin(false)
    setAdminOpen(false)
  }}
/>

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

function ProfilePage() {
  return (
    <div className="profile-page">
      <img
        src="/profile.png"
        alt="Profile"
        className="profile-reference-image"
      />
      <img
        src="/profile-vip.png"
        alt="VIP Club"
        className="profile-vip-image"
      />
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
  const inventory = useInventory()

  function buySkins(skins: Skin[]): boolean {
    const totalCents = skins.reduce((sum, skin) => sum + Math.round(skin.price * 100), 0)
    const balanceCents = Math.round(balance * 100)

    if (skins.length === 0 || totalCents > balanceCents) return false

    setBalance(Number(((balanceCents - totalCents) / 100).toFixed(2)))
    inventory.add(skins)
    return true
  }

  // Апгрейд: списываем использованные скины и ставку
  function spendForUpgrade(uids: string[], coins: number) {
    inventory.remove(uids)
    if (coins > 0) {
      setBalance((current) => Number((current - coins).toFixed(2)))
    }
  }

  // Апгрейд выигран: добавляем скин в инвентарь и возвращаем его uid
  function addWonSkin(skin: Skin): string {
    return inventory.add([skin])[0].uid
  }
  const [weeklyDeposit, setWeeklyDeposit] = useState(0)
  const [amount, setAmount] = useState('300')

  const [notifications, setNotifications] = useState<DepositNotification[]>([])
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false)

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

      setHasUnreadNotifications(true)
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
        setHasUnreadNotifications(false)
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
              <circle className="weekly-drop-progress" cx="20" cy="20" r="14" fill="none" stroke="#FCD711" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="87.965" strokeDashoffset="87.965" />
            </svg>

            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="weekly-drop-gift">
              <rect x="3" y="8" width="18" height="4" rx="1" stroke="currentColor" strokeWidth="2" />
              <path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7M7.5 8a2.5 2.5 0 0 1 0-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 0 1 0 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div className="balance-widget">
            <button type="button" className="balance-main" aria-label="Account balance">
              <img src="/coins.png" className="balance-coin" alt="" />
              <span className="balance-amount">{balance.toFixed(2)}</span>
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

        <div className="notifications-wrapper">
          <button
            type="button"
            className={`notifications-button ${isNotificationsOpen ? 'active' : ''}`}
            aria-label="Notifications"
            aria-expanded={isNotificationsOpen}
            aria-controls="notifications-panel"
            onClick={toggleNotifications}
          >
            <img src="https://s3.upgrader.pro/cdn/fa/icons/bell.svg" alt="" />
            {hasUnreadNotifications && <span className="notifications-dot" />}
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

      <div className="weekly-drop-left-panel">
        <img
          src="/weekly-drop-left-panel.png"
          alt=""
          draggable={false}
        />
      </div>

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
                />
              </>
            }
          />
  

 
          <Route
            path="/en/weekly-drop"
            element={
              <div className="rewards-page-wrapper">
                <img
                  className="rewards-reference"
                  src="/rewards-reference.png"
                  alt="Weekly Drop"
                />

                <RewardsOverlay />

                <WeeklyDepositProgress value={weeklyDeposit} />

                <button
                  type="button"
                  className="weekly-drop-topup-button"
                  onClick={() => setIsTopUpOpen(true)}
                >
                  Top up
                </button>

                <WeeklyWheel />
              </div>
            }
          />

          <Route
            path="/en/battles"
            element={<BattlesPage />}
          />

          <Route
            path="/en/profile"
            element={<ProfilePage />}
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