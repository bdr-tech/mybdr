/* global React, TEAMS, Icon, LevelBadge, Avatar */

function TeamList({ setRoute }) {
  const sorted = [...TEAMS].sort((a,b) => b.rating - a.rating);
  return (
    <div className="page">
      <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:16, gap:16, flexWrap:'wrap'}}>
        <div>
          <div className="eyebrow">팀 · TEAMS</div>
          <h1 style={{margin:'6px 0 4px', fontSize:28, fontWeight:800, letterSpacing:'-0.015em'}}>등록 팀 {TEAMS.length}팀</h1>
          <div style={{fontSize:13, color:'var(--ink-mute)'}}>레이팅 순 · 2026 시즌 기준</div>
        </div>
        <div style={{display:'flex', gap:8}}>
          <div style={{display:'flex', alignItems:'center', gap:6, padding:'8px 10px', background:'var(--bg-elev)', border:'1px solid var(--border)', borderRadius:'var(--radius-chip)'}}>
            <Icon.search/>
            <input className="input" style={{border:0, padding:0, background:'transparent', width:180, fontSize:13}} placeholder="팀 이름·태그 검색"/>
          </div>
          <button className="btn btn--primary" onClick={()=>setRoute('createTeam')}><Icon.plus/> 팀 등록</button>
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:14}}>
        {sorted.map((t, i) => (
          <div key={t.id} className="card" style={{padding:0, overflow:'hidden', cursor:'pointer'}} onClick={()=>setRoute('teamDetail')}>
            <div style={{background: t.color, color: t.ink, padding:'18px 18px 14px', position:'relative', minHeight:98, display:'flex', gap:14, alignItems:'flex-start'}}>
              <Avatar src={t.logo} tag={t.tag} name={t.name} color="rgba(255,255,255,.18)" ink={t.ink} size={54} radius={8}/>
              <div style={{flex:1, minWidth:0}}>
                <div style={{position:'absolute', top:10, right:12, fontFamily:'var(--ff-mono)', fontSize:11, fontWeight:700, opacity:.75}}>#{i+1}</div>
                <div style={{fontFamily:'var(--ff-display)', fontWeight:900, fontSize:12, letterSpacing:'.12em', opacity:.8}}>{t.tag}</div>
                <div style={{fontFamily:'var(--ff-display)', fontWeight:900, fontSize:22, letterSpacing:'-0.01em', lineHeight:1.1, marginTop:4}}>{t.name}</div>
                <div style={{fontSize:11, opacity:.85, marginTop:6}}>창단 {t.founded}</div>
              </div>
            </div>
            <div style={{padding:'14px 16px', display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10}}>
              <div>
                <div style={{fontSize:10, letterSpacing:'.08em', textTransform:'uppercase', color:'var(--ink-dim)', fontWeight:700}}>레이팅</div>
                <div style={{fontFamily:'var(--ff-display)', fontSize:20, fontWeight:900, marginTop:2, letterSpacing:'-0.01em'}}>{t.rating}</div>
              </div>
              <div>
                <div style={{fontSize:10, letterSpacing:'.08em', textTransform:'uppercase', color:'var(--ink-dim)', fontWeight:700}}>승</div>
                <div style={{fontFamily:'var(--ff-display)', fontSize:20, fontWeight:900, marginTop:2, color:'var(--ok)'}}>{t.wins}</div>
              </div>
              <div>
                <div style={{fontSize:10, letterSpacing:'.08em', textTransform:'uppercase', color:'var(--ink-dim)', fontWeight:700}}>패</div>
                <div style={{fontFamily:'var(--ff-display)', fontSize:20, fontWeight:900, marginTop:2, color:'var(--ink-mute)'}}>{t.losses}</div>
              </div>
            </div>
            <div style={{padding:'10px 16px 14px', display:'flex', gap:6, borderTop:'1px solid var(--border)'}}>
              <button className="btn btn--sm" style={{flex:1}}>상세</button>
              <button className="btn btn--sm" style={{flex:1}}>매치 신청</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

window.TeamList = TeamList;
