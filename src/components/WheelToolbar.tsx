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
        title="Info"
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
        className="wt-btn wt-btn--gray"
        onClick={onOpenSettings}
        title="Settings"
        aria-label="Settings"
        data-testid="game-settings-button"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path fill="currentColor" d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
        </svg>
      </button>

      <div className="wt-sound">
        <button
          type="button"
          className={`wt-btn ${sound ? 'wt-btn--yellow' : 'wt-btn--gray'}`}
          onClick={onToggleSound}
          title={sound ? 'Sound on' : 'Sound off'}
          aria-label="Sound"
          aria-pressed={sound}
          data-testid="game-sound-toggle"
        >
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path fill="currentColor" d="M1.4 5.6h2.7L8 2.2v11.6l-3.9-3.4H1.4z" />
            {sound ? (
              <>
                <path d="M10.2 5.7a3.5 3.5 0 0 1 0 4.6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M12.2 3.8a6.2 6.2 0 0 1 0 8.4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </>
            ) : (
              <path d="M10.6 6l3.4 4M14 6l-3.4 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            )}
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
        title={fast ? 'Fast spin' : 'Normal spin'}
        aria-label="Fast spin"
        aria-pressed={fast}
        data-testid="game-fast-animation-toggle"
      >
        <svg viewBox="0 0 10 16" aria-hidden="true">
          <path fill="currentColor" d="M6 0 0 9h4l-1 7 7-10H6l2-6z" />
        </svg>
      </button>
    </div>
  )
}
