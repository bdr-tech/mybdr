/* global React */

function CreateGame({ setRoute }) {
  const [kind, setKind] = React.useState('pickup');
  const kinds = [
    { id:'pickup', label:'픽업', desc:'개인 단위 즉석 경기' },
    { id:'guest', label:'게스트', desc:'우리 팀에 일회성 게스트 모집' },
    { id:'scrimmage', label:'스크림', desc:'팀 vs 팀 연습경기' },
  ];

  return (
    <div className="page">
      <div style={{maxWidth:760, margin:'0 auto'}}>
        <div style={{display:'flex', gap:6, fontSize:12, color:'var(--ink-mute)', marginBottom:12}}>
          <a onClick={()=>setRoute('games')} style={{cursor:'pointer'}}>경기</a>
          <span>›</span>
          <span style={{color:'var(--ink)'}}>경기 개설</span>
        </div>

        <div style={{marginBottom:20}}>
          <div className="eyebrow">새 경기 · NEW GAME</div>
          <h1 style={{margin:'6px 0 4px', fontSize:30, fontWeight:800, letterSpacing:'-0.015em'}}>경기 개설</h1>
          <div style={{fontSize:13, color:'var(--ink-mute)'}}>픽업·게스트·스크림 중 하나를 열고 참가자를 모집하세요</div>
        </div>

        <div className="card" style={{padding:'24px 26px', marginBottom:14}}>
          <h2 style={{margin:'0 0 14px', fontSize:16, fontWeight:700}}>1. 경기 종류</h2>
          <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10}}>
            {kinds.map(k => (
              <button key={k.id} onClick={()=>setKind(k.id)} style={{
                padding:'16px 14px', textAlign:'left', cursor:'pointer',
                background: kind === k.id ? 'color-mix(in oklab, var(--cafe-blue) 8%, transparent)' : 'var(--bg-alt)',
                border: kind === k.id ? '2px solid var(--cafe-blue)' : '2px solid var(--border)',
                borderRadius:8,
              }}>
                <div style={{fontWeight:800, fontSize:15, marginBottom:4}}>{k.label}</div>
                <div style={{fontSize:11, color:'var(--ink-mute)'}}>{k.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="card" style={{padding:'24px 26px', marginBottom:14}}>
          <h2 style={{margin:'0 0 14px', fontSize:16, fontWeight:700}}>2. 경기 정보</h2>
          <div style={{display:'grid', gridTemplateColumns:'1fr', gap:14}}>
            <div>
              <label style={{fontSize:12, fontWeight:700, color:'var(--ink-mute)'}}>제목</label>
              <input className="input" style={{marginTop:6}} defaultValue={kind === 'pickup' ? '목요일 저녁 미사 픽업 · 6:4' : kind === 'guest' ? 'REDEEM 주말 게스트 모집' : 'REDEEM vs 3POINT 스크림'}/>
            </div>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginTop:14}}>
            <div>
              <label style={{fontSize:12, fontWeight:700, color:'var(--ink-mute)'}}>날짜</label>
              <input className="input" style={{marginTop:6}} type="date" defaultValue="2026-05-02"/>
            </div>
            <div>
              <label style={{fontSize:12, fontWeight:700, color:'var(--ink-mute)'}}>시간</label>
              <input className="input" style={{marginTop:6}} defaultValue="20:30 – 22:30"/>
            </div>
            <div>
              <label style={{fontSize:12, fontWeight:700, color:'var(--ink-mute)'}}>코트</label>
              <input className="input" style={{marginTop:6}} defaultValue="미사강변체육관"/>
            </div>
            <div>
              <label style={{fontSize:12, fontWeight:700, color:'var(--ink-mute)'}}>지역</label>
              <input className="input" style={{marginTop:6}} defaultValue="하남시"/>
            </div>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14, marginTop:14}}>
            <div>
              <label style={{fontSize:12, fontWeight:700, color:'var(--ink-mute)'}}>수준</label>
              <select className="input" style={{marginTop:6, appearance:'auto'}}>
                <option>초-중급</option>
                <option>중급</option>
                <option selected>중급+</option>
                <option>상급</option>
                <option>전연령</option>
              </select>
            </div>
            <div>
              <label style={{fontSize:12, fontWeight:700, color:'var(--ink-mute)'}}>정원</label>
              <input className="input" style={{marginTop:6}} defaultValue="10"/>
            </div>
            <div>
              <label style={{fontSize:12, fontWeight:700, color:'var(--ink-mute)'}}>참가비</label>
              <input className="input" style={{marginTop:6}} defaultValue="₩5,000"/>
            </div>
          </div>
          <div style={{marginTop:14}}>
            <label style={{fontSize:12, fontWeight:700, color:'var(--ink-mute)'}}>상세 설명</label>
            <textarea className="input" rows={5} style={{marginTop:6, resize:'vertical'}} defaultValue="매주 목요일 정기 픽업입니다. 6:4 팀 분배, 21점 선취제. 주차장 무료 이용 가능, 실내 탈의실·샤워실 완비."/>
          </div>
        </div>

        <div className="card" style={{padding:'24px 26px', marginBottom:14}}>
          <h2 style={{margin:'0 0 14px', fontSize:16, fontWeight:700}}>3. 신청 조건</h2>
          <div style={{display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:10}}>
            {['초보 환영','레이팅 1400 이상','여성 우대','학생 우대','자차 가능자','프로필 공개 필수'].map((t, i) => (
              <label key={t} style={{display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:'var(--bg-alt)', borderRadius:6, cursor:'pointer'}}>
                <input type="checkbox" defaultChecked={i === 0}/>
                <span style={{fontSize:13, fontWeight:600}}>{t}</span>
              </label>
            ))}
          </div>
        </div>

        <div style={{display:'flex', gap:10, justifyContent:'flex-end', marginBottom:40}}>
          <button className="btn" onClick={()=>setRoute('games')}>취소</button>
          <button className="btn btn--sm">임시저장</button>
          <button className="btn btn--primary" onClick={()=>setRoute('gameDetail')}>경기 개설 →</button>
        </div>
      </div>
    </div>
  );
}

window.CreateGame = CreateGame;
