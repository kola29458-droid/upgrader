import { useEffect, useRef } from 'react'
import '../winEffect.css'

// Анимация победы на карточке выбранного скина (снято с видео-образца, время в мс от момента победы):
//   0.1–0.6 с  карточка краснеет, появляется рамка
//   0.15–0.5 с красная двойная стрелка «апгрейд» вырастает за оружием
//   1.4 с      стрелка разлетается красным фейерверком, потом ещё несколько залпов и дым
//   ~3.3 с     всё затухает

const DURATION = 3300
const RED_HUE = 355

type Burst = { at: number; x: number; y: number; radius: number; count: number; glow: number }

// x, y — доли от размера карточки
const BURSTS: Burst[] = [
  { at: 1400, x: 0.5, y: 0.4, radius: 112, count: 130, glow: 1.6 },
  { at: 1950, x: 0.14, y: 0.78, radius: 84, count: 95, glow: 0.5 },
  { at: 2100, x: 0.86, y: 0.58, radius: 56, count: 60, glow: 0.3 },
  { at: 2250, x: 0.34, y: 0.28, radius: 64, count: 70, glow: 0.35 },
]

// Дым: серые облачка, которые растут и тают
const SMOKE = [
  { at: 1650, x: 0.64, y: 0.36, size: 58 },
  { at: 2150, x: 0.08, y: 0.5, size: 62 },
  { at: 2200, x: 0.96, y: 0.52, size: 66 },
  { at: 2400, x: 0.3, y: 0.12, size: 56 },
]

const BURST_LIFE = 1050
const SMOKE_LIFE = 1200

type Particle = {
  burst: number
  angle: number
  reach: number
  hue: number
  light: number
  width: number
}

type Spark = { x: number; y: number; vx: number; vy: number; at: number }

export default function WinEffect() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const width = canvas.clientWidth
    const height = canvas.clientHeight
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)
    ctx.scale(dpr, dpr)

    const particles: Particle[] = []
    BURSTS.forEach((burst, index) => {
      for (let i = 0; i < burst.count; i++) {
        particles.push({
          burst: index,
          angle: (i / burst.count) * Math.PI * 2 + Math.random() * 0.12,
          reach: 0.55 + Math.random() * 0.45,
          hue: RED_HUE + (Math.random() * 14 - 7),
          light: 48 + Math.random() * 14,
          width: 1.2 + Math.random() * 1.3,
        })
      }
    })

    const sparks: Spark[] = Array.from({ length: 16 }, () => {
      const angle = Math.random() * Math.PI * 2
      const speed = 0.12 + Math.random() * 0.22
      return {
        x: width * 0.5,
        y: height * 0.4,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        at: 1500 + Math.random() * 500,
      }
    })

    const start = performance.now()
    let frameId = 0

    const draw = (now: number) => {
      const time = now - start
      ctx.clearRect(0, 0, width, height)

      // Дым
      ctx.globalCompositeOperation = 'source-over'
      SMOKE.forEach((puff) => {
        const u = (time - puff.at) / SMOKE_LIFE
        if (u < 0 || u > 1) return
        const radius = puff.size * (0.5 + u * 0.8)
        const x = puff.x * width
        const y = puff.y * height - u * 18
        const alpha = Math.sin(u * Math.PI) * 0.3
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
        gradient.addColorStop(0, `rgba(165, 165, 170, ${alpha})`)
        gradient.addColorStop(1, 'rgba(165, 165, 170, 0)')
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.fill()
      })

      ctx.globalCompositeOperation = 'lighter'

      // Свечение залпов
      BURSTS.forEach((burst) => {
        const u = (time - burst.at) / (BURST_LIFE * 0.7)
        if (u < 0 || u > 1) return
        const x = burst.x * width
        const y = burst.y * height
        const radius = burst.radius * (0.55 + 0.45 * Math.min(1, u * 2))
        const alpha = Math.min(0.9, burst.glow * 0.6) * (1 - u) * (1 - u)
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
        gradient.addColorStop(0, `hsla(${RED_HUE}, 90%, 58%, ${alpha})`)
        gradient.addColorStop(0.7, `hsla(${RED_HUE}, 90%, 52%, ${alpha * 0.8})`)
        gradient.addColorStop(1, `hsla(${RED_HUE}, 90%, 50%, 0)`)
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.fill()
      })

      // Лучи залпов
      ctx.lineCap = 'round'
      particles.forEach((particle) => {
        const burst = BURSTS[particle.burst]
        const u = (time - burst.at) / BURST_LIFE
        if (u < 0 || u > 1) return
        const travel = burst.radius * particle.reach * (1 - Math.pow(1 - u, 3))
        const tail = Math.max(3, 16 * (1 - u))
        const cos = Math.cos(particle.angle)
        const sin = Math.sin(particle.angle)
        const cx = burst.x * width
        const cy = burst.y * height + u * u * 10 // лёгкое падение
        ctx.strokeStyle = `hsla(${particle.hue}, 88%, ${particle.light}%, ${Math.pow(1 - u, 1.4)})`
        ctx.lineWidth = particle.width
        ctx.beginPath()
        ctx.moveTo(cx + cos * Math.max(0, travel - tail), cy + sin * Math.max(0, travel - tail))
        ctx.lineTo(cx + cos * travel, cy + sin * travel)
        ctx.stroke()
      })

      // Искры
      sparks.forEach((spark) => {
        const age = time - spark.at
        if (age < 0 || age > 700) return
        const x = spark.x + spark.vx * age
        const y = spark.y + spark.vy * age + age * age * 0.0002
        ctx.fillStyle = `rgba(255, 190, 190, ${1 - age / 700})`
        ctx.fillRect(x, y, 2, 2)
      })

      if (time < DURATION) frameId = requestAnimationFrame(draw)
      else ctx.clearRect(0, 0, width, height)
    }

    frameId = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frameId)
  }, [])

  return (
    <div className="win-fx" aria-hidden="true">
      <span className="win-fx__tint" />
      <svg className="win-fx__chevron" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="win-fx-red" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f0474f" />
            <stop offset="1" stopColor="#c92f3a" />
          </linearGradient>
        </defs>
        <path d="M0 34 L50 0 L100 34 L100 62 L50 28 L0 62 Z" fill="url(#win-fx-red)" />
        <path d="M0 70 L50 36 L100 70 L100 98 L50 64 L0 98 Z" fill="url(#win-fx-red)" />
      </svg>
      <canvas ref={canvasRef} className="win-fx__canvas" />
      <span className="win-fx__border" />
    </div>
  )
}
