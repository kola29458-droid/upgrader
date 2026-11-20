import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import type { OwnedSkin } from '../../hooks/useInventory'
import type { BestDrop, GameRecord, ItemEvent, ProfileSettings } from '../../profileStore'
import { formatPrice } from '../SkinCatalog'
import { BattlesIcon, GamesIcon, HistoryIcon, InventoryIcon } from './icons'
import AnimatedBalance from '../AnimatedBalance'
import ProfileSettingsModal from './ProfileSettingsModal'
import { BattlesHistoryTab, GamesHistoryTab, InventoryTab, ItemsHistoryTab } from './ProfileTabs'
import './profile.css'

const COIN = '/coins.png'
const PROFILE_COIN = '/profile-coin.png'

export type ProfileViewProps = {
  balance: number
  profileId: string
  onProfileIdChange: (id: string) => void
  avatar: string
  onAvatarChange: (file: File) => void
  onTopUp: () => void
  inventory: OwnedSkin[]
  itemEvents: ItemEvent[]
  games: GameRecord[]
  stats: {
    bestDrop: BestDrop | null
    upgrades: number
    battles: number
    withdrawnCount: number
    withdrawnSum: number
  }
  onSell: (uids: string[]) => void
  onWithdraw: (uid: string) => void
  settings: ProfileSettings
  onSaveSettings: (settings: ProfileSettings) => void
}

type TabName = 'inventory' | 'items' | 'games' | 'battles'

// ───────── Верхняя часть ─────────
function UserInfo({
  avatar,
  onAvatarChange,
  profileId,
  onProfileIdChange,
  nickname,
  hidden,
  onOpenSettings,
}: Pick<ProfileViewProps, 'avatar' | 'onAvatarChange' | 'profileId' | 'onProfileIdChange'> & { nickname: string; hidden: boolean; onOpenSettings: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const idInputRef = useRef<HTMLInputElement>(null)
  const [editingId, setEditingId] = useState(false)
  const [idDraft, setIdDraft] = useState(profileId)
  const idIsValid = /^\d{7}$/.test(idDraft)

  useEffect(() => {
    if (editingId) {
      idInputRef.current?.focus()
      idInputRef.current?.select()
    }
  }, [editingId])

  function startEditingId() {
    if (hidden) return
    setIdDraft(profileId)
    setEditingId(true)
  }

  function saveProfileId() {
    if (!idIsValid) return
    onProfileIdChange(idDraft)
    setEditingId(false)
  }

  return (
    <div className="pf-block pf-user">
      <div className="pf-user__top">
        <button
          type="button"
          className="pf-user__avatar-wrap"
          title="Change avatar"
          aria-label="Change avatar"
          onClick={() => fileRef.current?.click()}
        >
          <img className="pf-user__avatar" src={avatar} alt="Avatar" draggable={false} />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) onAvatarChange(file)
            event.target.value = '' // чтобы тот же файл можно было выбрать повторно
          }}
        />
        <div className="pf-user__meta">
          <span className="pf-user__name">{hidden ? '••••••' : nickname}</span>
          <div className="pf-user__row">
            {hidden ? (
              <span className="pf-user__id">ID ••••••</span>
            ) : editingId ? (
              <label className={`pf-user__id pf-user__id-editor${idIsValid ? '' : ' pf-user__id--invalid'}`}>
                <span>ID</span>
                <input
                  ref={idInputRef}
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={7}
                  value={idDraft}
                  aria-label="Seven digit profile ID"
                  aria-invalid={!idIsValid}
                  onChange={(event) => setIdDraft(event.target.value.replace(/\D/g, '').slice(0, 7))}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      saveProfileId()
                    } else if (event.key === 'Escape') {
                      setIdDraft(profileId)
                      setEditingId(false)
                    }
                  }}
                />
              </label>
            ) : (
              <button type="button" className="pf-user__id" onClick={startEditingId} title="Edit profile ID">
                ID {profileId}
              </button>
            )}
            <button type="button" className="pf-icon-btn" aria-label="Settings" title="Settings" onClick={onOpenSettings}>
              <img src={`/icons/settings.svg`} alt="" />
            </button>
            <button type="button" className="pf-icon-btn" aria-label="Log out">
              <img src={`/icons/logout.svg`} alt="" />
            </button>
          </div>
        </div>
      </div>
      <button type="button" className="pf-notify">
        <img src={`/icons/bell.svg`} alt="" />
        <span>Manage notifications</span>
      </button>
    </div>
  )
}

