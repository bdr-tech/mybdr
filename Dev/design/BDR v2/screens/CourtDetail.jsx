/* global React, Icon */

const COURT_DETAIL = {
  id: 'jangchung',
  name: '장충체육관',
  area: '서울 중구',
  address: '서울특별시 중구 동호로 241',
  type: '실내',
  courts: 2,
  fee: '무료 (예약 필요)',
  hours: '09:00 – 22:00',
  floor: '우레탄',
  light: '상',
  parking: '유료 주차 120대',
  shower: '있음',
  locker: '유료 락커',
  phone: '02-2128-2800',
  desc: '서울 중심부의 대표 실내 농구장. 2면 풀코트와 관중석을 갖추고 있어 대회장으로 자주 활용됩니다. 픽업·정기모임이 활발합니다.',
  tags: ['대회장', '픽업 다수', '관중석'],
};

const TIME_SLOTS = [
  { time: '09:00', busy: 2, total: 20 },
  { time: '10:00', busy: 5, total: 20 },
  { time: '11:00', busy: 8, total: 20 },
  { time: '12:00', busy: 14, total: 20 },
  { time: '13:00', busy: 18, total: 20 },
  { time: '14:00', busy: 16, total: 20 },
  { time: '15:00', busy: 11, total: 20 },
  { time: '16:00', busy: 9, total: 20 },
  { time: '17:00', busy: 12, total: 20 },
  { time: '18:00', busy: 17, total: 20 },
  { time: '19:00', busy: 20, total: 20 },
  { time: '20:00', busy: 19, total: 20 },
  { time: '21:00', busy: 13, total: 20 },
];

const UPCOMING_HERE = [
  { kind: '픽업', title: '금요일 저녁 픽업 · 중급', date: '2026.04.25 19:00', spots: '6/10' },
  { kind: '대회', title: 'BDR CHALLENGE SPRING', date: '2026.04.11 09:00', spots: '12/16팀' },
  { kind: '게스트', title: '리딤 정기훈련 게스트 2명', date: '2026.04.27 14:00', spots: '1/2' },
];

