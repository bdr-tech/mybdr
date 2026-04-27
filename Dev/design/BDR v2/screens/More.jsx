/* global React */

function NotFound({ setRoute }) {
  return (
    <div className="page" style={{display:'grid', placeItems:'center', minHeight:'60vh', textAlign:'center'}}>
      <div>
        <div style={{fontFamily:'var(--ff-display)', fontSize:120, fontWeight:900, letterSpacing:'-0.04em', lineHeight:1, color:'var(--accent)'}}>404</div>
        <div style={{fontSize:22, fontWeight:800, marginTop:14}}>에어볼! 해당 페이지를 찾을 수 없습니다</div>
        <div style={{fontSize:14, color:'var(--ink-mute)', marginTop:8, maxWidth:420, margin:'8px auto 0'}}>
          주소가 잘못되었거나, 삭제된 콘텐츠일 수 있습니다. 홈으로 돌아가거나 검색을 이용해주세요.
        </div>
        <div style={{display:'flex', gap:10, justifyContent:'center', marginTop:20}}>
          <button className="btn btn--primary" onClick={()=>setRoute('home')}>홈으로</button>
          <button className="btn" onClick={()=>setRoute('search')}>검색</button>
          <button className="btn" onClick={()=>setRoute('help')}>도움말</button>
        </div>
      </div>
    </div>
  );
}

function About({ setRoute }) {
  const team = [
    { name:'김승철', role:'대표 / 기획', since:'2022' },
    { name:'이경진', role:'개발총괄', since:'2022' },
    { name:'박상우', role:'운영총괄', since:'2023' },
    { name:'최지혜', role:'디자인', since:'2023' },
    { name:'정혁수', role:'커뮤니티', since:'2024' },
    { name:'한수민', role:'파트너십', since:'2024' },
  ];

  return (
    <div className="page">
      <div style={{maxWidth:900, margin:'0 auto'}}>
        <div style={{textAlign:'center', padding:'40px 0 32px'}}>
          <div className="eyebrow" style={{justifyContent:'center'}}>소개 · ABOUT</div>
          <h1 style={{margin:'10px 0 14px', fontSize:42, fontWeight:900, letterSpacing:'-0.025em'}}>
            서울의 농구를 더 가깝게
          </h1>
          <p style={{fontSize:16, color:'var(--ink-soft)', maxWidth:540, margin:'0 auto', lineHeight:1.7}}>
            MyBDR은 다음카페 시절부터 20년을 이어온 서울 3x3 농구 커뮤니티입니다.
            흩어져 있던 픽업, 대회, 팀, 코트 정보를 한 곳에 모아 <strong style={{color:'var(--ink)'}}>누구나 쉽게 뛸 수 있는 환경</strong>을 만듭니다.
          </p>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:0, border:'1px solid var(--border)', borderRadius:8, overflow:'hidden', marginBottom:40}}>
          {[
            { v:'20년', k:'커뮤니티 역사' },
            { v:'48,000+', k:'가입 멤버' },
            { v:'320+', k:'등록 팀' },
            { v:'1,240회', k:'개최 대회' },
          ].map((s, i) => (
            <div key={s.k} style={{padding:'22px 14px', textAlign:'center', borderLeft: i > 0 ? '1px solid var(--border)' : 0, background:'var(--bg-alt)'}}>
              <div className="t-display" style={{fontSize:28, fontWeight:900, letterSpacing:'-0.02em'}}>{s.v}</div>
              <div style={{fontSize:12, color:'var(--ink-mute)', fontWeight:600, marginTop:4}}>{s.k}</div>
            </div>
          ))}
        </div>

        <div style={{marginBottom:40}}>
          <h2 style={{fontSize:22, fontWeight:800, marginBottom:14}}>우리가 만드는 것</h2>
          <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:14}}>
            {[
              { icon:'🏀', t:'공정한 매치', d:'레이팅 기반 팀 매칭으로 실력에 맞는 경기를 제공합니다' },
              { icon:'📊', t:'투명한 기록', d:'모든 경기 결과와 개인 스탯이 영구적으로 기록·공개됩니다' },
              { icon:'🌆', t:'지역 연결', d:'동네 코트부터 대회까지, 가까운 농구 활동을 빠르게 찾습니다' },
              { icon:'🤝', t:'열린 커뮤니티', d:'초보부터 선출까지, 누구나 편하게 뛸 수 있는 문화를 지향합니다' },
              { icon:'⚖️', t:'공정한 운영', d:'심판 자격·경기 규정·분쟁 처리 모두 공개된 기준을 따릅니다' },
              { icon:'💡', t:'지속가능성', d:'광고 없는 커뮤니티. 운영은 멤버십과 파트너십으로 충당합니다' },
            ].map(b => (
              <div key={b.t} className="card" style={{padding:'20px 20px'}}>
                <div style={{fontSize:28, marginBottom:8}}>{b.icon}</div>
                <div style={{fontWeight:800, fontSize:15, marginBottom:4}}>{b.t}</div>
                <div style={{fontSize:12, color:'var(--ink-mute)', lineHeight:1.6}}>{b.d}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{marginBottom:40}}>
          <h2 style={{fontSize:22, fontWeight:800, marginBottom:14}}>운영진</h2>
          <div style={{display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:10}}>
            {team.map(m => (
              <div key={m.name} className="card" style={{padding:'18px 12px', textAlign:'center'}}>
                <div style={{width:56, height:56, margin:'0 auto 8px', background:'var(--ink-soft)', color:'var(--bg)', borderRadius:'50%', display:'grid', placeItems:'center', fontWeight:700, fontSize:16}}>{m.name[0]}</div>
                <div style={{fontWeight:700, fontSize:13}}>{m.name}</div>
                <div style={{fontSize:11, color:'var(--accent)', fontWeight:600, marginTop:2}}>{m.role}</div>
                <div style={{fontSize:10, color:'var(--ink-dim)', marginTop:3, fontFamily:'var(--ff-mono)'}}>since {m.since}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{background:'var(--bg-alt)', borderRadius:8, padding:'30px 28px', marginBottom:40}}>
          <h2 style={{margin:'0 0 8px', fontSize:20, fontWeight:800}}>함께하는 파트너</h2>
          <div style={{fontSize:13, color:'var(--ink-mute)', marginBottom:16}}>MyBDR의 대회·활동을 지원하는 브랜드들</div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:10}}>
            {['NIKE','ADIDAS','MOLTEN','SPALDING','UNDER ARMOUR','BODY FRIEND','11번가','BDR STUDIO'].map(p => (
              <div key={p} style={{padding:'16px 12px', background:'var(--bg)', textAlign:'center', fontFamily:'var(--ff-mono)', fontSize:11, fontWeight:700, color:'var(--ink-soft)', borderRadius:4}}>{p}</div>
            ))}
          </div>
        </div>

        <div style={{textAlign:'center', padding:'20px 0 40px'}}>
          <h2 style={{fontSize:22, fontWeight:800, marginBottom:6}}>오늘, 농구할 수 있어요</h2>
          <div style={{fontSize:13, color:'var(--ink-mute)', marginBottom:16}}>가까운 코트에서 당신을 기다리는 사람들이 있습니다</div>
          <div style={{display:'flex', gap:10, justifyContent:'center'}}>
            <button className="btn btn--primary btn--xl" onClick={()=>setRoute('signup')}>지금 가입하기</button>
            <button className="btn btn--xl" onClick={()=>setRoute('games')}>경기 둘러보기</button>
          </div>
        </div>
      </div>
    </div>
  );
}

window.NotFound = NotFound;
window.About = About;
