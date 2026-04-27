/* global React, TOURNAMENTS, Icon */

function Referee({ setRoute }) {
  const [tab, setTab] = React.useState('dashboard');
  const [status] = React.useState('certified'); // none | applying | certified

  const me = {
    name: 'rdm_captain',
    certLevel: 'L.2',
    certSince: '2025.08.14',
    certExpires: '2027.08.14',
    certNumber: 'BDR-REF-0247',
    hoursLogged: 48,
    gamesOfficiated: 34,
    rating: 4.7,
    ratingCount: 28,
    punctuality: 96,
    complaints: 0,
    nextExam: '2026.05.18',
    payRate: '₩25,000',
  };

  const upcomingAssignments = [
    { id:'a1', date:'04.26 (토)', time:'14:00', court:'장충체육관', role:'주심', game:'BDR Challenge 예선 1조', level:'OPEN', pay:'₩50,000', status:'확정', partner:'ref_kimj' },
    { id:'a2', date:'04.27 (일)', time:'10:00', court:'용산국민체육센터', role:'부심', game:'KINGS CUP 결승', level:'PRO', pay:'₩60,000', status:'확정', partner:'ref_shin' },
    { id:'a3', date:'05.02 (토)', time:'19:00', court:'하남미사체육관', role:'주심', game:'Friday Night Hoops', level:'AMATEUR', pay:'₩25,000', status:'제안', partner:null },
  ];

  const openings = [
    { id:'o1', tourn:'BDR Challenge Spring 2026', date:'04.11-12', court:'장충체육관', need:'주심 2·부심 4', level:'OPEN', pay:'₩50K/경기', deadline:'D-3' },
    { id:'o2', tourn:'Friday Night Hoops May', date:'05.09', court:'용산', need:'주심 1', level:'AMATEUR', pay:'₩25K/경기', deadline:'D-16' },
    { id:'o3', tourn:'HEATWAVE Summer 2026', date:'07.18-19', court:'양재체육관', need:'주심 4·부심 8·기록원 2', level:'OPEN', pay:'₩60K/경기', deadline:'D-83' },
  ];

  const history = [
    { date:'04.18', game:'몽키즈 vs 3POINT', level:'OPEN', role:'주심', rating:5, review:'콜 정확하고 경기 운영 깔끔' },
    { date:'04.12', game:'REDEEM vs IRON WOLVES', level:'OPEN', role:'부심', rating:5, review:'매끄러운 진행' },
    { date:'04.05', game:'KINGS vs ZONE', level:'PRO', role:'주심', rating:4, review:'후반 파울 콜 일관성 개선 필요' },
    { date:'03.29', game:'Friday Night Hoops', level:'AMATEUR', role:'주심', rating:5, review:'초보자 배려 좋음' },
  ];

  return (
    <div className="page">
      <div style={{display:'flex', gap:6, fontSize:12, color:'var(--ink-mute)', marginBottom:12}}>
        <a onClick={()=>setRoute('home')} style={{cursor:'pointer'}}>홈</a><span>›</span>
        <span style={{color:'var(--ink)'}}>심판 센터</span>
      </div>

      {/* Hero */}
      <div className="card" style={{padding:0, overflow:'hidden', marginBottom:16}}>
        <div style={{padding:'28px 32px', background:'linear-gradient(135deg, #1D232B 0%, #000 100%)', color:'#fff', display:'grid', gridTemplateColumns:'auto 1fr auto', gap:20, alignItems:'center'}}>
          <div style={{width:72, height:72, background:'var(--accent)', display:'grid', placeItems:'center', fontFamily:'var(--ff-display)', fontSize:28, fontWeight:900, borderRadius:6}}>🦓</div>
          <div>
            <div style={{fontSize:11, letterSpacing:'.12em', opacity:.7, fontWeight:700, textTransform:'uppercase'}}>BDR 심판 센터</div>
            <h1 style={{margin:'4px 0 4px', fontSize:28, fontWeight:800, letterSpacing:'-0.015em'}}>
              {me.name} <span style={{color:'var(--accent)', fontFamily:'var(--ff-display)', marginLeft:8}}>{me.certLevel}</span>
            </h1>
            <div style={{fontSize:13, opacity:.85}}>
              자격증 · {me.certNumber} · 유효 {me.certExpires}
            </div>
          </div>
          <div style={{display:'flex', flexDirection:'column', gap:6, minWidth:140}}>
            <button className="btn btn--sm" style={{background:'#fff', color:'#000', border:0}}>심판 소개서 PDF</button>
            <button className="btn btn--sm" style={{background:'transparent', color:'#fff', border:'1px solid rgba(255,255,255,.3)'}}>가용 시간 설정</button>
          </div>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(6, 1fr)', borderTop:'1px solid var(--border)'}}>
          {[
            { label:'누적 경기', value: me.gamesOfficiated },
            { label:'누적 시간', value: `${me.hoursLogged}h` },
            { label:'평점',     value: `★ ${me.rating}`, sub:`${me.ratingCount}건` },
            { label:'정시율',    value: `${me.punctuality}%` },
            { label:'민원',     value: me.complaints },
            { label:'이번달 수입', value: '₩185K' },
          ].map((s, i) => (
            <div key={i} style={{padding:'14px 10px', textAlign:'center', borderLeft: i>0 ? '1px solid var(--border)' : 0}}>
              <div style={{fontFamily:'var(--ff-display)', fontWeight:900, fontSize:22}}>{s.value}</div>
              <div style={{fontSize:10, color:'var(--ink-dim)', fontWeight:600, letterSpacing:'.04em', textTransform:'uppercase', marginTop:2}}>{s.label}</div>
              {s.sub && <div style={{fontSize:10, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>{s.sub}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:'flex', gap:2, borderBottom:'1px solid var(--border)', marginBottom:16}}>
        {[
          { id:'dashboard', label:'대시보드' },
          { id:'openings',  label:'배정 모집', count: openings.length },
          { id:'history',   label:'심판 이력' },
          { id:'cert',      label:'자격·교육' },
        ].map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            padding:'12px 18px', background:'transparent', border:0, cursor:'pointer',
            fontSize:14, fontWeight: tab===t.id?700:500,
            color: tab===t.id?'var(--cafe-blue-deep)':'var(--ink-mute)',
            borderBottom: tab===t.id?'2px solid var(--cafe-blue)':'2px solid transparent', marginBottom:-1,
          }}>
            {t.label}{t.count && <span style={{fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)', marginLeft:4}}>{t.count}</span>}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <div style={{display:'grid', gridTemplateColumns:'minmax(0,1fr) 320px', gap:16}}>
          <div className="card" style={{padding:'22px 24px'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:14}}>
              <h2 style={{margin:0, fontSize:16, fontWeight:700}}>다가오는 배정</h2>
              <a style={{fontSize:12, color:'var(--ink-dim)', cursor:'pointer'}}>전체 일정 →</a>
            </div>
            <div style={{display:'flex', flexDirection:'column', gap:10}}>
              {upcomingAssignments.map(a => (
                <div key={a.id} style={{display:'grid', gridTemplateColumns:'70px 1fr auto', gap:14, padding:'12px 14px', background:'var(--bg-alt)', borderRadius:6, alignItems:'center'}}>
                  <div style={{textAlign:'center'}}>
                    <div style={{fontFamily:'var(--ff-mono)', fontSize:11, color:'var(--accent)', fontWeight:700}}>{a.date}</div>
                    <div style={{fontFamily:'var(--ff-display)', fontWeight:900, fontSize:18}}>{a.time}</div>
                  </div>
                  <div style={{minWidth:0}}>
                    <div style={{display:'flex', gap:6, alignItems:'center', marginBottom:3}}>
                      <span className="badge" style={{background: a.role==='주심'?'var(--accent)':'var(--cafe-blue)', color:'#fff', border:0}}>{a.role}</span>
                      <span className="badge badge--ghost">{a.level}</span>
                      {a.status === '제안' && <span className="badge badge--warn">응답필요</span>}
                    </div>
                    <div style={{fontWeight:700, fontSize:14}}>{a.game}</div>
                    <div style={{fontSize:12, color:'var(--ink-mute)'}}>📍 {a.court} {a.partner && ` · 파트너 ${a.partner}`}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontFamily:'var(--ff-mono)', fontWeight:700, fontSize:14}}>{a.pay}</div>
                    {a.status === '제안' ? (
                      <div style={{display:'flex', gap:4, marginTop:6}}>
                        <button className="btn btn--sm" style={{padding:'3px 8px'}}>거절</button>
                        <button className="btn btn--primary btn--sm" style={{padding:'3px 8px'}}>수락</button>
                      </div>
                    ) : (
                      <div style={{fontSize:11, color:'var(--ok)', fontWeight:700, marginTop:2}}>✓ 확정</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside style={{display:'flex', flexDirection:'column', gap:14}}>
            <div className="card" style={{padding:'18px 20px'}}>
              <div style={{fontSize:11, color:'var(--ink-dim)', fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', marginBottom:8}}>다음 교육</div>
              <div style={{fontSize:15, fontWeight:700}}>L.3 승급 필기시험</div>
              <div style={{fontSize:12, color:'var(--ink-mute)', fontFamily:'var(--ff-mono)', marginTop:2}}>{me.nextExam} · 온라인</div>
              <button className="btn btn--primary btn--sm" style={{width:'100%', marginTop:10}}>신청하기</button>
            </div>
            <div className="card" style={{padding:'18px 20px'}}>
              <div style={{fontSize:11, color:'var(--ink-dim)', fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', marginBottom:8}}>심판 커뮤니티</div>
              <a className="aside__link">심판 공지 <span className="badge badge--new">N</span></a>
              <a className="aside__link">규정 업데이트</a>
              <a className="aside__link">Q&amp;A</a>
            </div>
          </aside>
        </div>
      )}

      {tab === 'openings' && (
        <div className="card" style={{padding:0, overflow:'hidden'}}>
          <div className="board__head" style={{gridTemplateColumns:'1.6fr 1fr 1fr 1fr 80px 80px'}}>
            <div style={{textAlign:'left'}}>대회</div><div>일자</div><div>장소</div><div>모집</div><div>수당</div><div>마감</div>
          </div>
          {openings.map(o => (
            <div key={o.id} className="board__row" style={{gridTemplateColumns:'1.6fr 1fr 1fr 1fr 80px 80px'}}>
              <div className="title"><b>{o.tourn}</b> <span className="badge badge--ghost" style={{marginLeft:6}}>{o.level}</span></div>
              <div style={{fontFamily:'var(--ff-mono)'}}>{o.date}</div>
              <div>{o.court}</div>
              <div style={{fontSize:12}}>{o.need}</div>
              <div style={{fontFamily:'var(--ff-mono)', fontWeight:700}}>{o.pay}</div>
              <div><span className="badge badge--red">{o.deadline}</span></div>
            </div>
          ))}
        </div>
      )}

      {tab === 'history' && (
        <div className="card" style={{padding:0, overflow:'hidden'}}>
          <div className="board__head" style={{gridTemplateColumns:'80px 1.4fr 80px 70px 70px 1.2fr'}}>
            <div>날짜</div><div style={{textAlign:'left'}}>경기</div><div>레벨</div><div>역할</div><div>평점</div><div style={{textAlign:'left'}}>피드백</div>
          </div>
          {history.map((h, i) => (
            <div key={i} className="board__row" style={{gridTemplateColumns:'80px 1.4fr 80px 70px 70px 1.2fr'}}>
              <div style={{fontFamily:'var(--ff-mono)', color:'var(--ink-dim)'}}>{h.date}</div>
              <div className="title">{h.game}</div>
              <div><span className="badge badge--ghost">{h.level}</span></div>
              <div>{h.role}</div>
              <div style={{color:'var(--accent)', fontWeight:700}}>{'★'.repeat(h.rating)}</div>
              <div className="title" style={{fontSize:12, color:'var(--ink-mute)'}}>{h.review}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'cert' && (
        <div style={{display:'grid', gridTemplateColumns:'minmax(0,1fr) 320px', gap:16}}>
          <div className="card" style={{padding:'24px 26px'}}>
            <div style={{display:'flex', gap:10, alignItems:'center', marginBottom:18}}>
              <span style={{width:10, height:10, borderRadius:'50%', background:'var(--ok)'}}/>
              <h2 style={{margin:0, fontSize:18, fontWeight:700}}>자격 현황 · 활성</h2>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14}}>
              {[
                { l:'등급', v: me.certLevel, s:'L.1~L.5 (최고)' },
                { l:'취득일', v: me.certSince, s:'— ' },
                { l:'만료', v: me.certExpires, s:'갱신 D-478' },
                { l:'시간당 기본 수당', v: me.payRate, s:'AMATEUR 기준' },
              ].map(x => (
                <div key={x.l} style={{padding:'14px 16px', background:'var(--bg-alt)', borderRadius:6}}>
                  <div style={{fontSize:10, color:'var(--ink-dim)', fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase'}}>{x.l}</div>
                  <div style={{fontFamily:'var(--ff-display)', fontWeight:800, fontSize:18, marginTop:3}}>{x.v}</div>
                  <div style={{fontSize:11, color:'var(--ink-mute)'}}>{x.s}</div>
                </div>
              ))}
            </div>
            <div style={{marginTop:20}}>
              <h3 style={{fontSize:14, fontWeight:700, marginBottom:8}}>이수 교육</h3>
              <div style={{display:'flex', flexDirection:'column', gap:6}}>
                {[
                  { name:'BDR L.2 기본과정', date:'2025.08.14', hours:12 },
                  { name:'3x3 규정 업데이트 2025', date:'2025.11.02', hours:4 },
                  { name:'경기 운영·세이프티', date:'2026.02.18', hours:6 },
                ].map(c => (
                  <div key={c.name} style={{display:'flex', justifyContent:'space-between', padding:'10px 12px', background:'var(--bg-alt)', borderRadius:6, fontSize:13}}>
                    <span><b>{c.name}</b></span>
                    <span style={{fontFamily:'var(--ff-mono)', color:'var(--ink-mute)'}}>{c.date} · {c.hours}h</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <aside className="card" style={{padding:'20px 22px'}}>
            <h3 style={{margin:'0 0 10px', fontSize:14, fontWeight:700}}>심판 등급 체계</h3>
            <div style={{fontSize:12.5, color:'var(--ink-soft)', lineHeight:1.8}}>
              <div><b>L.1</b> · 국제·프로 · 주경기</div>
              <div><b>L.2</b> · OPEN 대회 주심 <span style={{color:'var(--accent)', fontWeight:700}}>· 현재</span></div>
              <div><b>L.3</b> · PRO 대회 부심</div>
              <div><b>L.4</b> · AMATEUR 주심</div>
              <div><b>L.5</b> · 수습·기록원</div>
            </div>
            <button className="btn btn--primary btn--sm" style={{width:'100%', marginTop:14}}>L.3 승급 신청</button>
          </aside>
        </div>
      )}
    </div>
  );
}

window.Referee = Referee;
