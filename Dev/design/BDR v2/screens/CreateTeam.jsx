/* global React */

function CreateTeam({ setRoute }) {
  const [color, setColor] = React.useState('#E31B23');
  const colors = ['#E31B23','#0F5FCC','#10B981','#F59E0B','#8B5CF6','#EC4899','#14B8A6','#0B0D10'];
  const [tag, setTag] = React.useState('NEW');
  const [name, setName] = React.useState('팀 이름');

  return (
    <div className="page">
      <div style={{maxWidth:760, margin:'0 auto'}}>
        <div style={{display:'flex', gap:6, fontSize:12, color:'var(--ink-mute)', marginBottom:12}}>
          <a onClick={()=>setRoute('team')} style={{cursor:'pointer'}}>팀</a>
          <span>›</span>
          <span style={{color:'var(--ink)'}}>팀 만들기</span>
        </div>

        <div style={{marginBottom:20}}>
          <div className="eyebrow">새 팀 · CREATE TEAM</div>
          <h1 style={{margin:'6px 0 4px', fontSize:30, fontWeight:800, letterSpacing:'-0.015em'}}>팀 만들기</h1>
          <div style={{fontSize:13, color:'var(--ink-mute)'}}>최소 3명의 팀원이 있어야 활동을 시작할 수 있습니다</div>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'1fr 300px', gap:24, alignItems:'flex-start'}}>
          <div>
            <div className="card" style={{padding:'24px 26px', marginBottom:14}}>
              <h2 style={{margin:'0 0 16px', fontSize:16, fontWeight:700}}>기본 정보</h2>
              <div style={{display:'grid', gridTemplateColumns:'1fr 140px', gap:14}}>
                <div>
                  <label style={{fontSize:12, fontWeight:700, color:'var(--ink-mute)'}}>팀 이름</label>
                  <input className="input" style={{marginTop:6}} value={name} onChange={e=>setName(e.target.value)} placeholder="예: 리딤 (REDEEM)"/>
                </div>
                <div>
                  <label style={{fontSize:12, fontWeight:700, color:'var(--ink-mute)'}}>팀 태그 (3~4자)</label>
                  <input className="input" style={{marginTop:6, fontFamily:'var(--ff-mono)', fontWeight:700, textAlign:'center'}} value={tag} onChange={e=>setTag(e.target.value.toUpperCase().slice(0,4))} maxLength={4}/>
                </div>
              </div>
              <div style={{marginTop:14}}>
                <label style={{fontSize:12, fontWeight:700, color:'var(--ink-mute)'}}>팀 색상</label>
                <div style={{display:'flex', gap:8, marginTop:8}}>
                  {colors.map(c => (
                    <button key={c} onClick={()=>setColor(c)} style={{width:36, height:36, background:c, border: color === c ? '3px solid var(--ink)' : '2px solid var(--border)', borderRadius:6, cursor:'pointer'}}/>
                  ))}
                </div>
              </div>
              <div style={{marginTop:14}}>
                <label style={{fontSize:12, fontWeight:700, color:'var(--ink-mute)'}}>소개</label>
                <textarea className="input" style={{marginTop:6, resize:'vertical'}} rows={3} defaultValue="강남·서초 기반 주말 정기팀. 성실하게 뛰는 분들과 오래 함께하고 싶습니다."/>
              </div>
            </div>

            <div className="card" style={{padding:'24px 26px', marginBottom:14}}>
              <h2 style={{margin:'0 0 16px', fontSize:16, fontWeight:700}}>활동 정보</h2>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14}}>
                <div>
                  <label style={{fontSize:12, fontWeight:700, color:'var(--ink-mute)'}}>주 활동 지역</label>
                  <input className="input" style={{marginTop:6}} defaultValue="서울 강남·송파"/>
                </div>
                <div>
                  <label style={{fontSize:12, fontWeight:700, color:'var(--ink-mute)'}}>정기 코트</label>
                  <input className="input" style={{marginTop:6}} defaultValue="장충체육관"/>
                </div>
                <div>
                  <label style={{fontSize:12, fontWeight:700, color:'var(--ink-mute)'}}>정기 요일·시간</label>
                  <input className="input" style={{marginTop:6}} defaultValue="토요일 10:00 – 13:00"/>
                </div>
                <div>
                  <label style={{fontSize:12, fontWeight:700, color:'var(--ink-mute)'}}>수준</label>
                  <input className="input" style={{marginTop:6}} defaultValue="중상급"/>
                </div>
              </div>
            </div>

            <div className="card" style={{padding:'24px 26px'}}>
              <h2 style={{margin:'0 0 16px', fontSize:16, fontWeight:700}}>초기 팀원 초대</h2>
              <div style={{display:'flex', flexDirection:'column', gap:10}}>
                {[1,2,3].map(i => (
                  <div key={i} style={{display:'grid', gridTemplateColumns:'1fr 120px 36px', gap:8}}>
                    <input className="input" placeholder={`팀원 ${i} 이메일 또는 닉네임`}/>
                    <select className="input" style={{appearance:'auto'}}>
                      <option>팀원</option>
                      <option>부팀장</option>
                    </select>
                    <button className="btn btn--sm" style={{padding:0}}>×</button>
                  </div>
                ))}
                <button className="btn btn--sm" style={{alignSelf:'flex-start'}}>+ 팀원 추가</button>
              </div>
            </div>
          </div>

          <aside style={{position:'sticky', top:120}}>
            <div className="card" style={{padding:'22px 22px'}}>
              <div style={{fontSize:11, color:'var(--ink-dim)', fontWeight:700, letterSpacing:'.04em', marginBottom:12}}>미리보기</div>
              <div style={{padding:'18px 16px', border:'2px solid var(--border)', borderRadius:8, textAlign:'center'}}>
                <div style={{width:72, height:72, margin:'0 auto 10px', background:color, color:'#fff', fontFamily:'var(--ff-display)', fontWeight:900, fontSize:22, display:'grid', placeItems:'center', borderRadius:8}}>{tag}</div>
                <div style={{fontWeight:800, fontSize:16}}>{name}</div>
                <div style={{fontSize:12, color:'var(--ink-dim)', marginTop:2, fontFamily:'var(--ff-mono)'}}>rating 1500 · 0W 0L</div>
              </div>
              <div style={{fontSize:11, color:'var(--ink-dim)', lineHeight:1.6, marginTop:14}}>
                팀 생성 후 설정 → 팀 관리에서 로고·배너·멤버십 정책을 추가로 설정할 수 있습니다.
              </div>
              <button className="btn btn--primary btn--xl" style={{marginTop:14}} onClick={()=>setRoute('teamDetail')}>팀 생성 →</button>
              <button className="btn btn--sm" style={{width:'100%', marginTop:6}} onClick={()=>setRoute('team')}>취소</button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

window.CreateTeam = CreateTeam;
