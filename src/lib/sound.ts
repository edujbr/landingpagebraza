'use client'

/**
 * Efeitos sonoros sintetizados com Web Audio: nenhum arquivo é baixado.
 * O navegador só libera áudio depois de um gesto da pessoa, então `unlock()`
 * precisa rodar dentro de um clique/toque; antes disso todo som é ignorado.
 */

type Pref = 'on' | 'off' | null

const KEY = 'braza-sound'
const listeners = new Set<() => void>()

let ctx: AudioContext | null = null
let master: GainNode | null = null
let noise: AudioBuffer | null = null
let enabled = false
let pref: Pref = null
let ambient: { stop: () => void } | null = null
let wantAmbient = false

function readPref(): Pref {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'on' || v === 'off' ? v : null
  } catch {
    return null
  }
}

function emit() { listeners.forEach((fn) => fn()) }

export function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}

export const getEnabled = () => enabled
export const getPref = () => pref

/** Lê a preferência salva. Se estava ligado, destrava no primeiro gesto da visita. */
export function initSound() {
  pref = readPref()
  if (pref === 'on') {
    enabled = true
    const once = () => {
      unlock()
      window.removeEventListener('pointerdown', once)
      window.removeEventListener('keydown', once)
    }
    window.addEventListener('pointerdown', once)
    window.addEventListener('keydown', once)
  }
  emit()
}

function unlock() {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return
    ctx = new AC()
    const comp = ctx.createDynamicsCompressor()
    comp.threshold.value = -14
    comp.ratio.value = 4
    master = ctx.createGain()
    master.gain.value = 0.7
    master.connect(comp).connect(ctx.destination)
    noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
    const data = noise.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  }
  if (ctx.state === 'suspended') void ctx.resume()
  if (wantAmbient) startAmbient()
}

export function setSound(on: boolean) {
  enabled = on
  pref = on ? 'on' : 'off'
  try { localStorage.setItem(KEY, pref) } catch {}
  if (on) {
    unlock()
    click()
  } else {
    stopAmbient()
  }
  emit()
}

function ready(): AudioContext | null {
  return enabled && ctx && master && ctx.state === 'running' ? ctx : null
}

function env(g: GainNode, t: number, peak: number, attack: number, decay: number) {
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(peak, t + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay)
}

function noiseSource(c: AudioContext, offset = Math.random()) {
  const src = c.createBufferSource()
  src.buffer = noise
  src.loop = true
  src.start(c.currentTime, offset)
  return src
}

function tone(c: AudioContext, type: OscillatorType, freq: number, t: number, peak: number, attack: number, decay: number, out: AudioNode = master!) {
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, t)
  env(g, t, peak, attack, decay)
  o.connect(g).connect(out)
  o.start(t)
  o.stop(t + attack + decay + 0.05)
  return o
}

/** Estalo curto de brasa. */
function pop(c: AudioContext, t: number, gain: number) {
  const src = noiseSource(c)
  const hp = c.createBiquadFilter()
  hp.type = 'bandpass'
  hp.frequency.value = 1500 + Math.random() * 4500
  hp.Q.value = 1.2
  const g = c.createGain()
  env(g, t, gain, 0.002, 0.03 + Math.random() * 0.05)
  src.connect(hp).connect(g).connect(master!)
  src.stop(t + 0.12)
}

/** Chiado da carne na chapa: ruído filtrado em faixa média-aguda, entrada suave e estalos discretos. */
export function sizzle(duration = 1.8, level = 0.12) {
  const c = ready()
  if (!c) return
  const t = c.currentTime
  const src = noiseSource(c)
  const hp = c.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 1800
  const lp = c.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 6000
  lp.Q.value = 0.5
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(level, t + 0.18)
  for (let s = 0.24; s < duration; s += 0.09) {
    g.gain.linearRampToValueAtTime(level * (0.7 + Math.random() * 0.3) * (1 - s / duration), t + s)
  }
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration)
  src.connect(hp).connect(lp).connect(g).connect(master!)
  src.stop(t + duration + 0.05)
  for (let i = 0; i < duration * 7; i++) pop(c, t + 0.1 + Math.random() * duration * 0.75, 0.03 + Math.random() * 0.05)
}

