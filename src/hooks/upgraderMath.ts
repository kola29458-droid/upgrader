// Общая математика апгрейдера: шанс, потолок шанса и максимальная ставка.

// Коэффициент шанса: скин 3.32 -> цель 6.64 даёт 50% * 1.03 = 51.50%
export const CHANCE_MULTIPLIER = 1.03

// Выше этого шанса выкрутить нельзя
export const MAX_CHANCE = 79.99

// Шанс (в процентах) для суммы входа и цены цели
export function calcChance(inputTotal: number, targetPrice: number): number {
  if (targetPrice <= 0 || inputTotal <= 0) return 0
  return Math.min(MAX_CHANCE, (inputTotal / targetPrice) * 100 * CHANCE_MULTIPLIER)
}

// Максимум коинов с баланса, который можно добавить к выбранным скинам,
// чтобы шанс не превысил MAX_CHANCE. Без выбранной цели ограничен только балансом.
export function getMaxBet(
  balance: number,
  skinsTotal: number,
  targetPrice?: number,
): number {
  if (!targetPrice || targetPrice <= 0) return Math.max(0, balance)

  const maxInput = (targetPrice * MAX_CHANCE) / 100 / CHANCE_MULTIPLIER
  const room = Math.round((maxInput - skinsTotal) * 100) / 100

  return Math.max(0, Math.min(balance, room))
}
