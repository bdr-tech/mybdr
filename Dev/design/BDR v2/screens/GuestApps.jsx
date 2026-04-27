/* global React, GAMES, TEAMS, Icon */

function GuestApps({ setRoute }) {
  const [tab, setTab] = React.useState('active');

  const active = [
    {
      id:'ga1', teamName:'SWEEP', teamTag:'SWP', teamColor:'#F59E0B', teamInk:'#000',
      game: GAMES[1], // 성동구민체육관
      status:'accepted',
      appliedAt:'2026.04.20 14:22', decidedAt:'2026.04.21 09:15',
      role:'포워드', teamMessage:'수준 좋으시네요. 일요일 뵐게요!',
      myMessage:'포워드 가능합니다. 게스트 경험 3회 있습니다.',
      fee:'₩8,000', paid:true,
    },
    {
      id:'ga2', teamName:'IRON WOLVES', teamTag:'IRW', teamColor:'#6B7280', teamInk:'#fff',
      game: GAMES[7],
      status:'pending',
      appliedAt:'2026.04.23 11:04',
      role:'가드',
      myMessage:'가드/포워드 모두 가능합니다. 주말 오후 시간 확보됩니다.',
      fee:'₩10,000', paid:false,
      pendingHours: 8,
    },
    {
      id:'ga3', teamName:'3POINT', teamTag:'3PT', teamColor:'#F59E0B', teamInk:'#000',
      game: GAMES[4], // 스크림
      status:'shortlist',
      appliedAt:'2026.04.21 19:47',
      role:'옵저버',
      teamMessage:'고려 중입니다. 내일 최종 결정해서 알려드릴게요.',
      myMessage:'스크림 관전도 좋고, 필요하면 합류도 가능합니다.',
      fee:'관람 무료', paid:null,
    },
  ];

  const past = [
    {
      id:'gp1', teamName:'KINGS CREW', teamTag:'KGS', teamColor:'#0EA5E9', teamInk:'#fff',
      game:{ title:'화요일 저녁 테크노마트 게스트 2명', court:'테크노마트 스카이코트', date:'2026.04.15 (화)', time:'19:30 – 21:30' },
      status:'completed',
      result:'3전 2승 1패', mvp:true,
      rating:5, teamReview:'실력·매너 모두 훌륭했습니다. 다음에 또 모시고 싶어요.',
      fee:'₩6,000', paid:true,
    },
    {
      id:'gp2', teamName:'THE ZONE', teamTag:'TZN', teamColor:'#8B5CF6', teamInk:'#fff',
      game:{ title:'스크림 게스트 — 용산', court:'용산국민체육센터', date:'2026.04.02 (수)', time:'20:00 – 22:00' },
      status:'declined',
      declinedReason:'이미 다른 게스트 확정',
      fee:'₩8,000', paid:false,
    },
    {
      id:'gp3', teamName:'BLOCK', teamTag:'BLK', teamColor:'#10B981', teamInk:'#000',
      game:{ title:'주말 오전 3x3', court:'하남미사체육관', date:'2026.03.23 (일)', time:'10:00 – 12:00' },
      status:'completed',
      result:'4전 3승 1패',
      rating:4, teamReview:'좋은 게스트였습니다. 다만 수비 때 적극성 조금 아쉬움.',
      fee:'₩5,000', paid:true,
    },
  ];

  const myStats = {
    totalApps: 18,
    accepted: 12,
    winRate: 67,
    mvpCount: 2,
    avgRating: 4.6,
    reliability: 94,
  };

  const list = tab === 'active' ? active : past;

  return (
    <div className="page">
      <div style={{display:'flex', gap:6, fontSize:12, color:'var(--ink-mute)', marginBottom:12}}>
        <a onClick={()=>setRoute('home')} style={{cursor:'pointer'}}>홈</a>
        <span>›</span>
        <a onClick={()=>setRoute('profile')} style={{cursor:'pointer'}}>마이페이지</a>
        <span>›</span>
        <span style={{color:'var(--ink)'}}>게스트 지원 현황</span>
      </div>

      <h1 style={{margin:'0 0 8px', fontSize:28, fontWeight:800, letterSpacing:'-0.015em'}}>게스트 지원 현황</h1>
      <p style={{margin:'0 0 20px', color:'var(--ink-mute)', fontSize:14}}>
        다른 팀에 일회성 참가로 지원한 내역을 관리하세요.
      </p>

      {/* Guest profile summary */}
      <div className="card" style={{padding:'20px 22px', marginBottom:20, display:'grid', gridTemplateColumns:'auto 1fr auto', gap:18, alignItems:'center'}}>
        <div style={{width:60, height:60, background:'var(--bdr-red)', color:'#fff', display:'grid', placeItems:'center', fontFamily:'var(--ff-mono)', fontWeight:700, fontSize:14, borderRadius:8}}>RDM</div>
        <div>
          <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:4}}>
            <div style={{fontSize:16, fontWeight:700}}>rdm_captain 님의 게스트 이력</div>
            <span className="badge badge--red">신뢰도 {myStats.reliability}%</span>
          </div>
          <div style={{display:'flex', gap:18, fontSize:12.5, color:'var(--ink-mute)'}}>
            <span>총 지원 <b style={{color:'var(--ink)', fontFamily:'var(--ff-mono)'}}>{myStats.totalApps}</b>회</span>
            <span>수락 <b style={{color:'var(--ok)', fontFamily:'var(--ff-mono)'}}>{myStats.accepted}</b>회</span>
            <span>승률 <b style={{color:'var(--ink)', fontFamily:'var(--ff-mono)'}}>{myStats.winRate}%</b></span>
            <span>MVP <b style={{color:'var(--accent)', fontFamily:'var(--ff-mono)'}}>{myStats.mvpCount}</b>회</span>
            <span>평점 <b style={{color:'var(--ink)', fontFamily:'var(--ff-mono)'}}>★ {myStats.avgRating}</b></span>
          </div>
        </div>
        <button className="btn btn--sm" onClick={()=>setRoute('games')}>게스트 찾기 →</button>
      </div>

      {/* Reliability tips */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10, marginBottom:20}}>
        {[
          { icon:'⚡', title:'빠른 응답', desc:'평균 응답 시간 4시간. 신뢰도에 반영됩니다.' },
          { icon:'🎯', title:'수락률 향상', desc:'프로필·포지션이 상세할수록 수락률이 2배 올라갑니다.' },
          { icon:'🏆', title:'게스트 뱃지', desc:'10회 이상·평점 4.5↑ 달성 시 "프리미엄 게스트" 뱃지 획득.' },
        ].map((t, i) => (
          <div key={i} style={{padding:'14px 16px', background:'var(--bg-alt)', borderRadius:6, display:'flex', gap:10, alignItems:'flex-start'}}>
            <div style={{fontSize:20}}>{t.icon}</div>
            <div>
              <div style={{fontWeight:700, fontSize:12.5}}>{t.title}</div>
              <div style={{fontSize:11.5, color:'var(--ink-mute)', marginTop:2, lineHeight:1.5}}>{t.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{display:'flex', gap:2, borderBottom:'1px solid var(--border)', marginBottom:16}}>
        {[
          { id:'active', label:'진행 중', count: active.length },
          { id:'past',   label:'완료·종료', count: past.length },
        ].map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            padding:'12px 18px', background:'transparent', border:0, cursor:'pointer',
            fontSize:14, fontWeight: tab===t.id ? 700 : 500,
            color: tab===t.id ? 'var(--cafe-blue-deep)' : 'var(--ink-mute)',
            borderBottom: tab===t.id ? '2px solid var(--cafe-blue)' : '2px solid transparent',
            marginBottom:-1,
          }}>
            {t.label} <span style={{fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)', marginLeft:4}}>{t.count}</span>
          </button>
        ))}
      </div>

      <div style={{display:'flex', flexDirection:'column', gap:12}}>
        {list.map(a => <GuestRow key={a.id} a={a} setRoute={setRoute}/>)}
      </div>
    </div>
  );
}

