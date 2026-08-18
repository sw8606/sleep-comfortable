import fs from 'fs'

const SOURCE = '서울교통공사_노선별 지하철역 정보.json'
const OUT = 'src/data/seoulSubwayLines.json'
const LOOP_LINES = new Set(['02호선'])

function displayName(lineNum) {
  return String(lineNum).replace(/^0+(\d+)호선$/, '$1호선')
}

function frKey(code) {
  const s = String(code || '')
  const m = s.match(/^([A-Za-z]*)(\d+)(?:-(\d+))?/)
  if (!m) return ['~', 0, 0, s]
  return [m[1] || '', Number(m[2]), Number(m[3] || 0), s]
}

function sortFr(a, b) {
  const aa = frKey(a.fr)
  const bb = frKey(b.fr)
  return aa[0].localeCompare(bb[0]) || aa[1] - bb[1] || aa[2] - bb[2] || aa[3].localeCompare(bb[3])
}

function lineOrder(id) {
  const m = String(id).match(/^0*(\d+)호선$/)
  if (m) return Number(m[1])
  return 1000
}

function loadCoords() {
  const coords = {}
  const jsonPath = OUT
  if (fs.existsSync(jsonPath)) {
    const prev = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
    for (const line of prev) {
      for (const st of line.stations || []) {
        if (st.lat == null || st.lng == null) continue
        if (!coords[st.name]) coords[st.name] = { lat: st.lat, lng: st.lng }
      }
    }
  }
  const jsPath = 'src/data/seoulSubway.js'
  if (fs.existsSync(jsPath)) {
    const text = fs.readFileSync(jsPath, 'utf8')
    const re = /\['([^']+)',\s*([0-9.]+),\s*([0-9.]+)\]/g
    let m
    while ((m = re.exec(text))) {
      if (!coords[m[1]]) coords[m[1]] = { lat: Number(m[2]), lng: Number(m[3]) }
    }
  }
  return coords
}

const raw = JSON.parse(fs.readFileSync(SOURCE, 'utf8'))
const coords = loadCoords()
const byLine = new Map()

for (const row of raw.DATA || []) {
  const lineId = String(row.line_num || '').trim()
  const name = String(row.station_nm || '').trim()
  if (!lineId || !name) continue
  if (!byLine.has(lineId)) byLine.set(lineId, [])
  byLine.get(lineId).push({
    name,
    code: String(row.station_cd || ''),
    fr: String(row.fr_code || ''),
  })
}

const lines = [...byLine.entries()]
  .sort((a, b) => lineOrder(a[0]) - lineOrder(b[0]) || a[0].localeCompare(b[0], 'ko'))
  .map(([id, rows]) => {
    const seen = new Set()
    const stations = rows
      .sort(sortFr)
      .filter((st) => {
        const key = `${st.name}|${st.fr}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .map((st) => {
        const point = coords[st.name]
        const next = { name: st.name, code: st.code, fr: st.fr }
        if (point) {
          next.lat = point.lat
          next.lng = point.lng
        }
        return next
      })
    return {
      id,
      name: displayName(id),
      loop: LOOP_LINES.has(id),
      stations,
    }
  })

fs.writeFileSync(OUT, JSON.stringify(lines))
const withCoord = lines.reduce(
  (n, line) => n + line.stations.filter((s) => s.lat != null).length,
  0,
)
const total = lines.reduce((n, line) => n + line.stations.length, 0)
console.log('lines', lines.length)
console.log('stations', total)
console.log('with coords', withCoord)
