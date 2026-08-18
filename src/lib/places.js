import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
} from 'firebase/firestore'
import { db } from './firebase'

function placeRef(uid, name) {
  return doc(db, 'users', uid, 'places', name)
}

function toDoc(place, uid) {
  const data = {
    uid,
    name: place.name,
    mode: place.mode,
    label: place.label,
    lat: place.lat,
    lng: place.lng,
    destName: place.destName || place.name,
    wakeBefore: place.wakeBefore || 1,
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

export async function listPlaces(uid) {
  const snap = await getDocs(collection(db, 'users', uid, 'places'))
  return snap.docs.map((d) => d.data())
}

export async function savePlace(uid, place) {
  await setDoc(placeRef(uid, place.name), toDoc(place, uid))
  return listPlaces(uid)
}

export async function deletePlace(uid, name) {
  await deleteDoc(placeRef(uid, name))
  return listPlaces(uid)
}
