import fs from 'fs'
import path from 'path'
import XLSX from 'xlsx'

const SOURCE = '서울교통공사_노선별 지하철역 정보.json'
const COORDS_XLSX = '전체_도시철도역사정보_20260630.xlsx'
const OUT = 'src/data/seoulSubwayLines.json'
const LOOP_LINES = new Set(['02호선'])

const LINE_TO_XLSX = {
  '01호선': ['1호선', '경원선', '경인선', '경부선', '장항선'],
  '02호선': ['2호선'],
  '03호선': ['3호선', '일산선'],
  '04호선': ['4호선', '안산과천선', '진접선'],
  '05호선': ['5호선'],
  '06호선': ['6호선'],
  '07호선': ['7호선', '도시철도 7호선'],
  '08호선': ['8호선', '수도권 광역철도 8호선'],
  '09호선': ['서울 도시철도 9호선', '수도권  도시철도 9호선', '수도권 도시철도 9호선'],
  'GTX-A': [],
  경강선: ['경강선'],
  경의선: ['경의중앙선'],
  경춘선: ['경춘선'],
  공항철도: ['인천국제공항선'],
  김포도시철도: ['김포도시철도'],
  서해선: ['서해선'],
  수인분당선: ['분당선', '수인선'],
  신림선: ['수도권 경량도시철도 신림선'],
  신분당선: ['신분당선'],
  용인경전철: ['에버라인'],
  우이신설경전철: ['우이신설선'],
  의정부경전철: ['의정부'],
  인천2호선: ['인천지하철 2호선'],
  인천선: ['인천지하철 1호선'],
}

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

function normName(value) {
  return String(value || '')
    .replace(/\(.*?\)/g, '')
    .replace(/역$/g, '')
    .replace(/[·.\s]/g, '')
    .trim()
}

function toPoint(lat, lng) {
  const y = Number(lat)
  const x = Number(lng)
  if (!Number.isFinite(y) || !Number.isFinite(x)) return null
  if (y < 33 || y > 39 || x < 124 || x > 132) return null
  return { lat: y, lng: x }
}

function loadXlsxCoords() {
  const byLine = new Map()
  const byName = new Map()
  if (!fs.existsSync(COORDS_XLSX)) return { byLine, byName }

  const wb = XLSX.readFile(COORDS_XLSX)
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' })

  for (const row of rows) {
    const name = normName(row['역사명'])
    const line = String(row['노선명'] || '').replace(/\s+/g, ' ').trim()
    const point = toPoint(row['역위도'], row['역경도'])
    if (!name || !point) continue
    if (!byLine.has(line)) byLine.set(line, new Map())
    if (!byLine.get(line).has(name)) byLine.get(line).set(name, point)
    if (!byName.has(name)) byName.set(name, point)
  }
  return { byLine, byName }
}

const NAME_ALIAS = {
  서해구청: '서구청',
}

function lookupCoord(xlsx, prev, name, lineId) {
  const keys = [normName(name), normName(NAME_ALIAS[name] || '')].filter(Boolean)
  const aliases = LINE_TO_XLSX[lineId] || []
  for (const key of keys) {
    for (const line of aliases) {
      const hit = xlsx.byLine.get(line)?.get(key)
      if (hit) return hit
    }
  }
  for (const key of keys) {
    if (xlsx.byName.has(key)) return xlsx.byName.get(key)
  }
  return prev[name] || prev[normName(name)] || null
}

function loadPrevCoords() {
  const coords = {}
  if (!fs.existsSync(OUT)) return coords
  const prev = JSON.parse(fs.readFileSync(OUT, 'utf8'))
  for (const line of prev) {
    for (const st of line.stations || []) {
      if (st.lat == null || st.lng == null) continue
      if (!coords[st.name]) coords[st.name] = { lat: st.lat, lng: st.lng }
    }
  }
  return coords
}

const raw = JSON.parse(fs.readFileSync(SOURCE, 'utf8'))
const xlsx = loadXlsxCoords()
const prev = loadPrevCoords()
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
        const point = lookupCoord(xlsx, prev, st.name, id)
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
const missing = lines.flatMap((line) =>
  line.stations.filter((s) => s.lat == null).map((s) => `${line.name} ${s.name}`),
)
console.log('xlsx', path.basename(COORDS_XLSX), fs.existsSync(COORDS_XLSX) ? 'ok' : 'missing')
console.log('lines', lines.length)
console.log('stations', total)
console.log('with coords', withCoord)
if (missing.length) {
  console.log('missing', missing.length)
  console.log(missing.join('\n'))
}
