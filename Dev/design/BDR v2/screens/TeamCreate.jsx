/* global React */

function TeamCreate({ setRoute }) {
  const [step, setStep] = React.useState(1);
  const [name, setName] = React.useState('');
  const [tag, setTag] = React.useState('');
  const [color, setColor] = React.useState('#DC2626');
  const [desc, setDesc] = React.useState('');
  const [home, setHome] = React.useState('');
  const [level, setLevel] = React.useState('중급');
  const [privacy, setPrivacy] = React.useState('public');

  const colors = ['#DC2626','#0F5FCC','#F59E0B','#10B981','#8B5CF6','#0EA5E9','#7C2D12','#475569','#EC4899','#111'];
  const steps = [
    { n:1, l:'기본정보' },
    { n:2, l:'엠블럼' },
    { n:3, l:'활동정보' },
    { n:4, l:'검토' },
  ];

  return (
    <div className="page">
      <div style={{display:'flex', gap:6, fontSize:12, color:'var(--ink-mute)', marginBottom:12}}>
        <a onClick={()=>setRoute('home')} style={{cursor:'pointer'}}>홈</a><span>›</span>
        <a onClick={()=>setRoute('team')} style={{cursor:'pointer'}}>팀</a><span>›</span>
        <span style={{color:'var(--ink)'}}>팀 등록</span>
      </div>

      <div style={{marginBottom:24}}>
        <div className="eyebrow">CREATE TEAM · 새 팀 등록</div>
        <h1 style={{margin:'6px 0 0', fontSize:32, fontWeight:800, letterSpacing:'-0.02em'}}>팀 만들기</h1>
        <p style={{margin:'4px 0 0', color:'var(--ink-mute)', fontSize:13}}>최소 3명 이상부터 팀 등록 가능. 등록 후 팀원을 초대할 수 있어요.</p>
      </div>

      {/* Stepper */}
      <div style={{display:'flex', marginBottom:28, padding:'0 10px'}}>
        {steps.map((s, i) => (
          <div key={s.n} style={{flex:1, display:'flex', alignItems:'center'}}>
            <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:6, position:'relative', zIndex:1}}>
              <div style={{
                width:36, height:36, borderRadius:'50%',
                background: step>=s.n ? 'var(--accent)' : 'var(--bg-alt)',
                color: step>=s.n ? '#fff' : 'var(--ink-dim)',
                display:'grid', placeItems:'center',
                fontFamily:'var(--ff-mono)', fontWeight:800, fontSize:13,
                border: step===s.n ? '3px solid color-mix(in oklab, var(--accent) 30%, transparent)' : 0,
              }}>{step>s.n ? '✓' : s.n}</div>
              <div style={{fontSize:11, fontWeight:700, color: step>=s.n ? 'var(--ink)' : 'var(--ink-dim)'}}>{s.l}</div>
            </div>
            {i<steps.length-1 && <div style={{flex:1, height:2, background: step>s.n ? 'var(--accent)' : 'var(--border)', margin:'0 8px', marginBottom:18}}/>}
          </div>
        ))}
      </div>

      <div style={{display:'grid', gridTemplateColumns:'minmax(0,1fr) 320px', gap:20, alignItems:'flex-start'}}>
        <div className="card" style={{padding:'28px 32px'}}>

          {step === 1 && (
            <div>
              <h2 style={{margin:'0 0 4px', fontSize:18, fontWeight:700}}>기본 정보</h2>
              <p style={{margin:'0 0 20px', fontSize:13, color:'var(--ink-mute)'}}>팀 이름은 등록 후 변경이 어려우니 신중히 선택하세요.</p>
              <div style={{display:'flex', flexDirection:'column', gap:16}}>
                <div>
                  <label style={{fontSize:12, fontWeight:700, color:'var(--ink-dim)', display:'block', marginBottom:6}}>팀 이름 *</label>
                  <input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="예: REDEEM, 3POINT, 몽키즈"/>
                  <div style={{fontSize:11, color:'var(--ink-dim)', marginTop:4}}>한글·영문 2~20자</div>
                </div>
                <div>
                  <label style={{fontSize:12, fontWeight:700, color:'var(--ink-dim)', display:'block', marginBottom:6}}>팀 태그 *</label>
                  <input className="input" value={tag} onChange={e=>setTag(e.target.value.toUpperCase())} placeholder="RDM" maxLength={4} style={{fontFamily:'var(--ff-mono)', width:160, textTransform:'uppercase'}}/>
                  <div style={{fontSize:11, color:'var(--ink-dim)', marginTop:4}}>영문·숫자 2~4자 · 리그·대진표에 표시</div>
                </div>
                <div>
                  <label style={{fontSize:12, fontWeight:700, color:'var(--ink-dim)', display:'block', marginBottom:6}}>팀 소개</label>
                  <textarea className="input" value={desc} onChange={e=>setDesc(e.target.value)} rows={4} placeholder="우리 팀은 어떤 팀인가요? 주 활동 지역, 실력 수준, 분위기 등을 적어주세요." style={{resize:'vertical'}}/>
                  <div style={{fontSize:11, color:'var(--ink-dim)', marginTop:4}}>{desc.length}/500</div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 style={{margin:'0 0 4px', fontSize:18, fontWeight:700}}>엠블럼 · 컬러</h2>
              <p style={{margin:'0 0 20px', fontSize:13, color:'var(--ink-mute)'}}>지금은 태그+컬러로 시작하고, 등록 후 이미지 엠블럼으로 바꿀 수 있어요.</p>
              <div style={{display:'grid', gridTemplateColumns:'200px 1fr', gap:28, alignItems:'flex-start'}}>
                <div style={{textAlign:'center'}}>
                  <div style={{width:160, height:160, margin:'0 auto', background:color, color:'#fff', display:'grid', placeItems:'center', fontFamily:'var(--ff-display)', fontWeight:900, fontSize:48, letterSpacing:'-0.02em', borderRadius:12, boxShadow:'var(--sh-lift)'}}>{tag || 'TAG'}</div>
                  <div style={{fontSize:11, color:'var(--ink-dim)', marginTop:10, fontFamily:'var(--ff-mono)'}}>미리보기</div>
                </div>
                <div>
                  <label style={{fontSize:12, fontWeight:700, color:'var(--ink-dim)', display:'block', marginBottom:8}}>팀 컬러 *</label>
                  <div style={{display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:8, marginBottom:20}}>
                    {colors.map(c => (
                      <button key={c} onClick={()=>setColor(c)} style={{
                        width:'100%', aspectRatio:'1/1', background:c, borderRadius:6,
                        border: color===c ? '3px solid var(--ink)' : '2px solid var(--border)',
                        cursor:'pointer', boxShadow: color===c ? '0 0 0 3px var(--bg), 0 0 0 5px var(--ink)' : 'none',
                      }}/>
                    ))}
                  </div>
                  <label style={{fontSize:12, fontWeight:700, color:'var(--ink-dim)', display:'block', marginBottom:6}}>엠블럼 이미지 (선택)</label>
                  <div style={{padding:'24px', border:'2px dashed var(--border)', borderRadius:8, textAlign:'center'}}>
                    <div style={{fontSize:28, opacity:.3, marginBottom:6}}>📁</div>
                    <div style={{fontSize:13, fontWeight:600}}>드래그하거나 클릭해서 업로드</div>
                    <div style={{fontSize:11, color:'var(--ink-dim)', marginTop:4}}>PNG·JPG · 정방형 권장 · 최대 2MB</div>
                    <div style={{fontSize:11, color:'var(--ink-dim)', marginTop:6}}>💎 BDR+ 멤버 전용 기능</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 style={{margin:'0 0 4px', fontSize:18, fontWeight:700}}>활동 정보</h2>
              <p style={{margin:'0 0 20px', fontSize:13, color:'var(--ink-mute)'}}>다른 팀이 우리 팀을 찾을 때 보여지는 정보예요.</p>
              <div style={{display:'flex', flexDirection:'column', gap:16}}>
                <div>
                  <label style={{fontSize:12, fontWeight:700, color:'var(--ink-dim)', display:'block', marginBottom:6}}>주 활동 코트 *</label>
                  <input className="input" value={home} onChange={e=>setHome(e.target.value)} placeholder="예: 장충체육관, 미사강변체육관"/>
                </div>
                <div>
                  <label style={{fontSize:12, fontWeight:700, color:'var(--ink-dim)', display:'block', marginBottom:6}}>실력 수준 *</label>
                  <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
                    {['초보','초-중급','중급','중-상급','상급','선수급'].map(l => (
                      <button key={l} onClick={()=>setLevel(l)} className={`btn ${level===l?'btn--primary':''} btn--sm`}>{l}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{fontSize:12, fontWeight:700, color:'var(--ink-dim)', display:'block', marginBottom:6}}>활동 요일 (복수선택)</label>
                  <div style={{display:'flex', gap:6}}>
                    {['월','화','수','목','금','토','일'].map(d => (
                      <button key={d} style={{padding:'8px 14px', background:'var(--bg-alt)', border:'1px solid var(--border)', borderRadius:4, cursor:'pointer', fontWeight:700, fontSize:13}}>{d}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{fontSize:12, fontWeight:700, color:'var(--ink-dim)', display:'block', marginBottom:6}}>팀 공개 설정</label>
                  <div style={{display:'flex', flexDirection:'column', gap:6}}>
                    {[
                      {id:'public',  l:'공개', d:'누구나 검색·신청 가능'},
                      {id:'invite',  l:'초대제', d:'초대 코드로만 합류'},
                      {id:'closed',  l:'비공개', d:'팀장 승인 후 합류'},
                    ].map(p => (
                      <label key={p.id} style={{display:'flex', gap:10, padding:'10px 12px', background:privacy===p.id?'var(--bg-alt)':'transparent', border:'1px solid var(--border)', borderRadius:4, cursor:'pointer', alignItems:'flex-start'}}>
                        <input type="radio" name="priv" checked={privacy===p.id} onChange={()=>setPrivacy(p.id)} style={{marginTop:2}}/>
                        <div>
                          <div style={{fontWeight:700, fontSize:13}}>{p.l}</div>
                          <div style={{fontSize:11, color:'var(--ink-dim)'}}>{p.d}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 style={{margin:'0 0 4px', fontSize:18, fontWeight:700}}>검토 및 생성</h2>
              <p style={{margin:'0 0 20px', fontSize:13, color:'var(--ink-mute)'}}>입력한 정보를 한 번 더 확인해주세요.</p>
              <div style={{display:'grid', gridTemplateColumns:'140px 1fr', gap:14, fontSize:13, marginBottom:20, padding:'16px 18px', background:'var(--bg-alt)', borderRadius:6}}>
                {[
                  ['팀 이름', name || '(미입력)'],
                  ['팀 태그', <span style={{fontFamily:'var(--ff-mono)'}}>{tag || '(미입력)'}</span>],
                  ['컬러', <span style={{display:'inline-flex', gap:6, alignItems:'center'}}><span style={{width:16, height:16, background:color, borderRadius:3}}/> <code>{color}</code></span>],
                  ['활동 코트', home || '(미입력)'],
                  ['실력 수준', level],
                  ['공개 설정', {public:'공개', invite:'초대제', closed:'비공개'}[privacy]],
                  ['최초 팀장', 'rdm_captain'],
                ].map(([l, v], i) => (
                  <React.Fragment key={i}>
                    <div style={{color:'var(--ink-dim)', fontWeight:700}}>{l}</div>
                    <div style={{fontWeight:600}}>{v}</div>
                  </React.Fragment>
                ))}
              </div>
              <label style={{display:'flex', gap:8, alignItems:'flex-start', fontSize:13, marginBottom:8}}>
                <input type="checkbox" defaultChecked style={{marginTop:3}}/>
                <span>BDR 팀 운영 규칙에 동의합니다 (<a style={{color:'var(--cafe-blue)'}}>전문보기</a>)</span>
              </label>
              <label style={{display:'flex', gap:8, alignItems:'flex-start', fontSize:13}}>
                <input type="checkbox" defaultChecked style={{marginTop:3}}/>
                <span>허위 정보 등록 시 팀 삭제 가능함을 이해합니다</span>
              </label>
            </div>
          )}

          {/* Nav */}
          <div style={{display:'flex', justifyContent:'space-between', marginTop:28, paddingTop:20, borderTop:'1px solid var(--border)'}}>
            <button className="btn" onClick={()=>step>1 ? setStep(step-1) : setRoute('team')}>{step>1 ? '← 이전' : '취소'}</button>
            {step<4 && <button className="btn btn--primary" onClick={()=>setStep(step+1)}>다음 →</button>}
            {step===4 && <button className="btn btn--primary btn--lg" onClick={()=>setRoute('teamDetail')}>팀 등록 완료</button>}
          </div>
        </div>

        {/* Tips */}
        <aside style={{display:'flex', flexDirection:'column', gap:14, position:'sticky', top:120}}>
          <div className="card" style={{padding:'18px 20px', background:'var(--bg-alt)'}}>
            <div style={{fontSize:11, color:'var(--ink-dim)', fontWeight:800, letterSpacing:'.1em', marginBottom:8}}>💡 TIP</div>
            <div style={{fontSize:13, lineHeight:1.6, color:'var(--ink-soft)'}}>
              좋은 팀명은 <b>3음절 이내 + 기억하기 쉬운 단어</b>가 성공적입니다. REDEEM, 3POINT, 몽키즈 모두 한 단어로 떠오르는 팀들이죠.
            </div>
          </div>
          <div className="card" style={{padding:'18px 20px'}}>
            <h3 style={{margin:'0 0 10px', fontSize:14, fontWeight:700}}>등록 후에는…</h3>
            <ol style={{margin:0, paddingLeft:18, fontSize:12.5, lineHeight:1.8, color:'var(--ink-soft)'}}>
              <li>팀원 2명 이상 초대</li>
              <li>3명 이상일 때 리그·대회 등록 가능</li>
              <li>엠블럼/배너 업로드 (BDR+)</li>
              <li>첫 공식 경기 완료 시 레이팅 1500 부여</li>
            </ol>
          </div>
          <div className="card" style={{padding:'16px 18px'}}>
            <div style={{fontSize:11, color:'var(--ink-dim)', fontWeight:700, marginBottom:6}}>현재 요금제</div>
            <div style={{fontWeight:800, fontSize:15}}>FREE</div>
            <div style={{fontSize:11, color:'var(--ink-dim)', marginTop:2}}>팀 1개까지 등록 가능</div>
            <button className="btn btn--sm" style={{width:'100%', marginTop:10}} onClick={()=>setRoute('pricing')}>BDR+ 업그레이드 →</button>
          </div>
        </aside>
      </div>
    </div>
  );
}

window.TeamCreate = TeamCreate;
