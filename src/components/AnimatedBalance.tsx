import { useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'

type Props = {
  value: number
  className?: string
  compact?: boolean
}

type Roll = {
  from: string
  to: string
  id: number
}

const ROLL_DURATION = 900
const ROLL_STAGGER = 12

function displayValue(value: number, compact: boolean) {
  const fixed = value.toFixed(2)
  return compact ? fixed.replace(/\.?0+$/, '') : fixed
}

function digitSequence(from: string, to: string) {
  if (from === ' ') return ['', to]
  if (to === ' ') return [from, '']

  const start = Number(from)
  const end = Number(to)
  const forward = (end - start + 10) % 10
  const backward = (start - end + 10) % 10
  const step = forward <= backward ? 1 : -1
  const steps = Math.min(forward, backward)
  const sequence = [from]

  for (let i = 0, digit = start; i < steps; i += 1) {
    digit = (digit + step + 10) % 10
    sequence.push(String(digit))
  }

  return sequence
}

function alignPrevious(from: string, to: string) {
  const [fromInteger, fromFraction = ''] = from.split('.')
  const [toInteger, toFraction] = to.split('.')
  const integer = fromInteger.length > toInteger.length
    ? fromInteger.slice(-toInteger.length)
    : fromInteger.padStart(toInteger.length, ' ')
  const fraction = toFraction === undefined
    ? ''
    : fromFraction.padEnd(toFraction.length, ' ').slice(0, toFraction.length)
  return `${integer}${toFraction === undefined ? '' : `.${fraction}`}`
}

export default function AnimatedBalance({ value, className = '', compact = false }: Props) {
  const text = displayValue(value, compact)
  const previousText = useRef(text)
  const rollId = useRef(0)
  const [roll, setRoll] = useState<Roll | null>(null)

  useLayoutEffect(() => {
    if (previousText.current === text) return

    const from = previousText.current
    previousText.current = text
    rollId.current += 1
    setRoll({ from, to: text, id: rollId.current })

    const timer = window.setTimeout(() => setRoll(null), ROLL_DURATION + 90)
    return () => window.clearTimeout(timer)
  }, [text])

  const previous = roll ? alignPrevious(roll.from, roll.to) : ''
  const next = roll?.to ?? text

  return (
    <span className={`animated-balance ${className}`} aria-label={text} aria-live="polite">
      <span className="animated-balance__visual" aria-hidden="true">
        {roll ? [...next].map((character, index) => {
          const oldCharacter = previous[index] ?? character
          if (!/\d/.test(character) || oldCharacter === character) {
            return <span className="animated-balance__static" key={`${roll.id}-${index}`}>{character}</span>
          }

          const sequence = digitSequence(oldCharacter, character)
          const delay = (next.length - index - 1) * ROLL_STAGGER

          return (
            <span
              className="animated-balance__slot"
              key={`${roll.id}-${index}`}
              style={{ '--roll-offset': `-${sequence.length - 1}em`, '--roll-delay': `${delay}ms` } as CSSProperties}
            >
              <span className="animated-balance__track">
                {sequence.map((digit, digitIndex) => <span key={digitIndex}>{digit}</span>)}
              </span>
            </span>
          )
        }) : [...text].map((character, index) => (
          <span className="animated-balance__static" key={`${index}-${character}`}>{character}</span>
        ))}
      </span>
    </span>
  )
}
