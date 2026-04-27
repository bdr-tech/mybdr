/* global React, TEAMS, Icon */

function TeamInvite({ setRoute }) {
  const [status, setStatus] = React.useState('pending'); // pending | accepted | declined | expired
  const [showProfile, setShowProfile] = React.useState(false);

  const team = TEAMS[2]; // 몽키즈 (monkeys)
  const inviter = { name: 'monkey_k', role: '팀장', level: 'L.9', posts: 842, joined: '2018.03', avatar: 'MK' };
  const invite = {
    code: 'MKZ-INV-7A3F9D',
    sentAt: '2026.04.22 18:04',
    expiresAt: '2026.04.29 18:04',
    daysLeft: 6,
    role: '정식 팀원',
    position: '포워드',
    jerseyNumber: 12,
    message: '지난주 장충에서 같이 뛴 게 인상적이었습니다. 포워드 포지션 보강 중인데, 저희 몽키즈 정식 팀원으로 합류하시면 어떨까요? 주 2회 훈련(월·목 저녁), 월 1회 대회 출전 예정입니다.',
  };

  if (status === 'accepted') {
    return (
      <div className="page" style={{maxWidth:560}}>
        <div className="card" style={{padding:'48px 40px', textAlign:'center'}}>
          <div style={{width:80, height:80, margin:'0 auto 20px', borderRadius:'50%', background:team.color, color:team.ink, display:'grid', placeItems:'center', fontFamily:'var(--ff-display)', fontWeight:900, fontSize:22}}>{team.tag}</div>
          <h1 style={{margin:'0 0 8px', fontSize:26, fontWeight:800}}>환영합니다, {team.name}!</h1>
          <p style={{margin:'0 0 24px', color:'var(--ink-mute)', fontSize:14}}>
            {team.name} 팀의 정식 팀원이 되었습니다. 팀장이 확인 후 권한이 부여됩니다.
          </p>
          <div style={{padding:'16px 18px', background:'var(--bg-alt)', borderRadius:8, marginBottom:24, textAlign:'left', fontSize:13, lineHeight:1.8}}>
            <div style={{fontSize:11, color:'var(--ink-dim)', fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', marginBottom:6}}>다음 단계</div>
            ✓ 팀 채팅방 자동 초대 (몽키즈 내전방)<br/>
            ✓ 다가오는 훈련 일정 알림 수신<br/>
            ✓ 팀 로스터에 등번호 #{invite.jerseyNumber} · {invite.position}로 등록
          </div>
          <div style={{display:'flex', gap:10, justifyContent:'center'}}>
            <button className="btn btn--lg" onClick={()=>setRoute('teamDetail')}>팀 페이지 보기</button>
            <button className="btn btn--primary btn--lg" onClick={()=>setRoute('profile')}>내 프로필로</button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'declined') {
    return (
      <div className="page" style={{maxWidth:560}}>
        <div className="card" style={{padding:'48px 40px', textAlign:'center'}}>
          <div style={{width:72, height:72, margin:'0 auto 20px', borderRadius:'50%', background:'var(--bg-alt)', color:'var(--ink-mute)', display:'grid', placeItems:'center', fontSize:32}}>✕</div>
          <h1 style={{margin:'0 0 8px', fontSize:24, fontWeight:700}}>초대를 거절했습니다</h1>
          <p style={{margin:'0 0 24px', color:'var(--ink-mute)', fontSize:14}}>
            {team.name} 팀장({inviter.name})에게 거절 알림이 전송되었습니다.
          </p>
          <button className="btn btn--primary" onClick={()=>setRoute('home')}>홈으로</button>
          <div style={{marginTop:12}}>
            <a style={{fontSize:12, color:'var(--ink-dim)', cursor:'pointer'}} onClick={()=>setStatus('pending')}>초대 다시 보기</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{maxWidth:720}}>
      {/* hero */}
      <div style={{textAlign:'center', marginBottom:28}}>
        <div className="eyebrow" style={{justifyContent:'center', marginBottom:8}}>팀 초대 · TEAM INVITATION</div>
        <h1 style={{margin:'0 0 8px', fontSize:30, fontWeight:800, letterSpacing:'-0.02em'}}>
          <b style={{color:team.color}}>{inviter.name}</b>님이<br/>
          <b>{team.name}</b> 팀에 초대했습니다
        </h1>
        <p style={{margin:0, color:'var(--ink-mute)', fontSize:13.5}}>
          초대 만료까지 <b style={{color:'var(--accent)'}}>{invite.daysLeft}일</b> 남았습니다 · {invite.expiresAt} 만료
        </p>
      </div>

      {/* team card */}
      <div className="card" style={{padding:0, overflow:'hidden', marginBottom:14}}>
        <div style={{
          padding:'28px 28px 20px',
          background:`linear-gradient(135deg, ${team.color} 0%, color-mix(in oklab, ${team.color} 50%, #000) 100%)`,
          color:team.ink,
          display:'grid', gridTemplateColumns:'auto 1fr auto', gap:18, alignItems:'center',
        }}>
          <div style={{width:80, height:80, background:'rgba(255,255,255,.15)', border:'2px solid rgba(255,255,255,.4)', color:team.ink, display:'grid', placeItems:'center', fontFamily:'var(--ff-display)', fontWeight:900, fontSize:24, borderRadius:6}}>{team.tag}</div>
          <div>
            <div style={{fontSize:11, opacity:.8, fontWeight:700, letterSpacing:'.08em'}}>EST. {team.founded} · 서울</div>
            <div style={{fontSize:26, fontWeight:800, letterSpacing:'-0.015em', marginTop:2}}>{team.name}</div>
            <div style={{fontSize:13, opacity:.9, marginTop:2}}>더블엘리미네이션 챔피언 · Winter Finals 2025</div>
          </div>
          <a onClick={()=>setRoute('teamDetail')} style={{fontSize:12, color:team.ink, opacity:.85, cursor:'pointer', textDecoration:'underline'}}>팀 페이지 →</a>
        </div>

        {/* team stats strip */}
        <div style={{display:'grid', gridTemplateColumns:'repeat(5, 1fr)', borderBottom:'1px solid var(--border)'}}>
          {[
            { label:'레이팅', value: team.rating.toLocaleString() },
            { label:'전적', value: `${team.wins}승 ${team.losses}패` },
            { label:'승률', value: `${Math.round(team.wins / (team.wins+team.losses) * 100)}%` },
            { label:'팀원', value: '8명' },
            { label:'랭킹', value: '#3' },
          ].map((s, i) => (
            <div key={i} style={{padding:'14px 10px', textAlign:'center', borderLeft: i>0 ? '1px solid var(--border)' : 0}}>
              <div style={{fontFamily:'var(--ff-display)', fontWeight:900, fontSize:22, letterSpacing:'-0.01em'}}>{s.value}</div>
              <div style={{fontSize:10, color:'var(--ink-dim)', fontWeight:600, letterSpacing:'.04em', textTransform:'uppercase', marginTop:2}}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* current roster preview */}
        <div style={{padding:'16px 22px', display:'flex', alignItems:'center', gap:10, flexWrap:'wrap'}}>
          <span style={{fontSize:11, color:'var(--ink-dim)', fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', marginRight:4}}>현재 로스터</span>
          {['monkey_k','dunk_h','pivot_m','block_s','sharp_j','wing_p','center_y'].map((n, i) => (
            <div key={i} style={{display:'flex', alignItems:'center', gap:6, padding:'4px 10px', background:'var(--bg-alt)', borderRadius:99, fontSize:12}}>
              <span style={{width:6, height:6, background:'var(--ok)', borderRadius:'50%'}}/>
              {n}
            </div>
          ))}
          <span style={{fontSize:12, color:'var(--ink-dim)'}}>+1 you</span>
        </div>
      </div>

      {/* Inviter + message */}
      <div className="card" style={{padding:'20px 22px', marginBottom:14}}>
        <div style={{display:'flex', gap:14, alignItems:'center', marginBottom:14, padding:'10px 12px', background:'var(--bg-alt)', borderRadius:6}}>
          <div style={{width:44, height:44, borderRadius:'50%', background:team.color, color:team.ink, display:'grid', placeItems:'center', fontFamily:'var(--ff-mono)', fontWeight:700, fontSize:13}}>{inviter.avatar}</div>
          <div style={{flex:1}}>
            <div style={{display:'flex', alignItems:'center', gap:8}}>
              <span style={{fontWeight:700}}>{inviter.name}</span>
              <span className="badge badge--red">{inviter.role}</span>
              <span className="badge badge--ghost">{inviter.level}</span>
            </div>
            <div style={{fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)', marginTop:2}}>
              글 {inviter.posts} · 가입 {inviter.joined} · 초대일시 {invite.sentAt}
            </div>
          </div>
          <button className="btn btn--sm">프로필 보기</button>
        </div>

        <div style={{fontSize:11, color:'var(--ink-dim)', fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', marginBottom:6}}>팀장의 메시지</div>
        <div style={{padding:'14px 16px', background:'var(--cafe-blue-soft)', border:'1px solid var(--cafe-blue-hair)', borderRadius:6, fontSize:14, lineHeight:1.7, color:'var(--ink-soft)'}}>
          "{invite.message}"
        </div>
      </div>

      {/* Invite terms */}
      <div className="card" style={{padding:'20px 22px', marginBottom:14}}>
        <div style={{fontSize:13, fontWeight:700, marginBottom:12}}>초대 조건</div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:10}}>
          {[
            { label:'역할',   value: invite.role,       sub:'정식 등록' },
            { label:'포지션', value: invite.position,   sub:'주 포지션' },
            { label:'등번호', value: `#${invite.jerseyNumber}`, sub:'현재 공석' },
            { label:'월회비', value: '₩30,000',         sub:'코트 대여·물품' },
          ].map(f => (
            <div key={f.label} style={{padding:'12px 14px', background:'var(--bg-alt)', borderRadius:6}}>
              <div style={{fontSize:10, color:'var(--ink-dim)', fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase'}}>{f.label}</div>
              <div style={{fontFamily:'var(--ff-display)', fontWeight:800, fontSize:18, marginTop:2}}>{f.value}</div>
              <div style={{fontSize:10.5, color:'var(--ink-mute)', marginTop:1}}>{f.sub}</div>
            </div>
          ))}
        </div>

        <div style={{marginTop:14, fontSize:12, color:'var(--ink-mute)', lineHeight:1.6, padding:'10px 12px', borderLeft:'2px solid var(--border-strong)', background:'var(--bg-alt)'}}>
          <b style={{color:'var(--ink-soft)'}}>안내</b> · 수락 시 기존 소속팀(REDEEM)에서 자동 탈퇴됩니다.
          팀 변경 내역은 공개되며, 30일 이내 재변경은 불가합니다. 탈퇴·해체 규정은 <a>팀 규약</a>을 참고하세요.
        </div>
      </div>

      {/* Your profile preview (what the team will see) */}
      <div className="card" style={{padding:0, overflow:'hidden', marginBottom:20}}>
        <button onClick={()=>setShowProfile(!showProfile)} style={{
          width:'100%', padding:'14px 20px', background:'transparent', border:0,
          display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer',
          fontSize:13, fontWeight:600, color:'var(--ink-soft)',
        }}>
          <span>팀에 전송될 내 프로필 미리보기</span>
          <span style={{fontSize:11, color:'var(--ink-dim)'}}>{showProfile ? '접기 ▲' : '펼치기 ▼'}</span>
        </button>
        {showProfile && (
          <div style={{padding:'0 20px 20px', display:'grid', gridTemplateColumns:'auto 1fr', gap:16, alignItems:'center'}}>
            <div style={{width:64, height:64, background:'var(--bdr-red)', color:'#fff', display:'grid', placeItems:'center', fontFamily:'var(--ff-mono)', fontWeight:700, fontSize:14, borderRadius:6}}>RDM</div>
            <div>
              <div style={{fontWeight:700, fontSize:15}}>rdm_captain <span className="badge badge--red" style={{marginLeft:6}}>L.8</span></div>
              <div style={{fontSize:12, color:'var(--ink-mute)', marginTop:2, fontFamily:'var(--ff-mono)'}}>가드 · 183cm · 레이팅 1,684 · 47경기 63%</div>
              <div style={{fontSize:12, color:'var(--ink-mute)', marginTop:2}}>現 소속 REDEEM (팀장) · 2019년부터 활동</div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16}}>
        <button className="btn btn--lg" style={{color:'var(--ink-mute)'}} onClick={()=>setStatus('declined')}>거절</button>
        <button className="btn btn--primary btn--lg" onClick={()=>setStatus('accepted')}>수락하고 합류하기</button>
      </div>

      <div style={{textAlign:'center', fontSize:12, color:'var(--ink-dim)'}}>
        초대 코드 <span style={{fontFamily:'var(--ff-mono)', color:'var(--ink-soft)'}}>{invite.code}</span> ·
        이 초대가 잘못 왔나요? <a style={{cursor:'pointer'}}>신고하기</a>
      </div>
    </div>
  );
}

window.TeamInvite = TeamInvite;
