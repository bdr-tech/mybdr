/* global React */

function Signup({ setRoute }) {
  const [step, setStep] = React.useState(1);

  return (
    <div className="page" style={{minHeight:'calc(100vh - 200px)', display:'grid', placeItems:'center'}}>
      <div style={{width:'100%', maxWidth:520}}>
        <div style={{display:'flex', alignItems:'center', gap:6, marginBottom:20}}>
          {[1,2,3].map(s => (
            <React.Fragment key={s}>
              <div style={{width:32, height:32, borderRadius:'50%', background: s <= step ? 'var(--cafe-blue)' : 'var(--bg-alt)', color: s <= step ? '#fff' : 'var(--ink-dim)', display:'grid', placeItems:'center', fontWeight:700, fontSize:14, fontFamily:'var(--ff-mono)'}}>{s}</div>
              {s < 3 && <div style={{flex:1, height:2, background: s < step ? 'var(--cafe-blue)' : 'var(--bg-alt)'}}/>}
            </React.Fragment>
          ))}
        </div>
        <div style={{fontSize:12, color:'var(--ink-mute)', textAlign:'center', marginBottom:8}}>회원가입 · {step}/3</div>
        <h1 style={{margin:'0 0 6px', fontSize:28, fontWeight:800, textAlign:'center', letterSpacing:'-0.015em'}}>
          {step === 1 ? '계정 만들기' : step === 2 ? '선수 프로필' : '활동 환경'}
        </h1>
        <p style={{margin:'0 0 24px', color:'var(--ink-mute)', textAlign:'center', fontSize:14}}>
          {step === 1 ? '이메일과 비밀번호를 입력해주세요' : step === 2 ? '경기에서 부를 이름과 포지션을 알려주세요' : '주로 뛰는 지역과 실력을 선택하면 맞춤 추천을 드려요'}
        </p>

        <div className="card" style={{padding:'28px 28px'}}>
          {step === 1 && (
            <div style={{display:'flex', flexDirection:'column', gap:14}}>
              <div>
                <label style={{fontSize:12, fontWeight:700, color:'var(--ink-mute)', letterSpacing:'.04em'}}>이메일</label>
                <input className="input" style={{marginTop:6}} defaultValue="rdm_captain@mybdr.kr" placeholder="you@example.com"/>
              </div>
              <div>
                <label style={{fontSize:12, fontWeight:700, color:'var(--ink-mute)', letterSpacing:'.04em'}}>비밀번호</label>
                <input className="input" style={{marginTop:6}} type="password" defaultValue="••••••••••"/>
                <div style={{fontSize:11, color:'var(--ink-dim)', marginTop:4}}>8자 이상, 숫자·기호 1개 이상 포함</div>
              </div>
              <div>
                <label style={{fontSize:12, fontWeight:700, color:'var(--ink-mute)', letterSpacing:'.04em'}}>비밀번호 확인</label>
                <input className="input" style={{marginTop:6}} type="password" defaultValue="••••••••••"/>
              </div>
              <label style={{display:'flex', alignItems:'center', gap:8, fontSize:13, marginTop:6}}>
                <input type="checkbox" defaultChecked/>
                <span>이용약관 및 개인정보처리방침에 동의합니다</span>
              </label>
            </div>
          )}
          {step === 2 && (
            <div style={{display:'flex', flexDirection:'column', gap:14}}>
              <div>
                <label style={{fontSize:12, fontWeight:700, color:'var(--ink-mute)', letterSpacing:'.04em'}}>닉네임</label>
                <input className="input" style={{marginTop:6}} defaultValue="rdm_captain"/>
              </div>
              <div>
                <label style={{fontSize:12, fontWeight:700, color:'var(--ink-mute)', letterSpacing:'.04em'}}>포지션</label>
                <div style={{display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:6, marginTop:6}}>
                  {['가드','슈가','스포','파포','센터'].map((p, i) => (
                    <button key={p} className="btn btn--sm" style={i === 0 ? {background:'var(--cafe-blue)', color:'#fff', borderColor:'var(--cafe-blue-deep)'} : {}}>{p}</button>
                  ))}
                </div>
              </div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14}}>
                <div>
                  <label style={{fontSize:12, fontWeight:700, color:'var(--ink-mute)', letterSpacing:'.04em'}}>키 (cm)</label>
                  <input className="input" style={{marginTop:6}} defaultValue="182"/>
                </div>
                <div>
                  <label style={{fontSize:12, fontWeight:700, color:'var(--ink-mute)', letterSpacing:'.04em'}}>등번호</label>
                  <input className="input" style={{marginTop:6}} defaultValue="7"/>
                </div>
              </div>
            </div>
          )}
          {step === 3 && (
            <div style={{display:'flex', flexDirection:'column', gap:16}}>
              <div>
                <label style={{fontSize:12, fontWeight:700, color:'var(--ink-mute)', letterSpacing:'.04em'}}>주 활동 지역 (복수선택)</label>
                <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:6, marginTop:8}}>
                  {['강남','강북','강서','강동','분당','일산','수원','인천'].map((a, i) => (
                    <button key={a} className="btn btn--sm" style={[0,3].includes(i) ? {background:'var(--cafe-blue)', color:'#fff', borderColor:'var(--cafe-blue-deep)'} : {}}>{a}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{fontSize:12, fontWeight:700, color:'var(--ink-mute)', letterSpacing:'.04em'}}>실력 수준</label>
                <div style={{display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:6, marginTop:8}}>
                  {['초보','초중급','중급','중상급','상급'].map((l, i) => (
                    <button key={l} className="btn btn--sm" style={i === 2 ? {background:'var(--cafe-blue)', color:'#fff', borderColor:'var(--cafe-blue-deep)'} : {}}>{l}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{fontSize:12, fontWeight:700, color:'var(--ink-mute)', letterSpacing:'.04em'}}>관심 경기 유형</label>
                <div style={{display:'flex', gap:6, flexWrap:'wrap', marginTop:8}}>
                  {['픽업','게스트','스크림','대회','정기팀'].map((t, i) => (
                    <button key={t} className="btn btn--sm" style={[0,3].includes(i) ? {background:'var(--cafe-blue)', color:'#fff', borderColor:'var(--cafe-blue-deep)'} : {}}>{t}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div style={{display:'flex', gap:10, marginTop:24}}>
            {step > 1 && <button className="btn" style={{flex:1}} onClick={()=>setStep(step-1)}>이전</button>}
            <button className="btn btn--primary" style={{flex:2}} onClick={()=> step < 3 ? setStep(step+1) : setRoute('home')}>
              {step < 3 ? '다음' : '시작하기 →'}
            </button>
          </div>
        </div>

        <div style={{textAlign:'center', marginTop:18, fontSize:13, color:'var(--ink-mute)'}}>
          이미 계정이 있으신가요? <a onClick={()=>setRoute('login')} style={{color:'var(--cafe-blue)', cursor:'pointer', fontWeight:600}}>로그인</a>
        </div>
      </div>
    </div>
  );
}

window.Signup = Signup;
