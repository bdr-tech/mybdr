/* global React, TEAMS, GAMES, TOURNAMENTS, Icon */

function Search({ setRoute }) {
  const [q, setQ] = React.useState('농구');
  const [tab, setTab] = React.useState('all');

  const teamHits = TEAMS.filter(t => !q || t.name.includes(q) || t.tag.includes(q)).slice(0, 4);
  const gameHits = GAMES.filter(g => !q || g.title.includes(q) || g.court.includes(q)).slice(0, 4);
  const tourneyHits = TOURNAMENTS.filter(t => !q || t.title.includes(q) || t.subtitle.includes(q)).slice(0, 3);

  const postHits = [
    { id:'s1', board:'자유', title:'주말 팀 구인 · 하남 쪽에서 뛸 분', author:'hoops_m', date:'04.22' },
    { id:'s2', board:'정보', title:'서울 농구코트 지도 (2026 업데이트)', author:'admin', date:'04.20' },
    { id:'s3', board:'후기', title:'BDR CHALLENGE 첫 출전 후기', author:'rdm_captain', date:'04.14' },
  ].filter(p => !q || p.title.includes(q));

  const totalCount = teamHits.length + gameHits.length + tourneyHits.length + postHits.length;

  return (
    <div className="page">
      <div style={{maxWidth:900, margin:'0 auto'}}>
        <div style={{position:'relative', marginBottom:20}}>
          <Icon.search style={{position:'absolute', left:16, top:'50%', transform:'translateY(-50%)', color:'var(--ink-dim)', width:16, height:16}}/>
          <input className="input" value={q} onChange={e=>setQ(e.target.value)}
            style={{paddingLeft:44, height:52, fontSize:17, fontWeight:500}}/>
        </div>

        <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:18, flexWrap:'wrap', gap:8}}>
          <div>
            <h1 style={{margin:0, fontSize:22, fontWeight:700}}>
              "<span style={{color:'var(--accent)'}}>{q || '전체'}</span>" 검색 결과
            </h1>
            <div style={{fontSize:13, color:'var(--ink-mute)', marginTop:4}}>
              총 {totalCount}건 · 팀 {teamHits.length} · 경기 {gameHits.length} · 대회 {tourneyHits.length} · 글 {postHits.length}
            </div>
          </div>
        </div>

        <div style={{display:'flex', gap:4, marginBottom:20, borderBottom:'1px solid var(--border)'}}>
          {[['all','전체'],['teams','팀'],['games','경기'],['tournaments','대회'],['posts','커뮤니티']].map(([k,l]) => (
            <button key={k} onClick={()=>setTab(k)} style={{
              padding:'10px 16px', background:'transparent', border:0,
              borderBottom: tab===k ? '3px solid var(--cafe-blue)' : '3px solid transparent',
              color: tab===k ? 'var(--ink)' : 'var(--ink-mute)',
              fontWeight: tab===k ? 700 : 500, fontSize:14, cursor:'pointer', marginBottom:-1,
            }}>{l}</button>
          ))}
        </div>

        {(tab==='all' || tab==='teams') && teamHits.length > 0 && (
          <section style={{marginBottom:28}}>
            <h2 style={{fontSize:15, fontWeight:700, marginBottom:10, display:'flex', alignItems:'center', justifyContent:'space-between'}}>
              팀 <span style={{fontSize:12, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>{teamHits.length}</span>
            </h2>
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:10}}>
              {teamHits.map(t => (
                <div key={t.id} className="card" style={{padding:'12px 14px', cursor:'pointer', display:'flex', alignItems:'center', gap:10}}>
                  <span style={{width:32, height:32, background:t.color, color:t.ink, display:'grid', placeItems:'center', fontFamily:'var(--ff-mono)', fontSize:11, fontWeight:700, borderRadius:4, flexShrink:0}}>{t.tag}</span>
                  <div style={{minWidth:0}}>
                    <div style={{fontWeight:700, fontSize:14, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{t.name}</div>
                    <div style={{fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>레이팅 {t.rating}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {(tab==='all' || tab==='games') && gameHits.length > 0 && (
          <section style={{marginBottom:28}}>
            <h2 style={{fontSize:15, fontWeight:700, marginBottom:10}}>경기 모집</h2>
            <div className="card" style={{padding:0, overflow:'hidden'}}>
              {gameHits.map((g, i) => (
                <div key={g.id} style={{padding:'12px 16px', borderBottom: i < gameHits.length-1 ? '1px solid var(--border)' : 0, display:'grid', gridTemplateColumns:'60px 1fr auto', gap:10, alignItems:'center', cursor:'pointer'}}>
                  <span className="badge badge--soft">{g.kind === 'pickup' ? '픽업' : g.kind === 'guest' ? '게스트' : '스크림'}</span>
                  <div>
                    <div style={{fontWeight:600, fontSize:14}}>{g.title}</div>
                    <div style={{fontSize:12, color:'var(--ink-dim)', marginTop:2}}>{g.court} · {g.date}</div>
                  </div>
                  <div style={{fontSize:12, fontFamily:'var(--ff-mono)', fontWeight:700, color:'var(--ink-mute)'}}>{g.applied}/{g.spots}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {(tab==='all' || tab==='tournaments') && tourneyHits.length > 0 && (
          <section style={{marginBottom:28}}>
            <h2 style={{fontSize:15, fontWeight:700, marginBottom:10}}>대회</h2>
            <div className="card" style={{padding:0, overflow:'hidden'}}>
              {tourneyHits.map((t, i) => (
                <div key={t.id} style={{padding:'14px 16px', borderBottom: i < tourneyHits.length-1 ? '1px solid var(--border)' : 0, display:'grid', gridTemplateColumns:'56px 1fr auto', gap:12, alignItems:'center', cursor:'pointer'}}>
                  <div style={{width:48, height:48, background:t.accent, color:'#fff', display:'grid', placeItems:'center', fontFamily:'var(--ff-display)', fontWeight:900, fontSize:10, borderRadius:'var(--radius-chip)'}}>{t.level}</div>
                  <div>
                    <div style={{fontWeight:700}}>{t.title} <span style={{color:'var(--ink-mute)', fontWeight:500, fontSize:12, marginLeft:4}}>{t.edition}</span></div>
                    <div style={{fontSize:12, color:'var(--ink-dim)', marginTop:2}}>{t.court} · {t.dates}</div>
                  </div>
                  <button className="btn btn--sm">상세</button>
                </div>
              ))}
            </div>
          </section>
        )}

        {(tab==='all' || tab==='posts') && postHits.length > 0 && (
          <section style={{marginBottom:28}}>
            <h2 style={{fontSize:15, fontWeight:700, marginBottom:10}}>커뮤니티</h2>
            <div className="card" style={{padding:0, overflow:'hidden'}}>
              {postHits.map((p, i) => (
                <div key={p.id} style={{padding:'12px 16px', borderBottom: i < postHits.length-1 ? '1px solid var(--border)' : 0, display:'grid', gridTemplateColumns:'60px 1fr auto', gap:10, alignItems:'center', cursor:'pointer'}}>
                  <span className="badge badge--soft">{p.board}</span>
                  <div style={{fontWeight:500}}>{p.title}</div>
                  <div style={{fontSize:12, color:'var(--ink-dim)'}}>{p.author} · {p.date}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {totalCount === 0 && (
          <div style={{padding:60, textAlign:'center', color:'var(--ink-dim)'}}>
            <div style={{fontSize:36, marginBottom:8}}>○</div>
            검색 결과가 없습니다. 다른 키워드를 시도해보세요.
          </div>
        )}
      </div>
    </div>
  );
}

window.Search = Search;
