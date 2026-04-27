/* global React, TEAMS, Avatar, Icon */

function Messages({ setRoute }) {
  const [active, setActive] = React.useState('t1');
  const [text, setText] = React.useState('');

  const threads = [
    { id:'t1', name:'block (블럭)', tag:'BK', color:'#10B981', online:true, last:'목요일 저녁 하남미사 픽업 자리 확정됐습니다', time:'14:32', unread:2, team:'BLOCK', pinned:true },
    { id:'t2', name:'3POINT_슈', tag:'3P', color:'#0F5FCC', online:true, last:'내일 스크림 몇시쯤 시작하나요?', time:'13:08', unread:1, team:'3POINT' },
    { id:'t3', name:'몽키즈_센터', tag:'MK', color:'#F59E0B', online:false, last:'영상 편집본 받아보시면 말씀해주세요', time:'어제', unread:0, team:'MONKEYS' },
    { id:'t4', name:'SWEEP 팀 단톡', tag:'SW', color:'#F59E0B', online:false, last:'SWEEP: 이번주 경기 준비물 공지합니다', time:'어제', unread:0, team:'SWEEP', group:true, members:12 },
    { id:'t5', name:'kings_cap', tag:'KG', color:'#7C2D12', online:false, last:'5월 첫째주 가능하신가요?', time:'04.21', unread:0 },
    { id:'t6', name:'운영팀 (BDR)', tag:'AD', color:'var(--accent)', online:true, last:'대회 접수가 완료되었습니다.', time:'04.20', unread:0, official:true },
    { id:'t7', name:'pivot_mia', tag:'PV', color:'#8B5CF6', online:false, last:'반포 토요일 자리 한 명 빠져서요', time:'04.19', unread:0 },
    { id:'t8', name:'REDEEM 팀 단톡', tag:'RDM', color:'#DC2626', online:false, last:'rdm_captain: 내일 훈련 장소 변경', time:'04.18', unread:0, team:'REDEEM', group:true, members:8 },
  ];

  const messages = {
    t1: [
      { from:'them', time:'14:15', body:'안녕하세요! 목요일 픽업 관심있다고 하셨는데 아직 자리 있으세요?' },
      { from:'me',   time:'14:18', body:'네 가능합니다. 포지션은 가드고 L.8입니다.' },
      { from:'them', time:'14:20', body:'딱 좋네요. 저희 가드 한명 모자랐거든요.' },
      { from:'them', time:'14:21', body:'6:4 팀 분배고 21점 선취제로 진행합니다. 참가비는 현장에서 5,000원이에요.' },
      { from:'me',   time:'14:25', body:'좋습니다. 농구화 따로 챙겨가야 하나요?' },
      { from:'them', time:'14:28', body:'네 실내화는 필수입니다. 탈의실이랑 샤워실도 사용가능해요.' },
      { from:'them', time:'14:30', body:'자리 확정해드릴게요. 목요일 20:30까지 오시면 됩니다.' },
      { from:'them', time:'14:32', body:'목요일 저녁 하남미사 픽업 자리 확정됐습니다 👍', attach:{type:'game', title:'목요일 저녁 하남미사 픽업', date:'04.25 · 20:30', court:'미사강변체육관'} },
    ],
  };

  const current = threads.find(t => t.id === active);
  const msgs = messages[active] || [
    { from:'them', time:'13:00', body:'안녕하세요! 쪽지 드려요.' },
    { from:'me',   time:'13:05', body:'네 말씀하세요.' },
  ];

  const send = () => {
    if (!text.trim()) return;
    setText('');
  };

  return (
    <div className="page">
      <div style={{display:'flex', gap:6, fontSize:12, color:'var(--ink-mute)', marginBottom:12}}>
        <a onClick={()=>setRoute('home')} style={{cursor:'pointer'}}>홈</a><span>›</span>
        <span style={{color:'var(--ink)'}}>쪽지</span>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'320px 1fr 280px', gap:0, height:'calc(100vh - 180px)', minHeight:600, border:'1px solid var(--border)', borderRadius:8, overflow:'hidden', background:'var(--bg)'}}>

        {/* LIST */}
        <div style={{borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', minHeight:0}}>
          <div style={{padding:'14px 16px', borderBottom:'1px solid var(--border)'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:10}}>
              <h2 style={{margin:0, fontSize:16, fontWeight:800}}>쪽지 <span style={{fontSize:11, color:'var(--accent)', fontFamily:'var(--ff-mono)', marginLeft:4}}>{threads.filter(t=>t.unread).reduce((s,t)=>s+t.unread,0)}</span></h2>
              <button style={{background:'transparent', border:0, fontSize:16, cursor:'pointer', color:'var(--ink-soft)'}}>✎</button>
            </div>
            <input className="input" placeholder="🔍 사람, 팀, 메시지 검색" style={{fontSize:12, padding:'6px 10px'}}/>
          </div>
          <div style={{flex:1, overflowY:'auto', minHeight:0}}>
            {threads.map(t => (
              <div key={t.id} onClick={()=>setActive(t.id)} style={{
                padding:'12px 14px', cursor:'pointer',
                background: active===t.id ? 'var(--bg-alt)' : 'transparent',
                borderLeft: active===t.id ? '3px solid var(--accent)' : '3px solid transparent',
                borderBottom:'1px solid var(--border)',
                display:'grid', gridTemplateColumns:'40px 1fr auto', gap:10, alignItems:'center',
              }}>
                <div style={{position:'relative'}}>
                  <Avatar tag={t.tag} color={t.color} size={40} radius={ t.group ? 8 : 999 }/>
                  {t.online && <span style={{position:'absolute', bottom:-1, right:-1, width:12, height:12, background:'var(--ok)', border:'2px solid var(--bg)', borderRadius:'50%'}}/>}
                </div>
                <div style={{minWidth:0}}>
                  <div style={{display:'flex', alignItems:'center', gap:4, marginBottom:2}}>
                    <span style={{fontWeight:700, fontSize:13, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{t.name}</span>
                    {t.pinned && <span style={{fontSize:10, color:'var(--ink-dim)'}}>📌</span>}
                    {t.official && <span className="badge badge--red" style={{fontSize:9, padding:'1px 5px'}}>공식</span>}
                    {t.group && <span style={{fontSize:10, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>·{t.members}</span>}
                  </div>
                  <div style={{fontSize:12, color:'var(--ink-dim)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', fontWeight: t.unread ? 600 : 400}}>{t.last}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:10, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>{t.time}</div>
                  {t.unread > 0 && <div style={{marginTop:4, background:'var(--accent)', color:'#fff', fontSize:10, fontWeight:800, fontFamily:'var(--ff-mono)', minWidth:18, height:18, borderRadius:99, display:'inline-grid', placeItems:'center', padding:'0 5px'}}>{t.unread}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* THREAD */}
        <div style={{display:'flex', flexDirection:'column', minHeight:0, background:'var(--bg-alt)'}}>
          <div style={{padding:'12px 18px', background:'var(--bg)', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:10}}>
            <Avatar tag={current.tag} color={current.color} size={36} radius={current.group?8:999}/>
            <div style={{flex:1}}>
              <div style={{fontWeight:700, fontSize:14}}>{current.name}</div>
              <div style={{fontSize:11, color: current.online?'var(--ok)':'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>
                {current.online ? '● 온라인' : '● 오프라인 · 마지막 접속 2시간 전'}
              </div>
            </div>
            <button className="btn btn--sm">📞</button>
            <button className="btn btn--sm">🔍</button>
            <button className="btn btn--sm">⋯</button>
          </div>

          <div style={{flex:1, overflowY:'auto', padding:'18px 22px', display:'flex', flexDirection:'column', gap:10, minHeight:0}}>
            <div style={{textAlign:'center', fontSize:10, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)', margin:'4px 0 8px'}}>2026.04.23 목요일</div>
            {msgs.map((m, i) => (
              <div key={i} style={{display:'flex', justifyContent: m.from==='me' ? 'flex-end' : 'flex-start', gap:8, alignItems:'flex-end'}}>
                {m.from==='them' && <Avatar tag={current.tag} color={current.color} size={26} radius={999}/>}
                <div style={{maxWidth:'65%'}}>
                  <div style={{
                    padding:'10px 14px',
                    background: m.from==='me' ? 'var(--accent)' : 'var(--bg)',
                    color: m.from==='me' ? '#fff' : 'var(--ink)',
                    borderRadius: m.from==='me' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                    fontSize:13, lineHeight:1.5,
                    border: m.from==='me' ? 0 : '1px solid var(--border)',
                  }}>
                    {m.body}
                    {m.attach?.type==='game' && (
                      <div style={{marginTop:8, padding:'10px 12px', background: m.from==='me' ? 'rgba(255,255,255,.18)' : 'var(--bg-alt)', borderRadius:6, fontSize:12}}>
                        <div style={{fontSize:9, letterSpacing:'.1em', fontWeight:800, opacity:.85, marginBottom:4}}>🏀 경기 카드</div>
                        <div style={{fontWeight:700}}>{m.attach.title}</div>
                        <div style={{opacity:.8, fontFamily:'var(--ff-mono)', fontSize:11, marginTop:2}}>{m.attach.date} · {m.attach.court}</div>
                      </div>
                    )}
                  </div>
                  <div style={{fontSize:10, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)', marginTop:3, textAlign: m.from==='me' ? 'right' : 'left', paddingLeft: m.from==='me'?0:4, paddingRight: m.from==='me'?4:0}}>
                    {m.time} {m.from==='me' && <span style={{color:'var(--cafe-blue)'}}>✓✓</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{padding:'12px 16px', background:'var(--bg)', borderTop:'1px solid var(--border)'}}>
            <div style={{display:'flex', gap:4, marginBottom:8}}>
              <button className="btn btn--sm" style={{padding:'0 8px'}}>📎</button>
              <button className="btn btn--sm" style={{padding:'0 8px'}}>🏀 경기</button>
              <button className="btn btn--sm" style={{padding:'0 8px'}}>📍 장소</button>
              <button className="btn btn--sm" style={{padding:'0 8px'}}>📷</button>
            </div>
            <div style={{display:'flex', gap:8, alignItems:'flex-end'}}>
              <textarea
                className="input"
                value={text}
                onChange={e=>setText(e.target.value)}
                onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                rows={1}
                placeholder="메시지 입력 · Shift+Enter 줄바꿈"
                style={{resize:'none', flex:1}}
              />
              <button className="btn btn--primary" onClick={send} style={{padding:'8px 16px'}}>보내기</button>
            </div>
          </div>
        </div>

        {/* PROFILE RAIL */}
        <div style={{borderLeft:'1px solid var(--border)', padding:'20px 18px', overflowY:'auto', minHeight:0}}>
          <div style={{textAlign:'center', marginBottom:14}}>
            <Avatar tag={current.tag} color={current.color} size={72} radius={current.group?10:999}/>
            <div style={{fontWeight:800, fontSize:15, marginTop:10}}>{current.name}</div>
            {current.team && <div style={{fontSize:11, color:'var(--ink-mute)', fontFamily:'var(--ff-mono)', marginTop:2}}>{current.team}</div>}
          </div>

          <div style={{display:'flex', justifyContent:'center', gap:6, marginBottom:16}}>
            <button className="btn btn--sm">프로필</button>
            <button className="btn btn--sm">차단</button>
            <button className="btn btn--sm">신고</button>
          </div>

          <div style={{borderTop:'1px solid var(--border)', paddingTop:14}}>
            <div style={{fontSize:11, color:'var(--ink-dim)', fontWeight:700, letterSpacing:'.1em', marginBottom:8}}>공유된 항목</div>
            <div style={{display:'flex', flexDirection:'column', gap:8}}>
              <div style={{padding:'10px 12px', background:'var(--bg-alt)', borderRadius:6, fontSize:12}}>
                <div style={{fontSize:9, color:'var(--ink-dim)', fontWeight:800, letterSpacing:'.08em', marginBottom:2}}>🏀 경기</div>
                <div style={{fontWeight:700}}>하남미사 목요 픽업</div>
                <div style={{color:'var(--ink-dim)', fontFamily:'var(--ff-mono)', fontSize:10, marginTop:1}}>04.25 · 20:30</div>
              </div>
              <div style={{padding:'10px 12px', background:'var(--bg-alt)', borderRadius:6, fontSize:12}}>
                <div style={{fontSize:9, color:'var(--ink-dim)', fontWeight:800, letterSpacing:'.08em', marginBottom:2}}>📍 장소</div>
                <div style={{fontWeight:700}}>미사강변체육관</div>
                <div style={{color:'var(--ink-dim)', fontFamily:'var(--ff-mono)', fontSize:10, marginTop:1}}>하남시</div>
              </div>
            </div>
          </div>

          <div style={{borderTop:'1px solid var(--border)', marginTop:16, paddingTop:14}}>
            <div style={{fontSize:11, color:'var(--ink-dim)', fontWeight:700, letterSpacing:'.1em', marginBottom:8}}>알림 설정</div>
            <label style={{display:'flex', alignItems:'center', gap:8, fontSize:12, marginBottom:6}}>
              <input type="checkbox" defaultChecked/> 메시지 알림
            </label>
            <label style={{display:'flex', alignItems:'center', gap:8, fontSize:12}}>
              <input type="checkbox"/> 상단 고정
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

window.Messages = Messages;
