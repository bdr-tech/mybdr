/* global React, TEAMS, Avatar */

function GameResult({ setRoute }) {
  const [tab, setTab] = React.useState('summary');

  const teamA = TEAMS.find(t => t.tag==='RDM') || TEAMS[0];
  const teamB = TEAMS.find(t => t.tag==='3P') || TEAMS[1];

  const finalA = 78;
  const finalB = 72;
  const quarters = [
    { q:'Q1', a:18, b:20 },
    { q:'Q2', a:22, b:18 },
    { q:'Q3', a:17, b:16 },
    { q:'Q4', a:21, b:18 },
  ];

  const playersA = [
    { no:7,  name:'rdm_captain',   pos:'G', min:36, pts:24, reb:4, ast:7, stl:3, blk:0, tov:2, pf:3, fg:'9/17', tp:'4/9',  ft:'2/2',  pm:'+8',  star:true },
    { no:13, name:'rdm_sniper',    pos:'G', min:32, pts:18, reb:3, ast:5, stl:1, blk:0, tov:1, pf:2, fg:'6/14', tp:'5/11', ft:'1/2',  pm:'+6'  },
    { no:23, name:'rdm_forward',   pos:'F', min:30, pts:14, reb:8, ast:2, stl:1, blk:1, tov:3, pf:4, fg:'6/10', tp:'0/2',  ft:'2/4',  pm:'+4'  },
    { no:44, name:'rdm_pivot',     pos:'C', min:28, pts:12, reb:11, ast:1, stl:0, blk:3, tov:2, pf:3, fg:'5/9',  tp:'0/0',  ft:'2/3',  pm:'+2', star:true },
    { no:3,  name:'rdm_utility',   pos:'F', min:18, pts:6,  reb:3, ast:3, stl:1, blk:0, tov:1, pf:2, fg:'2/5',  tp:'1/3',  ft:'1/2',  pm:'-2' },
    { no:9,  name:'rdm_bench1',    pos:'G', min:12, pts:4,  reb:1, ast:2, stl:0, blk:0, tov:0, pf:1, fg:'1/4',  tp:'0/1',  ft:'2/2',  pm:'-1' },
  ];

  const playersB = [
    { no:11, name:'3p_shoot',      pos:'G', min:34, pts:22, reb:3, ast:4, stl:2, blk:0, tov:3, pf:3, fg:'8/18', tp:'4/10', ft:'2/3',  pm:'-4', star:true },
    { no:4,  name:'3p_guard',      pos:'G', min:32, pts:15, reb:4, ast:8, stl:2, blk:0, tov:2, pf:2, fg:'5/13', tp:'2/6',  ft:'3/4',  pm:'-2' },
    { no:15, name:'3p_wing',       pos:'F', min:30, pts:13, reb:6, ast:2, stl:1, blk:1, tov:1, pf:3, fg:'5/11', tp:'2/5',  ft:'1/2',  pm:'-6' },
    { no:32, name:'3p_big',        pos:'C', min:28, pts:10, reb:9, ast:1, stl:0, blk:2, tov:2, pf:4, fg:'4/8',  tp:'0/0',  ft:'2/2',  pm:'-3' },
    { no:21, name:'3p_rookie',     pos:'F', min:20, pts:8,  reb:4, ast:2, stl:1, blk:0, tov:2, pf:2, fg:'3/7',  tp:'1/3',  ft:'1/2',  pm:'+1' },
    { no:8,  name:'3p_bench1',     pos:'G', min:16, pts:4,  reb:2, ast:3, stl:1, blk:0, tov:1, pf:1, fg:'2/5',  tp:'0/2',  ft:'0/0',  pm:'-4' },
  ];

  const teamStats = [
    { l:'야투', a:'29/59 (49%)', b:'27/62 (44%)' },
    { l:'3점', a:'10/26 (38%)', b:'9/27 (33%)' },
    { l:'자유투', a:'10/15 (67%)', b:'9/13 (69%)' },
    { l:'리바운드', a:'38 (O 12 · D 26)', b:'34 (O 11 · D 23)' },
    { l:'어시스트', a:'20', b:'20' },
    { l:'스틸', a:'6', b:'7' },
    { l:'블록', a:'4', b:'3' },
    { l:'턴오버', a:'9', b:'11' },
    { l:'파울', a:'15', b:'16' },
    { l:'페인트득점', a:'32', b:'26' },
    { l:'패스트브레이크', a:'14', b:'8' },
    { l:'벤치득점', a:'10', b:'12' },
  ];

  const timeline = [
    { q:'Q4', t:'0:04', team:'B', body:'3POINT 풀업 3점 실패 · 경기 종료', big:true },
    { q:'Q4', t:'0:28', team:'A', body:'rdm_captain 자유투 2/2 성공 (78)', big:true },
    { q:'Q4', t:'1:12', team:'B', body:'3p_shoot 돌파 레이업 성공 (72)' },
    { q:'Q4', t:'2:34', team:'A', body:'rdm_pivot 블록샷', icon:'🛡' },
    { q:'Q4', t:'3:47', team:'A', body:'rdm_sniper 코너 3점 성공 (76)', icon:'🎯' },
    { q:'Q4', t:'5:18', team:'B', body:'3POINT 타임아웃 요청' },
    { q:'Q4', t:'6:22', team:'A', body:'rdm_captain 스크린 어시스트 → 레이업' },
    { q:'Q4', t:'8:45', team:'B', body:'3p_big 골밑 덩크 (70)', icon:'💥' },
    { q:'Q3', t:'0:00', team:'-', body:'3쿼터 종료 · RDM 57 – 54 3P' },
    { q:'Q3', t:'1:18', team:'A', body:'rdm_captain 풀업 점퍼 성공 (57)' },
  ];

  const StatRow = ({ s }) => {
    const parseNum = (str) => parseInt(String(str).replace(/[^0-9-]/g,''), 10) || 0;
    const na = parseNum(s.a), nb = parseNum(s.b);
    const total = na + nb || 1;
    return (
      <div style={{display:'grid', gridTemplateColumns:'1fr 120px 1fr', gap:12, alignItems:'center', padding:'8px 0', borderBottom:'1px solid var(--border)'}}>
        <div style={{textAlign:'right', display:'flex', alignItems:'center', gap:6, justifyContent:'flex-end'}}>
          <span style={{fontFamily:'var(--ff-mono)', fontSize:12, fontWeight: na>=nb?700:500, color: na>=nb?teamA.color:'var(--ink-soft)'}}>{s.a}</span>
          <div style={{flex:'0 0 80px', height:5, background:'var(--bg-alt)', borderRadius:3, overflow:'hidden', display:'flex', justifyContent:'flex-end'}}>
            <div style={{width:`${na/total*100}%`, height:'100%', background:teamA.color}}/>
          </div>
        </div>
        <div style={{textAlign:'center', fontSize:11, color:'var(--ink-dim)', fontWeight:700, letterSpacing:'.08em'}}>{s.l}</div>
        <div style={{display:'flex', alignItems:'center', gap:6}}>
          <div style={{flex:'0 0 80px', height:5, background:'var(--bg-alt)', borderRadius:3, overflow:'hidden'}}>
            <div style={{width:`${nb/total*100}%`, height:'100%', background:teamB.color}}/>
          </div>
          <span style={{fontFamily:'var(--ff-mono)', fontSize:12, fontWeight: nb>=na?700:500, color: nb>=na?teamB.color:'var(--ink-soft)'}}>{s.b}</span>
        </div>
      </div>
    );
  };

  const PlayerTable = ({ players, team }) => (
    <div style={{overflowX:'auto'}}>
      <div style={{display:'grid', gridTemplateColumns:'36px 1fr 40px 42px 50px 40px 40px 40px 40px 40px 40px 60px 60px 60px 50px', gap:6, padding:'8px 10px', background:'var(--bg-alt)', fontSize:10, fontWeight:700, color:'var(--ink-dim)', letterSpacing:'.06em', minWidth:900}}>
        <span>#</span><span>선수</span><span>POS</span><span>MIN</span><span style={{color:team.color, fontWeight:800}}>PTS</span><span>REB</span><span>AST</span><span>STL</span><span>BLK</span><span>TOV</span><span>PF</span><span>FG</span><span>3P</span><span>FT</span><span>+/-</span>
      </div>
      {players.map((p, i) => (
        <div key={p.no} style={{display:'grid', gridTemplateColumns:'36px 1fr 40px 42px 50px 40px 40px 40px 40px 40px 40px 60px 60px 60px 50px', gap:6, padding:'10px', fontSize:12, borderBottom: i<players.length-1 ? '1px solid var(--border)' : 0, fontFamily:'var(--ff-mono)', alignItems:'center', minWidth:900}}>
          <span style={{color:'var(--ink-dim)', fontWeight:700}}>{p.no}</span>
          <span style={{fontFamily:'var(--ff-sans)', fontWeight:700}}>{p.star && <span style={{color:'var(--accent)', marginRight:4}}>★</span>}{p.name}</span>
          <span style={{color:'var(--ink-dim)'}}>{p.pos}</span>
          <span>{p.min}</span>
          <span style={{color:team.color, fontWeight:800, fontSize:13}}>{p.pts}</span>
          <span>{p.reb}</span><span>{p.ast}</span><span>{p.stl}</span><span>{p.blk}</span>
          <span style={{color: p.tov>2?'var(--err)':'var(--ink)'}}>{p.tov}</span>
          <span>{p.pf}</span><span>{p.fg}</span><span>{p.tp}</span><span>{p.ft}</span>
          <span style={{color: p.pm.startsWith('+') ? 'var(--ok)' : 'var(--err)', fontWeight:700}}>{p.pm}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="page">
      <div style={{display:'flex', gap:6, fontSize:12, color:'var(--ink-mute)', marginBottom:12}}>
        <a onClick={()=>setRoute('home')} style={{cursor:'pointer'}}>홈</a><span>›</span>
        <a onClick={()=>setRoute('match')} style={{cursor:'pointer'}}>대회</a><span>›</span>
        <a onClick={()=>setRoute('bracket')} style={{cursor:'pointer'}}>대진표</a><span>›</span>
        <span style={{color:'var(--ink)'}}>경기 결과</span>
      </div>

      {/* Hero scoreboard */}
      <div className="card" style={{padding:'32px 40px', marginBottom:18, background:'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)', color:'#fff', position:'relative', overflow:'hidden'}}>
        <div style={{position:'absolute', inset:0, background:'radial-gradient(ellipse at 30% 50%, rgba(220,38,38,.2), transparent 60%), radial-gradient(ellipse at 70% 50%, rgba(15,95,204,.2), transparent 60%)'}}/>
        <div style={{position:'relative'}}>
          <div style={{display:'flex', gap:8, justifyContent:'center', marginBottom:6}}>
            <span className="badge badge--ok" style={{background:'rgba(16,185,129,.2)', color:'#10B981', border:'1px solid #10B981'}}>경기종료 · FINAL</span>
            <span style={{background:'rgba(255,255,255,.15)', color:'#fff', fontSize:10, padding:'3px 8px', borderRadius:3, fontWeight:700, letterSpacing:'.1em'}}>Kings Cup Vol.07 · 8강</span>
          </div>
          <div style={{textAlign:'center', fontSize:11, opacity:.7, fontFamily:'var(--ff-mono)', marginBottom:16}}>2026.05.09 (토) 14:00 · 장충체육관 메인코트 · 관중 412명</div>

          <div style={{display:'grid', gridTemplateColumns:'1fr auto 1fr', gap:40, alignItems:'center'}}>
            <div style={{textAlign:'right'}}>
              <div style={{display:'flex', alignItems:'center', gap:16, justifyContent:'flex-end'}}>
                <div>
                  <div style={{fontSize:11, opacity:.6, fontFamily:'var(--ff-mono)', letterSpacing:'.1em'}}>#1 SEED</div>
                  <div style={{fontFamily:'var(--ff-display)', fontWeight:900, fontSize:26, letterSpacing:'-0.02em'}}>{teamA.name}</div>
                  <div style={{fontSize:12, opacity:.7, fontFamily:'var(--ff-mono)'}}>15W 4L · 1684</div>
                </div>
                <Avatar tag={teamA.tag} color={teamA.color} ink={teamA.ink} size={80} radius={10}/>
              </div>
              <div style={{fontFamily:'var(--ff-display)', fontSize:96, fontWeight:900, letterSpacing:'-0.04em', color: finalA>finalB ? '#fff' : 'rgba(255,255,255,.55)', lineHeight:1, marginTop:14}}>{finalA}</div>
              {finalA>finalB && <div style={{color:'#10B981', fontWeight:800, letterSpacing:'.15em', fontSize:11, marginTop:4}}>WINNER</div>}
            </div>

            <div style={{textAlign:'center'}}>
              <div style={{fontFamily:'var(--ff-display)', fontSize:48, fontWeight:900, opacity:.4}}>–</div>
              <div style={{fontSize:10, opacity:.6, fontFamily:'var(--ff-mono)', letterSpacing:'.15em', marginTop:8}}>FINAL</div>
            </div>

            <div style={{textAlign:'left'}}>
              <div style={{display:'flex', alignItems:'center', gap:16}}>
                <Avatar tag={teamB.tag} color={teamB.color} ink={teamB.ink} size={80} radius={10}/>
                <div>
                  <div style={{fontSize:11, opacity:.6, fontFamily:'var(--ff-mono)', letterSpacing:'.1em'}}>#2 SEED</div>
                  <div style={{fontFamily:'var(--ff-display)', fontWeight:900, fontSize:26, letterSpacing:'-0.02em'}}>{teamB.name}</div>
                  <div style={{fontSize:12, opacity:.7, fontFamily:'var(--ff-mono)'}}>13W 5L · 1628</div>
                </div>
              </div>
              <div style={{fontFamily:'var(--ff-display)', fontSize:96, fontWeight:900, letterSpacing:'-0.04em', color: finalB>finalA ? '#fff' : 'rgba(255,255,255,.55)', lineHeight:1, marginTop:14}}>{finalB}</div>
            </div>
          </div>

          {/* Quarter scores */}
          <div style={{display:'grid', gridTemplateColumns:'1fr repeat(4, 70px) 70px', gap:8, marginTop:28, padding:'14px 20px', background:'rgba(255,255,255,.08)', borderRadius:6}}>
            <div/>
            {quarters.map(q => <div key={q.q} style={{textAlign:'center', fontSize:11, opacity:.7, fontFamily:'var(--ff-mono)', fontWeight:700}}>{q.q}</div>)}
            <div style={{textAlign:'center', fontSize:11, fontFamily:'var(--ff-mono)', fontWeight:800}}>TOTAL</div>
            <div style={{fontSize:13, fontWeight:700, color:teamA.color}}>{teamA.name}</div>
            {quarters.map(q => <div key={q.q} style={{textAlign:'center', fontFamily:'var(--ff-display)', fontWeight:900, fontSize:16, color: q.a>q.b ? teamA.color:'rgba(255,255,255,.6)'}}>{q.a}</div>)}
            <div style={{textAlign:'center', fontFamily:'var(--ff-display)', fontWeight:900, fontSize:18, color:teamA.color}}>{finalA}</div>
            <div style={{fontSize:13, fontWeight:700, color:teamB.color}}>{teamB.name}</div>
            {quarters.map(q => <div key={q.q} style={{textAlign:'center', fontFamily:'var(--ff-display)', fontWeight:900, fontSize:16, color: q.b>q.a ? teamB.color:'rgba(255,255,255,.6)'}}>{q.b}</div>)}
            <div style={{textAlign:'center', fontFamily:'var(--ff-display)', fontWeight:900, fontSize:18}}>{finalB}</div>
          </div>

          <div style={{display:'flex', gap:6, justifyContent:'center', marginTop:18, flexWrap:'wrap'}}>
            <button className="btn btn--sm" style={{background:'rgba(255,255,255,.15)', color:'#fff', border:0}}>▶ 하이라이트 영상</button>
            <button className="btn btn--sm" style={{background:'rgba(255,255,255,.15)', color:'#fff', border:0}}>📋 기록지 PDF</button>
            <button className="btn btn--sm" style={{background:'rgba(255,255,255,.15)', color:'#fff', border:0}}>↗ 공유</button>
            <button className="btn btn--sm" style={{background:'rgba(255,255,255,.15)', color:'#fff', border:0}}>📊 더 많은 통계</button>
          </div>
        </div>
      </div>

      {/* MVP banner */}
      <div className="card" style={{padding:'18px 22px', marginBottom:18, display:'flex', alignItems:'center', gap:18, background:'linear-gradient(90deg, color-mix(in oklab, var(--accent) 12%, transparent), transparent)'}}>
        <div style={{width:60, height:60, borderRadius:'50%', background:teamA.color, color:teamA.ink, display:'grid', placeItems:'center', fontFamily:'var(--ff-mono)', fontWeight:800, fontSize:14, flex:'0 0 auto'}}>#7</div>
        <div style={{flex:1}}>
          <div style={{fontSize:11, color:'var(--accent)', fontWeight:800, letterSpacing:'.12em'}}>🏆 GAME MVP</div>
          <div style={{fontSize:18, fontWeight:800, letterSpacing:'-0.01em', margin:'2px 0'}}>rdm_captain</div>
          <div style={{fontSize:12, color:'var(--ink-mute)', fontFamily:'var(--ff-mono)'}}>24점 · 7어시스트 · 4리바운드 · 3스틸 · +8 · 야투 9/17 (53%) · 3점 4/9</div>
        </div>
        <button className="btn btn--sm" onClick={()=>setRoute('playerProfile')}>프로필 보기 →</button>
      </div>

      {/* Tabs */}
      <div style={{display:'flex', gap:4, borderBottom:'1px solid var(--border)', marginBottom:18}}>
        {[
          {id:'summary', label:'요약'},
          {id:'team',    label:'팀 비교'},
          {id:'players', label:'개인 기록'},
          {id:'timeline',label:'타임라인'},
          {id:'shotchart',label:'샷차트'},
        ].map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            padding:'10px 16px', background:'transparent', border:0, cursor:'pointer',
            borderBottom: tab===t.id ? '2px solid var(--accent)' : '2px solid transparent',
            color: tab===t.id ? 'var(--accent)' : 'var(--ink-soft)',
            fontWeight: tab===t.id ? 700 : 500, fontSize:13,
          }}>{t.label}</button>
        ))}
      </div>

      {tab === 'summary' && (
        <div style={{display:'grid', gridTemplateColumns:'minmax(0,2fr) 1fr', gap:18}}>
          <div className="card" style={{padding:'20px 24px'}}>
            <h3 style={{margin:'0 0 12px', fontSize:15, fontWeight:700}}>경기 요약</h3>
            <p style={{margin:0, fontSize:14, lineHeight:1.7, color:'var(--ink-soft)'}}>
              REDEEM이 3POINT를 상대로 <b>78–72</b>로 승리하며 4강 진출을 확정지었다. 초반 3POINT가 외곽슛으로 앞서나갔으나, 2쿼터부터 rdm_captain의 돌파와 rdm_sniper의 3점이 연결되며 역전. 4쿼터 막판 1분을 남기고 3POINT가 3점차까지 추격했지만, 자유투 2/2와 블록샷으로 경기를 마무리했다.
            </p>
            <div style={{marginTop:16, display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10}}>
              {[
                {l:'리드 변동', v:'11회'},
                {l:'최다 점수차', v:'RDM +12 (Q2)'},
                {l:'동점', v:'6회'},
              ].map(s => (
                <div key={s.l} style={{padding:'12px 14px', background:'var(--bg-alt)', borderRadius:6}}>
                  <div style={{fontSize:10, color:'var(--ink-dim)', fontWeight:800, letterSpacing:'.1em'}}>{s.l}</div>
                  <div style={{fontFamily:'var(--ff-display)', fontSize:18, fontWeight:900, marginTop:3}}>{s.v}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{padding:'20px 24px'}}>
            <h3 style={{margin:'0 0 12px', fontSize:15, fontWeight:700}}>TOP 퍼포머</h3>
            {[
              {c:'득점', n:'rdm_captain', v:'24점', t:'RDM'},
              {c:'리바운드', n:'rdm_pivot', v:'11개', t:'RDM'},
              {c:'어시스트', n:'3p_guard', v:'8개', t:'3P'},
              {c:'스틸', n:'rdm_captain', v:'3개', t:'RDM'},
            ].map(p => (
              <div key={p.c} style={{padding:'10px 0', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div>
                  <div style={{fontSize:10, color:'var(--ink-dim)', fontWeight:700, letterSpacing:'.08em'}}>{p.c}</div>
                  <div style={{fontSize:13, fontWeight:700}}>{p.n} <span style={{fontSize:10, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)', marginLeft:4}}>{p.t}</span></div>
                </div>
                <div style={{fontFamily:'var(--ff-display)', fontWeight:900, fontSize:18}}>{p.v}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'team' && (
        <div className="card" style={{padding:'22px 26px'}}>
          <div style={{display:'grid', gridTemplateColumns:'1fr auto 1fr', gap:20, marginBottom:18, alignItems:'center'}}>
            <div style={{textAlign:'right', display:'flex', alignItems:'center', gap:10, justifyContent:'flex-end'}}>
              <div><div style={{fontWeight:800}}>{teamA.name}</div><div style={{fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>#{1} SEED</div></div>
              <Avatar tag={teamA.tag} color={teamA.color} ink={teamA.ink} size={40} radius={6}/>
            </div>
            <div style={{fontSize:10, color:'var(--ink-dim)', fontWeight:800, letterSpacing:'.1em', textAlign:'center'}}>VS</div>
            <div style={{textAlign:'left', display:'flex', alignItems:'center', gap:10}}>
              <Avatar tag={teamB.tag} color={teamB.color} ink={teamB.ink} size={40} radius={6}/>
              <div><div style={{fontWeight:800}}>{teamB.name}</div><div style={{fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>#{2} SEED</div></div>
            </div>
          </div>
          {teamStats.map(s => <StatRow key={s.l} s={s}/>)}
        </div>
      )}

      {tab === 'players' && (
        <div style={{display:'flex', flexDirection:'column', gap:16}}>
          <div className="card" style={{padding:0, overflow:'hidden'}}>
            <div style={{padding:'14px 18px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:10, background:`color-mix(in oklab, ${teamA.color} 12%, transparent)`}}>
              <Avatar tag={teamA.tag} color={teamA.color} ink={teamA.ink} size={32} radius={4}/>
              <div style={{fontWeight:800, fontSize:15}}>{teamA.name}</div>
              <div style={{marginLeft:'auto', fontFamily:'var(--ff-display)', fontWeight:900, fontSize:22, color:teamA.color}}>{finalA}</div>
            </div>
            <PlayerTable players={playersA} team={teamA}/>
          </div>
          <div className="card" style={{padding:0, overflow:'hidden'}}>
            <div style={{padding:'14px 18px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:10, background:`color-mix(in oklab, ${teamB.color} 12%, transparent)`}}>
              <Avatar tag={teamB.tag} color={teamB.color} ink={teamB.ink} size={32} radius={4}/>
              <div style={{fontWeight:800, fontSize:15}}>{teamB.name}</div>
              <div style={{marginLeft:'auto', fontFamily:'var(--ff-display)', fontWeight:900, fontSize:22, color:teamB.color}}>{finalB}</div>
            </div>
            <PlayerTable players={playersB} team={teamB}/>
          </div>
        </div>
      )}

      {tab === 'timeline' && (
        <div className="card" style={{padding:'20px 24px'}}>
          <h3 style={{margin:'0 0 14px', fontSize:15, fontWeight:700}}>경기 타임라인</h3>
          <div style={{display:'flex', flexDirection:'column', gap:0}}>
            {timeline.map((e, i) => (
              <div key={i} style={{display:'grid', gridTemplateColumns:'60px 60px 1fr', gap:12, padding:'12px 0', borderBottom:'1px solid var(--border)', alignItems:'center', background: e.big ? 'color-mix(in oklab, var(--accent) 4%, transparent)' : 'transparent'}}>
                <div style={{fontFamily:'var(--ff-mono)', fontSize:11, fontWeight:700, color:'var(--ink-dim)'}}>{e.q} {e.t}</div>
                <div>
                  {e.team === 'A' && <span style={{background:teamA.color, color:teamA.ink, fontSize:10, padding:'2px 7px', borderRadius:3, fontWeight:700}}>{teamA.tag}</span>}
                  {e.team === 'B' && <span style={{background:teamB.color, color:teamB.ink, fontSize:10, padding:'2px 7px', borderRadius:3, fontWeight:700}}>{teamB.tag}</span>}
                  {e.team === '-' && <span style={{fontSize:10, color:'var(--ink-dim)', fontWeight:700}}>END</span>}
                </div>
                <div style={{fontSize:13, fontWeight: e.big ? 700 : 500}}>
                  {e.icon && <span style={{marginRight:6}}>{e.icon}</span>}{e.body}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'shotchart' && (
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14}}>
          {[teamA, teamB].map((t, idx) => (
            <div key={t.tag} className="card" style={{padding:'20px 22px'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14}}>
                <div style={{display:'flex', gap:10, alignItems:'center'}}>
                  <Avatar tag={t.tag} color={t.color} ink={t.ink} size={28} radius={4}/>
                  <div style={{fontWeight:800}}>{t.name}</div>
                </div>
                <div style={{fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>{idx===0?'29/59 · 49%':'27/62 · 44%'}</div>
              </div>
              <svg viewBox="0 0 300 280" style={{width:'100%', height:'auto', background:'#F5F0E8', borderRadius:6}}>
                <rect x="20" y="20" width="260" height="240" fill="none" stroke="#A08870" strokeWidth="2"/>
                <rect x="95" y="20" width="110" height="140" fill="none" stroke="#A08870" strokeWidth="2"/>
                <circle cx="150" cy="20" r="22" fill="none" stroke="#A08870" strokeWidth="2"/>
                <circle cx="150" cy="160" r="18" fill="none" stroke="#A08870" strokeWidth="2"/>
                <path d="M 50 20 Q 50 180 150 180 Q 250 180 250 20" fill="none" stroke="#A08870" strokeWidth="2"/>
                <circle cx="150" cy="30" r="5" fill={t.color}/>
                {/* Shots */}
                {[
                  [120, 40, true], [180, 45, true], [150, 70, true], [100, 90, false],
                  [200, 85, true], [75, 150, true], [225, 150, false], [130, 130, true],
                  [170, 110, true], [150, 200, false], [90, 220, true], [210, 220, true],
                  [60, 250, false], [240, 250, true], [150, 230, true],
                  [110, 60, true], [190, 70, true], [145, 50, true], [160, 175, false],
                ].map(([x, y, made], i) => (
                  <g key={i}>
                    {made
                      ? <circle cx={x} cy={y} r="5" fill={t.color} opacity={0.85}/>
                      : <g opacity={0.55}><line x1={x-4} y1={y-4} x2={x+4} y2={y+4} stroke="#6b7280" strokeWidth="2"/><line x1={x-4} y1={y+4} x2={x+4} y2={y-4} stroke="#6b7280" strokeWidth="2"/></g>
                    }
                  </g>
                ))}
              </svg>
              <div style={{display:'flex', gap:16, marginTop:10, fontSize:11, color:'var(--ink-dim)', justifyContent:'center'}}>
                <span><span style={{display:'inline-block', width:8, height:8, background:t.color, borderRadius:'50%', marginRight:4}}/>성공</span>
                <span style={{fontFamily:'var(--ff-mono)'}}>✕ 실패</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

window.GameResult = GameResult;
