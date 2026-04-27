/* global React, Icon */

function Gallery({ setRoute }) {
  const [filter, setFilter] = React.useState('all');
  const [lightbox, setLightbox] = React.useState(null);

  const items = [
    { id:1, type:'clip', title:'버저비터 3점 · 킹스크루 vs 3POINT', author:'편집자', team:'KGS', teamColor:'#0F5FCC', duration:'0:42', views:12847, likes:1240, date:'04.20', hue:215 },
    { id:2, type:'photo', title:'장충 메인코트 조명쇼', author:'리딤캡틴', team:'RDM', teamColor:'#DC2626', views:834, likes:412, date:'04.20', hue:0 },
    { id:3, type:'clip', title:'크로스오버 → 레이업 · monkey_7', author:'몽키즈공식', team:'MNK', teamColor:'#F59E0B', duration:'0:18', views:8421, likes:902, date:'04.18', hue:38 },
    { id:4, type:'photo', title:'우승 트로피 · Winter Finals', author:'운영팀', team:null, teamColor:'#111', views:5420, likes:1820, date:'02.15', hue:210 },
    { id:5, type:'clip', title:'풀코트 속공 덩크 · iron_c', author:'IRON공식', team:'IRN', teamColor:'#374151', duration:'0:12', views:15230, likes:2104, date:'04.12', hue:220 },
    { id:6, type:'photo', title:'용산센터 리노베이션 오픈', author:'코트지킴이', team:null, teamColor:'#10B981', views:3120, likes:284, date:'04.18', hue:160 },
    { id:7, type:'clip', title:'클러치 자유투 2연속 · kings_cap', author:'편집자', team:'KGS', teamColor:'#0F5FCC', duration:'0:24', views:6840, likes:712, date:'04.09', hue:210 },
    { id:8, type:'photo', title:'팀 단체사진 · BDR Challenge 예선', author:'분석가', team:null, teamColor:'#8B5CF6', views:2180, likes:340, date:'04.11', hue:270 },
    { id:9, type:'clip', title:'노룩 패스 하이라이트', author:'편집자', team:'3PT', teamColor:'#E31B23', duration:'0:15', views:9120, likes:1102, date:'04.05', hue:0 },
    { id:10, type:'photo', title:'코트 불빛 · 새벽 6시 픽업', author:'sunrise', team:null, teamColor:'#F59E0B', views:1240, likes:198, date:'04.03', hue:40 },
    { id:11, type:'clip', title:'블록 + 패스트브레이크', author:'SWEEP공식', team:'SWP', teamColor:'#F59E0B', duration:'0:20', views:5210, likes:604, date:'03.29', hue:30 },
    { id:12, type:'photo', title:'결승전 직전 화이팅', author:'편집자', team:null, teamColor:'#DC2626', views:1820, likes:241, date:'04.12', hue:0 },
  ];

  const filtered = items.filter(i => filter==='all' || i.type===filter);

  const Thumb = ({ it }) => (
    <div onClick={()=>setLightbox(it)} style={{
      position:'relative', aspectRatio:'4/3', borderRadius:6, overflow:'hidden', cursor:'pointer',
      background:`linear-gradient(135deg, hsl(${it.hue} 60% 42%) 0%, hsl(${it.hue} 70% 18%) 100%)`,
      boxShadow:'0 1px 2px rgba(0,0,0,.08)', transition:'transform .15s',
    }}
    onMouseEnter={e=>e.currentTarget.style.transform='translateY(-2px)'}
    onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}>
      {/* faux court lines */}
      <svg viewBox="0 0 400 300" style={{position:'absolute', inset:0, width:'100%', height:'100%', opacity:.25}}>
        <circle cx="200" cy="150" r="55" stroke="#fff" strokeWidth="2" fill="none"/>
        <rect x="50" y="80" width="80" height="140" stroke="#fff" strokeWidth="2" fill="none"/>
        <rect x="270" y="80" width="80" height="140" stroke="#fff" strokeWidth="2" fill="none"/>
        <line x1="200" y1="0" x2="200" y2="300" stroke="#fff" strokeWidth="2"/>
      </svg>
      {/* play button */}
      {it.type==='clip' && (
        <div style={{position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:52, height:52, background:'rgba(0,0,0,.55)', borderRadius:'50%', display:'grid', placeItems:'center', backdropFilter:'blur(4px)'}}>
          <div style={{width:0, height:0, borderLeft:'14px solid #fff', borderTop:'9px solid transparent', borderBottom:'9px solid transparent', marginLeft:4}}/>
        </div>
      )}
      {/* badges */}
      <div style={{position:'absolute', top:10, left:10, display:'flex', gap:5}}>
        <span style={{background:'rgba(0,0,0,.65)', color:'#fff', fontSize:10, fontWeight:800, letterSpacing:'.06em', padding:'3px 7px', borderRadius:3, textTransform:'uppercase'}}>{it.type==='clip'?'▶ CLIP':'📷 PHOTO'}</span>
        {it.team && <span style={{background:it.teamColor, color:'#fff', fontSize:10, fontWeight:800, letterSpacing:'.06em', padding:'3px 7px', borderRadius:3, fontFamily:'var(--ff-mono)'}}>{it.team}</span>}
      </div>
      {it.duration && <span style={{position:'absolute', top:10, right:10, background:'rgba(0,0,0,.65)', color:'#fff', fontSize:10, fontWeight:700, padding:'2px 6px', borderRadius:3, fontFamily:'var(--ff-mono)'}}>{it.duration}</span>}
      <div style={{position:'absolute', left:0, right:0, bottom:0, padding:'16px 12px 10px', background:'linear-gradient(transparent, rgba(0,0,0,.85))', color:'#fff'}}>
        <div style={{fontWeight:700, fontSize:13, lineHeight:1.3}}>{it.title}</div>
        <div style={{fontSize:10, opacity:.8, fontFamily:'var(--ff-mono)', marginTop:4, display:'flex', gap:8}}>
          <span>♥ {(it.likes/1000).toFixed(1)}k</span>
          <span>👁 {(it.views/1000).toFixed(1)}k</span>
          <span>· {it.date}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="page">
      <div style={{display:'flex', gap:6, fontSize:12, color:'var(--ink-mute)', marginBottom:12}}>
        <a onClick={()=>setRoute('home')} style={{cursor:'pointer'}}>홈</a><span>›</span>
        <span style={{color:'var(--ink)'}}>갤러리</span>
      </div>

      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:18, flexWrap:'wrap', gap:12}}>
        <div>
          <div className="eyebrow">하이라이트 · HIGHLIGHTS</div>
          <h1 style={{margin:'4px 0 6px', fontSize:32, fontWeight:800, letterSpacing:'-0.02em'}}>그 날의 코트, 다시 보기</h1>
          <p style={{margin:0, color:'var(--ink-mute)', fontSize:14}}>커뮤니티가 올린 클립·사진. 좋아요 많은 순으로 주간 하이라이트에 선정됩니다.</p>
        </div>
        <div style={{display:'flex', gap:6}}>
          <button className="btn btn--sm">📷 사진 업로드</button>
          <button className="btn btn--accent btn--sm">▶ 클립 업로드</button>
        </div>
      </div>

      {/* Featured strip */}
      <div className="card" style={{padding:0, overflow:'hidden', marginBottom:18, position:'relative', aspectRatio:'16/6', background:`linear-gradient(135deg, hsl(215 60% 30%) 0%, #000 100%)`}} onClick={()=>setLightbox(items[0])}>
        <svg viewBox="0 0 1600 600" style={{position:'absolute', inset:0, width:'100%', height:'100%', opacity:.2}}>
          <circle cx="800" cy="300" r="120" stroke="#fff" strokeWidth="3" fill="none"/>
          <rect x="200" y="180" width="160" height="240" stroke="#fff" strokeWidth="3" fill="none"/>
          <rect x="1240" y="180" width="160" height="240" stroke="#fff" strokeWidth="3" fill="none"/>
          <line x1="800" y1="0" x2="800" y2="600" stroke="#fff" strokeWidth="3"/>
        </svg>
        <div style={{position:'absolute', inset:0, display:'flex', flexDirection:'column', justifyContent:'flex-end', padding:36, color:'#fff'}}>
          <div style={{display:'flex', gap:6, marginBottom:8}}>
            <span style={{background:'var(--accent)', fontSize:10, fontWeight:900, letterSpacing:'.12em', padding:'4px 10px', borderRadius:3, textTransform:'uppercase'}}>이 주의 클립</span>
            <span style={{background:'rgba(255,255,255,.15)', fontSize:10, fontWeight:700, padding:'4px 10px', borderRadius:3, letterSpacing:'.06em'}}>0:42</span>
          </div>
          <h2 style={{margin:0, fontFamily:'var(--ff-display)', fontSize:38, fontWeight:900, letterSpacing:'-0.02em', maxWidth:700}}>버저비터 3점 · 킹스크루 vs 3POINT</h2>
          <div style={{fontSize:13, opacity:.85, marginTop:8, fontFamily:'var(--ff-mono)'}}>@편집자 · ♥ 1,240 · 12.8k views · 04.20</div>
        </div>
        <div style={{position:'absolute', top:'50%', right:48, transform:'translateY(-50%)', width:72, height:72, background:'rgba(255,255,255,.18)', borderRadius:'50%', display:'grid', placeItems:'center', border:'2px solid rgba(255,255,255,.6)', backdropFilter:'blur(8px)'}}>
          <div style={{width:0, height:0, borderLeft:'22px solid #fff', borderTop:'14px solid transparent', borderBottom:'14px solid transparent', marginLeft:6}}/>
        </div>
      </div>

      {/* Filters */}
      <div style={{display:'flex', gap:6, marginBottom:14, flexWrap:'wrap'}}>
        {[
          { id:'all', label:'전체', n:items.length },
          { id:'clip', label:'클립', n:items.filter(i=>i.type==='clip').length },
          { id:'photo', label:'사진', n:items.filter(i=>i.type==='photo').length },
        ].map(f => (
          <button key={f.id} onClick={()=>setFilter(f.id)} className={`btn ${filter===f.id?'btn--primary':''} btn--sm`}>
            {f.label} <span style={{marginLeft:4, opacity:.7, fontFamily:'var(--ff-mono)'}}>{f.n}</span>
          </button>
        ))}
        <div style={{flex:1}}/>
        <select className="input" style={{padding:'4px 10px', fontSize:12}}>
          <option>최신순</option><option>좋아요순</option><option>조회순</option>
        </select>
      </div>

      {/* Grid */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12}}>
        {filtered.map(it => <Thumb key={it.id} it={it}/>)}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div onClick={()=>setLightbox(null)} style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,.85)', zIndex:1000,
          display:'grid', placeItems:'center', padding:40,
        }}>
          <div onClick={e=>e.stopPropagation()} style={{maxWidth:1100, width:'100%', display:'grid', gridTemplateColumns:'minmax(0,1fr) 320px', gap:0, background:'var(--bg)', borderRadius:8, overflow:'hidden', boxShadow:'0 40px 120px rgba(0,0,0,.6)'}}>
            <div style={{aspectRatio:'16/10', background:`linear-gradient(135deg, hsl(${lightbox.hue} 60% 42%) 0%, hsl(${lightbox.hue} 70% 18%) 100%)`, position:'relative'}}>
              <svg viewBox="0 0 400 300" style={{position:'absolute', inset:0, width:'100%', height:'100%', opacity:.25}}>
                <circle cx="200" cy="150" r="55" stroke="#fff" strokeWidth="2" fill="none"/>
                <rect x="50" y="80" width="80" height="140" stroke="#fff" strokeWidth="2" fill="none"/>
                <rect x="270" y="80" width="80" height="140" stroke="#fff" strokeWidth="2" fill="none"/>
                <line x1="200" y1="0" x2="200" y2="300" stroke="#fff" strokeWidth="2"/>
              </svg>
              {lightbox.type==='clip' && (
                <div style={{position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:80, height:80, background:'rgba(0,0,0,.6)', borderRadius:'50%', display:'grid', placeItems:'center'}}>
                  <div style={{width:0, height:0, borderLeft:'22px solid #fff', borderTop:'14px solid transparent', borderBottom:'14px solid transparent', marginLeft:6}}/>
                </div>
              )}
            </div>
            <div style={{padding:'24px 22px', display:'flex', flexDirection:'column'}}>
              <div style={{display:'flex', gap:6, marginBottom:10}}>
                <span className="badge badge--soft">{lightbox.type==='clip'?'CLIP':'PHOTO'}</span>
                {lightbox.team && <span className="badge" style={{background:lightbox.teamColor, color:'#fff', border:0}}>{lightbox.team}</span>}
              </div>
              <h3 style={{margin:'0 0 10px', fontSize:18, fontWeight:800, letterSpacing:'-0.015em', lineHeight:1.3}}>{lightbox.title}</h3>
              <div style={{fontSize:12, color:'var(--ink-mute)', fontFamily:'var(--ff-mono)', marginBottom:16}}>@{lightbox.author} · {lightbox.date}</div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16}}>
                <div style={{padding:'10px 12px', background:'var(--bg-alt)', borderRadius:4}}>
                  <div style={{fontSize:10, color:'var(--ink-dim)', fontWeight:700, letterSpacing:'.06em'}}>LIKES</div>
                  <div style={{fontFamily:'var(--ff-display)', fontSize:20, fontWeight:900}}>{lightbox.likes.toLocaleString()}</div>
                </div>
                <div style={{padding:'10px 12px', background:'var(--bg-alt)', borderRadius:4}}>
                  <div style={{fontSize:10, color:'var(--ink-dim)', fontWeight:700, letterSpacing:'.06em'}}>VIEWS</div>
                  <div style={{fontFamily:'var(--ff-display)', fontSize:20, fontWeight:900}}>{lightbox.views.toLocaleString()}</div>
                </div>
              </div>
              <div style={{display:'flex', flexDirection:'column', gap:6, marginTop:'auto'}}>
                <button className="btn btn--primary btn--sm">♥ 좋아요</button>
                <button className="btn btn--sm">🔗 공유</button>
                <button className="btn btn--sm" style={{background:'transparent', border:0, color:'var(--ink-dim)', fontSize:11}}>🚩 신고</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

window.Gallery = Gallery;
