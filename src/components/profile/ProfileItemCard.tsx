import type { CSSProperties } from 'react'
import type { Skin } from '../SkinCatalog'
import { formatPrice } from '../SkinCatalog'

const COIN = '/profile-coin.png'

type Props = {
  skin: Skin
  // «full» — с ценой, износом, названием (Inventory / Items history); «plain» — только картинка (Games history)
  variant?: 'full' | 'plain'
  showPrice?: boolean // для plain: цена в правом верхнем углу (у выпавшего скина в Games history)
}

// Карточка скина профиля (up-item-card из оригинала)
export default function ProfileItemCard({ skin, variant = 'full', showPrice = false }: Props) {
  const style = { '--rarity': skin.rarityColor } as CSSProperties
  const full = variant === 'full'
  return (
    <div className="pf-card" style={style}>
      <div className="pf-card__inner">
        {(full || showPrice) && (
          <div className="pf-card__top">
            <span className="pf-card__price">
              {formatPrice(skin.price)}
              <img src={COIN} alt="" />
            </span>
            {full && <span className="pf-card__wear">{skin.wear}</span>}
          </div>
        )}
        <img className="pf-card__img" src={skin.image} alt={`${skin.name} ${skin.wear}`} draggable={false} />
        {full && (
          <div className="pf-card__bottom">
            <span className="pf-card__weapon">{skin.weapon}</span>
            <span className="pf-card__name">{skin.name}</span>
          </div>
        )}
        <div className="pf-card__glow" />
      </div>
    </div>
  )
}
