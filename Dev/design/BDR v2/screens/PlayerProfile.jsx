/* global React, TEAMS, Icon */

function PlayerProfile({ setRoute }) {
  const [tab, setTab] = React.useState('overview');
  // Other player: 몽키즈 센터 (not me)
  const team = TEAMS[2]; // 몽키즈
  const p = {
    name: 'monkey_k',
    realName: '김민재',
    level: 'L.9',
    rating: 1892,
    role: '팀장',
    position: '센터',
    height: 192,
    weight: 88,
    wing: 198,
    hand: '오른손',
    age: 28,
    jerseyNumber: 4,
    joined: '2018.03.14',
    lastSeen: '3시간 전',
    posts: 842,
    city: '서울 송파',
    badges: [
      { icon:'🏆', name:'Winter Finals 우승', date:'2026.02' },
      { icon:'⭐', name:'올스타', date:'2026.01' },
      { icon:'🛡️', name:'DPOY', date:'2025.12' },
      { icon:'🔥', name:'더블더블 10회', date:'2025.11' },
    ],
  };

  const seasonStats = [
    { label:'경기', value:'34' },
    { label:'승률', value:'79%' },
    { label:'PPG', value:'18.4' },
    { label:'APG', value:'3.2' },
    { label:'RPG', value:'11.8' },
    { label:'BPG', value:'2.4' },
  ];

  const shotChart = [
    { zone:'림 부근',       pct:72, att:4.2, league:58 },
    { zone:'미드레인지',    pct:41, att:3.1, league:38 },
    { zone:'코너 3점',      pct:38, att:1.2, league:35 },
    { zone:'탑 3점',        pct:31, att:0.8, league:34 },
    { zone:'자유투',        pct:74, att:5.4, league:68 },
  ];

  const recent = [
    { date:'04.20', opp:'3POINT', oppTag:'3PT', oppColor:'#F59E0B', result:'W', score:'24-18', pts:22, reb:14, ast:3, stl:2 },
    { date:'04.13', opp:'REDEEM', oppTag:'RDM', oppColor:'#E11D48', result:'W', score:'21-17', pts:16, reb:12, ast:5, stl:1 },
    { date:'04.06', opp:'KINGS CREW', oppTag:'KGS', oppColor:'#0EA5E9', result:'L', score:'19-21', pts:20, reb:10, ast:2, stl:0 },
    { date:'03.30', opp:'IRON WOLVES', oppTag:'IRW', oppColor:'#6B7280', result:'W', score:'21-14', pts:14, reb:15, ast:4, stl:3 },
    { date:'03.23', opp:'PIVOT', oppTag:'PVT', oppColor:'#EC4899', result:'W', score:'21-11', pts:19, reb:9,  ast:4, stl:2 },
  ];

  const vsMe = { games:4, wins:1, losses:3, myPts:12.0, theirPts:21.5 };

  return (
    <div className="page">
      <div style={{display:'flex', gap:6, fontSize:12, color:'var(--ink-mute)', marginBottom:12}}>
        <a onClick={()=>setRoute('home')} style={{cursor:'pointer'}}>홈</a>
        <span>›</span>
        <a onClick={()=>setRoute('teamDetail')} style={{cursor:'pointer'}}>{team.name}</a>
        <span>›</span>
        <span style={{color:'var(--ink)'}}>{p.name}</span>
      </div>

      {/* Hero */}
      <div className="card" style={{padding:0, overflow:'hidden', marginBottom:16}}>
        <div style={{
          padding:'32px 32px 24px',
          background:`linear-gradient(135deg, ${team.color} 0%, color-mix(in oklab, ${team.color} 50%, #000) 100%)`,
          color:team.ink,
          display:'grid', gridTemplateColumns:'auto 1fr auto', gap:24, alignItems:'center',
        }}>
          <div style={{position:'relative'}}>
            <div style={{width:120, height:120, borderRadius:'50%', background:'rgba(255,255,255,.18)', border:'3px solid rgba(255,255,255,.35)', display:'grid', placeItems:'center', fontFamily:'var(--ff-display)', fontWeight:900, fontSize:32}}>MK</div>
            <div style={{position:'absolute', bottom:-4, right:-4, background:'#fff', color:'#000', width:36, height:36, borderRadius:'50%', display:'grid', placeItems:'center', fontFamily:'var(--ff-display)', fontWeight:900, fontSize:14, border:`3px solid ${team.color}`}}>{p.jerseyNumber}</div>
          </div>
          <div style={{minWidth:0}}>
            <div style={{display:'flex', gap:8, alignItems:'center', marginBottom:4, fontSize:11, opacity:.85, fontWeight:700, letterSpacing:'.08em'}}>
              <span>#{p.jerseyNumber}</span><span>·</span><span>{p.position}</span><span>·</span><span>{team.name.toUpperCase()}</span>
            </div>
            <h1 style={{margin:'0 0 4px', fontSize:36, fontWeight:800, letterSpacing:'-0.02em'}}>{p.name}</h1>
            <div style={{fontSize:14, opacity:.9, marginBottom:10}}>{p.realName} · {p.city} · {p.age}세</div>
            <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
              <span style={{background:'rgba(0,0,0,.3)', color:'#fff', padding:'3px 8px', fontSize:11, fontWeight:700, borderRadius:4}}>{p.level}</span>
              <span style={{background:'rgba(0,0,0,.3)', color:'#fff', padding:'3px 8px', fontSize:11, fontWeight:700, borderRadius:4}}>팀장</span>
              <span style={{background:'rgba(255,255,255,.2)', color:team.ink, padding:'3px 8px', fontSize:11, fontWeight:700, borderRadius:4}}>PRO 멤버</span>
              <span style={{background:'rgba(255,255,255,.2)', color:team.ink, padding:'3px 8px', fontSize:11, fontWeight:700, borderRadius:4}}>인증완료</span>
            </div>
          </div>
          <div style={{display:'flex', flexDirection:'column', gap:6, minWidth:140}}>
            <button className="btn btn--sm" style={{background:'#fff', color:'#000', border:0}} onClick={()=>setRoute('messages')}>쪽지 보내기</button>
            <button className="btn btn--sm" style={{background:'rgba(0,0,0,.25)', color:'#fff', border:'1px solid rgba(255,255,255,.3)'}}>팔로우</button>
            <button className="btn btn--sm" style={{background:'transparent', color:team.ink, border:'1px solid rgba(255,255,255,.2)'}}>게스트 초대</button>
          </div>
        </div>

        {/* Physical strip */}
        <div style={{display:'grid', gridTemplateColumns:'repeat(6, 1fr)', borderTop:'1px solid var(--border)', background:'var(--bg-elev)'}}>
          {[
            { label:'키',      value:`${p.height}cm` },
            { label:'몸무게',  value:`${p.weight}kg` },
            { label:'윙스팬',  value:`${p.wing}cm` },
            { label:'주손',    value:p.hand },
            { label:'레이팅',  value:p.rating.toLocaleString() },
            { label:'최근 접속', value:p.lastSeen },
          ].map((v, i) => (
            <div key={i} style={{padding:'12px 10px', textAlign:'center', borderLeft: i>0 ? '1px solid var(--border)' : 0}}>
              <div style={{fontFamily:'var(--ff-display)', fontWeight:800, fontSize:15, letterSpacing:'-0.01em'}}>{v.value}</div>
              <div style={{fontSize:10, color:'var(--ink-dim)', fontWeight:600, letterSpacing:'.04em', textTransform:'uppercase', marginTop:2}}>{v.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:'flex', gap:2, borderBottom:'1px solid var(--border)', marginBottom:16}}>
        {[
          { id:'overview', label:'개요' },
          { id:'stats',    label:'시즌 스탯' },
          { id:'games',    label:'최근 경기' },
          { id:'vs',       label:'나와의 전적' },
        ].map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            padding:'12px 18px', background:'transparent', border:0, cursor:'pointer',
            fontSize:14, fontWeight: tab===t.id ? 700 : 500,
            color: tab===t.id ? 'var(--cafe-blue-deep)' : 'var(--ink-mute)',
            borderBottom: tab===t.id ? '2px solid var(--cafe-blue)' : '2px solid transparent',
            marginBottom:-1,
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div style={{display:'grid', gridTemplateColumns:'minmax(0, 1fr) 320px', gap:16}}>
          <div style={{display:'flex', flexDirection:'column', gap:14}}>
            <div className="card" style={{padding:'22px 24px'}}>
              <h2 style={{margin:'0 0 14px', fontSize:16, fontWeight:700}}>2026 스프링 시즌</h2>
              <div style={{display:'grid', gridTemplateColumns:'repeat(6, 1fr)', border:'1px solid var(--border)', borderRadius:8, overflow:'hidden'}}>
                {seasonStats.map((s, i) => (
                  <div key={s.label} style={{padding:'14px 8px', textAlign:'center', borderLeft: i>0 ? '1px solid var(--border)' : 0, background:'var(--bg-alt)'}}>
                    <div style={{fontFamily:'var(--ff-display)', fontWeight:900, fontSize:24, letterSpacing:'-0.01em'}}>{s.value}</div>
                    <div style={{fontSize:10.5, color:'var(--ink-dim)', fontWeight:600, letterSpacing:'.04em', marginTop:2}}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card" style={{padding:'22px 24px'}}>
              <h2 style={{margin:'0 0 14px', fontSize:16, fontWeight:700}}>슛 존별 성공률</h2>
              <div style={{display:'flex', flexDirection:'column', gap:10}}>
                {shotChart.map(z => (
                  <div key={z.zone} style={{display:'grid', gridTemplateColumns:'110px 1fr 80px', gap:12, alignItems:'center'}}>
                    <div style={{fontSize:13, fontWeight:600}}>{z.zone}</div>
                    <div style={{position:'relative', height:20, background:'var(--bg-alt)', borderRadius:4, overflow:'hidden'}}>
                      <div style={{position:'absolute', left:0, top:0, bottom:0, width:`${z.pct}%`, background: z.pct >= z.league ? 'var(--ok)' : 'var(--warn)', opacity:.85}}/>
                      <div style={{position:'absolute', left:`${z.league}%`, top:0, bottom:0, width:2, background:'var(--ink-dim)'}} title="리그 평균"/>
                      <div style={{position:'absolute', inset:0, display:'flex', alignItems:'center', paddingLeft:8, fontSize:11, fontWeight:700, color:'#fff', mixBlendMode:'difference'}}>
                        {z.pct}%
                      </div>
                    </div>
                    <div style={{fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)', textAlign:'right'}}>{z.att} 시도/G</div>
                  </div>
                ))}
              </div>
              <div style={{marginTop:12, fontSize:11, color:'var(--ink-dim)'}}>
                <span style={{display:'inline-block', width:8, height:8, background:'var(--ok)', marginRight:4}}/>리그 평균 이상
                <span style={{display:'inline-block', width:8, height:8, background:'var(--warn)', marginLeft:12, marginRight:4}}/>리그 평균 이하
                <span style={{marginLeft:12}}>| 세로선 = 리그 평균</span>
              </div>
            </div>

            <div className="card" style={{padding:'22px 24px'}}>
              <h2 style={{margin:'0 0 10px', fontSize:16, fontWeight:700}}>스카우팅 리포트</h2>
              <p style={{margin:0, fontSize:14, color:'var(--ink-soft)', lineHeight:1.7}}>
                192cm/88kg의 정통 센터. 림 부근 72% 성공률로 수도권 아마추어 센터 중 최상위권. 블록슛·리바운드 능력이 탁월하며,
                특히 공격 리바운드(4.1/G) 이후 세컨찬스 득점이 장기. 약점은 외곽 확장 — 3점 시도가 경기당 2회 이하로 제한적이다.
                팀장으로서 커뮤니케이션·경기 운영 능력을 갖췄고, 2026 Winter Finals MVP 후보에 올랐다.
              </p>
            </div>
          </div>

          <aside style={{display:'flex', flexDirection:'column', gap:14}}>
            <div className="card" style={{padding:'18px 20px'}}>
              <div style={{fontSize:11, color:'var(--ink-dim)', fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', marginBottom:8}}>소속 팀</div>
              <div onClick={()=>setRoute('teamDetail')} style={{display:'flex', gap:10, alignItems:'center', padding:10, background:'var(--bg-alt)', borderRadius:6, cursor:'pointer'}}>
                <div style={{width:36, height:36, background:team.color, color:team.ink, display:'grid', placeItems:'center', fontFamily:'var(--ff-mono)', fontSize:11, fontWeight:700, borderRadius:4}}>{team.tag}</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700, fontSize:13}}>{team.name}</div>
                  <div style={{fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>{team.wins}W {team.losses}L · Rtg {team.rating}</div>
                </div>
              </div>
              <div style={{marginTop:10, fontSize:12, color:'var(--ink-mute)'}}>
                {p.joined} 합류 · 팀장 (2023~)
              </div>
            </div>

            <div className="card" style={{padding:'18px 20px'}}>
              <div style={{fontSize:11, color:'var(--ink-dim)', fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', marginBottom:10}}>획득 뱃지</div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
                {p.badges.map((b, i) => (
                  <div key={i} style={{padding:'12px 8px', background:'var(--bg-alt)', borderRadius:6, textAlign:'center'}}>
                    <div style={{fontSize:22}}>{b.icon}</div>
                    <div style={{fontSize:11, fontWeight:700, marginTop:2}}>{b.name}</div>
                    <div style={{fontSize:10, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>{b.date}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card" style={{padding:'18px 20px'}}>
              <div style={{fontSize:11, color:'var(--ink-dim)', fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', marginBottom:8}}>활동</div>
              <div style={{fontSize:13, lineHeight:1.8, color:'var(--ink-soft)'}}>
                커뮤니티 글 · <b>{p.posts.toLocaleString()}</b><br/>
                가입일 · <span style={{fontFamily:'var(--ff-mono)'}}>{p.joined}</span><br/>
                최근 접속 · {p.lastSeen}
              </div>
              <a style={{fontSize:12, color:'var(--link)', cursor:'pointer', marginTop:8, display:'inline-block'}}>최근 작성글 보기 →</a>
            </div>

            <button className="btn btn--sm" style={{color:'var(--danger)'}}>사용자 신고</button>
          </aside>
        </div>
      )}

      {tab === 'stats' && (
        <div className="card" style={{padding:'22px 24px'}}>
          <h2 style={{margin:'0 0 14px', fontSize:16, fontWeight:700}}>시즌별 평균</h2>
          <div className="board" style={{border:0, marginTop:8}}>
            <div className="board__head" style={{gridTemplateColumns:'80px 80px 80px repeat(7, 1fr)'}}>
              <div>시즌</div><div>경기</div><div>승률</div><div>PPG</div><div>RPG</div><div>APG</div><div>SPG</div><div>BPG</div><div>FG%</div><div>레이팅</div>
            </div>
            {[
              ['2026 Spring', '34','79%','18.4','11.8','3.2','1.4','2.4','56%','1892'],
              ['2025 Winter', '28','71%','17.1','10.9','2.8','1.2','2.1','54%','1840'],
              ['2025 Fall',   '22','64%','15.8','10.2','3.1','1.0','1.8','52%','1781'],
              ['2025 Spring', '26','58%','14.2','9.4','2.6','0.9','1.5','50%','1720'],
              ['커리어 평균', '418','66%','16.1','10.3','2.9','1.1','1.9','52%','—'],
            ].map((row, i) => (
              <div key={i} className="board__row" style={{gridTemplateColumns:'80px 80px 80px repeat(7, 1fr)', cursor:'default', fontWeight: i===4 ? 700 : 500, background: i===4 ? 'var(--bg-alt)' : undefined}}>
                {row.map((v, j) => <div key={j} style={{fontFamily: j>0 ? 'var(--ff-mono)' : undefined}}>{v}</div>)}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'games' && (
        <div className="card" style={{padding:0, overflow:'hidden'}}>
          <div className="board__head" style={{gridTemplateColumns:'80px 1fr 60px 90px repeat(4, 60px)'}}>
            <div>날짜</div><div style={{textAlign:'left'}}>상대</div><div>결과</div><div>스코어</div><div>PTS</div><div>REB</div><div>AST</div><div>STL</div>
          </div>
          {recent.map((g, i) => (
            <div key={i} className="board__row" style={{gridTemplateColumns:'80px 1fr 60px 90px repeat(4, 60px)'}}>
              <div style={{fontFamily:'var(--ff-mono)', color:'var(--ink-dim)'}}>{g.date}</div>
              <div className="title" style={{gap:8}}>
                <span style={{width:24, height:24, background:g.oppColor, color:'#fff', display:'grid', placeItems:'center', fontFamily:'var(--ff-mono)', fontSize:9, fontWeight:700, borderRadius:3}}>{g.oppTag}</span>
                vs {g.opp}
              </div>
              <div><span className="badge" style={{background: g.result==='W' ? 'var(--ok)' : 'var(--danger)', color:'#fff', border:0}}>{g.result}</span></div>
              <div style={{fontFamily:'var(--ff-mono)', fontWeight:700}}>{g.score}</div>
              <div style={{fontFamily:'var(--ff-mono)', fontWeight:700}}>{g.pts}</div>
              <div style={{fontFamily:'var(--ff-mono)'}}>{g.reb}</div>
              <div style={{fontFamily:'var(--ff-mono)'}}>{g.ast}</div>
              <div style={{fontFamily:'var(--ff-mono)'}}>{g.stl}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'vs' && (
        <div className="card" style={{padding:'24px 26px'}}>
          <div style={{display:'grid', gridTemplateColumns:'1fr auto 1fr', gap:30, alignItems:'center', marginBottom:24}}>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:12, color:'var(--ink-dim)'}}>나</div>
              <div style={{fontSize:22, fontWeight:800}}>rdm_captain</div>
              <div style={{fontSize:12, color:'var(--ink-mute)', fontFamily:'var(--ff-mono)'}}>L.8 · 가드 · Rtg 1684</div>
            </div>
            <div style={{fontFamily:'var(--ff-display)', fontWeight:900, fontSize:40, color:'var(--ink-dim)'}}>VS</div>
            <div>
              <div style={{fontSize:12, color:'var(--ink-dim)'}}>{team.name}</div>
              <div style={{fontSize:22, fontWeight:800}}>{p.name}</div>
              <div style={{fontSize:12, color:'var(--ink-mute)', fontFamily:'var(--ff-mono)'}}>{p.level} · {p.position} · Rtg {p.rating}</div>
            </div>
          </div>

          <div style={{display:'grid', gridTemplateColumns:'1fr auto 1fr', gap:16, alignItems:'center', padding:'18px 20px', background:'var(--bg-alt)', borderRadius:8}}>
            <Compare left={vsMe.losses} right={vsMe.wins} leftLabel="내 승" rightLabel="그의 승"/>
            <div style={{width:1, height:40, background:'var(--border)'}}/>
            <Compare left={vsMe.myPts} right={vsMe.theirPts} leftLabel="내 평균득점" rightLabel="그의 평균득점"/>
          </div>

          <div style={{marginTop:20, fontSize:13, color:'var(--ink-mute)', lineHeight:1.7, textAlign:'center'}}>
            4번 맞붙어 1승 3패. 평균 12점 득점했지만 센터 매치업에서 리바운드 열세(4 vs 11.5)로 2차 기회가 많이 허용되었다.<br/>
            다음 대결 · <b style={{color:'var(--accent)'}}>BDR Challenge Spring 16강</b> 가능성
          </div>
        </div>
      )}
    </div>
  );
}

function Compare({ left, right, leftLabel, rightLabel }) {
  return (
    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
      <div style={{textAlign:'right'}}>
        <div style={{fontFamily:'var(--ff-display)', fontWeight:900, fontSize:32, letterSpacing:'-0.02em', color: left > right ? 'var(--ink)' : 'var(--ink-dim)'}}>{left}</div>
        <div style={{fontSize:10, color:'var(--ink-dim)', fontWeight:600, letterSpacing:'.04em', textTransform:'uppercase'}}>{leftLabel}</div>
      </div>
      <div>
        <div style={{fontFamily:'var(--ff-display)', fontWeight:900, fontSize:32, letterSpacing:'-0.02em', color: right > left ? 'var(--accent)' : 'var(--ink-dim)'}}>{right}</div>
        <div style={{fontSize:10, color:'var(--ink-dim)', fontWeight:600, letterSpacing:'.04em', textTransform:'uppercase'}}>{rightLabel}</div>
      </div>
    </div>
  );
}

window.PlayerProfile = PlayerProfile;
