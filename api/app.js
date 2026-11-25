/* ============================================================
   Anh Son Movement: application script
   View routing, language switch, counters, live feed, stories,
   nomination form, gift modal, mobile menu and the assistant.
   All configuration lives in ASM_CONFIG below.
   ============================================================ */

const body=document.body, views=[...document.querySelectorAll('.view')], navlinks=[...document.querySelectorAll('.links a')];
function animateIn(view){
 requestAnimationFrame(()=>{ const rev=[...view.querySelectorAll('.reveal')];
  rev.forEach((el,i)=>{el.classList.remove('in');setTimeout(()=>el.classList.add('in'), 60+i*70);});
  view.querySelectorAll('[data-count]').forEach(c=>runCount(c));
 });
}
function showView(v){
 views.forEach(s=>s.classList.toggle('show', s.dataset.view===v));
 /* the sticky give bar hides on the page that already asks */
 document.body.classList.remove(...[...document.body.classList].filter(c=>c.indexOf('view-')===0));
 document.body.classList.add('view-'+v);
 navlinks.forEach(a=>a.classList.toggle('active', a.dataset.go===v));
 const view=document.querySelector('.view[data-view="'+v+'"]');
 window.scrollTo({top:0,behavior:'instant' in window?'instant':'auto'});
 if(view) animateIn(view);
}
document.querySelectorAll('[data-go]').forEach(el=>el.addEventListener('click',e=>{e.preventDefault();showView(el.dataset.go);}));

function runCount(el){const num=el.querySelector('.num');if(!num)return;const tgt=+el.dataset.count;let s=null;const d=1600;
 function step(ts){if(!s)s=ts;const p=Math.min((ts-s)/d,1);const v=Math.floor((1-Math.pow(1-p,3))*tgt);
 num.textContent=v.toLocaleString('en-US');if(p<1)requestAnimationFrame(step);}requestAnimationFrame(step);}

// language
function setLang(l){body.classList.remove('lang-en','lang-vn');body.classList.add('lang-'+l);document.documentElement.lang = (l==='vn' ? 'vi' : 'en');
 document.querySelectorAll('.langbtn').forEach(b=>b.classList.toggle('active',b.dataset.l===l));
 try{localStorage.setItem('asm_lang',l);}catch(e){}}
document.querySelectorAll('.langbtn').forEach(b=>b.addEventListener('click',()=>setLang(b.dataset.l)));
try{const saved=localStorage.getItem('asm_lang'); if(saved) setLang(saved);}catch(e){}

// stories rotation
const stories=[...document.querySelectorAll('.story')], sdots=[...document.querySelectorAll('.stdots b')];
let si=0,stimer;
function showStory(i){stories.forEach((s,k)=>s.classList.toggle('on',k===i));sdots.forEach((d,k)=>d.classList.toggle('on',k===i));si=i;}
function nextStory(){showStory((si+1)%stories.length);}
sdots.forEach((d,k)=>d.addEventListener('click',()=>{showStory(k);clearInterval(stimer);stimer=setInterval(nextStory,5500);}));
if(stories.length){stimer=setInterval(nextStory,5500);}

// floating hearts
(function(){const f=document.getElementById('floaters');if(!f)return;
 const svg='<svg viewBox="0 0 100 100"><g fill="none" stroke="#D4B879" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" opacity=".5"><path d="M49,42 C46,31 34,26 26,30 C16,35 16,49 23,59 C29,68 38,78 50,92"/><path d="M51,42 C54,31 66,26 74,30 C84,35 84,49 77,59 C71,68 62,78 50,92"/></g></svg>';
 for(let i=0;i<11;i++){const s=document.createElement('div');s.className='fh-i';
  s.style.left=(Math.random()*100)+'%';s.style.setProperty('--d',(12+Math.random()*10)+'s');
  s.style.animationDelay=(-Math.random()*18)+'s';const sc=(.5+Math.random()*0.9).toFixed(2);
  s.style.fontSize=sc+'em';s.innerHTML=svg;s.querySelector('svg').style.width=(18+Math.random()*16)+'px';
  s.querySelector('svg').style.height=s.querySelector('svg').style.width;f.appendChild(s);} })();

// donate widget
(function(){
 const IMP={5:["a warm message and a moment of being heard for someone today","một tin nhắn ấm áp và một khoảnh khắc được lắng nghe cho ai đó hôm nay"],
 10:["a meal and a reminder that they truly matter","một bữa ăn và một lời nhắc rằng họ thật sự quan trọng"],
 25:["a week of gentle check-ins for someone who feels alone","một tuần hỏi thăm dịu dàng cho người đang thấy cô đơn"],
 50:["real, ongoing support for someone who needs to be seen","sự hỗ trợ thật sự, lâu dài cho người cần được nhìn thấy"]};
 const DEF=["more moments of being heard, valued and seen for people in need","thêm những khoảnh khắc được lắng nghe, trân trọng và nhìn thấy cho người cần giúp"];
 const amts=[...document.querySelectorAll('.amt')],custom=document.querySelector('.amt-custom');
 const ien=document.querySelector('.itext .en'),ivn=document.querySelector('.itext .vn');
 const ben=document.querySelector('.donate-btn .en'),bvn=document.querySelector('.donate-btn .vn');
 if(!amts.length)return;
 function pick(v){let m=IMP[v];if(!m){if(v>=50)m=IMP[50];else if(v>=25)m=IMP[25];else if(v>=10)m=IMP[10];else if(v>=5)m=IMP[5];else m=DEF;}
  if(ien)ien.textContent=m[0];if(ivn)ivn.textContent=m[1];
  if(ben)ben.textContent='Give €'+v;if(bvn)bvn.textContent='Tặng €'+v;}
 const BSVG='<svg viewBox="0 0 24 24" fill="#D4B879"><path d="M12 21s-7-4.6-9.3-8.5C1 9.6 2.4 6 6 6c2 0 3.2 1.2 4 2.3C10.8 7.2 12 6 14 6c3.6 0 5 3.6 3.3 6.5C19 16.4 12 21 12 21z"/></svg>';
 function burst(el){const r=el.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;for(let i=0;i<6;i++){const h=document.createElement('div');h.className='burst';h.style.left=cx+'px';h.style.top=cy+'px';h.style.setProperty('--bx',((Math.random()-.5)*90)+'px');h.style.setProperty('--by',(-50-Math.random()*60)+'px');h.style.animationDelay=(Math.random()*.1)+'s';h.innerHTML=BSVG;document.body.appendChild(h);setTimeout(()=>h.remove(),1060);}}
 amts.forEach(a=>a.addEventListener('click',()=>{amts.forEach(x=>x.classList.remove('active'));a.classList.add('active');if(custom)custom.value='';pick(+a.dataset.amt);burst(a);}));
 if(custom)custom.addEventListener('input',()=>{amts.forEach(x=>x.classList.remove('active'));const v=parseInt(custom.value||'0',10);pick(v>0?v:5);});
 pick(5);
})();

document.querySelectorAll('.faqq').forEach(b=>b.addEventListener('click',()=>b.parentElement.classList.toggle('open')));

// initial reveal for home
animateIn(document.querySelector('.view.show'));
(function(){var dts=[].slice.call(document.querySelectorAll('.dt'));if(!dts.length)return;var ben=document.querySelector('.donate-btn .en'),bvn=document.querySelector('.donate-btn .vn');var amts=[].slice.call(document.querySelectorAll('.amt')),custom=document.querySelector('.amt-custom');var period='once';function curAmt(){var a=document.querySelector('.amt.active');if(a)return+a.dataset.amt;var v=parseInt((custom&&custom.value)||'0',10);return v>0?v:5;}function refresh(){var v=curAmt();var se=period==='month'?' / mo':'';var sv=period==='month'?' / tháng':'';if(ben)ben.textContent='Give €'+v+se;if(bvn)bvn.textContent='Tặng €'+v+sv;}dts.forEach(function(d){d.addEventListener('click',function(){dts.forEach(function(x){x.classList.remove('active');});d.classList.add('active');period=d.dataset.t;refresh();});});amts.forEach(function(a){a.addEventListener('click',function(){setTimeout(refresh,0);});});if(custom)custom.addEventListener('input',function(){setTimeout(refresh,0);});refresh();})();
/* Live ticking disabled: figures must reflect real data, not simulated growth. */
(function(){return;var lives=[].slice.call(document.querySelectorAll('[data-live]'));if(!lives.length)return;
 function homeShown(){var v=document.querySelector('.view[data-view="home"]');return v&&v.classList.contains('show');}
 setInterval(function(){if(!homeShown())return;lives.forEach(function(el){if(Math.random()<0.55){var num=el.querySelector('.num');if(!num)return;var cur=parseInt((num.textContent||'0').replace(/[^0-9]/g,''),10)||0;if(cur<60)return;cur+=1+Math.floor(Math.random()*(+el.dataset.live||5));num.textContent=cur.toLocaleString('en-US');num.classList.remove('tick');void num.offsetWidth;num.classList.add('tick');}});},4200);})();
(function(){var lt=document.querySelector('.livetxt');if(!lt)return;
 var en=['Someone in Saigon checked in on a stranger','A kind message was just sent in Hanoi','Someone new joined from Brussels','A volunteer reached out in Da Nang','Someone shared the movement in Lokeren','A stranger said "you matter" in Hue'];
 var vn=['Ai đó ở Sài Gòn vừa hỏi thăm một người lạ','Một tin nhắn ấm áp vừa được gửi ở Hà Nội','Một người mới vừa tham gia từ Brussels','Một tình nguyện viên vừa kết nối ở Đà Nẵng','Ai đó vừa chia sẻ phong trào ở Lokeren','Một người lạ vừa nói "bạn quan trọng" ở Huế'];
 var i=0;function f(){lt.innerHTML='<span class="en">'+en[i%en.length]+' · now</span><span class="vn">'+vn[i%vn.length]+' · vừa xong</span>';i++;}f();setInterval(f,3800);})();
(function(){var el=document.querySelector('.fo-line');if(!el)return;
 var en=['the one who does not dare to speak.','the one who never got the right guidance.','the one who feels alone, unnoticed.','the one left to face it all alone.','the one who fights every day to survive.','the one who simply needs to matter.'];
 var vn=['người không dám lên tiếng.','người chưa từng được hướng dẫn đúng cách.','người cô đơn, mà chẳng ai nhận ra.','người bị bỏ lại, một mình đối mặt tất cả.','người chiến đấu mỗi ngày để sống sót.','người chỉ cần biết mình quan trọng.'];
 var i=0;function set(){el.style.opacity=0;setTimeout(function(){el.innerHTML='<span class="en">'+en[i%en.length]+'</span><span class="vn">'+vn[i%vn.length]+'</span>';el.style.opacity=1;i++;},420);}set();setInterval(set,3400);})();

/* ---------- bilingual placeholders ---------- */
function asmLang(){return document.body.classList.contains('lang-vn')?'vn':'en';}
function asmPlaceholders(){var L=asmLang();
 document.querySelectorAll('[data-ph-en]').forEach(function(el){el.placeholder=el.getAttribute('data-ph-'+L)||'';});}
document.querySelectorAll('.langbtn').forEach(function(b){b.addEventListener('click',function(){setTimeout(asmPlaceholders,0);});});
asmPlaceholders();

/* ---- form delivery ----
   Posts straight to Web3Forms from the browser (proven to work), or through our
   own /api function when ASM_CONFIG.useApi is on. Same fields either way, so the
   email looks identical whichever route is used. */
function asmSend(apiPath, fields, w3){
  var C = window.ASM_CONFIG || {};
  if (C.useApi || !C.web3formsKey){
    return fetch(apiPath, {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(fields)
    }).then(function(r){
      return r.json().catch(function(){ return {}; }).then(function(d){
        if (!r.ok) throw new Error((d.error || ('HTTP ' + r.status)) +
                                   (d.detail ? ': ' + d.detail : ''));
        return d;
      });
    });
  }
  var payload = { access_key: C.web3formsKey, from_name: 'Anh Son Movement', botcheck: '' };
  for (var k in w3) if (Object.prototype.hasOwnProperty.call(w3, k)) payload[k] = w3[k];
  return fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    headers: {'Content-Type': 'application/json', Accept: 'application/json'},
    body: JSON.stringify(payload)
  }).then(function(r){
    return r.json().catch(function(){ return {}; }).then(function(d){
      if (!r.ok || d.success === false)
        throw new Error('Web3Forms ' + r.status + (d.message ? ': ' + d.message : ''));
      return d;
    });
  });
}

/* ---------- nomination form ---------- */
(function(){
 var f=document.getElementById('nomform'); if(!f) return;
 var msg=document.getElementById('nommsg'), anon=document.getElementById('anonchk'), you=document.getElementById('youfields');
 function syncAnon(){ you.hidden = anon.checked; }
 anon.addEventListener('change',syncAnon); syncAnon();

 function say(kind, en, vn){
  msg.className='formmsg on '+kind;
  msg.innerHTML='<span class="en">'+en+'</span><span class="vn">'+vn+'</span>';
 }
 f.addEventListener('submit',function(e){
  e.preventDefault();
  if(f.website.value){ return; } /* honeypot */
  var situation=(f.situationType && f.situationType.value)||'';
  var note=(f.note && f.note.value ? f.note.value.trim() : '');
  if(!situation){
   say('err',"Please choose the kind of situation, so we know how to reach out.",
             "Vui lòng chọn loại hoàn cảnh, để chúng tôi biết cách liên hệ.");
   f.situationType.focus(); return;
  }
  var btn=f.querySelector('.nomsubmit'); var old=btn.innerHTML;
  btn.disabled=true; btn.innerHTML='<span class="en">Sending…</span><span class="vn">Đang gửi…</span>';
  var payload={about:f.about.value,city:f.city.value,situation:situation,note:note,reach:f.reach.value,
   anonymous:anon.checked, fromName:anon.checked?'':f.fromName.value, fromEmail:anon.checked?'':f.fromEmail.value,
   lang:asmLang()};
  var LABELS={alone:'Living alone / rarely sees anyone',hardship:'Struggling financially',
   loss:'Recently lost someone',newplace:'Far from home, new to the area',
   carer:'Caring for someone else with no support',unseen:'Feels unseen or unheard',
   other:'Something else'};
  var w3={ subject:'Nomination'+(payload.city?' - '+payload.city:'')+(anon.checked?' - anonymous':''),
   'About':payload.about||'-', 'Where':payload.city||'-',
   'What is going on':(LABELS[situation]||situation)+(note?'\n\n'+note:''),
   'Reach them':payload.reach||'-',
   'From':anon.checked?'Anonymous':([payload.fromName,payload.fromEmail].filter(Boolean).join(' - ')||'Not given'),
   'Language':payload.lang==='vn'?'Vietnamese':'English',
   'Note':'Treat as confidential. Delete once the help is done.' };
  if(!anon.checked && payload.fromEmail) w3.replyto=payload.fromEmail;

  asmSend('/api/nominate', payload, w3)
  .then(function(){
   f.reset(); syncAnon(); asmPlaceholders();
   say('ok',"Thank you for caring enough to write. A real person from our team will read this and reach out gently. You&rsquo;ve just made someone less invisible.",
            "Cảm ơn bạn đã quan tâm đủ để viết. Một người thật trong nhóm sẽ đọc và nhẹ nhàng liên hệ. Bạn vừa khiến ai đó bớt vô hình.");
  })
  .catch(function(err){
   /* show the real reason — otherwise every failure looks identical and there is
      no way to tell "not configured" from "network down" */
   var why = (err && err.message && err.message !== 'failed')
     ? ' <span class="errwhy">(' + String(err.message).slice(0,120) + ')</span>' : '';
   say('err',"Something went wrong on our side. Please write to us directly at <a href=\"mailto:hello@anhsonmovement.org\">hello@anhsonmovement.org</a>. We don&rsquo;t want your message to get lost." + why,
            "Có lỗi từ phía chúng tôi. Xin viết trực tiếp tới <a href=\"mailto:hello@anhsonmovement.org\">hello@anhsonmovement.org</a>. Chúng tôi không muốn tin nhắn của bạn bị thất lạc." + why);
  })
  .then(function(){ btn.disabled=false; btn.innerHTML=old; });
 });
})();

