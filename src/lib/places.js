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
  }
  if (place.mode === 'subway') {
    data.lineId = place.lineId
    data.lineName = place.lineName
    data.boardName = place.boardName
    data.destName = place.destName
    data.hops = place.hops
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
