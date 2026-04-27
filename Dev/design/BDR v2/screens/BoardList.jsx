/* global React, BOARDS, POSTS, Icon, Sidebar, Pager, LevelBadge */

function BoardList({ activeBoard, setActiveBoard, setRoute }) {
  const board = BOARDS.find(b => b.id === activeBoard) || BOARDS[1];
  const allPosts = POSTS; // in real impl, filter by board
  const pinned = allPosts.filter(p => p.pinned);
  const rest = allPosts.filter(p => !p.pinned);

  return (
    <div className="page">
      <div className="with-aside">
        <Sidebar active={activeBoard} setActive={setActiveBoard} setRoute={setRoute}/>
        <main>
          <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:16, gap:16, flexWrap:'wrap'}}>
            <div style={{minWidth:0}}>
              <div className="eyebrow">{board.category === 'main' ? '메인' : board.category === 'play' ? '플레이' : '이야기'}</div>
              <h1 style={{margin:'6px 0 4px', fontSize:24, fontWeight:700, letterSpacing:'-0.01em', whiteSpace:'nowrap'}}>{board.name}</h1>
              <div style={{fontSize:13, color:'var(--ink-mute)', whiteSpace:'nowrap'}}>전체 {board.count.toLocaleString()}개의 글</div>
            </div>
            <div style={{display:'flex', gap:8, flexShrink:0}}>
              <div style={{display:'flex', alignItems:'center', gap:6, padding:'8px 10px', background:'var(--bg-elev)', border:'1px solid var(--border)', borderRadius:'var(--radius-chip)'}}>
                <Icon.search/>
                <input className="input" style={{border:0, padding:0, background:'transparent', width:180, fontSize:13}} placeholder="게시판 내 검색"/>
              </div>
              <button className="btn btn--primary" onClick={()=>setRoute('write')}><Icon.plus/> 글쓰기</button>
            </div>
          </div>

          {/* Filter row */}
          <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:10, padding:'10px 12px', background:'var(--bg-elev)', border:'1px solid var(--border)', borderRadius:'var(--radius-chip)', fontSize:13, whiteSpace:'nowrap', flexWrap:'wrap'}}>
            <span style={{color:'var(--ink-dim)', fontSize:12, fontWeight:600, flexShrink:0}}>정렬</span>
            {['최신순','인기순','댓글많은순','조회순'].map((s,i) => (
              <button key={s} style={{padding:'4px 8px', border:0, background: i === 0 ? 'var(--cafe-blue-soft)' : 'transparent', color: i === 0 ? 'var(--cafe-blue-deep)' : 'var(--ink-mute)', borderRadius:4, cursor:'pointer', fontWeight: i===0 ? 700 : 500, fontSize:13, whiteSpace:'nowrap', flexShrink:0}}>{s}</button>
            ))}
            <span style={{flex:1}}/>
            <span style={{color:'var(--ink-dim)', fontSize:12, whiteSpace:'nowrap', flexShrink:0}}>한 페이지 20개</span>
          </div>

          <div className="board">
            <div className="board__head">
              <div>번호</div><div>제목</div><div>작성자</div><div>날짜</div><div>조회</div><div>추천</div>
            </div>
            {pinned.map(p => (
              <div key={p.id} className="board__row notice" onClick={()=>setRoute('post')}>
                <div className="num">공지</div>
                <div className="title">
                  <span className="badge badge--blue">공지</span>
                  <a>{p.title}</a>
                  {p.comments > 0 && <span className="comment-count">[{p.comments}]</span>}
                </div>
                <div style={{fontSize:12}}>{p.author}</div>
                <div style={{fontSize:12, color:'var(--ink-dim)'}}>{p.date.slice(5)}</div>
                <div style={{fontSize:12, color:'var(--ink-dim)'}}>{p.views}</div>
                <div style={{fontSize:12, color:'var(--ink-dim)'}}>-</div>
              </div>
            ))}
            {rest.map(p => (
              <div key={p.id} className="board__row" onClick={()=>setRoute('post')}>
                <div className="num">{p.id}</div>
                <div className="title">
                  {p.hasImage && <Icon.image style={{color:'var(--ink-dim)'}}/>}
                  <a>{p.title}</a>
                  {p.comments > 0 && <span className="comment-count">[{p.comments}]</span>}
                  {p.isNew && <span className="badge badge--new" style={{marginLeft:4}}>N</span>}
                </div>
                <div style={{fontSize:12}}>{p.author}</div>
                <div style={{fontSize:12, color:'var(--ink-dim)'}}>{p.date.slice(5)}</div>
                <div style={{fontSize:12, color:'var(--ink-dim)'}}>{p.views}</div>
                <div style={{fontSize:12, color:'var(--ink-dim)'}}>{Math.floor(p.views/30)}</div>
              </div>
            ))}
          </div>

          <Pager current={1} total={12}/>
        </main>
      </div>
    </div>
  );
}

window.BoardList = BoardList;
