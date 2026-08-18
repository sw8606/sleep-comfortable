import { useEffect, useRef, useState } from 'react'
import { distanceMeters, formatDistance } from '../lib/geo'

const BUS_WAKE_M = 250
const SUBWAY_WAKE_M = 400
const STATION_MS = 2 * 60 * 1000

export default function WatchingScreen({ destination, alarm, onStop, onWake }) {
  const [now, setNow] = useState(Date.now())
  const [here, setHere] = useState(null)
  const [geoError, setGeoError] = useState('')
  const [startedAt] = useState(() => Date.now())
  const woke = useRef(false)

  useEffect(() => {
    alarm.unlock()
    const tick = setInterval(() => setNow(Date.now()), 1000)
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setHere({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setGeoError('')
      },
      () => setGeoError('GPS를 기다리는 중. 탭은 켠 채로 두세요.'),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 },
    )
    return () => {
      clearInterval(tick)
      navigator.geolocation.clearWatch(watchId)
    }
  }, [alarm])

  const meters =
    here && destination.lat
      ? distanceMeters(here, { lat: destination.lat, lng: destination.lng })
      : null

  const hopsLeft = (() => {
    if (destination.mode !== 'subway') return null
    const elapsed = now - startedAt
    if (destination.hops === 1) {
      return elapsed >= 60 * 1000 ? 0 : 1
    }
    const passed = Math.floor(elapsed / STATION_MS)
    return Math.max(0, destination.hops - passed)
  })()

  useEffect(() => {
    if (woke.current) return
    if (destination.mode === 'bus' && meters != null && meters <= BUS_WAKE_M) {
      woke.current = true
      onWake()
      return
    }
    if (destination.mode === 'subway') {
      const byGps = meters != null && meters <= SUBWAY_WAKE_M
      const byStops = hopsLeft != null && hopsLeft <= 1 && now - startedAt >= 30 * 1000
      if (byGps || byStops) {
        woke.current = true
        onWake()
      }
    }
  }, [destination, meters, hopsLeft, now, startedAt, onWake])

  return (
    <main className="screen watching">
      <p className="eyebrow">감시 중</p>
      <h1>{destination.mode === 'bus' ? '버스' : '지하철'}</h1>
      <p className="place">{destination.label}</p>

      <div className="stat">
        {destination.mode === 'bus' ? (
          <>
            <strong>{formatDistance(meters)}</strong>
            <span>내릴 곳까지</span>
          </>
        ) : (
          <>
            <strong>{hopsLeft ?? '—'}정거장</strong>
            <span>남음 · GPS {formatDistance(meters)}</span>
          </>
        )}
      </div>

      <p className="hint">화면을 켠 채로 두세요. 가까이 오면 소리와 진동으로 깨웁니다.</p>
      {geoError && <p className="hint">{geoError}</p>}

      <button type="button" className="ghost big" onClick={onStop}>
        중지
      </button>
    </main>
  )
}