let typing: AudioScheduledSourceNode[] = []

/**
 * Rajada de toques de tecla, um por letra, agendada no relógio do áudio.
 * Uma nova rajada corta a anterior para não embolar quando se rola rápido.
 */
export function typeBurst(count: number, interval = 0.028, delay = 0) {
  const c = ready()
  if (!c) return
  typing.forEach((n) => { try { n.stop() } catch {} })
  typing = []
  const t0 = c.currentTime + delay
  const n = Math.min(count, 40)
  for (let i = 0; i < n; i++) {
    const t = t0 + i * interval + (Math.random() - 0.5) * 0.006
    const src = c.createBufferSource()
    src.buffer = noise
    const bp = c.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 2600 + Math.random() * 1600
    bp.Q.value = 3
    const g = c.createGain()
    env(g, t, 0.07 + Math.random() * 0.03, 0.001, 0.025)
    src.connect(bp).connect(g).connect(master!)
    src.start(t, Math.random())
    src.stop(t + 0.05)
    typing.push(src, tone(c, 'triangle', 180 + Math.random() * 60, t, 0.025, 0.001, 0.03))
  }
}

const lastAt = new Map<string, number>()
function throttled(key: string, ms: number) {
  const now = performance.now()
  if (now - (lastAt.get(key) ?? 0) < ms) return true
  lastAt.set(key, now)
  return false
}

/** "Whoosh" de transição: ruído com filtro varrendo. `up` sobe o tom, `size` 0–1 controla corpo e duração. */
export function whoosh(up = true, size = 0.5) {
  const c = ready()
  if (!c || throttled('whoosh', 120)) return
  const t = c.currentTime
  const dur = 0.25 + size * 0.35
  const src = noiseSource(c)
  const bp = c.createBiquadFilter()
  bp.type = 'bandpass'
  bp.Q.value = 1.4
  const [from, to] = up ? [350, 3200] : [3000, 300]
  bp.frequency.setValueAtTime(from, t)
  bp.frequency.exponentialRampToValueAtTime(to, t + dur)
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(0.06 + size * 0.1, t + dur * 0.45)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  src.connect(bp).connect(g).connect(master!)
  src.stop(t + dur + 0.05)
}

/** Brilho subindo (atalhos entrando em órbita). */
export function shimmer() {
  const c = ready()
  if (!c) return
  const t = c.currentTime
  ;[659.25, 783.99, 987.77, 1174.66, 1318.51, 1567.98].forEach((f, i) =>
    tone(c, 'sine', f, t + i * 0.07, 0.035, 0.01, 0.5),
  )
  whoosh(true, 0.8)
}

/** Acorde dedilhado curto (encaixe no lugar). */
export function pluck() {
  const c = ready()
  if (!c) return
  const t = c.currentTime
  ;[392, 493.88, 587.33, 783.99].forEach((f, i) => tone(c, 'triangle', f, t + i * 0.035, 0.06, 0.003, 0.45))
}

/** Camada assentando no lanche. `weight` 0–1 deixa o baque mais grave e forte. */
export function thud(weight = 0.6) {
  const c = ready()
  if (!c) return
  const t = c.currentTime
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = 'sine'
  o.frequency.setValueAtTime(150 - weight * 50, t)
  o.frequency.exponentialRampToValueAtTime(42, t + 0.22)
  env(g, t, 0.35 + weight * 0.45, 0.005, 0.32)
  o.connect(g).connect(master!)
  o.start(t)
  o.stop(t + 0.4)

  const src = noiseSource(c)
  const lp = c.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 700
  const ng = c.createGain()
  env(ng, t, 0.18 * weight + 0.05, 0.003, 0.09)
  src.connect(lp).connect(ng).connect(master!)
  src.stop(t + 0.15)
}