/* ---------- Lynn: the assistant ---------- */
(function(){
 var btn=document.getElementById('lynnbtn'), panel=document.getElementById('lynnpanel'),
     log=document.getElementById('lynnlog'), form=document.getElementById('lynnform'),
     input=document.getElementById('lynninput'), quick=document.getElementById('lynnquick'),
     close=document.getElementById('lynnclose');
 if(!btn) return;
 var history=[], greeted=false, apiOK=true;

 var CRISIS=/(suicid|kill myself|end my life|want to die|take my life|self ?harm|hurt myself|cutting myself|no reason to live|can'?t go on|tự tử|muốn chết|kết thúc cuộc đời|tự làm hại|không muốn sống)/i;

 var KB=[
  {k:/(hello|hi there|hey|good morning|xin chào|chào)/i,
   en:"Hello, I'm glad you're here. I'm Lynn, the assistant of the Anh Sơn Movement. What would you like to know?",
   vn:"Xin chào, mình rất vui vì bạn ghé qua. Mình là Lynn, trợ lý của phong trào Anh Sơn. Bạn muốn biết điều gì?"},
  {k:/(donat|give money|contribut|how do i give|ủng hộ|quyên góp|đóng góp)/i,
   en:"Yes, and thank you for asking. A gift is spent on things a person can hold: a meal, a warm coat, a blanket, school things. S\u01a1n and the team hand them over themselves. The payment fee and the cost of getting the money to Vietnam come off first, we never pretend otherwise, and we publish the real numbers every quarter.",
   vn:"Có, và cảm ơn bạn đã hỏi. Món quà được dùng cho những thứ một người có thể cầm trên tay: một bữa ăn, một chiếc áo ấm, một cái chăn, đồ dùng học tập. Sơn và đội ngũ tự tay trao. Phí thanh toán và chi phí đưa tiền sang Việt Nam được trừ trước, chúng tôi không giấu điều đó, và mỗi quý chúng tôi công bố con số thật.",
   act:[['support','What it buys','Nó mua được gì'],['legal','The small print','Điều khoản']]},
  {k:/(100|where does.*money|overhead|admin cost|what happens to my|tiền đi đâu|chi phí)/i,
   en:"Into things people can hold, bought and handed over by S\u01a1n and the team. The costs of getting it there come off first: a payment fee, and the cost of moving money to Vietnam. I won't quote you a percentage nobody has measured yet. Every quarter we publish what came in, what it cost, what it bought and who it reached.",
   vn:"Tiền đi vào những thứ người ta có thể cầm trên tay, do Sơn và đội ngũ mua và trao tận tay. Chi phí đưa tiền đến nơi được trừ trước: phí thanh toán, và chi phí chuyển tiền sang Việt Nam. Mình sẽ không nêu một tỷ lệ mà chưa ai đo được. Mỗi quý chúng tôi công bố nhận bao nhiêu, tốn bao nhiêu, mua được gì và đến với ai.",
   act:[['support','Where it goes','Nó đi đâu']]},
  {k:/(nominat|someone who|refer|report someone|know someone|help a friend|giới thiệu|biết ai)/i,
   en:"Yes, and you can do it completely anonymously. Tell us who you're worried about and what you've noticed. A real person reads every message, and they'll never know who nominated them unless you ask.",
   vn:"Có, và bạn có thể làm hoàn toàn ẩn danh. Hãy kể về người bạn lo lắng và điều bạn nhận thấy. Một người thật đọc mọi tin nhắn, và họ sẽ không biết ai giới thiệu trừ khi bạn cho phép.",
   act:[['nominate','Nominate someone','Giới thiệu một người']]},
  {k:/(follow|instagram|social|insta|facebook|theo dõi|mạng xã hội)/i,
   en:"Following costs nothing and it genuinely helps: every follower makes the movement easier to believe for the next person, and for the people we approach in Vietnam. If you can give as well, that buys a meal or a warm coat this week. Both count, and one tap is enough for either.",
   vn:"Theo dõi không tốn gì và thực sự có ích: mỗi người theo dõi khiến phong trào dễ tin hơn với người kế tiếp, và với những người chúng tôi tiếp cận tại Việt Nam. Nếu bạn cũng có thể tặng, khoản đó mua một bữa ăn hay một chiếc áo ấm ngay tuần này. Cả hai đều có giá trị.",
   act:[['join','Follow us','Theo dõi']]},
  {k:/(join|whatsapp|community|channel|member|tham gia|cộng đồng|kênh)/i,
   en:"Joining takes ten seconds: follow our WhatsApp channel and you're part of it. Then make someone smile today, and share it with two people.",
   vn:"Tham gia chỉ mất mười giây: theo dõi kênh WhatsApp của chúng tôi là bạn đã thuộc về. Rồi hãy khiến ai đó mỉm cười hôm nay, và chia sẻ với hai người.",
   act:[['join','How to join','Cách tham gia']]},
  {k:/(value|heard|valued|seen|what do you stand|giá trị|lắng nghe|trân trọng|nhìn thấy)/i,
   en:"Three promises. Heard: every voice truly listened to. Valued: you matter exactly as you are. Seen: no one fades into the background.",
   vn:"Ba lời hứa. Được lắng nghe: mọi tiếng nói đều được lắng nghe thật sự. Được trân trọng: bạn quan trọng đúng như bạn vốn là. Được nhìn thấy: không ai bị lãng quên.",
   act:[['values','The values','Giá trị']]},
  {k:/(who receives|who gets|who do you help|choose who|ai nhận|giúp ai)/i,
   en:"People in our community who need to be heard, valued and seen: the elderly, the isolated, someone who doesn't dare to speak, someone fighting to get through the day. Most are nominated by people around them.",
   vn:"Những người trong cộng đồng cần được lắng nghe, trân trọng và nhìn thấy: người lớn tuổi, người cô đơn, người không dám lên tiếng, người đang vật lộn qua từng ngày. Phần lớn được người xung quanh giới thiệu.",
   act:[['nominate','Nominate someone','Giới thiệu một người']]},
  {k:/(monthly|recurring|every month|subscription|newsletter|mailing|hằng tháng|định kỳ|bản tin)/i,
   en:"You can, and you can stop it with one email, no questions asked. There's also a monthly update by email if you'd rather give attention than money: what actually happened, who was reached, what we got wrong. One quiet email a month, never a fundraising blast.",
   vn:"Bạn có thể, và có thể dừng chỉ với một email, không hỏi lại. Cũng có bản tin hằng tháng qua email nếu bạn muốn dành sự quan tâm thay vì tiền: điều gì thực sự đã diễn ra, ai được giúp, chúng tôi sai ở đâu. Một email nhẹ nhàng mỗi tháng, không bao giờ là thư kêu gọi tiền.",
   act:[['join','Sign up','Đăng ký']]},
  {k:/(volunteer|help out|get involved|do more|tình nguyện|giúp sức)/i,
   en:"Four ways. Give, if you can. Follow us so the next person finds us more easily. Share the movement with two people. Or tell us about someone who needs to be seen. Three of the four are free and all four matter more than you think.",
   vn:"Bốn cách. Tặng, nếu bạn có thể. Theo dõi để người tiếp theo dễ tìm thấy chúng tôi hơn. Chia sẻ phong trào với hai người. Hoặc kể cho chúng tôi về một người cần được nhìn thấy. Ba trong bốn cách không tốn gì, và cả bốn đều quan trọng hơn bạn nghĩ.",
   act:[['join','Join us','Tham gia'],['nominate','Nominate','Giới thiệu']]},
  {k:/(what is this|about the movement|who are you|story|founder|sơn|là gì|câu chuyện)/i,
   en:"The Anh Sơn Movement is a kindness movement founded by Anh Sơn and his daughters. It's for everyone who feels unseen: those who don't dare to speak, who never got the right guidance, who are lonely without anyone noticing, who fight every day. It's a step toward a better world.",
   vn:"Phong trào Anh Sơn là phong trào lan tỏa lòng tốt do Anh Sơn và các con gái sáng lập. Dành cho tất cả những ai cảm thấy vô hình: người không dám lên tiếng, người chưa từng được hướng dẫn đúng cách, người cô đơn mà chẳng ai nhận ra, người chiến đấu mỗi ngày. Đây là một bước tới thế giới tốt đẹp hơn.",
   act:[['story','Our story','Câu chuyện']]},
  {k:/(secure|safe|payment|card|fraud|an toàn|bảo mật|thanh toán)/i,
   en:"Your card details never touch this website. They go straight to the payment provider, which handles the card and tells us only that a gift arrived. We never see your card number and we never store it.",
   vn:"Thông tin thẻ của bạn không bao giờ đi qua trang này. Nó đi thẳng tới nhà cung cấp thanh toán, nơi xử lý thẻ và chỉ báo cho chúng tôi rằng một món quà đã đến. Chúng tôi không bao giờ thấy số thẻ của bạn và không bao giờ lưu nó.",
   act:[['legal','Privacy & terms','Riêng tư & điều khoản']]},
  {k:/(privacy|gdpr|my data|anonymous|riêng tư|dữ liệu|ẩn danh)/i,
   en:"You can stay completely anonymous. We store only what you write, we never sell or share it outside our small team, and we delete it once we've been able to help.",
   vn:"Bạn có thể hoàn toàn ẩn danh. Chúng tôi chỉ lưu những gì bạn viết, không bao giờ bán hay chia sẻ ra ngoài nhóm nhỏ của mình, và xóa đi khi đã giúp được.",
   act:[['legal','Read privacy','Đọc quyền riêng tư']]},
  {k:/(contact|email|reach you|talk to (a )?human|real person|liên hệ|người thật)/i,
   en:"You can reach us any time on WhatsApp, or email hello@anhsonmovement.org. A real person will answer. That's the whole point of us.",
   vn:"Bạn có thể liên hệ bất cứ lúc nào trên WhatsApp, hoặc email hello@anhsonmovement.org. Một người thật sẽ trả lời. Đó chính là điều chúng tôi hướng tới.",
   act:[['join','Message us','Nhắn cho chúng tôi']]},
  {k:/(thank|cảm ơn|cám ơn)/i,
   en:"Any time. Thank you for caring. That's how all of this starts. 💛",
   vn:"Bất cứ lúc nào. Cảm ơn bạn đã quan tâm. Mọi thứ đều bắt đầu từ đó. 💛"}
 ];

 function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}

 function bubble(cls,en,vn,acts){
  var d=document.createElement('div'); d.className='msg '+cls;
  d.innerHTML='<span class="en">'+en+'</span><span class="vn">'+vn+'</span>';
  if(acts&&acts.length){
   var w=document.createElement('div'); w.className='msgact';
   acts.forEach(function(a){
    var b=document.createElement('button');
    b.innerHTML='<span class="en">'+a[1]+'</span><span class="vn">'+a[2]+'</span>';
    b.addEventListener('click',function(){ closePanel(); showView(a[0]); });
    w.appendChild(b);
   });
   d.appendChild(w);
  }
  log.appendChild(d); log.scrollTop=log.scrollHeight; return d;
 }
 function typing(){var d=document.createElement('div');d.className='msg bot typing';
  d.innerHTML='<i></i><i></i><i></i>';log.appendChild(d);log.scrollTop=log.scrollHeight;return d;}

 function localAnswer(q){
  for(var i=0;i<KB.length;i++){ if(KB[i].k.test(q)) return KB[i]; }
  return {en:"I'm still learning, so I might not have that one. Ask me about donating, joining, or nominating someone. Or talk to a real person on WhatsApp.",
          vn:"Mình vẫn đang học nên có thể chưa biết điều đó. Hãy hỏi mình về ủng hộ, tham gia, hoặc giới thiệu một người. Hoặc nói chuyện với người thật trên WhatsApp.",
          act:[['donate','Donate','Ủng hộ'],['nominate','Nominate someone','Giới thiệu'],['join','Talk to a human','Nói với người thật']]};
 }

 function careAnswer(){
  return bubble('bot care',
   "I'm really glad you told me, and I'm sorry things feel this heavy. I'm an AI, so I'm not the right one to carry this with you. But a person is. Please reach out right now to your local emergency number (112 in Europe, 115 in Vietnam) or a crisis line in your country. If you'd rather talk to someone from our community, we're on WhatsApp and we will answer. You matter, and you don't have to hold this alone.",
   "Mình rất mừng vì bạn đã nói ra, và rất tiếc vì mọi thứ đang nặng nề như vậy. Mình là AI nên không phải người phù hợp để cùng bạn mang điều này. Nhưng con người thì có. Xin hãy liên hệ ngay số khẩn cấp ở nơi bạn sống (112 ở châu Âu, 115 ở Việt Nam) hoặc đường dây hỗ trợ khủng hoảng. Nếu bạn muốn nói chuyện với ai đó trong cộng đồng, chúng tôi ở trên WhatsApp và sẽ trả lời. Bạn quan trọng, và bạn không phải một mình gánh điều này.",
   [['join','Talk to a human','Nói với người thật']]);
 }

 function respond(q){
  if(CRISIS.test(q)){ careAnswer(); return; }         /* always local, never depends on network */
  var t=typing();
  var done=function(en,vn,act){ t.remove(); bubble('bot',en,vn,act); };
  var fb=function(){ var a=localAnswer(q); done(a.en,a.vn,a.act); };
  if(!apiOK){ setTimeout(fb,420); return; }
  fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({message:q,lang:asmLang(),history:history.slice(-8)})})
   .then(function(r){ if(!r.ok) throw new Error('no api'); return r.json(); })
   .then(function(d){ if(!d||!d.reply) throw new Error('empty');
     t.remove(); bubble('bot',esc(d.reply),esc(d.reply)); })
   .catch(function(){ apiOK=false; fb(); });
 }

 var QUICK=[['How do I donate?','Ủng hộ thế nào?'],['Where does my money go?','Tiền của tôi đi đâu?'],
            ['I know someone who needs help','Tôi biết người cần giúp'],['Talk to a human','Nói với người thật']];
 function renderQuick(){
  quick.innerHTML='';
  QUICK.forEach(function(q){
   var b=document.createElement('button');
   b.innerHTML='<span class="en">'+q[0]+'</span><span class="vn">'+q[1]+'</span>';
   b.addEventListener('click',function(){ send(asmLang()==='vn'?q[1]:q[0]); });
   quick.appendChild(b);
  });
 }
 function send(text){
  text=(text||'').trim(); if(!text) return;
  bubble('me',esc(text),esc(text));
  history.push({role:'user',content:text});
  input.value=''; respond(text);
 }
 function openPanel(){
  panel.classList.add('open'); btn.style.display='none';
  if(!greeted){ greeted=true;
   bubble('bot',"Hi, I'm <b>Lynn</b>, an <b>AI assistant</b>, not a person. I can help you follow the movement, join the community, or tell us about someone who is having a hard time. What's on your mind?",
                "Chào bạn, mình là <b>Lynn</b>, một <b>trợ lý AI</b>, không phải con người. Mình có thể giúp bạn theo dõi phong trào, tham gia cộng đồng, hoặc kể cho chúng tôi về ai đó đang gặp khó khăn. Bạn đang nghĩ gì?");
   renderQuick();
  }
  setTimeout(function(){input.focus();},320);
 }
 function closePanel(){ panel.classList.remove('open'); btn.style.display=''; }
 btn.addEventListener('click',openPanel);
 close.addEventListener('click',closePanel);
 document.addEventListener('keydown',function(e){ if(e.key==='Escape'&&panel.classList.contains('open')) closePanel(); });
 form.addEventListener('submit',function(e){ e.preventDefault(); send(input.value); });
 setTimeout(function(){ if(!greeted) btn.classList.add('nudge'); },14000);
})();

(function(){var v=document.querySelector('.orbvid');if(!v)return;
 if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches){v.remove();return;}
 v.play().catch(function(){});
 document.addEventListener('visibilitychange',function(){document.hidden?v.pause():v.play().catch(function(){});});})();

/* ============================================================
   ASM_CONFIG: the only place you need to edit.
   Fill a value in and the matching button starts working.
   Leave it empty and the site degrades gracefully (never a dead end).
   ============================================================ */