function CourtDetail({ setRoute }) {
  const c = COURT_DETAIL;
  return (
    <div className="page page--wide">
      <div style={{display:'flex', alignItems:'center', gap:6, fontSize:12, color:'var(--ink-mute)', marginBottom:14, flexWrap:'wrap'}}>
        <a onClick={()=>setRoute('home')} style={{cursor:'pointer'}}>홈</a>
        <span>›</span>
        <a onClick={()=>setRoute('court')} style={{cursor:'pointer'}}>코트</a>
        <span>›</span>
        <span style={{color:'var(--ink)'}}>{c.name}</span>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'minmax(0,1fr) 340px', gap:24, alignItems:'flex-start'}}>
        <div>
          {/* Header */}
          <div className="card" style={{padding:0, overflow:'hidden', marginBottom:20}}>
            <div style={{height:220, background:'repeating-linear-gradient(45deg, var(--bg-alt) 0 14px, var(--bg-elev) 14px 28px)', position:'relative', borderBottom:'1px solid var(--border)'}}>
              <div style={{position:'absolute', inset:0, display:'grid', placeItems:'center', fontFamily:'var(--ff-mono)', fontSize:12, color:'var(--ink-dim)'}}>COURT PHOTO · placeholder</div>
              <div style={{position:'absolute', left:16, top:16, display:'flex', gap:6}}>
                {c.tags.map(t => <span key={t} className="badge badge--soft">{t}</span>)}
              </div>
            </div>
            <div style={{padding:'22px 24px'}}>
              <div style={{fontSize:12, color:'var(--ink-dim)', letterSpacing:'.08em', textTransform:'uppercase', fontWeight:700, marginBottom:6}}>{c.area}</div>
              <h1 style={{margin:'0 0 8px', fontSize:30, fontWeight:800, letterSpacing:'-0.02em'}}>{c.name}</h1>
              <div style={{fontSize:13, color:'var(--ink-mute)', marginBottom:14}}>{c.address}</div>
              <p style={{margin:0, color:'var(--ink-soft)', lineHeight:1.7}}>{c.desc}</p>
            </div>
          </div>

          {/* Busy by hour */}
          <div className="card" style={{padding:'20px 22px', marginBottom:20}}>
            <h2 style={{margin:'0 0 14px', fontSize:18, fontWeight:700}}>오늘의 혼잡도</h2>
            <div style={{display:'grid', gridTemplateColumns:`repeat(${TIME_SLOTS.length}, 1fr)`, gap:4, alignItems:'end', height:120}}>
              {TIME_SLOTS.map(s => {
                const pct = s.busy / s.total;
                const bg = pct > 0.8 ? 'var(--accent)' : pct > 0.5 ? 'var(--warn)' : 'var(--ok)';
                return (
                  <div key={s.time} style={{display:'flex', flexDirection:'column', alignItems:'center', gap:4}}>
                    <div style={{width:'100%', height: `${pct*100}%`, background:bg, minHeight:3, borderRadius:2}}/>
                    <div style={{fontSize:10, fontFamily:'var(--ff-mono)', color:'var(--ink-dim)'}}>{s.time.slice(0,2)}</div>
                  </div>
                );
              })}
            </div>
            <div style={{display:'flex', gap:14, marginTop:12, fontSize:11, color:'var(--ink-mute)'}}>
              <div style={{display:'flex', gap:4, alignItems:'center'}}><span style={{width:10, height:10, background:'var(--ok)', borderRadius:2}}/>한산</div>
              <div style={{display:'flex', gap:4, alignItems:'center'}}><span style={{width:10, height:10, background:'var(--warn)', borderRadius:2}}/>보통</div>
              <div style={{display:'flex', gap:4, alignItems:'center'}}><span style={{width:10, height:10, background:'var(--accent)', borderRadius:2}}/>혼잡</div>
            </div>
          </div>

          {/* Upcoming here */}
          <div className="card" style={{padding:0}}>
            <div style={{padding:'16px 22px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
              <h2 style={{margin:0, fontSize:17, fontWeight:700}}>이 코트의 일정</h2>
              <a style={{fontSize:12}}>더보기 ›</a>
            </div>
            {UPCOMING_HERE.map((u, i) => (
              <div key={i} style={{padding:'14px 22px', borderBottom: i < UPCOMING_HERE.length-1 ? '1px solid var(--border)' : 0, display:'grid', gridTemplateColumns:'72px 1fr auto', gap:14, alignItems:'center'}}>
                <span className="badge badge--soft">{u.kind}</span>
                <div>
                  <div style={{fontWeight:600}}>{u.title}</div>
                  <div style={{fontSize:12, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)', marginTop:2}}>{u.date}</div>
                </div>
                <div style={{fontFamily:'var(--ff-mono)', fontWeight:700, fontSize:13}}>{u.spots}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Side */}
        <aside style={{position:'sticky', top:120}}>
          {/* Map */}
          <div className="card" style={{padding:0, overflow:'hidden', marginBottom:14}}>
            <div style={{height:180, background:'repeating-linear-gradient(45deg, var(--bg-alt) 0 10px, var(--bg-elev) 10px 20px)', position:'relative'}}>
              <div style={{position:'absolute', left:'50%', top:'50%', width:18, height:18, background:'var(--accent)', border:'3px solid #fff', borderRadius:'50% 50% 50% 0', transform:'translate(-50%,-100%) rotate(-45deg)', boxShadow:'0 2px 8px rgba(0,0,0,.3)'}}/>
              <div style={{position:'absolute', bottom:8, left:8, fontFamily:'var(--ff-mono)', fontSize:10, color:'var(--ink-dim)', background:'var(--bg-elev)', padding:'3px 7px', borderRadius:3}}>MAP · placeholder</div>
            </div>
            <div style={{padding:'14px 18px'}}>
              <button className="btn btn--sm" style={{width:'100%', marginBottom:6}}>길찾기</button>
              <button className="btn btn--sm" style={{width:'100%'}}>지도에서 열기</button>
            </div>
          </div>

          {/* Info */}
          <div className="card" style={{padding:'18px 20px', marginBottom:14}}>
            <div style={{fontSize:11, fontWeight:800, letterSpacing:'.1em', color:'var(--ink-dim)', textTransform:'uppercase', marginBottom:12}}>시설 정보</div>
            <div style={{display:'grid', gridTemplateColumns:'80px 1fr', rowGap:9, fontSize:13}}>
              <div style={{color:'var(--ink-dim)'}}>유형</div><div>{c.type} · {c.courts}코트</div>
              <div style={{color:'var(--ink-dim)'}}>이용료</div><div>{c.fee}</div>
              <div style={{color:'var(--ink-dim)'}}>운영시간</div><div>{c.hours}</div>
              <div style={{color:'var(--ink-dim)'}}>바닥</div><div>{c.floor}</div>
              <div style={{color:'var(--ink-dim)'}}>조명</div><div>{c.light}</div>
              <div style={{color:'var(--ink-dim)'}}>주차</div><div>{c.parking}</div>
              <div style={{color:'var(--ink-dim)'}}>샤워실</div><div>{c.shower}</div>
              <div style={{color:'var(--ink-dim)'}}>락커</div><div>{c.locker}</div>
              <div style={{color:'var(--ink-dim)'}}>연락처</div><div style={{fontFamily:'var(--ff-mono)'}}>{c.phone}</div>
            </div>
          </div>

          <button className="btn btn--primary btn--xl">이곳에서 모집 글쓰기</button>
        </aside>
      </div>
    </div>
  );
}

window.CourtDetail = CourtDetail;
