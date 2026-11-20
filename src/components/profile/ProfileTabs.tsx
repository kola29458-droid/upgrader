import { useEffect, useRef, useState } from 'react'
import type { OwnedSkin } from '../../hooks/useInventory'
import { ITEM_EVENT_LABEL } from '../../profileStore'
import type { GameRecord, ItemEvent } from '../../profileStore'
import ProfileItemCard from './ProfileItemCard'

const COIN = '/coins.png'
const ITEMS_PAGE = 24 // предметов за раз (Load more подгружает следующие)
const GAMES_PAGE = 9

function SellIcon({ disabled, loading }: { disabled?: boolean; loading?: boolean }) {
  if (loading) {
    return (
      <svg className="pf-item__spinner" viewBox="0 0 20 20" aria-hidden="true">
        {Array.from({ length: 8 }, (_, index) => (
          <line
            key={index}
            x1="10"
            y1="1.5"
            x2="10"
            y2="4.5"
            transform={`rotate(${index * 45} 10 10)`}
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="2"
            opacity={0.25 + index * 0.09}
          />
        ))}
      </svg>
    )
  }
  // монеты (кнопка «продать»)
  const c = disabled ? '#494949' : '#FBD506'
  return (
    <svg width="20" height="20" viewBox="0 0 16 16" fill={c} xmlns="http://www.w3.org/2000/svg">
      <path d="M5.33301 5.33279C8.38534 5.33279 10.6661 4.12616 10.6661 3.04723C10.6661 1.96841 8.38529 0.761719 5.33301 0.761719C2.28074 0.761719 0 1.96841 0 3.04723C0 4.12616 2.28069 5.33279 5.33301 5.33279Z" />
      <path d="M5.33301 14.4754C5.77852 14.4754 6.20732 14.4495 6.61519 14.4023C6.27138 13.9605 5.98705 13.4701 5.77405 12.9436C5.6277 12.9485 5.48084 12.9519 5.33296 12.9519C3.58887 12.9519 1.93718 12.6063 0.682285 11.9788C0.435198 11.8553 0.20782 11.7225 0 11.582V12.1899C0 13.2687 2.28069 14.4754 5.33301 14.4754Z" />
      <path d="M5.33306 11.4276C5.34871 11.4276 5.3641 11.4273 5.3797 11.4273C5.34845 11.1775 5.33215 10.9232 5.33215 10.6651C5.33215 10.4071 5.3484 10.1529 5.3797 9.90342C5.3641 9.90342 5.34866 9.90398 5.33306 9.90398C3.58897 9.90398 1.93733 9.5584 0.682387 8.93092C0.435248 8.80738 0.20782 8.67464 0 8.53418V9.14199C5.07993e-05 10.2209 2.28074 11.4276 5.33306 11.4276Z" />
      <path d="M5.33306 8.38063C5.48424 8.38063 5.63339 8.37758 5.78065 8.37179C6.01718 7.79151 6.34041 7.25553 6.73451 6.7802C6.27823 6.83049 5.80931 6.85716 5.33306 6.85716C3.58897 6.85716 1.93733 6.51157 0.682387 5.8841C0.435248 5.7605 0.20782 5.62782 0 5.4873V6.09517C5.07993e-05 7.17404 2.28074 8.38063 5.33306 8.38063Z" />
      <path d="M7.61881 8.1401C7.28912 8.63575 7.05357 9.19906 6.93769 9.80438C6.8842 10.0834 6.85596 10.3713 6.85596 10.6657C6.85596 10.887 6.87211 11.1046 6.90264 11.3176C6.97767 11.8409 7.1416 12.3357 7.37863 12.7865C7.62734 13.2594 7.95637 13.6839 8.34768 14.0412C9.16087 14.784 10.2424 15.2376 11.4279 15.2376C13.9489 15.2376 15.9998 13.1867 15.9998 10.6657C15.9998 8.14467 13.9489 6.09375 11.4279 6.09375C11.1673 6.09375 10.9119 6.116 10.6631 6.15806C9.39572 6.37238 8.30414 7.10994 7.61881 8.1401Z" />
    </svg>
  )
}

