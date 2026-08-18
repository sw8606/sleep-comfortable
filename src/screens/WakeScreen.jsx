import { useEffect } from 'react'

export default function WakeScreen({ destination, alarm, onConfirm }) {
  useEffect(() => {
    alarm.start()
    return () => alarm.stop()
  }, [alarm])

  return (
    <main className="screen wake">
      <p className="brand brand-sm">편히자</p>
      <p className="eyebrow">내릴 곳입니다</p>
      <h1>일어나세요</h1>
      <p className="place">{destination.label}</p>
      <button type="button" className="primary big wake-btn" onClick={onConfirm}>
        확인
      </button>
    </main>
  )
}
