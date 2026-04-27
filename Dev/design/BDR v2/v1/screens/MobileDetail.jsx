/* global React, TeamMono, Badge, Button, Icon, HeroBanner, TOURNAMENTS, statusBadge, StickyApply */

// ============================================================
// Mobile View — expanded bottom sticky CTA (잔여석/D-Day bar + button)
// ============================================================

function MobileDetail({ t, state = 'open' }) {
  return (
    <div className="phone">
      <div className="phone__notch"/>
      <div className="phone__screen">
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderBottom: '2px solid var(--border-hard)', background: 'var(--bg)' }}>
          <div style={{ width: 24, height: 24, border: '2px solid var(--border-hard)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M15 5l-7 7 7 7"/></svg>
          </div>
          <div style={{ flex: 1, fontFamily: 'var(--ff-display)', fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase' }}>대회 상세</div>
          <div style={{ color: 'var(--ink-mute)' }}><Icon.share/></div>
        </div>

        {/* Hero (compact) */}
        <div style={{ position: 'relative', height: 200, borderBottom: '2px solid var(--border-hard)' }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: `repeating-linear-gradient(135deg, ${t.accent} 0 8px, #000 8px 24px)`,
          }}/>
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(115deg, transparent 40%, ${t.accent} 40%, ${t.accent} 44%, transparent 44%)` }}/>
          <div style={{ position: 'absolute', inset: 0, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <Badge variant="solid-dark">{t.level}</Badge>
              {statusBadge(state)}
            </div>
            <div>
              <div style={{ fontFamily: 'var(--ff-display)', fontSize: 10, letterSpacing: '0.2em', color: '#fff', opacity: 0.8, textTransform: 'uppercase' }}>{t.edition}</div>
              <div style={{
                fontFamily: 'var(--ff-display)', fontWeight: 900, color: '#fff',
                fontSize: 40, lineHeight: 0.9, letterSpacing: '-0.02em',
                textTransform: 'uppercase', textShadow: '3px 3px 0 #000',
              }}>{t.title}</div>
            </div>
          </div>
        </div>

        {/* Compact info */}
        <div style={{ padding: 16 }}>
          <h2 style={{ margin: 0, fontFamily: 'var(--ff-display)', fontSize: 18 }}>{t.subtitle}</h2>
          <div style={{ display: 'grid', gap: 8, marginTop: 14, fontSize: 13, color: 'var(--ink-mute)' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Icon.clock/> {t.dates}</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Icon.pin/> {t.court}</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Icon.money/> {t.fee} /팀</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Icon.trophy/> {t.prize}</div>
          </div>

          <div className="eyebrow" style={{ marginTop: 20, marginBottom: 10 }}>대회 개요</div>
          <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--ink-mute)', margin: 0 }}>
            서울 지역 농구 크루가 참가하는 3x3 더블엘리미네이션 토너먼트. 16개 팀이 이틀간 경쟁합니다.
          </p>

          <div style={{ height: 120 }}/>
        </div>

        {/* Expanded sticky CTA */}
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0,
          background: 'var(--bg-card)',
          borderTop: '3px solid var(--border-hard)',
          boxShadow: '0 -6px 0 0 rgba(0,0,0,0.15)',
        }}>
          {/* Info strip */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '2px solid var(--border-hard)' }}>
            <div style={{ padding: '10px 14px', borderRight: '2px solid var(--border-hard)' }}>
              <div style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-dim)' }}>마감</div>
              <div style={{ fontFamily: 'var(--ff-display)', fontWeight: 900, fontSize: 22, color: state === 'closing' ? 'var(--bdr-red)' : 'var(--ink)' }}>
                D-{state === 'closing' ? '3' : '14'}
              </div>
            </div>
            <div style={{ padding: '10px 14px' }}>
              <div style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-dim)' }}>잔여석</div>
              <div style={{ fontFamily: 'var(--ff-display)', fontWeight: 900, fontSize: 22 }}>{t.capacity - t.applied}<span style={{ fontSize: 12, color: 'var(--ink-dim)' }}>/{t.capacity}</span></div>
            </div>
          </div>
          <div style={{ padding: 12 }}>
            <Button variant="primary" size="lg" style={{ width: '100%' }}>참가 신청 <Icon.arrow/></Button>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { MobileDetail });
