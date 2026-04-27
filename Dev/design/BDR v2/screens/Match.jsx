/* global React, TOURNAMENTS, TEAMS, BRACKET_R16, SCHEDULE, Icon, Poster, Avatar */

function MatchList({ setRoute }) {
  const statusLabel = {
    open: '접수중', closing: '마감임박', closed: '접수마감', live: '진행중', ended: '종료', preparing: '접수예정',
  };
  const statusBadge = {
    open: 'badge--ok', closing: 'badge--red', closed: 'badge--ghost', live: 'badge--red', ended: 'badge--ghost', preparing: 'badge--soft',
  };
  const [filter, setFilter] = React.useState('전체');
  const filters = ['전체','접수중','마감임박','진행중','접수예정','종료'];
  const shown = TOURNAMENTS.filter(t => {
    if (filter === '전체') return true;
    if (filter === '접수중') return t.status === 'open';
    if (filter === '마감임박') return t.status === 'closing';
    if (filter === '진행중') return t.status === 'live';
    if (filter === '접수예정') return t.status === 'preparing';
    if (filter === '종료') return t.status === 'ended';
    return true;
  });

  return (
    <div className="page">
      <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:10}}>
        <div>
          <div className="eyebrow">대회 · TOURNAMENTS</div>
          <h1 style={{margin:'6px 0 4px', fontSize:28, fontWeight:800, letterSpacing:'-0.015em'}}>열린 대회 · 예정 대회</h1>
          <div style={{fontSize:13, color:'var(--ink-mute)'}}>접수중 {TOURNAMENTS.filter(t=>t.status==='open').length} · 마감임박 {TOURNAMENTS.filter(t=>t.status==='closing').length} · 진행중 {TOURNAMENTS.filter(t=>t.status==='live').length} · 예정 {TOURNAMENTS.filter(t=>t.status==='preparing').length}</div>
        </div>
        <button className="btn btn--primary"><Icon.plus/> 대회 개설</button>
      </div>

      <div style={{display:'flex', gap:8, marginBottom:16, flexWrap:'wrap'}}>
        {filters.map(s => (
          <button key={s} className="btn btn--sm" onClick={()=>setFilter(s)}
            style={filter === s ? {background:'var(--cafe-blue)', color:'#fff', borderColor:'var(--cafe-blue-deep)'} : {}}>{s}</button>
        ))}
      </div>

      <div style={{display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:14}}>
        {shown.map(t => (
          <div key={t.id} className="card" style={{padding:0, display:'grid', gridTemplateColumns:'140px 1fr', overflow:'hidden', cursor:'pointer'}} onClick={()=>setRoute('matchDetail')}>
            {t.poster ? (
              <Poster src={t.poster} title={t.title} edition={t.edition} accent={t.accent} width="100%" height={148} radius={0}/>
            ) : (
              <div style={{background:`linear-gradient(155deg, ${t.accent}, ${t.accent}CC 50%, #000 130%)`, color:'#fff', padding:14, display:'flex', flexDirection:'column', justifyContent:'space-between', minHeight:148, position:'relative', overflow:'hidden'}}>
                <div style={{position:'absolute', inset:0, opacity:.1, background:'repeating-linear-gradient(135deg, #fff 0 2px, transparent 2px 14px)'}}/>
                <div style={{fontSize:10, fontWeight:800, letterSpacing:'.12em', opacity:.85, position:'relative'}}>{t.level}</div>
                <div style={{position:'relative'}}>
                  <div style={{fontFamily:'var(--ff-display)', fontSize:18, fontWeight:900, lineHeight:1, letterSpacing:'-0.01em'}}>{t.title.split(' ')[0]}</div>
                  <div style={{fontFamily:'var(--ff-display)', fontSize:18, fontWeight:900, lineHeight:1, letterSpacing:'-0.01em'}}>{t.title.split(' ').slice(1).join(' ') || t.edition}</div>
                  <div style={{fontSize:10, opacity:.7, marginTop:4}}>{t.edition}</div>
                </div>
              </div>
            )}
            <div style={{padding:16, display:'flex', flexDirection:'column', gap:8}}>
              <div style={{display:'flex', gap:6, alignItems:'center'}}>
                <span className={`badge ${statusBadge[t.status]}`}>{statusLabel[t.status]}</span>
                {t.tags.slice(1,3).map(tag => <span key={tag} className="badge badge--ghost" style={{fontSize:10}}>{tag}</span>)}
              </div>
              <div style={{fontWeight:700, fontSize:16, letterSpacing:'-0.01em'}}>{t.subtitle}</div>
              <div style={{fontSize:13, color:'var(--ink-mute)', display:'grid', gridTemplateColumns:'auto 1fr', columnGap:10, rowGap:4}}>
                <span>📅</span><span>{t.dates}</span>
                <span>📍</span><span>{t.court}</span>
                <span>💰</span><span>{t.prize} · 참가비 {t.fee}</span>
              </div>
              <div style={{display:'flex', alignItems:'center', gap:10, marginTop:'auto'}}>
                <div style={{flex:1, height:6, background:'var(--bg-alt)', borderRadius:3, overflow:'hidden'}}>
                  <div style={{width:`${(t.applied/t.capacity)*100}%`, height:'100%', background: t.status === 'closing' ? 'var(--accent)' : 'var(--cafe-blue)'}}/>
                </div>
                <div style={{fontSize:12, color:'var(--ink-mute)', fontFamily:'var(--ff-mono)'}}>{t.applied}/{t.capacity}</div>
                <button className="btn btn--sm btn--primary" onClick={(e)=>{e.stopPropagation(); setRoute('matchDetail');}}>
                  {t.status === 'open' || t.status === 'closing' ? '신청' : t.status === 'live' ? '라이브' : '상세'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MatchDetail({ setRoute }) {
  const t = TOURNAMENTS[0];
  const [tab, setTab] = React.useState('overview');
  const appliedTeams = ['redeem','monkeys','3point','kings','zone','pivot','iron','heat'].map(id => TEAMS.find(x=>x.id===id)).filter(Boolean);

  return (
    <div className="page page--wide">
      <div style={{display:'flex', alignItems:'center', gap:6, fontSize:12, color:'var(--ink-mute)', marginBottom:10, whiteSpace:'nowrap', flexWrap:'wrap'}}>
        <a onClick={()=>setRoute('home')} style={{cursor:'pointer'}}>홈</a>
        <span>›</span>
        <a onClick={()=>setRoute('match')} style={{cursor:'pointer'}}>대회</a>
        <span>›</span>
        <span style={{color:'var(--ink)'}}>{t.title}</span>
      </div>

      <div style={{background:`linear-gradient(135deg, ${t.accent}, ${t.accent}AA 50%, #0B0D10)`, color:'#fff', padding:'36px 32px', borderRadius:'var(--radius-card)', position:'relative', overflow:'hidden', marginBottom:20, display:'grid', gridTemplateColumns: t.poster ? '200px 1fr' : '1fr', gap:28, alignItems:'center'}}>
        {t.poster && <Poster src={t.poster} title={t.title} edition={t.edition} accent={t.accent} width={200} height={280} radius={8}/>}
        <div>
          <div style={{fontSize:11, letterSpacing:'.12em', fontWeight:800, opacity:.85, marginBottom:10}}>{t.level} · {t.edition}</div>
          <h1 className="t-display" style={{margin:'0 0 8px', fontSize:48, letterSpacing:'-0.02em'}}>{t.title}</h1>
          <div style={{fontSize:16, opacity:.9, marginBottom:18}}>{t.subtitle}</div>
          <div style={{display:'flex', gap:18, fontSize:13, opacity:.9, flexWrap:'wrap'}}>
            <span>📅 {t.dates}</span>
            <span>📍 {t.court}</span>
            <span>💰 상금 {t.prize}</span>
            <span>👥 {t.format}</span>
          </div>
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'minmax(0,1fr) 340px', gap:24, alignItems:'flex-start'}}>
        <div>
          <div style={{display:'flex', borderBottom:'2px solid var(--border)', marginBottom:20, flexWrap:'wrap'}}>
            {[['overview','대회소개'],['schedule','경기일정'],['bracket','대진표'],['teams','참가팀'],['rules','규정']].map(([k,l]) => (
              <button key={k} onClick={()=>setTab(k)} style={{
                padding:'12px 18px', background:'transparent', border:0,
                borderBottom: tab===k ? '3px solid var(--cafe-blue)' : '3px solid transparent',
                color: tab===k ? 'var(--ink)' : 'var(--ink-mute)',
                fontWeight: tab===k ? 700 : 500, fontSize:14, cursor:'pointer', marginBottom:-2,
              }}>{l}</button>
            ))}
          </div>

          {tab === 'overview' && (
            <div className="card" style={{padding:'24px 26px'}}>
              <h2 style={{margin:'0 0 12px', fontSize:20, fontWeight:700}}>대회 개요</h2>
              <p style={{color:'var(--ink-soft)', margin:'0 0 16px', lineHeight:1.7}}>
                서울 3x3 농구의 정수를 겨루는 오픈 챔피언십. 더블 엘리미네이션 방식으로 16강부터 결승까지 이틀간 진행됩니다.
                OPEN 레벨이므로 참가 자격 제한 없이, 팀 단위로 등록한 누구나 참가 가능합니다.
              </p>
              <div style={{display:'grid', gridTemplateColumns:'140px 1fr', rowGap:10, columnGap:16, fontSize:14, padding:'14px 16px', background:'var(--bg-alt)', borderRadius:'var(--radius-chip)'}}>
                <div style={{color:'var(--ink-dim)', fontSize:12}}>주최</div><div>{t.host}</div>
                <div style={{color:'var(--ink-dim)', fontSize:12}}>문의</div><div>{t.hostContact}</div>
                <div style={{color:'var(--ink-dim)', fontSize:12}}>경기장</div><div>{t.court} — {t.address}</div>
                <div style={{color:'var(--ink-dim)', fontSize:12}}>접수 기간</div><div>{t.period}</div>
                <div style={{color:'var(--ink-dim)', fontSize:12}}>참가 방식</div><div>{t.format} · 참가비 {t.fee} ({t.feePerTeam ? '팀당' : '인당'})</div>
                <div style={{color:'var(--ink-dim)', fontSize:12}}>정원</div><div>{t.capacity}팀 (현재 {t.applied}팀 접수)</div>
                <div style={{color:'var(--ink-dim)', fontSize:12}}>우승상금</div><div style={{color:'var(--accent)', fontWeight:700}}>{t.prize}</div>
              </div>
            </div>
          )}

          {tab === 'schedule' && (
            <div style={{display:'flex', flexDirection:'column', gap:16}}>
              {SCHEDULE.map((day, di) => (
                <div key={di} className="card" style={{padding:0, overflow:'hidden'}}>
                  <div style={{padding:'12px 18px', borderBottom:'1px solid var(--border)', background:'var(--bg-alt)', fontWeight:700}}>{day.date}</div>
                  {day.rows.map((r, ri) => {
                    const ta = r.teams[0] ? TEAMS.find(x=>x.id===r.teams[0]) : null;
                    const tb = r.teams[1] ? TEAMS.find(x=>x.id===r.teams[1]) : null;
                    return (
                      <div key={ri} style={{display:'grid', gridTemplateColumns:'80px 60px 1fr auto', gap:14, padding:'12px 18px', borderBottom: ri < day.rows.length-1 ? '1px solid var(--border)' : 0, alignItems:'center'}}>
                        <div style={{fontFamily:'var(--ff-mono)', fontWeight:700}}>{r.time}</div>
                        <div><span className="badge badge--ghost">코트 {r.court}</span></div>
                        <div style={{display:'flex', alignItems:'center', gap:10}}>
                          <span style={{fontSize:12, color:'var(--ink-dim)', marginRight:6, minWidth:72}}>{r.label}</span>
                          {ta && tb ? (
                            <>
                              <span style={{fontWeight:700}}>{ta.name}</span>
                              <span style={{color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>vs</span>
                              <span style={{fontWeight:700}}>{tb.name}</span>
                            </>
                          ) : (
                            <span style={{color:'var(--ink-dim)', fontSize:13}}>이전 경기 승자</span>
                          )}
                        </div>
                        <button className="btn btn--sm">상세</button>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {tab === 'bracket' && (
            <div className="card" style={{padding:'22px 24px'}}>
              <h2 style={{margin:'0 0 16px', fontSize:18, fontWeight:700}}>16강 대진표</h2>
              <div style={{display:'grid', gridTemplateColumns:'1fr 60px 1fr', gap:14, alignItems:'center'}}>
                {BRACKET_R16.map((m, i) => {
                  const a = TEAMS.find(x=>x.id===m.a);
                  const b = TEAMS.find(x=>x.id===m.b);
                  return (
                    <React.Fragment key={i}>
                      <div style={{padding:'12px 14px', background:'var(--bg-alt)', borderRadius:6, display:'flex', alignItems:'center', gap:10}}>
                        <span style={{width:24, height:24, background:a.color, color:a.ink, display:'grid', placeItems:'center', fontFamily:'var(--ff-mono)', fontSize:10, fontWeight:700, borderRadius:3}}>{a.tag}</span>
                        <span style={{fontWeight:700, flex:1}}>{a.name}</span>
                      </div>
                      <div style={{textAlign:'center', fontFamily:'var(--ff-mono)', fontSize:11, color:'var(--ink-dim)'}}>
                        <div>VS</div>
                        <div style={{fontSize:10, marginTop:2}}>{m.time}</div>
                      </div>
                      <div style={{padding:'12px 14px', background:'var(--bg-alt)', borderRadius:6, display:'flex', alignItems:'center', gap:10}}>
                        <span style={{width:24, height:24, background:b.color, color:b.ink, display:'grid', placeItems:'center', fontFamily:'var(--ff-mono)', fontSize:10, fontWeight:700, borderRadius:3}}>{b.tag}</span>
                        <span style={{fontWeight:700, flex:1}}>{b.name}</span>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'teams' && (
            <div className="board">
              <div className="board__head" style={{gridTemplateColumns:'56px 1fr 90px 100px 80px'}}>
                <div>#</div><div>팀</div><div>레이팅</div><div>전적</div><div>상태</div>
              </div>
              {appliedTeams.map((tm, i) => (
                <div key={tm.id} className="board__row" style={{gridTemplateColumns:'56px 1fr 90px 100px 80px'}}>
                  <div className="num" style={{fontFamily:'var(--ff-display)', fontWeight:900, fontSize:14}}>{i+1}</div>
                  <div className="title">
                    <span style={{width:22, height:22, background:tm.color, color:tm.ink, display:'grid', placeItems:'center', fontFamily:'var(--ff-mono)', fontSize:10, fontWeight:700, borderRadius:3}}>{tm.tag}</span>
                    <span style={{fontWeight:600}}>{tm.name}</span>
                  </div>
                  <div style={{fontFamily:'var(--ff-mono)', fontWeight:700}}>{tm.rating}</div>
                  <div style={{fontFamily:'var(--ff-mono)', fontSize:12}}>{tm.wins}W {tm.losses}L</div>
                  <div><span className="badge badge--ok">확정</span></div>
                </div>
              ))}
            </div>
          )}

          {tab === 'rules' && (
            <div className="card" style={{padding:'22px 26px'}}>
              <h2 style={{margin:'0 0 12px', fontSize:18, fontWeight:700}}>경기 규정</h2>
              <ul style={{margin:0, paddingLeft:20, color:'var(--ink-soft)', lineHeight:1.8}}>
                <li>FIBA 3x3 공식 규정을 따릅니다.</li>
                <li>정규 시간은 10분이며, 21점 선취 시 경기 종료.</li>
                <li>동점 시 2분 연장, 2점 선취 시 종료.</li>
                <li>선수 등록은 최대 4명 (교체 1명 포함).</li>
                <li>팀 소속 증빙은 접수 마감 3일 전까지 필수.</li>
                <li>무단 불참 시 다음 대회 참가 제한 (1회).</li>
              </ul>
            </div>
          )}
        </div>

        <aside style={{position:'sticky', top:120}}>
          <div className="card" style={{padding:0, overflow:'hidden'}}>
            <div style={{padding:'18px 20px 14px', borderBottom:'1px solid var(--border)'}}>
              <div style={{fontSize:11, fontWeight:800, letterSpacing:'.1em', color:'var(--accent)', textTransform:'uppercase', marginBottom:6}}>접수중</div>
              <div style={{display:'flex', alignItems:'baseline', gap:6, marginBottom:4}}>
                <span style={{fontFamily:'var(--ff-display)', fontSize:44, fontWeight:900, letterSpacing:'-0.02em', color:'var(--accent)', lineHeight:1}}>D-14</span>
                <span style={{color:'var(--ink-mute)', fontSize:12}}>마감까지</span>
              </div>
              <div style={{fontSize:13, color:'var(--ink-mute)'}}>{t.period}</div>
            </div>
            <div style={{padding:'16px 20px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
              <div>
                <div style={{fontSize:11, color:'var(--ink-dim)', fontWeight:600, letterSpacing:'.04em'}}>참가비 (팀)</div>
                <div style={{fontWeight:800, fontSize:18, marginTop:2}}>{t.fee}</div>
              </div>
              <div>
                <div style={{fontSize:11, color:'var(--ink-dim)', fontWeight:600, letterSpacing:'.04em'}}>상금</div>
                <div style={{fontWeight:800, fontSize:18, marginTop:2, color:'var(--accent)'}}>{t.prize}</div>
              </div>
              <div style={{gridColumn:'1 / -1'}}>
                <div style={{display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:6}}>
                  <span style={{color:'var(--ink-dim)'}}>접수 현황</span>
                  <span style={{fontFamily:'var(--ff-mono)', fontWeight:700}}>{t.applied}/{t.capacity}팀</span>
                </div>
                <div style={{height:8, background:'var(--bg-alt)', borderRadius:4, overflow:'hidden'}}>
                  <div style={{width:`${(t.applied/t.capacity)*100}%`, height:'100%', background:'var(--cafe-blue)'}}/>
                </div>
              </div>
            </div>
            <div style={{padding:'0 20px 20px'}}>
              <button className="btn btn--primary btn--xl">팀으로 신청하기</button>
              <div style={{fontSize:11, color:'var(--ink-dim)', textAlign:'center', marginTop:8}}>로그인된 팀: <b style={{color:'var(--ink)'}}>리딤 (RDM)</b></div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

window.MatchList = MatchList;
window.MatchDetail = MatchDetail;
