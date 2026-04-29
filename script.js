let colors=[],round=0,scores=[],gameMode='normal';
let timerRaf=null,timerStart=0;
let peekUsed=false,peekPenalty=0,focusedSlider=null;
let invCorrect=0,invGuess=null;
const HISTORY_KEY='gamut_v1_history';

function hsb(h,s,b){
  s/=100;b/=100;
  const k=n=>(n+h/60)%6;
  const f=n=>b-b*s*Math.max(0,Math.min(k(n),4-k(n),1));
  const x=v=>Math.round(v*255).toString(16).padStart(2,'0');
  return '#'+x(f(5))+x(f(3))+x(f(1));
}
function hueLabel(h){
  const z=[[0,'vermelho'],[15,'vermelho-laranja'],[30,'laranja'],[45,'laranja-amarelo'],[60,'amarelo'],[75,'amarelo-verde'],[90,'verde-amarelo'],[120,'verde'],[150,'verde-ciano'],[165,'ciano-verde'],[180,'ciano'],[195,'ciano-azul'],[210,'azul-ciano'],[240,'azul'],[255,'azul-índigo'],[270,'índigo'],[285,'violeta'],[300,'magenta'],[315,'rosa-magenta'],[330,'rosa'],[345,'rosa-vermelho'],[360,'vermelho']];
  let best=z[0];for(const w of z){if(h>=w[0])best=w;}return best[1];
}
function satLabel(s){if(s<10)return 'quase cinza';if(s<30)return 'suave';if(s<55)return 'médio';if(s<78)return 'vivo';return 'puro'}
function briLabel(b){if(b<12)return 'quase preto';if(b<35)return 'escuro';if(b<60)return 'médio';if(b<82)return 'claro';return 'muito claro'}
function ri(a,b){return Math.floor(Math.random()*(b-a+1))+a}

function genColor(hard){
  if(hard){
    const t=Math.random();
    if(t<.33)return{h:ri(0,360),s:ri(0,18),b:ri(10,45)};
    if(t<.66)return{h:ri(0,360),s:ri(0,15),b:ri(65,95)};
    return{h:ri(0,360),s:ri(5,22),b:ri(15,38)};
  }
  return{h:ri(0,360),s:ri(45,95),b:ri(38,90)};
}

function calcScore(t,g){
  const hd=Math.min(Math.abs(t.h-g.h),360-Math.abs(t.h-g.h));
  const sd=Math.abs(t.s-g.s);
  const bd=Math.abs(t.b-g.b);
  return Math.max(0,10-(hd/180)*10*.6-(sd/100)*10*.25-(bd/100)*10*.15);
}

function showToast(msg,dur=1800){
  const t=document.getElementById('toast');
  t.textContent=msg;t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),dur);
}

function makePips(id,cur){
  const c=document.getElementById(id);c.innerHTML='';
  for(let i=0;i<5;i++){
    const d=document.createElement('div');
    d.className='progress-pip'+(i<cur?' done':i===cur?' active':'');
    c.appendChild(d);
  }
}

function showScreen(id){
  document.getElementById('s-home').style.display='none';
  document.querySelectorAll('.game-wrap').forEach(s=>s.classList.remove('active'));
  if(id==='s-home'){
    document.getElementById('s-home').style.display='flex';
  } else {
    document.getElementById(id).classList.add('active');
  }
}

function goHome(){
  if(timerRaf)cancelAnimationFrame(timerRaf);
  showScreen('s-home');
  checkHistory();
}

function goHistory(){
  let h=[];
  try{h=JSON.parse(localStorage.getItem(HISTORY_KEY)||'[]')}catch(e){}
  const list=document.getElementById('history-list');
  if(!h.length){
    list.innerHTML='<p style="font-size:11px;color:var(--fg2);letter-spacing:1px;text-transform:uppercase;text-align:center;padding:24px 0">nenhuma partida ainda</p>';
  } else {
    list.innerHTML=h.map(e=>`
      <div class="history-row">
        <div>
          <div class="history-score">${e.score.toFixed(2)}<span style="font-size:12px;color:var(--fg2)"> /50</span></div>
          <div class="history-meta">${e.mode} · ${e.date}</div>
        </div>
        <div>
          <div class="history-bar-bg"><div class="history-bar-fill" style="width:${(e.score/50*100).toFixed(0)}%"></div></div>
        </div>
      </div>
    `).join('');
  }
  showScreen('s-history');
}

