import { useEffect, useRef, useState } from 'react'

export function useAnimatedNumber(value: number, duration = 850) {
  const [animatedValue, setAnimatedValue] = useState(value)
  const currentValue = useRef(value)

  useEffect(() => {
    const startValue = currentValue.current
    if (startValue === value) return

    let startTime = 0
    let frame = 0
    const animate = (time: number) => {
      if (!startTime) startTime = time
      const progress = Math.min(1, (time - startTime) / duration)
      const eased = 1 - (1 - progress) ** 3
      const nextValue = startValue + (value - startValue) * eased
      currentValue.current = nextValue
      setAnimatedValue(nextValue)
      if (progress < 1) frame = window.requestAnimationFrame(animate)
    }

    frame = window.requestAnimationFrame(animate)
    return () => window.cancelAnimationFrame(frame)
  }, [duration, value])

  return animatedValue
}
