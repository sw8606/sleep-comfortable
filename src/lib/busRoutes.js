import { distanceMeters } from './geo'
import names from '../data/busRouteNames.json'
import routes from '../data/seoulBusRoutes.json'
import seoulStops from '../data/seoulBusStops.json'
import gyeonggiStops from '../data/gyeonggiBusStops.json'

const stopById = new Map()
for (const stop of seoulStops.concat(gyeonggiStops)) {
  if (stop.id != null && !stopById.has(stop.id)) stopById.set(stop.id, stop)
}

function normalize(value) {
  return String(value || '')
    .replace(/\s+/g, '')
    .toUpperCase()
}

function coreNumber(value) {
  return normalize(value).replace(/^[A-Z]+/, '')
}

export function searchBusRoutes(keyword) {
  const q = normalize(keyword)
  if (!q) return []
  const hits = []
  for (const [routeId, meta] of Object.entries(names)) {
    const number = normalize(meta.n)
    const core = coreNumber(meta.n)
    const exact = number === q
    const coreExact = core === q
    const prefix = number.startsWith(q)
    const corePrefix = core.startsWith(q)
    if (!exact && !coreExact && !prefix && !corePrefix && !number.includes(q) && !core.includes(q)) {
      continue
    }
    const stopIds = routes[routeId] || []
    const start = stopById.get(stopIds[0])
    const end = stopById.get(stopIds[stopIds.length - 1])
    hits.push({
      routeId,
      number: meta.n,
      city: meta.c,
      stopCount: stopIds.length,
      startName: start?.name || '',
      endName: end?.name || '',
      exact,
      coreExact,
      prefix,
      corePrefix,
    })
  }
  return hits
    .sort((a, b) => {
      if (a.exact !== b.exact) return a.exact ? -1 : 1
      if (a.coreExact !== b.coreExact) return a.coreExact ? -1 : 1
      if (a.prefix !== b.prefix) return a.prefix ? -1 : 1
      if (a.corePrefix !== b.corePrefix) return a.corePrefix ? -1 : 1
      return a.number.localeCompare(b.number, 'ko', { numeric: true })
    })
    .slice(0, 40)
}

export function getBusRoute(routeId) {
  const meta = names[String(routeId)]
  if (!meta) return null
  const stopIds = routes[String(routeId)] || []
  const start = stopById.get(stopIds[0])
  const end = stopById.get(stopIds[stopIds.length - 1])
  return {
    routeId: String(routeId),
    number: meta.n,
    city: meta.c,
    stopCount: stopIds.length,
    startName: start?.name || '',
    endName: end?.name || '',
  }
}

export function listStopsOnRoute(routeId, keyword = '') {
  const stopIds = routes[String(routeId)]
  if (!stopIds) return []
  const q = keyword.trim()
  const list = []
  stopIds.forEach((id, index) => {
    const stop = stopById.get(id)
    if (!stop) return
    if (q && !stop.name.includes(q)) return
    list.push({ ...stop, seq: index + 1 })
  })
  return list
}

export function hopsLeftOnRoute(routeId, destId, here) {
  const stopIds = routes[String(routeId)]
  if (!stopIds || !here || destId == null) return null
  const dest = Number(destId)
  const destIdx = stopIds.indexOf(dest)
  if (destIdx < 0) return null

  let nearestIdx = -1
  let nearestMeters = Infinity
  for (let i = 0; i <= destIdx; i += 1) {
    const stop = stopById.get(stopIds[i])
    if (!stop) continue
    const meters = distanceMeters(here, stop)
    if (meters < nearestMeters) {
      nearestMeters = meters
      nearestIdx = i
    }
  }
  if (nearestIdx < 0 || nearestMeters > 700) return null
  return Math.max(0, destIdx - nearestIdx)
}

export const BUS_WAKE_NEAR_M = 150

export function isNearBusWakeStop(routeId, destId, here, before) {
  const stopIds = routes[String(routeId)]
  if (!stopIds || !here || destId == null) return false
  const destIdx = stopIds.indexOf(Number(destId))
  if (destIdx < 0) return false
  const from = Math.max(0, destIdx - before)
  for (let i = from; i <= destIdx; i += 1) {
    const stop = stopById.get(stopIds[i])
    if (!stop) continue
    if (distanceMeters(here, stop) <= BUS_WAKE_NEAR_M) return true
  }
  return false
}