var ASM_CONFIG = {
  whatsapp: 'https://whatsapp.com/channel/0029Vb86Uc4GZNCrniLQmS0s',

  /* ---- THE STORIES ----------------------------------------------------
     Every quote below was published by the movement on Instagram. Nothing
     here is written for the website and nothing is translated loosely: the
     Vietnamese is the sentence as posted, the English follows it.

     `match` is a distinctive phrase from that post's caption. The cards find
     their own post by searching the live feed for it, which means the link
     and the photograph always come from Instagram and can never go stale
     against a list of URLs in this file. `back` is the same thing for the
     part where Sơn returns — when it matches, the card says so.

     `cost` stays null until Sơn confirms a real price. A card with no price
     shows what is needed in words and opens the normal giving panel; a card
     with one offers that exact amount. No figure is ever invented here.  */
  stories: [
    {
      id: 'banhmi',
      match: 'cầu xin Chúa cho tôi được khỏe',
      back: 'tôi không biết nói gì hết',
      quote: { vn: 'Tôi chỉ cầu xin Chúa cho tôi được khỏe… để tôi còn lo cho con.',
               en: 'I only pray to God for health, so I can still take care of my son.' },
      who:   { vn: 'Ở tuổi của bà, nhiều người chỉ mong được nghỉ. Bà vẫn bán bánh mì mỗi ngày để chăm người con trai mắc bệnh tâm thần.',
               en: 'At her age most people hope to rest. She still sells bread every day to care for a son with a mental illness.' },
      need:  { vn: 'Thuốc cho con trai bà, mỗi tháng.',
               en: "Her son's medication, month by month." },
      cost: null
    },
    {
      id: 'lottery',
      match: 'biết nói như những đứa trẻ khác',
      back: null,
      quote: { vn: 'Em không mong gì nữa. Chỉ mong cho nó biết nói như những đứa trẻ khác.',
               en: "I don't wish for anything else. Only that he learns to speak, like other children." },
      who:   { vn: 'Sáu năm nuôi con một mình, không ai giúp, bán vé số để sống qua ngày. Được hỏi mong gì nhất, cô không xin gì cho mình.',
               en: 'Six years raising him alone, with nobody helping, selling lottery tickets to get through the day. Asked what she wants most, she asks nothing for herself.' },
      need:  { vn: 'Một buổi khám và trị liệu ngôn ngữ cho con trai cô.',
               en: 'An assessment and speech therapy for her son.' },
      cost: null
    },
    {
      id: 'uniform',
      match: 'mua có một bộ cho cháu thôi',
      back: null,
      quote: { vn: 'Ba mẹ không có đủ tiền… nên mẹ mua có một bộ cho cháu thôi.',
               en: "We didn't have enough money, so I only bought him one set." },
      who:   { vn: 'Hai vợ chồng đều đi làm, nhưng thu nhập vẫn không đủ để chăm lo cho ba đứa con.',
               en: 'Both parents work. The income still is not enough for three children.' },
      need:  { vn: 'Đồng phục và sách vở cho ba đứa trẻ.',
               en: 'Uniforms and school things for three children.' },
      /* 3 × (một bộ đồng phục 600.000 ₫ + một bộ sách 160.000 ₫) */
      cost: { vn: '2.280.000 ₫ cho cả ba — khoảng 76 €',
              en: '2,280,000 ₫ for all three — about €76' },
      costAmount: 2280000
    },
    {
      id: 'temple',
      match: 'Bà chỉ cầu mong',
      back: 'lắng nghe thôi chưa đủ',
      quote: null,
      line:  { vn: 'Bà không xin tiền. Không cầu điều gì cho mình.',
               en: 'She asked for no money. She prayed for nothing for herself.' },
      who:   { vn: 'Chồng bà mắc ung thư và đang rất đau. Bà đến chùa vì không biết làm gì khác được nữa.',
               en: 'Her husband has cancer and he is in a great deal of pain. She went to the temple because she no longer knew what else to do.' },
      need:  { vn: 'Thuốc giảm đau cho chồng bà.',
               en: 'Pain relief for her husband.' },
      cost: null
    },
    {
      id: 'cancercouple',
      match: '18 lần xạ trị',
      back: 'Lần này, để giúp',
      quote: null,
      line:  { vn: 'Họ gần như không có gì. Chỉ có nhau.',
               en: 'They have almost nothing. Only each other.' },
      who:   { vn: 'Bà bị ung thư vú và còn 18 lần xạ trị. Ông bị ung thư gan. Họ sống nhờ cơm từ thiện và một chỗ trọ miễn phí.',
               en: 'She has breast cancer and 18 radiotherapy sessions still to come. He has liver cancer. They live on charity meals and a room somebody lets them use.' },
      need:  { vn: '18 lần xạ trị còn lại của bà.',
               en: 'The 18 radiotherapy sessions she still has to go through.' },
      cost: null
    },
    {
      id: 'grab80',
      match: 'Thì chú đi bán vé số',
      back: 'Anh Sơn không chỉ dừng lại',
      quote: { vn: 'Đâu phải mình ăn tiền người ta là dễ. Kiếp này mình, kiếp sau mình cũng phải trả người ta.',
               en: 'It is not an easy thing to take another person\'s money. In this life, or the next, I will still have to repay them.' },
      who:   { vn: 'Ông 80 tuổi. Vợ ông đang điều trị ung thư, hai ông bà không có con. Hỏi ông tính sao nếu một ngày chạy xe không nổi nữa, ông đáp: “Thì chú đi bán vé số, ăn qua ngày.” Ông không xin gì cả — ông chỉ sợ mắc nợ ai đó.',
               en: 'He is 80. His wife is being treated for cancer and they have no children. Asked what he would do if one day he could no longer ride, he said: “Then I\'ll sell lottery tickets, and get through the day.” He asked for nothing. He was only afraid of owing someone.' },
      need:  { vn: 'Thuốc cho vợ ông.',
               en: "His wife's medicine." },
      cost: null
    },
    {
      id: 'hoang',
      match: 'Anh Hoàng ngồi ở góc phố này',
      back: null,
      quote: null,
      line:  { vn: 'Mắt anh gần như không còn nhìn rõ. Anh cần được chữa.',
               en: 'His eyes can barely see any more. He needs treatment.' },
      who:   { vn: 'Cái mẹt trước mặt, ly cà phê đá bên cạnh. Anh vẫn ngồi bán ở góc phố ấy mỗi ngày, chưa một lần bỏ cuộc.',
               en: 'His tray in front of him, an iced coffee beside it. He still sits and sells at that corner every day, and has never once given up.' },
      need:  { vn: 'Một lần khám mắt tử tế.',
               en: 'One proper eye examination.' },
      cost: null
    },
    {
      id: 'fate',
      match: 'Cái nghèo là do cái phần',
      back: null,
      quote: { vn: 'Cái nghèo là do cái phần, cái số…',
               en: 'Being poor is just my portion, my fate…' },
      who:   { vn: 'Bà không còn nghĩ nhiều đến ngày mai, chỉ nghĩ làm sao qua được hôm nay. Không có một nơi ổn định để gọi là nhà.',
               en: 'She has stopped thinking much about tomorrow and thinks only about getting through today. She has nowhere settled to call home.' },
      need:  { vn: 'Một chỗ ở, và những bữa ăn không phải chờ người khác cho.',
               en: "Somewhere to stay, and meals that don't wait on someone else's kindness." },
      cost: null
    }
  ],

  /* How many posts the story cards search through. The rail itself still shows
     twelve; this only affects how far back a card can find its own picture. */

  /* ---- WHAT A GIFT BUYS ------------------------------------------------
     Prices of ordinary things in Vietnam, taken from published price lists,
     NOT quotes for the people on the story cards. The page says so in as many
     words, because the difference is the whole reason these can be shown at
     all. `vnd` is what the giving panel offers when the tier is chosen.

     Sources, September 2026:
       books   the 2026-27 state textbook price, 157.000 ₫ for year one
       shirt   235.000 ₫, trousers 289.000 ₫, a uniform maker's retail list
       rate    about 30.000 ₫ to the euro, rounded so the euro never flatters  */
  buys: [
    { vnd: 160000, eur: 5,
      what: { vn: 'Một bộ sách giáo khoa cho cả năm học',
              en: 'A full set of schoolbooks for the year' } },
    { vnd: 300000, eur: 10,
      what: { vn: 'Một chiếc áo đồng phục',
              en: 'One uniform shirt' } },
    { vnd: 600000, eur: 20,
      what: { vn: 'Một bộ đồng phục hoàn chỉnh, áo và quần',
              en: 'A complete uniform, shirt and trousers' } },
    { vnd: 800000, eur: 27,
      what: { vn: 'Đồng phục và sách vở cho một đứa trẻ vào năm học mới',
              en: 'Uniform and books for one child starting the year' } }
  ],
  storyFeedLimit: 25,

  email:    'hello@anhsonmovement.org',
  site:     'https://anh-son-website.vercel.app',
  instagram:'https://www.instagram.com/anhsonmovement/',
  facebook: 'https://www.facebook.com/share/1Jz95F2ifx/',
  tiktok:   'https://www.tiktok.com/@anhsonmovement',
  /* Payment links (Stripe Payment Links, Mollie, PayPal.me ... ).
     once  = one-time gift per amount, monthly = recurring per amount.
     custom = an "enter your own amount" link. Empty = button explains politely. */
  pay: {
    once:    { 5:'', 10:'', 25:'', 50:'' },
    monthly: { 5:'', 10:'', 25:'', 50:'' },
    custom:  ''
  },
  /* other payment rails shown inside the gift modal.
     Empty = that tab is hidden automatically. */
  paypal:  '',                 /* e.g. https://paypal.me/anhsonmovement */
  zalopay: '',                 /* ZaloPay merchant or QR link */
  bank: { name:'', accountName:'', accountNumber:'', note:'' },

  /* ---- GIVING --------------------------------------------------------
     The site asks for money and says plainly where it goes. The give
     CONTROLS stay hidden until a payment route actually exists, so no
     button ever leads nowhere. Fill in give.once / give.monthly and set
     give.ready to true, and the ask appears everywhere at once.
     Keep every secret key out of this file: these are public checkout
     URLs, never an API key.                                            */
  give: {
    /* 'auto' asks /api/checkout?health=1 once per visit and switches the give
       buttons on when Stripe answers. That means the only thing TOM has to do
       is set the Stripe key in Vercel (see api/_stripe.js for the exact
       variable names, which are deliberately not repeated in this file):
       the site then turns itself on. Force it
       with true or false while testing. */
    ready: 'auto',

    /* Amounts offered per currency. These are only what the sheet SHOWS; the
       server validates independently, so editing this list cannot open a hole.
       VND is zero-decimal: those numbers are đồng, not cents. */
    amounts: {
      eur: [10, 25, 50, 100],
      usd: [10, 25, 50, 100],
      /* the denominations people actually hand over in Vietnam, not a
         conversion of the euro tiers */
      vnd: [100000, 200000, 500000, 1000000],
    },
    preselect: 25,               /* the tile that starts selected, in EUR/USD */
    preselectVnd: 200000,

    /* Must match api/_stripe.js CURRENCIES. Kept here only so the sheet can
       refuse the obviously wrong before spending a round trip. */
    limits: {
      eur: { min: 2, max: 5000 },
      usd: { min: 2, max: 5000 },
      vnd: { min: 50000, max: 99000000 },
    },

    /* VND stays off until a real charge has cleared on the live account:
       whether a Netherlands Stripe account can present đồng depends on the
       account, and a currency that fails at checkout is worse than one that
       was never offered. Set STRIPE_ALLOW_VND=true in Vercel as well. */
    vnd: false,
  },
  /* Web3Forms access key. Public by design — Web3Forms states it is safe in
     client-side code. Delivery goes straight from the browser, which is the
     route that is proven to work; the /api functions stay as the upgrade path
     to Resend later. Set useApi:true to route through them instead. */
  web3formsKey: 'f7f8fb6d-f1be-48a1-9ed7-39462fa516aa',
  useApi: false,
  donationsOpen: false,

  /* The channel the Follow buttons point at. Instagram is the primary
     channel while we build awareness. TOM: paste the real URLs here. */
  followPrimary: 'instagram',          /* instagram | facebook | whatsapp */

  /* Vietnam is the primary market. Vietnamese visitors must never be asked
     for euros. Set the đồng amount shown for each tier here.
     TOM: confirm these four figures before launch. */
  vnd: { 5:100000, 10:200000, 25:500000, 50:1000000 },
  vndPerEur: 27000,          /* only used for a custom amount */

  /* Fundraising goal. Leave raised/target at 0 and the progress bar stays
     hidden. Better an empty space than a number nobody can verify. */
  goal: { raised:0, target:0, donors:0 }
};

/* ---- wire every WhatsApp button ---- */
(function(){
  if(!ASM_CONFIG.whatsapp) return;
  document.querySelectorAll('.jcta a.btn, .nomcard a.btn').forEach(function(a){
    var t=(a.textContent||'').toLowerCase();
    if(t.indexOf('whatsapp')>-1 || t.indexOf('message us')>-1 || t.indexOf('nhắn')>-1){
      a.setAttribute('href', ASM_CONFIG.whatsapp);
      a.setAttribute('target','_blank'); a.setAttribute('rel','noopener');
      a.removeAttribute('data-go');
    }
  });
})();

/* ---- make the donate button actually pay ---- */
(function(){
  var btn=document.querySelector('.donate-btn'); if(!btn) return;
  var note=document.createElement('div'); note.className='paynote'; note.setAttribute('role','status');
  btn.parentNode.insertBefore(note, btn.nextSibling);

  function period(){ var d=document.querySelector('.dt.active'); return d&&d.dataset.t==='month'?'monthly':'once'; }
  function amount(){
    var a=document.querySelector('.amt.active'); if(a) return +a.dataset.amt;
    var c=document.querySelector('.amt-custom'); var v=parseInt((c&&c.value)||'0',10);
    return v>0?v:5;
  }
  function linkFor(){
    var t=ASM_CONFIG.pay||{}, per=period(), amt=amount();
    var exact=(t[per]||{})[amt];
    if(exact) return exact;
    if(t.custom) return t.custom;
    return '';
  }
  btn.addEventListener('click', function(e){
    var url=linkFor();
    if(url){ return; } /* real link: let the browser follow it */
    e.preventDefault();
    note.className='paynote on';
    note.innerHTML='<span class="en">The card route is not live yet. Message us on WhatsApp and we will arrange your gift ourselves. It reaches someone just as fast.</span>'+
                   '<span class="vn">Kênh thẻ chưa hoạt động. Hãy nhắn cho chúng tôi trên WhatsApp và chúng tôi sẽ tự sắp xếp món quà của bạn. Nó vẫn đến với ai đó nhanh như vậy.</span>'+
                   (ASM_CONFIG.whatsapp?'<a class="btn white" style="margin-top:12px" href="'+ASM_CONFIG.whatsapp+'" target="_blank" rel="noopener"><span class="en">Message us on WhatsApp</span><span class="vn">Nhắn cho chúng tôi</span></a>':'');
  });
  function sync(){
    var url=linkFor();
    if(url){ btn.setAttribute('href',url); btn.setAttribute('target','_blank'); btn.setAttribute('rel','noopener'); note.className='paynote'; }
    else { btn.setAttribute('href','#'); btn.removeAttribute('target'); }
  }
  document.querySelectorAll('.amt,.dt').forEach(function(el){ el.addEventListener('click',function(){ setTimeout(sync,0); }); });
  var c=document.querySelector('.amt-custom'); if(c) c.addEventListener('input',function(){ setTimeout(sync,0); });
  sync();
})();

/* ---- mobile menu ---- */
(function(){
  var b=document.getElementById('burger'), m=document.getElementById('mobmenu');
  if(!b||!m) return;
  function close(){ m.classList.remove('open'); b.classList.remove('on'); b.setAttribute('aria-expanded','false'); document.body.classList.remove('menu-open'); }
  b.addEventListener('click',function(){
    var open=!m.classList.contains('open');
    m.classList.toggle('open',open); b.classList.toggle('on',open);
    b.setAttribute('aria-expanded',open?'true':'false');
    document.body.classList.toggle('menu-open',open);
  });
  m.querySelectorAll('.mlink').forEach(function(a){ a.addEventListener('click',close); });
  document.addEventListener('keydown',function(e){ if(e.key==='Escape') close(); });
})();

/* ---- sticky mobile give bar ---- */
(function(){
  var bar=document.querySelector('.givebar'); if(!bar) return;
  function upd(){
    var onDonate=document.querySelector('.view[data-view="donate"]');
    var isDonate=onDonate&&onDonate.classList.contains('show');
    var scrolled=window.scrollY>520;
    bar.classList.toggle('show', scrolled && !isDonate);
  }
  window.addEventListener('scroll',upd,{passive:true});
  document.querySelectorAll('[data-go]').forEach(function(el){ el.addEventListener('click',function(){ setTimeout(upd,120); }); });
  upd();
})();

