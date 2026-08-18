import { useEffect, useMemo, useState } from 'react'
import DestinationScreen from './screens/DestinationScreen.jsx'
import WatchingScreen from './screens/WatchingScreen.jsx'
import WakeScreen from './screens/WakeScreen.jsx'
import { createAlarm } from './lib/alarm.js'
import { googleErrorMessage, signInWithGoogle, signOutUser, watchUser } from './lib/auth.js'
import { deletePlace, listPlaces, savePlace } from './lib/places.js'
import { deleteHistory, listHistory, saveHistory } from './lib/history.js'
import { trackEvent, trackScreen } from './lib/analytics.js'
import { warmLocation } from './lib/geo.js'
import './App.css'

export default function App() {
  const [screen, setScreen] = useState('home')
  const [destination, setDestination] = useState(null)
  const [places, setPlaces] = useState([])
  const [history, setHistory] = useState([])
  const [user, setUser] = useState(undefined)
  const [authError, setAuthError] = useState('')
  const [signingIn, setSigningIn] = useState(false)
  const [needLogin, setNeedLogin] = useState(false)
  const [pendingSave, setPendingSave] = useState(null)
  const alarm = useMemo(() => createAlarm(), [])

  useEffect(() => {
    return watchUser(async (next) => {
      setUser(next)
      if (!next) {
        setPlaces([])
        setHistory([])
        return
      }
      try {
        const [saved, recent] = await Promise.all([listPlaces(next.uid), listHistory(next.uid)])
        setPlaces(saved)
        setHistory(recent)
      } catch {
        setPlaces([])
        setHistory([])
      }
    })
  }, [])

  useEffect(() => {
    if (user) setNeedLogin(false)
  }, [user])

  useEffect(() => {
    trackScreen(screen)
  }, [screen])

  useEffect(() => {
    if (!user || !pendingSave) return
    let cancelled = false
    savePlace(user.uid, pendingSave)
      .then((list) => {
        if (!cancelled) {
          setPlaces(list)
          trackEvent('save_place', { place_name: pendingSave.name, mode: pendingSave.mode })
          setPendingSave(null)
        }
      })
      .catch(() => {
        if (!cancelled) setPendingSave(null)
      })
    return () => {
      cancelled = true
    }
  }, [user, pendingSave])

  async function onGoogle() {
    setSigningIn(true)
    setAuthError('')
    try {
      await signInWithGoogle()
      trackEvent('login', { method: 'Google' })
    } catch (error) {
      setAuthError(googleErrorMessage(error))
    } finally {
      setSigningIn(false)
    }
  }

  async function start(next) {
    warmLocation()
    setDestination(next)
    setScreen('watch')
    trackEvent('start_watch', {
      mode: next.mode,
      wake_before: next.wakeBefore || 1,
    })
    if (!user) return
    try {
      setHistory(await saveHistory(user.uid, next))
    } catch {
      /* 기록 저장이 실패해도 감시는 계속합니다. */
    }
  }

  function stop() {
    alarm.stop()
    setDestination(null)
    setScreen('home')
  }

  async function onSave(place) {
    if (!user) {
      setPendingSave(place)
      setNeedLogin(true)
      return
    }
    setPlaces(await savePlace(user.uid, place))
    trackEvent('save_place', { place_name: place.name, mode: place.mode })
  }

  async function onRemove(name) {
    if (!user) return
    setPlaces(await deletePlace(user.uid, name))
  }

  async function onRemoveHistory(id) {
    if (!user) return
    setHistory(await deleteHistory(user.uid, id))
  }

  if (user === undefined) {
    return (
      <main className="screen login">
        <p className="lead">잠시만요…</p>
      </main>
    )
  }

  return (
    <>
      {screen === 'home' && (
        <DestinationScreen
          user={user}
          places={places}
          history={history}
          needLogin={needLogin}
          signingIn={signingIn}
          authError={authError}
          onStart={start}
          onSave={onSave}
          onRemove={onRemove}
          onRemoveHistory={onRemoveHistory}
          onLogout={() => {
            trackEvent('logout')
            signOutUser()
          }}
          onGoogle={onGoogle}
          onAskLogin={() => setNeedLogin(true)}
          onSkipLogin={() => {
            setNeedLogin(false)
            setPendingSave(null)
          }}
        />
      )}
      {screen === 'watch' && destination && (
        <WatchingScreen
          destination={destination}
          alarm={alarm}
          onStop={stop}
          onWake={() => {
            trackEvent('alarm_wake', { mode: destination.mode })
            setScreen('wake')
          }}
        />
      )}
      {screen === 'wake' && destination && (
        <WakeScreen destination={destination} alarm={alarm} onConfirm={stop} />
      )}
    </>
  )
}
