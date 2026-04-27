/* global React, TeamMono, Badge, Button, Icon, HeroBanner, Stat, TEAMS, BRACKET_R16, SCHEDULE, statusBadge, StickyApply */
const { useState } = React;

// ============================================================
// Detail Tabs — 대회정보 · 대진표 · 일정 · 참가팀
// ============================================================

function DetailTabs({ t, initialTab = 'info' }) {
  const [tab, setTab] = useState(initialTab);
  return (
    <div>
      <div className="tab-row">
        {[
          ['info', '대회 정보'],
          ['bracket', '대진표'],
          ['schedule', '일정'],
          ['teams', '참가팀'],
        ].map(([k, l]) => (
          <button key={k} className="tab" data-active={tab === k} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>
      <div style={{ paddingTop: 28 }}>
        {tab === 'info' && <TabInfo t={t}/>}
        {tab === 'bracket' && <TabBracket t={t}/>}
        {tab === 'schedule' && <TabSchedule t={t}/>}
        {tab === 'teams' && <TabTeams t={t}/>}
      </div>
    </div>
  );
}

function TabInfo({ t }) {
  return (
    <div>
      {/* Overview stats strip */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        border: '2px solid var(--border-hard)', background: 'var(--bg-card)',
        marginBottom: 32,
      }}>
        <Stat num={t.format.split(' · ')[0]} lbl="포맷"/>
        <Stat num={t.prize} lbl="상금" accent="var(--bdr-red)"/>
        <Stat num={`${t.applied}/${t.capacity}`} lbl="참가팀"/>
        <Stat num={t.dates.replace('2026.','')} lbl="경기일"/>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
        <section>
          <div className="eyebrow" style={{ marginBottom: 12 }}>대회 개요</div>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--ink)', textWrap: 'pretty' }}>
            {t.title} {t.edition}는 서울 지역 농구 크루가 참가하는 {t.format} 토너먼트입니다.
            16개 팀이 이틀간 경쟁하며, 우승 팀에게는 상금 {t.prize}이 지급됩니다.
          </p>
          <div style={{ marginTop: 20, display: 'grid', gap: 14 }}>
            <KV icon={<Icon.pin/>} lbl="경기장" val={<><div style={{ fontWeight: 700 }}>{t.court}</div><div style={{ fontSize: 12, color: 'var(--ink-mute)' }}>{t.address}</div></>}/>
            <KV icon={<Icon.clock/>} lbl="경기일" val={t.dates}/>
            <KV icon={<Icon.users/>} lbl="참가 인원" val={`팀당 최소 3명 최대 5명 · 총 ${t.capacity}팀`}/>
            <KV icon={<Icon.money/>} lbl="참가비" val={`${t.fee} /팀 · 신한 110-123-456789`}/>
            <KV icon={<Icon.trophy/>} lbl="시상" val={`1위 ${t.prize} · 2위 ₩1,500,000 · 3위 ₩500,000`}/>
          </div>
        </section>

        <section>
          <div className="eyebrow" style={{ marginBottom: 12 }}>주요 일정</div>
          <ol style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {[
              ['03.15', '접수 시작'],
              ['04.05', '접수 마감'],
              ['04.08', '대진 추첨 · 공개'],
              ['04.11', '본선 1일차 · 16강-8강'],
              ['04.12', '본선 2일차 · 4강-결승'],
            ].map(([d, l], i) => (
              <li key={i} style={{
                display: 'flex', gap: 14, alignItems: 'flex-start',
                padding: '12px 0', borderTop: i === 0 ? 'none' : '1.5px dashed var(--border)',
              }}>
                <div style={{
                  fontFamily: 'var(--ff-display)', fontWeight: 900, fontSize: 14,
                  background: '#000', color: '#fff', padding: '6px 8px', minWidth: 60, textAlign: 'center',
                  border: '2px solid var(--border-hard)',
                }}>{d}</div>
                <div style={{ flex: 1, paddingTop: 4 }}>{l}</div>
              </li>
            ))}
          </ol>

          <div className="eyebrow" style={{ marginTop: 28, marginBottom: 12 }}>규정 · 공지</div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.7, color: 'var(--ink-mute)' }}>
            <li>FIBA 3x3 공식 규정 적용</li>
            <li>경기 시간 10분 · 21점 선취 시 종료</li>
            <li>참가 확정 후 취소 시 환불 불가 (대회 7일 전 기준)</li>
            <li>유니폼 미착용 시 실격</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

function KV({ icon, lbl, val }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <div style={{
        width: 28, height: 28, flexShrink: 0,
        border: '2px solid var(--border-hard)', background: 'var(--bg-card)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bdr-red)'
      }}>{icon}</div>
      <div style={{ flex: 1, paddingTop: 2 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-dim)', marginBottom: 2 }}>{lbl}</div>
        <div style={{ fontSize: 14 }}>{val}</div>
      </div>
    </div>
  );
}

function TabBracket({ t }) {
  return (
    <div>
      <div className="eyebrow" style={{ marginBottom: 16 }}>16강 대진 · 추첨 예정 (04.08)</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
        {BRACKET_R16.map((m, i) => {
          const a = TEAMS.find(x => x.id === m.a);
          const b = TEAMS.find(x => x.id === m.b);
          return (
            <div key={i} style={{ border: '2px solid var(--border-hard)', background: 'var(--bg-card)' }}>
              <div style={{ padding: '8px 12px', borderBottom: '2px solid var(--border-hard)', background: 'var(--bg-card-2)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--ff-display)', fontWeight: 800, display: 'flex', justifyContent: 'space-between' }}>
                <span>경기 {i + 1}</span>
                <span style={{ color: 'var(--ink-dim)' }}>{m.time}</span>
              </div>
              <MatchRow team={a}/>
              <div style={{ height: 2, background: 'var(--border)' }}/>
              <MatchRow team={b}/>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MatchRow({ team, score }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 14px' }}>
      <TeamMono team={team} size={32}/>
      <div style={{ flex: 1, fontWeight: 700 }}>{team.name}</div>
      <div className="t-mono" style={{ fontSize: 12, color: 'var(--ink-dim)' }}>#{team.tag}</div>
      <div style={{ fontFamily: 'var(--ff-display)', fontWeight: 900, fontSize: 24, minWidth: 30, textAlign: 'right' }}>
        {score ?? '–'}
      </div>
    </div>
  );
}

function TabSchedule({ t }) {
  return (
    <div style={{ display: 'grid', gap: 24 }}>
      {SCHEDULE.map((day, i) => (
        <div key={i}>
          <div style={{
            display: 'inline-block',
            background: '#000', color: '#fff',
            padding: '8px 14px', fontFamily: 'var(--ff-display)', fontWeight: 900, fontSize: 14, letterSpacing: '0.08em',
            border: '2px solid var(--border-hard)',
            marginBottom: 12,
          }}>{day.date}</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid var(--border-hard)' }}>
            <thead>
              <tr style={{ background: 'var(--bg-card-2)' }}>
                {['시간','코트','경기','팀'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '10px 14px', borderBottom: '2px solid var(--border-hard)',
                    fontFamily: 'var(--ff-display)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: 'var(--ink-mute)',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {day.rows.map((r, j) => (
                <tr key={j} style={{ borderTop: j === 0 ? 'none' : '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 14px', fontFamily: 'var(--ff-mono)', fontSize: 13 }}>{r.time}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontFamily: 'var(--ff-display)', fontWeight: 900, fontSize: 13, border: '2px solid var(--border-hard)', padding: '2px 8px', background: r.court === 'A' ? 'var(--bdr-red)' : 'var(--ink)', color: r.court === 'A' ? '#fff' : 'var(--bg)' }}>{r.court}</span>
                  </td>
                  <td style={{ padding: '12px 14px', fontWeight: 700, fontSize: 13 }}>{r.label}</td>
                  <td style={{ padding: '12px 14px' }}>
                    {r.teams.length === 0 ? (
                      <span style={{ color: 'var(--ink-dim)', fontSize: 12 }}>TBD</span>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <TeamMono team={TEAMS.find(x => x.id === r.teams[0])} size={22}/>
                        <span style={{ color: 'var(--ink-dim)', fontSize: 11, fontFamily: 'var(--ff-mono)' }}>VS</span>
                        <TeamMono team={TEAMS.find(x => x.id === r.teams[1])} size={22}/>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

function TabTeams({ t }) {
  const applied = TEAMS.slice(0, t.applied);
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 16 }}>
        <div className="eyebrow">참가 확정 팀</div>
        <span style={{ fontFamily: 'var(--ff-display)', fontWeight: 900, fontSize: 22 }}>{applied.length}<span style={{ color: 'var(--ink-dim)', fontSize: 14 }}> / {t.capacity}</span></span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {applied.map(team => (
          <div key={team.id} style={{ border: '2px solid var(--border-hard)', background: 'var(--bg-card)', padding: 16, display: 'flex', gap: 14, alignItems: 'center', boxShadow: 'var(--sh-hard-sm)' }}>
            <TeamMono team={team} size={56}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--ff-display)', fontWeight: 900, fontSize: 17, letterSpacing: '-0.01em', textTransform: 'uppercase' }}>{team.name}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-dim)', fontFamily: 'var(--ff-mono)', marginTop: 2 }}>#{team.tag} · EST.{team.founded}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 4 }}>{team.wins}승 {team.losses}패 · R{team.rating}</div>
            </div>
          </div>
        ))}
        {Array.from({ length: t.capacity - applied.length }).map((_, i) => (
          <div key={'e'+i} style={{
            border: '2px dashed var(--border-strong)',
            padding: 16, display: 'flex', gap: 14, alignItems: 'center',
            color: 'var(--ink-dim)', fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase',
            minHeight: 88, fontFamily: 'var(--ff-display)', fontWeight: 700,
          }}>
            빈 자리 #{applied.length + i + 1}
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { DetailTabs, TabInfo, TabBracket, TabSchedule, TabTeams, KV, MatchRow });
