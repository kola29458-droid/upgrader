// Замок для заблокированных карточек скинов (форма та же, что в каталоге Select skin)
export default function LockIcon() {
  return (
    <span className="skin-card__lock" aria-hidden="true">
      <svg viewBox="10 9 24 28.2" fill="none">
        <path d="M16.5 19V16.8A5.5 5.5 0 0 1 27.5 16.8V19" stroke="currentColor" strokeWidth="2.7" />
        <rect x="11.2" y="18.4" width="21.6" height="18.5" rx="2.4" fill="currentColor" />
        <circle cx="22" cy="25.4" r="3.1" fill="#191918" />
        <rect x="20.9" y="26.6" width="2.2" height="5.6" rx="1.1" fill="#191918" />
      </svg>
    </span>
  )
}