function BalanceCard({ balance, onTopUp, hidden }: Pick<ProfileViewProps, 'balance' | 'onTopUp'> & { hidden: boolean }) {
  return (
    <div className="pf-block pf-balance">
      <div className="pf-balance__head">
        <div className="pf-balance__title-row">
          <span className="pf-balance__title">Balance</span>
          <img className="pf-balance__stack" src={`/icons/balance-gray.svg`} alt="" />
        </div>
        <div className="pf-balance__value">
          {hidden
            ? <span>•••</span>
            : <AnimatedBalance value={balance} compact className="pf-balance__number" />}
          <img src={PROFILE_COIN} alt="" />
        </div>
        <button type="button" className="pf-balance__history">
          <span>Payment History</span>
          <img src={`/icons/arrow-right.svg`} alt="" />
        </button>
      </div>
      <label className="pf-promo">
        <div className="pf-promo__ticket">
          <img src={`/icons/kupon-black.svg`} alt="" />
        </div>
        <input type="text" className="pf-promo__input" placeholder="Enter coupon" />
        <span className="pf-promo__apply">Apply</span>
      </label>
      <button type="button" className="pf-topup" onClick={onTopUp}>
        <img src={`/icons/top-up-mobile.svg`} alt="" />
        Top up balance
      </button>
    </div>
  )
}

/* Ряд шевронов с шагом в полшага покоя: чётные видны всегда, нечётные проявляются на время движения */
const CHEVRON_SLOTS = [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8]

/* Цельный шеврон «^» (единый полигон, размеры задаются через CSS-переменные .pf-bestdrop__chevrons) */
function Chevron({ className, slot }: { className: string; slot: number }) {
  return (
    <svg
      className={className}
      style={{ '--j': slot } as CSSProperties}
      viewBox="0 0 74 48"
      preserveAspectRatio="none"
      focusable="false"
    >
      <polygon points="37,0 74,23 74,48 37,25 0,48 0,23" />
    </svg>
  )
}

function BestDropCard({ bestDrop }: { bestDrop: BestDrop | null }) {
  const style = bestDrop ? ({ '--rarity': bestDrop.skin.rarityColor } as CSSProperties) : undefined
  return (
    <div className="pf-bestdrop" style={style} data-testid="profile-best-drop">
      <span className="pf-bestdrop__label">Best drop</span>
      {bestDrop ? (
        <>
          <div className="pf-bestdrop__chance">
            <img src={`/icons/up-arrow-yellow.svg`} alt="" />
            <span>{bestDrop.chance.toFixed(2)}%</span>
          </div>
          <div className="pf-bestdrop__glow" />
          <div className="pf-bestdrop__chevrons" aria-hidden="true">
            <div className="pf-chev-train">
              {CHEVRON_SLOTS.map((j) => (
                <Chevron key={j} className={`pf-chev pf-chev--a${j + 1} ${j % 2 ? 'pf-chev--odd' : 'pf-chev--even'}`} slot={j} />
              ))}
            </div>
          </div>
          <img className="pf-bestdrop__img" src={bestDrop.skin.image} alt={bestDrop.skin.name} draggable={false} />
          <div className="pf-bestdrop__text">
            <span className="pf-bestdrop__weapon">{bestDrop.skin.weapon}</span>
            <span className="pf-bestdrop__name">{bestDrop.skin.name}</span>
          </div>
          <div className="pf-bestdrop__price">
            <span className="pf-gradient-text">{formatPrice(bestDrop.skin.price)}</span>
            <img src={COIN} alt="" />
          </div>
        </>
      ) : (
        <>
          <img className="pf-bestdrop__empty-img" src="/best-drop-empty.png" alt="" draggable={false} />
          <span className="pf-bestdrop__empty-text">Will be displayed after first game</span>
        </>
      )}
    </div>
  )
}

