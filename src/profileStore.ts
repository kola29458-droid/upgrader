// Журнал профиля симулятора: что покупал / продавал / выигрывал и все игры.
// Хранится только в памяти (как баланс и инвентарь): после перезагрузки страницы всё пустое.
import type { Skin } from './components/SkinCatalog'

export type ItemEventKind = 'bought' | 'won' | 'compensation' | 'upgraded' | 'sold' | 'withdrawn'

export type ItemEvent = {
  id: string
  kind: ItemEventKind
  skin: Skin
  time: number
}

export type GameRecord = {
  id: string // он же Roll ID / Game ID в подсказках
  time: number
  betSkins: Skin[] // скины, поставленные в апгрейд
  betCoins: number // монеты, добавленные к ставке
  betTotal: number // общая сумма входа
  target: Skin
  chance: number
  win: boolean
  compensation: Skin | null // компенсация за проигрыш (если была)
}

export type BestDrop = { skin: Skin; chance: number }

// Подписи операций в Items history (предположение: в оригинале есть только «Bought», остальные — по смыслу)
export const ITEM_EVENT_LABEL: Record<ItemEventKind, string> = {
  bought: 'Bought',
  won: 'Won',
  compensation: 'Compensation',
  upgraded: 'Upgraded',
  sold: 'Sold',
  withdrawn: 'Withdrawn',
}

let counter = 0
export function nextEventId() {
  counter += 1
  return `${Date.now()}-${counter}`
}

export function newGameId() {
  return String(600000000 + Math.floor(Math.random() * 99999999))
}

// Максимальное число записей в истории игр
export const MAX_GAME_HISTORY = 300

// Аватар по умолчанию (пока пользователь не выбрал свой файл)
export const AVATAR_PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='#3A3A40'/><circle cx='50' cy='38' r='17' fill='#8a8b92'/><path d='M16 94c4-22 18-32 34-32s30 10 34 32z' fill='#8a8b92'/></svg>",
  )

// Настройки профиля (окно Settings по шестерёнке). Хранятся только в памяти, ничего никуда не отправляется.
export type CurrencyCode = 'coins' | 'uscoins' | 'eucoins' | 'brcoins'
export type SteamPrivacy = 'private' | 'friends' | 'public'

export type ProfileSettings = {
  nickname: string
  tradeUrl: string
  birth: string // DD.MM.YYYY, как в оригинале ставится один раз
  currency: CurrencyCode
  privacy: SteamPrivacy
  streamerMode: boolean
}

export const DEFAULT_PROFILE_SETTINGS: ProfileSettings = {
  nickname: 'Demo player',
  tradeUrl: '',
  birth: '',
  currency: 'coins',
  privacy: 'private',
  streamerMode: false,
}
