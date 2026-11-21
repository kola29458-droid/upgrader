import { useAdminPanel } from '../hooks/useAdminPanel'

export default function AdminPanel() {
  const { isOpen, forceWinOnce, forceLoseOnce, togglePanel, consumeForceWin, consumeForceLose } = useAdminPanel()

  if (!isOpen) return null

  const nextMode = forceWinOnce ? 'WIN' : forceLoseOnce ? 'LOSE' : 'NORMAL'
  const modeColor = forceWinOnce ? '#2ecc71' : forceLoseOnce ? '#e74c3c' : '#fbd506'

  const handleForceWin = () => {
    consumeForceWin()
    consumeForceLose()
  }

  const handleForceLose = () => {
    consumeForceLose()
    consumeForceWin()
  }

  const handleNormal = () => {
    consumeForceWin()
    consumeForceLose()
  }

  return (
    <div className="admin-panel-root" onClick={togglePanel}>
      <div className="admin-panel" onClick={e => e.stopPropagation()}>
        <div className="admin-panel__header">
          <span className="admin-panel__title">ADMIN PANEL</span>
          <button className="admin-panel__close" onClick={togglePanel} aria-label="Close">✕</button>
        </div>

        <div className="admin-panel__body">
          <div className="admin-panel__mode">
            <span className="admin-panel__mode-label">Next upgrade:</span>
            <span className="admin-panel__mode-value" style={{ color: modeColor }}>
              {nextMode}
            </span>
          </div>

          <div className="admin-panel__hints">
            <div className="admin-panel__hint">
              <kbd>Ctrl</kbd>+<kbd>G</kbd> — toggle panel
            </div>
            <div className="admin-panel__hint">
              <kbd>Ctrl</kbd>+<kbd>X</kbd> — force <span style={{ color: '#2ecc71' }}>WIN</span> once
            </div>
            <div className="admin-panel__hint">
              <kbd>Ctrl</kbd>+<kbd>Z</kbd> — force <span style={{ color: '#e74c3c' }}>LOSE</span> once
            </div>
            <div className="admin-panel__hint">
              <kbd>Esc</kbd> — close
            </div>
          </div>

          <div className="admin-panel__actions">
            <button className="admin-panel__btn admin-panel__btn--win" onClick={handleForceWin}>
              Force WIN
            </button>
            <button className="admin-panel__btn admin-panel__btn--lose" onClick={handleForceLose}>
              Force LOSE
            </button>
            <button className="admin-panel__btn admin-panel__btn--normal" onClick={handleNormal}>
              Normal
            </button>
          </div>
        </div>

        <div className="admin-panel__footer">
          <span>UPGRADER Simulator — Dev Tools</span>
        </div>
      </div>
    </div>
  )
}