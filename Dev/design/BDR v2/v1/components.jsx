/* global React */
const { useState, useMemo, useEffect, useRef } = React;

// ============================================================
// MyBDR — Shared Components (Brutalist)
// ============================================================

// Tiny SVG icons
const Icon = {
  clock: (p) => <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>,
  pin:   (p) => <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" {...p}><path d="M12 22s7-7.5 7-13a7 7 0 1 0-14 0c0 5.5 7 13 7 13z"/><circle cx="12" cy="9" r="2.5"/></svg>,
  users: (p) => <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" {...p}><circle cx="9" cy="8" r="3.5"/><path d="M2 21c0-3.5 3-6 7-6s7 2.5 7 6"/><circle cx="17" cy="7" r="2.5"/><path d="M16 14c3 0 6 2 6 5"/></svg>,
  money: (p) => <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" {...p}><rect x="2.5" y="6" width="19" height="12"/><circle cx="12" cy="12" r="2.5"/><path d="M6 9v6M18 9v6"/></svg>,
  trophy:(p) => <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" {...p}><path d="M7 4h10v4a5 5 0 0 1-10 0V4z"/><path d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3"/><path d="M9 13l-1 4h8l-1-4M8 20h8"/></svg>,
  share: (p) => <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" {...p}><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8 11l8-4M8 13l8 4"/></svg>,
  chat:  (p) => <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" {...p}><path d="M4 5h16v11H8l-4 4V5z"/></svg>,
  phone: (p) => <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" {...p}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>,
  check: (p) => <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" {...p}><path d="M4 12l5 5L20 6"/></svg>,
  alert: (p) => <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" {...p}><path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/></svg>,
  arrow: (p) => <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" {...p}><path d="M5 12h14M13 6l6 6-6 6"/></svg>,
  x:     (p) => <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" {...p}><path d="M5 5l14 14M19 5L5 19"/></svg>,
};

// Team monogram — substitute for real logo
function TeamMono({ team, size = 40, square = true }) {
  if (!team) return null;
  return (
    <div
      className="team-mono"
      style={{
        width: size, height: size,
        background: team.color, color: team.ink,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--ff-display)', fontWeight: 900,
        fontSize: size * 0.38, letterSpacing: '-0.02em',
        border: '2px solid var(--border-hard)',
        borderRadius: square ? 0 : '50%',
        flexShrink: 0, lineHeight: 1,
      }}
      title={team.name}
    >
      {team.tag}
    </div>
  );
}

// Badge
function Badge({ children, variant = 'default', className = '', style = {} }) {
  const cls = 'badge' + (variant === 'red' ? ' badge--red'
    : variant === 'ok' ? ' badge--ok'
    : variant === 'warn' ? ' badge--warn'
    : variant === 'solid-dark' ? ' badge--solid-dark'
    : variant === 'ghost' ? ' badge--ghost' : '');
  return <span className={cls + ' ' + className} style={style}>{children}</span>;
}

// Button
function Button({ children, variant = 'default', size = 'md', disabled, onClick, as = 'button', href, style = {}, className = '', ...rest }) {
  const cls = 'btn'
    + (variant === 'primary' ? ' btn--primary'
    : variant === 'ghost' ? ' btn--ghost'
    : variant === 'danger' ? ' btn--danger' : '')
    + (size === 'lg' ? ' btn--lg' : size === 'xl' ? ' btn--xl' : size === 'sm' ? ' btn--sm' : '')
    + ' ' + className;
  if (as === 'a') return <a className={cls} href={href} style={style} {...rest}>{children}</a>;
  return <button className={cls} disabled={disabled} onClick={onClick} style={style} {...rest}>{children}</button>;
}

// Status → button config (big sticky CTA)
function statusCta(status) {
  switch (status) {
    case 'open':      return { label: '참가 신청', variant: 'primary', disabled: false };
    case 'closing':   return { label: '지금 신청 (마감임박)', variant: 'primary', disabled: false };
    case 'closed':    return { label: '대기명단 등록', variant: 'default', disabled: false };
    case 'live':      return { label: '실시간 결과 보기', variant: 'default', disabled: false };
    case 'ended':     return { label: '결과 보기', variant: 'default', disabled: false };
    case 'preparing': return { label: '알림 받기', variant: 'default', disabled: false };
    case 'applied':   return { label: '신청 완료됨', variant: 'default', disabled: true };
    case 'no-team':   return { label: '팀 생성 후 신청', variant: 'default', disabled: true };
    default: return { label: '신청', variant: 'primary', disabled: false };
  }
}

