/* global React, TeamMono, Badge, Button, Icon, HeroBanner, Stat, TEAMS, BRACKET_R16, SCHEDULE, statusBadge, statusCta */

// ============================================================
// Sticky Apply Card — 3 variations
//   A. 표준: D-Day, 잔여석, 참가비, CTA, 공유
//   B. 임팩트: 거대 D-Day + 상태 색 블록
//   C. 실험: 실시간 카운터 + 라이브 신청 현황 스트림
// ============================================================

function StickyApply({ t, variant = 'A', state = 'open', onApply }) {
  const remaining = Math.max(0, (t.capacity || 0) - (t.applied || 0));
  const filledPct = Math.min(100, Math.round(((t.applied || 0) / (t.capacity || 1)) * 100));
  const cta = statusCta(state);

  // ---- My status content
  const myStatus = state === 'applied' ? (
    <div style={{
      padding: 14, border: '2px solid var(--ok)', background: 'rgba(25,195,125,0.08)',
      display: 'flex', gap: 10, alignItems: 'center'
    }}>
      <div style={{ width: 32, height: 32, background: 'var(--ok)', color: '#000',
        display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--border-hard)' }}>
        <Icon.check/>
      </div>
      <div>
        <div style={{ fontFamily: 'var(--ff-display)', fontWeight: 800, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase' }}>신청 완료</div>
        <div style={{ fontSize: 12, color: 'var(--ink-mute)' }}>입금 대기 · 03.21까지</div>
      </div>
    </div>
  ) : null;

  const noTeamWarn = state === 'no-team' ? (
    <div style={{
      padding: 14, border: '2px solid var(--warn)', background: 'rgba(247,181,0,0.1)',
      display: 'flex', gap: 10, alignItems: 'flex-start'
    }}>
      <div style={{ color: 'var(--warn)', marginTop: 2 }}><Icon.alert/></div>
      <div>
        <div style={{ fontFamily: 'var(--ff-display)', fontWeight: 800, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>팀이 필요합니다</div>
        <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginTop: 4 }}>이 대회는 3v3 팀 단위로 신청할 수 있어요.</div>
        <Button size="sm" variant="ghost" style={{ marginTop: 8 }}>팀 만들기 →</Button>
      </div>
    </div>
  ) : null;

  // ------------------------------------------------
  // Variant A · Standard
  // ------------------------------------------------
  if (variant === 'A') {
    return (
      <aside className="sticky-apply" style={{
        background: 'var(--bg-card)',
        border: '2px solid var(--border-hard)',
        boxShadow: 'var(--sh-hard-md)',
      }}>
        {/* Top bar — status */}
        <div style={{
          background: '#000', color: '#fff',
          padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: '2px solid var(--border-hard)'
        }}>
          <div style={{ fontFamily: 'var(--ff-display)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.7 }}>참가 신청</div>
          {statusBadge(state)}
        </div>

        {/* Key numbers */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '2px solid var(--border-hard)' }}>
          <div style={{ padding: '18px 16px', borderRight: '2px solid var(--border-hard)' }}>
            <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-dim)' }}>마감까지</div>
            <div style={{ fontFamily: 'var(--ff-display)', fontWeight: 900, fontSize: 44, lineHeight: 0.9, letterSpacing: '-0.02em', color: state === 'closing' ? 'var(--bdr-red)' : 'var(--ink)' }}>
              D-{state === 'closed' || state === 'ended' ? '0' : state === 'closing' ? '3' : '14'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 4 }}>04.05 (일) 23:59</div>
          </div>
          <div style={{ padding: '18px 16px' }}>
            <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-dim)' }}>잔여석</div>
            <div style={{ fontFamily: 'var(--ff-display)', fontWeight: 900, fontSize: 44, lineHeight: 0.9, letterSpacing: '-0.02em' }}>
              {remaining}<span style={{ fontSize: 20, color: 'var(--ink-dim)' }}>/{t.capacity}</span>
            </div>
            {/* Slot bar */}
            <div style={{ marginTop: 8, height: 8, background: 'var(--bg-card-2)', border: '1.5px solid var(--border-hard)', position: 'relative' }}>
              <div style={{ position: 'absolute', inset: 0, width: filledPct + '%', background: state === 'closing' ? 'var(--bdr-red)' : 'var(--ink)' }}/>
            </div>
          </div>
        </div>

        {/* Fee / info rows */}
        <div style={{ padding: '14px 16px', borderBottom: '2px solid var(--border-hard)' }}>
          <InfoRow lbl="참가비" val={<span><span style={{ fontFamily: 'var(--ff-display)', fontWeight: 900, fontSize: 20 }}>{t.fee}</span> <span style={{ fontSize: 11, color: 'var(--ink-dim)' }}>/팀</span></span>}/>
          <InfoRow lbl="입금 계좌" val={<span className="t-mono" style={{ fontSize: 12 }}>신한 110-123-456789</span>}/>
          <InfoRow lbl="입금 마감" val="신청 후 72시간 이내" sub/>
        </div>

        {/* Self-check */}
        {state !== 'applied' && state !== 'ended' && state !== 'no-team' && (
          <div style={{ padding: '14px 16px', borderBottom: '2px solid var(--border-hard)' }}>
            <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-dim)', marginBottom: 8 }}>신청 자격 체크</div>
            <Check ok label="팀 등록됨 (리딤 · 팀장)"/>
            <Check ok label="3명 이상 선수 등록"/>
            <Check ok label="프로필 80% 이상 완성"/>
          </div>
        )}

        {myStatus && <div style={{ padding: 16, borderBottom: '2px solid var(--border-hard)' }}>{myStatus}</div>}
        {noTeamWarn && <div style={{ padding: 16, borderBottom: '2px solid var(--border-hard)' }}>{noTeamWarn}</div>}

        {/* CTA */}
        <div style={{ padding: 16 }}>
          <Button variant={cta.variant} size="xl" disabled={cta.disabled} onClick={onApply}>
            {cta.label}
          </Button>

          {/* Host & share */}
          <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
            <Button size="sm" variant="ghost" style={{ flex: 1 }}><Icon.chat/> 문의</Button>
            <Button size="sm" variant="ghost" style={{ flex: 1 }}><Icon.share/> 공유</Button>
          </div>
          <div style={{ marginTop: 10, fontSize: 11, color: 'var(--ink-dim)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon.phone/> 주최: {t.host} · {t.hostContact}
          </div>
        </div>
      </aside>
    );
  }

  // ------------------------------------------------
  // Variant B · Impact (giant D-Day block)
  // ------------------------------------------------
  if (variant === 'B') {
    const closing = state === 'closing';
    const blockBg = closing ? 'var(--bdr-red)' : '#000';
    return (
      <aside className="sticky-apply sticky-apply--impact" style={{
        border: '3px solid var(--border-hard)',
        boxShadow: '10px 10px 0 0 var(--bdr-red)',
        background: 'var(--bg-card)',
      }}>
        {/* Massive D-Day */}
        <div style={{ background: blockBg, color: '#fff', padding: '24px 20px 20px', position: 'relative', borderBottom: '3px solid var(--border-hard)' }}>
          <div style={{ fontFamily: 'var(--ff-display)', fontSize: 11, letterSpacing: '0.14em', opacity: 0.75, textTransform: 'uppercase' }}>
            {closing ? '마감 임박' : '신청 마감까지'}
          </div>
          <div style={{
            fontFamily: 'var(--ff-display)', fontWeight: 900,
            fontSize: 100, lineHeight: 0.88, letterSpacing: '-0.04em',
            margin: '6px 0 0',
          }}>
            D-{state === 'closing' ? '3' : '14'}
          </div>
          <div style={{ marginTop: 6, fontSize: 12, opacity: 0.9 }}>04.05 일요일 23:59 마감</div>
          {/* Stripes bottom */}
          <div style={{ position: 'absolute', bottom: -3, left: 0, right: 0, height: 3,
            background: 'repeating-linear-gradient(90deg, #fff 0 12px, #000 12px 24px)' }}/>
        </div>

        {/* Slot progress */}
        <div style={{ padding: '16px 16px 14px', borderBottom: '2px solid var(--border-hard)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-dim)' }}>잔여석</div>
            <div>
              <span style={{ fontFamily: 'var(--ff-display)', fontWeight: 900, fontSize: 26 }}>{remaining}</span>
              <span style={{ fontSize: 13, color: 'var(--ink-dim)' }}> / {t.capacity} 팀</span>
            </div>
          </div>
          <div style={{ height: 14, background: 'var(--bg-card-2)', border: '2px solid var(--border-hard)', display: 'flex' }}>
            {Array.from({ length: t.capacity }).map((_, i) => (
              <div key={i} style={{
                flex: 1,
                background: i < (t.applied || 0) ? (closing ? 'var(--bdr-red)' : 'var(--ink)') : 'transparent',
                borderRight: i < t.capacity - 1 ? '1.5px solid var(--border-hard)' : 'none',
              }}/>
            ))}
          </div>
        </div>

        {/* Fee strip */}
        <div style={{ padding: '14px 16px', borderBottom: '2px solid var(--border-hard)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-dim)' }}>참가비</div>
            <div style={{ fontFamily: 'var(--ff-display)', fontWeight: 900, fontSize: 24 }}>{t.fee}<span style={{ fontSize: 12, color: 'var(--ink-dim)' }}> /팀</span></div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-dim)' }}>상금</div>
            <div style={{ fontFamily: 'var(--ff-display)', fontWeight: 900, fontSize: 20, color: 'var(--bdr-red)' }}>{t.prize}</div>
          </div>
        </div>

        {myStatus && <div style={{ padding: 16, borderBottom: '2px solid var(--border-hard)' }}>{myStatus}</div>}
        {noTeamWarn && <div style={{ padding: 16, borderBottom: '2px solid var(--border-hard)' }}>{noTeamWarn}</div>}

        {/* CTA huge */}
        <div style={{ padding: 16 }}>
          <Button variant={cta.variant} size="xl" disabled={cta.disabled} onClick={onApply}
            style={{ fontSize: 20, padding: '24px 20px', letterSpacing: '0.06em' }}>
            {cta.label} <Icon.arrow/>
          </Button>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <Button size="sm" variant="ghost" style={{ flex: 1 }}><Icon.chat/></Button>
            <Button size="sm" variant="ghost" style={{ flex: 1 }}><Icon.share/></Button>
            <Button size="sm" variant="ghost" style={{ flex: 1 }}><Icon.phone/></Button>
          </div>
        </div>
      </aside>
    );
  }

  // ------------------------------------------------
  // Variant C · Experimental (live stream + animated counter)
  // ------------------------------------------------
  return (
    <aside className="sticky-apply sticky-apply--live" style={{
      border: '2px solid var(--border-hard)',
      background: 'var(--bg-card)',
      boxShadow: 'var(--sh-hard-md)',
    }}>
      {/* Ticker */}
      <div style={{
        background: '#000', color: '#fff', overflow: 'hidden',
        borderBottom: '2px solid var(--border-hard)',
        position: 'relative'
      }}>
        <div style={{
          display: 'flex', gap: 40,
          padding: '10px 0',
          animation: 'bdrmarquee 24s linear infinite',
          whiteSpace: 'nowrap',
          fontFamily: 'var(--ff-display)', fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase',
        }}>
          {['● LIVE · 방금 KINGS CREW 신청', '● 12 팀 신청 · 4 자리 남음', '● D-14 · 마감까지 336시간', '● 상금 ₩5,000,000', '● LIVE · 방금 KINGS CREW 신청', '● 12 팀 신청 · 4 자리 남음', '● D-14 · 마감까지 336시간', '● 상금 ₩5,000,000'].map((x,i) => (
            <span key={i} style={{ paddingLeft: 20 }}>{x}</span>
          ))}
        </div>
      </div>

      {/* Live counter — flip-style look */}
      <div style={{ padding: '20px 16px 16px', borderBottom: '2px solid var(--border-hard)', textAlign: 'center' }}>
        <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-dim)' }}>신청 마감까지</div>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 10 }}>
          {[['14','D'], ['12','H'], ['47','M'], ['23','S']].map(([n,l]) => (
            <div key={l} style={{ background: '#000', color: '#fff', border: '2px solid var(--border-hard)', padding: '10px 8px', minWidth: 54 }}>
              <div style={{ fontFamily: 'var(--ff-display)', fontWeight: 900, fontSize: 28, lineHeight: 1 }}>{n}</div>
              <div style={{ fontSize: 9, letterSpacing: '0.1em', opacity: 0.6, marginTop: 4 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Live applied list */}
      <div style={{ padding: '14px 16px', borderBottom: '2px solid var(--border-hard)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-dim)' }}>최근 신청</div>
          <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--bdr-red)', display: 'inline-flex', gap: 6, alignItems: 'center' }}>
            <span style={{ width: 6, height: 6, background: 'var(--bdr-red)', borderRadius: '50%', animation: 'bdrpulse 1.2s infinite' }}/> LIVE
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {['redeem','3point','monkeys','kings'].map((id, i) => {
            const team = TEAMS.find(x => x.id === id);
            return (
              <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
                <TeamMono team={team} size={24}/>
                <span style={{ fontWeight: 700, fontSize: 13 }}>{team.name}</span>
                <span style={{ flex: 1 }}/>
                <span style={{ fontSize: 11, color: 'var(--ink-dim)' }}>{i === 0 ? '방금 전' : `${i*4+2}분 전`}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Slots + fee */}
      <div style={{ padding: '14px 16px', borderBottom: '2px solid var(--border-hard)' }}>
        <InfoRow lbl="참가비" val={t.fee + ' /팀'}/>
        <InfoRow lbl="잔여석" val={`${remaining}/${t.capacity}`}/>
      </div>

      {myStatus && <div style={{ padding: 16, borderBottom: '2px solid var(--border-hard)' }}>{myStatus}</div>}
      {noTeamWarn && <div style={{ padding: 16, borderBottom: '2px solid var(--border-hard)' }}>{noTeamWarn}</div>}

      <div style={{ padding: 16 }}>
        <Button variant={cta.variant} size="xl" disabled={cta.disabled} onClick={onApply}>{cta.label}</Button>
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <Button size="sm" variant="ghost" style={{ flex: 1 }}><Icon.chat/> 문의</Button>
          <Button size="sm" variant="ghost" style={{ flex: 1 }}><Icon.share/> 공유</Button>
        </div>
      </div>
    </aside>
  );
}

function InfoRow({ lbl, val, sub }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      padding: '6px 0',
      fontSize: sub ? 11 : 13,
      color: sub ? 'var(--ink-dim)' : 'var(--ink)',
    }}>
      <span style={{ color: 'var(--ink-dim)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{lbl}</span>
      <span style={{ fontWeight: 600 }}>{val}</span>
    </div>
  );
}

function Check({ ok, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 13 }}>
      <div style={{
        width: 18, height: 18, border: '2px solid var(--border-hard)',
        background: ok ? 'var(--ok)' : 'transparent', color: '#000',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        {ok && <Icon.check/>}
      </div>
      <span style={{ color: ok ? 'var(--ink)' : 'var(--ink-dim)' }}>{label}</span>
    </div>
  );
}

Object.assign(window, { StickyApply, InfoRow, Check });
