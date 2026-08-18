import { useEffect, useMemo, useRef, useState } from 'react'
import { listLines, listStationsOnLine, searchStations } from '../data/seoulSubway'
import { getBusRoute, listStopsOnRoute, searchBusRoutes } from '../lib/busRoutes'
import { warmLocation } from '../lib/geo'
import HistorySidebar from './HistorySidebar.jsx'
import LoginScreen from './LoginScreen.jsx'

const WAKE_CHOICES = [1, 2, 3, 4, 5]

export default function DestinationScreen({
  user,
  places,
  history = [],
  needLogin,
  signingIn,
  authError,
  onStart,
  onSave,
  onRemove,
  onRemoveHistory,
  onLogout,
  onGoogle,
  onAskLogin,
  onSkipLogin,
}) {
  const [mode, setMode] = useState('bus')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [error, setError] = useState('')
  const [busDest, setBusDest] = useState(null)
  const [dest, setDest] = useState(null)
  const [pickLineId, setPickLineId] = useState('')
  const [wakeBefore, setWakeBefore] = useState(1)
  const [routeQuery, setRouteQuery] = useState('')
  const [routeHits, setRouteHits] = useState([])
  const [busRoute, setBusRoute] = useState(null)
  const [routeStopQuery, setRouteStopQuery] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [toast, setToast] = useState('')
  const loginCardRef = useRef(null)

  useEffect(() => {
    warmLocation()
  }, [])

  useEffect(() => {
    if (busDest || dest) warmLocation()
  }, [busDest, dest])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 3200)
    return () => clearTimeout(timer)
  }, [toast])

  const lineStations = pickLineId ? listStationsOnLine(pickLineId) : []

  const routeStops = useMemo(() => {
    if (!busRoute) return []
    return listStopsOnRoute(busRoute.routeId, routeStopQuery)
  }, [busRoute, routeStopQuery])

  const destination = useMemo(() => {
    if (mode === 'bus' && busDest && busRoute) {
      const routeName = busRoute.number
      const label = `${routeName} · ${busDest.name}`
      return {
        mode: 'bus',
        name: busDest.name,
        destName: busDest.name.slice(0, 40),
        destId: busDest.id,
        lat: busDest.lat,
        lng: busDest.lng,
        wakeBefore,
        routeId: busRoute.routeId,
        routeName: routeName.slice(0, 40),
        label: label.slice(0, 80),
      }
    }
    if (mode === 'subway' && dest) {
      const label = `${dest.name} (${dest.lineName})`
      return {
        mode: 'subway',
        name: dest.name,
        destName: dest.name.slice(0, 40),
        lineId: dest.lineId,
        lineName: dest.lineName,
        lat: dest.lat,
        lng: dest.lng,
        wakeBefore,
        label: label.length > 80 ? dest.name : label,
      }
    }
    return null
  }, [mode, busDest, dest, wakeBefore, busRoute])

  useEffect(() => {
    setResults([])
    setError('')
    setQuery('')
    setBusDest(null)
    setDest(null)
    setPickLineId('')
    setWakeBefore(1)
    setRouteQuery('')
    setRouteHits([])
    setBusRoute(null)
    setRouteStopQuery('')
  }, [mode])

  function runSubwaySearch(e) {
    e?.preventDefault()
    const list = searchStations(query)
    setResults(list)
    if (list.length === 0) setError('역이 없습니다. 역 이름 일부를 적어 보세요.')
    else setError('')
  }

  function runRouteSearch(e) {
    e?.preventDefault()
    if (!routeQuery.trim()) return
    const list = searchBusRoutes(routeQuery)
    setRouteHits(list)
    setBusRoute(null)
    setBusDest(null)
    setRouteStopQuery('')
    if (list.length === 0) setError('버스 번호가 없습니다. 번호를 다시 확인해 보세요.')
    else setError('')
  }

  function pickRoute(item) {
    setBusRoute(getBusRoute(item.routeId) || item)
    setBusDest(null)
    setRouteStopQuery('')
    setError('')
  }

  function sameStop(a, b) {
    if (!a || !b) return false
    if (a.id != null && b.id != null) return a.id === b.id
    return a.name === b.name && a.lat === b.lat
  }

  function requestSave(placeName) {
    if (!destination) return
    onSave({ ...destination, name: placeName })
    if (!user) {
      setToast(`${placeName}로 저장하려면 Google 로그인이 필요해요`)
      loginCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setToast(`${placeName}로 저장했어요`)
  }

  const selected = mode === 'bus' ? busDest : dest

  return (
    <div className={user ? 'home-shell' : undefined}>
      {user && (
        <HistorySidebar
          open={sidebarOpen}
          places={places}
          history={history}
          onStart={(place) => {
            setSidebarOpen(false)
            onStart(place)
          }}
          onRemovePlace={onRemove}
          onRemoveHistory={onRemoveHistory}
          onClose={() => setSidebarOpen(false)}
        />
      )}
    <main className="screen">
      <header className="top">
        <h1 className="brand">편히자</h1>
        <p className="lead">내릴 곳을 고르고, 몇 정거장 전에 깨울지 정하세요.</p>
        <div className="user-row">
          {user && (
            <button
              type="button"
              className="ghost small menu-btn"
              onClick={() => setSidebarOpen((open) => !open)}
            >
              {sidebarOpen ? '닫기' : '내 정류장'}
            </button>
          )}
          {user ? (
            <>
              <span>{user.displayName || user.email}</span>
              <button type="button" className="ghost small" onClick={onLogout}>
                로그아웃
              </button>
            </>
          ) : null}
        </div>
      </header>

      {!user && (
        <div ref={loginCardRef}>
          <LoginScreen
            compact
            highlight={needLogin}
            onGoogle={onGoogle}
            loading={signingIn}
            error={authError}
            onSkip={needLogin ? onSkipLogin : undefined}
          />
        </div>
      )}

      <div className="tabs">
        <button
          type="button"
          className={mode === 'bus' ? 'tab on' : 'tab'}
          onClick={() => setMode('bus')}
        >
          버스
        </button>
        <button
          type="button"
          className={mode === 'subway' ? 'tab on' : 'tab'}
          onClick={() => setMode('subway')}
        >
          지하철
        </button>
      </div>

      {mode === 'bus' && (
        <section className="block picks">
          <h2>버스 번호</h2>
          <form className="search" onSubmit={runRouteSearch}>
            <input
              value={routeQuery}
              onChange={(e) => setRouteQuery(e.target.value)}
              placeholder="예: 151, 01A, 96-1"
              autoComplete="off"
            />
            <button type="submit" className="primary">
              노선 찾기
            </button>
          </form>
          {routeHits.length > 0 && (
            <ul className="list">
              {routeHits.map((item) => (
                <li key={item.routeId}>
                  <button
                    type="button"
                    className={busRoute?.routeId === item.routeId ? 'row on' : 'row'}
                    onClick={() => pickRoute(item)}
                  >
                    <strong>{item.number}</strong>
                    <span>
                      {item.city} · {item.stopCount}정류장
                      {item.startName && item.endName ? ` · ${item.startName} → ${item.endName}` : ''}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {busRoute && (
            <>
              <h2>{busRoute.number} 내릴 정류장</h2>
              <input
                value={routeStopQuery}
                onChange={(e) => setRouteStopQuery(e.target.value)}
                placeholder="이 노선에서 이름 찾기"
                autoComplete="off"
              />
              <ul className="list tall">
                {routeStops.map((item) => (
                  <li key={`${item.id}-${item.seq}`}>
                    <button
                      type="button"
                      className={sameStop(busDest, item) ? 'row on' : 'row'}
                      onClick={() => setBusDest(item)}
                    >
                      <strong>{item.name}</strong>
                      <span>
                        {item.seq}번째
                        {item.district ? ` · ${item.district}` : ''}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              {routeStops.length === 0 && (
                <p className="hint">이 노선에서 해당 이름의 정류장이 없습니다.</p>
              )}
            </>
          )}
        </section>
      )}

      {mode === 'subway' && (
        <>
          <form className="search" onSubmit={runSubwaySearch}>
            <label>
              내릴 역 이름
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="예: 동대입구"
                autoComplete="off"
              />
            </label>
            <button type="submit" className="primary">
              검색
            </button>
          </form>
          <section className="block picks">
            <h2>호선으로 고르기</h2>
            <select
              value={pickLineId}
              onChange={(e) => {
                setPickLineId(e.target.value)
                setDest(null)
                setResults([])
                setError('')
              }}
            >
              <option value="">호선 선택</option>
              {listLines().map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <select
              value={dest && dest.lineId === pickLineId ? dest.name : ''}
              disabled={!pickLineId}
              onChange={(e) => {
                const next = lineStations.find((st) => st.name === e.target.value)
                setDest(next || null)
                setResults([])
              }}
            >
              <option value="">내릴 역 선택</option>
              {lineStations.map((st) => (
                <option key={st.name} value={st.name}>
                  {st.name}
                </option>
              ))}
            </select>
          </section>
        </>
      )}

      {error && <p className="error">{error}</p>}

      {mode === 'subway' && results.length > 0 && (
        <ul className="list">
          {results.map((item) => {
            const on = dest && dest.name === item.name && dest.lineId === item.lineId
            return (
              <li key={`${item.name}-${item.lat}-${item.lineId || ''}`}>
                <button
                  type="button"
                  className={on ? 'row on' : 'row'}
                  onClick={() => setDest(item)}
                >
                  <strong>{item.name}</strong>
                  <span>{item.lineName}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {selected && (
        <section className="block trip">
          <h2>내릴 곳</h2>
          <p>
            <strong>{selected.name}</strong>
            {mode === 'subway' && dest?.lineName ? ` · ${dest.lineName}` : ''}
            {mode === 'bus' && busRoute?.number ? ` · ${busRoute.number}` : ''}
          </p>
          <p className="hint">{wakeBefore}정거장 전에 깨웁니다.</p>
        </section>
      )}

      <section className="block">
        <h2>몇 정거장 전에 깨울까요</h2>
        <div className="wake-picks">
          {WAKE_CHOICES.map((n) => (
            <button
              key={n}
              type="button"
              className={wakeBefore === n ? 'chip on' : 'chip'}
              onClick={() => setWakeBefore(n)}
            >
              {n}정거장 전
            </button>
          ))}
        </div>
      </section>

      <div className="actions">
        <button
          type="button"
          className="primary big"
          disabled={!destination}
          onClick={() => onStart(destination)}
        >
          감시 시작
        </button>
        <div className="save-row">
          <button
            type="button"
            className="ghost"
            disabled={!destination}
            onClick={() => requestSave('학교')}
          >
            학교로 저장
          </button>
          <button
            type="button"
            className="ghost"
            disabled={!destination}
            onClick={() => requestSave('직장')}
          >
            직장으로 저장
          </button>
          <button
            type="button"
            className="ghost"
            disabled={!destination}
            onClick={() => requestSave('집')}
          >
            집으로 저장
          </button>
        </div>
      </div>
      {toast && (
        <p className="toast" role="status">
          {toast}
        </p>
      )}
    </main>
    </div>
  )
}
