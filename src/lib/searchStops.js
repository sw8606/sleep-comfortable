import { distanceMeters } from './geo'
import seoulStops from '../data/seoulBusStops.json'
import gyeonggiStops from '../data/gyeonggiBusStops.json'

const stops = seoulStops.concat(gyeonggiStops)

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ko'))
}

export function listRegions() {
  return uniqueSorted(stops.map((s) => s.city))
}

export function listDistricts(city) {
  return uniqueSorted(stops.filter((s) => s.city === city).map((s) => s.district))
}

export function listDongs(city, district) {
  return uniqueSorted(
    stops.filter((s) => s.city === city && s.district === district).map((s) => s.dong),
  )
}

export function listStopsByArea({ city, district, dong, keyword = '' }) {
  const q = keyword.trim()
  return stops
    .filter((s) => s.city === city)
    .filter((s) => !district || s.district === district)
    .filter((s) => !dong || dong === '전체' || s.dong === dong)
    .filter((s) => !q || s.name.includes(q))
    .sort((a, b) => a.name.localeCompare(b.name, 'ko'))
}

export async function searchBusStops(keyword) {
  const q = keyword.trim()
  if (!q) return []
  return stops.filter((s) => s.name.includes(q)).slice(0, 30)
}

export async function nearbyBusStops(lat, lng) {
  const here = { lat, lng }
  return stops
    .map((s) => ({ ...s, meters: distanceMeters(here, s) }))
    .filter((s) => s.meters <= 700)
    .sort((a, b) => a.meters - b.meters)
    .slice(0, 20)
}
