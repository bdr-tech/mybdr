/* global React, POST_DETAIL, COMMENTS, Icon, LevelBadge, Sidebar */

function PostDetail({ setRoute, activeBoard, setActiveBoard }) {
  const p = POST_DETAIL;
  return (
    <div className="page">
      <div className="with-aside">
        <Sidebar active={activeBoard} setActive={setActiveBoard} setRoute={setRoute}/>
        <main>
          {/* breadcrumb */}
          <div style={{display:'flex', alignItems:'center', gap:6, fontSize:12, color:'var(--ink-mute)', marginBottom:10, whiteSpace:'nowrap', flexWrap:'wrap'}}>
            <a onClick={()=>setRoute('home')}>홈</a>
            <span>›</span>
            <a onClick={()=>{setActiveBoard(p.board); setRoute('board');}}>{p.boardName}</a>
            <span>›</span>
            <span style={{color:'var(--ink)'}}>글 상세</span>
          </div>

          <article className="card" style={{padding:0, overflow:'hidden'}}>
            {/* Header */}
            <header style={{padding:'22px 26px 18px', borderBottom:'1px solid var(--border)'}}>
              <div style={{display:'flex', gap:8, alignItems:'center', marginBottom:10}}>
                <span className="badge badge--soft">{p.boardName}</span>
              </div>
              <h1 style={{margin:'0 0 14px', fontSize:24, fontWeight:700, letterSpacing:'-0.01em', lineHeight:1.3}}>{p.title}</h1>
              <div style={{display:'flex', alignItems:'center', gap:10, fontSize:13, color:'var(--ink-mute)', flexWrap:'wrap'}}>
              <div style={{display:'flex', alignItems:'center', gap:8, flexShrink:0}}>
                <div style={{width:32, height:32, borderRadius:'50%', background:'var(--cafe-blue-soft)', color:'var(--cafe-blue-deep)', display:'grid', placeItems:'center', fontWeight:700, fontSize:13, flexShrink:0}}>{p.author.charAt(0)}</div>
                <div style={{minWidth:0}}>
                  <div style={{display:'flex', gap:6, alignItems:'center', whiteSpace:'nowrap'}}>
                    <b style={{color:'var(--ink)'}}>{p.author}</b>
                    <LevelBadge level={p.authorLevel}/>
                  </div>
                  <div style={{fontSize:11, color:'var(--ink-dim)', whiteSpace:'nowrap'}}>작성글 {p.authorPosts}개</div>
                </div>
              </div>
                <span style={{flex:1}}/>
                <span>{p.date}</span>
                <span>·</span>
                <span><Icon.eye style={{verticalAlign:-1}}/> {p.views}</span>
                <span>·</span>
                <span><Icon.msg style={{verticalAlign:-1}}/> {p.comments}</span>
                <span>·</span>
                <span><Icon.heart style={{verticalAlign:-1}}/> {p.likes}</span>
              </div>
            </header>

            {/* Body */}
            <div style={{padding:'28px 26px', fontSize:15, lineHeight:1.8, color:'var(--ink-soft)'}}>
              {p.body.map((b, i) => {
                if (b.type === 'p') return <p key={i} style={{margin:'0 0 14px'}}>{b.text}</p>;
                if (b.type === 'h') return <h3 key={i} style={{margin:'22px 0 10px', fontSize:17, fontWeight:700, color:'var(--ink)'}}>{b.text}</h3>;
                if (b.type === 'img') return (
                  <figure key={i} style={{margin:'18px 0'}}>
                    <div style={{height:260, background:'linear-gradient(135deg, var(--cafe-blue-deep), var(--cafe-blue) 50%, var(--accent))', display:'grid', placeItems:'center', color:'rgba(255,255,255,.7)', fontSize:12, letterSpacing:'.08em', textTransform:'uppercase', borderRadius:'var(--radius-chip)', fontFamily:'var(--ff-display)', fontWeight:700}}>
                      [ {b.caption} ]
                    </div>
                  </figure>
                );
                return null;
              })}
            </div>

            {/* Reactions */}
            <div style={{display:'flex', justifyContent:'center', gap:10, padding:'18px 26px', borderTop:'1px solid var(--border)'}}>
              <button className="btn btn--lg" style={{minWidth:140}}><Icon.heart/> 좋아요 {p.likes}</button>
              <button className="btn btn--lg"><Icon.msg/> 공유</button>
              <button className="btn btn--lg">스크랩</button>
            </div>

            {/* Nav */}
            <div style={{display:'flex', borderTop:'1px solid var(--border)'}}>
              <div style={{flex:1, padding:'14px 18px', borderRight:'1px solid var(--border)', fontSize:13, color:'var(--ink-mute)', cursor:'pointer'}}>← 이전글: MyBDR 앱 다크모드 너무 좋네요 의견</div>
              <div style={{flex:1, padding:'14px 18px', fontSize:13, color:'var(--ink-mute)', textAlign:'right', cursor:'pointer'}}>다음글: Winter Finals 우승팀 인터뷰 — 몽키즈의 전략 →</div>
            </div>
          </article>

          {/* Comments */}
          <section style={{marginTop:24}}>
            <div style={{display:'flex', alignItems:'baseline', gap:8, marginBottom:12}}>
              <h3 style={{margin:0, fontSize:17, fontWeight:700}}>댓글</h3>
              <span style={{color:'var(--accent)', fontWeight:800, fontSize:16}}>{p.comments}</span>
            </div>

            <div className="card" style={{padding:14, marginBottom:16}}>
              <div style={{display:'flex', gap:10}}>
                <div style={{width:32, height:32, borderRadius:'50%', background:'var(--cafe-blue-soft)', color:'var(--cafe-blue-deep)', display:'grid', placeItems:'center', fontWeight:700, fontSize:13, flexShrink:0}}>나</div>
                <textarea className="textarea" placeholder="따뜻한 댓글 부탁드립니다 :)" style={{minHeight:72, resize:'vertical'}}/>
              </div>
              <div style={{display:'flex', justifyContent:'flex-end', marginTop:10}}>
                <button className="btn btn--primary">등록</button>
              </div>
            </div>

            {COMMENTS.map(c => (
              <div key={c.id} className="card" style={{padding:'14px 16px', marginBottom:8}}>
                <Comment c={c}/>
                {c.replies.map(r => (
                  <div key={r.id} style={{marginLeft:26, marginTop:12, paddingLeft:14, borderLeft:'2px solid var(--border)'}}>
                    <Comment c={r} reply/>
                  </div>
                ))}
              </div>
            ))}
          </section>
        </main>
      </div>
    </div>
  );
}

