/* global React, TEAMS, TOURNAMENTS, Avatar, Poster */

function TournamentEnroll({ setRoute }) {
  const [step, setStep] = React.useState(1);
  const [division, setDivision] = React.useState('amateur');
  const [team, setTeam] = React.useState(TEAMS[0]);
  const [roster, setRoster] = React.useState([0,1,2,3,4]);

  const t = TOURNAMENTS[0] || { title:'BDR Challenge Spring 2026', edition:'Vol.12', accent:'#DC2626' };

  const players = [
    { id:0, name:'rdm_captain', pos:'G', num:7, star:true, cap:true, level:'L.8' },
    { id:1, name:'rdm_sniper',  pos:'G', num:13, level:'L.6' },
    { id:2, name:'rdm_forward', pos:'F', num:23, level:'L.7' },
    { id:3, name:'rdm_pivot',   pos:'C', num:44, star:true, level:'L.7' },
    { id:4, name:'rdm_utility', pos:'F', num:3,  level:'L.5' },
    { id:5, name:'rdm_bench1',  pos:'G', num:9,  level:'L.4' },
    { id:6, name:'rdm_bench2',  pos:'F', num:21, level:'L.5' },
    { id:7, name:'rdm_bench3',  pos:'C', num:55, level:'L.4' },
  ];

  const steps = [
    { n:1, l:'대회 확인' },
    { n:2, l:'디비전' },
    { n:3, l:'로스터' },
    { n:4, l:'서류' },
    { n:5, l:'결제' },
  ];

  const divisions = [
    { id:'open', name:'OPEN', tag:'전체 참가', seats:'24/32', color:'#0F5FCC', fee:60000, desc:'참가 자격 제한 없음. 가장 치열한 디비전.' },
    { id:'amateur', name:'AMATEUR', tag:'비선출 전용', seats:'18/24', color:'#10B981', fee:40000, desc:'선출·프로 경력 없는 팀만 참가. 균형잡힌 경쟁.' },
    { id:'rookie', name:'ROOKIE', tag:'첫 대회 팀', seats:'9/16', color:'#F59E0B', fee:25000, desc:'BDR에 처음 출전하는 팀 한정. 부담 없는 분위기.' },
  ];

  const selDiv = divisions.find(d => d.id === division);
  const fee = selDiv.fee;
  const insurance = 15000;

  const toggleRoster = (id) => {
    if (roster.includes(id)) {
      if (roster.length <= 5) return;
      setRoster(roster.filter(r => r !== id));
    } else if (roster.length < 10) {
      setRoster([...roster, id]);
    }
  };

  return (
    <div className="page">
      <div style={{display:'flex', gap:6, fontSize:12, color:'var(--ink-mute)', marginBottom:12}}>
        <a onClick={()=>setRoute('home')} style={{cursor:'pointer'}}>홈</a><span>›</span>
        <a onClick={()=>setRoute('match')} style={{cursor:'pointer'}}>대회</a><span>›</span>
        <span style={{color:'var(--ink)'}}>접수</span>
      </div>

      <div style={{marginBottom:24}}>
        <div className="eyebrow">TOURNAMENT ENROLLMENT · 대회 접수</div>
        <h1 style={{margin:'6px 0 0', fontSize:32, fontWeight:800, letterSpacing:'-0.02em'}}>{t.title}</h1>
        <p style={{margin:'4px 0 0', color:'var(--ink-mute)', fontSize:13}}>접수마감 <b style={{color:'var(--err)'}}>D-8 (5/1 23:59)</b> · 예선 5/9-10 · 본선 5/16-17</p>
      </div>

      {/* Stepper */}
      <div style={{display:'flex', marginBottom:28, padding:'0 10px'}}>
        {steps.map((s, i) => (
          <div key={s.n} style={{flex:1, display:'flex', alignItems:'center'}}>
            <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:6, position:'relative', zIndex:1}}>
              <div style={{width:32, height:32, borderRadius:'50%', background: step>=s.n ? 'var(--accent)' : 'var(--bg-alt)', color: step>=s.n ? '#fff' : 'var(--ink-dim)', display:'grid', placeItems:'center', fontFamily:'var(--ff-mono)', fontWeight:800, fontSize:12, border: step===s.n ? '3px solid color-mix(in oklab, var(--accent) 30%, transparent)' : 0}}>{step>s.n ? '✓' : s.n}</div>
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
              <h2 style={{margin:'0 0 16px', fontSize:18, fontWeight:700}}>대회 정보 확인</h2>
              <div style={{display:'grid', gridTemplateColumns:'200px 1fr', gap:20, alignItems:'flex-start', marginBottom:20}}>
                <Poster title={t.title} edition={t.edition} accent={t.accent} height={240} radius={6}/>
                <div>
                  <div style={{display:'grid', gridTemplateColumns:'120px 1fr', gap:10, fontSize:13, lineHeight:1.7}}>
                    {[
                      ['주최', 'BDR 운영팀'],
                      ['후원', 'Nike Basketball · Molten'],
                      ['예선', '2026.05.09 - 05.10 · 잠실학생체육관'],
                      ['본선', '2026.05.16 - 05.17 · 장충체육관'],
                      ['방식', '조별예선 → 토너먼트 싱글엘리'],
                      ['참가비', '디비전별 상이 (25,000 ~ 60,000원)'],
                      ['우승상금', '₩3,000,000 + 트로피 + 굿즈'],
                      ['준우승', '₩1,000,000'],
                    ].map(([l,v], i) => (
                      <React.Fragment key={i}>
                        <div style={{color:'var(--ink-dim)', fontWeight:700}}>{l}</div>
                        <div style={{fontWeight:600}}>{v}</div>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{padding:'14px 16px', background:'var(--bg-alt)', borderRadius:6, fontSize:13, color:'var(--ink-soft)', lineHeight:1.7, borderLeft:'3px solid var(--accent)'}}>
                <b>참가 자격 공통</b><br/>
                · 팀 등록 완료 · 로스터 최소 5명 이상<br/>
                · 모든 팀원 만 16세 이상<br/>
                · 다른 아마추어 대회와 일정 중복 없음
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 style={{margin:'0 0 4px', fontSize:18, fontWeight:700}}>디비전 선택</h2>
              <p style={{margin:'0 0 20px', fontSize:13, color:'var(--ink-mute)'}}>팀 실력과 구성원에 맞는 디비전을 선택해주세요. 등록 후 변경 불가.</p>
              <div style={{display:'flex', flexDirection:'column', gap:10}}>
                {divisions.map(d => (
                  <button key={d.id} onClick={()=>setDivision(d.id)} style={{
                    textAlign:'left', padding:'18px 20px',
                    background: division===d.id ? 'var(--bg-alt)' : 'transparent',
                    border: division===d.id ? `2px solid ${d.color}` : '1px solid var(--border)',
                    borderRadius:6, cursor:'pointer', display:'grid', gridTemplateColumns:'80px 1fr auto', gap:16, alignItems:'center',
                  }}>
                    <div style={{width:80, height:80, background:d.color, color:'#fff', display:'grid', placeItems:'center', fontFamily:'var(--ff-display)', fontWeight:900, fontSize:20, letterSpacing:'.04em', borderRadius:6}}>{d.name.slice(0,3)}</div>
                    <div>
                      <div style={{display:'flex', gap:8, alignItems:'baseline', marginBottom:4}}>
                        <div style={{fontFamily:'var(--ff-display)', fontSize:18, fontWeight:800, letterSpacing:'-0.01em'}}>{d.name}</div>
                        <span className="badge badge--ghost">{d.tag}</span>
                      </div>
                      <div style={{fontSize:12, color:'var(--ink-mute)', marginBottom:6}}>{d.desc}</div>
                      <div style={{fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>팀 접수 {d.seats}</div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontFamily:'var(--ff-display)', fontSize:22, fontWeight:900, color:d.color}}>₩{d.fee.toLocaleString()}</div>
                      <div style={{fontSize:11, color:'var(--ink-dim)'}}>/ 팀</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 style={{margin:'0 0 4px', fontSize:18, fontWeight:700}}>로스터 등록</h2>
              <p style={{margin:'0 0 20px', fontSize:13, color:'var(--ink-mute)'}}>출전 선수 5~10명을 선택해주세요. ({roster.length}/10 · 최소 5명)</p>
              <div style={{display:'flex', gap:10, marginBottom:14, padding:'10px 14px', background:'var(--bg-alt)', borderRadius:6, alignItems:'center'}}>
                <Avatar tag={team.tag} color={team.color} ink={team.ink} size={40} radius={4}/>
                <div style={{flex:1}}>
                  <div style={{fontWeight:800}}>{team.name}</div>
                  <div style={{fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>전체 {players.length}명 · 선택 {roster.length}명</div>
                </div>
                <button className="btn btn--sm">팀 변경</button>
              </div>
              <div style={{display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:8}}>
                {players.map(p => {
                  const sel = roster.includes(p.id);
                  return (
                    <button key={p.id} onClick={()=>toggleRoster(p.id)} style={{
                      textAlign:'left', padding:'12px 14px',
                      background: sel ? 'color-mix(in oklab, var(--accent) 8%, var(--bg))' : 'transparent',
                      border: sel ? '2px solid var(--accent)' : '1px solid var(--border)',
                      borderRadius:6, cursor:'pointer', display:'grid', gridTemplateColumns:'auto 36px 1fr auto', gap:10, alignItems:'center',
                    }}>
                      <input type="checkbox" checked={sel} readOnly/>
                      <span style={{fontFamily:'var(--ff-mono)', fontWeight:800, fontSize:14, color:'var(--ink-dim)'}}>#{p.num}</span>
                      <div>
                        <div style={{fontWeight:700, fontSize:13}}>
                          {p.cap && <span style={{color:'var(--accent)', fontFamily:'var(--ff-mono)', fontSize:9, marginRight:4, background:'var(--accent)', color:'#fff', padding:'1px 4px', borderRadius:2}}>C</span>}
                          {p.star && <span style={{color:'var(--accent)', marginRight:4}}>★</span>}
                          {p.name}
                        </div>
                        <div style={{fontSize:10, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>{p.pos} · {p.level}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
              {roster.length < 5 && <div style={{marginTop:12, padding:'10px 14px', background:'color-mix(in oklab, var(--err) 8%, transparent)', color:'var(--err)', borderRadius:4, fontSize:12, fontWeight:600}}>⚠️ 최소 5명을 선택해야 접수가 가능합니다.</div>}
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 style={{margin:'0 0 4px', fontSize:18, fontWeight:700}}>서류 제출</h2>
              <p style={{margin:'0 0 20px', fontSize:13, color:'var(--ink-mute)'}}>디비전 검증에 필요한 서류입니다.</p>
              <div style={{display:'flex', flexDirection:'column', gap:12}}>
                {[
                  { l:'선수 경력 확인서', d:'전 선수·아마추어·프로 경력 여부', req:true, done:true },
                  { l:'신분증 사본 (전원)', d:'주민번호 뒷자리 가림', req:true, done:true },
                  { l:'대회 참가 동의서', d:'PDF 템플릿 다운로드', req:true, done:false },
                  { l:'보험 가입 증빙', d:'개별 가입 또는 대회 단체보험', req:false, done:true },
                ].map((doc, i) => (
                  <div key={i} style={{padding:'14px 16px', background:'var(--bg-alt)', borderRadius:6, display:'grid', gridTemplateColumns:'auto 1fr auto auto', gap:14, alignItems:'center'}}>
                    <div style={{width:32, height:32, borderRadius:4, background: doc.done ? 'var(--ok)' : 'var(--ink-dim)', color:'#fff', display:'grid', placeItems:'center', fontSize:14}}>{doc.done ? '✓' : '!'}</div>
                    <div>
                      <div style={{fontWeight:700, fontSize:13}}>{doc.l} {doc.req && <span style={{color:'var(--err)', fontWeight:800, marginLeft:2}}>*</span>}</div>
                      <div style={{fontSize:11, color:'var(--ink-dim)'}}>{doc.d}</div>
                    </div>
                    <span className={`badge ${doc.done?'badge--ok':'badge--red'}`}>{doc.done?'제출완료':'미제출'}</span>
                    <button className="btn btn--sm">{doc.done?'변경':'업로드'}</button>
                  </div>
                ))}
              </div>
              <div style={{marginTop:16, padding:'12px 14px', background:'color-mix(in oklab, var(--accent) 6%, transparent)', borderRadius:4, fontSize:12, color:'var(--ink-soft)', lineHeight:1.6}}>
                💡 동의서는 팀원 전원이 각자 서명해야 합니다. 팀장이 대표 업로드 후, 운영팀이 개별 확인합니다.
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <h2 style={{margin:'0 0 4px', fontSize:18, fontWeight:700}}>결제</h2>
              <p style={{margin:'0 0 20px', fontSize:13, color:'var(--ink-mute)'}}>참가비 결제가 완료되면 접수가 확정됩니다.</p>
              <div style={{padding:'20px 22px', background:'var(--bg-alt)', borderRadius:8, marginBottom:16}}>
                <div style={{display:'flex', flexDirection:'column', gap:8, fontSize:13}}>
                  <div style={{display:'flex', justifyContent:'space-between'}}>
                    <span style={{color:'var(--ink-mute)'}}>{selDiv.name} 디비전 참가비</span>
                    <span style={{fontFamily:'var(--ff-mono)'}}>₩{fee.toLocaleString()}</span>
                  </div>
                  <div style={{display:'flex', justifyContent:'space-between'}}>
                    <span style={{color:'var(--ink-mute)'}}>단체보험 (선택)</span>
                    <span style={{fontFamily:'var(--ff-mono)'}}>₩{insurance.toLocaleString()}</span>
                  </div>
                  <div style={{display:'flex', justifyContent:'space-between', color:'var(--ok)'}}>
                    <span>BDR+ 우선접수 할인</span>
                    <span style={{fontFamily:'var(--ff-mono)'}}>− ₩{Math.round(fee*0.05).toLocaleString()}</span>
                  </div>
                  <div style={{borderTop:'1px dashed var(--border)', paddingTop:10, marginTop:6, display:'flex', justifyContent:'space-between', alignItems:'baseline'}}>
                    <span style={{fontWeight:700}}>총 결제금액</span>
                    <span style={{fontFamily:'var(--ff-display)', fontSize:24, fontWeight:900, color:'var(--accent)'}}>₩{(fee+insurance-Math.round(fee*0.05)).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <label style={{display:'flex', gap:8, alignItems:'flex-start', fontSize:13, marginBottom:8}}>
                <input type="checkbox" defaultChecked style={{marginTop:3}}/>
                <span>대회 규정·환불 정책에 동의합니다</span>
              </label>
              <label style={{display:'flex', gap:8, alignItems:'flex-start', fontSize:13}}>
                <input type="checkbox" defaultChecked style={{marginTop:3}}/>
                <span>경기 촬영·중계·사진 공개에 동의합니다</span>
              </label>
            </div>
          )}

          <div style={{display:'flex', justifyContent:'space-between', marginTop:28, paddingTop:20, borderTop:'1px solid var(--border)'}}>
            <button className="btn" onClick={()=>step>1 ? setStep(step-1) : setRoute('match')}>{step>1 ? '← 이전' : '취소'}</button>
            {step<5 && <button className="btn btn--primary" onClick={()=>setStep(step+1)} disabled={step===3 && roster.length<5}>다음 →</button>}
            {step===5 && <button className="btn btn--primary btn--lg" onClick={()=>setRoute('checkout')}>결제하기 · ₩{(fee+insurance-Math.round(fee*0.05)).toLocaleString()}</button>}
          </div>
        </div>

        <aside style={{display:'flex', flexDirection:'column', gap:14, position:'sticky', top:120}}>
          <div className="card" style={{padding:0, overflow:'hidden'}}>
            <Poster title={t.title} edition={t.edition} accent={t.accent} height={140} radius={0}/>
            <div style={{padding:'14px 18px'}}>
              <div style={{fontSize:10, color:'var(--ink-dim)', fontWeight:800, letterSpacing:'.12em'}}>디비전</div>
              <div style={{fontFamily:'var(--ff-display)', fontSize:18, fontWeight:900, color:selDiv.color, marginTop:2}}>{selDiv.name}</div>
              <div style={{borderTop:'1px solid var(--border)', marginTop:12, paddingTop:12, display:'flex', flexDirection:'column', gap:6, fontSize:12}}>
                <div style={{display:'flex', justifyContent:'space-between'}}><span style={{color:'var(--ink-dim)'}}>참가팀</span><span style={{fontWeight:700}}>{team.name}</span></div>
                <div style={{display:'flex', justifyContent:'space-between'}}><span style={{color:'var(--ink-dim)'}}>로스터</span><span style={{fontWeight:700, fontFamily:'var(--ff-mono)'}}>{roster.length}명</span></div>
                <div style={{display:'flex', justifyContent:'space-between'}}><span style={{color:'var(--ink-dim)'}}>참가비</span><span style={{fontWeight:700, fontFamily:'var(--ff-mono)'}}>₩{fee.toLocaleString()}</span></div>
              </div>
            </div>
          </div>
          <div className="card" style={{padding:'16px 18px'}}>
            <div style={{fontSize:11, color:'var(--ink-dim)', fontWeight:800, letterSpacing:'.1em', marginBottom:8}}>⏰ 마감까지</div>
            <div style={{fontFamily:'var(--ff-display)', fontSize:28, fontWeight:900, color:'var(--err)'}}>D-8</div>
            <div style={{fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>2026.05.01 23:59</div>
          </div>
          <div className="card" style={{padding:'16px 18px', background:'var(--bg-alt)'}}>
            <div style={{fontSize:11, color:'var(--ink-dim)', fontWeight:700, letterSpacing:'.1em', marginBottom:6}}>환불 정책</div>
            <div style={{fontSize:12, color:'var(--ink-soft)', lineHeight:1.6}}>
              · D-3 이전: 100%<br/>
              · D-2 ~ D-1: 50%<br/>
              · 당일: 환불불가
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

window.TournamentEnroll = TournamentEnroll;
