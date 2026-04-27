/* global React, TEAMS, Icon */

const PLAYERS = [
  { id: 'p1', name: '김도윤', team: 'MKZ', pos: 'G',  ppg: 18.4, apg: 6.2, rpg: 3.1, rating: 2240, trend: +18 },
  { id: 'p2', name: '이정우', team: 'KGS', pos: 'F',  ppg: 17.1, apg: 2.8, rpg: 7.4, rating: 2205, trend: +12 },
  { id: 'p3', name: '박성진', team: 'RDM', pos: 'G',  ppg: 16.8, apg: 5.5, rpg: 2.9, rating: 2182, trend: +9 },
  { id: 'p4', name: '장민혁', team: 'TZN', pos: 'C',  ppg: 14.2, apg: 1.6, rpg: 9.8, rating: 2150, trend: -3 },
  { id: 'p5', name: '최현우', team: '3PT', pos: 'G',  ppg: 15.9, apg: 4.2, rpg: 3.0, rating: 2118, trend: +6 },
  { id: 'p6', name: '윤지훈', team: 'MKZ', pos: 'F',  ppg: 13.5, apg: 3.0, rpg: 6.1, rating: 2095, trend: +14 },
  { id: 'p7', name: '한성호', team: 'SHT', pos: 'F',  ppg: 13.0, apg: 2.1, rpg: 5.5, rating: 2041, trend: -5 },
  { id: 'p8', name: '조민성', team: 'IRW', pos: 'G',  ppg: 12.6, apg: 5.8, rpg: 2.4, rating: 2010, trend: +2 },
  { id: 'p9', name: '강태현', team: 'PVT', pos: 'C',  ppg: 10.2, apg: 0.9, rpg: 8.2, rating: 1980, trend: +22 },
  { id: 'p10',name: '정승우', team: 'RDM', pos: 'F',  ppg: 11.4, apg: 2.4, rpg: 4.7, rating: 1964, trend: 0 },
];

