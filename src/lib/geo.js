export function distanceMeters(a, b) {
  const R = 6371000
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}

export function formatDistance(meters) {
  if (meters == null || Number.isNaN(meters)) return '위치 확인 중'
  if (meters < 1000) return `${Math.round(meters)}m`
  return `${(meters / 1000).toFixed(1)}km`
}

export const BUS_GAP_M = 400
export const TRUSTED_ACCURACY_M = 120
export const USABLE_ACCURACY_M = 400

export function estimateBusHops(from, to) {
  const meters = distanceMeters(from, to)
  if (meters < 120) return 0
  return Math.max(1, Math.round(meters / BUS_GAP_M))
}

let lastFix = null

export function getLastFix() {
  if (!lastFix) return null
  if (Date.now() - lastFix.at > 45 * 1000) return null
  if (lastFix.accuracy > USABLE_ACCURACY_M) return null
  return lastFix
}

function rememberFix(coords) {
  const next = {
    lat: coords.latitude,
    lng: coords.longitude,
    accuracy: Number.isFinite(coords.accuracy) ? coords.accuracy : 99999,
    at: Date.now(),
  }

  if (
    lastFix &&
    Date.now() - lastFix.at < 30 * 1000 &&
    next.accuracy > lastFix.accuracy * 1.8 &&
    next.accuracy > TRUSTED_ACCURACY_M
  ) {
    return lastFix
  }

  lastFix = next
  return lastFix
}

const FINE = { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }

export function warmLocation() {
  if (!navigator.geolocation) return
  navigator.geolocation.getCurrentPosition(
    (pos) => rememberFix(pos.coords),
    () => {},
    FINE,
  )
}

export function watchHere(onChange, onError) {
  if (!navigator.geolocation) {
    onError?.('이 기기는 위치를 쓸 수 없습니다.')
    return () => {}
  }

  const apply = (pos) => {
    const fix = rememberFix(pos.coords)
    onChange(fix)
  }

  const cached = getLastFix()
  if (cached) onChange(cached)

  navigator.geolocation.getCurrentPosition(apply, () => {}, FINE)
  const watchId = navigator.geolocation.watchPosition(
    apply,
    () => {
      if (!getLastFix()) onError?.('GPS를 기다리는 중. 휴대폰에서 위치 권한을 허용해 주세요.')
    },
    FINE,
  )
  return () => navigator.geolocation.clearWatch(watchId)
}

export function isFixUsable(here) {
  return here && Number.isFinite(here.accuracy) && here.accuracy <= USABLE_ACCURACY_M
}
