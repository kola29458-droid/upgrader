import { useEffect, useRef, useState } from 'react'
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
import WheelToolbar from './components/WheelToolbar'
import SettingsModal from './components/SettingsModal'
import { loadQuickSettings, saveQuickSettings } from './quickSettings'
import type { QuickSettings } from './quickSettings'
import { useSkins } from './hooks/useSkins'
import { calcChance, isChanceTooLow, MAX_CHANCE } from './upgraderMath'
import { SPIN_PROFILES } from './spinProfiles'
import { playSound, preloadSounds, setSoundSettings, unlockAudio } from './sound'

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

  // Крутка: idle (ждём) -> spinning (стрелка крутится) -> result (показываем итог 3 секунды) -> idle
  const [phase, setPhase] = useState<'idle' | 'spinning' | 'result'>('idle')
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

  const busy = phase !== 'idle'

  // Настройки звука (динамик и громкость над колесом) и разблокировка звука первым действием пользователя
  useEffect(() => {
    setSoundSettings(quickSettings.sound, quickSettings.volume)
  }, [quickSettings.sound, quickSettings.volume])

  useEffect(() => {
    preloadSounds()
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
      if (pending.current?.win) onWin(pending.current.target)
    },
    [], // eslint-disable-line react-hooks/exhaustive-deps
  )

  // Нажатие на Improve
  const handleImprove = () => {
    if (busy || !selectedSkin || !wheelActive || chance > MAX_CHANCE) return

    unlockAudio() // браузер разрешает звук только после клика
    playSound('click')

    const target = selectedSkin
    const spinChance = chance
    const stop = Math.random() * 360 // где остановится стрелка: градусы от низа колеса по часовой
    const win = Math.min(stop, 360 - stop) <= spinChance * 1.8 // попала в цветную дугу
    const fast = quickSettings.fastScroll
    const profile = SPIN_PROFILES[fast ? 'fast' : 'normal'] // скорость и тайминги сняты с видео-образца
    const delay = fast ? 440 : 1000       // пауза после нажатия Improve, потом стрелка начинает крутиться (в видео: клик -> удар через 0.21 с -> стрелка ещё через 0.23 с)
    const duration = profile.motionMs     // сколько стрелка реально движется

    // Скины и ставка списываются сразу
    onSpend(mineSelected.map((skin) => skin.uid), bet)
    pending.current = { win, target }
    setWonUid(null)
    setSpin({ id: Date.now(), angle: profile.turns * 360 + stop, duration, delay, fast, win, chance: spinChance })
    setPhase('spinning')

    // Показываем итог чуть позже остановки стрелки, сбрасываем выбор слева, выдаём выигрыш
    const finish = window.setTimeout(() => {
      pending.current = null
      setPhase('result')
      setClearKey((key) => key + 1)
      if (win) {
        playSound('win')
        setWonUid(onWin(target))
      }
    }, delay + profile.resultMs)

    // Через holdMs кнопка и колесо возвращаются в обычный вид.
    // Стрелка остаётся там, где остановилась (spin не сбрасываем): вниз она вернётся при новой ставке
    const reset = window.setTimeout(() => {
      setPhase('idle')
    }, delay + profile.resultMs + profile.holdMs)

    timers.current = [finish, reset]
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

  const virtualMySkin = inputTotal > 0 ? {
  id: 'my-bet',
  name: 'Bet',
  price: inputTotal,
  weapon: 'Bet',
  wear: '',
  image: '',
  rarityColor: '#ffffff',
} : null

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
  const [unreadNotifications, setUnreadNotifications] = useState(0)

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

      setUnreadNotifications((current) => Math.min(current + 1, 99))
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
      setUnreadNotifications(0)
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
            {unreadNotifications > 0 && (
  <span className="notifications-badge">
    {unreadNotifications > 99 ? '99+' : unreadNotifications}
  </span>
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