/* global React, POSTS, GAMES, TOURNAMENTS, TEAMS, Avatar, Poster, Icon */

function Saved({ setRoute }) {
  const [tab, setTab] = React.useState('all');

  const savedPosts = POSTS.slice(0, 6).map(p => ({ ...p, savedAt: '2026.04.' + (18 + Math.floor(Math.random()*4)) }));
  const savedGames = GAMES.slice(0, 4).map(g => ({ ...g, savedAt: '2026.04.20' }));
  const savedTourneys = TOURNAMENTS.slice(0, 3).map(t => ({ ...t, savedAt: '2026.04.19' }));
  const savedTeams = TEAMS.slice(0, 4).map(t => ({ ...t, savedAt: '2026.04.15' }));
  const savedCourts = [
    { id:'c1', name:'장충체육관', area:'중구', rating:4.8, savedAt:'2026.04.20', hours:'06:00-22:00', fee:'무료' },
    { id:'c2', name:'미사강변체육관', area:'하남시', rating:4.7, savedAt:'2026.04.18', hours:'06:00-22:00', fee:'₩5,000' },
    { id:'c3', name:'용산국민체육센터', area:'용산구', rating:4.6, savedAt:'2026.04.14', hours:'08:00-21:00', fee:'₩8,000' },
  ];

  const total = savedPosts.length + savedGames.length + savedTourneys.length + savedTeams.length + savedCourts.length;
  const tabs = [
    { id:'all',     label:'전체', count: total },
    { id:'posts',   label:'게시글', count: savedPosts.length },
    { id:'games',   label:'경기', count: savedGames.length },
    { id:'tourney', label:'대회', count: savedTourneys.length },
    { id:'teams',   label:'팀', count: savedTeams.length },
    { id:'courts',  label:'코트', count: savedCourts.length },
  ];

  const showPosts = tab==='all' || tab==='posts';
  const showGames = tab==='all' || tab==='games';
  const showTourneys = tab==='all' || tab==='tourney';
  const showTeams = tab==='all' || tab==='teams';
  const showCourts = tab==='all' || tab==='courts';

  return (
    <div className="page">
      <div style={{display:'flex', gap:6, fontSize:12, color:'var(--ink-mute)', marginBottom:12}}>
        <a onClick={()=>setRoute('home')} style={{cursor:'pointer'}}>홈</a><span>›</span>
        <span style={{color:'var(--ink)'}}>보관함</span>
      </div>

      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:20, flexWrap:'wrap', gap:12}}>
        <div>
          <div className="eyebrow">Saved · Bookmarks</div>
          <h1 style={{margin:'6px 0 0', fontSize:32, fontWeight:800, letterSpacing:'-0.02em'}}>보관함</h1>
          <p style={{margin:'4px 0 0', color:'var(--ink-mute)', fontSize:13}}>🔖 북마크한 게시글, 경기, 대회, 팀, 코트를 한 곳에서 찾아보세요.</p>
        </div>
        <div style={{display:'flex', gap:6}}>
          <button className="btn btn--sm">↗ 내보내기</button>
          <button className="btn btn--sm">폴더 관리</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:'flex', gap:4, borderBottom:'1px solid var(--border)', marginBottom:20, overflowX:'auto'}}>
        {tabs.map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            padding:'10px 16px', background:'transparent', border:0, cursor:'pointer',
            borderBottom: tab===t.id ? '2px solid var(--accent)' : '2px solid transparent',
            color: tab===t.id ? 'var(--accent)' : 'var(--ink-soft)',
            fontWeight: tab===t.id ? 700 : 500, fontSize:13, whiteSpace:'nowrap',
            display:'flex', gap:6, alignItems:'center',
          }}>
            {t.label}
            <span style={{fontFamily:'var(--ff-mono)', fontSize:11, color:'var(--ink-dim)', fontWeight:500}}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Posts */}
      {showPosts && (
        <section style={{marginBottom:32}}>
          {tab==='all' && <h2 style={{margin:'0 0 12px', fontSize:15, fontWeight:700, display:'flex', alignItems:'baseline', gap:8}}>📝 게시글 <span style={{fontSize:12, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)', fontWeight:500}}>{savedPosts.length}</span></h2>}
          <div className="board">
            <div className="board__head">
              <div>제목</div><div style={{textAlign:'left'}}>저장일</div><div>조회</div><div>액션</div>
            </div>
            {savedPosts.map(p => (
              <div key={p.id} className="board__row" onClick={()=>setRoute('post')}>
                <div className="title" style={{fontWeight:600}}>
                  {p.hasImage && <span style={{color:'var(--ink-dim)', marginRight:5}}><Icon.image/></span>}
                  {p.title}
                  {p.comments > 0 && <span style={{color:'var(--accent)', fontFamily:'var(--ff-mono)', fontSize:11, marginLeft:6, fontWeight:700}}>[{p.comments}]</span>}
                </div>
                <div style={{textAlign:'left', fontFamily:'var(--ff-mono)', fontSize:12, color:'var(--ink-dim)'}}>{p.savedAt}</div>
                <div style={{fontFamily:'var(--ff-mono)', fontSize:12, color:'var(--ink-dim)'}}>{p.views.toLocaleString()}</div>
                <div><button onClick={(e)=>e.stopPropagation()} style={{background:'transparent', border:0, color:'var(--accent)', cursor:'pointer', fontSize:14}}>🔖</button></div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Games */}
      {showGames && (
        <section style={{marginBottom:32}}>
          {tab==='all' && <h2 style={{margin:'0 0 12px', fontSize:15, fontWeight:700, display:'flex', alignItems:'baseline', gap:8}}>🏀 경기 <span style={{fontSize:12, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)', fontWeight:500}}>{savedGames.length}</span></h2>}
          <div style={{display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:12}}>
            {savedGames.map(g => (
              <div key={g.id} className="card" style={{padding:'16px 18px', cursor:'pointer'}} onClick={()=>setRoute('gameDetail')}>
                <div style={{display:'flex', gap:8, marginBottom:8}}>
                  <span className="badge badge--soft">{g.kind==='pickup'?'픽업':g.kind==='guest'?'게스트':'스크림'}</span>
                  {g.status==='closing' && <span className="badge badge--red">마감임박</span>}
                  <span style={{marginLeft:'auto', fontSize:10, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>🔖 {g.savedAt}</span>
                </div>
                <div style={{fontWeight:700, fontSize:14, marginBottom:6, lineHeight:1.4}}>{g.title}</div>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, fontSize:12, color:'var(--ink-soft)'}}>
                  <div><span style={{color:'var(--ink-dim)'}}>일시 </span>{g.date.split(' ')[0].slice(5)} {g.time.split(' ')[0]}</div>
                  <div><span style={{color:'var(--ink-dim)'}}>장소 </span>{g.court}</div>
                  <div><span style={{color:'var(--ink-dim)'}}>참가비 </span>{g.fee}</div>
                  <div><span style={{color:'var(--ink-dim)'}}>모집 </span>{g.applied}/{g.spots}명</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tournaments */}
      {showTourneys && (
        <section style={{marginBottom:32}}>
          {tab==='all' && <h2 style={{margin:'0 0 12px', fontSize:15, fontWeight:700, display:'flex', alignItems:'baseline', gap:8}}>🏆 대회 <span style={{fontSize:12, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)', fontWeight:500}}>{savedTourneys.length}</span></h2>}
          <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12}}>
            {savedTourneys.map(t => (
              <div key={t.id} className="card" style={{padding:0, overflow:'hidden', cursor:'pointer'}} onClick={()=>setRoute('match')}>
                <Poster title={t.title} edition={t.edition || '2026'} accent={t.accent || 'var(--accent)'} height={130} radius={0}/>
                <div style={{padding:'14px 16px'}}>
                  <div style={{fontSize:10, color:'var(--ink-dim)', fontWeight:700, letterSpacing:'.1em', marginBottom:4}}>{t.status || 'OPEN'}</div>
                  <div style={{fontWeight:700, fontSize:13, marginBottom:6, lineHeight:1.35}}>{t.title}</div>
                  <div style={{fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>🔖 {t.savedAt}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Teams */}
      {showTeams && (
        <section style={{marginBottom:32}}>
          {tab==='all' && <h2 style={{margin:'0 0 12px', fontSize:15, fontWeight:700, display:'flex', alignItems:'baseline', gap:8}}>👥 팀 <span style={{fontSize:12, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)', fontWeight:500}}>{savedTeams.length}</span></h2>}
          <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:10}}>
            {savedTeams.map(t => (
              <div key={t.id} className="card" style={{padding:'16px', cursor:'pointer', textAlign:'center'}} onClick={()=>setRoute('teamDetail')}>
                <Avatar tag={t.tag} color={t.color} ink={t.ink} size={56} radius={6} title={t.name}/>
                <div style={{fontWeight:700, fontSize:13, marginTop:10}}>{t.name}</div>
                <div style={{fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)', marginTop:2}}>{t.wins}W {t.losses}L · {t.rating}</div>
                <div style={{fontSize:10, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)', marginTop:6}}>🔖 {t.savedAt}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Courts */}
      {showCourts && (
        <section style={{marginBottom:32}}>
          {tab==='all' && <h2 style={{margin:'0 0 12px', fontSize:15, fontWeight:700, display:'flex', alignItems:'baseline', gap:8}}>📍 코트 <span style={{fontSize:12, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)', fontWeight:500}}>{savedCourts.length}</span></h2>}
          <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12}}>
            {savedCourts.map(c => (
              <div key={c.id} className="card" style={{padding:'16px 18px', cursor:'pointer'}} onClick={()=>setRoute('court')}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6}}>
                  <div style={{fontWeight:700, fontSize:14}}>{c.name}</div>
                  <span style={{fontFamily:'var(--ff-mono)', fontSize:11, color:'var(--ink-dim)'}}>★ {c.rating}</span>
                </div>
                <div style={{fontSize:12, color:'var(--ink-mute)', marginBottom:10}}>{c.area}</div>
                <div style={{display:'flex', gap:8, fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>
                  <span>🕐 {c.hours}</span>
                  <span>💰 {c.fee}</span>
                </div>
                <div style={{fontSize:10, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)', marginTop:8}}>🔖 {c.savedAt}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {total === 0 && (
        <div className="card" style={{padding:'60px', textAlign:'center'}}>
          <div style={{fontSize:48, opacity:.3, marginBottom:12}}>🔖</div>
          <div style={{fontWeight:700, fontSize:16, marginBottom:6}}>아직 보관한 항목이 없어요</div>
          <div style={{fontSize:13, color:'var(--ink-mute)'}}>관심있는 게시글·경기·대회의 🔖 아이콘을 눌러 저장해두세요.</div>
        </div>
      )}
    </div>
  );
}

window.Saved = Saved;
