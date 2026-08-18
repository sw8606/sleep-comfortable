import { useEffect, useRef, useState } from 'react'
import { hopsLeftOnRoute } from '../lib/busRoutes'
import { getLine, remainingStops } from '../data/seoulSubway'
import { BUS_GAP_M, distanceMeters, formatDistance, getLastFix, watchHere } from '../lib/geo'

export default function WatchingScreen({ destination, alarm, onStop, onWake }) {
  const [here, setHere] = useState(() => getLastFix())
  const [geoError, setGeoError] = useState('')
  const [startedAt] = useState(() => Date.now())
  const [now, setNow] = useState(Date.now())
  const woke = useRef(false)
  const before = destination.wakeBefore || 1

  useEffect(() => {
    alarm.unlock()
    const tick = setInterval(() => setNow(Date.now()), 1000)
    const stopWatch = watchHere(
      (next) => {
        setHere(next)
        setGeoError('')
      },
      (message) => setGeoError(message),
    )
    return () => {
      clearInterval(tick)
      stopWatch()
    }
  }, [alarm])

  const meters =
    here && destination.lat
      ? distanceMeters(here, { lat: destination.lat, lng: destination.lng })
      : null

  const hopsLeft = (() => {
    if (destination.mode === 'bus' && here && destination.routeId && destination.destId != null) {
      const left = hopsLeftOnRoute(destination.routeId, destination.destId, here)
      if (left != null) return left
    }
    if (destination.mode === 'subway' && here && destination.lineId) {
      const line = getLine(destination.lineId)
      if (line) {
        let nearest = null
        let nearestMeters = Infinity
        for (const station of line.stations) {
          if (station.lat == null || station.lng == null) continue
          const d = distanceMeters(here, station)
          if (d < nearestMeters) {
            nearestMeters = d
            nearest = station
          }
        }
        if (nearest && nearestMeters <= 800) {
          if (nearest.name === destination.destName || nearest.name === destination.name) return 0
          return remainingStops(line, nearest.name, destination.destName || destination.name) ?? 0
        }
      }
    }
    if (meters == null) return null
    return Math.max(0, Math.round(meters / BUS_GAP_M))
  })()

  useEffect(() => {
    if (woke.current) return
    const ready = now - startedAt >= 20 * 1000
    const byStops = hopsLeft != null && hopsLeft <= before && ready
    const byGps = meters != null && meters <= BUS_GAP_M * before
    if (byGps || byStops) {
      woke.current = true
      onWake()
    }
  }, [meters, hopsLeft, now, startedAt, onWake, before])

  return (
    <main className="screen watching">
      <p className="brand brand-sm">편히자</p>
      <p className="eyebrow">감시 중 · {before}정거장 전</p>
      <h1>{destination.mode === 'bus' ? '버스' : '지하철'}</h1>
      <p className="place">{destination.label || destination.destName || destination.name}</p>

      <div className="stat">
        <strong>{hopsLeft ?? '—'}정거장</strong>
        <span>남음 · GPS {formatDistance(meters)}</span>
      </div>

      <p className="hint">화면을 켠 채로 두세요. 가까이 오면 소리와 진동으로 깨웁니다.</p>
      {geoError && <p className="hint">{geoError}</p>}

      <button type="button" className="ghost big" onClick={onStop}>
        중지
      </button>
    </main>
  )
}