function statusBadge(status) {
  switch (status) {
    case 'open':      return <Badge variant="ok">접수중</Badge>;
    case 'closing':   return <Badge variant="red">마감임박</Badge>;
    case 'closed':    return <Badge variant="solid-dark">접수마감</Badge>;
    case 'live':      return <Badge variant="red">● LIVE</Badge>;
    case 'ended':     return <Badge variant="ghost">종료</Badge>;
    case 'preparing': return <Badge variant="warn">접수예정</Badge>;
    case 'applied':   return <Badge variant="ok">신청완료</Badge>;
    case 'no-team':   return <Badge variant="ghost">팀 없음</Badge>;
    default:          return <Badge>{status}</Badge>;
  }
}

// Banner — placeholder imagery w/ brutalist treatment
function HeroBanner({ t, state, height = 420 }) {
  const accent = t.accent || 'var(--bdr-red)';
  return (
    <div className="hero" style={{ position: 'relative', height, overflow: 'hidden', border: '2px solid var(--border-hard)' }}>
      {/* Noise + diagonal grid placeholder */}
      <div style={{
        position: 'absolute', inset: 0,
        background:
          `repeating-linear-gradient(135deg, ${accent} 0 8px, #0000 8px 24px), ` +
          `linear-gradient(135deg, #000 0%, #1a1a1a 50%, ${accent}22 100%)`,
        opacity: 0.9,
      }}/>
      {/* Diagonal red slash */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(115deg, transparent 40%, ${accent} 40%, ${accent} 44%, transparent 44%)`,
      }}/>
      {/* Grain texture via radial */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(1200px 600px at 80% 110%, rgba(0,0,0,0.6), transparent 60%), radial-gradient(600px 400px at 10% -10%, rgba(255,255,255,0.08), transparent 60%)',
        mixBlendMode: 'multiply',
      }}/>
      {/* Content */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 32 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Badge variant="solid-dark">{t.level}</Badge>
          {statusBadge(state || t.status)}
          {t.tags && t.tags.filter(tag => tag !== t.level).slice(0,2).map(x => <Badge key={x} variant="ghost" style={{ color: '#fff', borderColor: '#fff' }}>{x}</Badge>)}
        </div>
        <div>
          <div style={{ fontFamily: 'var(--ff-display)', fontSize: 13, letterSpacing: '0.2em', color: '#fff', opacity: 0.8, textTransform: 'uppercase' }}>
            {t.edition}
          </div>
          <h1 style={{
            fontFamily: 'var(--ff-display)', fontWeight: 900, color: '#fff',
            fontSize: 'clamp(56px, 7vw, 112px)', lineHeight: 0.9, letterSpacing: '-0.03em',
            margin: '4px 0 10px', textTransform: 'uppercase',
            textShadow: `6px 6px 0 #000`,
          }}>
            {t.title}
          </h1>
          <div style={{ color: '#fff', fontSize: 18, opacity: 0.9, fontWeight: 600 }}>{t.subtitle}</div>
        </div>
      </div>
      {/* Placeholder watermark */}
      <div style={{
        position: 'absolute', top: 10, right: 12,
        fontFamily: 'var(--ff-mono)', fontSize: 10, letterSpacing: 0.2, color: 'rgba(255,255,255,0.5)'
      }}>PLACEHOLDER · 주최자 업로드 배너 영역</div>
    </div>
  );
}

// Hard stat cell
function Stat({ num, lbl, accent }) {
  return (
    <div style={{ padding: '16px 20px', borderRight: '2px solid var(--border-hard)' }}>
      <div className="stat-num" style={{ color: accent || 'inherit' }}>{num}</div>
      <div className="stat-lbl">{lbl}</div>
    </div>
  );
}

// D-Day computation (from ISO)
function dDay(iso) {
  if (!iso) return null;
  const now = new Date();
  const t = new Date(iso);
  const diff = Math.ceil((t - now) / (1000*60*60*24));
  return diff;
}

Object.assign(window, {
  Icon, TeamMono, Badge, Button, HeroBanner, Stat,
  statusCta, statusBadge, dDay,
});