function GuestRow({ a, setRoute }) {
  const statusMap = {
    accepted:  { label:'수락됨',       color:'var(--ok)', bg:'rgba(28,160,94,.1)' },
    pending:   { label:'응답 대기',     color:'var(--warn)', bg:'rgba(232,163,59,.12)' },
    shortlist: { label:'고려 중',       color:'var(--cafe-blue-deep)', bg:'var(--cafe-blue-soft)' },
    completed: { label:'경기 완료',     color:'var(--ink-soft)', bg:'var(--bg-alt)' },
    declined:  { label:'거절',         color:'var(--danger)', bg:'rgba(226,76,75,.08)' },
  };
  const s = statusMap[a.status];
  const g = a.game;

  return (
    <div className="card" style={{padding:0, overflow:'hidden'}}>
      <div style={{padding:'18px 20px'}}>
        <div style={{display:'grid', gridTemplateColumns:'auto 1fr auto', gap:16, alignItems:'flex-start'}}>
          {/* Team badge */}
          <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:4}}>
            <div style={{width:56, height:56, background:a.teamColor, color:a.teamInk, display:'grid', placeItems:'center', fontFamily:'var(--ff-display)', fontWeight:900, fontSize:15, borderRadius:6}}>{a.teamTag}</div>
            <div style={{fontSize:10, color:'var(--ink-dim)', fontWeight:600}}>{a.teamName}</div>
          </div>

          <div style={{minWidth:0}}>
            <div style={{display:'flex', gap:8, alignItems:'center', marginBottom:6, flexWrap:'wrap'}}>
              <span style={{
                display:'inline-flex', alignItems:'center', gap:5,
                padding:'3px 8px', fontSize:11, fontWeight:800, letterSpacing:'.04em',
                color:s.color, background:s.bg, borderRadius:4,
              }}>
                <span style={{width:6, height:6, borderRadius:'50%', background:s.color}}/>
                {s.label}
                {a.status === 'pending' && a.pendingHours && <span style={{opacity:.7}}>· {a.pendingHours}h 경과</span>}
              </span>
              {a.role && <span className="badge badge--ghost">포지션 · {a.role}</span>}
              {a.mvp && <span className="badge badge--red">MVP</span>}
            </div>
            <div style={{fontWeight:700, fontSize:15, marginBottom:3}}>{g.title}</div>
            <div style={{fontSize:12.5, color:'var(--ink-mute)', display:'flex', gap:10, flexWrap:'wrap'}}>
              <span>📅 {g.date} · {g.time}</span>
              <span>📍 {g.court}</span>
              <span>💳 {a.fee}{a.paid ? ' · 결제완료' : a.paid === false ? ' · 미결제' : ''}</span>
            </div>
            {a.result && <div style={{marginTop:6, fontSize:13}}><span style={{color:'var(--ink-dim)'}}>결과 · </span><b>{a.result}</b></div>}
          </div>

          <div style={{display:'flex', flexDirection:'column', gap:6, minWidth:120, alignItems:'stretch'}}>
            {a.status === 'accepted' && (
              <>
                <button className="btn btn--primary btn--sm" onClick={()=>setRoute('gameDetail')}>경기 상세</button>
                <button className="btn btn--sm">팀과 채팅</button>
                <button className="btn btn--sm" style={{color:'var(--danger)'}}>참가 취소</button>
              </>
            )}
            {a.status === 'pending' && (
              <>
                <button className="btn btn--sm">팀에 문의</button>
                <button className="btn btn--sm" style={{color:'var(--danger)'}}>지원 철회</button>
              </>
            )}
            {a.status === 'shortlist' && (
              <>
                <button className="btn btn--sm">팀과 채팅</button>
                <button className="btn btn--sm" style={{color:'var(--danger)'}}>지원 철회</button>
              </>
            )}
            {a.status === 'completed' && (
              <>
                <button className="btn btn--primary btn--sm">후기 남기기</button>
                <button className="btn btn--sm" onClick={()=>setRoute('teamDetail')}>다시 지원</button>
              </>
            )}
            {a.status === 'declined' && (
              <>
                <button className="btn btn--sm" onClick={()=>setRoute('teamDetail')}>팀 보기</button>
              </>
            )}
          </div>
        </div>

        {/* Messages thread */}
        {(a.myMessage || a.teamMessage || a.teamReview || a.declinedReason) && (
          <div style={{marginTop:14, padding:'14px 16px', background:'var(--bg-alt)', borderRadius:6, display:'flex', flexDirection:'column', gap:10}}>
            {a.myMessage && (
              <div style={{display:'flex', gap:10}}>
                <div style={{width:28, height:28, background:'var(--bdr-red)', color:'#fff', display:'grid', placeItems:'center', fontFamily:'var(--ff-mono)', fontSize:10, fontWeight:700, borderRadius:4, flexShrink:0}}>나</div>
                <div style={{flex:1, fontSize:13}}>
                  <div style={{fontSize:11, color:'var(--ink-dim)', marginBottom:2}}>내 지원 메시지 · {a.appliedAt}</div>
                  <div style={{color:'var(--ink-soft)'}}>"{a.myMessage}"</div>
                </div>
              </div>
            )}
            {a.teamMessage && (
              <div style={{display:'flex', gap:10}}>
                <div style={{width:28, height:28, background:a.teamColor, color:a.teamInk, display:'grid', placeItems:'center', fontFamily:'var(--ff-mono)', fontSize:10, fontWeight:700, borderRadius:4, flexShrink:0}}>{a.teamTag.slice(0,2)}</div>
                <div style={{flex:1, fontSize:13}}>
                  <div style={{fontSize:11, color:'var(--ink-dim)', marginBottom:2}}>{a.teamName} 답신{a.decidedAt ? ` · ${a.decidedAt}` : ''}</div>
                  <div style={{color:'var(--ink-soft)'}}>"{a.teamMessage}"</div>
                </div>
              </div>
            )}
            {a.teamReview && (
              <div style={{display:'flex', gap:10, paddingTop:8, borderTop:'1px solid var(--border)'}}>
                <div style={{width:28, height:28, background:a.teamColor, color:a.teamInk, display:'grid', placeItems:'center', fontFamily:'var(--ff-mono)', fontSize:10, fontWeight:700, borderRadius:4, flexShrink:0}}>{a.teamTag.slice(0,2)}</div>
                <div style={{flex:1, fontSize:13}}>
                  <div style={{fontSize:11, color:'var(--ink-dim)', marginBottom:2}}>
                    {a.teamName} 게스트 평가 · <span style={{color:'var(--accent)'}}>{'★'.repeat(a.rating)}{'☆'.repeat(5-a.rating)}</span>
                  </div>
                  <div style={{color:'var(--ink-soft)'}}>"{a.teamReview}"</div>
                </div>
              </div>
            )}
            {a.declinedReason && (
              <div style={{fontSize:12.5, color:'var(--ink-mute)', fontStyle:'italic'}}>
                사유 · {a.declinedReason}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

window.GuestApps = GuestApps;
