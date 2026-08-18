import { distanceMeters } from '../lib/geo'
import lines from './seoulSubwayLines.json'

export const SUBWAY_WAKE_NEAR_M = 600

export const SUBWAY_LINES = lines

export function searchStations(keyword) {
  const q = keyword.trim()
  if (!q) return []
  const hits = []
  for (const line of SUBWAY_LINES) {
    for (const st of line.stations) {
      if (st.name.includes(q)) {
        hits.push({ ...st, lineId: line.id, lineName: line.name })
      }
    }
  }
  return hits.slice(0, 40)
}

export function listLines() {
  return SUBWAY_LINES.map((line) => ({ id: line.id, name: line.name }))
}

export function listStationsOnLine(lineId, keyword = '') {
  const line = getLine(lineId)
  if (!line) return []
  const q = keyword.trim()
  return line.stations
    .filter((st) => !q || st.name.includes(q))
    .map((st) => ({ ...st, lineId: line.id, lineName: line.name }))
}

const LEGACY_LINE = {
  1: '01호선',
  2: '02호선',
  3: '03호선',
  4: '04호선',
  5: '05호선',
  6: '06호선',
  7: '07호선',
  8: '08호선',
  9: '09호선',
  k: '경의선',
  suin: '수인분당선',
  shin: '신분당선',
  arex: '공항철도',
}

export function getLine(lineId) {
  return (
    SUBWAY_LINES.find((l) => l.id === lineId) ||
    SUBWAY_LINES.find((l) => l.id === LEGACY_LINE[lineId])
  )
}

export function remainingStops(line, fromName, toName) {
  const i = line.stations.findIndex((s) => s.name === fromName)
  const j = line.stations.findIndex((s) => s.name === toName)
  if (i < 0 || j < 0 || i === j) return null
  const n = line.stations.length
  if (line.loop) {
    const forward = (j - i + n) % n
    const backward = (i - j + n) % n
    return Math.min(forward, backward)
  }
  return Math.abs(j - i)
}

export function isNearSubwayWakeStation(line, destName, here, before) {
  if (!line || !here || !destName) return false
  for (const station of line.stations) {
    if (station.lat == null || station.lng == null) continue
    const hops = station.name === destName ? 0 : remainingStops(line, station.name, destName)
    if (hops == null || hops > before) continue
    if (distanceMeters(here, station) <= SUBWAY_WAKE_NEAR_M) return true
  }
  return false
}