/* ---- donation modal ---- */
(function(){
  var mod=document.getElementById('dmodal'); if(!mod) return;
  var C=function(){ return window.ASM_CONFIG||{}; };
  var lastFocus=null;

  function amount(){
    var a=document.querySelector('.amt.active'); if(a) return +a.dataset.amt;
    var c=document.querySelector('.amt-custom'); var v=parseInt((c&&c.value)||'0',10); return v>0?v:5;
  }
  function period(){ var d=document.querySelector('.dt.active'); return (d&&d.dataset.t==='month')?'monthly':'once'; }
  function payLink(){
    var pay=C().pay||{}, per=period(), amt=amount();
    return (pay[per]||{})[amt] || pay.custom || '';
  }

  /* --- show only the rails that are configured; keep bank as the always-there fallback --- */
  function setupTabs(){
    var avail={ card: !!payLink(), paypal: !!C().paypal, zalopay: !!C().zalopay, bank: true };
    var first=null;
    mod.querySelectorAll('.dm-tab').forEach(function(t){
      var k=t.dataset.pm, ok=!!avail[k];
      t.style.display = ok ? '' : 'none';
      if(ok && !first) first=k;
    });
    mod.querySelectorAll('.dm-panel').forEach(function(pn){
      pn.style.display='none';
    });
    show(first||'bank');
  }
  function show(key){
    mod.querySelectorAll('.dm-tab').forEach(function(t){ t.classList.toggle('active', t.dataset.pm===key); });
    mod.querySelectorAll('.dm-panel').forEach(function(pn){
      var on = pn.dataset.pmp===key;
      pn.style.display = on ? '' : 'none';
      pn.classList.toggle('on', on);
    });
  }
  mod.querySelectorAll('.dm-tab').forEach(function(t){
    t.addEventListener('click', function(){ show(t.dataset.pm); });
  });

  function fill(){
    var amt=amount(), per=period();
    mod.querySelectorAll('.dm-amt').forEach(function(e){ e.textContent='\u20ac'+amt; });
    mod.querySelectorAll('.dm-per').forEach(function(e){
      e.innerHTML = per==='monthly'
        ? '<span class="en">per month \u00b7 cancel anytime</span><span class="vn">m\u1ed7i th\u00e1ng \u00b7 h\u1ee7y b\u1ea5t c\u1ee9 l\u00fac n\u00e0o</span>'
        : '<span class="en">one-time gift</span><span class="vn">m\u00f3n qu\u00e0 m\u1ed9t l\u1ea7n</span>';
    });
    var s=mod.querySelector('[data-stripe]'); if(s){ var l=payLink(); if(l) s.setAttribute('href',l); else s.removeAttribute('href'); }
    var pp=mod.querySelector('[data-pp]');
    if(pp){ var u=C().paypal||''; if(u) pp.setAttribute('href', u.replace(/\/$/,'')+'/'+amt); else pp.removeAttribute('href'); }
    var zl=mod.querySelector('[data-zl]');
    if(zl){ if(C().zalopay) zl.setAttribute('href', C().zalopay); else zl.removeAttribute('href'); }
    var bank=C().bank||{};
    mod.querySelectorAll('[data-bk]').forEach(function(e){
      var k=e.getAttribute('data-bk'); var val=bank[k]||'';
      e.textContent = val || '\u00b7';
    });
    var remind=mod.querySelector('[data-remindwa]');
    if(remind && C().whatsapp){ remind.setAttribute('href', C().whatsapp); remind.setAttribute('target','_blank'); remind.setAttribute('rel','noopener'); }
    setupTabs();
  }

  /* copy-to-clipboard for the bank details */
  mod.querySelectorAll('[data-copy]').forEach(function(b){
    b.addEventListener('click', function(){
      var k=b.getAttribute('data-copy');
      var t=mod.querySelector('[data-bk="'+k+'"]');
      var val=t?t.textContent.trim():'';
      if(!val||val==='\u00b7') return;
      if(navigator.clipboard) navigator.clipboard.writeText(val);
      var old=b.innerHTML;
      b.innerHTML='<span class="en">Copied</span><span class="vn">\u0110\u00e3 sao ch\u00e9p</span>';
      setTimeout(function(){ b.innerHTML=old; }, 1600);
    });
  });

  /* "I've sent my gift" -> thank-you step */
  var done=mod.querySelector('.dm-done');
  if(done) done.addEventListener('click', function(){
    var pay=mod.querySelector('.dm-pay'), th=mod.querySelector('.dm-thanks');
    if(pay) pay.classList.remove('on');
    if(th) th.classList.add('on');
  });

  function open(){
    lastFocus=document.activeElement;
    var pay=mod.querySelector('.dm-pay'), th=mod.querySelector('.dm-thanks');
    if(pay) pay.classList.add('on');
    if(th) th.classList.remove('on');
    fill();
    mod.hidden=false;
    requestAnimationFrame(function(){ mod.classList.add('open'); });
    document.body.classList.add('menu-open');
    setTimeout(function(){ var f=mod.querySelector('.dm-x'); if(f) f.focus(); }, 240);
  }
  function close(){
    mod.classList.remove('open');
    document.body.classList.remove('menu-open');
    setTimeout(function(){ mod.hidden=true; }, 260);
    if(lastFocus&&lastFocus.focus) lastFocus.focus();
  }
  mod.querySelectorAll('[data-dmclose]').forEach(function(e){ e.addEventListener('click', close); });
  document.addEventListener('keydown', function(e){ if(e.key==='Escape'&&!mod.hidden) close(); });
  window.ASM_openGift=open;

  var btn=document.querySelector('.donate-btn');
  if(btn) btn.addEventListener('click', function(e){ e.preventDefault(); e.stopImmediatePropagation(); open(); }, true);
  var gb=document.getElementById('gb-btn');
  if(gb) gb.addEventListener('click', function(e){ e.preventDefault(); open(); });
  mod.querySelectorAll('.wa-join').forEach(function(a){
    if(C().whatsapp){ a.setAttribute('href',C().whatsapp); a.setAttribute('target','_blank'); a.setAttribute('rel','noopener'); }
  });
})();

(function(){
  var vids=[].slice.call(document.querySelectorAll('.hvid video,.vid-panel video,.vcard video'));
  if(!vids.length) return;
  if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    vids.forEach(function(v){ v.pause(); }); return;
  }
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){
      es.forEach(function(e){
        if(e.isIntersecting){ e.target.play().catch(function(){}); }
        else { e.target.pause(); }
      });
    },{threshold:.15});
    vids.forEach(function(v){ io.observe(v); });
  }
  document.addEventListener('visibilitychange',function(){
    vids.forEach(function(v){ document.hidden ? v.pause() : (v.getBoundingClientRect().top<innerHeight && v.play().catch(function(){})); });
  });
})();

/* ============================================================
   Design-system behaviour (added with the 2026 rebrand)
   – sticky nav: transparent over the hero, solid once scrolled
   – give-bar aware floating assistant button
   – button ripple origin
   – newsletter sign-up
   ============================================================ */
(function(){
  'use strict';

  /* ---- nav: transparent -> solid ---- */
  var body = document.body, ticking = false;
  function onScroll(){
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function(){
      body.classList.toggle('nav-solid', window.scrollY > 24);
      var bar = document.querySelector('.givebar');
      body.classList.toggle('gb-on', !!(bar && bar.classList.contains('show')));
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, {passive:true});
  window.addEventListener('resize', onScroll, {passive:true});
  onScroll();

  /* the mobile menu always needs a solid bar behind it */
  var burger = document.getElementById('burger');
  if (burger) burger.addEventListener('click', function(){
    setTimeout(function(){
      if (body.classList.contains('menu-open')) body.classList.add('nav-solid');
      else onScroll();
    }, 0);
  });

  /* ---- keyboard support for the logo (it is a div, not an anchor) ---- */
  var logo = document.querySelector('.logo[data-go]');
  if (logo) logo.addEventListener('keydown', function(e){
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); logo.click(); }
  });

  /* ---- ripple origin for buttons ---- */
  document.addEventListener('pointerdown', function(e){
    var b = e.target.closest && e.target.closest('.btn');
    if (!b) return;
    var r = b.getBoundingClientRect();
    b.style.setProperty('--rx', ((e.clientX - r.left) / r.width * 100) + '%');
    b.style.setProperty('--ry', ((e.clientY - r.top) / r.height * 100) + '%');
  }, {passive:true});

  /* ---- newsletter ---- */
  var nf = document.getElementById('newsform'), nm = document.getElementById('newsmsg');
  if (nf && nm){
    nf.addEventListener('submit', function(e){
      e.preventDefault();
      var input = nf.querySelector('input[type=email]');
      var vn = body.classList.contains('lang-vn');
      var ok = input && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim());
      nm.className = 'formmsg on ' + (ok ? 'ok' : 'err');
      nm.textContent = ok
        ? (vn ? 'Cảm ơn bạn. Chúng tôi sẽ gửi tin nhẹ nhàng mỗi tháng.'
              : 'Thank you. One quiet update a month, nothing more.')
        : (vn ? 'Vui lòng nhập một địa chỉ email hợp lệ.'
              : 'Please enter a valid email address.');
      if (ok && input) input.value = '';
    });
  }
})();

/* ============================================================
   Deep links (added with the 2026 rebrand)
   Every view gets its own URL, so a WhatsApp or Instagram link can
   open straight on #/donate, and the browser back button works.
   Also: first-visit language detection for Vietnamese visitors.
   ============================================================ */
(function(){
  'use strict';
  var VIEWS = {};
  document.querySelectorAll('.view[data-view]').forEach(function(s){ VIEWS[s.dataset.view] = true; });

  function fromHash(){
    var m = (location.hash || '').match(/^#\/?([a-z]+)/i);
    return (m && VIEWS[m[1]]) ? m[1] : null;
  }

  /* first-visit language: Vietnam is the primary market */
  try{
    var params = new URLSearchParams(location.search);
    var forced = params.get('lang');
    if (forced === 'vn' || forced === 'vi') setLang('vn');
    else if (forced === 'en') setLang('en');
    else if (!localStorage.getItem('asm_lang') &&
             /^vi\b/i.test(navigator.language || '')) setLang('vn');
  }catch(e){}

  /* open the view named in the URL */
  var initial = fromHash();
  if (initial) showView(initial);

  /* reflect navigation in the URL (runs after the existing click handlers) */
  document.addEventListener('click', function(e){
    var el = e.target.closest && e.target.closest('[data-go]');
    if (!el || !VIEWS[el.dataset.go]) return;
    var want = '#/' + el.dataset.go;
    if (location.hash !== want) history.pushState({v: el.dataset.go}, '', want);
  });

  window.addEventListener('popstate', function(){ showView(fromHash() || 'home'); });
})();

/* ---- footer social links: shown only when configured (no dead ends) ---- */
(function(){
  var C = window.ASM_CONFIG || {};
  document.querySelectorAll('[data-social]').forEach(function(a){
    var key = a.dataset.social;
    if (key === 'whatsapp') {
      if (C.whatsapp) { a.href = C.whatsapp; a.hidden = false; } else { a.hidden = true; }
      return;
    }
    if (key === 'email') {
      if (C.email) { a.href = 'mailto:' + C.email; a.hidden = false; } else { a.hidden = true; }
      return;
    }
    var url = C[key];
    if (url) { a.href = url; a.hidden = false; } else { a.hidden = true; }
  });
})();

/* ============================================================
   Scroll craft: progress bar, gentle parallax, section depth
   ============================================================ */
(function(){
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var bar   = document.querySelector('#scrollbar i');
  var marks = [].slice.call(document.querySelectorAll('.hero-watermark, .pb-watermark'));
  var ticking = false;

  function frame(){
    var y = window.scrollY || 0;
    if (bar){
      var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      bar.style.width = Math.min(100, (y / max) * 100) + '%';
    }
    if (!reduce){
      marks.forEach(function(el){
        var r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > window.innerHeight + 200) return;
        var shift = (r.top + r.height / 2 - window.innerHeight / 2) * -0.06;
        var base  = el.classList.contains('hero-watermark') ? ' translateY(-50%)' : '';
        el.style.transform = 'translate3d(0,' + shift.toFixed(1) + 'px,0)' + base;
      });
    }
    ticking = false;
  }
  function onScroll(){ if (!ticking){ ticking = true; requestAnimationFrame(frame); } }
  window.addEventListener('scroll', onScroll, {passive:true});
  window.addEventListener('resize', onScroll, {passive:true});
  onScroll();

  /* reveal on enter — replaces the timer-based stagger with real observation */
  if ('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, {rootMargin: '0px 0px -8% 0px', threshold: 0.06});
    document.querySelectorAll('.reveal, .dright').forEach(function(el){ io.observe(el); });
  }
})();

/* ============================================================
   Currency, honest payment states and a truthful goal bar
   Added after the full conversion audit.
   ============================================================ */
(function(){
  'use strict';
  var C = function(){ return window.ASM_CONFIG || {}; };
  var body = document.body;

  function isVN(){ return body.classList.contains('lang-vn'); }

  function vndFor(eur){
    var map = C().vnd || {};
    if (map[eur]) return map[eur];
    var rate = C().vndPerEur || 27000;
    return Math.round(eur * rate / 10000) * 10000;   // round to a friendly figure
  }
  function fmtVND(n){ return n.toLocaleString('de-DE') + ' ₫'; }

  /* the amount as the *current* visitor should see it */
  function money(eur){ return isVN() ? fmtVND(vndFor(eur)) : '€' + eur; }
  window.asmMoney = money;

  function activeAmount(){
    var a = document.querySelector('.amt.active');
    if (a) return +a.dataset.amt;
    var c = document.querySelector('.amt-custom');
    var v = parseInt((c && c.value) || '0', 10);
    return v > 0 ? v : 5;
  }
  function isMonthly(){
    var d = document.querySelector('.dt.active');
    return !!(d && d.dataset.t === 'month');
  }

  function render(){
    var vn = isVN();

    /* preset chips */
    document.querySelectorAll('.amt[data-amt]').forEach(function(b){
      b.textContent = money(+b.dataset.amt);
    });
    /* the chips are wider in đồng */
    document.querySelector('.amounts') &&
      document.querySelector('.amounts').classList.toggle('amounts-vnd', vn);

    /* custom field */
    var c = document.querySelector('.amt-custom');
    if (c) c.setAttribute('placeholder', vn ? '₫…' : '€…');

    /* main give button */
    var amt = activeAmount(), per = isMonthly();
    var en = document.querySelector('.donate-btn .en'),
        vnb = document.querySelector('.donate-btn .vn');
    if (en)  en.textContent  = 'Give €' + amt + (per ? ' / mo' : '');
    if (vnb) vnb.textContent = 'Tặng ' + fmtVND(vndFor(amt)) + (per ? ' / tháng' : '');

    /* modal + sticky bar */
    document.querySelectorAll('.dm-amt').forEach(function(e){ e.textContent = money(amt); });
    var gb = document.querySelector('.gb-amt');
    if (gb) gb.textContent = money(5);

    /* home page teaser chips */
    var chips = document.querySelectorAll('.gc-chips span');
    [5,10,25].forEach(function(v,i){ if (chips[i]) chips[i].textContent = money(v); });

    /* amounts quoted inside running copy */
    document.querySelectorAll('.lo-amt').forEach(function(e){ e.textContent = fmtVND(vndFor(5)); });
    document.querySelectorAll('.lo-amt2').forEach(function(e){ e.textContent = fmtVND(vndFor(10)); });

    goalBar();
    bankPanel();
  }

  /* ---- goal bar: only shown when there are real figures to show ---- */
  function goalBar(){
    var goal = C().goal || {}, box = document.querySelector('.goal');
    if (!box) return;
    var live = goal.target > 0 && goal.raised >= 0;
    var row = box.querySelector('.goal-row'), bar = box.querySelector('.bar'),
        note = box.querySelector('.goalnote');
    if (!live){
      if (row) row.style.display = 'none';
      if (bar) bar.style.display = 'none';
      if (note){
        note.innerHTML = '<span class="en">We publish what came in, what went out and how many '
          + 'people it reached (audited totals, never a running estimate).</span>'
          + '<span class="vn">Chúng tôi công bố số tiền nhận được, số đã trao và số người được giúp '
          + '(tổng đã đối chiếu, không phải ước tính chạy liên tục).</span>';
      }
      return;
    }
    if (row) row.style.display = '';
    if (bar) bar.style.display = '';
    var vn = isVN();
    var raised = vn ? fmtVND(vndFor(goal.raised)) : '€' + goal.raised.toLocaleString('en-US');
    var target = vn ? fmtVND(vndFor(goal.target)) : '€' + goal.target.toLocaleString('en-US');
    var rEl = box.querySelector('.goal-raised'), tEl = box.querySelector('.goal-target');
    if (rEl) rEl.textContent = raised;
    if (tEl) tEl.textContent = target;
    var pct = Math.max(2, Math.min(100, Math.round(goal.raised / goal.target * 100)));
    var i = bar && bar.querySelector('i');
    if (i) i.style.setProperty('--w', pct + '%');
  }

  /* ---- bank panel: a warm route instead of four empty dashes ---- */
  function bankPanel(){
    var panel = document.querySelector('[data-pmp="bank"]');
    if (!panel) return;
    var b = C().bank || {};
    var configured = !!(b.name || b.accountNumber);
    var box = panel.querySelector('.bankbox');
    var fallback = panel.querySelector('.bank-fallback');

    var tip = panel.querySelector('.dm-hint:not(.dm-remind)');
    if (configured){
      if (box) box.style.display = '';
      if (tip) tip.style.display = '';
      if (fallback) fallback.remove();
      return;
    }
    if (box) box.style.display = 'none';
    if (tip) tip.style.display = 'none';   /* the VietQR tip makes no sense with no details */
    if (fallback) return;

    var wa = C().whatsapp || '';
    var el = document.createElement('div');
    el.className = 'bank-fallback';
    el.innerHTML =
      '<p><span class="en"><b>Our bank details are being finalised.</b> Message us and we’ll send '
      + 'them to you personally. Your gift still reaches someone this week.</span>'
      + '<span class="vn"><b>Thông tin ngân hàng đang được hoàn tất.</b> Hãy nhắn cho chúng tôi và '
      + 'chúng tôi sẽ gửi riêng cho bạn. Món quà của bạn vẫn đến với ai đó ngay trong tuần này.</span></p>'
      + (wa ? '<a class="btn gold paybtn" href="' + wa + '" target="_blank" rel="noopener">'
              + '<span class="en">Message us on WhatsApp</span>'
              + '<span class="vn">Nhắn cho chúng tôi trên WhatsApp</span></a>' : '');
    panel.insertBefore(el, panel.firstChild);
  }

  /* re-render whenever anything relevant changes */
  document.addEventListener('click', function(e){
    if (e.target.closest && e.target.closest('.amt, .dt, .langbtn, .donate-btn, .dm-tab'))
      setTimeout(render, 0);
  });
  var custom = document.querySelector('.amt-custom');
  if (custom) custom.addEventListener('input', function(){ setTimeout(render, 0); });
  new MutationObserver(render).observe(body, {attributes:true, attributeFilter:['class']});
  render();
})();

/* ============================================================
   Beta mode: following is the only ask
   ============================================================ */
