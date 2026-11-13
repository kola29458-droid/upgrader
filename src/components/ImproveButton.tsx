import '../improveButton.css'

type Props = {
  disabled?: boolean
  onClick?: () => void
  label?: string      // текст на кнопке: Improve / Loading... / Add to upgrade
  showIcon?: boolean  // значок со стрелками (у "Add to upgrade" его нет)
}

export default function ImproveButton({
  disabled = false,
  onClick,
  label = 'Improve',
  showIcon = true,
}: Props) {
  return (
    <button type="button" className="improve-btn" disabled={disabled} onClick={onClick}>
      {showIcon && (
        <svg className="improve-btn__icon" viewBox="0 0 24 28" aria-hidden="true">
          <path d="M12 0 24 8v8L12 8 0 16V8z" fill="currentColor" />
          <path d="M12 12 24 20v8L12 20 0 28v-8z" fill="currentColor" />
        </svg>
      )}
      <span>{label}</span>
    </button>
  )
}
