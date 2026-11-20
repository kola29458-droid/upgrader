import { useEffect, useState } from 'react'
import type { CurrencyCode, ProfileSettings, SteamPrivacy } from '../../profileStore'

const COIN = '/coins.png'

const CURRENCIES: { code: CurrencyCode; label: string; letter: string | null }[] = [
  { code: 'coins', label: 'COINS', letter: null },
  { code: 'uscoins', label: 'USCOINS', letter: '$' },
  { code: 'eucoins', label: 'EUCOINS', letter: 'E' },
  { code: 'brcoins', label: 'BRCOINS', letter: 'R' },
]

const PRIVACY: { value: SteamPrivacy; title: string; text: string }[] = [
  {
    value: 'private',
    title: 'Private',
    text: 'Default value. Only you will see your Steam profile information, allows you to hide your profile from parser bots and attackers.',
  },
  { value: 'friends', title: 'Available only to friends', text: 'All authorized users can see your profile information' },
  { value: 'public', title: 'Public', text: 'All users will see your profile information' },
]

// Маска даты DD.MM.YYYY
function maskBirth(raw: string) {
  const digits = raw.replace(/\D/g, '').slice(0, 8)
  const parts = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean)
  return parts.join('.')
}

function CurrencyIcon({ letter }: { letter: string | null }) {
  if (!letter) return <img className="pf-cur__coin" src={COIN} alt="" />
  return <span className="pf-cur__hex">{letter}</span>
}

type Props = {
  settings: ProfileSettings
  onSave: (settings: ProfileSettings) => void
  onClose: () => void
}

// Окно Settings (открывается по шестерёнке в профиле)
export default function ProfileSettingsModal({ settings, onSave, onClose }: Props) {
  const [draft, setDraft] = useState<ProfileSettings>(settings)
  const birthLocked = settings.birth !== '' // дату рождения можно задать только один раз

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function patch(change: Partial<ProfileSettings>) {
    setDraft((current) => ({ ...current, ...change }))
  }

  function save() {
    const nickname = draft.nickname.trim() || settings.nickname
    onSave({ ...draft, nickname, tradeUrl: draft.tradeUrl.trim() })
    onClose()
  }

  return (
    <div className="pf-set-backdrop" onClick={onClose}>
      <div className="pf-set" role="dialog" aria-label="Settings" onClick={(event) => event.stopPropagation()}>
        <div className="pf-set__head">
          <h2>Settings</h2>
          <button type="button" className="pf-set__close" aria-label="Close" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="pf-set__body">
          <label className="pf-set__field">
            <span className="pf-set__label">Nickname</span>
            <input
              className="pf-set__input"
              type="text"
              maxLength={24}
              value={draft.nickname}
              onChange={(event) => patch({ nickname: event.target.value })}
            />
          </label>

          <label className="pf-set__field">
            <span className="pf-set__label pf-set__label--row">
              Trade URL
              <small>
                You can get the link{' '}
                <a href="https://steamcommunity.com/my/tradeoffers/privacy#trade_offer_access_url" target="_blank" rel="noreferrer">
                  here
                </a>
              </small>
            </span>
            <input
              className="pf-set__input"
              type="text"
              placeholder="Enter trade link"
              value={draft.tradeUrl}
              onChange={(event) => patch({ tradeUrl: event.target.value })}
            />
          </label>

          <label className="pf-set__field">
            <span className="pf-set__label pf-set__label--row">
              Date of birth
              <small>Can only be set once</small>
            </span>
            <span className="pf-set__input-wrap">
              <input
                className="pf-set__input"
                type="text"
                inputMode="numeric"
                placeholder="DD.MM.YYYY"
                disabled={birthLocked}
                value={draft.birth}
                onChange={(event) => patch({ birth: maskBirth(event.target.value) })}
              />
              <svg className="pf-set__cal" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="1.5" y="3" width="13" height="11.5" rx="2" stroke="currentColor" strokeWidth="1.2" />
                <path d="M1.5 6.5h13M5 1.5v3M11 1.5v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </span>
          </label>

          <div className="pf-set__field">
            <span className="pf-set__label">Displayed currency</span>
            <div className="pf-set__currencies">
              {CURRENCIES.map(({ code, label, letter }) => (
                <button
                  key={code}
                  type="button"
                  className={`pf-cur ${draft.currency === code ? 'pf-cur--on' : ''}`}
                  onClick={() => patch({ currency: code })}
                >
                  <CurrencyIcon letter={letter} />
                  <span className="pf-cur__label">{label}</span>
                  <span className="pf-radio" />
                </button>
              ))}
            </div>
          </div>

          <div className="pf-set__field">
            <span className="pf-set__label">Steam Privacy</span>
            <div className="pf-set__privacy">
              {PRIVACY.map(({ value, title, text }) => (
                <button
                  key={value}
                  type="button"
                  className={`pf-priv ${draft.privacy === value ? 'pf-priv--on' : ''}`}
                  onClick={() => patch({ privacy: value })}
                >
                  <span className="pf-radio" />
                  <span className="pf-priv__text">
                    <b>{title}</b>
                    <small>{text}</small>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="pf-set__streamer">
            <div>
              <b>Streamer mode</b>
              <small>Hides personal information and balance for safety during streaming</small>
            </div>
            <div
              role="switch"
              tabIndex={0}
              aria-checked={draft.streamerMode}
              className={`pf-toggle ${draft.streamerMode ? 'pf-toggle--on' : ''}`}
              onClick={() => patch({ streamerMode: !draft.streamerMode })}
              onKeyDown={(event) => {
                if (event.key === ' ' || event.key === 'Enter') patch({ streamerMode: !draft.streamerMode })
              }}
            >
              <div className="pf-toggle__knob" />
            </div>
          </div>
        </div>

        <div className="pf-set__foot">
          <button type="button" className="pf-set__save" onClick={save}>
            Save and close
          </button>
        </div>
      </div>
    </div>
  )
}