function checkHistory(){
  try{
    const h=JSON.parse(localStorage.getItem(HISTORY_KEY)||'[]');
    document.getElementById('btn-hist').style.display=h.length?'block':'none';
  }catch(e){}
}

function selMode(m){
  gameMode=m;
  document.querySelectorAll('.mode-card').forEach(c=>c.classList.remove('selected'));
  document.querySelector(`.mode-card[data-mode="${m}"]`).classList.add('selected');
}

function startGame(){
  const hard=gameMode==='hard';
  colors=Array.from({length:5},()=>genColor(hard));
  scores=[];round=0;
  if(gameMode==='inverse'){showInverse();return}
  showMem();
}

function showMem(){
  if(timerRaf)cancelAnimationFrame(timerRaf);
  const c=colors[round];
  const sw=document.getElementById('mem-swatch');
  sw.style.opacity='0';
  sw.style.background=hsb(c.h,c.s,c.b);
  setTimeout(()=>{sw.style.opacity='1'},40);
  document.getElementById('mem-label').textContent=`cor ${round+1} de 5`;
  makePips('prog-mem',round);
  showScreen('s-mem');
  const dur=gameMode==='hard'?2000:3500;
  timerStart=performance.now();
  const bar=document.getElementById('timer-bar');
  bar.style.transition='none';bar.style.width='100%';
  setTimeout(()=>{bar.style.transition='width .08s linear'},20);
  function tick(now){
    const p=Math.max(0,1-(now-timerStart)/dur);
    bar.style.width=(p*100)+'%';
    if(p>0){timerRaf=requestAnimationFrame(tick)}
    else showGuess();
  }
  timerRaf=requestAnimationFrame(tick);
}

function showGuess(){
  document.getElementById('guess-label').textContent=`cor ${round+1} de 5 — palpite`;
  makePips('prog-guess',round);
  document.getElementById('sl-h').value=180;
  document.getElementById('sl-s').value=50;
  document.getElementById('sl-b').value=50;
  peekUsed=false;peekPenalty=0;
  document.getElementById('peek-btn').disabled=false;
  document.getElementById('peek-used').textContent='';
  const bo=document.getElementById('blind-overlay');
  const gs=document.getElementById('guess-swatch');
  if(gameMode==='blind'){bo.style.display='flex';gs.style.display='none'}
  else{bo.style.display='none';gs.style.display='block'}
  upd();showScreen('s-guess');
}

function showInverse(){
  const c=colors[round];
  document.getElementById('inv-label').textContent=`cor ${round+1} de 5 — qual cor é essa?`;
  makePips('prog-inv',round);
  document.getElementById('inv-h').textContent=c.h+'°';
  document.getElementById('inv-s').textContent=c.s+'%';
  document.getElementById('inv-b').textContent=c.b+'%';
  const opts=document.getElementById('inv-opts');
  opts.innerHTML='';
  invGuess=null;
  document.getElementById('inv-reveal-btn').disabled=true;
  const decoys=[];
  while(decoys.length<3){
    const dc=genColor(false);
    if(Math.min(Math.abs(dc.h-c.h),360-Math.abs(dc.h-c.h))>40)decoys.push(dc);
  }
  const all=[c,...decoys].sort(()=>Math.random()-.5);
  invCorrect=all.indexOf(c);
  all.forEach((col,i)=>{
    const d=document.createElement('div');
    d.className='inv-opt';
    d.style.background=hsb(col.h,col.s,col.b);
    d.onclick=()=>{
      document.querySelectorAll('.inv-opt').forEach(o=>o.classList.remove('selected'));
      d.classList.add('selected');
      invGuess=i;
      document.getElementById('inv-reveal-btn').disabled=false;
    };
    opts.appendChild(d);
  });
  showScreen('s-inverse');
}

function doInvReveal(){
  if(invGuess===null)return;
  const correct=invGuess===invCorrect;
  const sc=correct?10:0;
  scores.push(sc);
  showToast(correct?'correto! +10 pts':'errou... +0 pts');
  const t=colors[round];
  setTimeout(()=>showRoundResult(t,{h:t.h,s:t.s,b:t.b},sc,true),700);
}

