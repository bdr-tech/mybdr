/* global React, TEAMS, TOURNAMENTS, Icon */

function Reviews({ setRoute }) {
  const [filter, setFilter] = React.useState('all');
  const [sort, setSort] = React.useState('recent');

  const reviews = [
    { id:'r1', type:'tournament', target:'BDR Challenge Spring 2026', targetSub:'4/11-12 · 장충체육관', author:'3POINT_슈', authorLevel:'L.5', rating:5, date:'2026.04.13', title:'운영 깔끔, 대진 공정했음', body:'접수부터 결승까지 딜레이 거의 없이 진행. 심판 판정도 일관성 있었고 중계 카메라 각도도 좋았음. 참가비 대비 만족도 최상.', likes:42, helpful:28, photos:3, verified:true, tags:['운영','심판','중계'] },
    { id:'r2', type:'court', target:'장충체육관 메인코트', targetSub:'서울 중구', author:'리딤캡틴', authorLevel:'L.8', rating:4, date:'2026.04.20', title:'바닥 컨디션 체크 필수', body:'조명 최고, 공기 순환도 나쁘지 않은데 바닥이 구간별로 미끄러워요. 아웃솔 닳은 신발은 피할 것. 주차 무료가 큰 장점.', likes:88, helpful:54, photos:5, verified:true, tags:['실내','주차무료'] },
    { id:'r3', type:'team', target:'REDEEM', targetSub:'게스트 경기', author:'pivot_mia', authorLevel:'L.5', rating:5, date:'2026.04.18', title:'게스트로 뛰었는데 대우 좋았음', body:'팀장이 픽업 시간 10분 일찍 도착해서 룰 브리핑 해주심. 게스트인데도 볼 터치 주려고 신경 써주는게 느껴짐. 다음에도 부르면 감.', likes:31, helpful:22, photos:0, verified:true, tags:['게스트','매너'] },
    { id:'r4', type:'tournament', target:'Winter Finals 2026', targetSub:'2/14-15', author:'분석가', authorLevel:'L.9', rating:3, date:'2026.02.17', title:'대진 2라운드 딜레이 아쉬움', body:'우승팀 발표까지 3시간 딜레이. 경기 수준은 최상급인데 운영 면에서 개선 여지. 식사 쿠폰은 좋았음.', likes:64, helpful:38, photos:1, verified:true, tags:['운영','딜레이'] },
    { id:'r5', type:'court', target:'용산국민체육센터', targetSub:'서울 용산구', author:'코트지킴이', authorLevel:'L.7', rating:5, date:'2026.04.18', title:'4월 리노베이션 후 최고', body:'바닥 교체 · 조명 LED · 탈의실 리뉴얼 완료. 샤워실에 온수 빵빵. 주차 2시간 무료.', likes:124, helpful:81, photos:8, verified:true, tags:['리뉴얼','샤워실'] },
    { id:'r6', type:'referee', target:'ref_kimj (L.2)', targetSub:'BDR Challenge 예선', author:'IRON_coach', authorLevel:'L.6', rating:5, date:'2026.04.12', title:'판정 일관성 최상', body:'몸싸움 콜 기준 명확, 양 팀 모두 납득할 만한 운영. 경기 중 소통도 좋음.', likes:22, helpful:17, photos:0, verified:true, tags:['심판','판정'] },
    { id:'r7', type:'team', target:'SWEEP', targetSub:'스크림 진행', author:'dawn_r', authorLevel:'L.3', rating:2, date:'2026.04.09', title:'약속 시간 안 지킴', body:'14시 스크림인데 멤버 절반이 14:30에 도착. 양해 멘트도 없었음. 실력은 있는데 매너가...', likes:15, helpful:31, photos:0, verified:false, tags:['시간엄수'] },
    { id:'r8', type:'tournament', target:'Friday Night Hoops April', targetSub:'4/5 · 용산', author:'wed_hooper', authorLevel:'L.2', rating:5, date:'2026.04.06', title:'초보자 배려 최고', body:'AMATEUR 대회답게 입문자도 즐길 수 있게 룰 조정해줬음. 심판도 친절. 다음 시즌도 참가 예정.', likes:47, helpful:29, photos:2, verified:true, tags:['초보환영','친절'] },
  ];

  const summary = {
    total: reviews.length,
    avg: (reviews.reduce((a,r)=>a+r.rating,0)/reviews.length).toFixed(1),
    dist: [5,4,3,2,1].map(n => reviews.filter(r=>r.rating===n).length),
  };

  const filtered = reviews.filter(r => filter==='all' || r.type===filter);
  const sorted = [...filtered].sort((a,b) => {
    if (sort==='rating') return b.rating - a.rating;
    if (sort==='helpful') return b.helpful - a.helpful;
    return b.date.localeCompare(a.date);
  });

  const typeLabel = { tournament:'대회', court:'코트', team:'팀', referee:'심판' };
  const typeColor = { tournament:'var(--accent)', court:'var(--cafe-blue)', team:'var(--ok)', referee:'#8B5CF6' };

  return (
    <div className="page">
      <div style={{display:'flex', gap:6, fontSize:12, color:'var(--ink-mute)', marginBottom:12}}>
        <a onClick={()=>setRoute('home')} style={{cursor:'pointer'}}>홈</a><span>›</span>
        <span style={{color:'var(--ink)'}}>리뷰</span>
      </div>

      {/* Header */}
      <div style={{display:'grid', gridTemplateColumns:'minmax(0,1fr) 360px', gap:16, marginBottom:18}}>
        <div>
          <div className="eyebrow">커뮤니티 리뷰 · REVIEWS</div>
          <h1 style={{margin:'4px 0 8px', fontSize:32, fontWeight:800, letterSpacing:'-0.02em'}}>다녀온 사람들의 진짜 후기</h1>
          <p style={{margin:0, color:'var(--ink-mute)', fontSize:14, maxWidth:560, lineHeight:1.6}}>
            실제 참가·방문 인증된 리뷰만 모았습니다. 별점·사진·해시태그로 빠르게 훑어보고, 도움된 리뷰에 투표하세요.
          </p>
        </div>
        <div className="card" style={{padding:'18px 20px'}}>
          <div style={{display:'flex', alignItems:'baseline', gap:10, marginBottom:10}}>
            <div style={{fontFamily:'var(--ff-display)', fontSize:44, fontWeight:900, letterSpacing:'-0.03em'}}>{summary.avg}</div>
            <div>
              <div style={{color:'var(--accent)', fontSize:16}}>{'★'.repeat(Math.round(summary.avg))}<span style={{color:'var(--border)'}}>{'★'.repeat(5-Math.round(summary.avg))}</span></div>
              <div style={{fontSize:11, color:'var(--ink-mute)', fontFamily:'var(--ff-mono)'}}>{summary.total}개 리뷰 · 인증 {reviews.filter(r=>r.verified).length}</div>
            </div>
          </div>
          {[5,4,3,2,1].map((n,i) => (
            <div key={n} style={{display:'grid', gridTemplateColumns:'20px 1fr 32px', gap:8, alignItems:'center', fontSize:11, marginBottom:3}}>
              <span style={{fontFamily:'var(--ff-mono)', color:'var(--ink-dim)'}}>{n}★</span>
              <div style={{height:6, background:'var(--bg-alt)', borderRadius:3, overflow:'hidden'}}>
                <div style={{width:`${(summary.dist[i]/summary.total)*100}%`, height:'100%', background: n>=4?'var(--ok)':n>=3?'var(--accent)':'var(--err)'}}/>
              </div>
              <span style={{fontFamily:'var(--ff-mono)', color:'var(--ink-dim)', textAlign:'right'}}>{summary.dist[i]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="card" style={{padding:'12px 14px', marginBottom:14, display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, flexWrap:'wrap'}}>
        <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
          {[
            { id:'all', label:'전체' },
            { id:'tournament', label:'대회' },
            { id:'court', label:'코트' },
            { id:'team', label:'팀' },
            { id:'referee', label:'심판' },
          ].map(f => (
            <button key={f.id} onClick={()=>setFilter(f.id)} className={`btn ${filter===f.id?'btn--primary':''} btn--sm`}>
              {f.label}
              {f.id!=='all' && <span style={{marginLeft:4, opacity:.7, fontFamily:'var(--ff-mono)'}}>{reviews.filter(r=>r.type===f.id).length}</span>}
            </button>
          ))}
        </div>
        <div style={{display:'flex', gap:6, alignItems:'center', fontSize:12}}>
          <span style={{color:'var(--ink-mute)'}}>정렬</span>
          <select className="input" style={{padding:'4px 8px', fontSize:12}} value={sort} onChange={e=>setSort(e.target.value)}>
            <option value="recent">최신순</option>
            <option value="rating">별점순</option>
            <option value="helpful">도움순</option>
          </select>
          <button className="btn btn--accent btn--sm" style={{marginLeft:8}}>+ 리뷰 쓰기</button>
        </div>
      </div>

      {/* List */}
      <div style={{display:'flex', flexDirection:'column', gap:10}}>
        {sorted.map(r => (
          <div key={r.id} className="card" style={{padding:'18px 22px', display:'grid', gridTemplateColumns:'180px 1fr auto', gap:18}}>
            <div>
              <span style={{display:'inline-block', background:typeColor[r.type], color:'#fff', fontSize:10, fontWeight:800, letterSpacing:'.06em', padding:'3px 8px', borderRadius:3, textTransform:'uppercase'}}>{typeLabel[r.type]}</span>
              <div style={{fontWeight:700, fontSize:14, marginTop:6}}>{r.target}</div>
              <div style={{fontSize:11, color:'var(--ink-mute)', fontFamily:'var(--ff-mono)'}}>{r.targetSub}</div>
            </div>
            <div style={{minWidth:0}}>
              <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:5}}>
                <span style={{color:'var(--accent)', fontSize:14}}>{'★'.repeat(r.rating)}<span style={{color:'var(--border)'}}>{'★'.repeat(5-r.rating)}</span></span>
                <b style={{fontSize:15}}>{r.title}</b>
                {r.verified && <span className="badge badge--ok" style={{fontSize:9}}>✓ 인증</span>}
              </div>
              <p style={{margin:'0 0 8px', fontSize:13.5, color:'var(--ink-soft)', lineHeight:1.6}}>{r.body}</p>
              <div style={{display:'flex', gap:8, flexWrap:'wrap', alignItems:'center'}}>
                {r.tags.map(t => <span key={t} className="badge badge--ghost" style={{fontSize:10}}>#{t}</span>)}
                {r.photos > 0 && <span style={{fontSize:11, color:'var(--ink-dim)'}}>📷 사진 {r.photos}장</span>}
              </div>
              <div style={{fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)', marginTop:8}}>
                <b style={{color:'var(--ink-soft)', fontFamily:'inherit'}}>{r.author}</b> <span className="badge badge--soft" style={{fontSize:9, marginLeft:2}}>{r.authorLevel}</span> · {r.date}
              </div>
            </div>
            <div style={{textAlign:'right', display:'flex', flexDirection:'column', gap:6, alignItems:'flex-end'}}>
              <button className="btn btn--sm" style={{fontSize:11, padding:'4px 10px'}}>👍 도움됨 {r.helpful}</button>
              <button className="btn btn--sm" style={{fontSize:11, padding:'4px 10px', background:'transparent', border:0, color:'var(--ink-dim)'}}>🚩 신고</button>
              <div style={{fontSize:11, color:'var(--ink-dim)'}}>♥ {r.likes}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

window.Reviews = Reviews;