(function(){
  'use strict';
  var C = window.ASM_CONFIG || {};
  var order = [C.followPrimary || 'instagram', 'instagram', 'facebook', 'whatsapp'];
  var url = '', chan = '';
  for (var i = 0; i < order.length; i++){
    if (C[order[i]]) { url = C[order[i]]; chan = order[i]; break; }
  }
  var LABEL = {
    instagram: ['Follow on Instagram', 'Theo dõi trên Instagram'],
    facebook:  ['Follow on Facebook',  'Theo dõi trên Facebook'],
    whatsapp:  ['Join on WhatsApp',    'Tham gia trên WhatsApp']
  };

  document.querySelectorAll('[data-follow]').forEach(function(a){
    if (!url){
      /* nothing configured yet — send people to the join page rather than nowhere */
      a.removeAttribute('href'); a.removeAttribute('target');
      a.setAttribute('data-go', 'join');
      a.addEventListener('click', function(e){ e.preventDefault(); showView('join'); });
      return;
    }
    a.href = url; a.target = '_blank'; a.rel = 'noopener';
    var en = a.querySelector('.en'), vn = a.querySelector('.vn');
    if (en && a.classList.contains('big')) en.textContent = LABEL[chan][0];
    if (vn && a.classList.contains('big')) vn.textContent = LABEL[chan][1];
  });

  /* The ask is in the copy either way. The CONTROLS are switched on by the
     giving sheet at the bottom of this file, which asks the server whether
     Stripe is actually wired up. Nothing to decide here. */
})();

/* ---- focus map: pins and tabs drive the same panel ---- */
(function(){
  var pins = [].slice.call(document.querySelectorAll('.pin'));
  var tabs = [].slice.call(document.querySelectorAll('.mp-tab'));
  var panels = [].slice.call(document.querySelectorAll('.mp-panel'));
  if (!pins.length) return;

  function select(i){
    pins.forEach(function(p){ p.classList.toggle('on', +p.dataset.spot === i); });
    tabs.forEach(function(t){ t.classList.toggle('on', +t.dataset.spot === i);
                              t.setAttribute('aria-selected', +t.dataset.spot === i); });
    panels.forEach(function(p){ p.classList.toggle('on', +p.dataset.panel === i); });
  }
  pins.concat(tabs).forEach(function(el){
    el.addEventListener('click', function(){ select(+el.dataset.spot); });
    el.addEventListener('mouseenter', function(){ select(+el.dataset.spot); });
    el.addEventListener('focus', function(){ select(+el.dataset.spot); });
  });
  select(0);
})();

/* ---- focus map v2: filter, arrows, keyboard ---- */
(function(){
  var pins  = [].slice.call(document.querySelectorAll('.pin'));
  var tabs  = [].slice.call(document.querySelectorAll('.mp-tab'));
  var pans  = [].slice.call(document.querySelectorAll('.mp-panel'));
  var fltrs = [].slice.call(document.querySelectorAll('.mp-f'));
  var arrows= [].slice.call(document.querySelectorAll('.mp-arrow'));
  if (!pins.length) return;

  var region = 'all', current = 0;
  function inRegion(i){ return region === 'all' || pins[i].dataset.region === region; }
  function visible(){ return pins.map(function(_,i){ return i; }).filter(inRegion); }

  function select(i){
    if (!inRegion(i)) return;
    current = i;
    pins.forEach(function(p,k){ p.classList.toggle('on', k === i); });
    tabs.forEach(function(t,k){ t.classList.toggle('on', k === i);
                                t.setAttribute('aria-selected', k === i ? 'true' : 'false');
                                t.tabIndex = k === i ? 0 : -1; });
    pans.forEach(function(p,k){ p.classList.toggle('on', k === i); });
  }
  function applyFilter(r){
    region = r;
    fltrs.forEach(function(f){ f.classList.toggle('on', f.dataset.region === r); });
    pins.forEach(function(p,k){ p.classList.toggle('dim', !inRegion(k)); });
    tabs.forEach(function(t,k){ t.classList.toggle('hide', !inRegion(k)); });
    var v = visible();
    if (v.indexOf(current) === -1 && v.length) select(v[0]);
  }
  function step(d){
    var v = visible(); if (!v.length) return;
    var at = v.indexOf(current);
    select(v[(at + d + v.length) % v.length]);
  }

  pins.concat(tabs).forEach(function(el){
    var i = +el.dataset.spot;
    el.addEventListener('click', function(){ select(i); });
    el.addEventListener('mouseenter', function(){ select(i); });
    el.addEventListener('focus', function(){ select(i); });
  });
  fltrs.forEach(function(f){ f.addEventListener('click', function(){ applyFilter(f.dataset.region); }); });
  arrows.forEach(function(a){ a.addEventListener('click', function(){ step(+a.dataset.step); }); });

  /* arrow keys move between areas once the tab strip has focus */
  document.querySelector('.mp-tabs').addEventListener('keydown', function(e){
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown'){ e.preventDefault(); step(1);
      tabs[current].focus(); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp'){ e.preventDefault(); step(-1);
      tabs[current].focus(); }
  });

  applyFilter('all'); select(0);
})();

/* ---- meet the people ---- */
(function(){
  var th = [].slice.call(document.querySelectorAll('.pp-thumb'));
  var pn = [].slice.call(document.querySelectorAll('.pp-panel'));
  if (!th.length) return;
  function sel(i){
    th.forEach(function(t,k){ t.classList.toggle('on', k === i); });
    pn.forEach(function(p,k){ p.classList.toggle('on', k === i); });
  }
  th.forEach(function(t,i){
    t.addEventListener('click', function(){ sel(i); });
    t.addEventListener('mouseenter', function(){ sel(i); });
    t.addEventListener('focus', function(){ sel(i); });
  });
})();

/* ═══════════════════════════════════════════════════════════════════
   SITE-WIDE INTERACTIVITY
   ═══════════════════════════════════════════════════════════════════ */

