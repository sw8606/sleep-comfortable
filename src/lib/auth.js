import {
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from 'firebase/auth'
import { auth } from './firebase'

const provider = new GoogleAuthProvider()

export function watchUser(callback) {
  getRedirectResult(auth).catch(() => {})
  return onAuthStateChanged(auth, callback)
}

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, provider)
    return result.user
  } catch (error) {
    if (error.code === 'auth/popup-blocked') {
      await signInWithRedirect(auth, provider)
      return null
    }
    if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
      return null
    }
    throw error
  }
}

export function signOutUser() {
  return signOut(auth)
}

export function googleErrorMessage(error) {
  if (error?.code === 'auth/unauthorized-domain') {
    return '이 주소는 아직 허용되지 않았습니다. Firebase 인증 > 설정에서 localhost를 추가하세요.'
  }
  if (error?.code === 'auth/operation-not-allowed') {
    return 'Google 로그인이 꺼져 있습니다. Firebase 콘솔에서 Google 제공업체를 켜 주세요.'
  }
  return 'Google 로그인에 실패했습니다. 다시 시도해 주세요.'
}
