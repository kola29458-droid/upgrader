// Звуки сайта (вырезаны из видео-образца): клик по скину, старт крутки, тики стрелки, победа.
// Работает через Web Audio: короткие звуки можно играть часто и без задержек.
// Включён ли звук и громкость берутся из настроек над колесом (setSoundSettings вызывает App).

const SOUND_FILES = {
  click: '/sounds/click.wav',      // клик по скину слева/справа и по кнопке Improve
  start: '/sounds/spin-start.wav', // удар на старте крутки
  tick: '/sounds/tick.wav',        // щелчок, когда стрелка проходит очередное деление
  win: '/sounds/win.wav',          // победа (фейерверк, ~3 с)
} as const

export type SoundName = keyof typeof SOUND_FILES

// Относительная громкость каждого звука (в оригинале клики и тики заметно тише остальных)
const BASE_GAIN: Record<SoundName, number> = { click: 0.45, start: 1, tick: 0.35, win: 0.9 }

let ctx: AudioContext | null = null
let settings = { enabled: true, volume: 0.74 }
const buffers: Partial<Record<SoundName, AudioBuffer>> = {}
const raw: Partial<Record<SoundName, Promise<ArrayBuffer>>> = {}

export function setSoundSettings(enabled: boolean, volume: number) {
  settings = { enabled, volume }
}

// Файлы качаем заранее (контекст для этого не нужен)
export function preloadSounds() {
  ;(Object.keys(SOUND_FILES) as SoundName[]).forEach((name) => {
    if (raw[name]) return
    raw[name] = fetch(SOUND_FILES[name])
      .then((response) => response.arrayBuffer())
      .catch(() => new ArrayBuffer(0))
  })
}

async function decodeAll(context: AudioContext) {
  preloadSounds()
  await Promise.all(
    (Object.keys(SOUND_FILES) as SoundName[]).map(async (name) => {
      if (buffers[name]) return
      try {
        const data = await raw[name]!
        if (data.byteLength) buffers[name] = await context.decodeAudioData(data.slice(0))
      } catch {
        // звук не загрузился — просто играть нечего
      }
    }),
  )
}

// Вызывать из обработчика действия пользователя (браузеры запускают звук только после клика/нажатия)
export function unlockAudio() {
  try {
    if (!ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return
      ctx = new Ctor()
      void decodeAll(ctx)
    }
    if (ctx.state === 'suspended') void ctx.resume()
  } catch {
    // нет Web Audio — без звука
  }
}

export function playSound(name: SoundName) {
  if (!settings.enabled || settings.volume <= 0) return
  if (!ctx) unlockAudio()

  const buffer = buffers[name]
  if (!ctx || !buffer) return

  const source = ctx.createBufferSource()
  const gain = ctx.createGain()
  source.buffer = buffer
  gain.gain.value = Math.min(1, settings.volume) * BASE_GAIN[name]
  source.connect(gain).connect(ctx.destination)
  source.start()
}