function Comment({ c, reply }) {
  return (
    <div>
      <div style={{display:'flex', gap:10, alignItems:'center', marginBottom:6}}>
        <div style={{width:24, height:24, borderRadius:'50%', background:'var(--bg-alt)', color:'var(--ink-soft)', display:'grid', placeItems:'center', fontWeight:700, fontSize:11}}>{c.author.charAt(0)}</div>
        <b style={{fontSize:13}}>{c.author}</b>
        <LevelBadge level={c.level}/>
        <span style={{fontSize:11, color:'var(--ink-dim)'}}>{c.date}</span>
      </div>
      <div style={{fontSize:14, lineHeight:1.6, color:'var(--ink)', paddingLeft:34}}>{c.body}</div>
      <div style={{display:'flex', gap:12, paddingLeft:34, marginTop:6, fontSize:12, color:'var(--ink-mute)'}}>
        <button style={{background:'none', border:0, color:'inherit', cursor:'pointer', padding:0, display:'flex', gap:4, alignItems:'center'}}><Icon.heart/> {c.likes || 0}</button>
        <button style={{background:'none', border:0, color:'inherit', cursor:'pointer', padding:0}}>답글</button>
        <button style={{background:'none', border:0, color:'inherit', cursor:'pointer', padding:0}}>신고</button>
      </div>
    </div>
  );
}

window.PostDetail = PostDetail;