/** Acorde quente quando o lanche fica pronto. */
export function chord() {
  const c = ready()
  if (!c) return
  const t = c.currentTime
  const lp = c.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.setValueAtTime(600, t)
  lp.frequency.exponentialRampToValueAtTime(2400, t + 0.6)
  lp.connect(master!)
  for (const f of [146.83, 220, 277.18, 329.63, 440]) {
    const o = tone(c, 'sawtooth', f, t, 0.06, 0.35, 2.2, lp)
    o.detune.value = (Math.random() - 0.5) * 12
  }
  ;[880, 1108.73, 1318.51].forEach((f, i) => tone(c, 'sine', f, t + 0.25 + i * 0.09, 0.05, 0.01, 1.2))
}

/** Cliques e hovers dos botões. */
export function click() {
  const c = ready()
  if (!c) return
  const t = c.currentTime
  const o = tone(c, 'triangle', 1400, t, 0.16, 0.003, 0.07)
  o.frequency.exponentialRampToValueAtTime(700, t + 0.06)
}

export function hover() {
  const c = ready()
  if (!c) return
  tone(c, 'sine', 2400 + Math.random() * 300, c.currentTime, 0.035, 0.004, 0.035)
}

/** "Tic" da contagem do ranking; sobe de tom conforme o número cresce. */
export function tick(step = 0) {
  const c = ready()
  if (!c) return
  tone(c, 'square', 700 + step * 55, c.currentTime, 0.045, 0.002, 0.035)
}

/** Fanfarra curta da coroa. */
export function fanfare() {
  const c = ready()
  if (!c) return
  const t = c.currentTime
  const lp = c.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 2600
  lp.connect(master!)
  const notes: [number, number, number][] = [[523.25, 0, 0.14], [659.25, 0.11, 0.14], [783.99, 0.22, 0.14], [1046.5, 0.34, 0.9]]
  for (const [f, at, len] of notes) {
    tone(c, 'sawtooth', f, t + at, 0.07, 0.015, len, lp)
    tone(c, 'square', f / 2, t + at, 0.03, 0.015, len, lp)
  }
  for (let i = 0; i < 6; i++) tone(c, 'sine', 2000 + Math.random() * 2500, t + 0.4 + i * 0.07, 0.03, 0.003, 0.25)
}

/** Brasa crepitando ao fundo enquanto a abertura está na tela. */
function startAmbient() {
  const c = ready()
  if (!c || ambient) return
  const t = c.currentTime
  const out = c.createGain()
  out.gain.setValueAtTime(0.0001, t)
  out.gain.exponentialRampToValueAtTime(1, t + 1.2)
  out.connect(master!)

  const src = noiseSource(c)
  const lp = c.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 380
  const rumble = c.createGain()
  rumble.gain.value = 0.09
  src.connect(lp).connect(rumble).connect(out)

  let timer = 0
  const schedule = () => {
    const now = c.currentTime
    const n = 1 + Math.floor(Math.random() * 3)
    for (let i = 0; i < n; i++) {
      const p = c.createBufferSource()
      p.buffer = noise
      const bp = c.createBiquadFilter()
      bp.type = 'bandpass'
      bp.frequency.value = 900 + Math.random() * 3500
      bp.Q.value = 1.5
      const g = c.createGain()
      const at = now + Math.random() * 0.08
      env(g, at, 0.04 + Math.random() * 0.12, 0.002, 0.02 + Math.random() * 0.06)
      p.connect(bp).connect(g).connect(out)
      p.start(at, Math.random())
      p.stop(at + 0.12)
    }
    timer = window.setTimeout(schedule, 60 + Math.random() * 320)
  }
  schedule()

  ambient = {
    stop: () => {
      window.clearTimeout(timer)
      const now = c.currentTime
      out.gain.cancelScheduledValues(now)
      out.gain.setValueAtTime(Math.max(out.gain.value, 0.0001), now)
      out.gain.exponentialRampToValueAtTime(0.0001, now + 0.8)
      src.stop(now + 0.85)
    },
  }
}

function stopAmbient() {
  ambient?.stop()
  ambient = null
}

export function setAmbient(on: boolean) {
  wantAmbient = on
  if (on) startAmbient()
  else stopAmbient()
}
