import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import '../settingsModal.css'
import {
  DEFAULT_QUICK_SETTINGS,
  MULTIPLIER_MAX,
  MULTIPLIER_MIN,
  PERCENT_MAX,
  PERCENT_MIN,
} from '../quickSettings'
import type { QuickSettings } from '../quickSettings'

type Props = {
  settings: QuickSettings
  onSave: (settings: QuickSettings) => void
  onClose: () => void
}

// Время анимации закрытия (должно совпадать с .sm-overlay.is-closing в CSS)
const CLOSE_MS = 180

const toStrings = (values: number[]) => values.map((v) => String(v))

function inRange(raw: string, min: number, max: number) {
  if (raw.trim() === '') return false
  const n = Number(raw)
  return Number.isFinite(n) && n >= min && n <= max
}

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="currentColor"
        d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"
      />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true">
      <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  )
}

function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true">
      <path
        d="M3.8 12a8.2 8.2 0 1 0 2.5-5.9"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path d="M3.8 3.8v4.6h4.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function SettingsModal({ settings, onSave, onClose }: Props) {
  const [mult, setMult] = useState(() => toStrings(settings.multipliers))
  const [pct, setPct] = useState(() => toStrings(settings.percents))
  const [sound, setSound] = useState(settings.sound)
  const [fastScroll, setFastScroll] = useState(settings.fastScroll)
  const [closing, setClosing] = useState(false)
  const [showErrors, setShowErrors] = useState(false)
  const closeTimer = useRef<number | undefined>(undefined)

  const requestClose = () => {
    if (closing) return
    setClosing(true)
    closeTimer.current = window.setTimeout(onClose, CLOSE_MS)
  }

  useEffect(() => () => window.clearTimeout(closeTimer.current), [])

  // Escape закрывает окно
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') requestClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const multValid = mult.map((v) => inRange(v, MULTIPLIER_MIN, MULTIPLIER_MAX))
  const pctValid = pct.map((v) => inRange(v, PERCENT_MIN, PERCENT_MAX))
  const allValid = [...multValid, ...pctValid].every(Boolean)

  const updateAt = (list: string[], setList: (next: string[]) => void, index: number, value: string) => {
    setList(list.map((item, i) => (i === index ? value : item)))
  }

  const resetMultipliers = () => setMult(toStrings(DEFAULT_QUICK_SETTINGS.multipliers))
  const resetPercents = () => setPct(toStrings(DEFAULT_QUICK_SETTINGS.percents))
  const resetAll = () => {
    resetMultipliers()
    resetPercents()
    setSound(DEFAULT_QUICK_SETTINGS.sound)
    setFastScroll(DEFAULT_QUICK_SETTINGS.fastScroll)
    setShowErrors(false)
  }

  const handleSave = () => {
    if (!allValid) {
      setShowErrors(true)
      return
    }

    onSave({
      multipliers: mult.map(Number) as [number, number, number],
      percents: pct.map(Number) as [number, number, number],
      sound,
      fastScroll,
    })
    requestClose()
  }

  return createPortal(
    <div
      className={`sm-overlay${closing ? ' is-closing' : ''}`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) requestClose()
      }}
    >
      <div className="sm-modal" role="dialog" aria-modal="true" aria-labelledby="sm-title">
        <div className="sm-header">
          <span id="sm-title" className="sm-title">
            <GearIcon /> Settings
          </span>
          <button type="button" className="sm-close" onClick={requestClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        <div className="sm-section">
          <div className="sm-row">
            <span className="sm-heading">Quick Selection</span>
            <button type="button" className="sm-link" onClick={resetAll}>
              Default
            </button>
          </div>

          <div className="sm-cards">
            <div className="sm-card">
              <span className="sm-card-text">Configure the buttons for quick selection by multiplier</span>
              <div className="sm-card-row">
                <div className="sm-inputs">
                  {mult.map((value, i) => (
                    <div className="sm-field" key={`m-${i}`}>
                      <input
                        className={`sm-input sm-input--mult${showErrors && !multValid[i] ? ' is-invalid' : ''}`}
                        type="number"
                        inputMode="decimal"
                        step="any"
                        min={MULTIPLIER_MIN}
                        max={MULTIPLIER_MAX}
                        value={value}
                        onChange={(event) => updateAt(mult, setMult, i, event.target.value)}
                        aria-label={`Multiplier ${i + 1}`}
                      />
                      <span className="sm-affix sm-affix--left">x</span>
                    </div>
                  ))}
                </div>
                <button type="button" className="sm-refresh" onClick={resetMultipliers} aria-label="Reset multipliers">
                  <RefreshIcon />
                </button>
              </div>
            </div>

            <div className="sm-card">
              <span className="sm-card-text">Configure the buttons for quick selection by percentage</span>
              <div className="sm-card-row">
                <div className="sm-inputs">
                  {pct.map((value, i) => (
                    <div className="sm-field" key={`p-${i}`}>
                      <input
                        className={`sm-input sm-input--pct${showErrors && !pctValid[i] ? ' is-invalid' : ''}`}
                        type="number"
                        inputMode="decimal"
                        step="any"
                        min={PERCENT_MIN}
                        max={PERCENT_MAX}
                        value={value}
                        onChange={(event) => updateAt(pct, setPct, i, event.target.value)}
                        aria-label={`Percentage ${i + 1}`}
                      />
                      <span className="sm-affix sm-affix--right">%</span>
                    </div>
                  ))}
                </div>
                <button type="button" className="sm-refresh" onClick={resetPercents} aria-label="Reset percentages">
                  <RefreshIcon />
                </button>
              </div>
            </div>
          </div>

          {showErrors && !allValid && (
            <p className="sm-error">
              Multipliers must be from {MULTIPLIER_MIN} to {MULTIPLIER_MAX}, percentages from {PERCENT_MIN} to{' '}
              {PERCENT_MAX}.
            </p>
          )}
        </div>

        <div className="sm-group">
          <h3 className="sm-group-title">Sound in upgrade</h3>

          <label className="sm-option">
            <input
              className="sm-radio-input"
              type="radio"
              name="sm-sound"
              checked={sound}
              onChange={() => setSound(true)}
            />
            <span className="sm-radio" />
            <span className="sm-option-body">
              <span className="sm-option-title">Enabled</span>
              <span className="sm-option-text">
                Default value. Sound effects (button presses, animation clicks, and final applause) are enabled
              </span>
            </span>
          </label>

          <label className="sm-option">
            <input
              className="sm-radio-input"
              type="radio"
              name="sm-sound"
              checked={!sound}
              onChange={() => setSound(false)}
            />
            <span className="sm-radio" />
            <span className="sm-option-body">
              <span className="sm-option-title">Disabled</span>
              <span className="sm-option-text">Sound effects in the upgrade are now silent</span>
            </span>
          </label>
        </div>

        <div className="sm-group">
          <h3 className="sm-group-title">Scroll type</h3>

          <label className="sm-option">
            <input
              className="sm-radio-input"
              type="radio"
              name="sm-scroll"
              checked={!fastScroll}
              onChange={() => setFastScroll(false)}
            />
            <span className="sm-radio" />
            <span className="sm-option-body">
              <span className="sm-option-title">Normal</span>
              <span className="sm-option-text">Default value. The arrow rotates slowly</span>
            </span>
          </label>

          <label className="sm-option">
            <input
              className="sm-radio-input"
              type="radio"
              name="sm-scroll"
              checked={fastScroll}
              onChange={() => setFastScroll(true)}
            />
            <span className="sm-radio" />
            <span className="sm-option-body">
              <span className="sm-option-title">Fast</span>
              <span className="sm-option-text">The arrow spins more quickly to speed up gameplay</span>
            </span>
          </label>
        </div>

        <button type="button" className="sm-save" onClick={handleSave}>
          Save and close
        </button>
      </div>
    </div>,
    document.body,
  )
}
