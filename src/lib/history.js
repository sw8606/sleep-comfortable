import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
} from 'firebase/firestore'
import { db } from './firebase'

const MAX_HISTORY = 20

function historyRef(uid, id) {
  return doc(db, 'users', uid, 'history', id)
}

export function historyId(place) {
  if (place.mode === 'bus') {
    return `bus_${place.routeId || 'x'}_${place.destId ?? place.destName}`.replace(/\//g, '_')
  }
  return `sub_${place.lineId}_${place.destName}`.replace(/\//g, '_')
}

function toDoc(place, uid, id) {
  const data = {
    uid,
    id,
    mode: place.mode,
    label: String(place.label || place.destName || place.name).slice(0, 80),
    destName: String(place.destName || place.name).slice(0, 40),
    lat: place.lat,
    lng: place.lng,
    wakeBefore: place.wakeBefore || 1,
    usedAt: Date.now(),
  }
  if (place.mode === 'subway') {
    data.lineId = place.lineId
    data.lineName = place.lineName
  }
  if (place.mode === 'bus') {
    if (place.destId != null) data.destId = Number(place.destId)
    if (place.routeId) data.routeId = String(place.routeId)
    if (place.routeName) data.routeName = String(place.routeName).slice(0, 40)
  }
  return data
}

export async function listHistory(uid) {
  const snap = await getDocs(collection(db, 'users', uid, 'history'))
  return snap.docs
    .map((d) => d.data())
    .sort((a, b) => (b.usedAt || 0) - (a.usedAt || 0))
}

export async function saveHistory(uid, place) {
  const id = historyId(place)
  await setDoc(historyRef(uid, id), toDoc(place, uid, id))
  let list = await listHistory(uid)
  const extra = list.slice(MAX_HISTORY)
  await Promise.all(extra.map((item) => deleteDoc(historyRef(uid, item.id))))
  return list.slice(0, MAX_HISTORY)
}

export async function deleteHistory(uid, id) {
  await deleteDoc(historyRef(uid, id))
  return listHistory(uid)
}
