/* global React, TEAMS, Icon */

function Awards({ setRoute }) {
  const [season, setSeason] = React.useState('2026 Spring');

  const seasons = ['2026 Spring', '2025 Winter', '2025 Fall', '2025 Summer', '전체'];

  const mvp = {
    name: 'kings_cap',
    team: 'KINGSCREW',
    teamTag: 'KGS',
    teamColor: '#0F5FCC',
    pos: '가드',
    stats: { ppg: 22.4, apg: 8.1, rpg: 4.2, win: 87 },
    quote: '팀원들이 먼저 움직여줘서 받은 상입니다.',
  };

  const honors = [
    { cat:'FINALS MVP', name:'monkey_7',  team:'MONKEYZ',    tag:'MNK',  color:'#F59E0B', value:'31 PTS · 9 AST' },
    { cat:'득점왕',      name:'sharp_j',   team:'3POINT',     tag:'3PT',  color:'#E31B23', value:'26.8 PPG' },
    { cat:'어시스트왕',   name:'kings_cap', team:'KINGSCREW',   tag:'KGS', color:'#0F5FCC', value:'8.1 APG' },
    { cat:'리바운드왕',   name:'wall_m',    team:'IRON WOLVES', tag:'IRN', color:'#374151', value:'11.2 RPG' },
    { cat:'올해의 감독',   name:'coach_choi',team:'REDEEM',      tag:'RDM', color:'#DC2626', value:'팀 레이팅 +180' },
    { cat:'NEW FACE',    name:'pivot_mia', team:'PIVOT',       tag:'PVT', color:'#10B981', value:'루키 시즌 승률 72%' },
  ];

  const allStar1st = [
    { pos:'PG', name:'kings_cap', team:'KGS' },
    { pos:'SG', name:'sharp_j',   team:'3PT' },
    { pos:'SF', name:'monkey_7',  team:'MNK' },
    { pos:'PF', name:'iron_c',    team:'IRN' },
    { pos:'C',  name:'block_tall', team:'RDM' },
  ];
  const allStar2nd = [
    { pos:'PG', name:'dribble_k', team:'SWP' },
    { pos:'SG', name:'fade_m',    team:'RDM' },
    { pos:'SF', name:'hoops_t',   team:'PVT' },
    { pos:'PF', name:'dunk_s',    team:'KGS' },
    { pos:'C',  name:'wall_m',    team:'IRN' },
  ];

  const champions = [
    { year:'2026 Spring', tournament:'BDR Challenge',    champ:'MONKEYZ',  runner:'KINGSCREW', score:'78–71', mvp:'monkey_7' },
    { year:'2026 Spring', tournament:'KINGS CUP Vol.08', champ:'3POINT',   runner:'REDEEM',    score:'65–62', mvp:'sharp_j' },
    { year:'2025 Winter', tournament:'Winter Finals',    champ:'KINGSCREW',runner:'MONKEYZ',   score:'82–77', mvp:'kings_cap' },
    { year:'2025 Winter', tournament:'HEATWAVE Cup',     champ:'IRON WOLVES', runner:'SWEEP',  score:'91–84', mvp:'wall_m' },
    { year:'2025 Fall',   tournament:'BDR Challenge',    champ:'REDEEM',   runner:'3POINT',    score:'70–68', mvp:'fade_m' },
  ];

  return (
    <div className="page">
      <div style={{display:'flex', gap:6, fontSize:12, color:'var(--ink-mute)', marginBottom:12}}>
        <a onClick={()=>setRoute('home')} style={{cursor:'pointer'}}>홈</a><span>›</span>
        <span style={{color:'var(--ink)'}}>수상·아카이브</span>
      </div>

      {/* Season picker */}
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:10}}>
        <div>
          <div className="eyebrow">AWARDS · 수상 아카이브</div>
          <h1 style={{margin:'4px 0 0', fontSize:34, fontWeight:900, letterSpacing:'-0.025em', fontFamily:'var(--ff-display)'}}>{season} 결산</h1>
        </div>
        <div style={{display:'flex', gap:4, padding:4, background:'var(--bg-alt)', borderRadius:6}}>
          {seasons.map(s => (
            <button key={s} onClick={()=>setSeason(s)} style={{
              padding:'6px 12px', background: season===s?'var(--ink)':'transparent', color: season===s?'var(--bg)':'var(--ink-mute)',
              border:0, cursor:'pointer', fontSize:12, fontWeight:700, borderRadius:4,
            }}>{s}</button>
          ))}
        </div>
      </div>

      {/* MVP hero */}
      <div style={{display:'grid', gridTemplateColumns:'minmax(0,1fr) 340px', gap:16, marginBottom:20}}>
        <div className="card" style={{padding:0, overflow:'hidden', background:`linear-gradient(135deg, ${mvp.teamColor} 0%, #000 110%)`, color:'#fff'}}>
          <div style={{padding:'36px 40px', display:'grid', gridTemplateColumns:'auto 1fr', gap:24, alignItems:'center'}}>
            <div style={{width:140, height:140, background:'rgba(255,255,255,.08)', border:'2px solid rgba(255,255,255,.25)', display:'grid', placeItems:'center', borderRadius:'50%'}}>
              <div style={{fontFamily:'var(--ff-display)', fontSize:48, fontWeight:900, letterSpacing:'-0.02em'}}>🏆</div>
            </div>
            <div>
              <div style={{fontSize:12, letterSpacing:'.2em', opacity:.75, fontWeight:800, textTransform:'uppercase'}}>시즌 MVP</div>
              <div style={{fontFamily:'var(--ff-display)', fontSize:56, fontWeight:900, letterSpacing:'-0.03em', lineHeight:1, margin:'8px 0 6px'}}>{mvp.name}</div>
              <div style={{fontSize:14, opacity:.9}}>
                <span style={{background:'rgba(255,255,255,.15)', padding:'2px 8px', borderRadius:3, fontFamily:'var(--ff-mono)', fontSize:11, fontWeight:700, letterSpacing:'.06em', marginRight:8}}>{mvp.teamTag}</span>
                {mvp.team} · {mvp.pos}
              </div>
              <div style={{display:'flex', gap:20, marginTop:14}}>
                {[['PPG',mvp.stats.ppg],['APG',mvp.stats.apg],['RPG',mvp.stats.rpg],['WIN%',mvp.stats.win]].map(([l,v]) => (
                  <div key={l}>
                    <div style={{fontFamily:'var(--ff-display)', fontSize:26, fontWeight:900}}>{v}</div>
                    <div style={{fontSize:10, opacity:.65, letterSpacing:'.08em', fontWeight:700}}>{l}</div>
                  </div>
                ))}
              </div>
              <p style={{margin:'16px 0 0', fontSize:13, opacity:.85, fontStyle:'italic', borderLeft:'2px solid rgba(255,255,255,.4)', paddingLeft:10}}>"{mvp.quote}"</p>
            </div>
          </div>
        </div>
        <div className="card" style={{padding:'22px 24px'}}>
          <h3 style={{margin:'0 0 12px', fontSize:14, fontWeight:700, letterSpacing:'.04em', textTransform:'uppercase', color:'var(--ink-dim)'}}>올-시즌 팀 레이팅</h3>
          {[
            { tag:'MNK', name:'MONKEYZ',    rating:1812, d:+48 },
            { tag:'KGS', name:'KINGSCREW',  rating:1788, d:+32 },
            { tag:'3PT', name:'3POINT',     rating:1742, d:+21 },
            { tag:'IRN', name:'IRON WOLVES',rating:1705, d:-8  },
            { tag:'RDM', name:'REDEEM',     rating:1684, d:+12 },
          ].map((t, i) => (
            <div key={t.tag} style={{display:'grid', gridTemplateColumns:'20px 40px 1fr auto auto', gap:10, alignItems:'center', padding:'8px 0', borderBottom: i<4?'1px dashed var(--border)':0}}>
              <span style={{fontFamily:'var(--ff-display)', fontWeight:900, color:i===0?'var(--accent)':'var(--ink-dim)'}}>{i+1}</span>
              <span style={{fontFamily:'var(--ff-mono)', fontSize:11, fontWeight:700, color:'var(--ink-dim)'}}>{t.tag}</span>
              <span style={{fontWeight:700, fontSize:13}}>{t.name}</span>
              <span style={{fontFamily:'var(--ff-mono)', fontWeight:700}}>{t.rating}</span>
              <span style={{fontSize:11, fontFamily:'var(--ff-mono)', color: t.d>0?'var(--ok)':'var(--err)', fontWeight:700, minWidth:36, textAlign:'right'}}>{t.d>0?'+':''}{t.d}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Honor cards */}
      <h2 style={{fontSize:20, fontWeight:800, letterSpacing:'-0.01em', margin:'0 0 12px'}}>주요 수상</h2>
      <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12, marginBottom:28}}>
        {honors.map(h => (
          <div key={h.cat} className="card" style={{padding:'20px 22px', borderTop:`3px solid ${h.color}`}}>
            <div style={{fontSize:10, fontWeight:900, letterSpacing:'.12em', color:h.color, textTransform:'uppercase'}}>{h.cat}</div>
            <div style={{display:'flex', alignItems:'center', gap:10, marginTop:10}}>
              <span style={{width:36, height:36, background:h.color, color:'#fff', display:'grid', placeItems:'center', fontFamily:'var(--ff-mono)', fontSize:11, fontWeight:800, borderRadius:4}}>{h.tag}</span>
              <div style={{minWidth:0, flex:1}}>
                <div style={{fontWeight:800, fontSize:16, letterSpacing:'-0.01em'}}>{h.name}</div>
                <div style={{fontSize:11, color:'var(--ink-mute)'}}>{h.team}</div>
              </div>
            </div>
            <div style={{marginTop:10, padding:'8px 10px', background:'var(--bg-alt)', borderRadius:4, fontFamily:'var(--ff-mono)', fontSize:12, fontWeight:700}}>{h.value}</div>
          </div>
        ))}
      </div>

      {/* All-star teams */}
      <h2 style={{fontSize:20, fontWeight:800, letterSpacing:'-0.01em', margin:'0 0 12px'}}>올-스타 팀</h2>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:28}}>
        {[
          { label:'퍼스트 팀', data:allStar1st, accent:'var(--accent)' },
          { label:'세컨드 팀', data:allStar2nd, accent:'var(--cafe-blue)' },
        ].map(group => (
          <div key={group.label} className="card" style={{padding:'20px 22px'}}>
            <div style={{fontSize:11, letterSpacing:'.12em', fontWeight:800, color:group.accent, marginBottom:14, textTransform:'uppercase'}}>{group.label}</div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:8}}>
              {group.data.map(p => (
                <div key={p.pos} style={{textAlign:'center', padding:'12px 6px', background:'var(--bg-alt)', borderRadius:6}}>
                  <div style={{fontSize:10, fontFamily:'var(--ff-mono)', color:group.accent, fontWeight:800, letterSpacing:'.06em'}}>{p.pos}</div>
                  <div style={{fontWeight:700, fontSize:12, marginTop:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{p.name}</div>
                  <div style={{fontSize:10, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>{p.team}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Champions list */}
      <h2 style={{fontSize:20, fontWeight:800, letterSpacing:'-0.01em', margin:'0 0 12px'}}>역대 우승팀</h2>
      <div className="card" style={{padding:0, overflow:'hidden'}}>
        <div className="board__head" style={{gridTemplateColumns:'110px 1fr 1.2fr 1.2fr 80px 1fr'}}>
          <div>시즌</div><div style={{textAlign:'left'}}>대회</div><div style={{textAlign:'left'}}>우승</div><div style={{textAlign:'left'}}>준우승</div><div>스코어</div><div style={{textAlign:'left'}}>MVP</div>
        </div>
        {champions.map((c, i) => (
          <div key={i} className="board__row" style={{gridTemplateColumns:'110px 1fr 1.2fr 1.2fr 80px 1fr'}}>
            <div style={{fontFamily:'var(--ff-mono)', color:'var(--ink-dim)', fontSize:12}}>{c.year}</div>
            <div className="title">{c.tournament}</div>
            <div className="title"><span style={{color:'var(--accent)', marginRight:4}}>🏆</span><b>{c.champ}</b></div>
            <div className="title" style={{color:'var(--ink-mute)'}}>{c.runner}</div>
            <div style={{fontFamily:'var(--ff-mono)', fontWeight:700}}>{c.score}</div>
            <div className="title" style={{fontFamily:'var(--ff-mono)', fontSize:12}}>{c.mvp}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

window.Awards = Awards;
