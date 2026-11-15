import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import '../tooltip.css'

// Одна общая подсказка на весь сайт. Чтобы элемент получил подсказку, достаточно написать у него
// data-tooltip="Текст". Позиционируется через position: fixed, поэтому панели с overflow её не обрезают.
const GAP = 8      // зазор между плашкой и элементом (со скриншотов оригинала)
const HEIGHT = 32  // высота плашки
const EDGE = 4     // минимальный отступ плашки от края окна

type Tip = { text: string; centerX: number; top: number; below: boolean }

export default function Tooltip() {
  const [tip, setTip] = useState<Tip | null>(null) // последняя показанная подсказка (остаётся, пока она плавно гаснет)
  const [on, setOn] = useState(false)
  const boxRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let target: HTMLElement | null = null
    let attrObserver: MutationObserver | null = null

    const show = (element: HTMLElement) => {
      const text = element.dataset.tooltip
      if (!text) return hide()
      const rect = element.getBoundingClientRect()
      const above = rect.top - GAP - HEIGHT
      // Если сверху нет места (элемент у верхнего края окна), показываем под элементом
      const below = above < EDGE
      const top = below ? rect.bottom + GAP : above
      setTip({ text, centerX: rect.left + rect.width / 2, top, below })
      setOn(true)
    }

    const hide = () => {
      target = null
      attrObserver?.disconnect()
      attrObserver = null
      setOn(false)
    }

    const attach = (element: HTMLElement) => {
      target = element
      attrObserver?.disconnect()
      // Текст может меняться, пока курсор на элементе (Disable sound -> Enable sound)
      attrObserver = new MutationObserver(() => show(element))
      attrObserver.observe(element, { attributes: true, attributeFilter: ['data-tooltip'] })
      show(element)
    }

    const onOver = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return
      const element = (event.target as Element | null)?.closest<HTMLElement>('[data-tooltip]') ?? null
      if (element === target) return
      if (element) attach(element)
      else hide()
    }

    const onOut = (event: PointerEvent) => {
      if (!target) return
      const next = event.relatedTarget as Node | null
      if (!next || !target.contains(next)) hide()
    }

    // Элемент мог исчезнуть из страницы под курсором (например, вкладку перерисовали)
    const lostObserver = new MutationObserver(() => {
      if (target && !target.isConnected) hide()
    })
    lostObserver.observe(document.body, { childList: true, subtree: true })

    document.addEventListener('pointerover', onOver)
    document.addEventListener('pointerout', onOut)
    window.addEventListener('scroll', hide, true)
    window.addEventListener('resize', hide)

    return () => {
      document.removeEventListener('pointerover', onOver)
      document.removeEventListener('pointerout', onOut)
      window.removeEventListener('scroll', hide, true)
      window.removeEventListener('resize', hide)
      lostObserver.disconnect()
      attrObserver?.disconnect()
    }
  }, [])

  // Ширина плашки известна только после отрисовки: ставим её по центру и не даём выйти за края окна
  useLayoutEffect(() => {
    const box = boxRef.current
    if (!box || !tip) return
    const width = box.offsetWidth
    const left = Math.min(Math.max(tip.centerX - width / 2, EDGE), window.innerWidth - width - EDGE)
    box.style.left = `${left}px`
  }, [tip])

  // Плашка всегда в странице, а показывается классом: так работает плавное появление
  return (
    <div
      ref={boxRef}
      className={`app-tooltip${on ? ' app-tooltip--on' : ''}${tip?.below ? ' app-tooltip--below' : ''}`}
      style={{ top: tip?.top ?? 0 }}
      role="tooltip"
      aria-hidden={!on}
    >
      {tip?.text}
    </div>
  )
}
