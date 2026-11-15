import '../wheelToolbar.css'

type Props = {
  sound: boolean                        // звук включён (динамик жёлтый)
  volume: number                        // громкость 0..1
  fast: boolean                         // быстрая прокрутка (молния жёлтая)
  onToggleSound: () => void
  onVolume: (value: number) => void
  onToggleFast: () => void
  onOpenSettings: () => void
  onInfo?: () => void
}

// Ряд иконок над левой карточкой: инфо, настройки, звук (с громкостью при наведении), скорость прокрутки
export default function WheelToolbar({
  sound,
  volume,
  fast,
  onToggleSound,
  onVolume,
  onToggleFast,
  onOpenSettings,
  onInfo,
}: Props) {
  return (
    <div className="wheel-toolbar">
      <button
        type="button"
        className="wt-btn wt-btn--gray"
        onClick={onInfo}
        data-tooltip="How does upgrade work"
        aria-label="Game info"
        data-testid="game-info-button"
      >
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path
            fill="currentColor"
            fillRule="evenodd"
            d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0Zm0 3.5a1.15 1.15 0 1 1 0 2.3 1.15 1.15 0 0 1 0-2.3ZM7.1 7.2h1.8v5.3H7.1V7.2Z"
          />
        </svg>
      </button>

      <button
        type="button"
        className="wt-btn wt-btn--gray wt-gear"
        onClick={onOpenSettings}
        data-tooltip="Settings"
        aria-label="Settings"
        data-testid="game-settings-button"
      >
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path fill="currentColor" fillRule="evenodd" d="M5.81 2.31L6.34 0.17A8 8 0 0 1 9.66 0.17L10.19 2.31A6.1 6.1 0 0 1 11.84 3.26L13.95 2.65A8 8 0 0 1 15.61 5.53L14.02 7.05A6.1 6.1 0 0 1 14.02 8.95L15.61 10.47A8 8 0 0 1 13.95 13.35L11.84 12.74A6.1 6.1 0 0 1 10.19 13.69L9.66 15.83A8 8 0 0 1 6.34 15.83L5.81 13.69A6.1 6.1 0 0 1 4.16 12.74L2.05 13.35A8 8 0 0 1 0.39 10.47L1.98 8.95A6.1 6.1 0 0 1 1.98 7.05L0.39 5.53A8 8 0 0 1 2.05 2.65L4.16 3.26A6.1 6.1 0 0 1 5.81 2.31ZM8 5.8a2.2 2.2 0 1 0 0 4.4a2.2 2.2 0 1 0 0 -4.4Z" />
        </svg>
      </button>

      <div className="wt-sound">
        <button
          type="button"
          className={`wt-btn wt-speaker ${sound ? 'wt-btn--yellow' : 'wt-btn--gray'}`}
          onClick={onToggleSound}
          data-tooltip={sound ? 'Disable sound' : 'Enable sound'}
          aria-label="Sound"
          aria-pressed={sound}
          data-testid="game-sound-toggle"
        >
          <svg viewBox="0 0 16 16" aria-hidden="true">
            {/* Форма подогнана по пикселям под оригинал. Выключенный звук в оригинале — тот же динамик, только серый (цвет задаёт класс кнопки) */}
            <path fill="currentColor" d="M0 5.7H3.14L8.02 1.9V14.1L3.14 10.3H0Z" />
            <path d="M9.96 4.97Q12.55 8 9.96 11.03" fill="none" stroke="currentColor" strokeWidth="1.49" strokeLinecap="round" />
            <path d="M12.04 2.52Q17.04 8 12.04 13.48" fill="none" stroke="currentColor" strokeWidth="1.46" strokeLinecap="round" />
          </svg>
        </button>

        <div className="wt-volume-wrap">
          <input
            className="wt-volume"
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            style={{ backgroundSize: `${volume * 100}% 100%` }}
            onChange={(event) => onVolume(Number(event.target.value))}
            aria-label="Volume"
            data-testid="volume-range"
          />
        </div>
      </div>

      <button
        type="button"
        className={`wt-btn wt-fast ${fast ? 'wt-btn--yellow' : 'wt-btn--gray'}`}
        onClick={onToggleFast}
        data-tooltip={fast ? 'Disable fast animation' : 'Enable fast animation'}
        aria-label="Fast spin"
        aria-pressed={fast}
        data-testid="game-fast-animation-toggle"
      >
        <svg viewBox="0 0 10 16" aria-hidden="true">
          <path fill="currentColor" d="M4.4 0H9.4L7 5.2H9.8L0.9 16L2.9 9H0.3Z" />
        </svg>
      </button>
    </div>
  )
}
