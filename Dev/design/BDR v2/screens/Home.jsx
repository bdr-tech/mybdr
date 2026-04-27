/* global React, BOARDS, POSTS, HOT_POSTS, LATEST_POSTS, HOME_STATS, TOURNAMENTS, Icon, LevelBadge */

function Home({ setRoute, setActiveBoard }) {
  const mainTourney = TOURNAMENTS[0];
  const closingTourney = TOURNAMENTS[1];

  return (
    <div className="page">
      {/* Promo banner */}
      <div className="promo" style={{ marginBottom: 20 }}>
        <div className="promo__accent"/>
        <div className="eyebrow" style={{color:'rgba(255,255,255,.7)', marginBottom: 8}}>NOW OPEN · 접수중</div>
        <h2>{mainTourney.title} {mainTourney.edition}</h2>
        <p>{mainTourney.subtitle} · {mainTourney.court} · {mainTourney.dates}</p>
        <div style={{display:'flex', gap:8}}>
          <button className="btn btn--accent" onClick={() => setRoute('match')}>지금 신청하기</button>
          <button className="btn" style={{background:'rgba(255,255,255,.12)', color:'#fff', borderColor:'rgba(255,255,255,.3)'}}>자세히 보기</button>
        </div>
      </div>

      {/* Stats strip */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12, marginBottom:24}}>
        {[
          ['전체 회원',   HOME_STATS.members.toLocaleString()],
          ['지금 접속',   HOME_STATS.onlineNow.toLocaleString()],
          ['오늘의 글',   HOME_STATS.postsToday.toLocaleString()],
          ['진행중 대회', HOME_STATS.tournaments.toLocaleString()],
        ].map(([lbl, val]) => (
          <div key={lbl} className="card" style={{padding:'16px 18px'}}>
            <div style={{fontSize:11, letterSpacing:'.08em', textTransform:'uppercase', color:'var(--ink-dim)', fontWeight:700}}>{lbl}</div>
            <div style={{fontFamily:'var(--ff-display)', fontSize:28, fontWeight:800, marginTop:4, letterSpacing:'-0.01em'}}>{val}</div>
          </div>
        ))}
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:20}}>
        {/* 공지 + 인기 */}
        <section className="card" style={{padding:0}}>
          <div style={{padding:'14px 18px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
            <div style={{fontWeight:700, fontSize:15}}>공지 · 인기글</div>
            <a href="#" style={{fontSize:12}} onClick={(e)=>{e.preventDefault(); setActiveBoard('notice'); setRoute('board');}}>더보기 ›</a>
          </div>
          <div>
            {HOT_POSTS.map(p => (
              <a key={p.id} onClick={(e)=>{e.preventDefault(); setRoute('post');}} style={{display:'grid', gridTemplateColumns:'56px 1fr auto', gap:10, padding:'11px 18px', borderBottom:'1px solid var(--border)', alignItems:'center', cursor:'pointer', color:'var(--ink)'}}>
                <span className="badge badge--soft">{BOARDS.find(b=>b.id===p.board)?.name}</span>
                <span style={{overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                  {p.title} {p.comments > 0 && <span style={{color:'var(--accent)', fontWeight:700, fontSize:12, marginLeft:4}}>[{p.comments}]</span>}
                </span>
                <span style={{fontSize:12, color:'var(--ink-dim)', display:'flex', gap:8}}>
                  <span><Icon.eye style={{verticalAlign:-1}}/> {p.views}</span>
                </span>
              </a>
            ))}
          </div>
        </section>

        {/* 최근 대회 */}
        <section className="card" style={{padding:0}}>
          <div style={{padding:'14px 18px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
            <div style={{fontWeight:700, fontSize:15}}>열린 대회</div>
            <a href="#" style={{fontSize:12}} onClick={(e)=>{e.preventDefault(); setRoute('match');}}>더보기 ›</a>
          </div>
          <div style={{padding:'14px 18px', display:'flex', flexDirection:'column', gap:12}}>
            {TOURNAMENTS.filter(t => ['open','closing','live'].includes(t.status)).slice(0,3).map(t => (
              <div key={t.id} style={{display:'grid', gridTemplateColumns:'auto 1fr auto', gap:14, alignItems:'center', padding:'10px 0', borderBottom:'1px dashed var(--border)'}}>
                <div style={{width:54, height:54, background:t.accent, color:'#fff', display:'grid', placeItems:'center', fontFamily:'var(--ff-display)', fontWeight:900, fontSize:11, letterSpacing:'.04em', textAlign:'center', borderRadius:'var(--radius-chip)', lineHeight:1.1}}>
                  {t.level}
                </div>
                <div style={{minWidth:0}}>
                  <div style={{fontWeight:700, fontSize:14, display:'flex', gap:6, alignItems:'center'}}>
                    {t.title} <span style={{color:'var(--ink-mute)', fontWeight:500, fontSize:12}}>{t.edition}</span>
                    {t.status === 'closing' && <span className="badge badge--red" style={{marginLeft:'auto'}}>마감임박</span>}
                    {t.status === 'live' && <span className="badge badge--red">LIVE</span>}
                  </div>
                  <div style={{fontSize:12, color:'var(--ink-mute)', marginTop:3}}>{t.court} · {t.dates} · 접수 {t.applied}/{t.capacity}</div>
                </div>
                <button className="btn btn--sm btn--primary">신청</button>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* 최근글 (full board-style) */}
      <section style={{marginTop:24}}>
        <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:12}}>
          <h3 style={{margin:0, fontSize:17, fontWeight:700}}>방금 올라온 글</h3>
          <a href="#" style={{fontSize:12}} onClick={(e)=>{e.preventDefault(); setActiveBoard('free'); setRoute('board');}}>전체 보기 ›</a>
        </div>
        <div className="board">
          <div className="board__head">
            <div>번호</div><div>제목</div><div>게시판</div><div>작성자</div><div>날짜</div><div>조회</div>
          </div>
          {LATEST_POSTS.map(p => (
            <div key={p.id} className="board__row" onClick={()=>setRoute('post')}>
              <div className="num">{p.id}</div>
              <div className="title">
                {p.hasImage && <Icon.image style={{color:'var(--ink-dim)'}}/>}
                <a>{p.title}</a>
                {p.comments > 0 && <span className="comment-count">[{p.comments}]</span>}
                {p.isNew && <span className="badge badge--new" style={{marginLeft:4}}>N</span>}
              </div>
              <div style={{fontSize:12, color:'var(--ink-mute)'}}>{BOARDS.find(b=>b.id===p.board)?.name}</div>
              <div style={{fontSize:12}}>{p.author}</div>
              <div style={{fontSize:12, color:'var(--ink-dim)'}}>{p.date.slice(5)}</div>
              <div style={{fontSize:12, color:'var(--ink-dim)'}}>{p.views}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

window.Home = Home;
