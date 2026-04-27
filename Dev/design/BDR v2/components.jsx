/* global React, BOARDS, POSTS, HOT_POSTS, LATEST_POSTS, HOME_STATS, TOURNAMENTS, TEAMS, POST_DETAIL, COMMENTS */

const { useState, useEffect, useMemo, useRef } = React;

// ============================================================
// Icons (inline SVG, minimal set)
// ============================================================
const Icon = {
  sun:  (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>,
  moon: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>,
  search: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>,
  bell: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>,
  plus: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 5v14M5 12h14"/></svg>,
  image: (p) => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/><path d="m21 15-5-5L5 21"/></svg>,
  heart: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  eye:   (p) => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  msg:   (p) => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  chevron:(p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m9 18 6-6-6-6"/></svg>,
};

// ============================================================
// Avatar — shows logo image if provided, else colored letter block
// ============================================================
function Avatar({ src, tag, name, color, ink = '#fff', size = 44, radius = 6, title }) {
  const [ok, setOk] = useState(!!src);
  if (src && ok) {
    return (
      <img src={src} alt={name || tag} title={title || name}
        style={{ width:size, height:size, borderRadius:radius, objectFit:'cover', background:'var(--bg-alt)', border:'1px solid var(--border)', flex:'0 0 auto' }}
        onError={() => setOk(false)}
      />
    );
  }
  return (
    <div style={{
      width:size, height:size, background:color || 'var(--ink-soft)', color:ink,
      display:'grid', placeItems:'center',
      fontFamily:'var(--ff-mono)', fontWeight:700,
      fontSize: size > 60 ? 16 : size > 40 ? 12 : 10,
      borderRadius:radius, flex:'0 0 auto', letterSpacing:'.04em',
    }} title={title || name}>
      {tag || (name ? name.slice(0,2).toUpperCase() : '?')}
    </div>
  );
}

// ============================================================
// Poster — tournament poster image with fallback gradient
// ============================================================
function Poster({ src, title, edition, accent = '#E31B23', width = 'auto', height = 160, radius = 6 }) {
  const [ok, setOk] = useState(!!src);
  if (src && ok) {
    return (
      <img src={src} alt={title}
        style={{ width, height, borderRadius:radius, objectFit:'cover', display:'block', background:'var(--bg-alt)' }}
        onError={() => setOk(false)}
      />
    );
  }
  return (
    <div style={{
      width, height, borderRadius:radius,
      background:`linear-gradient(135deg, ${accent} 0%, color-mix(in oklab, ${accent} 60%, #000) 100%)`,
      color:'#fff', padding:'18px 18px', display:'flex', flexDirection:'column', justifyContent:'space-between',
      position:'relative', overflow:'hidden',
    }}>
      <div style={{position:'absolute', inset:0, opacity:.12, background:'repeating-linear-gradient(135deg, #fff 0 2px, transparent 2px 14px)'}}/>
      <div style={{fontSize:10, fontWeight:800, letterSpacing:'.18em', opacity:.85, position:'relative'}}>{edition}</div>
      <div style={{fontFamily:'var(--ff-display)', fontSize:22, fontWeight:900, letterSpacing:'-0.02em', lineHeight:1.05, position:'relative'}}>{title}</div>
    </div>
  );
}

// ============================================================
// Theme switch
// ============================================================
function ThemeSwitch({ theme, setTheme }) {
  return (
    <div className="theme-switch" role="group" aria-label="theme">
      <button className="theme-switch__btn" data-active={theme === 'light'} onClick={() => setTheme('light')}>
        <Icon.sun/> 라이트
      </button>
      <button className="theme-switch__btn" data-active={theme === 'dark'} onClick={() => setTheme('dark')}>
        <Icon.moon/> 다크
      </button>
    </div>
  );
}

// ============================================================
// App nav (top bar) — utility + main
// ============================================================
function AppNav({ route, setRoute, theme, setTheme }) {
  const tabs = [
    { id: 'home',   label: '홈' },
    { id: 'games',  label: '경기' },
    { id: 'match',  label: '대회' },
    { id: 'orgs',   label: '단체' },
    { id: 'team',   label: '팀' },
    { id: 'court',  label: '코트' },
    { id: 'rank',   label: '랭킹' },
    { id: 'board',  label: '커뮤니티' },
  ];
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);
  useEffect(() => {
    if (!moreOpen) return;
    const close = () => setMoreOpen(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [moreOpen]);
  const go = (id) => { setRoute(id); setDrawerOpen(false); setMoreOpen(false); };
  const moreItems = [
    { id:'mygames',   label:'내 신청 내역', icon:'📋' },
    { id:'guestApps', label:'게스트 지원', icon:'🎟️' },
    { id:'calendar',  label:'일정', icon:'📅' },
    { id:'saved',     label:'보관함', icon:'🔖' },
    { id:'messages',  label:'쪽지', icon:'💬' },
    { id:'live',      label:'라이브 중계', icon:'🔴' },
    { id:'bracket',   label:'대진표', icon:'🏆' },
    { id:'gameResult', label:'경기 결과', icon:'📊' },
    { id:'referee',   label:'심판 센터', icon:'🦓' },
    { id:'reviews',   label:'리뷰', icon:'⭐' },
    { id:'awards',    label:'수상 아카이브', icon:'🏆' },
    { id:'gallery',   label:'갤러리', icon:'🎞' },
    { id:'safety',    label:'안전·차단', icon:'🛡' },
    { id:'scrim',     label:'스크림 매칭', icon:'🆚' },
    { id:'achievements', label:'업적·배지', icon:'🎖' },
    { id:'stats',     label:'스탯 분석', icon:'📈' },
    { id:'coaches',   label:'코치·트레이너', icon:'👔' },
    { id:'shop',      label:'샵', icon:'🛒' },
    { id:'calendar',  label:'내 일정', icon:'📅' },
    { id:'saved',     label:'보관함', icon:'🔖' },
    { id:'messages',  label:'쪽지', icon:'💬' },
    { id:'live',      label:'라이브 중계', icon:'🔴' },
    { id:'bracket',   label:'대진표', icon:'🏆' },
    { id:'gameResult', label:'경기 결과', icon:'📊' },
    { id:'courtBooking', label:'코트 예약', icon:'📍' },
    { id:'teamCreate', label:'팀 등록', icon:'➕' },
    { id:'tournamentEnroll', label:'대회 접수', icon:'📝' },
    { id:'about',     label:'소개', icon:'ℹ' },
    { id:'pricing',   label:'요금제', icon:'💎' },
    { id:'help',      label:'도움말', icon:'❓' },
  ];
  return (
    <nav className="app-nav">
      <div className="app-nav__utility">
        <div className="app-nav__utility-inner">
          <span>MyBDR 커뮤니티</span>
          <span className="sep"/>
          <a href="#" onClick={(e)=>{e.preventDefault();setRoute('about');}}>소개</a>
          <span className="sep"/>
          <a href="#" onClick={(e)=>{e.preventDefault();setRoute('pricing');}}>요금제</a>
          <span className="sep"/>
          <a href="#" onClick={(e)=>{e.preventDefault();setRoute('help');}}>도움말</a>
          <span className="app-nav__utility-spacer"/>
          <a href="#" onClick={(e)=>{e.preventDefault();setRoute('profile');}}>rdm_captain</a>
          <span className="sep"/>
          <a href="#" onClick={(e)=>{e.preventDefault();setRoute('settings');}}>설정</a>
          <span className="sep"/>
          <a href="#" onClick={(e)=>{e.preventDefault();setRoute('login');}}>로그아웃</a>
        </div>
      </div>
      <div className="app-nav__main">
        <a href="#" className="app-nav__logo" onClick={(e)=>{e.preventDefault();setRoute('home');}}>
          <img src="assets/bdr-logo.png" alt=""/>
          <span>MyBDR<span className="dot">.</span></span>
        </a>
        <div className="app-nav__tabs">
          {tabs.map(t => (
            <button key={t.id} className="app-nav__tab" data-active={route === t.id || (route === 'post' && t.id === 'board')} onClick={() => setRoute(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="app-nav__right">
          <ThemeSwitch theme={theme} setTheme={setTheme}/>
          <button className="btn btn--sm" title="검색" onClick={()=>setRoute('search')}><Icon.search/></button>
          <button className="btn btn--sm" title="알림" onClick={()=>setRoute('notifications')} style={{position:'relative'}}>
            <Icon.bell/>
            <span style={{position:'absolute', top:4, right:4, width:6, height:6, borderRadius:'50%', background:'var(--accent)'}}/>
          </button>
          <div style={{position:'relative'}} onClick={(e)=>e.stopPropagation()}>
            <button className="btn btn--sm" title="더보기" onClick={()=>setMoreOpen(!moreOpen)} style={{fontSize:12, fontWeight:600, padding:'0 10px'}}>
              더보기 <span style={{fontSize:9, marginLeft:2, transform: moreOpen ? 'rotate(180deg)' : 'none', display:'inline-block'}}>▼</span>
            </button>
            {moreOpen && (
              <div style={{position:'absolute', top:'calc(100% + 6px)', right:0, minWidth:200, background:'var(--bg)', border:'1px solid var(--border)', boxShadow:'var(--sh-lift)', borderRadius:8, padding:'6px 0', zIndex:30}}>
                {moreItems.map(m => (
                  <button key={m.id} onClick={()=>go(m.id)} style={{display:'flex', alignItems:'center', gap:10, width:'100%', padding:'9px 14px', background:'transparent', border:0, cursor:'pointer', fontSize:13, color:'var(--ink)', textAlign:'left'}} onMouseEnter={(e)=>e.currentTarget.style.background='var(--bg-alt)'} onMouseLeave={(e)=>e.currentTarget.style.background='transparent'}>
                    <span style={{width:18, textAlign:'center', fontSize:13}}>{m.icon}</span>
                    <span style={{fontWeight: route === m.id ? 700 : 500}}>{m.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className="btn btn--sm" title="마이페이지" onClick={()=>setRoute('profile')} style={{padding:'0 6px 0 4px', gap:6, display:'flex', alignItems:'center'}}>
            <span style={{width:22, height:22, background:'var(--bdr-red)', color:'#fff', fontFamily:'var(--ff-mono)', fontSize:10, fontWeight:700, display:'grid', placeItems:'center', borderRadius:3}}>RDM</span>
            <span style={{fontSize:12, fontWeight:600}}>rdm_captain</span>
          </button>
          <button className="app-nav__burger" aria-label="메뉴" onClick={()=>setDrawerOpen(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M3 7h18M3 12h18M3 17h18"/></svg>
          </button>
        </div>
      </div>
      <div className="app-nav__bottom-line"/>

      {drawerOpen && (
        <>
          <div className="drawer-backdrop" onClick={()=>setDrawerOpen(false)}/>
          <aside className="drawer" role="dialog" aria-modal="true">
            <div className="drawer__head">
              <div className="drawer__head-title">MyBDR<span className="dot">.</span></div>
              <button className="drawer__close" onClick={()=>setDrawerOpen(false)} aria-label="닫기">×</button>
            </div>
            <div className="drawer__body">
              {tabs.map(t => (
                <button key={t.id} className="drawer__item" data-active={route === t.id || (route === 'post' && t.id === 'board')} onClick={()=>go(t.id)}>
                  <span>{t.label}</span>
                  <Icon.chevron/>
                </button>
              ))}
              <div className="drawer__divider"/>
              <button className="drawer__item" onClick={()=>go('write')}>
                <span>글쓰기</span><Icon.plus/>
              </button>
              <button className="drawer__item">
                <span>알림</span><Icon.bell/>
              </button>
            </div>
            <div className="drawer__foot">
              <ThemeSwitch theme={theme} setTheme={setTheme}/>
              <div style={{fontSize:11, color:'var(--ink-dim)', textAlign:'center'}}>rdm_captain · 로그아웃</div>
            </div>
          </aside>
        </>
      )}
    </nav>
  );
}

// ============================================================
// Onboarding modal — first-visit theme picker
// ============================================================
function Onboarding({ onPick, onSkip }) {
  const [sel, setSel] = useState('light');
  return (
    <div className="onb-backdrop" role="dialog" aria-modal="true">
      <div className="onb">
        <div className="onb__head">
          <h2>어서오세요, MyBDR 입니다</h2>
          <p>다음카페에서 이관하신 분들을 위해 익숙한 <b>라이트 모드</b>와, 새로운 감성의 <b>다크 모드</b> 두 가지를 준비했어요. 지금 바로 골라보세요 — 언제든 상단에서 바꿀 수 있습니다.</p>
        </div>
        <div className="onb__body">
          <button className="onb__card" data-sel={sel === 'light'} onClick={()=>setSel('light')}>
            <div className="onb__preview light"/>
            <div className="onb__tag">추천 · 기존 다음카페 분위기</div>
            <h3>라이트 모드</h3>
            <p>파란 헤더 · 깔끔한 게시판 · 익숙한 정보 구조. 이관하신 분들이 편하게 적응할 수 있어요.</p>
          </button>
          <button className="onb__card" data-sel={sel === 'dark'} onClick={()=>setSel('dark')}>
            <div className="onb__preview dark"/>
            <div className="onb__tag">새로운 감성</div>
            <h3>다크 모드</h3>
            <p>스포츠 포스터 톤 · 큰 타이포 · 레드 포인트. BDR의 새 브랜드 감성을 경험해보세요.</p>
          </button>
        </div>
        <div className="onb__foot">
          <button className="skip" onClick={onSkip}>나중에 선택하기</button>
          <button className="btn btn--primary btn--lg" onClick={() => onPick(sel)}>이 모드로 시작하기</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Level badge helper
// ============================================================
function LevelBadge({ level }) {
  if (level === 'ADMIN')  return <span className="badge badge--red">운영</span>;
  if (level === 'COACH')  return <span className="badge badge--blue">코치</span>;
  if (level === 'PRESS')  return <span className="badge badge--blue">기자</span>;
  return <span className="badge badge--ghost" style={{fontFamily:'var(--ff-mono)', fontSize:11}}>{level}</span>;
}

// ============================================================
// Pagination
// ============================================================
function Pager({ current = 1, total = 8, onGo = ()=>{} }) {
  const pages = Array.from({ length: total }, (_, i) => i + 1);
  return (
    <div className="pager">
      <button className="pager__btn" onClick={()=>onGo(Math.max(1, current-1))}>‹</button>
      {pages.map(p => (
        <button key={p} className="pager__btn" data-active={p === current} onClick={()=>onGo(p)}>{p}</button>
      ))}
      <button className="pager__btn" onClick={()=>onGo(Math.min(total, current+1))}>›</button>
    </div>
  );
}

// ============================================================
// Sidebar (board list)
// ============================================================
function Sidebar({ active, setActive, setRoute }) {
  const groups = [
    { title: '메인', items: BOARDS.filter(b => b.category === 'main') },
    { title: '플레이',  items: BOARDS.filter(b => b.category === 'play') },
    { title: '이야기',  items: BOARDS.filter(b => b.category === 'chat') },
  ];
  return (
    <aside className="aside">
      <div className="aside__group">
        <button className="btn btn--primary" style={{width:'100%'}} onClick={() => setRoute('write')}>
          <Icon.plus/> 글쓰기
        </button>
      </div>
      <div className="aside__divider"/>
      {groups.map(g => (
        <div key={g.title} className="aside__group">
          <div className="aside__title">{g.title}</div>
          {g.items.map(b => (
            <a key={b.id} className="aside__link" data-active={active === b.id} onClick={(e)=>{e.preventDefault(); setActive(b.id); setRoute('board');}}>
              <span>{b.name} {b.new && <span className="badge badge--new">N</span>}</span>
              <span className="count">{b.count.toLocaleString()}</span>
            </a>
          ))}
        </div>
      ))}
    </aside>
  );
}

Object.assign(window, { Icon, ThemeSwitch, AppNav, Onboarding, LevelBadge, Pager, Sidebar, Avatar, Poster });
