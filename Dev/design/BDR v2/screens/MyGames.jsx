/* global React, GAMES, TOURNAMENTS, TEAMS, Icon */

function MyGames({ setRoute }) {
  const [tab, setTab] = React.useState('upcoming');
  const [justApplied, setJustApplied] = React.useState(false);

  // dismiss confirmation after 12s
  React.useEffect(() => {
    const flag = sessionStorage.getItem('mybdr.justApplied');
    if (flag) {
      setJustApplied(true);
      sessionStorage.removeItem('mybdr.justApplied');
    }
  }, []);

  // Build registrations from existing games/tournaments
  const upcoming = [
    {
      id: 'r1', kind: 'game', ref: GAMES[0],
      status: 'confirmed', role: 'player', paid: true, fee: '₩5,000',
      applied: '2026.04.22', code: 'BDR-G-47821',
      note: '목요일 오랜만에 뛰러 갑니다!',
    },
    {
      id: 'r2', kind: 'tournament', ref: TOURNAMENTS[0],
      status: 'confirmed', role: 'team-captain', paid: true, fee: '₩80,000',
      applied: '2026.04.20', code: 'BDR-T-00412',
      teamName: 'REDEEM', teamSize: 4,
      note: null,
    },
    {
      id: 'r3', kind: 'game', ref: GAMES[1],
      status: 'pending', role: 'guest', paid: false, fee: '₩8,000',
      applied: '2026.04.23', code: 'BDR-G-47905',
      note: '포워드 가능합니다. 게스트 경험 3회 있습니다.',
    },
    {
      id: 'r4', kind: 'game', ref: GAMES[3],
      status: 'waitlist', role: 'player', paid: false, fee: '₩6,000',
      applied: '2026.04.23', code: 'BDR-G-47906', waitlistNum: 2,
      note: null,
    },
  ];

  const past = [
    {
      id: 'p1', kind: 'game',
      ref: { title: '수요일 반포 주말 오전 3x3', court: '반포종합사회복지관', area: '서초구', date: '2026.04.19 (토)', time: '09:00 – 11:30' },
      status: 'completed', result: '2승 1패', mvp: false, code: 'BDR-G-47512',
    },
    {
      id: 'p2', kind: 'tournament',
      ref: { title: 'KINGS CUP VOL.06', edition: 'VOL.06', court: '올림픽체조경기장', dates: '2026.03.15' },
      status: 'completed', result: '8강 탈락', teamName: 'REDEEM', code: 'BDR-T-00391',
    },
    {
      id: 'p3', kind: 'game',
      ref: { title: '[SWEEP] 성수동 5v5', court: '성동구민체육관', area: '성동구', date: '2026.04.05 (토)', time: '13:00 – 15:00' },
      status: 'no-show', code: 'BDR-G-47301',
    },
  ];

  const cancelled = [
    {
      id: 'c1', kind: 'game',
      ref: { title: '의정부 토요일 오후 픽업', court: '회룡역사거리 농구장', date: '2026.04.11' },
      status: 'cancelled', cancelledAt: '2026.04.10 18:32', refund: '₩5,000 환불완료',
      reason: '개인 사정 (본인 취소)', code: 'BDR-G-47188',
    },
  ];

  const list = tab === 'upcoming' ? upcoming : tab === 'past' ? past : cancelled;
  const counts = { upcoming: upcoming.length, past: past.length, cancelled: cancelled.length };

  return (
    <div className="page">
      {/* breadcrumb */}
      <div style={{display:'flex', gap:6, fontSize:12, color:'var(--ink-mute)', marginBottom:12}}>
        <a onClick={()=>setRoute('home')} style={{cursor:'pointer'}}>홈</a>
        <span>›</span>
        <a onClick={()=>setRoute('profile')} style={{cursor:'pointer'}}>마이페이지</a>
        <span>›</span>
        <span style={{color:'var(--ink)'}}>내 신청 내역</span>
      </div>

      {/* Just-applied banner (if arrived via signup flow) */}
      {justApplied && (
        <div className="card" style={{padding:'20px 22px', marginBottom:20, background:'var(--cafe-blue-soft)', borderColor:'var(--cafe-blue-hair)', display:'flex', alignItems:'center', gap:16}}>
          <div style={{width:48, height:48, borderRadius:'50%', background:'var(--cafe-blue)', color:'#fff', display:'grid', placeItems:'center', flexShrink:0, fontSize:24, fontWeight:800}}>✓</div>
          <div style={{flex:1}}>
            <div style={{fontWeight:800, fontSize:15, color:'var(--cafe-blue-deep)'}}>신청이 완료되었습니다</div>
            <div style={{fontSize:12.5, color:'var(--ink-soft)', marginTop:2}}>호스트 확인 후 확정 알림이 발송됩니다. 보통 24시간 이내에 처리됩니다.</div>
          </div>
          <button className="btn btn--sm" onClick={()=>setJustApplied(false)}>확인</button>
        </div>
      )}

      <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:8}}>
        <h1 style={{margin:0, fontSize:28, fontWeight:800, letterSpacing:'-0.015em'}}>내 신청 내역</h1>
        <div style={{fontSize:12, color:'var(--ink-dim)'}}>
          총 <b style={{color:'var(--ink)'}}>{upcoming.length + past.length + cancelled.length}</b>건
        </div>
      </div>
      <p style={{margin:'0 0 20px', color:'var(--ink-mute)', fontSize:14}}>
        경기·대회 신청 현황과 결제 내역을 한눈에 관리하세요.
      </p>

      {/* Quick stats */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12, marginBottom:20}}>
        {[
          { label:'예정된 경기', value: upcoming.filter(r=>r.status==='confirmed').length, sub:'확정' },
          { label:'승인 대기', value: upcoming.filter(r=>r.status==='pending').length, sub:'호스트 응답 대기' },
          { label:'대기자 명단', value: upcoming.filter(r=>r.status==='waitlist').length, sub:'자리 나면 자동승인' },
          { label:'이번 달 결제', value:'₩93K', sub:'2건' },
        ].map(s => (
          <div key={s.label} className="card" style={{padding:'16px 18px'}}>
            <div style={{fontSize:11, color:'var(--ink-dim)', fontWeight:700, letterSpacing:'.04em', textTransform:'uppercase'}}>{s.label}</div>
            <div style={{fontFamily:'var(--ff-display)', fontWeight:900, fontSize:30, letterSpacing:'-0.01em', marginTop:4}}>{s.value}</div>
            <div style={{fontSize:11, color:'var(--ink-mute)', marginTop:2}}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{display:'flex', gap:2, borderBottom:'1px solid var(--border)', marginBottom:16}}>
        {[
          { id:'upcoming',  label:'예정' },
          { id:'past',      label:'지난 경기' },
          { id:'cancelled', label:'취소·환불' },
        ].map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            padding:'12px 18px', background:'transparent', border:0, cursor:'pointer',
            fontSize:14, fontWeight: tab===t.id ? 700 : 500,
            color: tab===t.id ? 'var(--cafe-blue-deep)' : 'var(--ink-mute)',
            borderBottom: tab===t.id ? '2px solid var(--cafe-blue)' : '2px solid transparent',
            marginBottom:-1,
          }}>
            {t.label} <span style={{fontSize:11, color:'var(--ink-dim)', fontWeight:500, marginLeft:4, fontFamily:'var(--ff-mono)'}}>{counts[t.id]}</span>
          </button>
        ))}
      </div>

      {/* List */}
      <div style={{display:'flex', flexDirection:'column', gap:12}}>
        {list.length === 0 && (
          <div className="card" style={{padding:'60px 20px', textAlign:'center', color:'var(--ink-dim)'}}>
            <div style={{fontSize:32, marginBottom:8}}>📭</div>
            <div style={{fontSize:14}}>해당 상태의 신청이 없습니다.</div>
          </div>
        )}
        {list.map(r => <RegRow key={r.id} r={r} setRoute={setRoute}/>)}
      </div>

      {/* Policy footnote */}
      {tab === 'upcoming' && (
        <div style={{marginTop:24, padding:'16px 18px', background:'var(--bg-alt)', borderRadius:8, fontSize:12.5, color:'var(--ink-mute)', lineHeight:1.6}}>
          <b style={{color:'var(--ink-soft)'}}>취소 정책</b> · 경기 시작 72시간 전까지 취소 시 100% 환불, 24시간 전까지 50% 환불, 이후 환불 불가.
          대회는 접수 마감 3일 전까지만 전액 환불됩니다.
          노쇼(무통보 불참) 3회 누적 시 7일간 신청이 제한됩니다.
        </div>
      )}
    </div>
  );
}

