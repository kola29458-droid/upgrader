// Единственное место, где Live drops берёт данные из проекта.
// Чтобы подключить другой источник каталога, меняй только этот файл.

export type DropItem = {
  id: string
  name: string // название скина без оружия («Dark Water»)
  type: string // оружие с префиксами («StatTrak™ AK-47», «★ Karambit», «Sticker»)
  price: number
  image: string
  color: string // hex цвета редкости
}

type RawSkin = {
  id: string
  weapon: string
  name: string
  price: number
  image: string
  rarityColor: string
}

let cache: DropItem[] = []
let pending: Promise<DropItem[]> | null = null

// 'rgb(94, 152, 217)' -> '#5E98D9'
function toHex(color: string): string {
  const m = color.match(/\d+/g)
  if (!m || m.length < 3) return color.startsWith('#') ? color : '#B0C3D9'
  return (
    '#' +
    m
      .slice(0, 3)
      .map((n) => Number(n).toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  )
}

// Синхронно отдаёт то, что уже загружено ([] пока каталог не загрузился)
export function getCatalog(): DropItem[] {
  return cache
}

// Загрузка каталога (один раз, дальше из памяти)
export function loadCatalog(): Promise<DropItem[]> {
  if (cache.length > 0) return Promise.resolve(cache)
  if (!pending) {
    pending = fetch('/skins.json')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<RawSkin[]>
      })
      .then((raw) => {
        cache = raw.map((s) => ({
          id: String(s.id),
          name: s.name,
          type: s.weapon,
          price: s.price,
          image: s.image,
          color: toHex(s.rarityColor),
        }))
        return cache
      })
      .catch((err) => {
        pending = null
        throw err
      })
  }
  return pending
}