function updateSliderVisuals(){
  const h=+document.getElementById('sl-h').value;
  const s=+document.getElementById('sl-s').value;
  const b=+document.getElementById('sl-b').value;

  const gh=document.getElementById('grad-h');
  gh.style.background='linear-gradient(to right,hsl(0,100%,50%),hsl(30,100%,50%),hsl(60,100%,50%),hsl(90,100%,50%),hsl(120,100%,50%),hsl(150,100%,50%),hsl(180,100%,50%),hsl(210,100%,50%),hsl(240,100%,50%),hsl(270,100%,50%),hsl(300,100%,50%),hsl(330,100%,50%),hsl(360,100%,50%))';
  const tH=document.getElementById('thumb-h');
  tH.style.left=(h/360*100)+'%';
  tH.style.background=`hsl(${h},100%,50%)`;
  tH.style.borderColor=`hsl(${h},70%,35%)`;
  document.getElementById('dot-h').style.background=`hsl(${h},100%,50%)`;
  document.getElementById('lbl-h').textContent=`${h}° — ${hueLabel(h)}`;

  const gs=document.getElementById('grad-s');
  gs.style.background=`linear-gradient(to right,hsl(${h},0%,${b/2+25}%),hsl(${h},100%,${b/2+8}%))`;
  const tS=document.getElementById('thumb-s');
  tS.style.left=(s/100*100)+'%';
  tS.style.background=hsb(h,s,Math.max(b,30));
  tS.style.borderColor=hsb(h,Math.min(s+20,100),Math.max(b-20,10));
  document.getElementById('dot-s').style.background=hsb(h,s,Math.max(b,35));
  document.getElementById('lbl-s').textContent=`${s}% — ${satLabel(s)}`;

  const gb=document.getElementById('grad-b');
  gb.style.background=`linear-gradient(to right,#000,${hsb(h,Math.max(s,40),100)})`;
  const tB=document.getElementById('thumb-b');
  tB.style.left=(b/100*100)+'%';
  tB.style.background=hsb(h,Math.max(s,20),b);
  tB.style.borderColor=hsb(h,Math.min(s+20,100),Math.max(b-20,5));
  document.getElementById('dot-b').style.background=hsb(h,s,b);
  document.getElementById('lbl-b').textContent=`${b}% — ${briLabel(b)}`;
}

function upd(){
  const h=+document.getElementById('sl-h').value;
  const s=+document.getElementById('sl-s').value;
  const b=+document.getElementById('sl-b').value;
  if(gameMode!=='blind')document.getElementById('guess-swatch').style.background=hsb(h,s,b);
  updateSliderVisuals();
}

function focusSlider(k){focusedSlider=k;document.getElementById('row-'+k).classList.add('focused')}
function blurSlider(k){focusedSlider=null;document.getElementById('row-'+k).classList.remove('focused')}

function doPeek(){
  if(peekUsed)return;
  peekUsed=true;peekPenalty=2;
  document.getElementById('peek-btn').disabled=true;
  document.getElementById('peek-used').textContent='−2 pts aplicado';
  const c=colors[round];
  const gs=document.getElementById('guess-swatch');
  const bo=document.getElementById('blind-overlay');
  gs.style.display='block';bo.style.display='none';
  gs.style.background=hsb(c.h,c.s,c.b);
  showToast('espiada! −2 pts');
  setTimeout(()=>{
    gs.style.background=gameMode==='blind'?'':hsb(+document.getElementById('sl-h').value,+document.getElementById('sl-s').value,+document.getElementById('sl-b').value);
    if(gameMode==='blind'){bo.style.display='flex';gs.style.display='none'}
  },1200);
}

function submitGuess(){
  const t=colors[round];
  const h=+document.getElementById('sl-h').value;
  const s=+document.getElementById('sl-s').value;
  const b=+document.getElementById('sl-b').value;
  const g={h,s,b};
  const sc=Math.max(0,calcScore(t,g)-peekPenalty);
  scores.push(sc);
  showRoundResult(t,g,sc,false);
}

