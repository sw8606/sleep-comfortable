const MEASUREMENT_ID = 'G-RH5EFX15XC'

const SCREEN_PATH = {
  home: '/',
  watch: '/watch',
  wake: '/wake',
}

const SCREEN_TITLE = {
  home: '편히자 | 버스·지하철 내릴 곳 전에 깨워 주는 앱',
  watch: '감시 중 | 편히자',
  wake: '내릴 곳이에요 | 편히자',
}

function canTrack() {
  return typeof window !== 'undefined' && typeof window.gtag === 'function'
}

export function setScreenMeta(screen) {
  if (typeof document === 'undefined') return
  document.title = SCREEN_TITLE[screen] || SCREEN_TITLE.home
}

export function trackPageView(screen) {
  if (!canTrack()) return
  const path = SCREEN_PATH[screen] || '/'
  const title = SCREEN_TITLE[screen] || SCREEN_TITLE.home
  window.gtag('config', MEASUREMENT_ID, {
    page_path: path,
    page_title: title,
  })
}

export function trackEvent(eventName, params = {}) {
  if (!canTrack()) return
  window.gtag('event', eventName, params)
}

export function trackScreen(screen) {
  setScreenMeta(screen)
  trackPageView(screen)
}
