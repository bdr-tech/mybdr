/* global React, Icon */

function Checkout({ setRoute }) {
  const [method, setMethod] = React.useState('card');
  const [agreed, setAgreed] = React.useState(false);
  const [processing, setProcessing] = React.useState(false);
  const [complete, setComplete] = React.useState(false);

  // Pull checkout context (falls back to default BDR Challenge tournament)
  const ctx = React.useMemo(() => {
    try {
      const raw = sessionStorage.getItem('mybdr.checkout');
      if (raw) return JSON.parse(raw);
    } catch(e) {}
    return {
      title: 'BDR CHALLENGE SPRING 2026',
      subtitle: '서울 3x3 오픈 챔피언십 · 팀 참가비',
      fee: '₩80,000',
      feeNum: 80000,
      code: 'BDR-T-00412',
      kind: 'tournament',
    };
  }, []);
  const feeNum = ctx.feeNum || parseInt((ctx.fee || '₩0').replace(/[^\d]/g,''), 10) || 0;
  const serviceFee = Math.floor(feeNum * 0.03);
  const memberDiscount = ctx.kind === 'tournament' ? Math.floor(feeNum * 0.1) : 0;
  const total = feeNum + serviceFee - memberDiscount;

  const pay = () => {
    if (!agreed || processing) return;
    setProcessing(true);
    setTimeout(() => { setProcessing(false); setComplete(true); }, 1400);
  };

  if (complete) {
    return (
      <div className="page" style={{maxWidth:640}}>
        <div className="card" style={{padding:'48px 40px', textAlign:'center'}}>
          <div style={{width:80, height:80, margin:'0 auto 20px', borderRadius:'50%', background:'var(--ok)', color:'#fff', display:'grid', placeItems:'center', fontSize:40, fontWeight:800}}>✓</div>
          <h1 style={{margin:'0 0 8px', fontSize:28, fontWeight:800, letterSpacing:'-0.015em'}}>결제 완료</h1>
          <p style={{margin:'0 0 24px', color:'var(--ink-mute)', fontSize:14}}>
            {ctx.title} 참가 신청이 확정되었습니다. 확정 이메일과 QR 티켓이 발송됩니다.
          </p>
          <div style={{padding:'18px 20px', background:'var(--bg-alt)', borderRadius:8, marginBottom:24, textAlign:'left', display:'grid', gridTemplateColumns:'auto 1fr', gap:'10px 16px', fontSize:13}}>
            <span style={{color:'var(--ink-dim)'}}>예약번호</span><span style={{fontFamily:'var(--ff-mono)', fontWeight:700}}>{ctx.code}</span>
            <span style={{color:'var(--ink-dim)'}}>결제수단</span><span style={{fontWeight:600}}>{methodLabel(method)}</span>
            <span style={{color:'var(--ink-dim)'}}>결제금액</span><span style={{fontFamily:'var(--ff-mono)', fontWeight:800, color:'var(--accent)'}}>{formatWon(total)}</span>
            <span style={{color:'var(--ink-dim)'}}>결제일시</span><span style={{fontFamily:'var(--ff-mono)'}}>2026.04.23 14:32</span>
          </div>
          <div style={{display:'flex', gap:10, justifyContent:'center'}}>
            <button className="btn btn--lg" onClick={()=>setRoute('mygames')}>내 신청 내역</button>
            <button className="btn btn--primary btn--lg" onClick={()=>setRoute('home')}>홈으로</button>
          </div>
          <div style={{marginTop:20, fontSize:11, color:'var(--ink-dim)'}}>
            영수증은 등록된 이메일로 발송됩니다. 문의: <a href="#">bdr.wonyoung@gmail.com</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div style={{display:'flex', gap:6, fontSize:12, color:'var(--ink-mute)', marginBottom:12}}>
        <a onClick={()=>setRoute('home')} style={{cursor:'pointer'}}>홈</a>
        <span>›</span>
        <a onClick={()=>setRoute('mygames')} style={{cursor:'pointer'}}>내 신청 내역</a>
        <span>›</span>
        <span style={{color:'var(--ink)'}}>결제</span>
      </div>

      <h1 style={{margin:'0 0 8px', fontSize:28, fontWeight:800, letterSpacing:'-0.015em'}}>결제하기</h1>
      <p style={{margin:'0 0 24px', color:'var(--ink-mute)', fontSize:14}}>안전하게 암호화된 결제 시스템을 사용합니다. · PG사: 토스페이먼츠</p>

      <div style={{display:'grid', gridTemplateColumns:'minmax(0, 1fr) 360px', gap:24, alignItems:'flex-start'}}>
        <div style={{display:'flex', flexDirection:'column', gap:14}}>
          {/* Step 1 · Item */}
          <div className="card" style={{padding:'20px 22px'}}>
            <Step n="1" title="결제 대상 확인"/>
            <div style={{display:'grid', gridTemplateColumns:'72px 1fr', gap:14, padding:'14px 14px', background:'var(--bg-alt)', borderRadius:6, marginTop:12}}>
              <div style={{width:72, height:72, borderRadius:6, background:`linear-gradient(135deg, var(--accent), #3A0608)`, color:'#fff', display:'grid', placeItems:'center', fontFamily:'var(--ff-display)', fontWeight:900, fontSize:11, letterSpacing:'.1em', textAlign:'center', padding:8}}>
                {ctx.kind === 'tournament' ? 'TOURN.' : 'GAME'}
              </div>
              <div style={{minWidth:0}}>
                <div style={{fontWeight:700, fontSize:15}}>{ctx.title}</div>
                {ctx.subtitle && <div style={{fontSize:12, color:'var(--ink-mute)', marginTop:2}}>{ctx.subtitle}</div>}
                <div style={{fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)', marginTop:6}}>{ctx.code}</div>
              </div>
            </div>
          </div>

          {/* Step 2 · Payer */}
          <div className="card" style={{padding:'20px 22px'}}>
            <Step n="2" title="결제자 정보"/>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:12}}>
              <div>
                <label className="label">이름</label>
                <input className="input" defaultValue="rdm_captain"/>
              </div>
              <div>
                <label className="label">연락처</label>
                <input className="input" defaultValue="010-****-5821"/>
              </div>
              <div style={{gridColumn:'1/-1'}}>
                <label className="label">이메일 (영수증 수신)</label>
                <input className="input" defaultValue="rdm.captain@bdr.co.kr"/>
              </div>
            </div>
          </div>

          {/* Step 3 · Payment method */}
          <div className="card" style={{padding:'20px 22px'}}>
            <Step n="3" title="결제 수단 선택"/>
            <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:8, marginTop:12}}>
              {[
                { id:'card',    label:'신용·체크카드', icon:'💳' },
                { id:'transfer',label:'계좌이체',      icon:'🏦' },
                { id:'toss',    label:'토스페이',      icon:'T' },
                { id:'kakao',   label:'카카오페이',    icon:'K' },
              ].map(m => (
                <button key={m.id} onClick={()=>setMethod(m.id)} style={{
                  padding:'14px 10px', textAlign:'center',
                  border: method===m.id ? '2px solid var(--cafe-blue)' : '1px solid var(--border)',
                  background: method===m.id ? 'var(--cafe-blue-soft)' : 'var(--bg-elev)',
                  borderRadius:8, cursor:'pointer',
                  fontWeight: method===m.id ? 700 : 500,
                  color: method===m.id ? 'var(--cafe-blue-deep)' : 'var(--ink-soft)',
                  fontSize:13,
                }}>
                  <div style={{fontSize:24, marginBottom:4, fontFamily: m.id==='toss'||m.id==='kakao' ? 'var(--ff-display)' : 'inherit', fontWeight: m.id==='toss'||m.id==='kakao' ? 900 : 400, color: m.id==='toss' ? '#0064FF' : m.id==='kakao' ? '#FEE500' : undefined}}>
                    {m.icon}
                  </div>
                  {m.label}
                </button>
              ))}
            </div>

            {/* Card form */}
            {method === 'card' && (
              <div style={{marginTop:16, display:'grid', gridTemplateColumns:'1fr', gap:10}}>
                <div>
                  <label className="label">카드번호</label>
                  <input className="input" placeholder="1234  5678  9012  3456" style={{fontFamily:'var(--ff-mono)', letterSpacing:'.08em'}}/>
                </div>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1.5fr', gap:10}}>
                  <div><label className="label">유효기간</label><input className="input" placeholder="MM/YY"/></div>
                  <div><label className="label">CVC</label><input className="input" placeholder="•••"/></div>
                  <div>
                    <label className="label">할부</label>
                    <select className="select">
                      <option>일시불</option><option>2개월 무이자</option><option>3개월 무이자</option><option>6개월</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
            {method === 'transfer' && (
              <div style={{marginTop:16, padding:'14px 16px', background:'var(--bg-alt)', borderRadius:6, fontSize:13, color:'var(--ink-soft)'}}>
                결제 버튼 클릭 시 가상계좌가 발급됩니다. 24시간 이내 입금 시 자동 확정됩니다.
              </div>
            )}
            {(method === 'toss' || method === 'kakao') && (
              <div style={{marginTop:16, padding:'14px 16px', background:'var(--bg-alt)', borderRadius:6, fontSize:13, color:'var(--ink-soft)'}}>
                결제 버튼 클릭 시 {method==='toss' ? '토스' : '카카오페이'} 결제창이 열립니다.
              </div>
            )}
          </div>

          {/* Step 4 · Agreements */}
          <div className="card" style={{padding:'20px 22px'}}>
            <Step n="4" title="약관 동의"/>
            <div style={{marginTop:12, display:'flex', flexDirection:'column', gap:8}}>
              <label style={{display:'flex', gap:8, alignItems:'center', fontSize:13.5, fontWeight:700, padding:'8px 10px', background:'var(--bg-alt)', borderRadius:6, cursor:'pointer'}}>
                <input type="checkbox" checked={agreed} onChange={e=>setAgreed(e.target.checked)}/>
                <span>전체 약관에 동의합니다</span>
              </label>
              {[
                '(필수) 결제 대행 서비스 약관',
                '(필수) 개인정보 제3자 제공 동의 (PG사)',
                '(필수) 대회 참가 규정 및 취소·환불 정책',
                '(선택) 마케팅 정보 수신 동의',
              ].map((t,i) => (
                <div key={i} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 12px', fontSize:12.5, color:'var(--ink-mute)'}}>
                  <span style={{display:'flex', gap:8, alignItems:'center'}}>
                    <span style={{color: agreed ? 'var(--ok)' : 'var(--ink-dim)', fontWeight:700, fontSize:14}}>{agreed ? '✓' : '○'}</span>
                    {t}
                  </span>
                  <a style={{fontSize:11, color:'var(--link)', cursor:'pointer'}}>보기</a>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Summary */}
        <aside style={{position:'sticky', top:120}}>
          <div className="card" style={{padding:0, overflow:'hidden'}}>
            <div style={{padding:'18px 20px', borderBottom:'1px solid var(--border)'}}>
              <div style={{fontSize:11, color:'var(--accent)', fontWeight:800, letterSpacing:'.1em'}}>주문 요약</div>
              <div style={{fontSize:16, fontWeight:700, marginTop:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{ctx.title}</div>
            </div>
            <div style={{padding:'18px 20px', fontSize:13.5, display:'flex', flexDirection:'column', gap:10}}>
              <Line label="참가비" value={formatWon(feeNum)}/>
              <Line label="결제 수수료 (3%)" value={formatWon(serviceFee)} mute/>
              {memberDiscount > 0 && (
                <Line label={<>BDR+ 멤버 할인 <span className="badge badge--soft" style={{marginLeft:4}}>10%</span></>} value={`-${formatWon(memberDiscount)}`} accent/>
              )}
              <div style={{height:1, background:'var(--border)', margin:'4px 0'}}/>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline'}}>
                <span style={{fontSize:14, fontWeight:700}}>최종 결제금액</span>
                <span style={{fontFamily:'var(--ff-display)', fontWeight:900, fontSize:26, letterSpacing:'-0.01em', color:'var(--accent)'}}>{formatWon(total)}</span>
              </div>
            </div>
            <div style={{padding:'16px 20px', background:'var(--bg-alt)', borderTop:'1px solid var(--border)'}}>
              <button className="btn btn--primary btn--xl"
                disabled={!agreed || processing}
                onClick={pay}
                style={{opacity: (!agreed || processing) ? .6 : 1}}
              >
                {processing ? '결제 처리 중...' : `${formatWon(total)} 결제하기`}
              </button>
              <div style={{fontSize:11, color:'var(--ink-dim)', textAlign:'center', marginTop:10, lineHeight:1.5}}>
                🔒 결제 정보는 암호화되어 전송됩니다<br/>
                결제 후 취소는 [내 신청 내역]에서 가능합니다
              </div>
            </div>
          </div>

          {/* Trust badges */}
          <div style={{display:'flex', justifyContent:'center', gap:16, marginTop:16, fontSize:10, color:'var(--ink-dim)', textAlign:'center'}}>
            <div>🔒 SSL<br/>256-bit</div>
            <div>✓ PG<br/>등록</div>
            <div>✓ 에스크로<br/>가입</div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Step({ n, title }) {
  return (
    <div style={{display:'flex', alignItems:'center', gap:10}}>
      <div style={{width:24, height:24, borderRadius:'50%', background:'var(--cafe-blue)', color:'#fff', display:'grid', placeItems:'center', fontSize:12, fontWeight:800, fontFamily:'var(--ff-mono)'}}>{n}</div>
      <div style={{fontSize:15, fontWeight:700}}>{title}</div>
    </div>
  );
}

function Line({ label, value, mute, accent }) {
  return (
    <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline'}}>
      <span style={{color: mute ? 'var(--ink-mute)' : 'var(--ink-soft)'}}>{label}</span>
      <span style={{fontFamily:'var(--ff-mono)', fontWeight:600, color: accent ? 'var(--ok)' : mute ? 'var(--ink-mute)' : 'var(--ink)'}}>{value}</span>
    </div>
  );
}

function formatWon(n) {
  return '₩' + n.toLocaleString('ko-KR');
}
function methodLabel(m) {
  return { card:'신용카드', transfer:'계좌이체', toss:'토스페이', kakao:'카카오페이' }[m] || m;
}

window.Checkout = Checkout;