/* ---- story: scroll-driven sequence ---- */
(function(){
  var steps = [].slice.call(document.querySelectorAll('.sc-step'));
  var imgs  = [].slice.call(document.querySelectorAll('.sc-img'));
  if (!steps.length) return;
  var count = document.querySelector('.sc-count b');
  var bar   = document.querySelector('.sc-bar i');
  var cur = -1;
  function set(i){
    if (i === cur) return; cur = i;
    steps.forEach(function(s,k){ s.classList.toggle('on', k === i); });
    imgs.forEach(function(m,k){ m.classList.toggle('on', k === i); });
    if (count) count.textContent = ('0' + (i+1)).slice(-2);
    if (bar) bar.style.width = ((i+1) / steps.length * 100) + '%';
  }
  var io = new IntersectionObserver(function(es){
    es.forEach(function(e){
      if (e.isIntersecting) set(steps.indexOf(e.target));
    });
  }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
  steps.forEach(function(s){ io.observe(s); });
  set(0);
})();

/* ---- values: sticky word rail ---- */
(function(){
  var words = [].slice.call(document.querySelectorAll('.vword'));
  var panes = [].slice.call(document.querySelectorAll('.vpane'));
  var line  = document.querySelector('.vrail-line i');
  if (!words.length || !panes.length) return;
  var cur = -1;
  function set(i){
    if (i === cur) return; cur = i;
    words.forEach(function(w,k){
      w.classList.toggle('on', k === i);
      w.setAttribute('aria-current', k === i ? 'true' : 'false');
    });
    panes.forEach(function(p,k){ p.classList.toggle('on', k === i); });
    if (line) line.style.transform = 'translateY(' + (i * 100) + '%)';
  }
  var io = new IntersectionObserver(function(es){
    es.forEach(function(e){
      if (e.isIntersecting) set(panes.indexOf(e.target));
    });
  }, { rootMargin: '-40% 0px -45% 0px', threshold: 0 });
  panes.forEach(function(p){ io.observe(p); });
  words.forEach(function(w,i){
    w.addEventListener('click', function(){
      set(i);
      panes[i].scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
  set(0);
})();

/* ---- stories: expanding photo slats ---- */
(function(){
  var slats = [].slice.call(document.querySelectorAll('.act'));
  if (!slats.length) return;
  var fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  function open(i){ slats.forEach(function(s,k){ s.classList.toggle('on', k === i); }); }
  slats.forEach(function(s,i){
    s.addEventListener('click', function(){ open(i); });
    s.addEventListener('focus', function(){ open(i); });
    if (fine) s.addEventListener('mouseenter', function(){ open(i); });
  });
})();

/* ---- join: "how much time do you have" picker ---- */
(function(){
  var opts  = [].slice.call(document.querySelectorAll('.pk-opt'));
  var cards = [].slice.call(document.querySelectorAll('.pk-card'));
  var thumb = document.querySelector('.pk-thumb');
  if (!opts.length) return;
  function move(){
    var a = opts.filter(function(o){ return o.classList.contains('on'); })[0];
    if (!a || !thumb) return;
    thumb.style.width = a.offsetWidth + 'px';
    thumb.style.transform = 'translateX(' + (a.offsetLeft - 5) + 'px)';
  }
  function set(i){
    opts.forEach(function(o,k){
      o.classList.toggle('on', k === i);
      o.setAttribute('aria-selected', k === i ? 'true' : 'false');
    });
    cards.forEach(function(c,k){ c.classList.toggle('on', k === i); });
    move();
  }
  opts.forEach(function(o,i){ o.addEventListener('click', function(){ set(i); }); });
  window.addEventListener('resize', move);
  window.addEventListener('load', move);
  document.querySelectorAll('.langbtn').forEach(function(b){
    b.addEventListener('click', function(){ setTimeout(move, 60); });
  });
  set(0);
})();

/* ---- support: share toolkit ---- */
(function(){
  var kit = document.querySelector('.sharekit');
  if (!kit) return;
  var toast = kit.querySelector('.sk-toast');
  var cfg = window.ASM_CONFIG || {};
  var url = cfg.site || location.origin + location.pathname;

  function msg(){
    var p = document.getElementById('skText');
    if (!p) return '';
    var vn = document.body.classList.contains('lang-vn');
    var s = p.querySelector(vn ? '.vn' : '.en');
    return (s ? s.textContent : p.textContent).trim();
  }
  function say(en, vn){
    if (!toast) return;
    toast.textContent = document.body.classList.contains('lang-vn') ? vn : en;
    toast.classList.add('on');
    clearTimeout(toast._t);
    toast._t = setTimeout(function(){ toast.classList.remove('on'); }, 2200);
  }
  function copy(text, en, vn){
    var done = function(){ say(en, vn); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, fallback);
    } else fallback();
    function fallback(){
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly','');
      ta.style.cssText = 'position:fixed;top:-9999px';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch(e){}
      document.body.removeChild(ta);
    }
  }

  kit.querySelectorAll('.sk-copy').forEach(function(b){
    b.addEventListener('click', function(){
      if (b.dataset.copy === 'link') copy(url, 'Link copied', 'Đã sao chép liên kết');
      else copy(msg() + ' ' + url, 'Message copied', 'Đã sao chép tin nhắn');
    });
  });

  function links(){
    var t = encodeURIComponent(msg());
    var u = encodeURIComponent(url);
    var map = {
      whatsapp: 'https://wa.me/?text=' + t + '%20' + u,
      facebook: 'https://www.facebook.com/sharer/sharer.php?u=' + u,
      telegram: 'https://t.me/share/url?url=' + u + '&text=' + t,
      mail:     'mailto:?subject=' + encodeURIComponent('Anh Sơn Movement') +
                '&body=' + t + '%0A%0A' + u
    };
    kit.querySelectorAll('.sk-btn[data-net]').forEach(function(a){
      a.setAttribute('href', map[a.dataset.net] || '#');
    });
  }
  links();
  document.querySelectorAll('.langbtn').forEach(function(b){
    b.addEventListener('click', function(){ setTimeout(links, 60); });
  });

  var nat = kit.querySelector('.sk-native');
  if (nat && navigator.share) {
    nat.hidden = false;
    nat.addEventListener('click', function(){
      navigator.share({ title: 'Anh Sơn Movement', text: msg(), url: url })
        .catch(function(){});
    });
  }

  /* any "Share it now" button anywhere jumps to the toolkit */
  document.querySelectorAll('[data-sharenow]').forEach(function(b){
    b.addEventListener('click', function(){
      if (typeof showView === 'function') showView('support');
      setTimeout(function(){
        kit.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 120);
    });
  });
})();

/* ---- nominate: live form progress + character counter ---- */
(function(){
  var form = document.getElementById('nomform');
  var ring = document.querySelector('.fprog');
  if (!form || !ring) return;
  var fg  = ring.querySelector('.fp-fg');
  var txt = ring.querySelector('.fp-txt b');
  var LEN = 2 * Math.PI * 19;
  var fields = ['situationType','about','city','note','reach'];

  function score(){
    var n = 0;
    fields.forEach(function(k){
      var el = form.elements[k];
      if (el && String(el.value).trim()) n++;
    });
    return Math.round(n / fields.length * 100);
  }
  function paint(){
    var p = score();
    if (fg) fg.style.strokeDashoffset = LEN * (1 - p / 100);
    if (txt) txt.textContent = p;
    ring.classList.toggle('done', p === 100);
    fields.forEach(function(k){
      var el = form.elements[k];
      if (!el) return;
      var lab = el.closest('label');
      if (lab) lab.classList.toggle('filled', !!String(el.value).trim());
    });
  }
  form.addEventListener('input', paint);
  form.addEventListener('change', paint);

  var note = form.elements['note'];
  var left = document.querySelector('.chleft');
  if (note && left) {
    var b = left.querySelector('b');
    var max = parseInt(note.getAttribute('maxlength'), 10) || 300;
    note.addEventListener('input', function(){
      var r = max - note.value.length;
      b.textContent = r;
      left.classList.toggle('low', r < 40);
    });
  }
  paint();
})();

/* ═══════════════════════════════════════════════════════════════════
   FEEDBACK PASS · values band · quote carousel · thank-you · leads
   ═══════════════════════════════════════════════════════════════════ */

/* ---- the three promises: auto-rotating, hover-pinned, tap to open ---- */
(function(){
  var band  = document.querySelector('.pvals');
  if (!band) return;
  var cards = [].slice.call(band.querySelectorAll('.pv-card'));
  var detail = band.querySelector('.pv-detail');
  if (!cards.length) return;
  var cur = 0, timer = null, DWELL = 5500;

  function paintDetail(){
    if (!detail) return;
    var body = cards[cur].querySelector('.pv-body');
    if (body) detail.innerHTML = body.innerHTML;
  }
  function select(i, stop){
    cur = (i + cards.length) % cards.length;
    cards.forEach(function(c, k){
      var on = k === cur;
      c.classList.toggle('on', on);
      c.setAttribute('aria-expanded', on ? 'true' : 'false');
      if (on){ /* restart the fill animation */
        var bar = c.querySelector('.pv-bar i');
        if (bar){ bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = ''; }
      }
    });
    paintDetail();
    if (stop) pause(); else play();
  }
  function play(){ clearInterval(timer); band.classList.remove('paused');
                   timer = setInterval(function(){ select(cur + 1); }, DWELL); }
  function pause(){ clearInterval(timer); timer = null; band.classList.add('paused'); }

  cards.forEach(function(c, i){
    c.addEventListener('click', function(){
      /* second tap on the open one goes to the full Values page */
      if (c.classList.contains('on') && typeof showView === 'function') showView('values');
      else select(i, true);
    });
    c.addEventListener('mouseenter', function(){ select(i, true); });
    c.addEventListener('focus', function(){ select(i, true); });
  });
  band.addEventListener('mouseleave', play);
  band.addEventListener('keydown', function(e){
    if (e.key === 'ArrowRight'){ e.preventDefault(); select(cur + 1, true); cards[cur].focus(); }
    if (e.key === 'ArrowLeft'){ e.preventDefault(); select(cur - 1, true); cards[cur].focus(); }
  });
  /* the detail panel is cloned markup, so re-clone when the language flips */
  document.querySelectorAll('.langbtn').forEach(function(b){
    b.addEventListener('click', function(){ setTimeout(paintDetail, 60); });
  });
  /* only spend cycles while the band is actually on screen */
  if ('IntersectionObserver' in window){
    new IntersectionObserver(function(es){
      es.forEach(function(e){ e.isIntersecting ? play() : pause(); });
    }, {threshold: .2}).observe(band);
  }
  select(0);
})();

/* ---- quote carousel ---- */
(function(){
  var car = document.querySelector('.qcar');
  if (!car) return;
  var slides = [].slice.call(car.querySelectorAll('.qc-slide'));
  var dots   = [].slice.call(car.querySelectorAll('.qc-dot'));
  var bar    = car.querySelector('.qc-bar i');
  if (slides.length < 2) return;
  var cur = 0, timer = null, DWELL = 7000;

  function select(i, stop){
    cur = (i + slides.length) % slides.length;
    slides.forEach(function(s, k){ s.classList.toggle('on', k === cur); });
    dots.forEach(function(d, k){
      d.classList.toggle('on', k === cur);
      d.setAttribute('aria-current', k === cur ? 'true' : 'false');
    });
    if (bar){ bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = ''; }
    if (stop) pause(); else play();
  }
  function play(){ clearInterval(timer); car.classList.remove('paused');
                   timer = setInterval(function(){ select(cur + 1); }, DWELL); }
  function pause(){ clearInterval(timer); timer = null; car.classList.add('paused'); }

  dots.forEach(function(d, i){ d.addEventListener('click', function(){ select(i, true); }); });
  car.querySelectorAll('.qc-arrow').forEach(function(a){
    a.addEventListener('click', function(){ select(cur + (+a.dataset.step), true); });
  });
  car.addEventListener('mouseenter', pause);
  car.addEventListener('mouseleave', play);

  /* swipe on touch */
  var x0 = null;
  car.addEventListener('touchstart', function(e){ x0 = e.touches[0].clientX; pause(); }, {passive:true});
  car.addEventListener('touchend', function(e){
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 45) select(cur + (dx < 0 ? 1 : -1), true); else play();
  }, {passive:true});

  if ('IntersectionObserver' in window){
    new IntersectionObserver(function(es){
      es.forEach(function(e){ e.isIntersecting ? play() : pause(); });
    }, {threshold: .25}).observe(car);
  }
  select(0);
})();

/* ---- 2.4s thank-you before every follow hand-off ---- */
(function(){
  var ovl = document.getElementById('fovl');
  if (!ovl) return;
  var HOLD = 2400, sent = false, target = '', t1 = null, opener = null;

  function go(){
    if (sent) return; sent = true;
    clearTimeout(t1);
    close();
    if (!target) return;
    /* Safari and most mobile browsers block window.open outside a user gesture,
       and a 2.4s timer is outside one. They return null and nothing happens.
       Fall back to navigating this tab, which is never blocked (and on phones
       it also hands off to the Instagram app properly). */
    var w = null;
    try { w = window.open(target, '_blank'); } catch (e) {}
    if (w) { try { w.opener = null; } catch (e) {} }   /* same safety as noopener */
    else { window.location.href = target; }            /* genuinely blocked */
  }
  function close(){
    ovl.hidden = true;
    document.body.classList.remove('noscroll');
    if (opener && opener.focus) opener.focus();
  }
  function open(url, from){
    target = url; sent = false; opener = from || null;
    ovl.hidden = false;
    document.body.classList.add('noscroll');
    var bar = ovl.querySelector('.fo-bar i');
    if (bar){ bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = ''; }
    var skip = ovl.querySelector('.fo-skip');
    if (skip){ skip.setAttribute('href', url); skip.focus(); }
    clearTimeout(t1); t1 = setTimeout(go, HOLD);
  }
  /* the skip link navigates by itself — just tidy up the overlay behind it */
  ovl.querySelector('.fo-skip').addEventListener('click', function(){
    sent = true; clearTimeout(t1); close();
  });
  ovl.addEventListener('click', function(e){ if (e.target === ovl) go(); });
  document.addEventListener('keydown', function(e){
    if (!ovl.hidden && (e.key === 'Escape' || e.key === 'Enter')) go();
  });

  /* delegated: catches follow buttons that are added or re-labelled later */
  document.addEventListener('click', function(e){
    var a = e.target.closest && e.target.closest('[data-follow]');
    if (!a) return;
    var url = a.getAttribute('href');
    if (!url || url === '#' || url.charAt(0) === '#') return;  /* not configured yet */
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return; /* let power users through */
    e.preventDefault();
    open(url, a);
  }, true);
})();

/* ---- nominate: swap the form for the thank-you screen ---- */
(function(){
  var form = document.getElementById('nomform');
  var panel = document.getElementById('nomthanks');
  if (!form || !panel) return;

  function show(){
    form.hidden = true; panel.hidden = false;
    var ring = panel.querySelector('.th-check');
    if (ring){ ring.style.animation = 'none'; void ring.offsetWidth; ring.style.animation = ''; }
    panel.scrollIntoView({behavior:'smooth', block:'center'});
  }
  function reset(){
    panel.hidden = true; form.hidden = false;
    form.reset();
    form.dispatchEvent(new Event('input', {bubbles:true}));
    var m = document.getElementById('nommsg');
    if (m){ m.className = 'formmsg'; m.innerHTML = ''; }
    if (typeof asmPlaceholders === 'function') asmPlaceholders();
    form.scrollIntoView({behavior:'smooth', block:'start'});
  }
  panel.querySelector('.th-again').addEventListener('click', reset);

  /* the original handler writes .formmsg.ok — watch for it rather than re-wiring fetch */
  var msg = document.getElementById('nommsg');
  if (!msg) return;
  new MutationObserver(function(){
    if (msg.classList.contains('ok')) show();
  }).observe(msg, {attributes:true, attributeFilter:['class']});
})();

/* ---- newsletter / lead capture ---- */
(function(){
  var forms = [].slice.call(document.querySelectorAll('form[data-lead]'));
  if (!forms.length) return;

  forms.forEach(function(f){
    var msg  = f.querySelector('.lc-msg');
    var done = f.querySelector('.lc-done');
    var btn  = f.querySelector('.lc-submit');

    function say(kind, en, vn){
      if (!msg) return;
      msg.className = 'formmsg lc-msg on ' + kind;
      msg.innerHTML = '<span class="en">' + en + '</span><span class="vn">' + vn + '</span>';
    }

    f.addEventListener('submit', function(e){
      e.preventDefault();
      if (f.website && f.website.value) return;            /* honeypot */

      var email = (f.email.value || '').trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)){
        say('err', 'Please enter a valid email address.',
                   'Vui lòng nhập một địa chỉ email hợp lệ.');
        f.email.focus(); return;
      }
      if (!f.consent.checked){
        say('err', 'Please tick the box so we know we may email you.',
                   'Vui lòng đánh dấu ô để chúng tôi biết được phép gửi email cho bạn.');
        f.consent.focus(); return;
      }

      var interests = [].slice.call(f.querySelectorAll('input[name=interests]:checked'))
                        .map(function(i){ return i.value; });
      var old = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<span class="en">Signing you up…</span><span class="vn">Đang đăng ký…</span>';

      var lang = (typeof asmLang === 'function' ? asmLang() : 'en');
      var nm    = (f.elements['name'] && f.elements['name'].value) || '';
      var place = (f.elements['place'] && f.elements['place'].value) || '';
      var LBL = { newsletter:'Monthly update', volunteer:'Wants to help / volunteer',
                  partner:'Partnership or organisation', stories:'Wants to share a story' };
      var wants = interests.map(function(k){ return LBL[k] || k; }).join(', ')
                  || LBL.newsletter;

      asmSend('/api/subscribe',
        { email: email, name: nm, place: place, interests: interests,
          consent: true, source: f.dataset.source || 'site', lang: lang },
        { subject: 'New subscriber' + (place ? ' - ' + place : ''),
          replyto: email,
          'Email': email,
          'Name': nm || '-',
          'Where': place || '-',
          'Wants to hear about': wants,
          'Language': lang === 'vn' ? 'Vietnamese' : 'English',
          'Signed up from': f.dataset.source || 'site',
          'Consent': 'Yes - explicit opt-in on the website',
          'Consent given at': new Date().toISOString() })
      .then(function(){
        f.classList.add('sent');
        if (done) done.hidden = false;
      })
      .catch(function(err){
        var why = (err && err.message && err.message !== 'failed')
          ? ' <span class="errwhy">(' + String(err.message).slice(0,120) + ')</span>' : '';
        say('err',
          'Something went wrong on our side. Write to <a href="mailto:hello@anhsonmovement.org">hello@anhsonmovement.org</a> and we will add you by hand.' + why,
          'Có lỗi từ phía chúng tôi. Hãy viết tới <a href="mailto:hello@anhsonmovement.org">hello@anhsonmovement.org</a> và chúng tôi sẽ thêm bạn thủ công.' + why);
      })
      .then(function(){ btn.disabled = false; btn.innerHTML = old; });
    });
  });
})();

/* ---- Instagram feed ----
   Pulls the account's own posts through /api/instagram and renders them in our
   own markup, which is the only reason reels can autoplay at all: an Instagram
   embed is a cross-origin iframe we cannot control. Videos play muted (browsers
   never allow sound without a gesture) and only while on screen, otherwise a
   phone would be decoding four videos at once. */
(function(){
  var rail = document.getElementById('igRail');
  if (!rail) return;
  var C = window.ASM_CONFIG || {};
  var PROFILE = C.instagram || '';

  /* Shown when the feed cannot be reached, so the band is never an empty hole.
     These are our own files, already on the site. */
  var FALLBACK = [
    { image:'assets/moment-poster.jpg', video:'assets/moment.mp4', isReel:true,
      caption:'A moment of kindness, in Vietnam.' },
    { image:'assets/clip1-poster.jpg',  video:'assets/clip1.mp4',  isReel:true,
      caption:'Cooking for someone else.' },
    { image:'assets/children-joy.jpg',  video:'', isReel:false,
      caption:'Nobody walks alone.' },
    { image:'assets/clip2-poster.jpg',  video:'assets/clip2.mp4',  isReel:true,
      caption:'Nobody waits alone.' }
  ];

  var PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';

  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];
    });
  }

  function tile(p){
    var href = p.permalink || PROFILE || '#';
    var a = document.createElement('a');
    a.className = 'ig-tile';
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener';
    a.setAttribute('aria-label',
      (p.caption ? p.caption.slice(0, 80) : 'Instagram post') + ' (opens Instagram)');
    var html = '';
    if (p.image) html += '<img src="' + esc(p.image) + '" loading="lazy" decoding="async" alt="">';
    if (p.video){
      /* muted + playsinline are what make autoplay legal; preload none so four
         tiles do not pull four videos before anyone scrolls to them */
      html += '<video muted loop playsinline preload="none" ' +
              'poster="' + esc(p.image) + '" src="' + esc(p.video) + '"></video>';
    }
    html += '<span class="ig-veil"></span>';
    if (p.video || p.isReel) html += '<span class="ig-badge">' + PLAY + '</span>';
    if (p.caption) html += '<span class="ig-cap">' + esc(p.caption) + '</span>';
    html += '<span class="ig-open">' +
            '<span class="en">View on Instagram</span>' +
            '<span class="vn">Xem trên Instagram</span></span>';
    a.innerHTML = html;
    return a;
  }

  var io = null;
  function watchVideos(){
    if (!('IntersectionObserver' in window)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (io) io.disconnect();
    io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        var t = e.target, v = t.querySelector('video');
        if (!v) return;
        if (e.isIntersecting){
          if (t.dataset.vidFailed) return;          /* never retry a dead source */
          var play = v.play();
          if (play && play.catch) play.catch(function(){ /* blocked: poster stays */ });
        } else {
          v.pause();
          t.classList.remove('playing');
        }
      });
    }, { threshold: 0.55 });
    rail.querySelectorAll('.ig-tile').forEach(function(t){
      if (t.querySelector('video')) io.observe(t);
    });
  }

  /* The follow band's photo fan is the same nine faces every visit. When the
     feed is live, repaint it with the newest posts so the band shows what the
     movement is actually doing right now. */
  function paintFan(posts){
    var slats = [].slice.call(document.querySelectorAll('.fan .slat img'));
    if (!slats.length || !posts.length) return;
    var pics = posts.map(function(p){ return p.image; }).filter(Boolean);
    if (!pics.length) return;
    slats.forEach(function(img, i){
      var src = pics[i % pics.length];
      if (!src || img.getAttribute('src') === src) return;
      var probe = new Image();
      probe.onload = function(){ img.src = src; };   /* only swap once it loads */
      probe.src = src;
    });
    var fan = document.querySelector('.fan');
    if (fan) fan.dataset.source = 'instagram';
  }

  function render(posts, live){
    if (live) paintFan(posts);
    rail.innerHTML = '';
    posts.forEach(function(p){
      var t = tile(p);
      var v = t.querySelector('video');
      if (v){
        /* cross-fade only when playback really starts, so a video that cannot be
           decoded leaves the poster showing instead of a black rectangle */
        v.addEventListener('playing', function(){ t.classList.add('playing'); });
        v.addEventListener('error', function(){
          t.dataset.vidFailed = '1';
          t.classList.remove('playing');
          v.remove();
        });
      }
      rail.appendChild(t);
    });
    rail.setAttribute('aria-busy', 'false');
    rail.dataset.source = live ? 'instagram' : 'fallback';
    watchVideos();
  }

  fetch('/api/instagram')
    .then(function(r){ return r.json(); })
    .then(function(d){
      if (d && d.posts && d.posts.length) render(d.posts, true);
      else throw new Error((d && d.error) || 'no posts');
    })
    .catch(function(err){
      /* Not connected yet, token expired, or Instagram is down. The band still
         has to look deliberate, so fall back to our own clips. */
      if (window.console && console.info) console.info('Instagram feed:', err.message);
      render(FALLBACK, false);
    });
})();


/* ============================================================================
   THE GIVING SHEET
   Collects an amount, asks the server for a Stripe Checkout Session, hands the
   person over. No key, no card field and no price decision lives in here.
   ============================================================================ */
