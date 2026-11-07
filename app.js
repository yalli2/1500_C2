/* Vamos a practicar · 1500 Preguntas — interactive quiz (shared by all levels) */
(function(){
  const CFG = window.SITE;                 // {level:'A1', title:'...', levels:[...]}
  const LV = CFG.level;
  const SET_SIZE = 50;
  const SECS = {
    G:{name:'문법', es:'Gramática', icon:'📘', desc:'동사·대명사·전치사·접속법 등 문법 750문항'},
    V:{name:'어휘', es:'Vocabulario', icon:'📗', desc:'생활·사회·관용 표현 등 어휘 750문항'}
  };
  const KEY = 'vap1500_'+LV;
  const $ = (s,el=document)=>el.querySelector(s);
  const app = $('#app');
  const DATA = {};

  /* ---------- storage ---------- */
  function load(){ try{ return JSON.parse(localStorage.getItem(KEY))||{}; }catch(e){ return {}; } }
  function save(st){ try{ localStorage.setItem(KEY, JSON.stringify(st)); }catch(e){} }
  let ST = load();               // { sets: {'G1':{best,last,answers:{id:idx},graded:bool}}, wrong:{id:true}, mode:'exam' }
  ST.sets = ST.sets||{}; ST.wrong = ST.wrong||{}; ST.mode = ST.mode||'exam';

  /* ---------- data loading ---------- */
  function loadSec(s){
    if (DATA[s]) return Promise.resolve(DATA[s]);
    return new Promise((res,rej)=>{
      const sc=document.createElement('script');
      sc.src='data/'+s+'.js?v='+(CFG.v||1);
      sc.onload=()=>{ DATA[s]=window['DATA_'+s]; res(DATA[s]); };
      sc.onerror=rej; document.head.appendChild(sc);
    });
  }

  /* ---------- helpers ---------- */
  const esc = t => String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const optTxt = o => o==='ø' ? 'ø <span class="zero">(아무것도 넣지 않음)</span>' : esc(o);
  const L = 'ABCD';
  const isOk = (q,k)=> k!=null && k>=0 && q.o[k]===q.o[q.a];
  function setRange(n){ const a=(n-1)*SET_SIZE+1; return [a, a+SET_SIZE-1]; }
  function setQs(s,n){ const [a,b]=setRange(n); return DATA[s].slice(a-1,b); }
  function secStats(s){
    let done=0, correct=0, answered=0;
    for(let n=1;n<=15;n++){ const r=ST.sets[s+n]; if(r&&r.best!=null){ done++; correct+=r.best; } }
    return {done, correct};
  }
  function cls(score){ if(score==null) return ''; const p=score/SET_SIZE; return p>=.8?'done':p>=.5?'mid':'low'; }

  /* ---------- routing ---------- */
  function route(){
    const h=location.hash.replace('#','');
    const m=h.match(/^([GV])(\d{1,2})$/);
    if(m && +m[2]>=1 && +m[2]<=15) return quiz(m[1], +m[2]);
    const w=h.match(/^wrong-([GV])$/);
    if(w) return quiz(w[1], 0);
    home();
  }
  window.addEventListener('hashchange', route);

  /* ---------- home ---------- */
  function home(){
    document.title = `${LV} · Vamos a practicar 1500 Preguntas`;
    $('#dock').innerHTML=''; $('#dock').style.display='none';
    const g=secStats('G'), v=secStats('V');
    const totalDone=g.done+v.done, totalCorrect=g.correct+v.correct;
    const acc = totalDone? Math.round(totalCorrect/(totalDone*SET_SIZE)*100)+'%' : '–';
    const wrongN = Object.keys(ST.wrong).length;
    let html = `
    <section class="hero wrap">
      <h1>Vamos a practicar <em>${LV}</em></h1>
      <p>${esc(CFG.subtitle)} · 문법 750 + 어휘 750 = <b>1500문항</b>. 50문항 세트마다 따로 채점하고, 문제마다 쉬운 한국어 해설을 확인하세요.</p>
      <div class="stats">
        <div class="stat"><b>${totalDone}<small style="font-size:14px;color:var(--muted)"> / 30</small></b><span>완료한 세트</span></div>
        <div class="stat"><b>${totalCorrect}</b><span>맞힌 문항 (세트 최고점 합계)</span></div>
        <div class="stat"><b>${acc}</b><span>정답률</span></div>
        <div class="stat"><b>${wrongN}</b><span>오답노트 문항</span></div>
      </div>
    </section>
    <section class="sections wrap">`;
    for(const s of ['G','V']){
      const st=secStats(s), meta=SECS[s];
      const pct=Math.round(st.done/15*100);
      const wn=Object.keys(ST.wrong).filter(k=>k[0]===s).length;
      html+=`<div class="sec">
        <h2>${meta.icon} ${meta.name} <small>${meta.es} · 750문항</small></h2>
        <div class="bar"><i style="width:${pct}%"></i></div>
        <div class="meta"><span>${meta.desc}</span><span>${st.done}/15 세트</span></div>
        <div class="sets">`;
      for(let n=1;n<=15;n++){
        const r=ST.sets[s+n], [a,b]=setRange(n);
        const sc = r&&r.best!=null ? `${r.best}/${SET_SIZE}` : (r&&r.answers&&Object.keys(r.answers).length? '진행 중':'—');
        html+=`<a class="set ${cls(r&&r.best)}" href="#${s}${n}"><span class="n">${n}</span><span class="r">${a}–${b}</span><span class="sc">${sc}</span></a>`;
      }
      html+=`</div><div class="tools">
          <a class="btn primary" href="#${s}${nextSet(s)}">${st.done? '이어서 풀기':'시작하기'} →</a>
          <a class="btn" href="#wrong-${s}" ${wn?'':'style="pointer-events:none;opacity:.45"'}>오답노트 (${wn})</a>
        </div></div>`;
    }
    html+=`</section>
    <section class="wrap"><div class="howto">
      <b>사용 방법</b> · 세트를 고르고 보기를 선택하세요. <b>시험 모드</b>는 50문항을 모두 푼 뒤 <b>채점하기</b>로 한 번에 채점하고,
      <b>바로 확인 모드</b>는 고르는 즉시 정답과 해설을 보여 줍니다. 틀린 문제는 자동으로 <b>오답노트</b>에 모이고,
      기록은 이 브라우저에 저장됩니다. <a href="#" id="reset" style="color:var(--red)">기록 초기화</a>
    </div></section>`;
    app.innerHTML=html; window.scrollTo(0,0);
    $('#reset').onclick=e=>{ e.preventDefault(); if(confirm(LV+' 레벨의 모든 풀이 기록을 지울까요?')){ ST={sets:{},wrong:{},mode:ST.mode}; save(ST); home(); } };
  }
  function nextSet(s){ for(let n=1;n<=15;n++){ const r=ST.sets[s+n]; if(!r||r.best==null) return n; } return 1; }

  /* ---------- quiz ---------- */
  let Q=null; // current {s,n,qs,answers,graded,key}
  function quiz(s,n){
    app.innerHTML='<div class="loading">문제를 불러오는 중…</div>';
    loadSec(s).then(()=>{
      const isWrong = n===0;
      const qs = isWrong ? DATA[s].filter(q=>ST.wrong[q.id]) : setQs(s,n);
      const key = isWrong ? 'W'+s : s+n;
      const rec = ST.sets[key] || {};
      Q = {s,n,qs,key,isWrong,answers:Object.assign({},rec.answers||{}),graded:!!rec.graded};
      if(isWrong){ Q.answers={}; Q.graded=false; }
      renderQuiz();
    }).catch(()=>{ app.innerHTML='<div class="empty">데이터를 불러오지 못했습니다. 새로고침해 주세요.</div>'; });
  }
  function renderQuiz(){
    const {s,n,qs,isWrong}=Q, meta=SECS[s];
    document.title = `${LV} ${meta.name} ${isWrong?'오답노트':'세트 '+n} · 1500 Preguntas`;
    if(!qs.length){ app.innerHTML=`<div class="empty wrap">오답노트가 비어 있습니다 🎉<br><br><a class="btn" href="#">← 처음으로</a></div>`; $('#dock').style.display='none'; return; }
    const [a,b]=setRange(n||1);
    if(ST.mode==='exam' && !Q.graded) return renderSingle();
    let html=`<section class="wrap"><div class="qhead">
      <div><div class="crumb"><a href="#">${LV} 홈</a> › ${meta.name} (${meta.es})</div>
      <h1>${isWrong?'오답노트 · '+qs.length+'문항':'세트 '+n+' <small style="font-size:15px;color:var(--muted);font-weight:500">'+a+'–'+b+'번</small>'}</h1></div>
      <div class="right">
        <div class="mode"><button data-m="exam" class="${ST.mode==='exam'?'on':''}">시험 모드</button><button data-m="instant" class="${ST.mode==='instant'?'on':''}">바로 확인</button></div>
      </div></div>
      <div class="qlist">`;
    qs.forEach((q,i)=>{ html+=card(q,i); });
    html+=`</div>`;
    if(!isWrong){
      html+=`<div style="display:flex;gap:8px;justify-content:space-between;margin:-90px 0 120px">
        ${n>1?`<a class="btn" href="#${s}${n-1}">← 세트 ${n-1}</a>`:'<span></span>'}
        ${n<15?`<a class="btn" href="#${s}${n+1}">세트 ${n+1} →</a>`:'<span></span>'}</div>`;
    }
    html+=`</section>`;
    app.innerHTML=html; window.scrollTo(0,0);
    bindMode();
    app.querySelectorAll('.qcard').forEach(el=>bindCard(el));
    if(Q.graded) qs.forEach(q=>reveal(q.id));
    else if(ST.mode==='instant') qs.forEach(q=>{ if(Q.answers[q.id]!=null) reveal(q.id); });
    dock();
  }

  function bindMode(){
    app.querySelectorAll('.mode button').forEach(bt=>bt.onclick=()=>{ if(ST.mode===bt.dataset.m) return; ST.mode=bt.dataset.m; save(ST); renderQuiz(); });
  }
  function headHTML(){
    const {s,n,qs,isWrong}=Q, meta=SECS[s], [a,b]=setRange(n||1);
    return `<div class="qhead">
      <div><div class="crumb"><a href="#">${LV} 홈</a> › ${meta.name} (${meta.es})</div>
      <h1>${isWrong?'오답노트 · '+qs.length+'문항':'세트 '+n+' <small style="font-size:15px;color:var(--muted);font-weight:500">'+a+'–'+b+'번</small>'}</h1></div>
      <div class="right">
        <div class="mode"><button data-m="exam" class="${ST.mode==='exam'?'on':''}">시험 모드</button><button data-m="instant" class="${ST.mode==='instant'?'on':''}">바로 확인</button></div>
      </div></div>`;
  }
  /* exam mode: one question per screen, auto-advance */
  function renderSingle(){
    const {qs}=Q, total=qs.length;
    if(Q.cur==null||Q.cur>=total){ const f=qs.findIndex(q=>Q.answers[q.id]==null); Q.cur=f<0?0:f; }
    const i=Q.cur, q=qs[i], sel=Q.answers[q.id];
    const answered=qs.filter(x=>Q.answers[x.id]!=null).length;
    app.innerHTML=`<section class="wrap">${headHTML()}
      <div class="tprog"><i style="width:${answered/total*100}%"></i></div>
      <div class="tcard">
        <div class="tmeta"><span class="no">문항 ${i+1} / ${total}</span><span class="pill">${q.id.slice(1)}번</span></div>
        <div class="tq">${stemHTML(q, sel!=null?`<span class="blank">${esc(q.o[sel])}</span>`:null)}</div>
        <div class="opts">${q.o.map((o,k)=>`<button class="opt ${sel===k?'sel':''}" data-k="${k}"><span class="L">${L[k]}</span><span>${optTxt(o)}</span><span class="k">${k+1}</span></button>`).join('')}</div>
      </div>
      <div class="tnav"><button class="btn" id="pv" ${i===0?'disabled':''}>← 이전</button>
        ${i<total-1?`<button class="btn dark" id="nx">다음 →</button>`:`<button class="btn primary" id="sb">채점하기</button>`}</div>
      <div class="tgrid">${qs.map((x,j)=>`<button data-j="${j}" class="${Q.answers[x.id]!=null?'a':''} ${j===i?'cur':''}">${x.id.slice(1)}</button>`).join('')}</div>
      ${!Q.isWrong?`<div style="display:flex;gap:8px;justify-content:space-between;margin:-90px 0 120px">
        ${Q.n>1?`<a class="btn" href="#${Q.s}${Q.n-1}">← 세트 ${Q.n-1}</a>`:'<span></span>'}
        ${Q.n<15?`<a class="btn" href="#${Q.s}${Q.n+1}">세트 ${Q.n+1} →</a>`:'<span></span>'}</div>`:''}
    </section>`;
    bindMode();
    app.querySelectorAll('.tcard .opt').forEach(b=>b.onclick=()=>chooseSingle(+b.dataset.k));
    app.querySelectorAll('.tgrid button').forEach(b=>b.onclick=()=>{ Q.cur=+b.dataset.j; renderSingle(); });
    $('#pv').onclick=()=>{ if(Q.cur>0){ Q.cur--; renderSingle(); } };
    const nx=$('#nx'); if(nx) nx.onclick=()=>{ Q.cur++; renderSingle(); };
    const sb=$('#sb'); if(sb) sb.onclick=grade;
    dock();
  }
  function chooseSingle(k){
    const q=Q.qs[Q.cur]; Q.answers[q.id]=k; persist();
    renderSingle();
    if(Q.cur<Q.qs.length-1){ const at=Q.cur; setTimeout(()=>{ if(Q && !Q.graded && Q.cur===at && ST.mode==='exam'){ Q.cur++; renderSingle(); } },260); }
  }
  document.addEventListener('keydown',e=>{
    if(!Q||Q.graded||ST.mode!=='exam'||!document.querySelector('.tcard')) return;
    if(e.target.tagName==='INPUT'||e.target.tagName==='SELECT') return;
    const m={'1':0,'2':1,'3':2,'4':3,'a':0,'b':1,'c':2,'d':3}[e.key.toLowerCase()];
    if(m!=null){ e.preventDefault(); chooseSingle(m); }
    else if(e.key==='ArrowRight' && Q.cur<Q.qs.length-1){ Q.cur++; renderSingle(); }
    else if(e.key==='ArrowLeft' && Q.cur>0){ Q.cur--; renderSingle(); }
  });
  function stemHTML(q, filled){
    let t=esc(q.q);
    return t.replace(/____/g, ()=> filled||'<span class="blank">&nbsp;</span>');
  }
  function card(q,i){
    const sel=Q.answers[q.id];
    let h=`<article class="qcard" id="q-${q.id}" data-id="${q.id}">
      <div class="qtop"><div class="qnum">${q.id.slice(1)}</div><div class="qtext">${stemHTML(q, sel!=null?`<span class="blank">${esc(q.o[sel])}</span>`:null)}</div></div>
      <div class="opts">`;
    q.o.forEach((o,k)=>{ h+=`<button class="opt ${sel===k?'sel':''}" data-k="${k}"><span class="L">${L[k]}</span><span>${optTxt(o)}</span></button>`; });
    h+=`</div><button class="xbtn">💡 해설 보기</button><div class="expl"></div></article>`;
    return h;
  }
  function bindCard(el){
    const id=el.dataset.id, q=Q.qs.find(x=>x.id===id);
    el.querySelectorAll('.opt').forEach(bt=>bt.onclick=()=>{
      if(el.classList.contains('graded')) return;
      const k=+bt.dataset.k; Q.answers[id]=k;
      el.querySelectorAll('.opt').forEach(x=>x.classList.toggle('sel',x===bt));
      $('.qtext',el).innerHTML=stemHTML(q,`<span class="blank">${esc(q.o[k])}</span>`);
      persist();
      if(ST.mode==='instant'){ reveal(id); markWrong(q,k); }
      dock();
      if(ST.mode==='instant' && !Q.graded && Q.qs.every(x=>Q.answers[x.id]!=null)) setTimeout(grade,400);
    });
    $('.xbtn',el).onclick=()=>{ const ex=$('.expl',el); ex.classList.toggle('open'); $('.xbtn',el).textContent=ex.classList.contains('open')?'💡 해설 닫기':'💡 해설 보기'; };
  }
  function reveal(id){
    const el=document.getElementById('q-'+id); if(!el) return;
    const q=Q.qs.find(x=>x.id===id), sel=Q.answers[id], ok=isOk(q,sel);
    el.classList.add('graded'); el.classList.toggle('correct',ok); el.classList.toggle('wrong',!ok);
    el.querySelectorAll('.opt').forEach(bt=>{ const k=+bt.dataset.k; bt.disabled=true; bt.classList.remove('sel'); if(k===q.a || (k===sel&&ok)) bt.classList.add('ans'); else if(k===sel) bt.classList.add('miss'); });
    let fill;
    if(sel==null) fill=`<span class="blank no">?<span class="fix">${esc(q.o[q.a])}</span></span>`;
    else if(ok) fill=`<span class="blank ok">${esc(q.o[q.a])}</span>`;
    else fill=`<span class="blank no"><s>${esc(q.o[sel])}</s><span class="fix">${esc(q.o[q.a])}</span></span>`;
    $('.qtext',el).innerHTML=stemHTML(q,fill);
    const ex=$('.expl',el);
    ex.innerHTML=`${q.k?`<span class="tag">${esc(q.k)}</span>`:''}
      <div class="tr"><b>해석</b>${esc(q.t||'')}</div>
      <div class="ex"><b>해설</b>${esc(q.e||'')}</div>
      <ul>${(q.x||[]).map((x,k)=>`<li class="${k===q.a?'c':''}"><span class="L">${L[k]}</span><span>${esc(x.replace(/^\s*[A-D][\.\):]\s*/,''))}</span></li>`).join('')}</ul>${q.f?`<div class="flagnote">📌 참고: ${esc(q.f)}</div>`:''}`;
    if(!ok){ ex.classList.add('open'); $('.xbtn',el).textContent='💡 해설 닫기'; }
  }
  function markWrong(q,k){ if(isOk(q,k)){ if(Q.isWrong) delete ST.wrong[q.id]; } else ST.wrong[q.id]=true; save(ST); }
  function persist(){
    if(Q.isWrong) return;
    const r=ST.sets[Q.key]||{}; r.answers=Q.answers; r.graded=Q.graded; ST.sets[Q.key]=r; save(ST);
  }
  function dock(){
    const d=$('#dock'); d.style.display='block';
    const total=Q.qs.length, ans=Q.qs.filter(q=>Q.answers[q.id]!=null).length;
    const correct=Q.qs.filter(q=>isOk(q,Q.answers[q.id])).length;
    const shown = Q.graded || ST.mode==='instant';
    let jump=Q.qs.map(q=>{ const a=Q.answers[q.id]; let c=''; if(a!=null) c = shown ? (isOk(q,a)?'c':'w') : 'a'; return `<a class="${c}" href="#q-${q.id}" data-j="${q.id}">${q.id.slice(1)}</a>`; }).join('');
    d.innerHTML=`<div class="wrap"><div class="prog">
        <div class="t">${Q.graded?`채점 완료 · <b>${correct} / ${total}</b> 정답`:`<b>${ans}</b> / ${total} 문항 선택${ST.mode==='instant'?` · 정답 <b>${correct}</b>`:''}`}</div>
        <div class="bar"><i style="width:${(Q.graded?correct:ans)/total*100}%"></i></div>
        <div class="jump">${jump}</div></div>
        ${Q.graded?`<button class="btn" id="retry">다시 풀기</button><button class="btn dark" id="result">결과 보기</button>`
                  :`<button class="btn primary" id="grade">채점하기</button>`}
      </div>`;
    if(document.querySelector('.tcard')) { const j=d.querySelector('.jump'); if(j) j.remove(); }
    d.querySelectorAll('.jump a').forEach(a=>a.onclick=e=>{ e.preventDefault(); document.getElementById('q-'+a.dataset.j).scrollIntoView({behavior:'smooth'}); });
    const g=$('#grade'); if(g) g.onclick=grade;
    const r=$('#retry'); if(r) r.onclick=retry;
    const rs=$('#result'); if(rs) rs.onclick=showResult;
  }
  function grade(){
    const total=Q.qs.length, ans=Q.qs.filter(q=>Q.answers[q.id]!=null).length;
    if(ans<total && !confirm(`아직 ${total-ans}문항을 풀지 않았습니다. 그래도 채점할까요?\n(안 푼 문항은 오답 처리됩니다)`)) return;
    Q.graded=true;
    if(document.querySelector('.tcard')) renderQuiz();
    let correct=0;
    Q.qs.forEach(q=>{ const k=Q.answers[q.id]; if(isOk(q,k)) correct++; markWrong(q, k==null?-1:k); reveal(q.id); });
    if(!Q.isWrong){
      const r=ST.sets[Q.key]||{}; r.last=correct; r.best=Math.max(r.best||0,correct); r.graded=true; r.answers=Q.answers; ST.sets[Q.key]=r; save(ST);
    }
    dock(); showResult();
  }
  function retry(onlyWrong){
    Q.answers={}; Q.graded=false; Q.cur=0;
    if(!Q.isWrong){ const r=ST.sets[Q.key]||{}; r.answers={}; r.graded=false; ST.sets[Q.key]=r; save(ST); }
    renderQuiz();
  }
  function showResult(){
    const total=Q.qs.length, correct=Q.qs.filter(q=>isOk(q,Q.answers[q.id])).length;
    const pct=Math.round(correct/total*100);
    const wr=Q.qs.filter(q=>!isOk(q,Q.answers[q.id]));
    const msg = pct>=90?'¡Excelente! 훌륭해요 🎉': pct>=70?'¡Muy bien! 잘했어요 👏': pct>=50?'¡Ánimo! 조금만 더 💪':'¡Sigue practicando! 해설로 복습해요 📖';
    const C=2*Math.PI*62, col=pct>=80?'var(--ok)':pct>=50?'var(--gold)':'var(--bad)';
    const m=$('#modal');
    m.innerHTML=`<div class="mbox">
      <div class="ring"><svg width="150" height="150"><circle cx="75" cy="75" r="62" fill="none" stroke="#f1ebe2" stroke-width="12"/>
        <circle cx="75" cy="75" r="62" fill="none" stroke="${col}" stroke-width="12" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C*(1-pct/100)}"/></svg>
        <div class="v"><b>${correct}</b><span>/ ${total} · ${pct}%</span></div></div>
      <h3>${msg}</h3>
      <p>${wr.length?'틀린 문항을 눌러 해설을 확인하세요.':'모두 맞혔습니다!'}</p>
      ${wr.length?`<div class="wrongs">${wr.map(q=>`<a data-j="${q.id}">${q.id.slice(1)}번</a>`).join('')}</div>`:''}
      <div class="mbtns">
        <button class="btn" id="m-close">해설 보며 복습</button>
        ${!Q.isWrong && Q.n<15?`<a class="btn primary" href="#${Q.s}${Q.n+1}" id="m-next">다음 세트 →</a>`:`<a class="btn primary" href="#" id="m-next">홈으로</a>`}
      </div></div>`;
    m.classList.add('on');
    const close=()=>m.classList.remove('on');
    $('#m-close').onclick=close; $('#m-next').onclick=close;
    m.onclick=e=>{ if(e.target===m) close(); };
    m.querySelectorAll('.wrongs a').forEach(a=>a.onclick=()=>{ close(); document.getElementById('q-'+a.dataset.j).scrollIntoView({behavior:'smooth'}); });
  }

  /* ---------- header ---------- */
  function header(){
    const lv=CFG.levels.map(l=>`<a href="${l.url}" class="${l.code===LV?'on':''}">${l.code}</a>`).join('');
    const sel=`<select class="lvsel" onchange="location.href=this.value">${CFG.levels.map(l=>`<option value="${l.url}" ${l.code===LV?'selected':''}>${l.code}</option>`).join('')}</select>`;
    $('#hdr').innerHTML=`<div class="wrap"><a class="brand" href="#"><span class="lv">${LV}</span><span class="tt">1500 Preguntas<small>VAMOS A PRACTICAR · GRAMÁTICA + VOCABULARIO</small></span></a><nav class="levels">${lv}</nav>${sel}</div>`;
  }
  header(); route();
})();
