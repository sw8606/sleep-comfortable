export function createAlarm() {
  let ctx = null
  let beepTimer = null
  let vibTimer = null
  let wakeLock = null

  async function unlock() {
    try {
      ctx = new AudioContext()
      if (ctx.state === 'suspended') await ctx.resume()
    } catch {
      ctx = null
    }
    try {
      wakeLock = await navigator.wakeLock?.request('screen')
    } catch {
      wakeLock = null
    }
  }

  function beep() {
    if (!ctx) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'square'
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.12, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.35)
  }

  function start() {
    beep()
    beepTimer = setInterval(beep, 700)
    if (navigator.vibrate) {
      navigator.vibrate([400, 120, 400])
      vibTimer = setInterval(() => navigator.vibrate([400, 120, 400]), 900)
    }
  }

  function stop() {
    clearInterval(beepTimer)
    clearInterval(vibTimer)
    beepTimer = null
    vibTimer = null
    navigator.vibrate?.(0)
    wakeLock?.release().catch(() => {})
    wakeLock = null
    ctx?.close().catch(() => {})
    ctx = null
  }

  return { unlock, start, stop }
}
