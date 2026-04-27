/* global React, GAMES, TOURNAMENTS, Icon */

function Calendar({ setRoute }) {
  const [month, setMonth] = React.useState({ y: 2026, m: 4 }); // April 2026
  const [view, setView] = React.useState('month'); // month | week | list
  const [filter, setFilter] = React.useState('all');

  // Build event list
  const events = [
    { date:'2026-04-25', type:'pickup', title:'미사강변 목요 픽업', time:'20:30', court:'미사강변체육관', color:'var(--cafe-blue)', route:'gameDetail' },
    { date:'2026-04-26', type:'pickup', title:'회룡역 토요 픽업', time:'12:00', court:'회룡역사거리', color:'var(--cafe-blue)' },
    { date:'2026-04-26', type:'pickup', title:'반포 주말 3x3', time:'09:00', court:'반포종합사회복지관', color:'var(--cafe-blue)' },
    { date:'2026-04-27', type:'guest', title:'SWEEP 게스트 3명', time:'13:00', court:'성동구민체육관', color:'var(--accent)' },
    { date:'2026-04-28', type:'scrim', title:'3POINT vs 몽키즈 스크림', time:'20:00', court:'장충체육관', color:'#8B5CF6' },
    { date:'2026-04-28', type:'pickup', title:'수원 새벽 농구', time:'06:00', court:'수원청소년문화센터', color:'var(--cafe-blue)' },
    { date:'2026-04-29', type:'guest', title:'테크노마트 게스트', time:'19:30', court:'강변테크노마트', color:'var(--accent)' },
    { date:'2026-05-01', type:'tournament', title:'BDR Challenge Spring · 접수마감', time:'23:59', court:'온라인', color:'#F59E0B' },
    { date:'2026-05-03', type:'guest', title:'IRON WOLVES 연습경기', time:'14:00', court:'용산국민체육센터', color:'var(--accent)' },
    { date:'2026-05-09', type:'tournament', title:'BDR Challenge Spring · 예선 1일차', time:'09:00', court:'잠실학생체육관', color:'#F59E0B' },
    { date:'2026-05-10', type:'tournament', title:'BDR Challenge Spring · 예선 2일차', time:'09:00', court:'잠실학생체육관', color:'#F59E0B' },
    { date:'2026-05-16', type:'tournament', title:'Kings Cup Vol.07 · 본선', time:'10:00', court:'장충체육관', color:'#F59E0B' },
    { date:'2026-05-17', type:'tournament', title:'Kings Cup Vol.07 · 결승', time:'14:00', court:'장충체육관', color:'#F59E0B' },
    { date:'2026-04-20', type:'done', title:'장충 픽업 · 21–18 승', time:'18:00', court:'장충체육관', color:'var(--ok)' },
    { date:'2026-04-18', type:'done', title:'팀 REDEEM 합류', time:'—', court:'—', color:'var(--ink-dim)' },
    { date:'2026-04-12', type:'done', title:'반포 3x3 · 15–21 패', time:'09:00', court:'반포종합사회복지관', color:'var(--err)' },
    { date:'2026-04-22', type:'done', title:'BDR Challenge 접수', time:'—', court:'—', color:'var(--ok)' },
  ];

  const filtered = filter==='all' ? events : events.filter(e => e.type===filter);

  // Calendar grid
  const first = new Date(month.y, month.m-1, 1);
  const startDow = first.getDay(); // 0=Sun
  const daysInMonth = new Date(month.y, month.m, 0).getDate();
  const prevDays = new Date(month.y, month.m-1, 0).getDate();

  const cells = [];
  // prev month tail
  for (let i = startDow - 1; i >= 0; i--) {
    cells.push({ day: prevDays - i, other: true, date: null });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = `${month.y}-${String(month.m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    cells.push({ day: d, other: false, date: ds });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ day: cells.length - daysInMonth - startDow + 1, other: true, date: null });
  }
  while (cells.length < 42) {
    cells.push({ day: cells.length - daysInMonth - startDow + 1, other: true, date: null });
  }

  const today = '2026-04-23';
  const monthLabel = `${month.y}년 ${month.m}월`;
  const dows = ['일','월','화','수','목','금','토'];

  const nav = (delta) => {
    let m = month.m + delta, y = month.y;
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    setMonth({ y, m });
  };

  const eventsOn = (date) => filtered.filter(e => e.date === date);
  const upcoming = filtered.filter(e => e.date >= today && e.type !== 'done').sort((a,b) => a.date.localeCompare(b.date));
  const past = filtered.filter(e => e.type === 'done').sort((a,b) => b.date.localeCompare(a.date));

  const typeLabel = { pickup:'픽업', guest:'게스트', scrim:'스크림', tournament:'대회', done:'완료' };

  return (
    <div className="page">
      <div style={{display:'flex', gap:6, fontSize:12, color:'var(--ink-mute)', marginBottom:12}}>
        <a onClick={()=>setRoute('home')} style={{cursor:'pointer'}}>홈</a><span>›</span>
        <span style={{color:'var(--ink)'}}>내 일정</span>
      </div>

      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:20, flexWrap:'wrap', gap:12}}>
        <div>
          <div className="eyebrow">My Calendar · 2026</div>
          <h1 style={{margin:'6px 0 0', fontSize:32, fontWeight:800, letterSpacing:'-0.02em'}}>내 일정</h1>
          <p style={{margin:'4px 0 0', color:'var(--ink-mute)', fontSize:13}}>픽업·게스트·대회 일정을 한 화면에서 관리하세요.</p>
        </div>
        <div style={{display:'flex', gap:6, alignItems:'center'}}>
          <div className="theme-switch">
            {['month','week','list'].map(v => (
              <button key={v} className="theme-switch__btn" data-active={view===v} onClick={()=>setView(v)} style={{fontSize:12}}>
                {v==='month'?'월':v==='week'?'주':'리스트'}
              </button>
            ))}
          </div>
          <button className="btn btn--sm">+ 일정 등록</button>
          <button className="btn btn--sm">↗ 내보내기 (ICS)</button>
        </div>
      </div>

      {/* Filters */}
      <div style={{display:'flex', gap:6, marginBottom:14, flexWrap:'wrap'}}>
        {[
          {id:'all', label:`전체 · ${events.length}`, color:null},
          {id:'pickup', label:`픽업 · ${events.filter(e=>e.type==='pickup').length}`, color:'var(--cafe-blue)'},
          {id:'guest', label:`게스트 · ${events.filter(e=>e.type==='guest').length}`, color:'var(--accent)'},
          {id:'scrim', label:`스크림 · ${events.filter(e=>e.type==='scrim').length}`, color:'#8B5CF6'},
          {id:'tournament', label:`대회 · ${events.filter(e=>e.type==='tournament').length}`, color:'#F59E0B'},
          {id:'done', label:`완료 · ${events.filter(e=>e.type==='done').length}`, color:'var(--ink-dim)'},
        ].map(f => (
          <button key={f.id} onClick={()=>setFilter(f.id)} className={`btn ${filter===f.id?'btn--primary':''} btn--sm`} style={{gap:6}}>
            {f.color && <span style={{width:8, height:8, borderRadius:2, background:f.color}}/>}
            {f.label}
          </button>
        ))}
      </div>

      {view === 'month' && (
        <div style={{display:'grid', gridTemplateColumns:'minmax(0,1fr) 320px', gap:18, alignItems:'flex-start'}}>
          <div className="card" style={{padding:0, overflow:'hidden'}}>
            {/* Month header */}
            <div style={{padding:'14px 20px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <div style={{display:'flex', alignItems:'center', gap:10}}>
                <button className="btn btn--sm" onClick={()=>nav(-1)}>‹</button>
                <button className="btn btn--sm" onClick={()=>setMonth({y:2026, m:4})}>오늘</button>
                <button className="btn btn--sm" onClick={()=>nav(1)}>›</button>
                <h2 style={{margin:'0 0 0 8px', fontSize:18, fontFamily:'var(--ff-display)', fontWeight:800, letterSpacing:'-0.01em'}}>{monthLabel}</h2>
              </div>
              <div style={{fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>
                {filtered.filter(e=>e.date?.startsWith(`${month.y}-${String(month.m).padStart(2,'0')}`)).length}건
              </div>
            </div>
            {/* DOW */}
            <div style={{display:'grid', gridTemplateColumns:'repeat(7, 1fr)', borderBottom:'1px solid var(--border)'}}>
              {dows.map((d, i) => (
                <div key={d} style={{padding:'8px 0', textAlign:'center', fontSize:11, fontWeight:700, letterSpacing:'.08em', color: i===0?'var(--err)': i===6?'var(--cafe-blue)':'var(--ink-dim)'}}>{d}</div>
              ))}
            </div>
            {/* Grid */}
            <div style={{display:'grid', gridTemplateColumns:'repeat(7, 1fr)'}}>
              {cells.map((c, i) => {
                const evs = c.date ? eventsOn(c.date) : [];
                const isToday = c.date === today;
                const dow = i % 7;
                return (
                  <div key={i} style={{
                    minHeight:104, padding:'6px 7px 7px',
                    borderRight: (i%7)<6 ? '1px solid var(--border)' : 0,
                    borderBottom: i<35 ? '1px solid var(--border)' : 0,
                    background: isToday ? 'color-mix(in oklab, var(--accent) 6%, transparent)' : c.other ? 'var(--bg-alt)' : 'transparent',
                    opacity: c.other ? 0.35 : 1,
                    position:'relative',
                  }}>
                    <div style={{
                      fontFamily:'var(--ff-mono)',
                      fontSize:12,
                      fontWeight: isToday ? 800 : 600,
                      color: isToday ? 'var(--accent)' : dow===0 ? 'var(--err)' : dow===6 ? 'var(--cafe-blue)' : 'var(--ink)',
                      marginBottom:4,
                      display: isToday ? 'inline-block' : 'block',
                      background: isToday ? 'var(--accent)' : 'transparent',
                      color: isToday ? '#fff' : (dow===0 ? 'var(--err)' : dow===6 ? 'var(--cafe-blue)' : 'var(--ink)'),
                      padding: isToday ? '1px 6px' : 0,
                      borderRadius: isToday ? 99 : 0,
                    }}>{c.day}</div>
                    <div style={{display:'flex', flexDirection:'column', gap:2}}>
                      {evs.slice(0,3).map((e, j) => (
                        <div key={j} onClick={()=>e.route && setRoute(e.route)} style={{
                          fontSize:10, padding:'2px 5px', borderRadius:3,
                          background:`color-mix(in oklab, ${e.color} 18%, var(--bg))`,
                          color:e.color, fontWeight:700,
                          whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
                          borderLeft:`2px solid ${e.color}`,
                          cursor: e.route ? 'pointer' : 'default',
                        }}>
                          <span style={{fontFamily:'var(--ff-mono)', marginRight:3}}>{e.time?.slice(0,5)}</span>{e.title}
                        </div>
                      ))}
                      {evs.length > 3 && <div style={{fontSize:10, color:'var(--ink-dim)', paddingLeft:5}}>+{evs.length-3}건</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sidebar */}
          <aside style={{display:'flex', flexDirection:'column', gap:14, position:'sticky', top:120}}>
            <div className="card" style={{padding:'18px 20px'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:12}}>
                <h3 style={{margin:0, fontSize:14, fontWeight:700}}>다가오는 일정</h3>
                <span style={{fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>{upcoming.length}건</span>
              </div>
              <div style={{display:'flex', flexDirection:'column', gap:10}}>
                {upcoming.slice(0,6).map((e, i) => (
                  <div key={i} onClick={()=>e.route && setRoute(e.route)} style={{display:'grid', gridTemplateColumns:'44px 1fr', gap:10, padding:'8px 10px', background:'var(--bg-alt)', borderRadius:6, cursor: e.route?'pointer':'default', borderLeft:`3px solid ${e.color}`}}>
                    <div style={{textAlign:'center'}}>
                      <div style={{fontSize:9, color:'var(--ink-dim)', fontWeight:700, letterSpacing:'.06em'}}>{e.date.slice(5,7)}월</div>
                      <div style={{fontFamily:'var(--ff-display)', fontSize:18, fontWeight:900, letterSpacing:'-0.02em', lineHeight:1}}>{e.date.slice(8)}</div>
                    </div>
                    <div style={{minWidth:0}}>
                      <div style={{fontWeight:700, fontSize:12, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{e.title}</div>
                      <div style={{fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)', marginTop:1}}>{e.time} · {e.court}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card" style={{padding:'18px 20px'}}>
              <h3 style={{margin:'0 0 10px', fontSize:14, fontWeight:700}}>이번 달 통계</h3>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:0, border:'1px solid var(--border)', borderRadius:6, overflow:'hidden'}}>
                {[
                  { l:'경기', v: events.filter(e=>e.type!=='tournament' && e.date.startsWith('2026-04')).length },
                  { l:'대회', v: events.filter(e=>e.type==='tournament' && e.date.startsWith('2026-04')).length },
                  { l:'완료', v: events.filter(e=>e.type==='done').length },
                  { l:'예정', v: upcoming.length },
                ].map((s, i) => (
                  <div key={s.l} style={{padding:'12px 10px', textAlign:'center', background:'var(--bg-alt)', borderTop: i>=2 ? '1px solid var(--border)' : 0, borderLeft: i%2 ? '1px solid var(--border)' : 0}}>
                    <div style={{fontFamily:'var(--ff-display)', fontSize:22, fontWeight:900, letterSpacing:'-0.01em'}}>{s.v}</div>
                    <div style={{fontSize:10, color:'var(--ink-dim)', fontWeight:700, letterSpacing:'.06em'}}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card" style={{padding:'16px 18px', background:'var(--bg-alt)'}}>
              <div style={{fontSize:11, color:'var(--ink-dim)', fontWeight:700, letterSpacing:'.1em', marginBottom:6}}>TIP</div>
              <div style={{fontSize:12.5, color:'var(--ink-soft)', lineHeight:1.6}}>
                ICS로 내보내면 구글·애플 캘린더에서 자동 갱신됩니다. BDR+ 멤버는 친구 일정도 겹쳐볼 수 있어요.
              </div>
            </div>
          </aside>
        </div>
      )}

      {view === 'list' && (
        <div className="card" style={{padding:'18px 22px'}}>
          <h3 style={{margin:'0 0 16px', fontSize:16, fontWeight:700}}>예정 ({upcoming.length})</h3>
          <div style={{display:'flex', flexDirection:'column', gap:0}}>
            {upcoming.map((e, i) => (
              <div key={i} onClick={()=>e.route && setRoute(e.route)} style={{display:'grid', gridTemplateColumns:'80px 1fr auto', gap:14, padding:'14px 0', borderBottom: i<upcoming.length-1 ? '1px solid var(--border)' : 0, cursor:e.route?'pointer':'default', alignItems:'center'}}>
                <div>
                  <div style={{fontFamily:'var(--ff-mono)', fontSize:11, color:'var(--ink-dim)', fontWeight:700}}>{e.date}</div>
                  <div style={{fontFamily:'var(--ff-display)', fontSize:16, fontWeight:800, marginTop:2}}>{e.time}</div>
                </div>
                <div>
                  <div style={{display:'flex', gap:6, alignItems:'center', marginBottom:3}}>
                    <span style={{fontSize:10, padding:'2px 6px', borderRadius:3, background:`color-mix(in oklab, ${e.color} 20%, var(--bg))`, color:e.color, fontWeight:700}}>{typeLabel[e.type]}</span>
                  </div>
                  <div style={{fontWeight:700, fontSize:14}}>{e.title}</div>
                  <div style={{fontSize:12, color:'var(--ink-mute)', marginTop:2}}>{e.court}</div>
                </div>
                <span className="badge badge--ok">확정</span>
              </div>
            ))}
          </div>
          <h3 style={{margin:'28px 0 16px', fontSize:16, fontWeight:700}}>완료 ({past.length})</h3>
          <div style={{display:'flex', flexDirection:'column', gap:0, opacity:0.7}}>
            {past.map((e, i) => (
              <div key={i} style={{display:'grid', gridTemplateColumns:'80px 1fr auto', gap:14, padding:'12px 0', borderBottom: i<past.length-1 ? '1px solid var(--border)' : 0, alignItems:'center'}}>
                <div style={{fontFamily:'var(--ff-mono)', fontSize:11, color:'var(--ink-dim)'}}>{e.date}</div>
                <div>
                  <div style={{fontWeight:600, fontSize:13}}>{e.title}</div>
                  <div style={{fontSize:11, color:'var(--ink-dim)'}}>{e.court}</div>
                </div>
                <span className="badge badge--ghost">완료</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'week' && (
        <div className="card" style={{padding:'40px', textAlign:'center', color:'var(--ink-mute)'}}>
          <div style={{fontSize:14}}>주간 뷰는 준비 중입니다. 월간 또는 리스트 뷰를 이용해주세요.</div>
        </div>
      )}
    </div>
  );
}

window.Calendar = Calendar;
