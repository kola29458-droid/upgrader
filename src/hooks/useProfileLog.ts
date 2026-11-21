import { useCallback, useMemo, useState } from 'react'
import type { Skin } from '../components/SkinCatalog'
import { newGameId, nextEventId, MAX_GAME_HISTORY } from '../profileStore'
import type { BestDrop, GameRecord, ItemEvent, ItemEventKind } from '../profileStore'

// Журнал операций и игр. Новые записи добавляются в начало (сверху самые свежие).
export function useProfileLog() {
  const [itemEvents, setItemEvents] = useState<ItemEvent[]>([])
  const [games, setGames] = useState<GameRecord[]>([])

  const logItems = useCallback((kind: ItemEventKind, skins: Skin[]) => {
    if (skins.length === 0) return
    const time = Date.now()
    const created = skins.map((skin) => ({ id: nextEventId(), kind, skin, time })).reverse()
    setItemEvents((current) => [...created, ...current])
  }, [])

  const logGame = useCallback((game: Omit<GameRecord, 'id' | 'time'>) => {
    setGames((current) => {
      const next = [{ ...game, id: newGameId(), time: Date.now() }, ...current]
      return next.slice(0, MAX_GAME_HISTORY)
    })
  }, [])

  const stats = useMemo(() => {
    let bestDrop: BestDrop | null = null
    for (const game of games) {
      if (game.win && (!bestDrop || game.target.price > bestDrop.skin.price)) {
        bestDrop = { skin: game.target, chance: game.chance }
      }
    }
    const withdrawn = itemEvents.filter((event) => event.kind === 'withdrawn')
    return {
      bestDrop, // лучший выигранный скин (не из инвентаря и не компенсация)
      upgrades: games.length,
      battles: 0, // батлы в симуляторе пока недоступны
      withdrawnCount: withdrawn.length,
      withdrawnSum: withdrawn.reduce((sum, event) => sum + event.skin.price, 0),
    }
  }, [games, itemEvents])

  return { itemEvents, games, stats, logItems, logGame }
}
