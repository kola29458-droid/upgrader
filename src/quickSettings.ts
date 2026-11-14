import { MAX_CHANCE } from './upgraderMath'

// Настройки быстрого выбора, звука и типа прокрутки (окно Settings)
export type QuickSettings = {
  multipliers: [number, number, number]
  percents: [number, number, number]
  sound: boolean
  fastScroll: boolean
  volume: number // громкость звуков, от 0 до 1
}

export const DEFAULT_QUICK_SETTINGS: QuickSettings = {
  multipliers: [2, 4, 8],
  percents: [25, 55, 75],
  sound: true,
  fastScroll: false,
  volume: 0.74,
}

// Допустимые значения в полях
export const MULTIPLIER_MIN = 1.4
export const MULTIPLIER_MAX = 100
export const PERCENT_MIN = 0.1
export const PERCENT_MAX = MAX_CHANCE

const STORAGE_KEY = 'upgrader-quick-settings'

function isTriple(value: unknown, min: number, max: number): value is [number, number, number] {
  return (
    Array.isArray(value) &&
    value.length === 3 &&
    value.every((n) => typeof n === 'number' && Number.isFinite(n) && n >= min && n <= max)
  )
}

export function loadQuickSettings(): QuickSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_QUICK_SETTINGS

    const data = JSON.parse(raw)

    return {
      multipliers: isTriple(data.multipliers, MULTIPLIER_MIN, MULTIPLIER_MAX)
        ? data.multipliers
        : DEFAULT_QUICK_SETTINGS.multipliers,
      percents: isTriple(data.percents, PERCENT_MIN, PERCENT_MAX)
        ? data.percents
        : DEFAULT_QUICK_SETTINGS.percents,
      sound: typeof data.sound === 'boolean' ? data.sound : DEFAULT_QUICK_SETTINGS.sound,
      fastScroll:
        typeof data.fastScroll === 'boolean' ? data.fastScroll : DEFAULT_QUICK_SETTINGS.fastScroll,
      volume:
        typeof data.volume === 'number' && data.volume >= 0 && data.volume <= 1
          ? data.volume
          : DEFAULT_QUICK_SETTINGS.volume,
    }
  } catch {
    return DEFAULT_QUICK_SETTINGS
  }
}

export function saveQuickSettings(settings: QuickSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // хранилище недоступно, настройки просто не сохранятся между перезагрузками
  }
}
