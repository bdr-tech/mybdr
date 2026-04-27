/* global React, Icon */

function Safety({ setRoute }) {
  const [tab, setTab] = React.useState('blocks');

  const blocks = [
    { id:1, user:'trolling_kid',   level:'L.2', reason:'욕설·인신공격',  date:'2026.04.15', scope:'전체' },
    { id:2, user:'spam_account',   level:'L.1', reason:'스팸·광고',      date:'2026.03.28', scope:'DM·댓글' },
    { id:3, user:'late_dropper',   level:'L.4', reason:'반복 노쇼',      date:'2026.03.12', scope:'매치' },
    { id:4, user:'rough_player88', level:'L.6', reason:'경기 매너 불량',   date:'2026.02.04', scope:'전체' },
  ];

  const reports = [
    { id:101, target:'flame_comment',  targetType:'게시글',  title:'자유게시판 #192 — 혐오 발언',      status:'처리완료', result:'게시글 삭제·작성자 7일 정지', date:'2026.04.18', priority:'high' },
    { id:102, target:'no_show_team',   targetType:'팀',      title:'BDR Challenge 예선 무단 불참',       status:'조사중',   result:'팀장 소명 요청 단계',            date:'2026.04.14', priority:'mid' },
    { id:103, target:'fake_review',    targetType:'리뷰',    title:'코트 리뷰 허위사실 기재',           status:'접수',     result:'운영팀 검토 대기',              date:'2026.04.20', priority:'low' },
    { id:104, target:'dm_harassment',  targetType:'DM',      title:'반복적인 부적절 메시지',             status:'처리완료', result:'차단·경고 · 재발 시 영구정지',    date:'2026.03.30', priority:'high' },
  ];

  const muted = [
    { word:'낚시글', scope:'게시판', since:'2026.04.01' },
    { word:'도박',   scope:'전체',   since:'2026.03.15' },
  ];

  const priv = [
    { key:'dm',         label:'DM 수신',             value:'팔로우한 유저만',        opts:['전체 허용','팔로우한 유저만','차단'] },
    { key:'invite',     label:'팀 초대',             value:'L.3 이상',               opts:['전체 허용','L.3 이상','친구만','차단'] },
    { key:'mention',    label:'멘션 알림',           value:'팔로워만',              opts:['전체','팔로워만','없음'] },
    { key:'search',     label:'이름 검색 노출',      value:'허용',                 opts:['허용','차단'] },
    { key:'location',   label:'활동 지역 표시',      value:'구(區) 단위까지',         opts:['시/도','구(區)','상세 주소 없음'] },
  ];

  return (
    <div className="page">
      <div style={{display:'flex', gap:6, fontSize:12, color:'var(--ink-mute)', marginBottom:12}}>
        <a onClick={()=>setRoute('home')} style={{cursor:'pointer'}}>홈</a><span>›</span>
        <a onClick={()=>setRoute('settings')} style={{cursor:'pointer'}}>설정</a><span>›</span>
        <span style={{color:'var(--ink)'}}>안전·차단</span>
      </div>

      <div style={{marginBottom:18}}>
        <div className="eyebrow">SAFETY · 안전 센터</div>
        <h1 style={{margin:'4px 0 6px', fontSize:32, fontWeight:800, letterSpacing:'-0.02em'}}>괜찮은 농구 경험을 위해</h1>
        <p style={{margin:0, color:'var(--ink-mute)', fontSize:14, maxWidth:680, lineHeight:1.6}}>
          차단·신고·프라이버시를 한 곳에서 관리하세요. 신고는 운영팀이 48시간 내 검토하며, 차단은 즉시 적용됩니다.
        </p>
      </div>

      {/* Stat strip */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:10, marginBottom:18}}>
        {[
          { label:'현재 차단', value: blocks.length, color:'var(--ink)' },
          { label:'이번달 신고', value: reports.filter(r=>r.date.startsWith('2026.04')).length, color:'var(--accent)' },
          { label:'처리완료', value: reports.filter(r=>r.status==='처리완료').length, color:'var(--ok)' },
          { label:'처리중',  value: reports.filter(r=>r.status!=='처리완료').length, color:'var(--cafe-blue-deep)' },
        ].map(s => (
          <div key={s.label} className="card" style={{padding:'14px 18px', borderLeft:`3px solid ${s.color}`}}>
            <div style={{fontSize:10, color:'var(--ink-dim)', fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase'}}>{s.label}</div>
            <div style={{fontFamily:'var(--ff-display)', fontSize:28, fontWeight:900, marginTop:3, color:s.color}}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{display:'flex', gap:2, borderBottom:'1px solid var(--border)', marginBottom:16}}>
        {[
          { id:'blocks',  label:'차단 목록', n: blocks.length },
          { id:'reports', label:'신고 내역', n: reports.length },
          { id:'muted',   label:'금칙어',   n: muted.length },
          { id:'privacy', label:'프라이버시' },
        ].map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            padding:'12px 18px', background:'transparent', border:0, cursor:'pointer',
            fontSize:14, fontWeight: tab===t.id?700:500,
            color: tab===t.id?'var(--cafe-blue-deep)':'var(--ink-mute)',
            borderBottom: tab===t.id?'2px solid var(--cafe-blue)':'2px solid transparent', marginBottom:-1,
          }}>
            {t.label}{t.n !== undefined && <span style={{fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)', marginLeft:4}}>{t.n}</span>}
          </button>
        ))}
      </div>

      {tab === 'blocks' && (
        <div>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10}}>
            <div style={{fontSize:13, color:'var(--ink-mute)'}}>차단된 사용자는 DM·멘션·팀 초대를 보낼 수 없습니다.</div>
            <button className="btn btn--sm">+ 유저 차단</button>
          </div>
          <div className="card" style={{padding:0, overflow:'hidden'}}>
            <div className="board__head" style={{gridTemplateColumns:'1.5fr 1fr 1fr 1fr 100px'}}>
              <div style={{textAlign:'left'}}>사용자</div><div>사유</div><div>범위</div><div>차단일</div><div></div>
            </div>
            {blocks.map(b => (
              <div key={b.id} className="board__row" style={{gridTemplateColumns:'1.5fr 1fr 1fr 1fr 100px', alignItems:'center'}}>
                <div className="title" style={{display:'flex', alignItems:'center', gap:10}}>
                  <div style={{width:30, height:30, borderRadius:'50%', background:'var(--ink-soft)', color:'var(--bg)', display:'grid', placeItems:'center', fontFamily:'var(--ff-mono)', fontSize:10, fontWeight:700}}>{b.user.slice(0,2).toUpperCase()}</div>
                  <div>
                    <b>{b.user}</b> <span className="badge badge--ghost" style={{marginLeft:4, fontSize:9}}>{b.level}</span>
                  </div>
                </div>
                <div>{b.reason}</div>
                <div><span className="badge badge--soft">{b.scope}</span></div>
                <div style={{fontFamily:'var(--ff-mono)', color:'var(--ink-dim)', fontSize:12}}>{b.date}</div>
                <div><button className="btn btn--sm" style={{fontSize:11}}>해제</button></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'reports' && (
        <div>
          <div style={{fontSize:13, color:'var(--ink-mute)', marginBottom:10}}>운영팀이 24–48시간 내 검토합니다. 처리결과는 알림으로 전달됩니다.</div>
          <div style={{display:'flex', flexDirection:'column', gap:8}}>
            {reports.map(r => (
              <div key={r.id} className="card" style={{padding:'16px 20px', display:'grid', gridTemplateColumns:'1fr auto', gap:14}}>
                <div>
                  <div style={{display:'flex', gap:8, alignItems:'center', marginBottom:6}}>
                    <span className="badge badge--ghost">{r.targetType}</span>
                    <span className={`badge ${r.status==='처리완료'?'badge--ok':r.status==='조사중'?'badge--warn':'badge--soft'}`}>{r.status}</span>
                    {r.priority==='high' && <span className="badge badge--red">긴급</span>}
                    <span style={{fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>#{r.id}</span>
                  </div>
                  <div style={{fontWeight:700, fontSize:14, marginBottom:4}}>{r.title}</div>
                  <div style={{fontSize:12, color:'var(--ink-mute)'}}>대상 · <b style={{color:'var(--ink-soft)'}}>{r.target}</b></div>
                  <div style={{fontSize:13, color:'var(--ink-soft)', marginTop:8, padding:'8px 10px', background:'var(--bg-alt)', borderRadius:4, borderLeft:'2px solid var(--accent)'}}>
                    처리 결과 · {r.result}
                  </div>
                </div>
                <div style={{textAlign:'right', display:'flex', flexDirection:'column', gap:4}}>
                  <div style={{fontFamily:'var(--ff-mono)', fontSize:11, color:'var(--ink-dim)'}}>{r.date}</div>
                  <button className="btn btn--sm" style={{fontSize:11}}>상세</button>
                </div>
              </div>
            ))}
          </div>
          <div style={{marginTop:12, padding:'14px 18px', background:'var(--bg-alt)', borderRadius:6, fontSize:12.5, color:'var(--ink-mute)', lineHeight:1.6}}>
            <b style={{color:'var(--ink)'}}>💡 신고 기준</b> — 욕설·혐오·도박/사기 광고·반복 노쇼·허위 신분·비매너 행동. 단순 의견 차이는 신고 대상이 아닙니다.
          </div>
        </div>
      )}

      {tab === 'muted' && (
        <div>
          <div style={{display:'flex', gap:8, marginBottom:12}}>
            <input className="input" placeholder="차단할 단어 입력 (예: 낚시, 도박)" style={{flex:1}}/>
            <select className="input" style={{width:140}}>
              <option>전체</option><option>게시판</option><option>댓글</option><option>DM</option>
            </select>
            <button className="btn btn--primary">추가</button>
          </div>
          <div style={{display:'flex', flexWrap:'wrap', gap:6}}>
            {muted.map(m => (
              <span key={m.word} style={{display:'inline-flex', alignItems:'center', gap:8, padding:'6px 10px 6px 12px', background:'var(--bg-alt)', border:'1px solid var(--border)', borderRadius:4, fontSize:13}}>
                <b>{m.word}</b>
                <span style={{fontSize:10, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>{m.scope} · {m.since}</span>
                <button style={{background:'transparent', border:0, color:'var(--ink-dim)', cursor:'pointer', fontSize:14, padding:0}}>×</button>
              </span>
            ))}
          </div>
          <div style={{marginTop:20, fontSize:13, color:'var(--ink-mute)', lineHeight:1.7}}>
            등록된 단어가 포함된 게시글·댓글·DM은 피드에서 자동으로 가려집니다. 직접 선택해서 열 수는 있습니다.
          </div>
        </div>
      )}

      {tab === 'privacy' && (
        <div className="card" style={{padding:0, overflow:'hidden'}}>
          {priv.map((p, i) => (
            <div key={p.key} style={{display:'grid', gridTemplateColumns:'1fr 1.4fr', gap:20, padding:'18px 24px', borderBottom: i<priv.length-1 ? '1px solid var(--border)' : 0, alignItems:'center'}}>
              <div>
                <div style={{fontWeight:700, fontSize:14}}>{p.label}</div>
                <div style={{fontSize:12, color:'var(--ink-mute)', marginTop:3}}>현재 · <b style={{color:'var(--ink-soft)'}}>{p.value}</b></div>
              </div>
              <div style={{display:'flex', gap:4, flexWrap:'wrap'}}>
                {p.opts.map(o => (
                  <button key={o} className={`btn ${o===p.value?'btn--primary':''} btn--sm`} style={{fontSize:12}}>{o}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

window.Safety = Safety;
