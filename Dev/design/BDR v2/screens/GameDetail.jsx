/* global React, GAMES, TEAMS, Icon */

function GameDetail({ setRoute }) {
  const g = GAMES[0];
  const applicants = [
    { name: 'hoops_m', level: 'L.6', pos: '가드', conf: true },
    { name: 'ssg_pg', level: 'L.5', pos: '가드', conf: true },
    { name: 'kim_j', level: 'L.4', pos: '포워드', conf: true },
    { name: 'iron_c', level: 'L.7', pos: '센터', conf: true },
    { name: 'pivot_mia', level: 'L.5', pos: '포워드', conf: true },
    { name: 'block_k', level: 'L.4', pos: '가드', conf: true },
    { name: 'dawn_r', level: 'L.3', pos: '포워드', conf: true },
  ];

  return (
    <div className="page">
      <div style={{display:'flex', gap:6, fontSize:12, color:'var(--ink-mute)', marginBottom:12}}>
        <a onClick={()=>setRoute('home')} style={{cursor:'pointer'}}>홈</a>
        <span>›</span>
        <a onClick={()=>setRoute('games')} style={{cursor:'pointer'}}>경기</a>
        <span>›</span>
        <span style={{color:'var(--ink)'}}>{g.title}</span>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'minmax(0,1fr) 340px', gap:24, alignItems:'flex-start'}}>
        <div>
          <div className="card" style={{padding:'24px 28px', marginBottom:16}}>
            <div style={{display:'flex', gap:8, marginBottom:12}}>
              <span className="badge badge--soft">{g.kind === 'pickup' ? '픽업' : g.kind === 'guest' ? '게스트' : '스크림'}</span>
              {g.tags.map(t => <span key={t} className="badge badge--ghost">{t}</span>)}
            </div>
            <h1 style={{margin:'0 0 14px', fontSize:28, fontWeight:800, letterSpacing:'-0.015em'}}>{g.title}</h1>
            <div style={{display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:14, padding:'18px 20px', background:'var(--bg-alt)', borderRadius:8}}>
              <div>
                <div style={{fontSize:11, color:'var(--ink-dim)', fontWeight:700, letterSpacing:'.04em'}}>날짜</div>
                <div style={{fontWeight:700, marginTop:3}}>{g.date}</div>
              </div>
              <div>
                <div style={{fontSize:11, color:'var(--ink-dim)', fontWeight:700, letterSpacing:'.04em'}}>시간</div>
                <div style={{fontWeight:700, marginTop:3, fontFamily:'var(--ff-mono)'}}>{g.time}</div>
              </div>
              <div>
                <div style={{fontSize:11, color:'var(--ink-dim)', fontWeight:700, letterSpacing:'.04em'}}>장소</div>
                <div style={{fontWeight:700, marginTop:3}}>{g.court} <span style={{color:'var(--ink-dim)', fontWeight:400, fontSize:12, marginLeft:4}}>{g.area}</span></div>
              </div>
              <div>
                <div style={{fontSize:11, color:'var(--ink-dim)', fontWeight:700, letterSpacing:'.04em'}}>참가비</div>
                <div style={{fontWeight:700, marginTop:3}}>{g.fee}</div>
              </div>
              <div>
                <div style={{fontSize:11, color:'var(--ink-dim)', fontWeight:700, letterSpacing:'.04em'}}>수준</div>
                <div style={{fontWeight:700, marginTop:3}}>{g.level}</div>
              </div>
              <div>
                <div style={{fontSize:11, color:'var(--ink-dim)', fontWeight:700, letterSpacing:'.04em'}}>호스트</div>
                <div style={{fontWeight:700, marginTop:3}}>{g.host}</div>
              </div>
            </div>
          </div>

          <div className="card" style={{padding:'22px 26px', marginBottom:16}}>
            <h2 style={{margin:'0 0 10px', fontSize:16, fontWeight:700}}>경기 안내</h2>
            <p style={{color:'var(--ink-soft)', margin:0, lineHeight:1.7, fontSize:14}}>
              매주 목요일 진행되는 미사강변체육관 정기 픽업입니다. 6:4 팀 분배, 21점 선취제로 진행되며 심판은 로테이션으로 돌아갑니다.
              주차장 무료 이용 가능하고, 실내 탈의실·샤워실 완비되어 있습니다. 참가비는 코트 대여료 충당용입니다.
              부상 방지를 위해 농구화 지참 필수입니다.
            </p>
          </div>

          <div className="card" style={{padding:'22px 26px'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:14}}>
              <h2 style={{margin:0, fontSize:16, fontWeight:700}}>참가자 <span style={{fontSize:12, color:'var(--ink-mute)', fontWeight:500, marginLeft:6}}>{g.applied}/{g.spots}</span></h2>
              <span style={{fontSize:12, color:'var(--ink-dim)'}}>승인완료 {applicants.length}명 · 대기 0명</span>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:8}}>
              {applicants.map(a => (
                <div key={a.name} style={{padding:'10px 12px', background:'var(--bg-alt)', borderRadius:6, display:'flex', alignItems:'center', gap:10}}>
                  <div style={{width:32, height:32, borderRadius:'50%', background:'var(--ink-soft)', color:'var(--bg)', display:'grid', placeItems:'center', fontFamily:'var(--ff-mono)', fontSize:11, fontWeight:700}}>{a.name.slice(0,2).toUpperCase()}</div>
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{fontWeight:700, fontSize:13, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{a.name}</div>
                    <div style={{fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>{a.level} · {a.pos}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside style={{position:'sticky', top:120}}>
          <div className="card" style={{padding:0, overflow:'hidden'}}>
            <div style={{padding:'18px 20px', borderBottom:'1px solid var(--border)'}}>
              <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:10}}>
                <div style={{fontSize:11, color:'var(--accent)', fontWeight:800, letterSpacing:'.1em'}}>참가 신청</div>
                <div style={{fontFamily:'var(--ff-mono)', fontSize:12, fontWeight:700}}>{g.spots - g.applied}자리 남음</div>
              </div>
              <div style={{height:8, background:'var(--bg-alt)', borderRadius:4, overflow:'hidden'}}>
                <div style={{width:`${(g.applied/g.spots)*100}%`, height:'100%', background: 'var(--cafe-blue)'}}/>
              </div>
            </div>
            <div style={{padding:'18px 20px', display:'flex', flexDirection:'column', gap:12}}>
              <div>
                <div style={{fontSize:11, color:'var(--ink-dim)', fontWeight:700, marginBottom:4}}>신청자 정보</div>
                <div style={{padding:'10px 12px', background:'var(--bg-alt)', borderRadius:6}}>
                  <div style={{fontWeight:700, fontSize:13}}>rdm_captain</div>
                  <div style={{fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)', marginTop:2}}>L.8 · 가드 · 레이팅 1684</div>
                </div>
              </div>
              <div>
                <div style={{fontSize:11, color:'var(--ink-dim)', fontWeight:700, marginBottom:4}}>한마디 (선택)</div>
                <textarea className="input" rows={3} defaultValue="목요일 오랜만에 뛰러 갑니다!" style={{resize:'vertical'}}/>
              </div>
              <label style={{display:'flex', alignItems:'center', gap:8, fontSize:12}}>
                <input type="checkbox" defaultChecked/>
                <span>취소 시 최소 3시간 전 통보에 동의</span>
              </label>
              <button className="btn btn--primary btn--xl">신청하기 · {g.fee}</button>
              <div style={{display:'flex', gap:6}}>
                <button className="btn btn--sm" style={{flex:1}}>💬 호스트 문의</button>
                <button className="btn btn--sm" style={{flex:1}}>🔖 저장</button>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

window.GameDetail = GameDetail;
