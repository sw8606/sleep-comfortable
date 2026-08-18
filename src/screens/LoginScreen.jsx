export default function LoginScreen({ onGoogle, loading, error, onSkip, compact, highlight }) {
  const body = (
    <>
      {!compact && <p className="eyebrow">편히자</p>}
      {highlight && <p className="hint">저장하려면 로그인이 필요해요.</p>}
      <h2>로그인하면 자주 가는 곳이 남아요</h2>
      <p className="hint">안 해도 바로 쓸 수 있어요.</p>
      {error && <p className="error">{error}</p>}
      <button type="button" className="google" onClick={onGoogle} disabled={loading}>
        <GoogleMark />
        {loading ? '로그인 중…' : 'Google로 로그인'}
      </button>
      {onSkip && (
        <button type="button" className="ghost" onClick={onSkip}>
          나중에 할래요
        </button>
      )}
    </>
  )

  if (compact) {
    return (
      <section className={highlight ? 'block login-card on' : 'block login-card'}>
        {body}
      </section>
    )
  }

  return <main className="screen login">{body}</main>
}

function GoogleMark() {
  return (
    <svg className="google-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.47 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}
