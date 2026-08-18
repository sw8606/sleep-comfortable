export default function HistorySidebar({
  open,
  places,
  history,
  onStart,
  onRemovePlace,
  onRemoveHistory,
  onClose,
}) {
  return (
    <>
      {open && <button type="button" className="sidebar-backdrop" aria-label="닫기" onClick={onClose} />}
      <aside className={open ? 'sidebar open' : 'sidebar'}>
        <div className="sidebar-top">
          <h2>내 정류장</h2>
          <button type="button" className="ghost small sidebar-close" onClick={onClose}>
            닫기
          </button>
        </div>

        <section className="block">
          <h2>자주 가는 곳</h2>
          {places.length === 0 ? (
            <p className="hint">학교·직장·집으로 저장하면 여기에 모입니다.</p>
          ) : (
            <ul className="list sidebar-list">
              {places.map((place) => (
                <li key={place.name}>
                  <div className="chip-row">
                    <button type="button" className="row" onClick={() => onStart(place)}>
                      <strong>{place.name}</strong>
                      <span>{place.label}</span>
                    </button>
                    <button type="button" className="ghost small" onClick={() => onRemovePlace(place.name)}>
                      삭제
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="block">
          <h2>최근 내린 곳</h2>
          {history.length === 0 ? (
            <p className="hint">감시를 시작하면 최근 정류장이 여기에 남습니다.</p>
          ) : (
            <ul className="list sidebar-list">
              {history.map((item) => (
                <li key={item.id}>
                  <div className="chip-row">
                    <button type="button" className="row" onClick={() => onStart(item)}>
                      <strong>{item.destName}</strong>
                      <span>
                        {item.mode === 'bus' ? '버스' : '지하철'}
                        {item.routeName ? ` ${item.routeName}` : ''}
                        {item.lineName ? ` ${item.lineName}` : ''}
                      </span>
                    </button>
                    <button type="button" className="ghost small" onClick={() => onRemoveHistory(item.id)}>
                      삭제
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </aside>
    </>
  )
}
