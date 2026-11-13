import type { CSSProperties } from 'react'
import { formatPrice } from './SkinCatalog'
import type { Skin } from './SkinCatalog'

const WEAR_NAMES: Record<string, string> = {
  FN: 'Factory New',
  MW: 'Minimal Wear',
  FT: 'Field-Tested',
  WW: 'Well-Worn',
  BS: 'Battle-Scarred',
}

type Props = {
  skin: Skin
  onClear: () => void
}

export default function SelectedSkinPanel({ skin, onClear }: Props) {
  const wearName = WEAR_NAMES[skin.wear] ?? ''
  const title = wearName ? `${skin.name} ${wearName}` : skin.name

  return (
    <div
      key={skin.id}
      className="selected-skin-panel"
      style={{ '--rarity': skin.rarityColor } as CSSProperties}
    >
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

      <span className="selected-skin-panel__weapon">{skin.weapon}</span>
      <span className="selected-skin-panel__name">{title}</span>

      <img
        className="selected-skin-panel__image"
        src={skin.image}
        alt={`${skin.weapon} | ${skin.name}`}
        draggable={false}
      />

      <span className="selected-skin-panel__price">
        {formatPrice(skin.price)}
        <img src="/coins.png" alt="" draggable={false} />
      </span>
    </div>
  )
}