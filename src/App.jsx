import { useEffect, useMemo, useState } from 'react'
import LoginScreen from './screens/LoginScreen.jsx'
import DestinationScreen from './screens/DestinationScreen.jsx'
import WatchingScreen from './screens/WatchingScreen.jsx'
import WakeScreen from './screens/WakeScreen.jsx'
import { createAlarm } from './lib/alarm.js'
import { googleErrorMessage, signInWithGoogle, signOutUser, watchUser } from './lib/auth.js'
import { deletePlace, listPlaces, savePlace } from './lib/places.js'
import './App.css'

export default function App() {
  const [screen, setScreen] = useState('home')
  const [destination, setDestination] = useState(null)
  const [places, setPlaces] = useState([])
  const [user, setUser] = useState(undefined)
  const [authError, setAuthError] = useState('')
  const [signingIn, setSigningIn] = useState(false)
  const alarm = useMemo(() => createAlarm(), [])

  useEffect(() => {
    return watchUser(async (next) => {
      setUser(next)
      if (!next) {
        setPlaces([])
        setScreen('home')
        setDestination(null)
        return
      }
      try {
        setPlaces(await listPlaces(next.uid))
      } catch {
        setPlaces([])
      }
    })
  }, [])

  async function onGoogle() {
    setSigningIn(true)
    setAuthError('')
    try {
      await signInWithGoogle()
    } catch (error) {
      setAuthError(googleErrorMessage(error))
    } finally {
      setSigningIn(false)
    }
  }

  function start(next) {
    setDestination(next)
    setScreen('watch')
  }

  function stop() {
    alarm.stop()
    setDestination(null)
    setScreen('home')
  }

  async function onSave(place) {
    if (!user) return
    setPlaces(await savePlace(user.uid, place))
  }

  async function onRemove(name) {
    if (!user) return
    setPlaces(await deletePlace(user.uid, name))
  }

  if (user === undefined) {
    return (
      <main className="screen login">
        <p className="lead">잠시만요…</p>
      </main>
    )
  }

  if (!user) {
    return <LoginScreen onGoogle={onGoogle} loading={signingIn} error={authError} />
  }

  return (
    <>
      {screen === 'home' && (
        <DestinationScreen
          user={user}
          places={places}
          onStart={start}
          onSave={onSave}
          onRemove={onRemove}
          onLogout={signOutUser}
        />
      )}
      {screen === 'watch' && destination && (
        <WatchingScreen
          destination={destination}
          alarm={alarm}
          onStop={stop}
          onWake={() => setScreen('wake')}
        />
      )}
      {screen === 'wake' && destination && (
        <WakeScreen destination={destination} alarm={alarm} onConfirm={stop} />
      )}
    </>
  )
}
