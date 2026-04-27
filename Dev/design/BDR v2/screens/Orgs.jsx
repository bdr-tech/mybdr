/* global React, ORGS, Icon, Avatar */

function OrgsList({ setRoute }) {
  const kinds = ['전체', '리그', '협회', '동호회'];
  const [filter, setFilter] = React.useState('전체');
  const shown = ORGS.filter(o => filter === '전체' ? true : o.kind === filter);

  return (
    <div className="page">
      <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:16, gap:16, flexWrap:'wrap'}}>
        <div>
          <div className="eyebrow">단체 · ORGANIZATIONS</div>
          <h1 style={{margin:'6px 0 4px', fontSize:28, fontWeight:800, letterSpacing:'-0.015em'}}>리그 · 협회 · 동호회</h1>
          <div style={{fontSize:13, color:'var(--ink-mute)'}}>여러 팀을 아우르는 {ORGS.length}개의 농구 단체</div>
        </div>
        <button className="btn btn--primary"><Icon.plus/> 단체 등록</button>
      </div>

      <div style={{display:'flex', gap:8, marginBottom:16, flexWrap:'wrap'}}>
        {kinds.map(k => (
          <button key={k} className="btn btn--sm" onClick={()=>setFilter(k)}
            style={filter === k ? {background:'var(--cafe-blue)', color:'#fff', borderColor:'var(--cafe-blue-deep)'} : {}}>
            {k}
          </button>
        ))}
      </div>

      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:14}}>
        {shown.map(o => (
          <div key={o.id} className="card" style={{padding:0, overflow:'hidden', cursor:'pointer'}} onClick={()=>setRoute('orgDetail')}>
            <div style={{
              background: `linear-gradient(135deg, ${o.color}, ${o.color}CC)`,
              color:'#fff', padding:'18px 20px', display:'flex', alignItems:'flex-start', gap:14, minHeight:92,
            }}>
              <Avatar src={o.logo} tag={o.tag} name={o.name} color="rgba(255,255,255,.18)" ink="#fff" size={52} radius={8}/>
              <div style={{flex:1, minWidth:0}}>
                <div style={{fontFamily:'var(--ff-display)', fontSize:11, fontWeight:800, letterSpacing:'.12em', opacity:.85}}>{o.tag}</div>
                <div style={{fontFamily:'var(--ff-display)', fontWeight:900, fontSize:20, letterSpacing:'-0.01em', lineHeight:1.15, marginTop:4}}>{o.name}</div>
              </div>
              <span className="badge" style={{background:'rgba(0,0,0,.25)', color:'#fff', borderColor:'rgba(255,255,255,.35)', flex:'0 0 auto'}}>{o.kind}</span>
            </div>
            <div style={{padding:'14px 18px'}}>
              <div style={{fontSize:13, color:'var(--ink-soft)', marginBottom:12, lineHeight:1.5, minHeight:40}}>{o.desc}</div>
              <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8}}>
                <div>
                  <div style={{fontSize:10, letterSpacing:'.08em', textTransform:'uppercase', color:'var(--ink-dim)', fontWeight:700}}>지역</div>
                  <div style={{fontSize:13, fontWeight:700, marginTop:2}}>{o.area}</div>
                </div>
                <div>
                  <div style={{fontSize:10, letterSpacing:'.08em', textTransform:'uppercase', color:'var(--ink-dim)', fontWeight:700}}>팀</div>
                  <div style={{fontFamily:'var(--ff-display)', fontSize:18, fontWeight:900, marginTop:2, letterSpacing:'-0.01em'}}>{o.teams}</div>
                </div>
                <div>
                  <div style={{fontSize:10, letterSpacing:'.08em', textTransform:'uppercase', color:'var(--ink-dim)', fontWeight:700}}>인원</div>
                  <div style={{fontFamily:'var(--ff-display)', fontSize:18, fontWeight:900, marginTop:2, letterSpacing:'-0.01em'}}>{o.members}</div>
                </div>
              </div>
            </div>
            <div style={{padding:'10px 18px 14px', display:'flex', gap:6, borderTop:'1px solid var(--border)'}}>
              <button className="btn btn--sm" style={{flex:1}}>상세</button>
              <button className="btn btn--sm btn--primary" style={{flex:1}}>가입 신청</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

window.OrgsList = OrgsList;