function SteamIcon({ disabled }: { disabled?: boolean }) {
  // Steam (кнопка «вывести»)
  const c = disabled ? '#494949' : '#FBD506'
  return (
    <svg width="20" height="20" viewBox="0 0 16 16" fill={c} xmlns="http://www.w3.org/2000/svg">
      <path d="M8 0.1875C3.68528 0.1875 0.1875 3.68528 0.1875 8C0.1875 12.3147 3.68528 15.8125 8 15.8125C12.3147 15.8125 15.8125 12.3147 15.8125 8C15.8125 3.68528 12.3147 0.1875 8 0.1875ZM10.6654 8.84797L8.02397 10.757C7.92812 11.7886 7.04584 12.5959 5.983 12.5959C5.5161 12.5962 5.063 12.4376 4.69822 12.1462C4.33343 11.8548 4.07868 11.4479 3.97587 10.9924L2.58612 10.4402V7.87244L4.93437 8.81153C5.30084 8.59278 5.7125 8.49475 6.19166 8.53681L7.90559 6.10362C7.91687 4.61228 9.14878 3.40409 10.6597 3.40409C12.1792 3.40409 13.4111 4.62631 13.4139 6.12325C13.4139 7.63125 12.1792 8.84797 10.6654 8.84797Z" />
      <path d="M5.98267 9.06055C5.87264 9.06021 5.76293 9.07243 5.65567 9.09699L6.28433 9.34927C6.43022 9.40603 6.56339 9.49118 6.67612 9.5998C6.78885 9.70841 6.8789 9.83832 6.94105 9.982C7.0032 10.1257 7.0362 10.2803 7.03815 10.4368C7.04011 10.5933 7.01097 10.7487 6.95242 10.8939C6.89309 11.04 6.80552 11.1729 6.69474 11.2851C6.58395 11.3973 6.45212 11.4866 6.30679 11.5478C6.16146 11.609 6.00549 11.6409 5.84781 11.6417C5.69012 11.6426 5.53382 11.6123 5.38786 11.5526C5.14261 11.4573 4.89173 11.3536 4.64648 11.2611C4.76949 11.4989 4.95363 11.6998 5.17996 11.8429C5.40629 11.986 5.66665 12.0663 5.93427 12.0754C6.2019 12.0846 6.46714 12.0223 6.70272 11.895C6.93831 11.7677 7.13574 11.5799 7.27473 11.351C7.41371 11.1222 7.48924 10.8604 7.49353 10.5926C7.49783 10.3249 7.43075 10.0608 7.29918 9.82758C7.16762 9.59435 6.97631 9.40036 6.74494 9.26555C6.51356 9.13075 6.25045 9.05999 5.98267 9.06055Z" />
      <path d="M10.6627 4.30078C9.63945 4.30078 8.81348 5.11934 8.81348 6.12578C8.81348 7.13775 9.64226 7.95078 10.6627 7.95078C11.6748 7.95359 12.5065 7.13784 12.5035 6.12578C12.5036 5.11934 11.6748 4.30078 10.6627 4.30078ZM10.6585 7.22169C10.4422 7.21937 10.2315 7.15313 10.0528 7.03129C9.87409 6.90946 9.73543 6.73747 9.65427 6.537C9.5731 6.33652 9.55307 6.11652 9.59668 5.90468C9.64029 5.69284 9.7456 5.49864 9.89935 5.34652C10.0531 5.19441 10.2484 5.09118 10.4607 5.04984C10.673 5.00849 10.8928 5.03088 11.0924 5.11418C11.292 5.19748 11.4625 5.33797 11.5824 5.51797C11.7023 5.69796 11.7663 5.90941 11.7663 6.12569C11.7658 6.27046 11.7367 6.4137 11.6807 6.54721C11.6247 6.68071 11.5429 6.80185 11.44 6.90367C11.337 7.00549 11.215 7.086 11.0809 7.14057C10.9469 7.19514 10.8033 7.22271 10.6585 7.22169H10.6585Z" />
    </svg>
  )
}