function showRoundResult(t,g,sc,isInverse){
  document.getElementById('rr-label').textContent=`resultado — cor ${round+1}`;
  document.getElementById('rr-target').style.background=hsb(t.h,t.s,t.b);
  document.getElementById('rr-guess').style.background=isInverse?hsb(t.h,t.s,t.b):hsb(g.h,g.s,g.b);
  document.getElementById('rr-score').textContent=sc.toFixed(2);
  const hd=isInverse?0:Math.min(Math.abs(t.h-g.h),360-Math.abs(t.h-g.h));
  const sd=isInverse?0:Math.abs(t.s-g.s);
  const bd=isInverse?0:Math.abs(t.b-g.b);
  document.getElementById('dval-h').textContent=isInverse?'—':hd+'°';
  document.getElementById('dval-s').textContent=isInverse?'—':sd+'%';
  document.getElementById('dval-b').textContent=isInverse?'—':bd+'%';
  setTimeout(()=>{
    document.getElementById('dbar-h').style.width=isInverse?'100%':Math.max(0,100-(hd/180)*100)+'%';
    document.getElementById('dbar-s').style.width=isInverse?'100%':Math.max(0,100-sd)+'%';
    document.getElementById('dbar-b').style.width=isInverse?'100%':Math.max(0,100-bd)+'%';
  },80);
  document.getElementById('hsb-cmp').innerHTML=`
    <div class="hsb-col">
      <span class="hsb-row-label" style="margin-bottom:4px">original</span>
      <span class="hsb-row-val">${t.h}°</span>
      <span class="hsb-row-val">${t.s}%</span>
      <span class="hsb-row-val">${t.b}%</span>
    </div>
    <div class="hsb-mid">
      <span class="hsb-mid-lbl">H</span>
      <span class="hsb-mid-lbl">S</span>
      <span class="hsb-mid-lbl">B</span>
    </div>
    <div class="hsb-col right">
      <span class="hsb-row-label" style="margin-bottom:4px">palpite</span>
      <span class="hsb-row-val">${isInverse?t.h:g.h}°</span>
      <span class="hsb-row-val">${isInverse?t.s:g.s}%</span>
      <span class="hsb-row-val">${isInverse?t.b:g.b}%</span>
    </div>
  `;
  document.getElementById('rr-btn').textContent=round<4?'próxima cor  [enter]':'ver resultado  [enter]';
  showScreen('s-rr');
}

function nextRound(){
  round++;
  if(round>=5){showFinal();return}
  if(gameMode==='inverse'){showInverse()}else{showMem()}
}

function saveHistory(total,mode){
  let h=[];
  try{h=JSON.parse(localStorage.getItem(HISTORY_KEY)||'[]')}catch(e){}
  const now=new Date();
  const label=now.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})+' '+now.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
  h.unshift({score:total,mode,date:label});
  if(h.length>10)h=h.slice(0,10);
  try{localStorage.setItem(HISTORY_KEY,JSON.stringify(h))}catch(e){}
}

function showFinal(){
  const total=scores.reduce((a,b)=>a+b,0);
  saveHistory(total,gameMode);
  checkHistory();
  document.getElementById('final-score').textContent=total.toFixed(2);
  const ch=document.getElementById('chips');
  ch.innerHTML='';
  scores.forEach((s,i)=>{
    const d=document.createElement('div');
    d.className='chip';
    d.innerHTML=`<span class="chip-num">${s.toFixed(1)}</span><span class="chip-label">cor ${i+1}</span>`;
    ch.appendChild(d);
  });
  const msgs=[
    [47,'Extraordinário. Seus olhos são instrumentos de precisão.'],
    [40,'Excelente. Você enxerga onde a maioria acha que sabe.'],
    [30,'Bom resultado. O matiz é mais fugaz do que parece.'],
    [20,'Humanos realmente não lembram cores. Você confirma a teoria.'],
    [0,'As cores são uma ilusão. E você caiu nela.']
  ];
  document.getElementById('final-msg').textContent=msgs.find(([t])=>total>=t)[1];
  showScreen('s-final');
}

document.addEventListener('keydown',e=>{
  const sid=document.querySelector('.game-wrap.active')?.id;
  if(sid==='s-guess'){
    if(e.key==='Enter'){e.preventDefault();submitGuess();return}
    if(focusedSlider){
      const sl=document.getElementById('sl-'+focusedSlider);
      const step=e.shiftKey?10:1;
      if(e.key==='ArrowRight'||e.key==='ArrowUp'){e.preventDefault();sl.value=Math.min(+sl.value+step,+sl.max);upd()}
      if(e.key==='ArrowLeft'||e.key==='ArrowDown'){e.preventDefault();sl.value=Math.max(+sl.value-step,+sl.min);upd()}
      if(e.key==='Tab'){
        e.preventDefault();
        const order=['h','s','b'];
        const next=order[(order.indexOf(focusedSlider)+1)%3];
        document.getElementById('row-'+next).focus();
      }
    }
  }
  if(sid==='s-rr'&&e.key==='Enter'){e.preventDefault();nextRound()}
});

checkHistory();