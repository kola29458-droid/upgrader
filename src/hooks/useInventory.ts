import { useCallback, useState } from 'react'
import type { Skin } from '../components/SkinCatalog'

// Купленный скин: тот же Skin + уникальный uid (у одинаковых скинов разные uid)
export type OwnedSkin = Skin & { uid: string }

// Инвентарь хранится только в памяти: после перезагрузки страницы он пустой
// (как и баланс). Между страницами сайта (Upgrader, Battles и т.д.) он сохраняется.
export function useInventory() {
  const [items, setItems] = useState<OwnedSkin[]>([])

  // Добавляет скины и возвращает созданные записи (с их uid)
  const add = useCallback((skins: Skin[]): OwnedSkin[] => {
    const stamp = Date.now()
    const created = skins.map((skin, index) => ({
      ...skin,
      uid: `${stamp}-${index}-${Math.random().toString(36).slice(2, 8)}`,
    }))
    setItems((current) => [...current, ...created])
    return created
  }, [])

  // Убирает скины по uid (например, после апгрейда)
  const remove = useCallback((uids: string[]) => {
    setItems((current) => current.filter((item) => !uids.includes(item.uid)))
  }, [])

  return { items, add, remove }
}