function EmptyState({ text }: { text: string }) {
  return <div className="pf-empty">{text}</div>
}

function LoadMore({ onClick }: { onClick: () => void }) {
  return (
    <div className="pf-loadmore">
      <button type="button" className="pf-loadmore__btn" onClick={onClick}>
        <span className="pf-gradient-text">Load more</span>
      </button>
    </div>
  )
}

// ───────── Inventory ─────────
export function InventoryTab({
  items,
  onSell,
  onSold,
  onWithdraw,
}: {
  items: OwnedSkin[]
  onSell: (uids: string[]) => void
  onSold?: () => void
  onWithdraw: (uid: string) => void
}) {
  const [visible, setVisible] = useState(ITEMS_PAGE)
  const [sellingIds, setSellingIds] = useState<Set<string>>(() => new Set())
  const sellTimers = useRef(new Map<string, number>())
  useEffect(() => () => sellTimers.current.forEach((timer) => window.clearTimeout(timer)), [])

  const sellItem = (uid: string) => {
    if (sellTimers.current.has(uid)) return
    setSellingIds((current) => new Set(current).add(uid))
    const timer = window.setTimeout(() => {
      sellTimers.current.delete(uid)
      setSellingIds((current) => {
        const next = new Set(current)
        next.delete(uid)
        return next
      })
      onSell([uid])
      onSold?.()
    }, 1050)
    sellTimers.current.set(uid, timer)
  }

  const list = [...items].reverse() // сверху самые свежие
  if (list.length === 0) return <EmptyState text="You don't have any items yet" />
  return (
    <>
      <div className="pf-items-grid">
        {list.slice(0, visible).map((item) => (
          <div className={`pf-item ${sellingIds.has(item.uid) ? 'pf-item--selling' : ''}`} key={item.uid}>
            <div className="pf-item__card">
              <ProfileItemCard skin={item} />
            </div>
            <div className="pf-item__actions">
              <button
                type="button"
                className="pf-item__btn pf-item__btn--left"
                title="Sell"
                aria-label="Sell"
                disabled={sellingIds.has(item.uid)}
                onClick={() => sellItem(item.uid)}
              >
                <SellIcon loading={sellingIds.has(item.uid)} />
              </button>
              <button
                type="button"
                className="pf-item__btn pf-item__btn--right"
                title="Withdraw (simulation)"
                aria-label="Withdraw"
                disabled={sellingIds.has(item.uid)}
                onClick={() => onWithdraw(item.uid)}
              >
                <SteamIcon />
              </button>
            </div>
          </div>
        ))}
      </div>
      {list.length > visible && <LoadMore onClick={() => setVisible((v) => v + ITEMS_PAGE)} />}
    </>
  )
}

// ───────── Items history ─────────
export function ItemsHistoryTab({ events }: { events: ItemEvent[] }) {
  const [visible, setVisible] = useState(ITEMS_PAGE)
  if (events.length === 0) return <EmptyState text="You don't have any item operations yet" />
  return (
    <>
      <div className="pf-items-grid">
        {events.slice(0, visible).map((event) => (
          <div className="pf-item" key={event.id}>
            <div className="pf-item__card">
              <ProfileItemCard skin={event.skin} />
            </div>
            <div className="pf-item__actions pf-item__actions--history">
              <span className="pf-item__label">{ITEM_EVENT_LABEL[event.kind]}</span>
              <div className="pf-item__btn pf-item__btn--left pf-item__btn--disabled">
                <SellIcon disabled />
              </div>
              <div className="pf-item__btn pf-item__btn--right pf-item__btn--disabled">
                <SteamIcon disabled />
              </div>
            </div>
          </div>
        ))}
      </div>
      {events.length > visible && <LoadMore onClick={() => setVisible((v) => v + ITEMS_PAGE)} />}
    </>
  )
}

