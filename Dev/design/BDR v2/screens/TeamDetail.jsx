/* global React, TEAMS, PLAYERS, Icon, Avatar */

function TeamDetail({ setRoute, teamId }) {
  const t = TEAMS.find(x => x.id === teamId) || TEAMS[0];
  const [tab, setTab] = React.useState('overview');
  const winRate = Math.round(t.wins / (t.wins + t.losses) * 100);

  const roster = [
    { num: 4,  name: '박성진', pos: 'PG', role: '주장', ppg: 16.8 },
    { num: 7,  name: '정승우', pos: 'SG', role: '부주장', ppg: 11.4 },
    { num: 11, name: '김태윤', pos: 'SF', role: '선수', ppg: 9.6 },
    { num: 14, name: '송진수', pos: 'PF', role: '선수', ppg: 8.2 },
    { num: 23, name: '임재현', pos: 'C',  role: '선수', ppg: 12.5 },
    { num: 32, name: '오민호', pos: 'SG', role: '선수', ppg: 7.1 },
  ];

  const recent = [
    { date: '04.12', opp: '몽키즈',       score: '21 : 18', result: 'W', tournament: 'BDR CHALLENGE' },
    { date: '03.28', opp: 'KINGS CREW',   score: '17 : 19', result: 'L', tournament: 'KINGS CUP' },
    { date: '03.15', opp: '3POINT',       score: '22 : 14', result: 'W', tournament: '정규 리그' },
    { date: '03.02', opp: 'THE ZONE',     score: '20 : 16', result: 'W', tournament: '정규 리그' },
    { date: '02.18', opp: 'SEOUL HEAT',   score: '15 : 21', result: 'L', tournament: '스크림' },
  ];

  return (
    <div className="page page--wide">
      <div style={{display:'flex', alignItems:'center', gap:6, fontSize:12, color:'var(--ink-mute)', marginBottom:14, flexWrap:'wrap'}}>
        <a onClick={()=>setRoute('home')} style={{cursor:'pointer'}}>홈</a>
        <span>›</span>
        <a onClick={()=>setRoute('team')} style={{cursor:'pointer'}}>팀</a>
        <span>›</span>
        <span style={{color:'var(--ink)'}}>{t.name}</span>
      </div>

      {/* Hero */}
      <div style={{
        background: `linear-gradient(135deg, ${t.color} 0%, ${t.color}CC 60%, #0B0D10 140%)`,
        color: t.ink, borderRadius:'var(--radius-card)', padding:'36px 32px', marginBottom:20,
        position:'relative', overflow:'hidden',
      }}>
        <div style={{position:'absolute', right:-20, top:-20, fontFamily:'var(--ff-display)', fontWeight:900, fontSize:220, letterSpacing:'-0.04em', opacity:.12, lineHeight:.8}}>{t.tag}</div>
        <div style={{position:'relative', display:'grid', gridTemplateColumns:'auto 1fr auto', gap:24, alignItems:'flex-end'}}>
          <Avatar src={t.logo} tag={t.tag} name={t.name} color="rgba(255,255,255,.2)" ink={t.ink} size={96} radius={12}/>
          <div>
            <div style={{fontFamily:'var(--ff-display)', fontSize:12, fontWeight:800, letterSpacing:'.14em', opacity:.9, marginBottom:10}}>TEAM · {t.tag} · 창단 {t.founded}</div>
            <h1 className="t-display" style={{margin:0, fontSize:52, lineHeight:1, letterSpacing:'-0.02em'}}>{t.name}</h1>
            <div style={{display:'flex', gap:22, marginTop:18, fontSize:14, flexWrap:'wrap'}}>
              <div><b style={{fontSize:22, fontFamily:'var(--ff-display)'}}>{t.rating}</b> <span style={{opacity:.75, marginLeft:4}}>레이팅</span></div>
              <div><b style={{fontSize:22, fontFamily:'var(--ff-display)'}}>{t.wins}</b> <span style={{opacity:.75, marginLeft:4}}>승</span></div>
              <div><b style={{fontSize:22, fontFamily:'var(--ff-display)'}}>{t.losses}</b> <span style={{opacity:.75, marginLeft:4}}>패</span></div>
              <div><b style={{fontSize:22, fontFamily:'var(--ff-display)'}}>{winRate}%</b> <span style={{opacity:.75, marginLeft:4}}>승률</span></div>
            </div>
          </div>
          <div style={{display:'flex', gap:8}}>
            <button className="btn" style={{background:'rgba(255,255,255,.16)', color:t.ink, borderColor:'rgba(255,255,255,.35)'}}>팔로우</button>
            <button className="btn btn--accent">매치 신청</button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:'flex', borderBottom:'2px solid var(--border)', marginBottom:20}}>
        {[['overview','개요'],['roster','로스터'],['recent','최근 경기'],['stats','기록']].map(([k, l]) => (
          <button key={k} onClick={()=>setTab(k)} style={{
            padding:'12px 18px', background:'transparent', border:0,
            borderBottom: tab===k ? '3px solid var(--cafe-blue)' : '3px solid transparent',
            color: tab===k ? 'var(--ink)' : 'var(--ink-mute)',
            fontWeight: tab===k ? 700 : 500, fontSize:14, cursor:'pointer', marginBottom:-2,
          }}>{l}</button>
        ))}
      </div>

      <div style={{display:'grid', gridTemplateColumns:'minmax(0,1fr) 320px', gap:24, alignItems:'flex-start'}}>
        <div>
          {tab === 'overview' && (
            <>
              <div className="card" style={{padding:'20px 22px', marginBottom:16}}>
                <h2 style={{margin:'0 0 10px', fontSize:18, fontWeight:700}}>팀 소개</h2>
                <p style={{margin:0, color:'var(--ink-soft)', lineHeight:1.7}}>
                  {t.founded}년 창단한 {t.name} 입니다. 매주 화·목·토 정기 연습을 진행하며, 2025 동계 대회 4강 진출을 목표로 하고 있습니다.
                  신입 게스트 1~2명 상시 모집 중이며, 중급 이상 경력자 우대합니다.
                </p>
              </div>
              <div className="card" style={{padding:'20px 22px'}}>
                <h2 style={{margin:'0 0 14px', fontSize:18, fontWeight:700}}>팀 정보</h2>
                <div style={{display:'grid', gridTemplateColumns:'120px 1fr', rowGap:10, fontSize:14}}>
                  <div style={{color:'var(--ink-dim)'}}>창단</div><div>{t.founded}년</div>
                  <div style={{color:'var(--ink-dim)'}}>홈 코트</div><div>용산국민체육센터</div>
                  <div style={{color:'var(--ink-dim)'}}>연습일</div><div>매주 화·목·토</div>
                  <div style={{color:'var(--ink-dim)'}}>팀 레벨</div><div>중-상급</div>
                  <div style={{color:'var(--ink-dim)'}}>레이팅</div><div><b>{t.rating}</b> · 전체 {TEAMS.findIndex(x=>x.id===t.id)+1}위</div>
                  <div style={{color:'var(--ink-dim)'}}>게스트 모집</div><div><span className="badge badge--ok">상시 모집</span></div>
                </div>
              </div>
            </>
          )}

          {tab === 'roster' && (
            <div className="board">
              <div className="board__head" style={{gridTemplateColumns:'56px 1fr 80px 100px 80px'}}>
                <div>#</div><div>이름</div><div>포지션</div><div>역할</div><div>PPG</div>
              </div>
              {roster.map(r => (
                <div key={r.num} className="board__row" style={{gridTemplateColumns:'56px 1fr 80px 100px 80px'}}>
                  <div className="num" style={{fontFamily:'var(--ff-display)', fontWeight:900, fontSize:16, color: t.color}}>{r.num}</div>
                  <div className="title">
                    <span style={{width:22, height:22, background:'var(--bg-alt)', display:'grid', placeItems:'center', fontSize:11, fontWeight:700, borderRadius:'50%', flexShrink:0}}>{r.name.charAt(0)}</span>
                    <span style={{fontWeight:600}}>{r.name}</span>
                  </div>
                  <div style={{fontFamily:'var(--ff-mono)', fontWeight:700}}>{r.pos}</div>
                  <div>{r.role === '주장' ? <span className="badge badge--red">{r.role}</span> : r.role === '부주장' ? <span className="badge badge--soft">{r.role}</span> : <span style={{color:'var(--ink-mute)', fontSize:12}}>{r.role}</span>}</div>
                  <div style={{fontFamily:'var(--ff-mono)', fontWeight:700}}>{r.ppg}</div>
                </div>
              ))}
            </div>
          )}

          {tab === 'recent' && (
            <div className="board">
              <div className="board__head" style={{gridTemplateColumns:'80px 1fr 120px 80px 160px'}}>
                <div>날짜</div><div>상대</div><div>스코어</div><div>결과</div><div>대회</div>
              </div>
              {recent.map((m, i) => (
                <div key={i} className="board__row" style={{gridTemplateColumns:'80px 1fr 120px 80px 160px'}}>
                  <div style={{fontFamily:'var(--ff-mono)', fontSize:12}}>{m.date}</div>
                  <div className="title"><a>{m.opp}</a></div>
                  <div style={{fontFamily:'var(--ff-mono)', fontWeight:700}}>{m.score}</div>
                  <div>{m.result === 'W' ? <span className="badge badge--ok">W</span> : <span className="badge" style={{background:'var(--ink-dim)', color:'#fff', borderColor:'transparent'}}>L</span>}</div>
                  <div style={{fontSize:12, color:'var(--ink-mute)'}}>{m.tournament}</div>
                </div>
              ))}
            </div>
          )}

          {tab === 'stats' && (
            <div className="card" style={{padding:'22px'}}>
              <h2 style={{margin:'0 0 16px', fontSize:18, fontWeight:700}}>2026 시즌 평균</h2>
              <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:14}}>
                {[['득점', 18.4],['실점', 15.2],['리바', 28.1],['어시', 12.3]].map(([l, v]) => (
                  <div key={l} style={{padding:'14px 16px', background:'var(--bg-alt)', borderRadius:'var(--radius-chip)'}}>
                    <div style={{fontSize:11, color:'var(--ink-dim)', textTransform:'uppercase', letterSpacing:'.08em', fontWeight:700}}>{l}</div>
                    <div style={{fontFamily:'var(--ff-display)', fontWeight:900, fontSize:28, marginTop:4, letterSpacing:'-0.02em'}}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Side */}
        <aside style={{position:'sticky', top:120}}>
          <div className="card" style={{padding:'18px 20px', marginBottom:14}}>
            <div style={{fontSize:11, fontWeight:800, letterSpacing:'.1em', color:'var(--ink-dim)', textTransform:'uppercase', marginBottom:10}}>최근 폼</div>
            <div style={{display:'flex', gap:6, marginBottom:14}}>
              {['W','W','L','W','W'].map((r, i) => (
                <span key={i} style={{width:28, height:28, display:'grid', placeItems:'center', fontFamily:'var(--ff-display)', fontWeight:900, fontSize:13, color:'#fff', background: r === 'W' ? 'var(--ok)' : 'var(--ink-dim)', borderRadius:4}}>{r}</span>
              ))}
            </div>
            <button className="btn btn--primary btn--xl" style={{marginBottom:8}}>게스트 지원</button>
            <button className="btn" style={{width:'100%'}}>팀 매치 신청</button>
          </div>
          <div className="card" style={{padding:'16px 20px'}}>
            <div style={{fontSize:11, fontWeight:800, letterSpacing:'.1em', color:'var(--ink-dim)', textTransform:'uppercase', marginBottom:10}}>연락</div>
            <div style={{fontSize:13, color:'var(--ink-soft)', lineHeight:1.7}}>
              팀장 · rdm_captain<br/>
              응답시간 · 평균 2시간
            </div>
            <button className="btn btn--sm" style={{marginTop:10, width:'100%'}}>쪽지 보내기</button>
          </div>
        </aside>
      </div>
    </div>
  );
}

window.TeamDetail = TeamDetail;
