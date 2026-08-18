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

export function estimateBusHops(from, to) {
  const meters = distanceMeters(from, to)
  if (meters < 120) return 0
  return Math.max(1, Math.round(meters / BUS_GAP_M))
}

let lastFix = null

export function getLastFix() {
  return lastFix
}

function rememberFix(coords) {
  lastFix = { lat: coords.latitude, lng: coords.longitude }
}

const QUICK = { enableHighAccuracy: false, maximumAge: 120000, timeout: 2500 }
const FINE = { enableHighAccuracy: true, maximumAge: 8000, timeout: 20000 }

export function warmLocation() {
  if (!navigator.geolocation) return
  navigator.geolocation.getCurrentPosition(
    (pos) => rememberFix(pos.coords),
    () => {},
    QUICK,
  )
}

export function watchHere(onChange, onError) {
  if (!navigator.geolocation) {
    onError?.('이 기기는 위치를 쓸 수 없습니다.')
    return () => {}
  }

  const apply = (pos) => {
    rememberFix(pos.coords)
    onChange({ lat: pos.coords.latitude, lng: pos.coords.longitude })
  }

  if (lastFix) onChange(lastFix)

  navigator.geolocation.getCurrentPosition(apply, () => {}, QUICK)
  const watchId = navigator.geolocation.watchPosition(
    apply,
    () => {
      if (!lastFix) onError?.('GPS를 기다리는 중. 탭은 켠 채로 두세요.')
    },
    FINE,
  )
  return () => navigator.geolocation.clearWatch(watchId)
}

