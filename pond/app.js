(function(){
const {VARIETIES,deriveFromId,isRealRare,isIllustrationRare,legendFullBodySVG}=KoiEngine;
const $=id=>document.getElementById(id);

async function renderKoiVisual(el,s){
  // 本体と同じ beautifulNormalSVG を基にした全身SVGを、そのまま池で使う。
  el.classList.remove("photo-koi");
  el.innerHTML=legendFullBodySVG(s);
}

const input=$("koiId"),loadBtn=$("loadBtn"),toggleBtn=$("toggleBtn"),status=$("status"),info=$("info");
const pond=$("pond"),MAX_KOI=10;
let fishes=[],running=false,raf=0,last=0,t=0;
let gardenMinutes=8*60; // 08:00から開始
const DAY_CYCLE_MS=240000; // 4分で24時間
let lastClockTs=0;
let groupTargetX=null,groupTargetY=null;

function normAngle(a){
 while(a>Math.PI)a-=Math.PI*2;
 while(a<-Math.PI)a+=Math.PI*2;
 return a;
}
function updateRoster(){
 const list=$("koiList"),rc=$("rosterCount");
 if(rc)rc.textContent=fishes.length;
 if(!list)return;
 if(!fishes.length){list.innerHTML='<div class="rosterEmpty">まだ鯉はいません</div>';return;}
 list.innerHTML=fishes.map(f=>{
   const tier=isRealRare(f.s)?"LEGEND":(isIllustrationRare(f.s)?"RARE":"通常");
   return `<div class="rosterItem"><div><b>第${String(f.id).padStart(6,"0")}号</b><small>${VARIETIES[f.s.variety]}</small></div><span>${tier}</span></div>`;
 }).join("");
}
function updateCount(){
 $("count").textContent=fishes.length;
 toggleBtn.disabled=fishes.length===0;
 updateRoster();
}
function addKoi(){
 const raw=(input.value||"").replace(/[^0-9]/g,""),id=Number(raw);
 if(!Number.isInteger(id)||id<1||id>1000000){
   status.style.display="block";status.textContent="番号は1～1000000で入力してください";return;
 }
 if(fishes.length>=MAX_KOI){
   status.style.display="block";status.textContent="池に放せるのは10匹までです";return;
 }
 if(fishes.some(f=>f.id===id)){
   status.style.display="block";status.textContent="第"+String(id).padStart(6,"0")+"号はすでに池にいます";return;
 }
 const s=deriveFromId(id,"");
 const el=document.createElement("div");
 el.className="koi";
 el.innerHTML=legendFullBodySVG(s);
 pond.appendChild(el);
 const n=fishes.length;
 const angle=(n/MAX_KOI)*Math.PI*2-Math.PI/2;
 const f={
   id,s,el,
   px:50+Math.cos(angle)*(8+n*.9),
   py:52+Math.sin(angle)*(7+n*.7),
   heading:angle,
   turnRate:0,targetTurn:0,nextTurnAt:t+1000+Math.random()*3500,
   resting:false,nextRestAt:t+8000+Math.random()*14000,restUntil:0,
   targetX:null,targetY:null,
   phase:Math.random()*Math.PI*2,
   speed:0.0046+Math.random()*0.0018
 };
 el.style.display="block";
 fishes.push(f);
 status.style.display="none";
 $("lastInfo").textContent="第"+String(id).padStart(6,"0")+"号・"+VARIETIES[s.variety]+"・"+(isRealRare(s)?"LEGEND":(isIllustrationRare(s)?"RARE":"通常"));
 updateCount();
 input.value="";
 if(!running)start();
}


function updateGardenTime(ts){
 if(!lastClockTs) lastClockTs=ts;
 const elapsed=ts-lastClockTs;
 lastClockTs=ts;
 gardenMinutes=(gardenMinutes + elapsed*(1440/DAY_CYCLE_MS))%1440;

 const hour=gardenMinutes/60;
 const hh=String(Math.floor(hour)).padStart(2,"0");
 const mm=String(Math.floor(gardenMinutes%60)).padStart(2,"0");
 $("gardenTime").textContent=hh+":"+mm;

 const garden=$("garden"), night=$("nightSky"), lamp=$("lanternGlow"), sun=$("sunGlow");

 // 夜の濃さ：19時頃から暗く、5時頃から明るくなる
 let nightAmount=0;
 if(hour>=19) nightAmount=Math.min(1,(hour-19)/2.2);
 else if(hour<5) nightAmount=1;
 else if(hour<7) nightAmount=Math.max(0,(7-hour)/2);

 // 夕方の暖色：16～19時、朝焼け：5～7時
 let warm=0;
 if(hour>=15.5 && hour<19.5) warm=Math.sin(((hour-15.5)/4)*Math.PI);
 else if(hour>=5 && hour<7.5) warm=.55*Math.sin(((hour-5)/2.5)*Math.PI);

 garden.style.setProperty("--night",nightAmount);
 night.style.opacity=String(nightAmount*.92);
 lamp.style.opacity=String(Math.max(0,(nightAmount-.12)/.88));
 sun.style.opacity=String(warm);

 // overlay tint
 let tint;
 if(nightAmount>.02){
   tint=`rgba(7,22,36,${(nightAmount*.38).toFixed(3)})`;
 }else if(warm>.02){
   tint=`rgba(210,104,46,${(warm*.14).toFixed(3)})`;
 }else{
   tint="rgba(255,255,255,0)";
 }
 garden.style.setProperty("--timeTint",tint);
 garden.style.backgroundColor="transparent";
 garden.style.filter=`brightness(${(1-nightAmount*.36).toFixed(3)}) saturate(${(1-nightAmount*.18+warm*.08).toFixed(3)})`;
 garden.style.transition="filter 1s linear";
 garden.style.setProperty("background",garden.style.background);
 garden.dataset.timeTint=tint;

 // pseudo element can't read JS property directly, so use box-shadow inset as tint
 garden.style.boxShadow=`inset 0 0 0 1000px ${tint}`;
}

function step(ts){
 if(!running)return;
 if(!last)last=ts;
 const dt=Math.min(35,ts-last);last=ts;t+=dt;
 updateGardenTime(ts);

 for(const f of fishes){
   // 池をタップした時は全員が少しずつ位置をずらして目的地へ向かう
   if(groupTargetX!==null){
     const idx=fishes.indexOf(f);
     const a=idx/fishes.length*Math.PI*2;
     f.targetX=groupTargetX+Math.cos(a)*Math.min(8,2+fishes.length*.45);
     f.targetY=groupTargetY+Math.sin(a)*Math.min(7,2+fishes.length*.38);
   }

   if(f.targetX!==null){
     f.resting=false;
     const dx=f.targetX-f.px,dy=f.targetY-f.py,dist=Math.hypot(dx,dy);
     if(dist<2.2){
       f.targetX=null;f.targetY=null;
       f.nextRestAt=t+5000+Math.random()*10000;
     }else{
       const desired=Math.atan2(dy,dx);
       const diff=normAngle(desired-f.heading);
       f.targetTurn=Math.max(-0.00072,Math.min(0.00072,diff*0.00078));
     }
   }

   if(f.targetX===null && !f.resting && t>=f.nextRestAt){
     f.resting=true;f.restUntil=t+2200+Math.random()*3500;
   }
   if(f.resting && t>=f.restUntil){
     f.resting=false;f.nextRestAt=t+10000+Math.random()*16000;
   }

   if(f.targetX===null && !f.resting && t>=f.nextTurnAt){
     f.targetTurn=(Math.random()-.5)*0.00036;
     f.nextTurnAt=t+4000+Math.random()*6000;
   }

   const edge=Math.min(f.px,100-f.px,f.py,100-f.py);
   if(edge<18){
     const desired=Math.atan2(52-f.py,50-f.px),diff=normAngle(desired-f.heading);
     f.targetTurn=Math.max(-0.00062,Math.min(0.00062,diff*0.00058));
   }

   // 近くの鯉同士が重なり続けないよう、ごく弱く避ける
   for(const other of fishes){
     if(other===f)continue;
     const dx=f.px-other.px,dy=f.py-other.py,d=Math.hypot(dx,dy);
     if(d>0 && d<7){
       const away=Math.atan2(dy,dx),diff=normAngle(away-f.heading);
       f.targetTurn+=Math.max(-0.00012,Math.min(0.00012,diff*0.00008));
     }
   }

   f.turnRate+=(f.targetTurn-f.turnRate)*Math.min(1,dt*0.00115);
   f.heading=normAngle(f.heading+f.turnRate*dt);

   const move=f.resting?0.00025:f.speed;
   f.px+=Math.cos(f.heading)*move*dt;
   f.py+=Math.sin(f.heading)*move*dt;

   if(f.px<10){f.px=10;f.heading=Math.atan2(Math.sin(f.heading),Math.abs(Math.cos(f.heading)))}
   if(f.px>90){f.px=90;f.heading=Math.atan2(Math.sin(f.heading),-Math.abs(Math.cos(f.heading)))}
   if(f.py<12){f.py=12;f.heading=Math.atan2(Math.abs(Math.sin(f.heading)),Math.cos(f.heading))}
   if(f.py>88){f.py=88;f.heading=Math.atan2(-Math.abs(Math.sin(f.heading)),Math.cos(f.heading))}

   const angle=f.heading*180/Math.PI-90;
   f.el.style.left=f.px+"%";f.el.style.top=f.py+"%";
   f.el.style.transform=`translate(-50%,-50%) rotate(${angle}deg)`;
   const bend=Math.max(-6,Math.min(6,f.turnRate*8200));
   const body=f.el.querySelector(".bodyBend"),tail=f.el.querySelector(".tail");
   if(body)body.style.transform=`skewX(${bend}deg)`;
   if(tail)tail.style.transform=`rotate(${-bend*1.25}deg)`;
 }
 // 全員が目的地付近まで来たら通常遊泳へ戻す
 if(groupTargetX!==null && fishes.length && fishes.every(f=>f.targetX===null)){
   groupTargetX=null;groupTargetY=null;
 }
 raf=requestAnimationFrame(step);
}
function start(){if(running)return;running=true;last=0;lastClockTs=0;toggleBtn.textContent="一時停止";toggleBtn.classList.remove("secondary");raf=requestAnimationFrame(step)}
function stop(){running=false;cancelAnimationFrame(raf);toggleBtn.textContent="泳がせる";toggleBtn.classList.add("secondary")}
pond.addEventListener("pointerdown",e=>{
 if(!fishes.length)return;
 const r=pond.getBoundingClientRect();
 groupTargetX=Math.max(14,Math.min(86,(e.clientX-r.left)/r.width*100));
 groupTargetY=Math.max(16,Math.min(84,(e.clientY-r.top)/r.height*100));
 for(const f of fishes){f.resting=false;f.restUntil=0}
 if(!running)start();
});
loadBtn.addEventListener("click",addKoi);
input.addEventListener("keydown",e=>{if(e.key==="Enter")addKoi()});
toggleBtn.addEventListener("click",()=>running?stop():start());
updateCount();
})();
