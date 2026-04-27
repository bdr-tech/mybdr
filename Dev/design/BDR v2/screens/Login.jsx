/* global React, Icon */

function Login({ setRoute }) {
  const [tab, setTab] = React.useState('login');
  return (
    <div className="page" style={{maxWidth:480, paddingTop:60}}>
      <div style={{textAlign:'center', marginBottom:28}}>
        <div style={{fontFamily:'var(--ff-display)', fontSize:36, fontWeight:900, letterSpacing:'-0.02em'}}>
          MyBDR<span style={{color:'var(--accent)'}}>.</span>
        </div>
        <div style={{fontSize:13, color:'var(--ink-mute)', marginTop:6}}>서울 3x3 농구 커뮤니티</div>
      </div>

      <div className="card" style={{padding:0, overflow:'hidden'}}>
        <div style={{display:'flex', borderBottom:'1px solid var(--border)'}}>
          {[['login','로그인'],['signup','회원가입']].map(([k,l]) => (
            <button key={k} onClick={()=>setTab(k)} style={{
              flex:1, padding:'14px 0', background: tab===k ? 'var(--bg-elev)' : 'var(--bg-alt)',
              border:0, borderBottom: tab===k ? '3px solid var(--cafe-blue)' : '3px solid transparent',
              color: tab===k ? 'var(--ink)' : 'var(--ink-mute)',
              fontWeight: tab===k ? 700 : 500, fontSize:14, cursor:'pointer',
            }}>{l}</button>
          ))}
        </div>
        <div style={{padding:'24px 24px 28px'}}>
          {tab === 'login' ? (
            <>
              <div className="label">아이디</div>
              <input className="input" defaultValue="rdm_captain" style={{marginBottom:14}}/>
              <div className="label">비밀번호</div>
              <input className="input" type="password" defaultValue="••••••••" style={{marginBottom:12}}/>
              <div style={{display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:18}}>
                <label style={{display:'flex', gap:6, alignItems:'center', cursor:'pointer'}}>
                  <input type="checkbox" defaultChecked/> 자동 로그인
                </label>
                <a href="#">비밀번호 찾기</a>
              </div>
              <button className="btn btn--primary btn--xl" onClick={()=>setRoute('home')}>로그인</button>
              <div style={{display:'flex', alignItems:'center', gap:10, margin:'18px 0', color:'var(--ink-dim)', fontSize:12}}>
                <div style={{flex:1, height:1, background:'var(--border)'}}/>또는<div style={{flex:1, height:1, background:'var(--border)'}}/>
              </div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
                <button className="btn" style={{background:'#FEE500', borderColor:'#FEE500', color:'#000'}}>카카오</button>
                <button className="btn">네이버</button>
              </div>
            </>
          ) : (
            <>
              <div className="label">아이디</div>
              <input className="input" placeholder="영문+숫자 6자 이상" style={{marginBottom:14}}/>
              <div className="label">비밀번호</div>
              <input className="input" type="password" placeholder="8자 이상" style={{marginBottom:14}}/>
              <div className="label">비밀번호 확인</div>
              <input className="input" type="password" style={{marginBottom:14}}/>
              <div className="label">닉네임</div>
              <input className="input" placeholder="커뮤니티에서 표시됩니다" style={{marginBottom:14}}/>
              <div className="label">활동 지역</div>
              <select className="select" style={{marginBottom:18}}>
                <option>서울 전체</option><option>경기</option><option>인천</option>
              </select>
              <label style={{display:'flex', gap:6, alignItems:'flex-start', fontSize:12, color:'var(--ink-mute)', marginBottom:16}}>
                <input type="checkbox"/> <span>이용약관 및 개인정보처리방침에 동의합니다</span>
              </label>
              <button className="btn btn--primary btn--xl">가입하기</button>
            </>
          )}
        </div>
      </div>

      <div style={{textAlign:'center', marginTop:16, fontSize:12, color:'var(--ink-dim)'}}>
        <a onClick={()=>setRoute('home')} style={{cursor:'pointer'}}>← 홈으로 돌아가기</a>
      </div>
    </div>
  );
}

window.Login = Login;
