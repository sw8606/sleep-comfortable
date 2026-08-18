import fs from 'fs'

const raw = JSON.parse(fs.readFileSync('서울시 노선 정류장마스터 정보.json', 'utf8'))
const byRoute = new Map()

for (const row of raw.DATA) {
  const routeId = String(row.rte_id)
  const stopId = Number(row.crtr_id)
  const seq = Number(row.crtr_seq)
  if (!routeId || !Number.isFinite(stopId) || !Number.isFinite(seq)) continue
  if (!byRoute.has(routeId)) byRoute.set(routeId, [])
  byRoute.get(routeId).push({ stopId, seq })
}

const routes = {}
for (const [routeId, rows] of byRoute) {
  rows.sort((a, b) => a.seq - b.seq || a.stopId - b.stopId)
  routes[routeId] = rows.map((r) => r.stopId)
  if (routes[routeId].length < 2) delete routes[routeId]
}

const seoulNames = JSON.parse(fs.readFileSync('서울시 버스노선 기본정보 항목정보.json', 'utf8'))
const gyeonggiNames = JSON.parse(fs.readFileSync('경기도_BMS노선인가정보.json', 'utf8'))
const names = {}

for (const row of seoulNames.DATA) {
  const id = String(row.rte_id)
  const number = String(row.rte_nm || '').trim()
  if (!routes[id] || !number) continue
  names[id] = { n: number, c: '서울' }
}

for (const row of gyeonggiNames) {
  const id = String(row.route_id)
  const number = String(row.route_nm || '').trim()
  if (!routes[id] || !number || names[id]) continue
  names[id] = { n: number, c: '경기' }
}

fs.writeFileSync('src/data/seoulBusRoutes.json', JSON.stringify(routes))
fs.writeFileSync('src/data/busRouteNames.json', JSON.stringify(names))
console.log('routes', Object.keys(routes).length)
console.log('named', Object.keys(names).length)