(function(){
  var sheet = document.getElementById('gsheet');
  var done  = document.getElementById('gdone');
  if (!sheet || !done) return;

  var C  = function(){ return window.ASM_CONFIG || {}; };
  var G  = function(){ return C().give || {}; };
  var EN = function(){ return !document.body.classList.contains('lang-vn'); };
  var pick = function(en, vn){ return EN() ? en : vn; };

  var SYM = { eur:'€', usd:'$', vnd:'₫' };
  var state = { freq:'once', cur:'eur', amount:null, busy:false };

  /* ---- analytics -----------------------------------------------------------
     Steps and amounts only. Never an email, never a session id, never anything
     that came back from the payment provider. */
  function track(step, extra){
    try {
      var d = { step:step, currency:state.cur, frequency:state.freq };
      if (extra && extra.amount) d.amount = extra.amount;
      if (typeof window.asmTrack === 'function') window.asmTrack('give', d);
      if (typeof window.plausible === 'function') window.plausible('give:' + step, { props:d });
      if (typeof window.gtag === 'function') window.gtag('event', 'give_' + step, d);
    } catch (e) {}
  }

  /* ---- is there a payment route at all -------------------------------------
     'auto' asks the health endpoint once per visit. The answer is remembered
     for the tab so moving between views does not ask again. */
  function markReady(on){
    document.body.classList.toggle('give-open', !!on);
  }
  /* A Stripe account in test mode takes test cards and refuses real ones. If
     the give buttons were visible then, a real visitor would reach a payment
     page their own card cannot pass, which is worse than no button at all.
     So the public sees the ask only once Stripe is live. Add ?givetest=1 to
     any URL to work on it in test mode; that choice sticks for the tab. */
  function testingWanted(){
    try {
      if (/[?&]givetest=1/.test(location.search)) {
        sessionStorage.setItem('asm_give_test', '1');
        return true;
      }
      return sessionStorage.getItem('asm_give_test') === '1';
    } catch (e) {
      return /[?&]givetest=1/.test(location.search);
    }
  }

  function detect(){
    var want = G().ready;
    if (want === true || want === false) { markReady(want); return; }

    var testing = testingWanted();
    var cacheKey = 'asm_give_ready' + (testing ? '_t' : '');
    var cached = null;
    try { cached = sessionStorage.getItem(cacheKey); } catch (e) {}
    if (cached === '1' || cached === '0') { markReady(cached === '1'); return; }

    fetch('/api/checkout?health=1', { headers:{ Accept:'application/json' } })
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(o){
        var wired = !!(o && o.ready);
        var live  = !o || o.mode !== 'test';       /* absent means assume live */
        var on    = wired && (live || testing);
        markReady(on);
        try { sessionStorage.setItem(cacheKey, on ? '1' : '0'); } catch (e) {}
        if (on && o && o.currencies && o.currencies.indexOf('vnd') > -1) enableVnd();
        if (wired && !live && !testing && window.console && console.info) {
          console.info('[asm] Stripe is in test mode, so the give buttons stay ' +
                       'hidden from visitors. Add ?givetest=1 to see them.');
        }
      })
      .catch(function(){ markReady(false); });
  }
  function enableVnd(){
    var b = sheet.querySelector('.gs-c[data-cur="vnd"]');
    if (b) b.hidden = false;
  }

  /* ---- amounts -------------------------------------------------------------- */
  function amountsFor(cur){
    var a = (G().amounts || {})[cur];
    return (a && a.length) ? a : [10, 25, 50, 100];
  }
  function limitsFor(cur){
    var l = (G().limits || {})[cur];
    return l || { min:2, max:5000 };
  }
  function fmt(n, cur){
    if (cur === 'vnd') return SYM.vnd + new Intl.NumberFormat('vi-VN').format(n);
    var whole = Math.round(n) === n;
    return SYM[cur] + new Intl.NumberFormat(EN() ? 'en-IE' : 'vi-VN',
      { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits:2 }).format(n);
  }

  var amtBox = document.getElementById('gsAmts');
  var own    = document.getElementById('gsOwn');
  var goBtn  = document.getElementById('gsGo');
  var goAmt  = document.getElementById('gsGoAmt');
  var errBox = document.getElementById('gsErr');

  function paintAmounts(){
    var list = amountsFor(state.cur);
    amtBox.innerHTML = '';
    list.forEach(function(v){
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'gs-a' + (state.amount === v ? ' on' : '');
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', state.amount === v ? 'true' : 'false');
      b.dataset.amt = v;
      b.textContent = fmt(v, state.cur);
      amtBox.appendChild(b);
    });
    var sym = sheet.querySelector('.gs-sym');
    if (sym) sym.textContent = SYM[state.cur];
    own.setAttribute('inputmode', state.cur === 'vnd' ? 'numeric' : 'decimal');
    paintButton();
  }

  function paintButton(){
    goAmt.textContent = state.amount ? fmt(state.amount, state.cur) : '';
    var t = goBtn.querySelector('.gs-go-t');
    if (t) {
      t.innerHTML = state.freq === 'monthly'
        ? '<span class="en">Give every month</span><span class="vn">Tặng hằng tháng</span>'
        : '<span class="en">Give</span><span class="vn">Tặng</span>';
    }
    goBtn.disabled = state.busy || !state.amount;
  }

  function selectAmount(v, fromOwn){
    state.amount = v;
    [].forEach.call(amtBox.querySelectorAll('.gs-a'), function(b){
      var on = Number(b.dataset.amt) === v;
      b.classList.toggle('on', on);
      b.setAttribute('aria-checked', on ? 'true' : 'false');
    });
    if (!fromOwn) own.value = '';
    hideError();
    paintButton();
  }

  /* "10,50" and "10.50" are the same number to a person. To parseFloat they
     are not, and 10,50 silently becomes 10. */
  function parseOwn(raw){
    var s = String(raw || '').trim();
    if (!s) return null;
    if (state.cur === 'vnd') {
      s = s.replace(/[^\d]/g, '');
      return s ? parseInt(s, 10) : null;
    }
    s = s.replace(/\s/g, '');
    if (s.indexOf(',') > -1 && s.indexOf('.') > -1) {
      /* both present: whichever comes last is the decimal point */
      s = s.lastIndexOf(',') > s.lastIndexOf('.')
        ? s.replace(/\./g, '').replace(',', '.')
        : s.replace(/,/g, '');
    } else {
      /* One separator is ambiguous: a Dutch reader types 1.000 for a thousand
         and an Irish one types 1.000 for one. Three digits after it means a
         thousands separator, which is the convention both share, and the
         button shows the parsed amount so the reading is never a surprise. */
      var one = s.match(/^(\d+)([.,])(\d+)$/);
      if (one) {
        s = one[3].length === 3 ? one[1] + one[3] : one[1] + '.' + one[3];
      } else {
        s = s.replace(/[.,]/g, '');
      }
    }
    var n = parseFloat(s);
    return isFinite(n) ? Math.round(n * 100) / 100 : null;
  }

  /* ---- errors, in a language ------------------------------------------------ */
  function showError(en, vn){
    errBox.innerHTML = '<span class="en">' + en + '</span><span class="vn">' + vn + '</span>';
    errBox.hidden = false;
  }
  function hideError(){ errBox.hidden = true; errBox.textContent = ''; }
  function genericError(){
    showError('Something went wrong on our side and nothing was charged. Please try again, ' +
              'or email hello@anhsonmovement.org and we will sort it out.',
              'Có trục trặc từ phía chúng tôi và chưa có khoản nào bị trừ. ' +
              'Vui lòng thử lại, hoặc gửi email tới hello@anhsonmovement.org.');
  }

  /* ---- opening and closing -------------------------------------------------- */
  var lastFocus = null;
  var FOCUSABLE = 'button:not([disabled]),input,a[href],[tabindex]:not([tabindex="-1"])';

  function open(freq){
    lastFocus = document.activeElement;
    state.freq = (freq === 'monthly') ? 'monthly' : 'once';
    state.amount = state.cur === 'vnd' ? (G().preselectVnd || 500000) : (G().preselect || 25);
    state.busy = false;
    hideError();
    [].forEach.call(sheet.querySelectorAll('.gs-f'), function(b){
      var on = b.dataset.freq === state.freq;
      b.classList.toggle('on', on);
      b.setAttribute('aria-checked', on ? 'true' : 'false');
    });
    paintAmounts();
    sheet.hidden = false;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function(){ sheet.classList.add('on'); });
    var panel = sheet.querySelector('.gs-panel');
    setTimeout(function(){ if (panel) panel.focus(); }, 60);
    track('open', { amount: state.amount });
  }

  function close(){
    sheet.classList.remove('on');
    setTimeout(function(){
      sheet.hidden = true;
      document.body.style.overflow = '';
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }, 260);
  }

  function trap(box, e){
    if (e.key !== 'Tab') return;
    var els = [].filter.call(box.querySelectorAll(FOCUSABLE), function(el){
      return el.offsetParent !== null && !el.hidden;
    });
    if (!els.length) return;
    var first = els[0], last = els[els.length - 1];
    if (e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
  }

  /* ---- wiring --------------------------------------------------------------- */
  document.addEventListener('click', function(e){
    var t = e.target.closest ? e.target.closest('[data-give]') : null;
    if (t){ e.preventDefault(); open(t.getAttribute('data-give')); return; }
    if (e.target.closest && e.target.closest('[data-gs-close]')){ e.preventDefault(); close(); }
  });

  sheet.addEventListener('click', function(e){
    var f = e.target.closest('.gs-f');
    if (f){
      state.freq = f.dataset.freq;
      [].forEach.call(sheet.querySelectorAll('.gs-f'), function(b){
        var on = b === f;
        b.classList.toggle('on', on);
        b.setAttribute('aria-checked', on ? 'true' : 'false');
      });
      hideError(); paintButton();
      track('frequency', { amount: state.amount });
      return;
    }
    var cu = e.target.closest('.gs-c');
    if (cu){
      state.cur = cu.dataset.cur;
      [].forEach.call(sheet.querySelectorAll('.gs-c'), function(b){
        var on = b === cu;
        b.classList.toggle('on', on);
        b.setAttribute('aria-checked', on ? 'true' : 'false');
      });
      /* the old amount means nothing in a new currency */
      state.amount = state.cur === 'vnd' ? (G().preselectVnd || 500000) : (G().preselect || 25);
      own.value = '';
      hideError(); paintAmounts();
      track('currency', { amount: state.amount });
      return;
    }
    var a = e.target.closest('.gs-a');
    if (a){ selectAmount(Number(a.dataset.amt), false); track('amount', { amount: state.amount }); }
  });

  own.addEventListener('input', function(){
    var n = parseOwn(own.value);
    if (n === null){ state.amount = null; paintButton(); return; }
    selectAmount(n, true);
  });
  own.addEventListener('blur', function(){
    if (!own.value.trim()) return;
    var lim = limitsFor(state.cur);
    if (state.amount === null) return;
    if (state.amount < lim.min){
      showError('The smallest gift we can take is ' + fmt(lim.min, state.cur) +
                ', because below that the payment fee is larger than the gift.',
                'Món quà nhỏ nhất chúng tôi có thể nhận là ' + fmt(lim.min, state.cur) +
                ', vì dưới mức đó phí thanh toán còn lớn hơn chính món quà.');
    } else if (state.amount > lim.max){
      showError('The most this page can take at once is ' + fmt(lim.max, state.cur) +
                '. To give more, email hello@anhsonmovement.org and we will arrange a transfer with no card fee.',
                'Mức lớn nhất trang này nhận một lần là ' + fmt(lim.max, state.cur) +
                '. Để tặng nhiều hơn, hãy gửi email tới hello@anhsonmovement.org.');
    }
  });

  document.addEventListener('keydown', function(e){
    if (!sheet.hidden){
      if (e.key === 'Escape'){ close(); return; }
      trap(sheet.querySelector('.gs-panel'), e);
    } else if (!done.hidden){
      if (e.key === 'Escape'){ closeDone(); return; }
      trap(done.querySelector('.gd-panel'), e);
    }
  });

  /* ---- handing over --------------------------------------------------------- */
  goBtn.addEventListener('click', function(){
    if (state.busy || !state.amount) return;
    var lim = limitsFor(state.cur);
    if (state.amount < lim.min || state.amount > lim.max){ own.blur(); return; }

    state.busy = true;
    goBtn.disabled = true;
    var was = goBtn.innerHTML;
    goBtn.innerHTML = '<span class="en">Opening secure checkout…</span>' +
                      '<span class="vn">Đang mở trang thanh toán an toàn…</span>';
    hideError();
    track('submit', { amount: state.amount });

    fetch('/api/checkout', {
      method:'POST',
      headers:{ 'Content-Type':'application/json', Accept:'application/json' },
      body: JSON.stringify({
        amount: state.amount,
        currency: state.cur,
        frequency: state.freq,
        lang: EN() ? 'en' : 'vn',
        source: (location.hash || '').replace('#','') || 'site',
        name: giverName(),
        anonymous: giverAnonymous(),
      }),
    })
    .then(function(r){ return r.json().catch(function(){ return {}; })
      .then(function(o){ return { ok:r.ok, body:o }; }); })
    .then(function(res){
      if (res.ok && res.body && res.body.url){
        track('redirect', { amount: state.amount });
        window.location.href = res.body.url;
        return;                          /* leaving: do not restore the button */
      }
      /* The server writes these for a person. Anything else gets the generic. */
      if (res.body && res.body.en && res.body.vn) showError(res.body.en, res.body.vn);
      else genericError();
      track('error', { amount: state.amount });
      state.busy = false; goBtn.innerHTML = was; paintButton();
    })
    .catch(function(){
      genericError();
      track('error', { amount: state.amount });
      state.busy = false; goBtn.innerHTML = was; paintButton();
    });
  });

  /* ---- coming back from Stripe ----------------------------------------------
     The redirect is not evidence. Ask the server what Stripe says. */
  function closeDone(){
    done.classList.remove('on');
    setTimeout(function(){ done.hidden = true; document.body.style.overflow = ''; }, 260);
  }
  done.addEventListener('click', function(e){
    if (e.target.closest('[data-gd-close]')){ e.preventDefault(); closeDone(); }
  });

  function showDone(kind, title, body, ctas){
    done.className = 'gdone ' + kind;
    done.querySelector('.gd-title').innerHTML = title;
    done.querySelector('.gd-body').innerHTML = body;
    done.querySelector('.gd-cta').innerHTML = ctas || '';
    done.hidden = false;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function(){ done.classList.add('on'); });
    var panel = done.querySelector('.gd-panel');
    setTimeout(function(){ if (panel) panel.focus(); }, 60);
  }

  var FOLLOW_CTA = '<button class="btn gold" data-follow-inline>' +
      '<span class="en">Follow the movement</span><span class="vn">Theo dõi phong trào</span></button>' +
      '<button class="btn ghost" data-gd-close>' +
      '<span class="en">Close</span><span class="vn">Đóng</span></button>';

  function afterReturn(){
    var q = new URLSearchParams(location.search);
    var flag = q.get('give');
    if (!flag) return;
    var sid = q.get('session_id');

    /* Clean the URL first: a refresh must not replay the thank-you, and the
       session id has no business sitting in the address bar or in a referrer. */
    try {
      q.delete('give'); q.delete('session_id');
      var rest = q.toString();
      history.replaceState(null, '', location.pathname + (rest ? '?' + rest : '') + location.hash);
    } catch (e) {}

    if (flag === 'cancelled'){
      showDone('cancelled',
        '<span class="en">Nothing was charged</span><span class="vn">Chưa có khoản nào bị trừ</span>',
        '<span class="en">You stopped before paying, which is completely fine. Following costs nothing and helps more than you would think.</span>' +
        '<span class="vn">Bạn đã dừng trước khi thanh toán, hoàn toàn ổn. Theo dõi không tốn gì và giúp nhiều hơn bạn nghĩ.</span>',
        FOLLOW_CTA);
      track('cancelled');
      return;
    }
    if (flag !== 'thanks' || !sid) return;

    verify(sid, 0);
  }

  function verify(sid, attempt){
    fetch('/api/give-status?session_id=' + encodeURIComponent(sid), { headers:{ Accept:'application/json' } })
      .then(function(r){ return r.json(); })
      .then(function(o){
        if (o.state === 'paid'){
          var amt = o.amount ? fmt(o.amount, o.currency) : '';
          var monthly = o.frequency === 'monthly';
          showDone('paid',
            '<span class="en">Thank you. Truly.</span><span class="vn">Cảm ơn bạn. Thật lòng.</span>',
            '<span class="en">' + (amt ? amt + ' ' : '') +
              (monthly ? 'will go out every month and buys' : 'buys') +
              ' meals, warm clothes, blankets or school things, handed over by Sơn and the team. ' +
              'We publish what came in and what it bought every quarter.' +
              (monthly ? ' One email to hello@anhsonmovement.org stops it whenever you want.' : '') +
            '</span>' +
            '<span class="vn">' + (amt ? amt + ' ' : '') +
              (monthly ? 'sẽ được trừ mỗi tháng và mua' : 'mua') +
              ' bữa ăn, áo ấm, chăn hoặc đồ dùng học tập, do Sơn và đội ngũ trao tận tay. ' +
              'Mỗi quý chúng tôi công bố nhận được bao nhiêu và mua được gì.' +
              (monthly ? ' Một email tới hello@anhsonmovement.org là dừng bất cứ lúc nào.' : '') +
            '</span>',
            FOLLOW_CTA);
          track('thanks');
          return;
        }
        if ((o.state === 'pending' || o.state === 'processing') && attempt < 3){
          setTimeout(function(){ verify(sid, attempt + 1); }, 1800);
          return;
        }
        if (o.state === 'pending' || o.state === 'processing'){
          showDone('pending',
            '<span class="en">On its way</span><span class="vn">Đang trên đường</span>',
            '<span class="en">Your bank is still confirming this one. That is normal for iDEAL and bank transfers and it usually takes a few minutes. You will get a receipt by email when it lands.</span>' +
            '<span class="vn">Ngân hàng của bạn vẫn đang xác nhận. Điều này bình thường với iDEAL và chuyển khoản, thường mất vài phút. Bạn sẽ nhận biên nhận qua email khi xong.</span>',
            FOLLOW_CTA);
          track('pending');
          return;
        }
        /* expired or unknown: say what is true without guessing */
        showDone('failed',
          '<span class="en">We could not confirm that one</span><span class="vn">Chúng tôi chưa xác nhận được</span>',
          '<span class="en">If money left your account you will have a receipt from Stripe. Send it to hello@anhsonmovement.org and we will check it the same day.</span>' +
          '<span class="vn">Nếu tiền đã rời tài khoản của bạn, bạn sẽ có biên nhận từ Stripe. Hãy gửi tới hello@anhsonmovement.org và chúng tôi sẽ kiểm tra ngay trong ngày.</span>',
          FOLLOW_CTA);
        track('unconfirmed');
      })
      .catch(function(){
        showDone('failed',
          '<span class="en">We could not reach the payment provider</span><span class="vn">Không liên hệ được nhà cung cấp thanh toán</span>',
          '<span class="en">Your gift may well have gone through. Check your email for a receipt, and write to hello@anhsonmovement.org if anything looks wrong.</span>' +
          '<span class="vn">Món quà của bạn rất có thể đã thành công. Hãy kiểm tra email để xem biên nhận, và viết cho hello@anhsonmovement.org nếu có gì không đúng.</span>',
          FOLLOW_CTA);
        track('unconfirmed');
      });
  }

  /* the follow button inside the thank-you reuses the site's own hand-off */
  done.addEventListener('click', function(e){
    if (!e.target.closest('[data-follow-inline]')) return;
    e.preventDefault();
    closeDone();
    /* two follow controls live in the header now, one per give state, so pick
       whichever is actually on screen */
    var real = [].slice.call(document.querySelectorAll('[data-follow]'))
                 .filter(function(e){ return e.offsetParent !== null; })[0] ||
               document.querySelector('[data-follow]');
    if (real) setTimeout(function(){ real.click(); }, 280);
  });

  detect();
  if (G().vnd === true) enableVnd();
  afterReturn();
})();


/* ============================================================================
   GIVING FIRST
   The sticky bar on phones, the currency the visitor most likely uses, and
   the #give link so the ask can be opened straight from a bio or a story.
   ============================================================================ */
