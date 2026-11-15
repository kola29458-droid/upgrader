

import { CHANCE_MULTIPLIER, MAX_CHANCE, MIN_CHANCE } from '../upgraderMath'
import type { Skin } from './SkinCatalog'


type Props = {
  mySkin: Skin | null
  availableSkins: Skin[]
  onSelectTargetSkin: (skin: Skin) => void
  onOpenSettings?: () => void
  multipliers?: number[]
  percents?: number[]
}

const DEFAULT_MULTIPLIERS = [2, 4, 8]
const DEFAULT_PERCENTS = [25, 55, 75]

// Цвет рамки у кнопок с процентами: по порядку красная, жёлтая, зелёная
const PERCENT_CLASSES = ['fast-bar-btn--red', 'fast-bar-btn--yellow', 'fast-bar-btn--green']

// Допуск по шансу для кнопок с процентами: 50% выберет скин с шансом от 46% до 58%
const PERCENT_TOLERANCE_DOWN = 4
const PERCENT_TOLERANCE_UP = 8

export default function FastAmountBar({
  mySkin,
  availableSkins,
  onSelectTargetSkin,
  onOpenSettings,
  multipliers = DEFAULT_MULTIPLIERS,
  percents = DEFAULT_PERCENTS,
}: Props) {
  const isDisabled = !mySkin // Снимаем блокировку, чтобы проверить клики

  // Выбор цели по шансу: берём случайный скин из диапазона шансов вокруг нужного
const selectByChance = (targetChance: number) => {
  if (isDisabled || !mySkin || availableSkins.length === 0) return

  // Допуск не больше половины самого шанса, чтобы у маленьких шансов диапазон не разъезжался
  const down = Math.min(PERCENT_TOLERANCE_DOWN, targetChance * 0.5)
  const up = Math.min(PERCENT_TOLERANCE_UP, targetChance)
  const lowChance = Math.max(MIN_CHANCE, targetChance - down)
  const highChance = Math.min(MAX_CHANCE, targetChance + up)

  // Шанс скина = вход * 1.03 / цена * 100, поэтому диапазон шанса даёт диапазон цен
  const base = mySkin.price * CHANCE_MULTIPLIER * 100
  const minPrice = base / highChance
  const maxPrice = base / lowChance

  const inRange = availableSkins.filter(
    (skin) => skin.price >= minPrice && skin.price <= maxPrice
  )

  // Выбираем случайный скин из всего допустимого диапазона
  if (inRange.length > 0) {
    onSelectTargetSkin(inRange[Math.floor(Math.random() * inRange.length)])
    return
  }

  // В диапазоне пусто (бывает при очень малых суммах): берём ближайший по цене
  const targetPrice = base / targetChance

  const minDiff = availableSkins.reduce((min, skin) => {
    const diff = Math.abs(skin.price - targetPrice)
    return diff < min ? diff : min
  }, Infinity)

  const matchingSkins = availableSkins.filter(
    (skin) => Math.abs(Math.abs(skin.price - targetPrice) - minDiff) < 0.01
  )

  const randomIndex = Math.floor(Math.random() * matchingSkins.length)
  const randomSkin = matchingSkins[randomIndex] || availableSkins[0]

  if (randomSkin) {
    onSelectTargetSkin(randomSkin)
  }
}

// x3 даёт шанс примерно 100 * 1.03 / 3 = 34%
const handleMultiplierClick = (mult: number) => selectByChance((CHANCE_MULTIPLIER * 100) / mult)

const handlePercentClick = (targetPercent: number) => selectByChance(targetPercent)

  return (
    <>
      <style>{`
        .fast-bar-container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          width: 100%;
          max-width: 500px;
          user-select: none;
        }

        .fast-bar-btn {
          position: relative;
          flex: 1;
          height: 39px;
          background: #17181c;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          color: #ffffff;
          font-weight: 500;
          font-size: 16px;
          font-family: "Exo 2", sans-serif;
          cursor: pointer;
          transform: skewX(-6deg);
          transition:
            color 150ms cubic-bezier(0.4, 0, 0.2, 1),
            background-color 150ms cubic-bezier(0.4, 0, 0.2, 1),
            border-color 150ms cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          outline: none;
        }

        .fast-bar-btn span,
        .fast-bar-icon {
          transform: skewX(6deg);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* При наведении все кнопки подсвечиваются одинаково жёлтым */
        .fast-bar-btn:hover:not(:disabled) {
          border-color: rgba(255, 255, 255, 0.2);
          background-color: #fbd50633;
        }

        .fast-bar-btn:disabled {
          pointer-events: none;
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Кнопки 25% / 55% / 75%: рамка-градиент, гаснет к правому краю */
         .fast-bar-btn--red { --accent: #e8532b; }
.fast-bar-btn--yellow { --accent: #e8d414; }
.fast-bar-btn--green { --accent: #2fdc12; }

.fast-bar-btn--red::before,
.fast-bar-btn--yellow::before,
.fast-bar-btn--green::before {
  content: '';
  position: absolute;
  inset: -1px;
  padding: 1px;
  border-radius: inherit;
  pointer-events: none;
  background: linear-gradient(
    105deg,
    var(--accent) 0%,
    color-mix(in srgb, var(--accent) 55%, transparent) 45%,
    transparent 100%
  );
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  transition: opacity 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.fast-bar-btn--red:hover:not(:disabled)::before,
.fast-bar-btn--yellow:hover:not(:disabled)::before,
.fast-bar-btn--green:hover:not(:disabled)::before {
  opacity: 0;
}

        
        /* Шестерёнка: без рамки, плавный тёмный градиент */
        .fast-bar-btn--settings {
          border: 0;
          background: linear-gradient(270deg, #17181c 0%, rgba(23, 24, 28, 0) 100%);
          filter: drop-shadow(0 0 4px rgba(0, 0, 0, 0.2));
        }

        .fast-bar-icon {
          width: 18px;
          height: 18px;
          color: #a7a7a7;
        }
      `}</style>

      <div className="fast-bar-container">
        {multipliers.map((mult, i) => (
          <button
            key={`mult-${i}`}
            type="button"
            className="fast-bar-btn"
            disabled={isDisabled}
            onClick={() => handleMultiplierClick(mult)}
          >
            <span>x{mult}</span>
          </button>
        ))}

        {percents.map((percent, i) => (
          <button
            key={`percent-${i}`}
            type="button"
            className={`fast-bar-btn ${PERCENT_CLASSES[i] ?? ''}`}
            disabled={isDisabled}
            onClick={() => handlePercentClick(percent)}
          >
            <span>{percent}%</span>
          </button>
        ))}

        <button
          type="button"
          className="fast-bar-btn fast-bar-btn--settings"
          onClick={onOpenSettings}
          data-tooltip="Settings"
        >
          <svg viewBox="0 0 24 24" className="fast-bar-icon">
            <path
              fill="currentColor"
              d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"
            />
          </svg>
        </button>
      </div>
    </>
  )
}