function Trend({ v }) {
  if (v > 0)  return <span style={{color:'var(--ok)',   fontFamily:'var(--ff-mono)', fontWeight:700}}>▲{v}</span>;
  if (v < 0)  return <span style={{color:'var(--accent)', fontFamily:'var(--ff-mono)', fontWeight:700}}>▼{Math.abs(v)}</span>;
  return <span style={{color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>–</span>;
}

function Rank({ setRoute }) {
  const [mode, setMode] = React.useState('team'); // team | player
  const [sort, setSort] = React.useState('rating');

  const teams = [...TEAMS].sort((a,b)=> b.rating - a.rating);
  const players = [...PLAYERS].sort((a,b) => {
    if (sort === 'ppg') return b.ppg - a.ppg;
    if (sort === 'apg') return b.apg - a.apg;
    if (sort === 'rpg') return b.rpg - a.rpg;
    return b.rating - a.rating;
  });

  return (
    <div className="page">
      <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:16, gap:16, flexWrap:'wrap'}}>
        <div>
          <div className="eyebrow">랭킹 · LEADERBOARD</div>
          <h1 style={{margin:'6px 0 4px', fontSize:28, fontWeight:800, letterSpacing:'-0.015em'}}>2026 시즌 랭킹</h1>
          <div style={{fontSize:13, color:'var(--ink-mute)'}}>공식전 · 프리시즌 반영 · 매주 월요일 갱신</div>
        </div>
        <div className="theme-switch">
          <button className="theme-switch__btn" data-active={mode==='team'} onClick={()=>setMode('team')}>팀</button>
          <button className="theme-switch__btn" data-active={mode==='player'} onClick={()=>setMode('player')}>선수</button>
        </div>
      </div>

      {/* Podium */}
      <div style={{display:'grid', gridTemplateColumns:'1fr 1.1fr 1fr', gap:12, alignItems:'end', marginBottom:24}}>
        {[1,0,2].map(idx => {
          const rank = idx + 1;
          const item = mode === 'team' ? teams[idx] : players[idx];
          const isCenter = idx === 0;
          const color = mode === 'team' ? item.color : 'var(--cafe-blue)';
          const displayName = mode === 'team' ? item.name : item.name;
          const meta = mode === 'team' ? `${item.tag} · ${item.rating}` : `${item.team} · ${item.rating}`;
          return (
            <div key={idx} className="card" style={{
              padding:'22px 18px',
              textAlign:'center',
              borderTop:`4px solid ${color}`,
              transform: isCenter ? 'translateY(-12px)' : 'none',
              background: isCenter ? 'var(--bg-elev)' : 'var(--bg-alt)',
            }}>
              <div style={{fontFamily:'var(--ff-display)', fontWeight:900, fontSize: isCenter ? 44 : 34, letterSpacing:'-0.02em', color, lineHeight:1}}>#{rank}</div>
              <div style={{fontWeight:800, fontSize: isCenter ? 20 : 16, marginTop:10, letterSpacing:'-0.01em'}}>{displayName}</div>
              <div style={{fontSize:12, color:'var(--ink-mute)', marginTop:4, fontFamily:'var(--ff-mono)'}}>{meta}</div>
            </div>
          );
        })}
      </div>

      {mode === 'team' ? (
        <div className="board">
          <div className="board__head" style={{gridTemplateColumns:'64px 1fr 90px 90px 90px 90px'}}>
            <div>순위</div><div>팀</div><div>레이팅</div><div>승</div><div>패</div><div>승률</div>
          </div>
          {teams.map((t, i) => (
            <div key={t.id} className="board__row" style={{gridTemplateColumns:'64px 1fr 90px 90px 90px 90px'}}>
              <div className="num" style={{fontFamily:'var(--ff-display)', fontSize:16, fontWeight:900, color: i<3 ? 'var(--accent)' : 'var(--ink-dim)'}}>{i+1}</div>
              <div className="title">
                <span style={{width:22, height:22, background:t.color, color:t.ink, display:'grid', placeItems:'center', fontFamily:'var(--ff-mono)', fontSize:10, fontWeight:700, borderRadius:3, flexShrink:0}}>{t.tag}</span>
                <a style={{fontWeight:700}}>{t.name}</a>
              </div>
              <div style={{fontFamily:'var(--ff-mono)', fontWeight:700}}>{t.rating}</div>
              <div style={{color:'var(--ok)', fontFamily:'var(--ff-mono)', fontWeight:700}}>{t.wins}</div>
              <div style={{color:'var(--ink-mute)', fontFamily:'var(--ff-mono)'}}>{t.losses}</div>
              <div style={{fontFamily:'var(--ff-mono)'}}>{Math.round(t.wins/(t.wins+t.losses)*100)}%</div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* sort pills */}
          <div style={{display:'flex', gap:8, marginBottom:10, alignItems:'center', padding:'10px 12px', background:'var(--bg-elev)', border:'1px solid var(--border)', borderRadius:'var(--radius-chip)'}}>
            <span style={{color:'var(--ink-dim)', fontSize:12, fontWeight:600}}>정렬</span>
            {[['rating','레이팅'],['ppg','득점'],['apg','어시'],['rpg','리바']].map(([k,l]) => (
              <button key={k} onClick={()=>setSort(k)} style={{padding:'4px 10px', border:0, background: sort===k ? 'var(--cafe-blue-soft)' : 'transparent', color: sort===k ? 'var(--cafe-blue-deep)' : 'var(--ink-mute)', borderRadius:4, cursor:'pointer', fontWeight: sort===k ? 700 : 500, fontSize:13}}>{l}</button>
            ))}
          </div>
          <div className="board">
            <div className="board__head" style={{gridTemplateColumns:'56px 1fr 72px 72px 72px 72px 80px 64px'}}>
              <div>순위</div><div>선수</div><div>팀</div><div>PPG</div><div>APG</div><div>RPG</div><div>레이팅</div><div>변동</div>
            </div>
            {players.map((p, i) => (
              <div key={p.id} className="board__row" style={{gridTemplateColumns:'56px 1fr 72px 72px 72px 72px 80px 64px'}}>
                <div className="num" style={{fontFamily:'var(--ff-display)', fontSize:15, fontWeight:900, color: i<3 ? 'var(--accent)' : 'var(--ink-dim)'}}>{i+1}</div>
                <div className="title">
                  <span style={{width:22, height:22, background:'var(--bg-alt)', color:'var(--ink-soft)', display:'grid', placeItems:'center', fontSize:11, fontWeight:700, borderRadius:'50%', flexShrink:0}}>{p.name.charAt(0)}</span>
                  <a style={{fontWeight:600}}>{p.name}</a>
                  <span className="badge badge--ghost" style={{fontSize:10}}>{p.pos}</span>
                </div>
                <div style={{fontFamily:'var(--ff-mono)', fontSize:11, fontWeight:700}}>{p.team}</div>
                <div style={{fontFamily:'var(--ff-mono)', fontWeight: sort==='ppg' ? 800 : 500, color: sort==='ppg' ? 'var(--ink)' : 'var(--ink-mute)'}}>{p.ppg}</div>
                <div style={{fontFamily:'var(--ff-mono)', fontWeight: sort==='apg' ? 800 : 500, color: sort==='apg' ? 'var(--ink)' : 'var(--ink-mute)'}}>{p.apg}</div>
                <div style={{fontFamily:'var(--ff-mono)', fontWeight: sort==='rpg' ? 800 : 500, color: sort==='rpg' ? 'var(--ink)' : 'var(--ink-mute)'}}>{p.rpg}</div>
                <div style={{fontFamily:'var(--ff-mono)', fontWeight:800}}>{p.rating}</div>
                <div><Trend v={p.trend}/></div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

window.Rank = Rank;
