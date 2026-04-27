/* global React, TeamMono, Badge, Button, Icon, TEAMS, MY_TEAM */
const { useState: useApplyState } = React;

// ============================================================
// Apply Flow — 2 steps (simplified from 4)
//   Step 1: 팀/선수 선택 + 약관
//   Step 2: 결제 방법 + 완료
// ============================================================

function ApplyFlow({ t, onClose }) {
  const [step, setStep] = useApplyState(1);
  const [roster, setRoster] = useApplyState(['p1','p2','p3']);
  const [agreed, setAgreed] = useApplyState(true);

  return (
    <div style={{ border: '2px solid var(--border-hard)', background: 'var(--bg-card)', boxShadow: 'var(--sh-hard-md)' }}>
      {/* Step header */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '2px solid var(--border-hard)' }}>
        {[1,2].map(n => (
          <div key={n} style={{
            padding: '14px 20px',
            background: step === n ? '#000' : 'var(--bg-card-2)',
            color: step === n ? '#fff' : 'var(--ink-dim)',
            borderRight: n === 1 ? '2px solid var(--border-hard)' : 'none',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 24, height: 24, border: '2px solid currentColor',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--ff-display)', fontWeight: 900, fontSize: 12,
            }}>{n}</div>
            <span style={{ fontFamily: 'var(--ff-display)', fontWeight: 800, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {n === 1 ? '팀·선수 선택' : '결제 · 완료'}
            </span>
          </div>
        ))}
      </div>

      {/* Body */}
      <div style={{ padding: 24 }}>
        {step === 1 && <Step1 roster={roster} setRoster={setRoster} agreed={agreed} setAgreed={setAgreed}/>}
        {step === 2 && <Step2 t={t}/>}
        {step === 3 && <StepDone t={t}/>}
      </div>

      {/* Footer */}
      <div style={{ padding: 16, borderTop: '2px solid var(--border-hard)', background: 'var(--bg-card-2)', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <Button variant="ghost" onClick={step === 1 ? onClose : () => setStep(step - 1)}>
          {step === 1 ? '취소' : '이전'}
        </Button>
        {step < 3 && (
          <Button variant="primary" onClick={() => setStep(step + 1)}>
            {step === 1 ? '다음: 결제' : '신청 완료하기'} <Icon.arrow/>
          </Button>
        )}
        {step === 3 && (
          <Button onClick={onClose}>확인</Button>
        )}
      </div>
    </div>
  );
}

function Step1({ roster, setRoster, agreed, setAgreed }) {
  const myTeam = TEAMS.find(x => x.id === MY_TEAM.id);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      <section>
        <div className="eyebrow" style={{ marginBottom: 10 }}>참가 팀</div>
        <div style={{ border: '2px solid var(--border-hard)', padding: 14, display: 'flex', alignItems: 'center', gap: 14 }}>
          <TeamMono team={myTeam} size={48}/>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--ff-display)', fontWeight: 900, fontSize: 18, textTransform: 'uppercase' }}>{myTeam.name}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-dim)' }}>팀장 · R{myTeam.rating}</div>
          </div>
          <Badge variant="ok">자동 선택</Badge>
        </div>

        <div className="eyebrow" style={{ marginTop: 20, marginBottom: 10 }}>출전 선수 (3–5명)</div>
        {[
          { id: 'p1', name: '김현우 #23', role: '가드' },
          { id: 'p2', name: '이준호 #10', role: '포워드' },
          { id: 'p3', name: '박도윤 #7', role: '센터' },
          { id: 'p4', name: '최서진 #4', role: '가드' },
          { id: 'p5', name: '정민재 #15', role: '포워드' },
        ].map(p => {
          const on = roster.includes(p.id);
          return (
            <label key={p.id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 12px',
              border: '2px solid ' + (on ? 'var(--ink)' : 'var(--border)'),
              background: on ? 'var(--bg-card-2)' : 'transparent',
              marginTop: 8, cursor: 'pointer',
            }}>
              <div style={{
                width: 18, height: 18, border: '2px solid var(--border-hard)',
                background: on ? 'var(--bdr-red)' : 'transparent', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{on && <Icon.check/>}</div>
              <span style={{ flex: 1, fontWeight: 600 }}>{p.name}</span>
              <span style={{ fontSize: 11, color: 'var(--ink-dim)' }}>{p.role}</span>
              <input type="checkbox" checked={on} onChange={() => {
                setRoster(on ? roster.filter(x => x !== p.id) : [...roster, p.id]);
              }} style={{ display: 'none' }}/>
            </label>
          );
        })}
      </section>

      <section>
        <div className="eyebrow" style={{ marginBottom: 10 }}>확인 사항</div>
        <ul style={{ paddingLeft: 18, fontSize: 13, lineHeight: 1.8, color: 'var(--ink-mute)', margin: 0 }}>
          <li>대회 7일 전 취소 시 환불 불가</li>
          <li>FIBA 3x3 공식 규정 적용</li>
          <li>유니폼 미착용 시 실격 처리</li>
          <li>경기장 내 안전사고는 주최측 면책</li>
        </ul>
        <label style={{
          display: 'flex', alignItems: 'center', gap: 10, marginTop: 20,
          padding: 14, border: '2px solid var(--border-hard)',
          background: agreed ? 'var(--bg-card-2)' : 'transparent', cursor: 'pointer',
        }} onClick={() => setAgreed(!agreed)}>
          <div style={{
            width: 18, height: 18, border: '2px solid var(--border-hard)',
            background: agreed ? 'var(--ok)' : 'transparent', color: '#000',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{agreed && <Icon.check/>}</div>
          <span style={{ fontWeight: 600, fontSize: 13 }}>위 내용에 동의합니다</span>
        </label>

        <div className="eyebrow" style={{ marginTop: 28, marginBottom: 10 }}>참가 요약</div>
        <div style={{ border: '2px solid var(--border-hard)', padding: '14px 16px' }}>
          <InfoRow lbl="참가비" val="₩80,000"/>
          <InfoRow lbl="선수 수" val={`${roster.length}명`}/>
          <div style={{ margin: '10px 0', borderTop: '2px dashed var(--border)' }}/>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontFamily: 'var(--ff-display)', fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase' }}>총 결제</span>
            <span style={{ fontFamily: 'var(--ff-display)', fontWeight: 900, fontSize: 28, color: 'var(--bdr-red)' }}>₩80,000</span>
          </div>
        </div>
      </section>
    </div>
  );
}

function Step2({ t }) {
  const [method, setMethod] = useApplyState('bank');
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      <section>
        <div className="eyebrow" style={{ marginBottom: 10 }}>결제 방법</div>
        {[
          { id: 'bank', label: '계좌이체', sub: '신한 110-123-456789 · 72시간 내' },
          { id: 'card', label: '신용카드', sub: '즉시 확정' },
          { id: 'toss', label: '토스페이', sub: '즉시 확정' },
        ].map(m => {
          const on = method === m.id;
          return (
            <label key={m.id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 16px', marginTop: 8,
              border: '2px solid ' + (on ? 'var(--ink)' : 'var(--border)'),
              background: on ? 'var(--bg-card-2)' : 'transparent', cursor: 'pointer',
            }} onClick={() => setMethod(m.id)}>
              <div style={{
                width: 18, height: 18, borderRadius: '50%',
                border: '2px solid var(--border-hard)',
                background: on ? 'var(--bdr-red)' : 'transparent',
              }}/>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{m.label}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-dim)' }}>{m.sub}</div>
              </div>
            </label>
          );
        })}
      </section>

      <section>
        <div className="eyebrow" style={{ marginBottom: 10 }}>최종 확인</div>
        <div style={{ border: '2px solid var(--border-hard)', padding: 16 }}>
          <div style={{ fontFamily: 'var(--ff-display)', fontWeight: 900, fontSize: 16, textTransform: 'uppercase' }}>{t.title} {t.edition}</div>
          <div style={{ fontSize: 12, color: 'var(--ink-dim)', marginTop: 2 }}>{t.dates} · {t.court}</div>
          <div style={{ margin: '14px 0', height: 2, background: 'var(--border-hard)' }}/>
          <InfoRow lbl="참가팀" val="리딤"/>
          <InfoRow lbl="결제 방법" val={method === 'bank' ? '계좌이체' : method === 'card' ? '신용카드' : '토스페이'}/>
          <InfoRow lbl="금액" val="₩80,000"/>
        </div>
      </section>
    </div>
  );
}

function StepDone({ t }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
      <div style={{
        width: 80, height: 80, margin: '0 auto',
        background: 'var(--ok)', border: '3px solid var(--border-hard)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#000',
      }}>
        <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="3"><path d="M4 12l5 5L20 6"/></svg>
      </div>
      <h2 className="t-display" style={{ fontSize: 40, margin: '20px 0 8px' }}>신청 완료</h2>
      <p style={{ color: 'var(--ink-mute)', maxWidth: 420, margin: '0 auto' }}>
        입금 확인 후 최종 확정 알림을 보내드립니다. 영수증은 이메일로 발송됩니다.
      </p>
    </div>
  );
}

Object.assign(window, { ApplyFlow });
