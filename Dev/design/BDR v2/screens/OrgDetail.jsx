/* global React, ORGS, TEAMS, TOURNAMENTS, Icon, Avatar */

function OrgDetail({ setRoute }) {
  const o = ORGS[0];
  const [tab, setTab] = React.useState('overview');

  return (
    <div className="page">
      <div style={{display:'flex', gap:6, fontSize:12, color:'var(--ink-mute)', marginBottom:12}}>
        <a onClick={()=>setRoute('home')} style={{cursor:'pointer'}}>홈</a>
        <span>›</span>
        <a onClick={()=>setRoute('orgs')} style={{cursor:'pointer'}}>단체</a>
        <span>›</span>
        <span style={{color:'var(--ink)'}}>{o.name}</span>
      </div>

      <div style={{background:`linear-gradient(135deg, ${o.color}, ${o.color}AA 60%, #0B0D10)`, color:'#fff', padding:'36px 32px', borderRadius:'var(--radius-card)', position:'relative', overflow:'hidden', marginBottom:20}}>
        <div style={{display:'flex', alignItems:'flex-end', gap:20, flexWrap:'wrap'}}>
          <Avatar src={o.logo} tag={o.tag} name={o.name} color="rgba(255,255,255,0.18)" ink="#fff" size={96} radius={10}/>
          <div style={{flex:1, minWidth:0}}>
            <div style={{fontSize:11, letterSpacing:'.12em', fontWeight:800, opacity:.85}}>{o.kind} · {o.area}</div>
            <h1 className="t-display" style={{margin:'6px 0 4px', fontSize:40, letterSpacing:'-0.02em'}}>{o.name}</h1>
            <div style={{fontSize:14, opacity:.9, marginBottom:10}}>{o.desc}</div>
            <div style={{display:'flex', gap:18, fontSize:13, opacity:.9, flexWrap:'wrap'}}>
              <span>👥 회원 {o.members}명</span>
              <span>🏀 팀 {o.teams}개</span>
              <span>📅 설립 2022년</span>
            </div>
          </div>
          <button className="btn btn--primary">가입 신청</button>
        </div>
      </div>

      <div style={{display:'flex', borderBottom:'2px solid var(--border)', marginBottom:20}}>
        {[['overview','소개'],['teams','소속팀'],['events','대회·이벤트'],['members','임원진']].map(([k,l]) => (
          <button key={k} onClick={()=>setTab(k)} style={{
            padding:'12px 18px', background:'transparent', border:0,
            borderBottom: tab===k ? '3px solid var(--cafe-blue)' : '3px solid transparent',
            color: tab===k ? 'var(--ink)' : 'var(--ink-mute)',
            fontWeight: tab===k ? 700 : 500, fontSize:14, cursor:'pointer', marginBottom:-2,
          }}>{l}</button>
        ))}
      </div>

      {tab === 'overview' && (
        <div style={{display:'grid', gridTemplateColumns:'minmax(0,1fr) 300px', gap:20}}>
          <div className="card" style={{padding:'24px 26px'}}>
            <h2 style={{margin:'0 0 12px', fontSize:18, fontWeight:700}}>단체 소개</h2>
            <p style={{color:'var(--ink-soft)', lineHeight:1.75, margin:'0 0 14px'}}>
              서울바스켓은 2022년 강남·서초·송파 3개 구의 아마추어 팀들이 모여 결성한 주간 리그입니다.
              현재 12개 팀이 참여하며, 매주 월·수·금 저녁에 정규 경기를 치릅니다. 시즌은 봄·가을 2개로 운영되며,
              시즌 종료 후 상위 4개 팀이 플레이오프를 진행합니다.
            </p>
            <h3 style={{margin:'20px 0 10px', fontSize:15, fontWeight:700}}>운영 원칙</h3>
            <ul style={{margin:0, paddingLeft:20, color:'var(--ink-soft)', lineHeight:1.8}}>
              <li>모든 경기는 FIBA 규정을 따릅니다.</li>
              <li>선수 등록 시 아마추어 자격 증빙이 필요합니다.</li>
              <li>심판은 자격증 보유자만 배정됩니다.</li>
              <li>리그 운영비는 회비와 스폰서십으로 충당됩니다.</li>
            </ul>
          </div>
          <div style={{display:'flex', flexDirection:'column', gap:12}}>
            <div className="card" style={{padding:'18px 20px'}}>
              <div style={{fontWeight:700, fontSize:14, marginBottom:10}}>연락처</div>
              <div style={{fontSize:13, color:'var(--ink-soft)', lineHeight:1.8}}>
                <div>📧 seoulbasket@bdr.kr</div>
                <div>📱 010-2345-6789</div>
                <div>🏢 서울 강남구 테헤란로 101</div>
              </div>
            </div>
            <div className="card" style={{padding:'18px 20px'}}>
              <div style={{fontWeight:700, fontSize:14, marginBottom:10}}>주요 스폰서</div>
              <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
                {['NIKE','ADIDAS','MOLTEN','BDR'].map(s => (
                  <span key={s} style={{padding:'6px 10px', background:'var(--bg-alt)', fontFamily:'var(--ff-mono)', fontSize:11, fontWeight:700, borderRadius:3}}>{s}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'teams' && (
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))', gap:12}}>
          {TEAMS.slice(0, 8).map(t => (
            <div key={t.id} className="card" style={{padding:'14px 16px', display:'flex', alignItems:'center', gap:12, cursor:'pointer'}} onClick={()=>setRoute('teamDetail')}>
              <span style={{width:40, height:40, background:t.color, color:t.ink, display:'grid', placeItems:'center', fontFamily:'var(--ff-mono)', fontSize:12, fontWeight:700, borderRadius:4}}>{t.tag}</span>
              <div style={{flex:1, minWidth:0}}>
                <div style={{fontWeight:700, fontSize:14}}>{t.name}</div>
                <div style={{fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>{t.wins}W {t.losses}L · {t.rating}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'events' && (
        <div style={{display:'flex', flexDirection:'column', gap:10}}>
          {TOURNAMENTS.slice(0, 4).map(t => (
            <div key={t.id} className="card" style={{padding:'14px 18px', display:'grid', gridTemplateColumns:'60px 1fr auto', gap:14, alignItems:'center', cursor:'pointer'}} onClick={()=>setRoute('matchDetail')}>
              <div style={{fontFamily:'var(--ff-display)', fontSize:11, fontWeight:900, color:t.accent}}>{t.level}</div>
              <div>
                <div style={{fontWeight:700}}>{t.title} <span style={{color:'var(--ink-mute)', fontSize:12}}>{t.edition}</span></div>
                <div style={{fontSize:12, color:'var(--ink-dim)', marginTop:2}}>{t.dates} · {t.court}</div>
              </div>
              <button className="btn btn--sm">상세</button>
            </div>
          ))}
        </div>
      )}

      {tab === 'members' && (
        <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12}}>
          {[
            { name:'김대표', role:'회장', since:'2022' },
            { name:'이부장', role:'부회장', since:'2023' },
            { name:'박총무', role:'총무', since:'2023' },
            { name:'최심판', role:'심판장', since:'2024' },
          ].map(m => (
            <div key={m.name} className="card" style={{padding:'18px 16px', textAlign:'center'}}>
              <div style={{width:64, height:64, margin:'0 auto 10px', background:'var(--ink-soft)', color:'var(--bg)', borderRadius:'50%', display:'grid', placeItems:'center', fontWeight:700, fontSize:20}}>{m.name[0]}</div>
              <div style={{fontWeight:700, fontSize:14}}>{m.name}</div>
              <div style={{fontSize:12, color:'var(--accent)', fontWeight:600, marginTop:2}}>{m.role}</div>
              <div style={{fontSize:11, color:'var(--ink-dim)', marginTop:4, fontFamily:'var(--ff-mono)'}}>since {m.since}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

window.OrgDetail = OrgDetail;
