/* global React, GLOSSARY, HELP_FAQ, Icon */

function Help({ setRoute }) {
  const [tab, setTab] = React.useState('faq');
  const [q, setQ] = React.useState('');
  const filtered = GLOSSARY.filter(g => !q || g.term.toLowerCase().includes(q.toLowerCase()) || g.desc.includes(q));
  return (
    <div className="page">
      <div style={{maxWidth:820, margin:'0 auto'}}>
        <div style={{textAlign:'center', marginBottom:28}}>
          <div className="eyebrow" style={{justifyContent:'center'}}>도움말 · HELP</div>
          <h1 style={{margin:'10px 0 10px', fontSize:32, fontWeight:800, letterSpacing:'-0.02em'}}>무엇을 도와드릴까요?</h1>
          <div style={{position:'relative', maxWidth:520, margin:'18px auto 0'}}>
            <Icon.search style={{position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'var(--ink-dim)'}}/>
            <input className="input" placeholder="용어·FAQ 검색 (예: 픽업, 레이팅)" value={q} onChange={e=>setQ(e.target.value)} style={{paddingLeft:38, height:44, fontSize:15}}/>
          </div>
        </div>

        <div style={{display:'flex', gap:4, marginBottom:20, borderBottom:'1px solid var(--border)', justifyContent:'center'}}>
          {[['faq','자주 묻는 질문'],['glossary','용어집'],['policy','정책']].map(([k,l]) => (
            <button key={k} onClick={()=>setTab(k)} style={{
              padding:'12px 20px', background:'transparent', border:0,
              borderBottom: tab===k ? '3px solid var(--cafe-blue)' : '3px solid transparent',
              color: tab===k ? 'var(--ink)' : 'var(--ink-mute)',
              fontWeight: tab===k ? 700 : 500, fontSize:14, cursor:'pointer', marginBottom:-1,
            }}>{l}</button>
          ))}
        </div>

        {tab === 'faq' && (
          <div className="card" style={{padding:0, overflow:'hidden'}}>
            {HELP_FAQ.map((f, i) => (
              <details key={i} style={{borderBottom: i < HELP_FAQ.length-1 ? '1px solid var(--border)' : 0}}>
                <summary style={{padding:'18px 22px', cursor:'pointer', fontWeight:600, fontSize:15, display:'flex', alignItems:'center', gap:10}}>
                  <span style={{color:'var(--accent)', fontFamily:'var(--ff-mono)', fontWeight:700}}>Q{i+1}.</span>
                  {f.q}
                </summary>
                <div style={{padding:'0 22px 18px 48px', color:'var(--ink-soft)', lineHeight:1.7, fontSize:14}}>{f.a}</div>
              </details>
            ))}
          </div>
        )}

        {tab === 'glossary' && (
          <div className="card" style={{padding:0, overflow:'hidden'}}>
            {filtered.map((g, i) => (
              <div key={i} style={{display:'grid', gridTemplateColumns:'200px 1fr', padding:'14px 22px', borderBottom: i < filtered.length-1 ? '1px solid var(--border)' : 0, gap:16, alignItems:'baseline'}}>
                <div style={{fontWeight:700, fontSize:14}}>{g.term}</div>
                <div style={{fontSize:13.5, color:'var(--ink-soft)', lineHeight:1.6}}>{g.desc}</div>
              </div>
            ))}
            {filtered.length === 0 && <div style={{padding:40, textAlign:'center', color:'var(--ink-dim)'}}>검색 결과가 없습니다</div>}
          </div>
        )}

        {tab === 'policy' && (
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14}}>
            {[
              ['이용약관','커뮤니티 참여, 경기·대회 신청·취소 규정 전반'],
              ['개인정보처리방침','수집 항목, 보관 기간, 제3자 제공 여부'],
              ['운영정책','게시물 관리, 제재 기준, 이의 제기 절차'],
              ['환불규정','대회 참가비, 멤버십 결제 환불 기준'],
              ['광고·제휴 문의','브랜드 제휴, 배너 광고, 코트 스폰서십'],
              ['저작권 안내','이미지·영상 사용, 무단 전재 금지 조항'],
            ].map(([t, d]) => (
              <a key={t} className="card" style={{padding:'18px 20px', cursor:'pointer'}}>
                <div style={{fontWeight:700, fontSize:15, marginBottom:4}}>{t}</div>
                <div style={{fontSize:12, color:'var(--ink-mute)'}}>{d}</div>
              </a>
            ))}
          </div>
        )}

        <div className="card" style={{padding:'20px 24px', marginTop:24, display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, flexWrap:'wrap'}}>
          <div>
            <div style={{fontWeight:700, fontSize:15}}>여전히 해결이 안 되시나요?</div>
            <div style={{fontSize:13, color:'var(--ink-mute)', marginTop:4}}>운영팀이 평일 10–19시에 답변드립니다</div>
          </div>
          <button className="btn btn--primary">1:1 문의하기</button>
        </div>
      </div>
    </div>
  );
}

window.Help = Help;
