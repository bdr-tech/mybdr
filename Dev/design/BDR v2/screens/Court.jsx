/* global React, Icon */

const COURTS = [
  { id: 'jangchung', name: '장충체육관', area: '중구', type: '실내', courts: 2, fee: '무료', hours: '09–22', hot: true, today: 18, status: 'busy',  floor: '우레탄', light: '상', tag: '픽업 다수' },
  { id: 'olympic',   name: '올림픽체조경기장 보조', area: '송파구', type: '실내', courts: 1, fee: '유료', hours: '10–20', hot: false, today: 6,  status: 'ok',    floor: '마룻바닥', light: '최상', tag: '대회장' },
  { id: 'yongsan',   name: '용산국민체육센터', area: '용산구', type: '실내', courts: 2, fee: '유료', hours: '06–22', hot: true, today: 14, status: 'ok',   floor: '우레탄', light: '상', tag: '샤워실 있음' },
  { id: 'yangjae',   name: '양재체육관', area: '서초구', type: '실내', courts: 1, fee: '유료', hours: '09–21', hot: false, today: 4,  status: 'quiet', floor: '마룻바닥', light: '중', tag: '대회 예정' },
  { id: 'hanriver',  name: '뚝섬유원지 농구장', area: '광진구', type: '실외', courts: 3, fee: '무료', hours: '상시', hot: true, today: 22, status: 'busy', floor: '아스팔트', light: '야간X', tag: '강변 뷰' },
  { id: 'jamsil',    name: '잠실학생체육관', area: '송파구', type: '실내', courts: 2, fee: '유료', hours: '09–21', hot: false, today: 8, status: 'ok',   floor: '마룻바닥', light: '최상', tag: '대회장' },
  { id: 'sungsu',    name: '성수동 간이 농구장', area: '성동구', type: '실외', courts: 1, fee: '무료', hours: '상시', hot: false, today: 5, status: 'quiet', floor: '우레탄', light: '야간O', tag: '소규모' },
  { id: 'gangnam',   name: '강남구민체육센터', area: '강남구', type: '실내', courts: 1, fee: '유료', hours: '06–22', hot: false, today: 9, status: 'ok',   floor: '우레탄', light: '상', tag: '개인 락커' },
];

function statusBadge(s) {
  if (s === 'busy')  return { label: '혼잡', cls: 'badge--red' };
  if (s === 'quiet') return { label: '한산', cls: 'badge--soft' };
  return { label: '보통', cls: 'badge--ok' };
}

function CourtList({ setRoute }) {
  const [filter, setFilter] = React.useState('전체');
  const filters = ['전체', '실내', '실외', '무료', '지금 한산'];
  const shown = COURTS.filter(c => {
    if (filter === '전체') return true;
    if (filter === '실내') return c.type === '실내';
    if (filter === '실외') return c.type === '실외';
    if (filter === '무료') return c.fee === '무료';
    if (filter === '지금 한산') return c.status !== 'busy';
    return true;
  });

  return (
    <div className="page">
      <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:16, gap:16, flexWrap:'wrap'}}>
        <div>
          <div className="eyebrow">코트 · COURTS</div>
          <h1 style={{margin:'6px 0 4px', fontSize:28, fontWeight:800, letterSpacing:'-0.015em'}}>서울 코트 {COURTS.length}곳</h1>
          <div style={{fontSize:13, color:'var(--ink-mute)'}}>오늘 방문자 기반 혼잡도 · 10분마다 갱신</div>
        </div>
        <button className="btn">지도에서 보기</button>
      </div>

      {/* Filter chips */}
      <div style={{display:'flex', gap:8, marginBottom:16, flexWrap:'wrap'}}>
        {filters.map(f => (
          <button
            key={f}
            className="btn btn--sm"
            onClick={() => setFilter(f)}
            style={filter === f ? {background:'var(--cafe-blue)', color:'#fff', borderColor:'var(--cafe-blue-deep)'} : {}}
          >{f}</button>
        ))}
      </div>

      {/* Map placeholder + list, side by side */}
      <div style={{display:'grid', gridTemplateColumns:'minmax(0,1fr) 340px', gap:20, alignItems:'flex-start'}}>
        <div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:12}}>
            {shown.map(c => {
              const s = statusBadge(c.status);
              return (
                <div key={c.id} className="card" style={{padding:'14px 16px', cursor:'pointer', display:'flex', flexDirection:'column', gap:8}} onClick={()=>setRoute('courtDetail')}>
                  <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:8}}>
                    <span style={{fontFamily:'var(--ff-mono)', fontSize:11, color:'var(--ink-dim)', whiteSpace:'nowrap'}}>{c.area}</span>
                    <div style={{display:'flex', gap:4, flexShrink:0}}>
                      {c.hot && <span className="badge badge--red">HOT</span>}
                      <span className={`badge ${s.cls}`}>{s.label}</span>
                    </div>
                  </div>
                  <div style={{fontWeight:700, fontSize:16, letterSpacing:'-0.01em'}}>{c.name}</div>
                  <div style={{fontSize:12, color:'var(--ink-mute)', lineHeight:1.5}}>
                    {c.type} · {c.courts}코트 · {c.fee} · {c.hours}
                  </div>
                  <div style={{fontSize:11, color:'var(--ink-dim)', lineHeight:1.5}}>
                    바닥 {c.floor} · 조명 {c.light}
                  </div>
                  <div style={{display:'flex', alignItems:'center', gap:8, marginTop:'auto', paddingTop:6, borderTop:'1px dashed var(--border)'}}>
                    <div style={{flex:1, fontSize:11, color:'var(--ink-dim)'}}>오늘 방문 <b style={{color:'var(--ink)', fontFamily:'var(--ff-mono)'}}>{c.today}</b></div>
                    <button className="btn btn--sm">상세</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sticky map placeholder */}
        <aside style={{position:'sticky', top:120}}>
          <div className="card" style={{padding:0, overflow:'hidden'}}>
            <div style={{
              height: 260,
              background:
                'repeating-linear-gradient(45deg, var(--bg-alt) 0 10px, var(--bg-elev) 10px 20px)',
              position:'relative',
              borderBottom:'1px solid var(--border)',
            }}>
              {/* Fake pins */}
              {[[20,30],[45,55],[70,25],[58,75],[30,70],[82,60]].map(([x,y],i)=>(
                <div key={i} style={{position:'absolute', left:`${x}%`, top:`${y}%`, width:14, height:14, background:'var(--accent)', border:'2px solid #fff', borderRadius:'50% 50% 50% 0', transform:'rotate(-45deg)', boxShadow:'0 2px 6px rgba(0,0,0,.25)'}}/>
              ))}
              <div style={{position:'absolute', bottom:10, left:10, fontFamily:'var(--ff-mono)', fontSize:10, color:'var(--ink-dim)', background:'var(--bg-elev)', padding:'3px 7px', borderRadius:3}}>MAP · placeholder</div>
            </div>
            <div style={{padding:'14px 16px'}}>
              <div style={{fontWeight:700, fontSize:14}}>내 주변 코트</div>
              <div style={{fontSize:12, color:'var(--ink-mute)', marginTop:2}}>위치 권한을 허용하면 가까운 순으로 정렬됩니다.</div>
              <button className="btn btn--sm btn--primary" style={{marginTop:12}}>위치 허용</button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

window.CourtList = CourtList;
