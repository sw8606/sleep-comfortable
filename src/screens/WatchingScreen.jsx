import { useEffect, useRef, useState } from 'react'
import { hopsLeftOnRoute } from '../lib/busRoutes'
import { getLine, isNearSubwayWakeStation } from '../data/seoulSubway'
import {
  BUS_GAP_M,
  distanceMeters,
  formatDistance,
  getLastFix,
  isFixUsable,
  watchHere,
} from '../lib/geo'

export default function WatchingScreen({ destination, alarm, onStop, onWake }) {
  const [here, setHere] = useState(() => getLastFix())
  const [geoError, setGeoError] = useState('')
  const [startedAt] = useState(() => Date.now())
  const [now, setNow] = useState(Date.now())
  const woke = useRef(false)
  const before = destination.wakeBefore || 1
  const gpsOk = isFixUsable(here)
  const destName = destination.destName || destination.name
  const subway = destination.mode === 'subway'

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
    gpsOk && destination.lat
      ? distanceMeters(here, { lat: destination.lat, lng: destination.lng })
      : null

  const hopsLeft =
    !subway && gpsOk && destination.routeId && destination.destId != null
      ? hopsLeftOnRoute(destination.routeId, destination.destId, here)
      : null

  const nearSubwayWake =
    subway && gpsOk && destination.lineId
      ? isNearSubwayWakeStation(getLine(destination.lineId), destName, here, before)
      : false

  useEffect(() => {
    if (woke.current || !gpsOk) return
    const ready = now - startedAt >= 20 * 1000
    const bySubway = subway && nearSubwayWake && ready
    const byStops = !subway && hopsLeft != null && hopsLeft <= before && ready
    const byGps = !subway && meters != null && meters <= BUS_GAP_M * before
    if (bySubway || byStops || byGps) {
      woke.current = true
      onWake()
    }
  }, [meters, hopsLeft, nearSubwayWake, subway, now, startedAt, onWake, before, gpsOk])

  const lastMeters = useRef(null)
  if (gpsOk && meters != null) lastMeters.current = meters
  const shownMeters = gpsOk ? meters : lastMeters.current

  return (
    <main className="screen watching">
      <p className="brand brand-sm">편히자</p>
      <p className="eyebrow">감시 중</p>
      <h1>{subway ? '지하철' : '버스'}</h1>
      <p className="place">{destination.label || destName}</p>

      <div className="stat">
        <strong>{shownMeters == null ? '—' : formatDistance(shownMeters)}</strong>
        <span>{shownMeters == null ? '위치 확인 중' : gpsOk ? '남음' : '남음 · GPS가 잠깐 끊김'}</span>
      </div>

      <p className="hint">화면을 켠 채로 두세요. 가까이 오면 소리와 진동으로 깨웁니다.</p>
      {!gpsOk && shownMeters == null && (
        <p className="hint">
          PC·Wi‑Fi만 쓰면 위치가 수 km 어긋날 수 있어요. 휴대폰에서 GPS를 켜고 위치 권한을 허용해 주세요.
        </p>
      )}
      {geoError && <p className="hint">{geoError}</p>}

      <button type="button" className="ghost big" onClick={onStop}>
        중지
      </button>
    </main>
  )
}
