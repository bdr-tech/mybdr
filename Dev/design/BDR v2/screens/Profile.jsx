/* global React, TEAMS, GAMES, TOURNAMENTS, POSTS, Icon */

function Profile({ setRoute }) {
  const team = TEAMS[0]; // RDM
  const stats = [
    { label: '경기', value: '47' },
    { label: '승률', value: '63%' },
    { label: 'PPG', value: '14.2' },
    { label: 'APG', value: '5.1' },
    { label: 'RPG', value: '3.8' },
    { label: '레이팅', value: '1,684' },
  ];
  const timeline = [
    { date: '04.22', action: '대회 접수', target: 'BDR Challenge Spring 2026', tag: 'match' },
    { date: '04.20', action: '경기 완료', target: '장충체육관 픽업 · 21–18 승', tag: 'win' },
    { date: '04.18', action: '게시글 작성', target: '어제 장충체육관 픽업경기 후기', tag: 'post' },
    { date: '04.17', action: '팀 합류', target: 'REDEEM 정식 팀원', tag: 'team' },
    { date: '04.12', action: '경기 완료', target: '반포 주말 3x3 · 15–21 패', tag: 'loss' },
  ];
  const badges = [
    { icon: '🏆', name: 'Winter Finals 진출', date: '2026.02' },
    { icon: '🔥', name: '10연승', date: '2026.03' },
    { icon: '⭐', name: '시즌 MVP 후보', date: '2026.03' },
    { icon: '🎯', name: '3점 100개', date: '2026.04' },
  ];

  return (
    <div className="page">
      <div style={{display:'grid', gridTemplateColumns:'320px 1fr', gap:20, alignItems:'flex-start'}}>
        <aside style={{position:'sticky', top:120, display:'flex', flexDirection:'column', gap:14}}>
          <div className="card" style={{padding:'24px 22px', textAlign:'center'}}>
            <div style={{width:96, height:96, margin:'0 auto 14px', background:`linear-gradient(145deg, ${team.color}, #000)`, color:team.ink, display:'grid', placeItems:'center', fontFamily:'var(--ff-display)', fontWeight:900, fontSize:28, borderRadius:'50%', border:'3px solid var(--border)'}}>{team.tag}</div>
            <h1 style={{margin:'0 0 4px', fontSize:22, fontWeight:800}}>rdm_captain</h1>
            <div style={{fontSize:13, color:'var(--ink-mute)', marginBottom:12}}>리딤 · 가드 · #7</div>
            <div style={{display:'flex', gap:6, justifyContent:'center', marginBottom:14}}>
              <span className="badge badge--red">L.8</span>
              <span className="badge badge--soft">PRO 멤버</span>
              <span className="badge badge--ok">인증완료</span>
            </div>
            <button className="btn btn--sm" style={{width:'100%', marginBottom:6}} onClick={()=>setRoute('settings')}>프로필 편집</button>
            <button className="btn btn--sm" style={{width:'100%'}} onClick={()=>setRoute('notifications')}>알림 3건 확인</button>
          </div>

          <div className="card" style={{padding:'18px 20px'}}>
            <div style={{fontWeight:700, fontSize:14, marginBottom:10}}>소속 팀</div>
            <div onClick={()=>setRoute('teamDetail')} style={{display:'flex', alignItems:'center', gap:10, cursor:'pointer', padding:8, background:'var(--bg-alt)', borderRadius:6}}>
              <span style={{width:32, height:32, background:team.color, color:team.ink, display:'grid', placeItems:'center', fontFamily:'var(--ff-mono)', fontSize:11, fontWeight:700, borderRadius:4}}>{team.tag}</span>
              <div style={{flex:1}}>
                <div style={{fontWeight:700, fontSize:13}}>{team.name}</div>
                <div style={{fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>{team.wins}W {team.losses}L · {team.rating}</div>
              </div>
            </div>
          </div>

          <div className="card" style={{padding:'18px 20px'}}>
            <div style={{fontWeight:700, fontSize:14, marginBottom:10}}>활동 뱃지</div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
              {badges.map((b, i) => (
                <div key={i} style={{padding:'10px 8px', background:'var(--bg-alt)', borderRadius:6, textAlign:'center'}}>
                  <div style={{fontSize:22}}>{b.icon}</div>
                  <div style={{fontSize:11, fontWeight:700, marginTop:2}}>{b.name}</div>
                  <div style={{fontSize:10, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>{b.date}</div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <div>
          <div className="card" style={{padding:'22px 24px', marginBottom:16}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:14}}>
              <h2 style={{margin:0, fontSize:18, fontWeight:700}}>시즌 스탯 <span style={{fontSize:12, color:'var(--ink-mute)', fontWeight:500}}>2026 Spring</span></h2>
              <a style={{fontSize:12, color:'var(--ink-dim)', cursor:'pointer'}}>전체 시즌 →</a>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:0, border:'1px solid var(--border)', borderRadius:8, overflow:'hidden'}}>
              {stats.map((s, i) => (
                <div key={s.label} style={{padding:'14px 10px', textAlign:'center', borderLeft: i > 0 ? '1px solid var(--border)' : 0, background: 'var(--bg-alt)'}}>
                  <div style={{fontFamily:'var(--ff-display)', fontWeight:900, fontSize:24, letterSpacing:'-0.01em'}}>{s.value}</div>
                  <div style={{fontSize:11, color:'var(--ink-dim)', fontWeight:600, letterSpacing:'.04em', marginTop:2}}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{padding:'22px 24px', marginBottom:16}}>
            <h2 style={{margin:'0 0 14px', fontSize:18, fontWeight:700}}>다가오는 일정</h2>
            <div style={{display:'flex', flexDirection:'column', gap:10}}>
              {GAMES.slice(0, 3).map(g => (
                <div key={g.id} style={{display:'grid', gridTemplateColumns:'72px 1fr auto', gap:14, padding:'12px 14px', background:'var(--bg-alt)', borderRadius:6, alignItems:'center'}}>
                  <div style={{fontFamily:'var(--ff-mono)', fontSize:12, fontWeight:700, color:'var(--accent)'}}>{g.date.split(' ')[0].slice(5)}</div>
                  <div>
                    <div style={{fontWeight:600, fontSize:14}}>{g.title}</div>
                    <div style={{fontSize:12, color:'var(--ink-dim)', marginTop:2}}>{g.court} · {g.time}</div>
                  </div>
                  <span className="badge badge--ok">참가확정</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{padding:'22px 24px'}}>
            <h2 style={{margin:'0 0 14px', fontSize:18, fontWeight:700}}>최근 활동</h2>
            <div>
              {timeline.map((t, i) => (
                <div key={i} style={{display:'grid', gridTemplateColumns:'60px 80px 1fr', gap:14, padding:'12px 0', borderBottom: i < timeline.length-1 ? '1px solid var(--border)' : 0}}>
                  <div style={{fontFamily:'var(--ff-mono)', fontSize:12, color:'var(--ink-dim)'}}>{t.date}</div>
                  <div>
                    <span className={`badge ${t.tag==='win'?'badge--ok':t.tag==='loss'?'badge--red':'badge--soft'}`} style={{fontSize:10}}>{t.action}</span>
                  </div>
                  <div style={{fontSize:14}}>{t.target}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.Profile = Profile;