// ───────── Games history ─────────
function Chevrons() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" className="pf-game__chev">
      <path fillRule="evenodd" clipRule="evenodd" d="M14.5864 9.30828L7.99927 4.48622L1.41211 9.30828V4.82206L7.99927 0L14.5864 4.82206V9.30828Z" fill="white" fillOpacity="0.5" />
      <path d="M13.3327 11.1325V14.6668L7.99935 10.8679L2.66602 14.6668V11.1325L7.99935 7.3335L13.3327 11.1325Z" fill="white" fillOpacity="0.2" />
    </svg>
  )
}

function GameRow({ game }: { game: GameRecord }) {
  // Слева — то, что поставили: самый дорогой скин (если ставили только монеты — карточка с монетой)
  const topBet = [...game.betSkins].sort((a, b) => b.price - a.price)[0]
  const extra = game.betSkins.length - 1
  const resultLabel = game.compensation ? 'Compensation' : game.win ? 'Win' : 'Lose'
  const resultClass = game.compensation ? 'comp' : game.win ? 'win' : 'lose'
  return (
    <div className="pf-game">
      <div className="pf-game__gameid">
        <div className="pf-game__gameid-box">
          <span>Game ID</span>
          <b>{game.id}</b>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="7" viewBox="0 0 24 7" fill="none" className="pf-game__gameid-tail">
          <path d="M24 0L21.6568 0C20.596 0 19.5785 0.421369 18.8284 1.17152L16 3.99993L14.1213 5.87858C12.9497 7.05016 11.0503 7.05016 9.87868 5.87858L8.00002 3.99993L5.17162 1.17152C4.42147 0.421371 3.40405 0 2.34317 0L0 0L24 0Z" fill="white" fillOpacity="0.1" />
        </svg>
      </div>

      <div className="pf-game__sector">
        <div className="pf-game__cardwrap">
          {topBet ? (
            <ProfileItemCard skin={topBet} variant="plain" />
          ) : (
            <div className="pf-card pf-card--coins">
              <div className="pf-card__inner">
                <img className="pf-card__coin" src={COIN} alt="" />
              </div>
            </div>
          )}
          {extra > 0 && <span className="pf-game__extra">+{extra}</span>}
        </div>
        <div className="pf-game__info">
          <span className="pf-game__info-label">Your bet</span>
          <span className="pf-game__info-value">
            {game.betTotal.toFixed(2)}
            <img src={COIN} alt="" />
          </span>
        </div>
      </div>

      <Chevrons />

      <div className="pf-game__sector">
        <div className="pf-game__cardwrap pf-game__cardwrap--target">
          <ProfileItemCard skin={game.target} variant="plain" showPrice />
          <div className={`pf-game__badge pf-game__badge--${resultClass}`}>{resultLabel}</div>
          {game.compensation && (
            <div className="pf-game__comp">
              <ProfileItemCard skin={game.compensation} variant="plain" />
            </div>
          )}
          <div className="pf-shield" aria-hidden>
            <img src="/icons/shield-fill.svg" alt="" />
          </div>
          <div className="pf-roll">
            <div className="pf-roll__box">
              <span className="pf-roll__label">Roll ID:&nbsp;</span>
              <span>{game.id}</span>
              <button type="button" className="pf-roll__check">
                Check
              </button>
            </div>
          </div>
        </div>
        <div className="pf-game__info">
          <span className="pf-game__info-label">Chance</span>
          <span className="pf-game__info-chance">{game.chance.toFixed(2)}%</span>
        </div>
      </div>
    </div>
  )
}

export function GamesHistoryTab({ games }: { games: GameRecord[] }) {
  const [visible, setVisible] = useState(GAMES_PAGE)
  if (games.length === 0) return <EmptyState text="You don't have any games yet" />
  return (
    <>
      <div className="pf-games-grid">
        {games.slice(0, visible).map((game) => (
          <GameRow key={game.id} game={game} />
        ))}
      </div>
      {games.length > visible && <LoadMore onClick={() => setVisible((v) => v + GAMES_PAGE)} />}
    </>
  )
}

// ───────── Battle history ─────────
export function BattlesHistoryTab() {
  // Батлы в симуляторе пока недоступны (страница Battles на заглушке), поэтому история пустая
  return <EmptyState text="You don't have any battles yet" />
}