function SellToast({ onClose }: { onClose: () => void }) {
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setClosing(true), 3200)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!closing) return
    const timer = window.setTimeout(onClose, 240)
    return () => window.clearTimeout(timer)
  }, [closing, onClose])

  return (
    <div className={`pf-toast ${closing ? 'pf-toast--closing' : ''}`} role="status" aria-live="polite">
      <span className="pf-toast__icon" aria-hidden="true" />
      <span className="pf-toast__message">Item sold</span>
      <button type="button" className="pf-toast__close" aria-label="Close notification" onClick={() => setClosing(true)}>
        ×
      </button>
    </div>
  )
}

function StatsBlock({ stats, bestDrop }: { stats: ProfileViewProps['stats']; bestDrop: BestDrop | null }) {
  return (
    <div className="pf-stats">
      <BestDropCard bestDrop={bestDrop} />
      <div className="pf-stats__row">
        <div className="pf-withdrawn">
          <div className="pf-withdrawn__head">
            <span>Withdrawn</span>
            <div className="pf-withdrawn__steam">
              <img src={`/icons/steam-gray.svg`} alt="" />
            </div>
          </div>
          <span className="pf-withdrawn__count">{stats.withdrawnCount} items</span>
          <div className="pf-withdrawn__sum">
            <span className="pf-gradient-text">{formatPrice(stats.withdrawnSum)}</span>
            <img src={PROFILE_COIN} alt="" />
          </div>
        </div>
        <div className="pf-stats__col">
          <div className="pf-stat" data-testid="user-stats-upgrades">
            <span className="pf-stat__label">Upgrades</span>
            <span className="pf-stat__value">
              <span className="pf-gradient-text">{stats.upgrades}</span>
              <img src={`/icons/arrow-logo.svg`} alt="" />
            </span>
          </div>
          <div className="pf-stat" data-testid="user-stats-battles">
            <span className="pf-stat__label">Battles</span>
            <span className="pf-stat__value">
              <span className="pf-gradient-text">{stats.battles}</span>
              <img src="/icons/vs-battles.svg" alt="" />
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ───────── Нижняя часть (вкладки) ─────────
const TABS: { name: TabName; label: string; Icon: typeof InventoryIcon; iconClass: string }[] = [
  { name: 'inventory', label: 'Inventory', Icon: InventoryIcon, iconClass: '' },
  { name: 'items', label: 'Items history', Icon: HistoryIcon, iconClass: '' },
  { name: 'games', label: 'Games history', Icon: GamesIcon, iconClass: '' },
  { name: 'battles', label: 'Battle history', Icon: BattlesIcon, iconClass: 'pf-tab__icon--vs' },
]

export default function ProfileView(props: ProfileViewProps) {
  const { balance, profileId, onProfileIdChange, avatar, onAvatarChange, onTopUp, inventory, itemEvents, games, stats, onSell, onWithdraw, settings, onSaveSettings } = props
  const [tab, setTab] = useState<TabName>('inventory')
  const [availableOnly, setAvailableOnly] = useState(false) // визуальный переключатель: в симуляторе все предметы доступны к продаже
  const [confirmSellAll, setConfirmSellAll] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [soldToastId, setSoldToastId] = useState(0)
  const [sellingAll, setSellingAll] = useState(false)
  const sellAllTimer = useRef<number | null>(null)
  useEffect(() => () => {
    if (sellAllTimer.current !== null) window.clearTimeout(sellAllTimer.current)
  }, [])
  const closeSoldToast = useCallback(() => setSoldToastId(0), [])
  const showSoldToast = () => setSoldToastId((id) => id + 1)

  const inventoryTotal = inventory.reduce((sum, item) => sum + item.price, 0)
  const canSellAll = inventory.length > 0

  return (
    <div className="pf-root">
      <section className="pf-top">
        <UserInfo
          avatar={avatar}
          onAvatarChange={onAvatarChange}
          profileId={profileId}
          onProfileIdChange={onProfileIdChange}
          nickname={settings.nickname}
          hidden={settings.streamerMode}
          onOpenSettings={() => setSettingsOpen(true)}
        />
        <BalanceCard balance={balance} onTopUp={onTopUp} hidden={settings.streamerMode} />
        <StatsBlock stats={stats} bestDrop={stats.bestDrop} />
      </section>

      <section className="pf-table" data-testid="profile-items-table">
        <div className="pf-table__head">
          <div className="pf-tabs">
            {TABS.map(({ name, label, Icon, iconClass }) => (
              <button
                key={name}
                type="button"
                className={`pf-tab ${tab === name ? 'pf-tab--active' : ''}`}
                onClick={() => setTab(name)}
              >
                <Icon className={`pf-tab__icon ${iconClass}`} />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {tab === 'inventory' && (
            <div className="pf-table__tools">
              <div className="pf-toggle-wrap">
                <span className="pf-toggle-label">Available for sale</span>
                <div
                  role="switch"
                  tabIndex={0}
                  aria-checked={availableOnly}
                  className={`pf-toggle ${availableOnly ? 'pf-toggle--on' : ''}`}
                  onClick={() => setAvailableOnly((v) => !v)}
                  onKeyDown={(event) => {
                    if (event.key === ' ' || event.key === 'Enter') setAvailableOnly((v) => !v)
                  }}
                >
                  <div className="pf-toggle__knob" />
                </div>
              </div>
              <button
                type="button"
                className={`pf-sellall ${canSellAll ? '' : 'pf-sellall--disabled'}`}
                disabled={!canSellAll}
                onClick={() => setConfirmSellAll(true)}
              >
                Sell all
              </button>
            </div>
          )}
        </div>

        <div className="pf-table__body">
          {tab === 'inventory' && <InventoryTab items={inventory} onSell={onSell} onSold={showSoldToast} onWithdraw={onWithdraw} />}
          {tab === 'items' && <ItemsHistoryTab events={itemEvents} />}
          {tab === 'games' && <GamesHistoryTab games={games} />}
          {tab === 'battles' && <BattlesHistoryTab />}
        </div>
      </section>

      {settingsOpen && (
        <ProfileSettingsModal settings={settings} onSave={onSaveSettings} onClose={() => setSettingsOpen(false)} />
      )}

      {confirmSellAll && (
        <div className="pf-modal-backdrop" onClick={() => !sellingAll && setConfirmSellAll(false)}>
          <div className="pf-modal" onClick={(event) => event.stopPropagation()}>
            <h3>Sell all items?</h3>
            <p>
              {inventory.length} items for{' '}
              <b>
                {formatPrice(inventoryTotal)} <img src={COIN} alt="" />
              </b>{' '}
              will be added to your virtual balance.
            </p>
            <div className="pf-modal__actions">
              <button type="button" className="pf-modal__btn" disabled={sellingAll} onClick={() => setConfirmSellAll(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="pf-modal__btn pf-modal__btn--yellow"
                disabled={sellingAll}
                onClick={() => {
                  if (sellingAll) return
                  setSellingAll(true)
                  sellAllTimer.current = window.setTimeout(() => {
                    onSell(inventory.map((item) => item.uid))
                    setSellingAll(false)
                    setConfirmSellAll(false)
                    showSoldToast()
                  }, 1050)
                }}
              >
                {sellingAll ? <><span className="pf-item__spinner" aria-hidden="true" /> Selling...</> : 'Sell all'}
              </button>
            </div>
          </div>
        </div>
      )}
      {soldToastId > 0 && <SellToast key={soldToastId} onClose={closeSoldToast} />}
    </div>
  )
}
