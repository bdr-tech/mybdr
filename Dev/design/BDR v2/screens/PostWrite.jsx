/* global React, BOARDS, Sidebar, Icon */

function PostWrite({ activeBoard, setActiveBoard, setRoute }) {
  const [board, setBoard] = React.useState(activeBoard || 'free');
  const [title, setTitle] = React.useState('');
  const [body, setBody] = React.useState('');

  return (
    <div className="page">
      <div className="with-aside">
        <Sidebar active={activeBoard} setActive={setActiveBoard} setRoute={setRoute}/>
        <main>
          <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:16}}>
            <h1 style={{margin:0, fontSize:24, fontWeight:700, letterSpacing:'-0.01em'}}>글쓰기</h1>
            <div style={{fontSize:12, color:'var(--ink-dim)'}}>임시저장 · 자동저장 3분 전</div>
          </div>

          <div className="card" style={{padding:20}}>
            <div style={{display:'grid', gridTemplateColumns:'160px 1fr', gap:12, marginBottom:14}}>
              <div>
                <label className="label">게시판 선택</label>
                <select className="select" value={board} onChange={e=>setBoard(e.target.value)}>
                  {BOARDS.filter(b => b.id !== 'notice').map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">제목</label>
                <input className="input" value={title} onChange={e=>setTitle(e.target.value)} placeholder="제목을 입력하세요 (최대 80자)" maxLength={80}/>
              </div>
            </div>

            {/* Toolbar */}
            <div style={{display:'flex', gap:4, padding:'6px 8px', border:'1px solid var(--border)', borderBottom:0, borderRadius:'var(--radius-chip) var(--radius-chip) 0 0', background:'var(--bg-alt)', flexWrap:'wrap'}}>
              {['B','I','U','S'].map(t => <button key={t} className="btn btn--sm" style={{fontWeight: t === 'B' ? 800 : 500, fontStyle: t === 'I' ? 'italic' : 'normal', textDecoration: t === 'U' ? 'underline' : t === 'S' ? 'line-through' : 'none', minWidth:32}}>{t}</button>)}
              <div style={{width:1, background:'var(--border)', margin:'4px 4px'}}/>
              <button className="btn btn--sm">H1</button>
              <button className="btn btn--sm">H2</button>
              <button className="btn btn--sm">인용</button>
              <button className="btn btn--sm">목록</button>
              <div style={{width:1, background:'var(--border)', margin:'4px 4px'}}/>
              <button className="btn btn--sm"><Icon.image/> 사진</button>
              <button className="btn btn--sm">링크</button>
              <button className="btn btn--sm">영상</button>
              <span style={{flex:1}}/>
              <button className="btn btn--sm">미리보기</button>
            </div>
            <textarea className="textarea" value={body} onChange={e=>setBody(e.target.value)} placeholder="내용을 입력하세요" style={{minHeight:340, borderTopLeftRadius:0, borderTopRightRadius:0, fontFamily:'var(--ff-body)', lineHeight:1.7}}/>

            <div style={{display:'flex', alignItems:'center', gap:10, marginTop:14, fontSize:13, color:'var(--ink-mute)'}}>
              <label style={{display:'flex', alignItems:'center', gap:6, cursor:'pointer'}}><input type="checkbox"/> 댓글 허용</label>
              <label style={{display:'flex', alignItems:'center', gap:6, cursor:'pointer'}}><input type="checkbox"/> 비밀글</label>
              <label style={{display:'flex', alignItems:'center', gap:6, cursor:'pointer'}}><input type="checkbox" defaultChecked/> 공감 표시</label>
              <span style={{flex:1}}/>
              <span style={{fontSize:12}}>{body.length} / 20,000자</span>
            </div>

            <div style={{display:'flex', justifyContent:'flex-end', gap:8, marginTop:20, paddingTop:16, borderTop:'1px solid var(--border)'}}>
              <button className="btn" onClick={()=>setRoute('board')}>취소</button>
              <button className="btn">임시저장</button>
              <button className="btn btn--primary" onClick={()=>setRoute('post')}>등록</button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

window.PostWrite = PostWrite;