(function(){
  var sheet = document.getElementById('gsheet');
  var bar   = document.getElementById('givebar');
  if (!sheet) return;

  /* ---- the sticky bar ------------------------------------------------------
     It appears once the hero is behind you and steps aside whenever the ask is
     already on screen: on the give page, while the sheet is open, or when the
     give band itself is in view. A bar that repeats what you are looking at is
     just clutter over the content. */
  if (bar) {
    var heroSeen = false, bandSeen = false;
    function paint(){
      var open = !sheet.hidden ||
                 (document.getElementById('gdone') && !document.getElementById('gdone').hidden);
      document.body.classList.toggle('sheet-open', !!open);
      var want = heroSeen && !bandSeen && !open;
      bar.classList.toggle('show', want);
      document.body.classList.toggle('gb-on', want);
      bar.setAttribute('aria-hidden', want ? 'false' : 'true');
    }

    var hero = document.querySelector('.hero') || document.querySelector('.herowrap') ||
               document.querySelector('.view.show .cta');
    if (hero && 'IntersectionObserver' in window) {
      new IntersectionObserver(function(es){
        heroSeen = !es[0].isIntersecting; paint();
      }, { threshold: 0 }).observe(hero);
    } else {
      /* no observer: fall back to a plain scroll threshold */
      window.addEventListener('scroll', function(){
        heroSeen = window.scrollY > 520; paint();
      }, { passive: true });
    }

    /* "the ask is already on screen" is better answered by looking for a give
       button in the viewport than by watching one band: the band is taller
       than a phone screen, so a percentage threshold reads as visible long
       before the button itself is. */
    function askOnScreen(){
      var els = document.querySelectorAll('.view.show [data-give]');
      for (var i = 0; i < els.length; i++) {
        var e = els[i];
        if (e.offsetParent === null) continue;
        var r = e.getBoundingClientRect();
        if (r.bottom > 0 && r.top < innerHeight) return true;
      }
      return false;
    }
    var ticking = false;
    function onScroll(){
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function(){
        ticking = false;
        bandSeen = askOnScreen();
        paint();
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    document.addEventListener('click', function(){ setTimeout(onScroll, 60); }, true);
    onScroll();

    /* the sheet opening and closing changes nothing in the DOM the observers
       watch, so watch the sheet itself */
    if ('MutationObserver' in window) {
      new MutationObserver(paint).observe(sheet, { attributes: true, attributeFilter: ['hidden'] });
      var gd = document.getElementById('gdone');
      if (gd) new MutationObserver(paint).observe(gd, { attributes: true, attributeFilter: ['hidden'] });
    }
    paint();
  }

  /* ---- the currency someone probably thinks in -----------------------------
     A Vietnamese visitor should not have to convert euros in their head, and a
     visitor in the States should not be asked for a currency they do not hold.
     This only preselects; the buttons stay there and the server decides what
     it will actually accept. */
  function guessCurrency(){
    var tz = '', loc = '';
    try { tz = (Intl.DateTimeFormat().resolvedOptions().timeZone || '').toLowerCase(); } catch (e) {}
    try { loc = (navigator.language || '').toLowerCase(); } catch (e) {}
    var langs = [];
    try { langs = (navigator.languages || []).join(',').toLowerCase(); } catch (e) {}

    if (tz.indexOf('ho_chi_minh') > -1 || tz.indexOf('saigon') > -1 ||
        loc.indexOf('vi') === 0 || langs.indexOf('vi-') > -1) return 'vnd';
    if (/^en-(us|ph)/.test(loc) || tz.indexOf('america/') === 0) return 'usd';
    return 'eur';
  }

  function preselectCurrency(){
    var want = guessCurrency();
    var btn = sheet.querySelector('.gs-c[data-cur="' + want + '"]');
    /* a hidden button means the server does not offer that currency */
    if (!btn || btn.hidden) return;
    if (btn.classList.contains('on')) return;
    btn.click();
  }

  /* ---- opening the ask from a link -----------------------------------------
     anhsonmovement.org/#give works from an Instagram bio, a story sticker or a
     printed QR code, and lands people straight on the amounts. */
  function openFromHash(){
    if ((location.hash || '').toLowerCase().indexOf('#give') !== 0) return;
    if (!document.body.classList.contains('give-open')) return;
    var opener = document.querySelector('.give-cta[data-give]');
    if (!opener) return;
    var monthly = /monthly|maand/i.test(location.hash);
    setTimeout(function(){
      opener.click();
      if (monthly) {
        var m = sheet.querySelector('.gs-f[data-freq="monthly"]');
        if (m) m.click();
      }
      preselectCurrency();
    }, 420);
  }

  /* every opening of the sheet starts on the likely currency */
  document.addEventListener('click', function(e){
    if (!e.target.closest || !e.target.closest('[data-give]')) return;
    setTimeout(preselectCurrency, 60);
  }, true);

  window.addEventListener('hashchange', openFromHash);
  /* the give controls only appear after the health check answers, so wait */
  var tries = 0;
  (function waitForGive(){
    if (document.body.classList.contains('give-open')) { openFromHash(); return; }
    if (++tries > 20) return;
    setTimeout(waitForGive, 250);
  })();
})();


/* ============================================================================
   THE STORIES
   Eight people the movement has already published, matched back to their own
   Instagram post by a phrase from the caption. The quote and the translation
   live in ASM_CONFIG; the photograph and the link come from the live feed, so
   a card can never point at something that is no longer there.
   ============================================================================ */
(function(){
  var grid = document.getElementById('stGrid');
  if (!grid) return;
  var C = window.ASM_CONFIG || {};
  var LIST = C.stories || [];
  var PROFILE = C.instagram || '';
  if (!LIST.length){ grid.remove(); return; }

  var PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
  var BACK = '<svg viewBox="0 0 24 24" aria-hidden="true">' +
             '<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 6 6v5"/></svg>';

  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"]/g, function(ch){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch];
    });
  }

  /* Captions carry combining accents and odd whitespace depending on the phone
     they were typed on, so compare on a normalised, case-folded copy. Without
     this a perfectly correct phrase can fail to match its own post. */
  function norm(s){
    s = String(s == null ? '' : s);
    if (s.normalize) s = s.normalize('NFC');
    return s.replace(/\s+/g, ' ').toLowerCase();
  }

  function findPost(posts, phrase){
    if (!phrase) return null;
    var needle = norm(phrase);
    for (var i = 0; i < posts.length; i++){
      if (norm(posts[i].caption).indexOf(needle) > -1) return posts[i];
    }
    return null;
  }

  function pair(o, cls){
    if (!o) return '';
    return '<span class="en ' + cls + '">' + esc(o.en) + '</span>' +
           '<span class="vn ' + cls + '">' + esc(o.vn) + '</span>';
  }

  function card(s, post, backPost){
    var art = document.createElement('article');
    art.className = 'st-card';
    art.setAttribute('data-story', s.id);

    var href = (post && post.permalink) || PROFILE || '';
    var html = '';

    /* No picture is better than a broken one: when the post has scrolled out of
       the window the feed returns, the card keeps the words and drops the frame. */
    if (post && post.image){
      /* The badge is a SIBLING of the picture link, never a child of it. An
         anchor inside an anchor is invalid, and the browser resolves it by
         closing the outer one early — which threw the badge clean out of the
         card the first time this was built. */
      html += '<div class="st-frame">' +
              '<a class="st-media" href="' + esc(href) + '" target="_blank" rel="noopener"' +
              ' aria-label="' + esc((s.quote || s.line || {}).en || 'Open on Instagram') + '">' +
              '<img src="' + esc(post.image) + '" loading="lazy" decoding="async" alt="">' +
              '<span class="st-veil"></span>' +
              '<span class="st-watch">' + PLAY +
              '<span class="en">Watch the story</span><span class="vn">Xem câu chuyện</span></span>' +
              '</a>';
      if (backPost && backPost.permalink){
        html += '<a class="st-back" href="' + esc(backPost.permalink) + '" target="_blank" rel="noopener">' +
                BACK +
                '<span class="en">We came back</span><span class="vn">Đã quay lại</span></a>';
      }
      html += '</div>';
    }

    html += '<div class="st-body">';

    var words = s.quote || s.line;
    if (words){
      html += '<blockquote class="st-quote">' +
              '<p class="q-vn">' + (s.quote ? '“' : '') + esc(words.vn) + (s.quote ? '”' : '') + '</p>' +
              '<p class="q-en en">' + (s.quote ? '“' : '') + esc(words.en) + (s.quote ? '”' : '') + '</p>' +
              '</blockquote>';
    }
    if (s.who) html += '<p class="st-who">' + pair(s.who, 'w') + '</p>';

    if (s.need){
      html += '<div class="st-need">' +
              '<span class="st-need-l"><span class="en">What would help</span>' +
              '<span class="vn">Điều gì sẽ giúp được</span></span>' +
              '<p>' + pair(s.need, 'n') + '</p>';
      if (s.cost){
        html += '<span class="st-cost">' + pair(s.cost, 'c') + '</span>';
      }
      html += '</div>';
    }

    html += '<div class="st-act">' +
            '<button class="btn gold give-cta" data-give="story:' + esc(s.id) + '"' +
            (s.cost ? ' data-give-amount="' + esc(s.costAmount || '') + '"' : '') + '>' +
            '<span class="en">Give for this</span><span class="vn">Đóng góp cho việc này</span></button>';
    if (!post && href){
      html += '<a class="btn ghost" href="' + esc(href) + '" target="_blank" rel="noopener">' +
              '<span class="en">Instagram</span><span class="vn">Instagram</span></a>';
    }
    html += '</div></div>';

    art.innerHTML = html;

    /* Instagram signs its media URLs and they expire. A dead link would leave a
       navy rectangle sitting where a face should be, which reads worse than no
       picture at all — so if the image never arrives, the frame goes with it. */
    var img = art.querySelector('.st-media img');
    if (img){
      img.addEventListener('error', function(){
        var frame = art.querySelector('.st-frame');
        if (frame) frame.remove();
      });
    }
    return art;
  }

  function paint(posts){
    posts = posts || [];
    var frag = document.createDocumentFragment();
    var shown = 0;
    LIST.forEach(function(s){
      var post = findPost(posts, s.match);
      var backPost = s.back ? findPost(posts, s.back) : null;
      frag.appendChild(card(s, post, backPost));
      shown++;
    });
    grid.innerHTML = '';
    grid.appendChild(frag);
    grid.setAttribute('aria-busy', 'false');
    if (!shown) grid.remove();
  }

  var url = '/api/instagram?limit=' + encodeURIComponent(C.storyFeedLimit || 25);
  fetch(url, { headers: { Accept: 'application/json' } })
    .then(function(r){ return r.ok ? r.json() : null; })
    .then(function(d){ paint(d && d.posts); })
    .catch(function(){ paint([]); });   /* words without pictures still work */
})();


/* ============================================================================
   REACH
   Follower counts per channel, each labelled with where the figure came from.
   A number a person typed never gets to look like a number a platform reported.
   ============================================================================ */
(function(){
  var grid = document.getElementById('rchGrid');
  var note = document.getElementById('rchNote');
  if (!grid) return;

  var LABEL = {
    instagram: { en: 'Instagram', vn: 'Instagram' },
    facebook:  { en: 'Facebook',  vn: 'Facebook'  },
    tiktok:    { en: 'TikTok',    vn: 'TikTok'    }
  };
  var SRC = {
    live:   { cls: 'is-live',   en: 'Live from the platform', vn: 'Trực tiếp từ nền tảng' },
    manual: { cls: 'is-manual', en: 'Counted by the team',    vn: 'Do đội ngũ cập nhật'   },
    off:    { cls: 'is-off',    en: 'Not connected yet',      vn: 'Chưa kết nối'          }
  };

  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"]/g, function(ch){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch];
    });
  }

  function fmt(n){
    try { return new Intl.NumberFormat(document.body.classList.contains('lang-vn') ? 'vi-VN' : 'en-GB').format(n); }
    catch (e){ return String(n); }
  }

  function stat(ch){
    var el = document.createElement('div');
    el.className = 'rch-stat';
    var lab = LABEL[ch.key] || { en: ch.key, vn: ch.key };
    var src = SRC[ch.source] || SRC.off;
    /* An em dash, not a zero. Zero is a claim; a dash is an absence. */
    var n = (ch.followers == null) ? '—' : fmt(ch.followers);
    el.innerHTML =
      '<span class="rch-n">' + esc(n) + '</span>' +
      '<span class="rch-l"><span class="en">' + esc(lab.en) + '</span>' +
      '<span class="vn">' + esc(lab.vn) + '</span></span>' +
      '<span class="rch-s ' + src.cls + '"><span class="en">' + esc(src.en) + '</span>' +
      '<span class="vn">' + esc(src.vn) + '</span></span>';
    return el;
  }

  function paint(d){
    var chans = (d && d.channels) || [];
    /* Nothing to show at all: take the band out rather than print three dashes
       and a promise. An empty counter argues against the site, not for it. */
    var any = chans.some(function(c){ return c.followers != null; });
    if (!any){
      var band = document.getElementById('reach');
      if (band) band.remove();
      return;
    }
    var frag = document.createDocumentFragment();
    chans.forEach(function(c){ frag.appendChild(stat(c)); });
    grid.innerHTML = '';
    grid.appendChild(frag);
    grid.setAttribute('aria-busy', 'false');

    if (note && !d.allLive){
      note.innerHTML =
        '<span class="en">Channels marked “counted by the team” are not read from the platform automatically. ' +
        'Everything marked live is.</span>' +
        '<span class="vn">Những kênh ghi “do đội ngũ cập nhật” không được đọc tự động từ nền tảng. ' +
        'Những kênh ghi trực tiếp thì có.</span>';
    }
  }

  fetch('/api/social', { headers: { Accept: 'application/json' } })
    .then(function(r){ return r.ok ? r.json() : null; })
    .then(paint)
    .catch(function(){ paint(null); });
})();


/* ---- a card that names a price opens the panel on that price ---------------
   Only fires when Sơn has confirmed a real amount; until then the button is an
   ordinary give button and this does nothing. */
(function(){
  document.addEventListener('click', function(e){
    var btn = e.target.closest ? e.target.closest('[data-give-amount]') : null;
    if (!btn) return;
    var amount = btn.getAttribute('data-give-amount');
    if (!amount) return;
    setTimeout(function(){
      var input = document.querySelector('#gsheet .gs-own input');
      if (!input) return;
      input.value = amount;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }, 120);
  }, true);
})();


/* ---- what a gift buys ------------------------------------------------------
   Four ordinary things at their Vietnamese price. Choosing one opens the giving
   panel already holding that amount in đồng. */
(function(){
  var list = document.getElementById('buysList');
  if (!list) return;
  var C = window.ASM_CONFIG || {};
  var TIERS = C.buys || [];
  if (!TIERS.length){ var b = document.getElementById('buys'); if (b) b.remove(); return; }

  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"]/g, function(ch){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch];
    });
  }
  function dong(n){
    try { return new Intl.NumberFormat('vi-VN').format(n) + ' ₫'; }
    catch (e){ return String(n) + ' ₫'; }
  }

  var html = '';
  TIERS.forEach(function(t){
    html += '<li>' +
      '<span class="buy-n">' + esc(dong(t.vnd)) +
        '<small>' + esc('≈ €' + t.eur) + '</small></span>' +
      '<span class="buy-w"><span class="en">' + esc(t.what.en) + '</span>' +
      '<span class="vn">' + esc(t.what.vn) + '</span></span>' +
      '<button class="btn gold give-cta" data-give="buys:' + esc(String(t.vnd)) + '"' +
      ' data-give-amount="' + esc(String(t.vnd)) + '" data-give-currency="vnd">' +
      '<span class="en">Give this</span><span class="vn">Tặng khoản này</span></button>' +
      '</li>';
  });
  list.innerHTML = html;
})();


/* A tier names its currency as well as its amount, so the panel opens on đồng
   rather than converting a đồng figure into whatever the visitor was showing. */
(function(){
  document.addEventListener('click', function(e){
    var btn = e.target.closest ? e.target.closest('[data-give-currency]') : null;
    if (!btn) return;
    var cur = btn.getAttribute('data-give-currency');
    if (!cur) return;
    setTimeout(function(){
      var b = document.querySelector('#gsheet .gs-c[data-cur="' + cur + '"]');
      if (b && !b.hidden && !b.classList.contains('on')) b.click();
    }, 60);
  }, true);
})();


/* ---- a name, or anonymous --------------------------------------------------
   Sơn thanks people himself, so the panel asks who he is thanking. The name
   never leaves our own records: it goes into the gift's metadata and is read
   back only on the private thanks page. Empty counts as anonymous, so nobody
   ends up half-named by forgetting to type. */
(function(){
  var sheet = document.getElementById('gsheet');
  if (!sheet) return;
  var pick  = sheet.querySelector('.gs-who-pick');
  var wrap  = document.getElementById('gsNameWrap');
  var input = document.getElementById('gsName');
  if (!pick || !wrap || !input) return;

  var PLACE = { en: 'Your name', vn: 'Tên của bạn' };
  function paintPlaceholder(){
    var vn = document.body.classList.contains('lang-vn');
    input.placeholder = vn ? PLACE.vn : PLACE.en;
  }

  function choose(which){
    [].forEach.call(pick.querySelectorAll('.gs-w'), function(b){
      var on = b.getAttribute('data-who') === which;
      b.classList.toggle('on', on);
      b.setAttribute('aria-checked', on ? 'true' : 'false');
    });
    var named = which === 'named';
    wrap.hidden = !named;
    /* Choosing anonymous clears what was typed. Leaving it in the field while
       promising anonymity would be a lie the next click could undo. */
    if (!named) input.value = '';
    else setTimeout(function(){ try { input.focus(); } catch (e) {} }, 40);
  }

  pick.addEventListener('click', function(e){
    var b = e.target.closest ? e.target.closest('.gs-w') : null;
    if (!b) return;
    e.preventDefault();
    choose(b.getAttribute('data-who'));
  });

  paintPlaceholder();
  if (window.MutationObserver){
    new MutationObserver(paintPlaceholder)
      .observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }

  window.giverName = function(){
    var v = (input.value || '').trim().slice(0, 60);
    return wrap.hidden ? '' : v;
  };
  window.giverAnonymous = function(){
    return wrap.hidden || !(input.value || '').trim();
  };
})();

/* If the block is ever absent the panel must still work, so these exist either
   way and simply report anonymous. */
if (typeof window.giverName !== 'function') window.giverName = function(){ return ''; };
if (typeof window.giverAnonymous !== 'function') window.giverAnonymous = function(){ return true; };
