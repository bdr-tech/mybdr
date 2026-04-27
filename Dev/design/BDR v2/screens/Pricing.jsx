/* global React, PRICING, Icon */

function Pricing({ setRoute }) {
  const [cycle, setCycle] = React.useState('monthly');
  return (
    <div className="page">
      <div style={{textAlign:'center', marginBottom:36, maxWidth:720, margin:'0 auto 36px'}}>
        <div className="eyebrow" style={{justifyContent:'center'}}>요금제 · PRICING</div>
        <h1 style={{margin:'10px 0 10px', fontSize:36, fontWeight:800, letterSpacing:'-0.02em'}}>
          더 자주 뛰는 사람들을 위한 <span style={{color:'var(--accent)'}}>BDR+</span>
        </h1>
        <p style={{margin:0, color:'var(--ink-mute)', fontSize:15, lineHeight:1.6}}>
          기본 기능은 언제나 무료. 대회 우선 접수·상세 스탯·팀 확장이 필요할 때만 업그레이드하세요.
        </p>
        <div className="theme-switch" style={{marginTop:20}}>
          <button className="theme-switch__btn" data-active={cycle==='monthly'} onClick={()=>setCycle('monthly')}>월간</button>
          <button className="theme-switch__btn" data-active={cycle==='yearly'} onClick={()=>setCycle('yearly')}>연간 <span style={{color:'var(--ok)', fontWeight:700, marginLeft:4}}>2개월 할인</span></button>
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:16, maxWidth:1080, margin:'0 auto'}}>
        {PRICING.map(p => (
          <div key={p.id} className="card" style={{
            padding:'28px 26px 26px',
            border: p.highlight ? '2px solid var(--accent)' : undefined,
            position:'relative',
            transform: p.highlight ? 'translateY(-8px)' : 'none',
            boxShadow: p.highlight ? 'var(--sh-lg)' : undefined,
          }}>
            {p.highlight && (
              <div style={{
                position:'absolute', top:-11, left:'50%', transform:'translateX(-50%)',
                background:'var(--accent)', color:'#fff', padding:'4px 12px',
                fontSize:11, fontWeight:800, letterSpacing:'.08em', textTransform:'uppercase',
                borderRadius:99,
              }}>가장 인기</div>
            )}
            <div style={{fontFamily:'var(--ff-display)', fontWeight:900, fontSize:20, letterSpacing:'.04em', color: p.highlight ? 'var(--accent)' : 'var(--ink)'}}>{p.name}</div>
            <div style={{fontSize:13, color:'var(--ink-mute)', marginTop:6, marginBottom:18, minHeight:36}}>{p.tagline}</div>
            <div style={{display:'flex', alignItems:'baseline', gap:6, marginBottom:20}}>
              <span style={{fontFamily:'var(--ff-display)', fontSize:40, fontWeight:900, letterSpacing:'-0.02em'}}>
                {cycle === 'yearly' && p.id !== 'free' && p.id !== 'pro' ? '₩3,900' : p.price}
              </span>
              <span style={{fontSize:13, color:'var(--ink-dim)'}}>{p.subprice}</span>
            </div>
            <button className={`btn ${p.highlight ? 'btn--accent' : ''} btn--xl`} style={{marginBottom:20}}>{p.cta}</button>
            <ul style={{margin:0, padding:0, listStyle:'none', display:'flex', flexDirection:'column', gap:10}}>
              {p.features.map((f,i) => (
                <li key={i} style={{display:'flex', gap:10, fontSize:13.5, color:'var(--ink-soft)', lineHeight:1.5}}>
                  <span style={{color: p.highlight ? 'var(--accent)' : 'var(--ok)', fontWeight:700, flexShrink:0}}>✓</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Comparison table */}
      <div style={{maxWidth:1080, margin:'50px auto 0'}}>
        <h2 style={{fontSize:22, fontWeight:700, letterSpacing:'-0.015em', marginBottom:18}}>상세 비교</h2>
        <div className="board">
          <div className="board__head" style={{gridTemplateColumns:'1.6fr 1fr 1fr 1fr'}}>
            <div style={{textAlign:'left'}}>기능</div><div>FREE</div><div>BDR+</div><div>PRO</div>
          </div>
          {[
            ['팀 등록 개수', '1', '3', '무제한'],
            ['대회 우선 접수', '–', '12시간 먼저', '24시간 먼저'],
            ['상세 스탯·리플레이', '–', '○', '○'],
            ['광고 제거', '–', '○', '○'],
            ['리그 운영 대시보드', '–', '–', '○'],
            ['심판·기록 시스템', '–', '–', '○'],
            ['전용 CS 라인', '–', '–', '○'],
          ].map((row, i) => (
            <div key={i} className="board__row" style={{gridTemplateColumns:'1.6fr 1fr 1fr 1fr', cursor:'default'}}>
              <div className="title" style={{fontWeight:600}}>{row[0]}</div>
              <div>{row[1]}</div><div style={{fontWeight:700, color: row[2] === '○' ? 'var(--accent)' : 'var(--ink)'}}>{row[2]}</div><div style={{fontWeight:700}}>{row[3]}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{textAlign:'center', marginTop:50, fontSize:13, color:'var(--ink-mute)'}}>
        결제 문의 · <a href="mailto:bdr.wonyoung@gmail.com">bdr.wonyoung@gmail.com</a> · 기업·단체 요금은 별도 문의
      </div>
    </div>
  );
}

window.Pricing = Pricing;
