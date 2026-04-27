/* global React, Avatar */

function CourtBooking({ setRoute }) {
  const [court, setCourt] = React.useState('c1');
  const [date, setDate] = React.useState('2026-04-26');
  const [slot, setSlot] = React.useState(null);
  const [dur, setDur] = React.useState(2);
  const [purpose, setPurpose] = React.useState('pickup');

  const courts = [
    { id:'c1', name:'장충체육관 메인코트', area:'중구', hours:'06:00-22:00', fee:30000, fac:['탈의실','샤워실','주차'], rating:4.8, img:'#DC2626', indoor:true },
    { id:'c2', name:'미사강변체육관 B코트', area:'하남시', hours:'06:00-22:00', fee:25000, fac:['탈의실','샤워실','주차','매점'], rating:4.7, img:'#0F5FCC', indoor:true },
    { id:'c3', name:'반포종합복지관', area:'서초구', hours:'07:00-21:00', fee:18000, fac:['탈의실','주차'], rating:4.5, img:'#10B981', indoor:true },
    { id:'c4', name:'용산국민체육센터', area:'용산구', hours:'08:00-21:00', fee:35000, fac:['탈의실','샤워실','주차','매점','물품보관'], rating:4.6, img:'#F59E0B', indoor:true },
  ];
  const current = courts.find(c => c.id === court);

  const slots = [
    { t:'06:00', avail:true }, { t:'07:00', avail:true }, { t:'08:00', avail:false, by:'서울바스켓 리그' },
    { t:'09:00', avail:false, by:'서울바스켓 리그' }, { t:'10:00', avail:true }, { t:'11:00', avail:true },
    { t:'12:00', avail:true }, { t:'13:00', avail:false, by:'REDEEM 훈련' }, { t:'14:00', avail:false, by:'REDEEM 훈련' },
    { t:'15:00', avail:true }, { t:'16:00', avail:true }, { t:'17:00', avail:true },
    { t:'18:00', avail:true }, { t:'19:00', avail:true }, { t:'20:00', avail:false, by:'주말농구협회' },
    { t:'21:00', avail:false, by:'주말농구협회' },
  ];

  const days = Array.from({length:7}, (_, i) => {
    const d = new Date(2026, 3, 24 + i);
    return { ds:`2026-04-${String(24+i).padStart(2,'0')}`, day:24+i, dow:['일','월','화','수','목','금','토'][d.getDay()], weekend:d.getDay()===0||d.getDay()===6 };
  });

  const total = slot ? current.fee * dur : 0;

  return (
    <div className="page">
      <div style={{display:'flex', gap:6, fontSize:12, color:'var(--ink-mute)', marginBottom:12}}>
        <a onClick={()=>setRoute('home')} style={{cursor:'pointer'}}>홈</a><span>›</span>
        <a onClick={()=>setRoute('court')} style={{cursor:'pointer'}}>코트</a><span>›</span>
        <span style={{color:'var(--ink)'}}>예약</span>
      </div>

      <div style={{marginBottom:20}}>
        <div className="eyebrow">COURT BOOKING · 코트 대관</div>
        <h1 style={{margin:'6px 0 0', fontSize:32, fontWeight:800, letterSpacing:'-0.02em'}}>코트 예약</h1>
        <p style={{margin:'4px 0 0', color:'var(--ink-mute)', fontSize:13}}>픽업·훈련·대회용 코트를 시간 단위로 예약하세요. 환불은 3일 전까지 100%.</p>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'minmax(0,1fr) 340px', gap:18, alignItems:'flex-start'}}>
        <div>
          {/* Court picker */}
          <div className="card" style={{padding:'18px 20px', marginBottom:14}}>
            <div style={{fontSize:11, color:'var(--ink-dim)', fontWeight:800, letterSpacing:'.12em', marginBottom:10}}>1. 코트 선택</div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:8}}>
              {courts.map(c => (
                <button key={c.id} onClick={()=>setCourt(c.id)} style={{
                  textAlign:'left', padding:'12px 14px', background: court===c.id?'var(--bg-alt)':'transparent',
                  border: court===c.id ? '2px solid var(--accent)' : '1px solid var(--border)', borderRadius:6, cursor:'pointer',
                  display:'grid', gridTemplateColumns:'48px 1fr', gap:10, alignItems:'center',
                }}>
                  <div style={{width:48, height:48, background:`linear-gradient(135deg, ${c.img}, #000)`, borderRadius:4, display:'grid', placeItems:'center', color:'#fff', fontSize:18}}>🏀</div>
                  <div style={{minWidth:0}}>
                    <div style={{fontWeight:700, fontSize:13, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{c.name}</div>
                    <div style={{fontSize:11, color:'var(--ink-dim)'}}>{c.area} · ★ {c.rating}</div>
                    <div style={{fontSize:11, fontFamily:'var(--ff-mono)', color:'var(--ink-mute)', marginTop:2}}>₩{c.fee.toLocaleString()}/시간</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Date picker */}
          <div className="card" style={{padding:'18px 20px', marginBottom:14}}>
            <div style={{fontSize:11, color:'var(--ink-dim)', fontWeight:800, letterSpacing:'.12em', marginBottom:10}}>2. 날짜 선택</div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:6}}>
              {days.map(d => (
                <button key={d.ds} onClick={()=>{setDate(d.ds); setSlot(null);}} style={{
                  padding:'10px 0', background: date===d.ds?'var(--accent)':'var(--bg-alt)',
                  color: date===d.ds?'#fff':'var(--ink)',
                  border:0, borderRadius:4, cursor:'pointer', textAlign:'center',
                }}>
                  <div style={{fontSize:10, opacity:.8, fontWeight:700}}>{d.dow}</div>
                  <div style={{fontFamily:'var(--ff-display)', fontSize:20, fontWeight:900, letterSpacing:'-0.01em', color: d.weekend && date !== d.ds ? (d.dow==='일'?'var(--err)':'var(--cafe-blue)') : undefined}}>{d.day}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Time slots */}
          <div className="card" style={{padding:'18px 20px', marginBottom:14}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:10}}>
              <div style={{fontSize:11, color:'var(--ink-dim)', fontWeight:800, letterSpacing:'.12em'}}>3. 시간 선택</div>
              <div style={{fontSize:11, color:'var(--ink-mute)', fontFamily:'var(--ff-mono)'}}>{slots.filter(s=>s.avail).length}/{slots.length} 예약가능</div>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:6, marginBottom:12}}>
              {slots.map(s => (
                <button key={s.t} disabled={!s.avail} onClick={()=>setSlot(s.t)} style={{
                  padding:'12px 8px',
                  background: slot===s.t?'var(--accent)': s.avail?'var(--bg-alt)':'var(--bg)',
                  color: slot===s.t?'#fff': s.avail?'var(--ink)':'var(--ink-dim)',
                  border: slot===s.t?0:'1px solid var(--border)',
                  borderRadius:4, cursor: s.avail?'pointer':'not-allowed',
                  textAlign:'center', opacity: s.avail?1:0.55,
                }}>
                  <div style={{fontFamily:'var(--ff-mono)', fontWeight:700, fontSize:14}}>{s.t}</div>
                  <div style={{fontSize:10, marginTop:2, opacity:.8}}>{s.avail?'예약가능':s.by}</div>
                </button>
              ))}
            </div>
            <div>
              <div style={{fontSize:11, color:'var(--ink-dim)', fontWeight:700, marginBottom:6}}>이용 시간</div>
              <div style={{display:'flex', gap:6}}>
                {[1,2,3,4].map(h => (
                  <button key={h} onClick={()=>setDur(h)} className={`btn ${dur===h?'btn--primary':''} btn--sm`}>{h}시간</button>
                ))}
              </div>
            </div>
          </div>

          {/* Purpose */}
          <div className="card" style={{padding:'18px 20px'}}>
            <div style={{fontSize:11, color:'var(--ink-dim)', fontWeight:800, letterSpacing:'.12em', marginBottom:10}}>4. 이용 목적</div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:6, marginBottom:12}}>
              {[
                {id:'pickup', l:'픽업경기', d:'개인 모집'},
                {id:'team',   l:'팀 훈련', d:'팀원 전용'},
                {id:'scrim',  l:'스크림', d:'팀간 연습'},
                {id:'private',l:'개인 연습', d:'혼자/소규모'},
              ].map(p => (
                <button key={p.id} onClick={()=>setPurpose(p.id)} style={{
                  padding:'12px 10px', textAlign:'center',
                  background: purpose===p.id?'var(--bg-alt)':'transparent',
                  border: purpose===p.id ? '2px solid var(--accent)' : '1px solid var(--border)',
                  borderRadius:4, cursor:'pointer',
                }}>
                  <div style={{fontWeight:700, fontSize:13}}>{p.l}</div>
                  <div style={{fontSize:10, color:'var(--ink-dim)', marginTop:2}}>{p.d}</div>
                </button>
              ))}
            </div>
            <div>
              <div style={{fontSize:11, color:'var(--ink-dim)', fontWeight:700, marginBottom:4}}>참가인원 (예상)</div>
              <input className="input" type="number" defaultValue="10" min="1" max="30" style={{width:120}}/>
            </div>
          </div>
        </div>

        {/* Summary */}
        <aside style={{position:'sticky', top:120}}>
          <div className="card" style={{padding:0, overflow:'hidden'}}>
            <div style={{padding:'16px 20px', background:`linear-gradient(135deg, ${current.img}, #000)`, color:'#fff'}}>
              <div style={{fontSize:10, letterSpacing:'.12em', opacity:.85, fontWeight:800}}>BOOKING SUMMARY</div>
              <div style={{fontSize:16, fontWeight:800, marginTop:4}}>{current.name}</div>
              <div style={{fontSize:11, opacity:.85, fontFamily:'var(--ff-mono)', marginTop:2}}>{current.area} · ★ {current.rating}</div>
            </div>
            <div style={{padding:'18px 20px'}}>
              <div style={{display:'flex', flexDirection:'column', gap:10, marginBottom:14}}>
                {[
                  {l:'날짜', v:date},
                  {l:'시간', v: slot ? `${slot} (${dur}시간)` : '선택 필요', missing: !slot},
                  {l:'목적', v: {pickup:'픽업경기', team:'팀 훈련', scrim:'스크림', private:'개인 연습'}[purpose]},
                  {l:'시설', v: current.fac.join(' · ')},
                ].map(r => (
                  <div key={r.l} style={{display:'flex', justifyContent:'space-between', fontSize:12, gap:10}}>
                    <span style={{color:'var(--ink-dim)', fontWeight:700}}>{r.l}</span>
                    <span style={{fontWeight: r.missing?600:700, fontFamily: r.l==='날짜'||r.l==='시간'?'var(--ff-mono)':'inherit', color: r.missing?'var(--err)':'var(--ink)', textAlign:'right'}}>{r.v}</span>
                  </div>
                ))}
              </div>
              <div style={{borderTop:'1px dashed var(--border)', paddingTop:14, display:'flex', flexDirection:'column', gap:6, marginBottom:14, fontSize:12}}>
                <div style={{display:'flex', justifyContent:'space-between'}}>
                  <span style={{color:'var(--ink-mute)'}}>대관료 (₩{current.fee.toLocaleString()} × {dur}H)</span>
                  <span style={{fontFamily:'var(--ff-mono)'}}>₩{(current.fee*dur).toLocaleString()}</span>
                </div>
                <div style={{display:'flex', justifyContent:'space-between', color:'var(--ok)'}}>
                  <span>BDR+ 할인 (10%)</span>
                  <span style={{fontFamily:'var(--ff-mono)'}}>− ₩{Math.round(current.fee*dur*0.1).toLocaleString()}</span>
                </div>
              </div>
              <div style={{borderTop:'1px solid var(--border)', paddingTop:14, display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:14}}>
                <span style={{fontSize:12, fontWeight:700}}>결제금액</span>
                <span style={{fontFamily:'var(--ff-display)', fontSize:26, fontWeight:900, color:'var(--accent)'}}>₩{Math.round(total*0.9).toLocaleString()}</span>
              </div>
              <button className="btn btn--primary btn--xl" style={{width:'100%'}} onClick={()=>slot && setRoute('checkout')} disabled={!slot}>
                {slot ? '결제하고 예약 확정' : '시간을 선택해주세요'}
              </button>
              <div style={{fontSize:11, color:'var(--ink-dim)', marginTop:10, lineHeight:1.5}}>
                · 3일 전 취소 시 100% 환불<br/>
                · 2일 전 50% · 당일 환불불가<br/>
                · 현장 추가 결제 불가
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

window.CourtBooking = CourtBooking;
