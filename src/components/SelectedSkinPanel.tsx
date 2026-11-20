import type { CSSProperties } from 'react'
import { formatPrice } from './SkinCatalog'
import type { Skin } from './SkinCatalog'
import WinEffect from './WinEffect'

const WEAR_NAMES: Record<string, string> = {
  FN: 'Factory New',
  MW: 'Minimal Wear',
  FT: 'Field-Tested',
  WW: 'Well-Worn',
  BS: 'Battle-Scarred',
}

type Props = {
  skin: Skin
  onClear?: () => void // нет — крестика нет (карточка компенсации)
  won?: boolean   // после выигрыша: оружие зеленеет и играет анимация победы
  winId?: number  // id крутки: новая победа — анимация запускается заново
  side?: 'left'   // карточка слева (компенсация после проигрыша), по умолчанию справа (цель)
  label?: string  // подпись внизу карточки, например Compensation
  anim?: 'in' | 'shrunk' | 'out' // выезд справа / уезд вниз (карточка компенсации)
}

export default function SelectedSkinPanel({ skin, onClear, won = false, winId, side, label, anim }: Props) {
  const wearName = WEAR_NAMES[skin.wear] ?? ''
  const title = wearName ? `${skin.name} ${wearName}` : skin.name

  return (
    <div
      key={skin.id}
      className={`selected-skin-panel${side === 'left' ? ' selected-skin-panel--left' : ''}${label ? ' selected-skin-panel--labeled' : ''}${anim ? ` selected-skin-panel--${anim === 'shrunk' ? 'shrunk' : `slide-${anim}`}` : ''}`}
      style={{ '--rarity': skin.rarityColor } as CSSProperties}
    >
      {won && <WinEffect key={winId} />}

      {onClear && (
      <button
        type="button"
        className="selected-skin-panel__close"
        onClick={onClear}
        aria-label="Remove selected skin"
      >
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </button>
      )}

      <span className="selected-skin-panel__weapon">{skin.weapon}</span>
      <span className="selected-skin-panel__name">{title}</span>

      <img
        className={`selected-skin-panel__image${won ? ' selected-skin-panel__image--won' : ''}`}
        src={skin.image}
        alt={`${skin.weapon} | ${skin.name}`}
        draggable={false}
      />

      <span className={`selected-skin-panel__price${won ? ' selected-skin-panel__price--won' : ''}`}>
        {formatPrice(skin.price)}
        <img src="/coins.png" alt="" draggable={false} />
      </span>

      {label && <span className="selected-skin-panel__label">{label}</span>}
    </div>
  )
}