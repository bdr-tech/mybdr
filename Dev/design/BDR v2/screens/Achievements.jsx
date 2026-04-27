/* global React, Icon */

function Achievements({ setRoute }) {
  const [filter, setFilter] = React.useState('all');

  const cats = [
    { id:'game',    label:'경기', color:'#DC2626' },
    { id:'team',    label:'팀', color:'#0F5FCC' },
    { id:'community', label:'커뮤니티', color:'#10B981' },
    { id:'season',  label:'시즌', color:'#F59E0B' },
    { id:'milestone', label:'마일스톤', color:'#8B5CF6' },
  ];

  const badges = [
    { id:1, cat:'game', tier:'gold', icon:'🎯', name:'더블 트리플더블', desc:'한 경기 2회 이상 트리플더블 달성', earned:true, date:'2026.03.22', rarity:2.1 },
    { id:2, cat:'game', tier:'silver', icon:'🔥', name:'10연승', desc:'연속 10경기 승리', earned:true, date:'2026.03.08', rarity:8.4 },
    { id:3, cat:'game', tier:'gold', icon:'💯', name:'한 경기 30+', desc:'한 경기 30득점 돌파', earned:true, date:'2026.02.11', rarity:5.7 },
    { id:4, cat:'game', tier:'bronze', icon:'🎯', name:'3점 100개', desc:'시즌 누적 3점 100개', earned:true, date:'2026.04.14', rarity:12.3 },
    { id:5, cat:'team', tier:'gold', icon:'🏆', name:'팀 창단 멤버', desc:'REDEEM 창단 오리지널 멤버', earned:true, date:'2024.01.15', rarity:0.8 },
    { id:6, cat:'team', tier:'silver', icon:'👑', name:'주장', desc:'팀 주장으로 1시즌 완주', earned:true, date:'2026.01.05', rarity:3.2 },
    { id:7, cat:'community', tier:'silver', icon:'✍️', name:'작가 레벨1', desc:'게시글 50건 작성', earned:true, date:'2026.02.28', rarity:9.1 },
    { id:8, cat:'community', tier:'gold', icon:'🔥', name:'이슈메이커', desc:'한 게시글 1,000 조회 돌파', earned:true, date:'2026.04.20', rarity:4.5 },
    { id:9, cat:'community', tier:'bronze', icon:'💬', name:'댓글 장인', desc:'댓글 200건', earned:true, date:'2026.03.30', rarity:18.2 },
    { id:10, cat:'season', tier:'gold', icon:'⭐', name:'시즌 MVP 후보', desc:'2026 Spring 시즌 MVP 투표 후보 선정', earned:true, date:'2026.04.01', rarity:0.3 },
    { id:11, cat:'season', tier:'silver', icon:'🎗', name:'개근상', desc:'시즌 전 경기 참가', earned:false, progress:87, total:100 },
    { id:12, cat:'milestone', tier:'platinum', icon:'💎', name:'백경기 클럽', desc:'누적 100경기 출전', earned:false, progress:47, total:100 },
    { id:13, cat:'milestone', tier:'gold', icon:'🎂', name:'1주년', desc:'MyBDR 가입 1주년', earned:true, date:'2025.06.18', rarity:32.1 },
    { id:14, cat:'milestone', tier:'silver', icon:'🌅', name:'얼리버드', desc:'오전 6시 경기 5회', earned:false, progress:2, total:5 },
    { id:15, cat:'game', tier:'platinum', icon:'🌟', name:'퍼펙트 게임', desc:'시즌 내 평점 5점 10경기 연속', earned:false, progress:6, total:10 },
    { id:16, cat:'community', tier:'gold', icon:'📸', name:'아카이브', desc:'갤러리 업로드 30건', earned:false, progress:12, total:30 },
  ];

  const tierColor = { platinum:'#7DD3FC', gold:'#F59E0B', silver:'#94A3B8', bronze:'#C2765A' };
  const tierLabel = { platinum:'플래티넘', gold:'골드', silver:'실버', bronze:'브론즈' };

  const earned = badges.filter(b=>b.earned);
  const locked = badges.filter(b=>!b.earned);
  const shown = filter==='all' ? badges : filter==='locked' ? locked : filter==='earned' ? earned : badges.filter(b=>b.cat===filter);

  return (
    <div className="page">
      <div style={{display:'flex', gap:6, fontSize:12, color:'var(--ink-mute)', marginBottom:12}}>
        <a onClick={()=>setRoute('home')} style={{cursor:'pointer'}}>홈</a><span>›</span>
        <a onClick={()=>setRoute('profile')} style={{cursor:'pointer'}}>프로필</a><span>›</span>
        <span style={{color:'var(--ink)'}}>업적</span>
      </div>

      {/* Header */}
      <div className="card" style={{padding:'28px 32px', marginBottom:18, display:'grid', gridTemplateColumns:'1fr auto', gap:24, alignItems:'center'}}>
        <div>
          <div className="eyebrow">ACHIEVEMENTS</div>
          <h1 style={{margin:'4px 0 6px', fontSize:32, fontWeight:800, letterSpacing:'-0.02em'}}>내가 걸어온 기록</h1>
          <p style={{margin:0, color:'var(--ink-mute)', fontSize:14}}>경기·팀·커뮤니티 활동으로 모은 업적 배지. 희소도가 낮을수록 귀한 배지입니다.</p>
        </div>
        <div style={{display:'flex', gap:18}}>
          {[
            { l:'획득', v: earned.length, c:'var(--accent)' },
            { l:'전체', v: badges.length, c:'var(--ink)' },
            { l:'달성률', v: `${Math.round(earned.length/badges.length*100)}%`, c:'var(--ok)' },
          ].map(s => (
            <div key={s.l} style={{textAlign:'center', minWidth:80}}>
              <div style={{fontFamily:'var(--ff-display)', fontSize:32, fontWeight:900, color:s.c, letterSpacing:'-0.02em'}}>{s.v}</div>
              <div style={{fontSize:10, color:'var(--ink-dim)', fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase'}}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent / Showcase */}
      <div style={{marginBottom:18}}>
        <h2 style={{fontSize:16, fontWeight:700, letterSpacing:'-0.01em', margin:'0 0 10px'}}>최근 획득</h2>
        <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:10}}>
          {[...earned].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,4).map(b => (
            <div key={b.id} className="card" style={{padding:'16px 18px', display:'flex', gap:12, alignItems:'center', borderLeft:`3px solid ${tierColor[b.tier]}`}}>
              <div style={{fontSize:32, width:42, textAlign:'center'}}>{b.icon}</div>
              <div style={{minWidth:0}}>
                <div style={{fontWeight:700, fontSize:13}}>{b.name}</div>
                <div style={{fontSize:10, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>{b.date} · 상위 {b.rarity}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div style={{display:'flex', gap:6, marginBottom:14, flexWrap:'wrap'}}>
        {[
          { id:'all',    label:`전체 · ${badges.length}` },
          { id:'earned', label:`획득 · ${earned.length}` },
          { id:'locked', label:`진행중 · ${locked.length}` },
          ...cats.map(c => ({ id:c.id, label:`${c.label} · ${badges.filter(b=>b.cat===c.id).length}` })),
        ].map(f => (
          <button key={f.id} onClick={()=>setFilter(f.id)} className={`btn ${filter===f.id?'btn--primary':''} btn--sm`}>{f.label}</button>
        ))}
      </div>

      {/* Badge grid */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12}}>
        {shown.map(b => (
          <div key={b.id} className="card" style={{padding:'22px 20px', position:'relative', opacity: b.earned?1:.65}}>
            <div style={{position:'absolute', top:10, right:10, fontSize:9, fontWeight:800, letterSpacing:'.08em', color: tierColor[b.tier], textTransform:'uppercase'}}>{tierLabel[b.tier]}</div>
            <div style={{fontSize:48, textAlign:'center', marginBottom:10, filter: b.earned?'none':'grayscale(100%)'}}>{b.earned ? b.icon : '🔒'}</div>
            <div style={{fontWeight:800, fontSize:14, textAlign:'center', marginBottom:4}}>{b.name}</div>
            <div style={{fontSize:11.5, color:'var(--ink-mute)', textAlign:'center', lineHeight:1.5, minHeight:32}}>{b.desc}</div>
            {b.earned ? (
              <div style={{marginTop:10, padding:'8px 10px', background:'var(--bg-alt)', borderRadius:4, fontSize:10, fontFamily:'var(--ff-mono)', display:'flex', justifyContent:'space-between', color:'var(--ink-dim)'}}>
                <span>✓ {b.date}</span>
                <span>상위 {b.rarity}%</span>
              </div>
            ) : (
              <div style={{marginTop:10}}>
                <div style={{height:6, background:'var(--bg-alt)', borderRadius:3, overflow:'hidden', marginBottom:4}}>
                  <div style={{width:`${b.progress/b.total*100}%`, height:'100%', background:tierColor[b.tier]}}/>
                </div>
                <div style={{fontSize:10, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)', textAlign:'center'}}>{b.progress} / {b.total}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

window.Achievements = Achievements;
