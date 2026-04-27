/* global React, TOURNAMENTS, TEAMS, Avatar */

function Bracket({ setRoute }) {
  const [tournament, setTournament] = React.useState('kings7');
  const [round, setRound] = React.useState('all');

  const teams = [
    { tag:'RDM', name:'REDEEM', seed:1, color:'#DC2626', ink:'#fff' },
    { tag:'3P',  name:'3POINT', seed:2, color:'#0F5FCC', ink:'#fff' },
    { tag:'MKY', name:'MONKEYS', seed:3, color:'#F59E0B', ink:'#111' },
    { tag:'IRN', name:'IRON WOLVES', seed:4, color:'#475569', ink:'#fff' },
    { tag:'SWP', name:'SWEEP', seed:5, color:'#10B981', ink:'#fff' },
    { tag:'KGS', name:'KINGS CREW', seed:6, color:'#7C2D12', ink:'#fff' },
    { tag:'PVT', name:'PIVOT', seed:7, color:'#8B5CF6', ink:'#fff' },
    { tag:'DWN', name:'DAWN SQUAD', seed:8, color:'#0EA5E9', ink:'#fff' },
  ];

  const matches = {
    qf: [
      { id:'qf1', a:teams[0], b:teams[7], as:68, bs:52, done:true, winner:'a', court:'잠실', date:'05.09 10:00' },
      { id:'qf2', a:teams[3], b:teams[4], as:61, bs:64, done:true, winner:'b', court:'잠실', date:'05.09 12:00' },
      { id:'qf3', a:teams[1], b:teams[6], as:null, bs:null, done:false, live:true, court:'장충', date:'05.09 14:00', current:{a:47,b:52,q:'Q3 5:24'} },
      { id:'qf4', a:teams[2], b:teams[5], as:null, bs:null, done:false, court:'장충', date:'05.09 16:00' },
    ],
    sf: [
      { id:'sf1', a:teams[0], b:teams[4], as:null, bs:null, done:false, court:'장충', date:'05.16 13:00' },
      { id:'sf2', a:null, b:null, tbd:true, court:'장충', date:'05.16 15:00' },
    ],
    f: [
      { id:'f1', a:null, b:null, tbd:true, court:'장충', date:'05.17 14:00' },
    ],
  };

  const MatchCard = ({ m, size='md' }) => {
    const h = size==='sm' ? 62 : 74;
    return (
      <div style={{
        background:'var(--bg)',
        border:'1px solid var(--border)',
        borderRadius:6,
        overflow:'hidden',
        width: size==='sm' ? 200 : 220,
        position:'relative',
        boxShadow: m.live ? '0 0 0 2px var(--err)' : 'none',
      }}>
        {m.live && <div style={{position:'absolute', top:-8, right:8, background:'var(--err)', color:'#fff', fontSize:9, fontWeight:800, padding:'2px 7px', borderRadius:3, letterSpacing:'.1em', zIndex:1}}>● LIVE</div>}
        {m.tbd ? (
          <div style={{height:h*2, display:'grid', placeItems:'center', color:'var(--ink-dim)', fontSize:12, fontWeight:600}}>
            대진 대기중
          </div>
        ) : (
          <>
            {[{t:m.a, s:m.as, w:m.winner==='a'}, {t:m.b, s:m.bs, w:m.winner==='b'}].map((side, i) => (
              <div key={i} style={{
                display:'grid', gridTemplateColumns:'28px 24px 1fr auto', gap:8,
                padding:'10px 12px', alignItems:'center',
                borderTop: i>0 ? '1px solid var(--border)' : 0,
                background: side.w ? 'color-mix(in oklab, var(--ok) 10%, var(--bg))' : (m.done && !side.w ? 'var(--bg-alt)' : 'transparent'),
                opacity: m.done && !side.w ? 0.6 : 1,
              }}>
                <span style={{fontSize:10, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)', fontWeight:700}}>#{side.t.seed}</span>
                <Avatar tag={side.t.tag} color={side.t.color} ink={side.t.ink} size={24} radius={3}/>
                <span style={{fontWeight:600, fontSize:12, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{side.t.name}</span>
                <span style={{fontFamily:'var(--ff-display)', fontSize:16, fontWeight:900, color: side.w ? 'var(--ok)' : m.live ? (side.s === Math.max(m.current?.a||0, m.current?.b||0) ? 'var(--err)' : 'var(--ink)') : 'var(--ink)'}}>
                  {m.live ? (i===0 ? m.current.a : m.current.b) : (side.s ?? '–')}
                </span>
              </div>
            ))}
            <div style={{padding:'5px 12px', fontSize:10, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)', background:'var(--bg-alt)', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'space-between'}}>
              <span>{m.court} · {m.date}</span>
              {m.live && <span style={{color:'var(--err)', fontWeight:700}}>{m.current.q}</span>}
              {m.done && <span style={{color:'var(--ok)', fontWeight:700}}>완료</span>}
            </div>
          </>
        )}
      </div>
    );
  };

  // Column header
  const ColHeader = ({ title, n, date }) => (
    <div style={{marginBottom:16, textAlign:'center'}}>
      <div style={{fontSize:10, color:'var(--ink-dim)', fontWeight:800, letterSpacing:'.14em'}}>{title}</div>
      <div style={{fontFamily:'var(--ff-display)', fontSize:18, fontWeight:900, letterSpacing:'-0.01em', marginTop:2}}>{n}경기</div>
      <div style={{fontSize:11, color:'var(--ink-mute)', fontFamily:'var(--ff-mono)', marginTop:2}}>{date}</div>
    </div>
  );

  return (
    <div className="page">
      <div style={{display:'flex', gap:6, fontSize:12, color:'var(--ink-mute)', marginBottom:12}}>
        <a onClick={()=>setRoute('home')} style={{cursor:'pointer'}}>홈</a><span>›</span>
        <a onClick={()=>setRoute('match')} style={{cursor:'pointer'}}>대회</a><span>›</span>
        <span style={{color:'var(--ink)'}}>대진표</span>
      </div>

      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:20, flexWrap:'wrap', gap:12}}>
        <div>
          <div className="eyebrow">BRACKET · SINGLE ELIMINATION</div>
          <h1 style={{margin:'6px 0 0', fontSize:32, fontWeight:800, letterSpacing:'-0.02em'}}>Kings Cup Vol.07 · 본선</h1>
          <p style={{margin:'4px 0 0', color:'var(--ink-mute)', fontSize:13}}>8팀 · 싱글 엘리미네이션 · 2026.05.09 ~ 05.17 · 장충체육관</p>
        </div>
        <div style={{display:'flex', gap:6}}>
          <select className="input" value={tournament} onChange={e=>setTournament(e.target.value)} style={{fontSize:12}}>
            <option value="kings7">Kings Cup Vol.07 본선</option>
            <option value="spring">BDR Challenge Spring 2026</option>
            <option value="seoul">서울바스켓 4R</option>
          </select>
          <button className="btn btn--sm">🔖 저장</button>
          <button className="btn btn--sm">↗ 공유</button>
          <button className="btn btn--sm">🖨 출력</button>
        </div>
      </div>

      {/* Status bar */}
      <div className="card" style={{padding:'14px 20px', marginBottom:18, display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:0}}>
        {[
          {l:'참가팀', v:'8', sub:'전원 본선'},
          {l:'경기완료', v:'2', sub:'/ 7경기'},
          {l:'진행중', v:'1', sub:'LIVE', color:'var(--err)'},
          {l:'현재라운드', v:'8강', sub:'Quarter'},
          {l:'우승상금', v:'₩3,000,000', sub:'+ 트로피'},
        ].map((s, i) => (
          <div key={s.l} style={{padding:'0 12px', borderLeft: i>0 ? '1px solid var(--border)' : 0, textAlign:'center'}}>
            <div style={{fontSize:10, color:'var(--ink-dim)', fontWeight:800, letterSpacing:'.12em'}}>{s.l}</div>
            <div style={{fontFamily:'var(--ff-display)', fontSize:20, fontWeight:900, marginTop:2, color: s.color || 'var(--ink)'}}>{s.v}</div>
            <div style={{fontSize:10, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Bracket */}
      <div className="card" style={{padding:'28px 20px', overflowX:'auto'}}>
        <div style={{display:'grid', gridTemplateColumns:'1fr auto 1fr auto 1fr', gap:40, minWidth:1000, alignItems:'center'}}>
          {/* QF col */}
          <div>
            <ColHeader title="8강 · QUARTERFINALS" n={4} date="05.09 토"/>
            <div style={{display:'flex', flexDirection:'column', gap:30}}>
              {matches.qf.map(m => <MatchCard key={m.id} m={m}/>)}
            </div>
          </div>

          {/* Connector lines */}
          <div style={{height:420, display:'flex', flexDirection:'column', justifyContent:'space-around', alignItems:'center'}}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{width:40, height:2, background:'var(--border)', position:'relative'}}>
                {i % 2 === 0 && <div style={{position:'absolute', right:-1, top:2, width:2, height:110, background:'var(--border)'}}/>}
              </div>
            ))}
          </div>

          {/* SF col */}
          <div>
            <ColHeader title="4강 · SEMIFINALS" n={2} date="05.16 토"/>
            <div style={{display:'flex', flexDirection:'column', gap:140, marginTop:60}}>
              {matches.sf.map(m => <MatchCard key={m.id} m={m}/>)}
            </div>
          </div>

          {/* Connector lines */}
          <div style={{height:420, display:'flex', flexDirection:'column', justifyContent:'space-around', alignItems:'center'}}>
            <div style={{width:40, height:2, background:'var(--border)', marginTop:80, position:'relative'}}>
              <div style={{position:'absolute', right:-1, top:2, width:2, height:190, background:'var(--border)'}}/>
            </div>
          </div>

          {/* Final col */}
          <div>
            <ColHeader title="결승 · FINAL" n={1} date="05.17 일"/>
            <div style={{marginTop:190}}>
              <div style={{position:'relative'}}>
                <div style={{position:'absolute', top:-42, left:'50%', transform:'translateX(-50%)', background:'linear-gradient(135deg, #F59E0B, #D97706)', color:'#fff', padding:'6px 14px', borderRadius:4, fontSize:11, fontWeight:800, letterSpacing:'.12em', whiteSpace:'nowrap'}}>🏆 CHAMPIONSHIP</div>
                <MatchCard m={matches.f[0]}/>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule list */}
      <div style={{marginTop:22, display:'grid', gridTemplateColumns:'minmax(0,1fr) 320px', gap:18, alignItems:'flex-start'}}>
        <div className="card" style={{padding:'20px 22px'}}>
          <h3 style={{margin:'0 0 14px', fontSize:16, fontWeight:700}}>경기 일정</h3>
          <div style={{display:'flex', flexDirection:'column', gap:0}}>
            {[...matches.qf, ...matches.sf, ...matches.f].map((m, i) => (
              <div key={i} style={{display:'grid', gridTemplateColumns:'110px 60px 1fr auto', gap:14, padding:'12px 0', borderBottom:'1px solid var(--border)', alignItems:'center'}}>
                <div style={{fontSize:11, fontFamily:'var(--ff-mono)', color:'var(--ink-dim)'}}>{m.date}</div>
                <span className={`badge ${m.live?'badge--red':m.done?'badge--ok':'badge--soft'}`} style={{fontSize:10}}>
                  {m.live?'LIVE':m.done?'완료':m.tbd?'TBD':'예정'}
                </span>
                <div style={{fontSize:13, fontWeight:600}}>
                  {m.tbd ? '승자 vs 승자' : <>{m.a?.name || 'TBD'} <span style={{color:'var(--ink-dim)', margin:'0 6px'}}>vs</span> {m.b?.name || 'TBD'}</>}
                  <span style={{color:'var(--ink-dim)', fontSize:11, fontFamily:'var(--ff-mono)', marginLeft:8}}>{m.court}</span>
                </div>
                <div style={{fontFamily:'var(--ff-display)', fontSize:16, fontWeight:800, color: m.done ? 'var(--ok)' : 'var(--ink)'}}>
                  {m.done ? `${m.as} : ${m.bs}` : m.live ? `${m.current.a} : ${m.current.b}` : '—'}
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside style={{display:'flex', flexDirection:'column', gap:14}}>
          <div className="card" style={{padding:'18px 20px'}}>
            <h3 style={{margin:'0 0 12px', fontSize:14, fontWeight:700}}>시드 순위</h3>
            <div style={{display:'flex', flexDirection:'column', gap:6}}>
              {teams.map(t => (
                <div key={t.tag} style={{display:'grid', gridTemplateColumns:'24px 28px 1fr auto', gap:8, padding:'6px 8px', background:'var(--bg-alt)', borderRadius:4, alignItems:'center'}}>
                  <span style={{fontFamily:'var(--ff-mono)', fontSize:11, fontWeight:700, color:'var(--ink-dim)'}}>#{t.seed}</span>
                  <Avatar tag={t.tag} color={t.color} ink={t.ink} size={24} radius={3}/>
                  <span style={{fontWeight:600, fontSize:12}}>{t.name}</span>
                  <span style={{fontFamily:'var(--ff-mono)', fontSize:11, color:'var(--ink-dim)'}}>1684</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{padding:'18px 20px'}}>
            <h3 style={{margin:'0 0 12px', fontSize:14, fontWeight:700}}>우승 예측 (커뮤니티)</h3>
            {[
              {t:'REDEEM', pct:38, color:'#DC2626'},
              {t:'3POINT', pct:27, color:'#0F5FCC'},
              {t:'MONKEYS', pct:18, color:'#F59E0B'},
              {t:'IRON WOLVES', pct:9, color:'#475569'},
              {t:'기타', pct:8, color:'var(--ink-dim)'},
            ].map(p => (
              <div key={p.t} style={{marginBottom:10}}>
                <div style={{display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:3}}>
                  <span style={{fontWeight:600}}>{p.t}</span>
                  <span style={{fontFamily:'var(--ff-mono)', color:'var(--ink-dim)'}}>{p.pct}%</span>
                </div>
                <div style={{height:5, background:'var(--bg-alt)', borderRadius:3, overflow:'hidden'}}>
                  <div style={{width:`${p.pct}%`, height:'100%', background:p.color}}/>
                </div>
              </div>
            ))}
            <button className="btn btn--sm" style={{width:'100%', marginTop:10}}>내 예측 투표</button>
          </div>
        </aside>
      </div>
    </div>
  );
}

window.Bracket = Bracket;
