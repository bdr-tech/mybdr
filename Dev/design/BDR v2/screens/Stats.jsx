/* global React, Icon */

function Stats({ setRoute }) {
  const [season, setSeason] = React.useState('2026S');
  const [mode, setMode] = React.useState('overview');

  const totals = {
    games: 47, wins: 30, losses: 17, winPct: 63,
    ppg: 14.2, apg: 5.1, rpg: 3.8, spg: 1.4, bpg: 0.3,
    fg: 48.3, threePt: 37.1, ft: 82.4,
    rating: 1684, delta: +62,
  };

  // Splits
  const splits = [
    { cat:'포지션', a:{l:'vs PG', v:'15.1 PPG · 5.8 APG'}, b:{l:'vs SG', v:'12.7 PPG · 3.2 APG'} },
    { cat:'레벨',   a:{l:'OPEN',  v:'13.0 PPG · W 58%'},   b:{l:'AMATEUR', v:'18.4 PPG · W 82%'} },
    { cat:'구장',   a:{l:'실내',  v:'14.9 PPG · W 67%'},   b:{l:'실외',    v:'12.1 PPG · W 53%'} },
    { cat:'시간대', a:{l:'주말낮', v:'16.2 PPG · W 71%'},  b:{l:'평일밤',  v:'12.8 PPG · W 55%'} },
  ];

  // Shot zones (x,y as % of half-court 600x400)
  const zones = [
    { name:'림 근처', att:142, made:97, pct:68, x:50, y:85, r:14 },
    { name:'페인트 숏',  att:86,  made:42, pct:49, x:50, y:68, r:12 },
    { name:'미드 좌', att:54, made:22, pct:41, x:26, y:58, r:11 },
    { name:'미드 우', att:58, made:24, pct:41, x:74, y:58, r:11 },
    { name:'탑 3점', att:71, made:28, pct:39, x:50, y:38, r:13 },
    { name:'좌 3점', att:48, made:19, pct:40, x:16, y:44, r:11 },
    { name:'우 3점', att:52, made:21, pct:40, x:84, y:44, r:11 },
    { name:'좌 코너', att:22, made:10, pct:45, x:10, y:76, r:9 },
    { name:'우 코너', att:24, made:12, pct:50, x:90, y:76, r:9 },
  ];
  const zoneColor = (p) => p >= 50 ? '#DC2626' : p >= 40 ? '#F59E0B' : p >= 33 ? '#94A3B8' : '#475569';

  // Game log
  const gameLog = [
    { date:'04.20', opp:'장충픽업', min:36, pts:18, reb:4, ast:7, stl:2, fg:'7/12', tp:'2/5', ft:'2/2', result:'W' },
    { date:'04.18', opp:'몽키즈',  min:40, pts:22, reb:3, ast:5, stl:1, fg:'8/16', tp:'3/8', ft:'3/4', result:'L' },
    { date:'04.12', opp:'IRON',    min:38, pts:14, reb:6, ast:8, stl:3, fg:'5/11', tp:'1/3', ft:'3/3', result:'W' },
    { date:'04.05', opp:'KINGS',   min:34, pts:11, reb:2, ast:4, stl:0, fg:'4/10', tp:'1/4', ft:'2/2', result:'L' },
    { date:'03.29', opp:'3POINT',  min:42, pts:28, reb:5, ast:3, stl:1, fg:'11/19', tp:'4/9', ft:'2/2', result:'W' },
  ];

  const trend = [10,12,8,14,16,11,18,15,13,17,22,14,16,20,18,14,12,16,19,22,28,14,18,11,22,18]; // PPG last 26 games

  return (
    <div className="page">
      <div style={{display:'flex', gap:6, fontSize:12, color:'var(--ink-mute)', marginBottom:12}}>
        <a onClick={()=>setRoute('home')} style={{cursor:'pointer'}}>홈</a><span>›</span>
        <a onClick={()=>setRoute('profile')} style={{cursor:'pointer'}}>프로필</a><span>›</span>
        <span style={{color:'var(--ink)'}}>스탯 분석</span>
      </div>

      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:18, flexWrap:'wrap', gap:12}}>
        <div>
          <div className="eyebrow">ADVANCED STATS</div>
          <h1 style={{margin:'4px 0 6px', fontSize:32, fontWeight:800, letterSpacing:'-0.02em'}}>rdm_captain · 시즌 스탯</h1>
          <p style={{margin:0, color:'var(--ink-mute)', fontSize:14}}>슈팅 존, 스플릿, 경기 로그까지 — 한 시즌을 숫자로 되짚어보세요.</p>
        </div>
        <div style={{display:'flex', gap:4, padding:4, background:'var(--bg-alt)', borderRadius:6}}>
          {[['2026S','2026 Spring'],['2025W','2025 Winter'],['2025F','2025 Fall'],['career','커리어']].map(([v,l]) => (
            <button key={v} onClick={()=>setSeason(v)} style={{
              padding:'6px 12px', background: season===v?'var(--ink)':'transparent', color: season===v?'var(--bg)':'var(--ink-mute)',
              border:0, cursor:'pointer', fontSize:12, fontWeight:700, borderRadius:4,
            }}>{l}</button>
          ))}
        </div>
      </div>

      {/* KPI strip */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(8, 1fr)', gap:0, border:'1px solid var(--border)', borderRadius:8, overflow:'hidden', background:'var(--bg-alt)', marginBottom:18}}>
        {[
          ['PPG', totals.ppg, '경기당 득점'],
          ['APG', totals.apg, '어시스트'],
          ['RPG', totals.rpg, '리바운드'],
          ['SPG', totals.spg, '스틸'],
          ['FG%', `${totals.fg}`, '야투'],
          ['3P%', `${totals.threePt}`, '3점'],
          ['FT%', `${totals.ft}`, '자유투'],
          ['레이팅', totals.rating, `${totals.delta>0?'+':''}${totals.delta}`],
        ].map(([l,v,s], i) => (
          <div key={l} style={{padding:'16px 10px', textAlign:'center', borderLeft: i>0?'1px solid var(--border)':0}}>
            <div style={{fontSize:10, color:'var(--ink-dim)', fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase'}}>{l}</div>
            <div style={{fontFamily:'var(--ff-display)', fontSize:26, fontWeight:900, letterSpacing:'-0.02em', marginTop:3}}>{v}</div>
            <div style={{fontSize:10, color:'var(--ink-mute)', fontFamily:'var(--ff-mono)'}}>{s}</div>
          </div>
        ))}
      </div>

      {/* Mode tabs */}
      <div style={{display:'flex', gap:2, borderBottom:'1px solid var(--border)', marginBottom:16}}>
        {[
          { id:'overview', label:'요약' },
          { id:'zones',    label:'슈팅 존' },
          { id:'splits',   label:'스플릿' },
          { id:'log',      label:'경기 로그' },
        ].map(m => (
          <button key={m.id} onClick={()=>setMode(m.id)} style={{
            padding:'12px 18px', background:'transparent', border:0, cursor:'pointer',
            fontSize:14, fontWeight: mode===m.id?700:500,
            color: mode===m.id?'var(--cafe-blue-deep)':'var(--ink-mute)',
            borderBottom: mode===m.id?'2px solid var(--cafe-blue)':'2px solid transparent', marginBottom:-1,
          }}>{m.label}</button>
        ))}
      </div>

      {mode === 'overview' && (
        <div style={{display:'grid', gridTemplateColumns:'minmax(0,1fr) 340px', gap:16}}>
          <div className="card" style={{padding:'22px 26px'}}>
            <h3 style={{margin:'0 0 12px', fontSize:14, fontWeight:700}}>시즌 득점 추이 <span style={{color:'var(--ink-mute)', fontWeight:400, marginLeft:6}}>최근 26경기</span></h3>
            <svg viewBox="0 0 520 160" style={{width:'100%', height:180}}>
              {[0,10,20,30].map(y => <line key={y} x1="0" x2="520" y1={140-(y*4)} y2={140-(y*4)} stroke="var(--border)" strokeDasharray="3 3"/>)}
              <polyline fill="none" stroke="var(--accent)" strokeWidth="2" points={trend.map((v,i)=>`${i/(trend.length-1)*520},${140-v*4}`).join(' ')}/>
              <polygon fill="var(--accent)" opacity="0.12" points={`0,140 ${trend.map((v,i)=>`${i/(trend.length-1)*520},${140-v*4}`).join(' ')} 520,140`}/>
              {trend.map((v,i) => <circle key={i} cx={i/(trend.length-1)*520} cy={140-v*4} r="3" fill="var(--accent)"/>)}
              {[0,10,20,30].map(y => <text key={y} x="4" y={140-y*4-2} fontSize="9" fill="var(--ink-dim)" fontFamily="var(--ff-mono)">{y}</text>)}
            </svg>
            <div style={{display:'flex', justifyContent:'space-between', fontSize:10, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)', marginTop:4}}>
              <span>25경기 전</span><span>최근 경기</span>
            </div>
          </div>
          <div className="card" style={{padding:'22px 26px'}}>
            <h3 style={{margin:'0 0 12px', fontSize:14, fontWeight:700}}>랭킹 순위 (클럽 내)</h3>
            {[
              { l:'득점', rank:4, of:12 },
              { l:'어시스트', rank:2, of:12 },
              { l:'리바운드', rank:7, of:12 },
              { l:'3점 성공률', rank:3, of:12 },
              { l:'자유투', rank:1, of:12 },
            ].map(r => (
              <div key={r.l} style={{display:'grid', gridTemplateColumns:'1fr auto', gap:12, padding:'8px 0', borderBottom:'1px dashed var(--border)'}}>
                <span style={{fontSize:13}}>{r.l}</span>
                <span style={{fontFamily:'var(--ff-display)', fontWeight:900, fontSize:14}}>
                  {r.rank}<span style={{fontSize:10, color:'var(--ink-mute)', fontWeight:400}}>/{r.of}</span>
                  <span style={{fontSize:10, color: r.rank<=3?'var(--accent)':'var(--ink-dim)', marginLeft:6, fontFamily:'inherit', fontWeight:700}}>
                    {r.rank===1?'🥇':r.rank===2?'🥈':r.rank===3?'🥉':''}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {mode === 'zones' && (
        <div style={{display:'grid', gridTemplateColumns:'minmax(0,1fr) 280px', gap:16}}>
          <div className="card" style={{padding:'22px 26px'}}>
            <h3 style={{margin:'0 0 12px', fontSize:14, fontWeight:700}}>슈팅 차트 · 하프코트</h3>
            <svg viewBox="0 0 600 440" style={{width:'100%', maxHeight:480, background:'var(--bg-alt)', borderRadius:6}}>
              {/* court outline */}
              <rect x="20" y="20" width="560" height="400" fill="none" stroke="var(--ink-soft)" strokeWidth="2"/>
              <line x1="20" y1="20" x2="580" y2="20" stroke="var(--ink-soft)" strokeWidth="2"/>
              {/* paint */}
              <rect x="220" y="20" width="160" height="190" fill="none" stroke="var(--ink-soft)" strokeWidth="2"/>
              <circle cx="300" cy="210" r="60" fill="none" stroke="var(--ink-soft)" strokeWidth="2"/>
              {/* 3pt arc */}
              <path d="M 80 20 L 80 130 A 220 220 0 0 0 520 130 L 520 20" fill="none" stroke="var(--ink-soft)" strokeWidth="2"/>
              {/* rim */}
              <circle cx="300" cy="60" r="9" fill="none" stroke="var(--accent)" strokeWidth="2"/>
              <rect x="260" y="50" width="80" height="4" fill="var(--ink-soft)"/>
              {/* zone markers */}
              {zones.map(z => (
                <g key={z.name}>
                  <circle cx={z.x*6} cy={(100-z.y)*4 + 20} r={z.r*1.4} fill={zoneColor(z.pct)} opacity="0.85"/>
                  <text x={z.x*6} y={(100-z.y)*4 + 22} textAnchor="middle" fontSize="11" fontWeight="800" fill="#fff" fontFamily="var(--ff-mono)">{z.pct}%</text>
                  <text x={z.x*6} y={(100-z.y)*4 + 38} textAnchor="middle" fontSize="8" fill="var(--ink-soft)" fontFamily="var(--ff-mono)">{z.made}/{z.att}</text>
                </g>
              ))}
            </svg>
            <div style={{display:'flex', gap:14, justifyContent:'center', marginTop:10, fontSize:11}}>
              {[[50,'🔥 뜨거움'],[40,'보통'],[33,'🧊 차가움'],[0,'저조']].map(([p,l]) => (
                <div key={p} style={{display:'flex', alignItems:'center', gap:4}}>
                  <span style={{width:10, height:10, background: zoneColor(p+1), borderRadius:'50%', display:'inline-block'}}/>
                  <span>{l}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card" style={{padding:'22px 24px'}}>
            <h3 style={{margin:'0 0 10px', fontSize:14, fontWeight:700}}>존별 기록</h3>
            {zones.sort((a,b)=>b.att-a.att).map(z => (
              <div key={z.name} style={{padding:'8px 0', borderBottom:'1px dashed var(--border)'}}>
                <div style={{display:'flex', justifyContent:'space-between', fontSize:12, fontWeight:700, marginBottom:3}}>
                  <span>{z.name}</span>
                  <span style={{fontFamily:'var(--ff-mono)', color: zoneColor(z.pct)}}>{z.pct}%</span>
                </div>
                <div style={{height:4, background:'var(--bg-alt)', borderRadius:2, overflow:'hidden'}}>
                  <div style={{width:`${z.pct}%`, height:'100%', background:zoneColor(z.pct)}}/>
                </div>
                <div style={{fontSize:10, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)', marginTop:2}}>{z.made}/{z.att}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {mode === 'splits' && (
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
          {splits.map(s => (
            <div key={s.cat} className="card" style={{padding:'22px 24px'}}>
              <div style={{fontSize:11, color:'var(--ink-dim)', fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', marginBottom:12}}>{s.cat}</div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
                {[s.a, s.b].map((x, i) => (
                  <div key={i} style={{padding:'14px 16px', background:'var(--bg-alt)', borderRadius:6}}>
                    <div style={{fontSize:10, color:'var(--ink-dim)', fontWeight:700, letterSpacing:'.06em'}}>{x.l}</div>
                    <div style={{fontFamily:'var(--ff-mono)', fontWeight:700, fontSize:13, marginTop:4, lineHeight:1.4}}>{x.v}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {mode === 'log' && (
        <div className="card" style={{padding:0, overflow:'hidden'}}>
          <div className="board__head" style={{gridTemplateColumns:'70px 1.2fr 50px 50px 50px 50px 50px 70px 70px 70px 40px'}}>
            <div>날짜</div><div style={{textAlign:'left'}}>상대</div><div>MIN</div><div>PTS</div><div>REB</div><div>AST</div><div>STL</div><div>FG</div><div>3P</div><div>FT</div><div></div>
          </div>
          {gameLog.map((g, i) => (
            <div key={i} className="board__row" style={{gridTemplateColumns:'70px 1.2fr 50px 50px 50px 50px 50px 70px 70px 70px 40px', fontFamily:'var(--ff-mono)', fontSize:12.5}}>
              <div style={{color:'var(--ink-dim)'}}>{g.date}</div>
              <div className="title" style={{fontFamily:'inherit'}}>{g.opp}</div>
              <div>{g.min}</div>
              <div style={{fontWeight: g.pts>=20?800:500, color: g.pts>=20?'var(--accent)':'inherit'}}>{g.pts}</div>
              <div>{g.reb}</div><div>{g.ast}</div><div>{g.stl}</div>
              <div>{g.fg}</div><div>{g.tp}</div><div>{g.ft}</div>
              <div><span className={`badge ${g.result==='W'?'badge--ok':'badge--red'}`} style={{fontSize:9}}>{g.result}</span></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

window.Stats = Stats;
