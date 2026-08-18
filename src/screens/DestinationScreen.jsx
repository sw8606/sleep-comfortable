import { useEffect, useMemo, useState } from 'react'
import { getLine, remainingStops, searchStations } from '../data/seoulSubway'
import {
  listDistricts,
  listDongs,
  listRegions,
  listStopsByArea,
  nearbyBusStops,
  searchBusStops,
} from '../lib/searchStops'

export default function DestinationScreen({
  user,
  places,
  onStart,
  onSave,
  onRemove,
  onLogout,
}) {
  const [mode, setMode] = useState('bus')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [busStop, setBusStop] = useState(null)
  const [dest, setDest] = useState(null)
  const [boardQuery, setBoardQuery] = useState('')
  const [board, setBoard] = useState(null)
  const [city, setCity] = useState('')
  const [district, setDistrict] = useState('')
  const [dong, setDong] = useState('')
  const [areaQuery, setAreaQuery] = useState('')

  const line = dest ? getLine(dest.lineId) : null
  const boardOptions = useMemo(() => {
    if (!line) return []
    const q = boardQuery.trim()
    return line.stations.filter((s) => !q || s.name.includes(q)).slice(0, 20)
  }, [line, boardQuery])

  const hops =
    dest && board && line ? remainingStops(line, board.name, dest.name) : null

  const destination = useMemo(() => {
    if (mode === 'bus' && busStop) {
      return {
        mode: 'bus',
        name: busStop.name,
        lat: busStop.lat,
        lng: busStop.lng,
        label: busStop.name,
      }
    }
    if (mode === 'subway' && dest && board && hops >= 1) {
      return {
        mode: 'subway',
        name: dest.name,
        lineId: dest.lineId,
        lineName: dest.lineName,
        boardName: board.name,
        destName: dest.name,
        lat: dest.lat,
        lng: dest.lng,
        hops,
        label: `${board.name} → ${dest.name} (${dest.lineName})`,
      }
    }
    return null
  }, [mode, busStop, dest, board, hops])

  useEffect(() => {
    setResults([])
    setError('')
    setQuery('')
    setBusStop(null)
    setDest(null)
    setBoard(null)
    setBoardQuery('')
    setCity('')
    setDistrict('')
    setDong('')
    setAreaQuery('')
  }, [mode])

  const regions = listRegions()
  const districts = city ? listDistricts(city) : []
  const dongs = city && district ? listDongs(city, district) : []
  const showDong = dongs.some((item) => item !== '전체')

  useEffect(() => {
    if (mode !== 'bus' || !city || !district) return
    if (showDong && !dong) {
      setResults([])
      return
    }
    const list = listStopsByArea({
      city,
      district,
      dong: showDong ? dong : '전체',
      keyword: areaQuery,
    })
    setResults(list)
    if (list.length === 0) setError('이 지역에 정류장이 없습니다.')
    else setError('')
  }, [mode, city, district, dong, areaQuery, showDong])

  async function runBusSearch(e) {
    e?.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setError('')
    try {
      const list = await searchBusStops(query)
      setResults(list)
      if (list.length === 0) setError('정류장이 없습니다. 다른 이름으로 찾아 보세요.')
    } catch {
      setError('정류장 검색에 실패했습니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      setLoading(false)
    }
  }

  async function runNearby() {
    setLoading(true)
    setError('')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const list = await nearbyBusStops(pos.coords.latitude, pos.coords.longitude)
          setResults(list)
          if (list.length === 0) setError('근처에 정류장이 없습니다.')
        } catch {
          setError('근처 정류장을 찾지 못했습니다.')
        } finally {
          setLoading(false)
        }
      },
      () => {
        setLoading(false)
        setError('위치 권한이 필요합니다.')
      },
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }

  function runSubwaySearch(e) {
    e?.preventDefault()
    const list = searchStations(query)
    setResults(list)
    if (list.length === 0) setError('역이 없습니다. 역 이름 일부를 적어 보세요.')
    else setError('')
  }

  return (
    <main className="screen">
      <header className="top">
        <p className="eyebrow">편히자</p>
        <h1>내릴 곳</h1>
        <p className="lead">버스나 지하철을 고르고, 내릴 곳만 찾으면 됩니다.</p>
        <div className="user-row">
          <span>{user?.displayName || user?.email || '로그인됨'}</span>
          <button type="button" className="ghost small" onClick={onLogout}>
            로그아웃
          </button>
        </div>
      </header>

      {places.length > 0 && (
        <section className="block">
          <h2>자주 가는 곳</h2>
          <div className="chips">
            {places.map((place) => (
              <div className="chip-row" key={place.name}>
                <button type="button" className="chip primary" onClick={() => onStart(place)}>
                  {place.name}
                  <span>{place.label}</span>
                </button>
                <button
                  type="button"
                  className="ghost small"
                  onClick={() => onRemove(place.name)}
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        </section>
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

      <form
        className="search"
        onSubmit={mode === 'bus' ? runBusSearch : runSubwaySearch}
      >
        <label>
          {mode === 'bus' ? '정류장 이름' : '내릴 역 이름'}
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={mode === 'bus' ? '예: 동대입구' : '예: 동대입구'}
            autoComplete="off"
          />
        </label>
        <button type="submit" className="primary" disabled={loading}>
          {loading ? '찾는 중…' : '검색'}
        </button>
      </form>

      {mode === 'bus' && (
        <>
          <section className="block picks">
            <h2>지역으로 고르기</h2>
            <select
              value={city}
              onChange={(e) => {
                setCity(e.target.value)
                setDistrict('')
                setDong('')
                setAreaQuery('')
                setBusStop(null)
                setResults([])
              }}
            >
              <option value="">시 선택</option>
              {regions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select
              value={district}
              disabled={!city}
              onChange={(e) => {
                setDistrict(e.target.value)
                setDong('')
                setAreaQuery('')
                setBusStop(null)
              }}
            >
              <option value="">구/시 선택</option>
              {districts.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            {showDong && (
              <select
                value={dong}
                disabled={!district}
                onChange={(e) => {
                  setDong(e.target.value)
                  setBusStop(null)
                }}
              >
                <option value="">동 선택</option>
                {dongs.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            )}
            {city && district && (!showDong || dong) && (
              <input
                value={areaQuery}
                onChange={(e) => setAreaQuery(e.target.value)}
                placeholder="이 지역에서 이름 찾기"
                autoComplete="off"
              />
            )}
          </section>
          <button type="button" className="ghost" onClick={runNearby} disabled={loading}>
            내 근처 정류장
          </button>
        </>
      )}

      {error && <p className="error">{error}</p>}

      {results.length > 0 && (
        <ul className="list">
          {results.map((item) => {
            const selected =
              mode === 'bus'
                ? busStop && busStop.lat === item.lat && busStop.name === item.name
                : dest && dest.name === item.name && dest.lineId === item.lineId
            return (
              <li key={`${item.name}-${item.lat}-${item.lineId || ''}`}>
                <button
                  type="button"
                  className={selected ? 'row on' : 'row'}
                  onClick={() => {
                    if (mode === 'bus') {
                      setBusStop(item)
                    } else {
                      setDest(item)
                      setBoard(null)
                    }
                  }}
                >
                  <strong>{item.name}</strong>
                  <span>
                    {item.lineName ||
                      (item.meters != null
                        ? `버스 정류장 · ${Math.round(item.meters)}m`
                        : [item.city, item.district, item.dong !== '전체' ? item.dong : '']
                            .filter(Boolean)
                            .join(' ') || '버스 정류장')}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {mode === 'subway' && dest && (
        <section className="block">
          <h2>지금 타는 역 · {dest.lineName}</h2>
          <input
            value={boardQuery}
            onChange={(e) => setBoardQuery(e.target.value)}
            placeholder="탑승역 검색"
            autoComplete="off"
          />
          <ul className="list short">
            {boardOptions.map((st) => (
              <li key={st.name}>
                <button
                  type="button"
                  className={board?.name === st.name ? 'row on' : 'row'}
                  onClick={() => setBoard(st)}
                >
                  <strong>{st.name}</strong>
                </button>
              </li>
            ))}
          </ul>
          {board && hops != null && hops < 1 && (
            <p className="error">같은 역입니다. 다른 탑승역을 고르세요.</p>
          )}
          {board && hops >= 1 && (
            <p className="hint">{hops}정거장 남음 · 1정거장 전에 깨웁니다.</p>
          )}
        </section>
      )}

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
            onClick={() => onSave({ ...destination, name: '학교' })}
          >
            학교로 저장
          </button>
          <button
            type="button"
            className="ghost"
            disabled={!destination}
            onClick={() => onSave({ ...destination, name: '집' })}
          >
            집으로 저장
          </button>
        </div>
      </div>
    </main>
  )
}
