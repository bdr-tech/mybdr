/* global React, TeamMono, Badge, Button, Icon, HeroBanner, TEAMS, TOURNAMENTS, statusBadge, statusCta, dDay */

// ============================================================
// Tournament List Cards — 메인 목록 페이지 카드
// ============================================================

function ListCard({ t }) {
  const remaining = Math.max(0, (t.capacity || 0) - (t.applied || 0));
  const recent = (t.recent || []).map(id => TEAMS.find(x => x.id === id)).filter(Boolean);

  return (
    <article className="list-card" style={{
      border: '2px solid var(--border-hard)',
      background: 'var(--bg-card)',
      display: 'grid', gridTemplateColumns: '200px 1fr auto',
      boxShadow: 'var(--sh-hard-sm)',
      cursor: 'pointer',
    }}>
      {/* Poster thumb */}
      <div style={{
        position: 'relative', borderRight: '2px solid var(--border-hard)',
        background: `repeating-linear-gradient(135deg, ${t.accent} 0 8px, #000 8px 20px)`,
        minHeight: 140, overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(135deg, ${t.accent}cc, #000 80%)`,
        }}/>
        <div style={{ position: 'absolute', left: 12, bottom: 10, color: '#fff' }}>
          <div style={{ fontFamily: 'var(--ff-display)', fontSize: 9, letterSpacing: '0.2em', opacity: 0.7 }}>{t.edition}</div>
          <div style={{ fontFamily: 'var(--ff-display)', fontWeight: 900, fontSize: 22, lineHeight: 0.95, letterSpacing: '-0.02em', textTransform: 'uppercase', textShadow: '3px 3px 0 #000' }}>
            {t.title}
          </div>
        </div>
        <div style={{ position: 'absolute', top: 10, left: 10 }}>{statusBadge(t.status)}</div>
      </div>

      {/* Info */}
      <div style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          {(t.tags || []).slice(0, 3).map(x => <Badge key={x} variant="ghost">{x}</Badge>)}
        </div>
        <h3 style={{ margin: '0 0 4px', fontFamily: 'var(--ff-display)', fontSize: 20, fontWeight: 900, letterSpacing: '-0.01em', textTransform: 'uppercase' }}>
          {t.title} <span style={{ color: 'var(--ink-dim)' }}>· {t.edition}</span>
        </h3>
        <div style={{ color: 'var(--ink-mute)', fontSize: 13 }}>{t.subtitle}</div>

        <div style={{ display: 'flex', gap: 18, marginTop: 14, flexWrap: 'wrap', fontSize: 12, color: 'var(--ink-mute)' }}>
          <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}><Icon.clock/> {t.dates}</span>
          <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}><Icon.pin/> {t.court}</span>
          <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}><Icon.money/> {t.fee}</span>
          <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}><Icon.trophy/> {t.prize}</span>
        </div>

        {recent.length > 0 && (
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex' }}>
              {recent.slice(0, 3).map((team, i) => (
                <div key={team.id} style={{ marginLeft: i === 0 ? 0 : -8 }}>
                  <TeamMono team={team} size={28}/>
                </div>
              ))}
            </div>
            <span style={{ fontSize: 11, color: 'var(--ink-dim)' }}>최근 신청 · 총 {t.applied}팀</span>
          </div>
        )}
      </div>

      {/* Right rail — D-Day / slots */}
      <div style={{
        padding: '18px 20px', borderLeft: '2px solid var(--border-hard)',
        background: 'var(--bg-card-2)',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        minWidth: 180,
      }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-dim)' }}>
            {t.status === 'ended' ? '우승팀' : t.status === 'live' ? '진행중' : t.status === 'preparing' ? '접수 시작' : '마감까지'}
          </div>
          {t.status === 'ended' && t.winner ? (
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
              <TeamMono team={TEAMS.find(x => x.id === t.winner)} size={36}/>
              <div style={{ fontFamily: 'var(--ff-display)', fontWeight: 900, fontSize: 16, textTransform: 'uppercase' }}>
                {TEAMS.find(x => x.id === t.winner).name}
              </div>
            </div>
          ) : (
            <div style={{
              fontFamily: 'var(--ff-display)', fontWeight: 900,
              fontSize: 42, lineHeight: 0.9, letterSpacing: '-0.03em',
              color: t.status === 'closing' ? 'var(--bdr-red)' : t.status === 'live' ? 'var(--bdr-red)' : 'var(--ink)',
              marginTop: 4,
            }}>
              {t.status === 'open' ? 'D-14' : t.status === 'closing' ? 'D-3' : t.status === 'live' ? 'LIVE' : t.status === 'preparing' ? '5.15' : '—'}
            </div>
          )}
          {t.status !== 'ended' && t.status !== 'preparing' && t.status !== 'live' && (
            <div style={{ fontSize: 10, color: 'var(--ink-dim)', marginTop: 4 }}>
              잔여 {remaining}/{t.capacity}
            </div>
          )}
        </div>

        <div style={{ marginTop: 14 }}>
          <Button variant={t.status === 'open' || t.status === 'closing' ? 'primary' : 'default'} size="sm" style={{ width: '100%' }}>
            {t.status === 'ended' ? '결과' : t.status === 'live' ? '보기' : t.status === 'preparing' ? '알림' : '신청'} <Icon.arrow/>
          </Button>
        </div>
      </div>
    </article>
  );
}

function TournamentList() {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="eyebrow">대회 목록</div>
          <h2 className="t-display" style={{ fontSize: 48, margin: '8px 0 0' }}>지금 열린 대회</h2>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['전체', '접수중', '마감임박', '종료'].map((f, i) => (
            <button key={f} className="tab" data-active={i === 0}
              style={{ border: '2px solid var(--border-hard)', padding: '8px 14px', borderBottom: 'none' }}>
              {f}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gap: 18 }}>
        {TOURNAMENTS.map(t => <ListCard key={t.id} t={t}/>)}
      </div>
    </div>
  );
}

Object.assign(window, { ListCard, TournamentList });
