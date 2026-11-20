// Звуки сайта (вырезаны из видео-образца): клик по скину, старт крутки, тики стрелки, победа.
// Работает через Web Audio: короткие звуки можно играть часто и без задержек, а звуки крутки
// ставятся в расписание заранее (по часам аудио, а не «в ближайший кадр») и попадают точно в такт.
// Включён ли звук и громкость берутся из настроек над колесом (setSoundSettings вызывает App).

const SOUND_FILES = {
  click: '/sounds/click.wav',               // клик по скину слева/справа и по кнопке Improve
  start: '/sounds/spin-start.wav',          // обычная крутка: удар + «гул» (вырезано из оригинала 1:1, 0.7 с)
  startFast: '/sounds/spin-start-fast.wav', // быстрая крутка: прежний файл (пока нет видео оригинала с быстрой круткой)
  tick: '/sounds/tick.wav',                 // щелчок, когда стрелка проходит очередное деление
  win: '/sounds/win.wav',                   // победа (фейерверк, ~3 с)
  caseOpen: '/sounds/case-open.wav',        // кейс падает и открывается (вырезано из видео-образца, ~2.65 с)
} as const

export type SoundName = keyof typeof SOUND_FILES

// Относительная громкость каждого звука. Все файлы нормализованы одинаково (пик 0.95),
// поэтому именно эти числа задают баланс. Тик к удару = 0.139: измерено в оригинале (пики 0.111 и 0.799).
const BASE_GAIN: Record<SoundName, number> = { click: 0.45, start: 1, startFast: 1, tick: 0.14, win: 0.9, caseOpen: 0.9 }

let ctx: AudioContext | null = null
let master: GainNode | null = null // общая громкость: меняется на лету, даже для уже поставленных в расписание звуков
let settings = { enabled: true, volume: 0.74 }
const buffers: Partial<Record<SoundName, AudioBuffer>> = {}
const raw: Partial<Record<SoundName, Promise<ArrayBuffer>>> = {}

function masterLevel() {
  return settings.enabled ? Math.min(1, Math.max(0, settings.volume)) : 0
}

export function setSoundSettings(enabled: boolean, volume: number) {
  settings = { enabled, volume }
  if (ctx && master) master.gain.setTargetAtTime(masterLevel(), ctx.currentTime, 0.01)
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
      master = ctx.createGain()
      master.gain.value = masterLevel()
      master.connect(ctx.destination)
      void decodeAll(ctx)
    }
    if (ctx.state === 'suspended') void ctx.resume()
  } catch {
    // нет Web Audio — без звука
  }
}

// Играет звук. delayMs — через сколько мс начать (0 = сразу).
// delayMs < 0: звук «уже должен был начаться» — его начало пропускается, остальное идёт вовремя.
// Возвращает функцию, которая отменяет звук (ещё не начавшийся или идущий).
export function playSound(name: SoundName, delayMs = 0): () => void {
  const noop = () => {}
  if (delayMs === 0 && masterLevel() <= 0) return noop // звук выключен — ничего не трогаем
  if (!ctx) unlockAudio()

  const buffer = buffers[name]
  if (!ctx || !master || !buffer) return noop

  const source = ctx.createBufferSource()
  const gain = ctx.createGain()
  source.buffer = buffer
  gain.gain.value = BASE_GAIN[name]
  source.connect(gain).connect(master)

  if (delayMs >= 0) {
    source.start(ctx.currentTime + delayMs / 1000)
  } else {
    const skip = -delayMs / 1000
    if (skip >= buffer.duration) return noop
    source.start(ctx.currentTime, skip)
  }

  return () => {
    try {
      source.stop()
    } catch {
      // уже закончился
    }
  }
}
