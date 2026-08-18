import fs from 'fs'

const GU = {
  '01': '종로구',
  '02': '중구',
  '03': '용산구',
  '04': '성동구',
  '05': '광진구',
  '06': '동대문구',
  '07': '중랑구',
  '08': '성북구',
  '09': '강북구',
  '10': '도봉구',
  '11': '노원구',
  '12': '은평구',
  '13': '서대문구',
  '14': '마포구',
  '15': '양천구',
  '16': '강서구',
  '17': '구로구',
  '18': '금천구',
  '19': '영등포구',
  '20': '동작구',
  '21': '관악구',
  '22': '서초구',
  '23': '강남구',
  '24': '송파구',
  '25': '강동구',
}

const seoulRaw = JSON.parse(fs.readFileSync('서울시 버스정류소 위치정보.json', 'utf8'))
const seoul = seoulRaw.DATA.map((d) => {
  const prefix = String(d.node_id || '').padStart(5, '0').slice(0, 2)
  return {
    name: d.stops_nm,
    lat: Number(d.ycrd),
    lng: Number(d.xcrd),
    city: '서울',
    district: GU[prefix] || '기타',
    dong: '전체',
  }
}).filter((s) => s.name && Number.isFinite(s.lat) && Number.isFinite(s.lng))
fs.writeFileSync('src/data/seoulBusStops.json', JSON.stringify(seoul))
console.log('seoul', seoul.length)

function parseGyeonggi(loc, sigun) {
  let s = String(loc || '')
    .replace(/^경기도\s*/, '')
    .trim()
  s = s.replace(/시([가-힣]+구)/g, '시 $1')
  const parts = s.split(/\s+/).filter(Boolean)
  let district = sigun || '기타'
  let dong = ''
  if (parts[0]?.endsWith('시') && parts[1]?.endsWith('구')) {
    district = `${parts[0]} ${parts[1]}`
    dong = parts.slice(2).join(' ')
  } else if (parts.length >= 2) {
    district = parts[0]
    dong = parts.slice(1).join(' ')
  } else if (parts.length === 1) {
    district = parts[0]
  }
  return { district, dong: dong || '기타' }
}

const gRaw = JSON.parse(fs.readFileSync('버스정류소현황.json', 'utf8'))
const gyeonggi = gRaw
  .map((d) => {
    const { district, dong } = parseGyeonggi(d.locplc_loc, d.sigun_nm)
    return {
      name: d.sttn_nm_info,
      lat: Number(d.wgs84_lat),
      lng: Number(d.wgs84_logt),
      city: '경기',
      district,
      dong,
    }
  })
  .filter((s) => s.name && Number.isFinite(s.lat) && Number.isFinite(s.lng))
fs.writeFileSync('src/data/gyeonggiBusStops.json', JSON.stringify(gyeonggi))
console.log('gyeonggi', gyeonggi.length)
console.log(gyeonggi.find((s) => s.name.includes('수원역')))