function RegRow({ r, setRoute }) {
  const statusMap = {
    confirmed: { label:'참가 확정', color:'var(--ok)', bg:'rgba(28,160,94,.1)' },
    pending:   { label:'승인 대기', color:'var(--warn)', bg:'rgba(232,163,59,.12)' },
    waitlist:  { label:'대기자', color:'var(--cafe-blue-deep)', bg:'var(--cafe-blue-soft)' },
    completed: { label:'완료',    color:'var(--ink-soft)', bg:'var(--bg-alt)' },
    'no-show': { label:'노쇼',    color:'var(--danger)', bg:'rgba(226,76,75,.1)' },
    cancelled: { label:'취소',    color:'var(--ink-dim)', bg:'var(--bg-alt)' },
  };
  const s = statusMap[r.status];
  const isTour = r.kind === 'tournament';
  const ref = r.ref;
  const [expanded, setExpanded] = React.useState(false);

  return (
    <div className="card" style={{padding:0, overflow:'hidden'}}>
      <div style={{padding:'18px 20px', display:'grid', gridTemplateColumns:'auto 1fr auto', gap:16, alignItems:'center'}}>
        {/* Date block */}
        <div style={{
          width:72, textAlign:'center', padding:'10px 6px',
          background: isTour ? 'var(--accent)' : 'var(--cafe-blue)',
          color:'#fff', borderRadius:6,
        }}>
          <div style={{fontSize:10, fontWeight:800, letterSpacing:'.1em', opacity:.85}}>{isTour ? '대회' : r.role === 'guest' ? '게스트' : '픽업'}</div>
          <div style={{fontFamily:'var(--ff-display)', fontWeight:900, fontSize:22, lineHeight:1.1, marginTop:4}}>
            {(ref.date || ref.dates || '').replace(/[^0-9.]/g,'').split('.').slice(1,3).join('.') || '--'}
          </div>
        </div>

        {/* Main */}
        <div style={{minWidth:0}}>
          <div style={{display:'flex', gap:8, alignItems:'center', marginBottom:6, flexWrap:'wrap'}}>
            <span style={{
              display:'inline-flex', alignItems:'center', gap:5,
              padding:'3px 8px', fontSize:11, fontWeight:800, letterSpacing:'.04em',
              color:s.color, background:s.bg, borderRadius:4,
            }}>
              <span style={{width:6, height:6, borderRadius:'50%', background:s.color}}/>
              {s.label}
              {r.status === 'waitlist' && r.waitlistNum && <span style={{opacity:.7}}>· {r.waitlistNum}번</span>}
            </span>
            {r.paid === false && r.status !== 'cancelled' && r.status !== 'no-show' && r.status !== 'completed' && (
              <span className="badge" style={{color:'var(--danger)', borderColor:'var(--danger)'}}>결제 필요</span>
            )}
            {r.paid && <span className="badge badge--ghost">결제완료 {r.fee}</span>}
            {r.teamName && <span className="badge badge--red">팀 {r.teamName}</span>}
          </div>
          <div style={{fontWeight:700, fontSize:15.5, color:'var(--ink)', marginBottom:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
            {ref.title}{ref.edition ? <span style={{color:'var(--ink-dim)', fontWeight:500, marginLeft:6, fontSize:13}}>{ref.edition}</span> : null}
          </div>
          <div style={{fontSize:12.5, color:'var(--ink-mute)', display:'flex', gap:12, flexWrap:'wrap'}}>
            <span>📅 {ref.date || ref.dates}{ref.time ? ` · ${ref.time}` : ''}</span>
            <span>📍 {ref.court}{ref.area ? ` · ${ref.area}` : ''}</span>
            <span style={{fontFamily:'var(--ff-mono)', color:'var(--ink-dim)'}}>{r.code}</span>
          </div>
          {r.result && (
            <div style={{marginTop:8, fontSize:12.5}}>
              <span style={{color:'var(--ink-dim)'}}>결과 · </span>
              <span style={{fontWeight:700}}>{r.result}</span>
            </div>
          )}
          {r.refund && (
            <div style={{marginTop:8, fontSize:12, color:'var(--ok)', fontWeight:600}}>✓ {r.refund}</div>
          )}
        </div>

        {/* Actions */}
        <div style={{display:'flex', flexDirection:'column', gap:6, alignItems:'stretch', minWidth:140}}>
          {r.status === 'confirmed' && (
            <>
              <button className="btn btn--primary btn--sm" onClick={()=>setRoute(isTour ? 'gameDetail' : 'gameDetail')}>상세보기</button>
              <button className="btn btn--sm">QR 티켓</button>
              <button className="btn btn--sm" style={{color:'var(--danger)'}}>취소하기</button>
            </>
          )}
          {r.status === 'pending' && (
            <>
              {!r.paid && <button className="btn btn--accent btn--sm" onClick={()=>{
                sessionStorage.setItem('mybdr.checkout', JSON.stringify({ title: ref.title, fee: r.fee, code: r.code }));
                setRoute('checkout');
              }}>결제하기 · {r.fee}</button>}
              <button className="btn btn--sm">호스트 문의</button>
              <button className="btn btn--sm" style={{color:'var(--danger)'}}>신청 철회</button>
            </>
          )}
          {r.status === 'waitlist' && (
            <>
              <button className="btn btn--sm">알림 설정</button>
              <button className="btn btn--sm" style={{color:'var(--danger)'}}>대기 취소</button>
            </>
          )}
          {r.status === 'completed' && (
            <>
              <button className="btn btn--sm">후기 작성</button>
              <button className="btn btn--sm" onClick={()=>setRoute('gameDetail')}>기록 보기</button>
            </>
          )}
          {r.status === 'cancelled' && (
            <button className="btn btn--sm">영수증</button>
          )}
          {r.status === 'no-show' && (
            <span style={{fontSize:11, color:'var(--danger)', textAlign:'center', padding:'4px 6px'}}>노쇼 기록<br/>3회 누적 시 제한</span>
          )}
          <button onClick={()=>setExpanded(!expanded)} style={{background:'transparent', border:0, fontSize:11, color:'var(--ink-dim)', cursor:'pointer', padding:4}}>
            {expanded ? '접기 ▲' : '세부정보 ▼'}
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div style={{padding:'14px 20px', background:'var(--bg-alt)', borderTop:'1px solid var(--border)', fontSize:12.5, display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12}}>
          <div>
            <div style={{color:'var(--ink-dim)', fontSize:10, fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase'}}>신청일</div>
            <div style={{fontWeight:600, marginTop:2, fontFamily:'var(--ff-mono)'}}>{r.applied || '—'}</div>
          </div>
          <div>
            <div style={{color:'var(--ink-dim)', fontSize:10, fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase'}}>역할</div>
            <div style={{fontWeight:600, marginTop:2}}>{r.role === 'guest' ? '게스트 지원' : r.role === 'team-captain' ? '팀장 (4인)' : '개인 참가'}</div>
          </div>
          <div>
            <div style={{color:'var(--ink-dim)', fontSize:10, fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase'}}>참가비</div>
            <div style={{fontWeight:600, marginTop:2}}>{r.fee || '무료'} · {r.paid ? '결제완료' : '미결제'}</div>
          </div>
          <div>
            <div style={{color:'var(--ink-dim)', fontSize:10, fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase'}}>예약번호</div>
            <div style={{fontWeight:600, marginTop:2, fontFamily:'var(--ff-mono)'}}>{r.code}</div>
          </div>
          {r.note && (
            <div style={{gridColumn:'1 / -1', marginTop:4, padding:'8px 10px', background:'var(--bg-elev)', border:'1px solid var(--border)', borderRadius:4}}>
              <div style={{color:'var(--ink-dim)', fontSize:10, fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', marginBottom:3}}>내가 남긴 메모</div>
              <div>{r.note}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

window.MyGames = MyGames;
