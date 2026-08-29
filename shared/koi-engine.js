// 越鯉 共通生成エンジン
// 本体と池が同じ番号生成・同じ鯉描画を使うための共通ファイル
(function(global){
"use strict";
const VARIETIES=["紅白","大正三色","昭和三色","白写り","緋写り","白べっ甲","山吹黄金","プラチナ黄金","張り分け黄金","オレンジ黄金","菊水","金昭和","銀白写り","孔雀","浅黄","秋翠","五色","藍衣","葡萄衣","落ち葉しぐれ","銀鱗紅白","銀鱗大正三色","銀鱗昭和三色","銀鱗白写り","銀鱗五色","銀鱗落ち葉しぐれ","銀鱗丹頂","銀鱗丹頂大正三色","九紋竜","紅九紋竜","輝黒竜","紅輝黒竜","丹頂紅白","丹頂大正三色","丹頂昭和三色","丹頂孔雀","ドイツ紅白","ドイツ大正三色","ドイツ昭和三色","ドイツ白写り","ドイツ孔雀","ドイツ大和錦"];
const KOSHI_DATA_VERSION=2;

const BEAUTIFUL_PATTERN_COUNT=100;


function hash32(s){let h=2166136261>>>0;s=s.normalize("NFKC").trim().toLowerCase();for(const ch of s){h^=ch.codePointAt(0);h=Math.imul(h,16777619)}return h>>>0}

function canonicalSeed(id,tag=""){
 return "koshi-no-koi:v"+KOSHI_DATA_VERSION+":"+String(id).padStart(6,"0")+":"+tag;
}

function deriveFromId(id,name=""){
 id=Math.max(1,Math.min(1000000,Math.trunc(Number(id)||1)));
 const h=hash32(canonicalSeed(id,"base"));
 const h2=hash32(canonicalSeed(id,"pattern"));
 const h3=hash32(canonicalSeed(id,"detail"));
 return {id,name,
  variety:h%42, body:(h>>>6)%8, size:(h>>>10)%7, color:(h>>>13)%16,
  big:h2%32, fine:(h2>>>8)%32, balance:h3%32};
}

function beautifulPatternIndex(s){
  return hash32(canonicalSeed(s.id,"beautifulPattern")) % BEAUTIFUL_PATTERN_COUNT;
}

function beautifulNormalSVG(s){
  const idx=beautifulPatternIndex(s);
  const h=hash32("beautiful:"+idx);
  const palettes=[
    ["#f7f2e7","#df2f24","#1b1e22"],["#fff8e9","#c81f27","#252a30"],
    ["#f4ead6","#e35e18","#1c2025"],["#fffdf5","#d12b23","#11161d"],
    ["#f6efdf","#d83d2d","#30251f"],["#fff9eb","#df2e25","#343943"],
    ["#f3f6f4","#d5a51f","#2b2b27"],["#eef4f5","#7797a5","#ca6637"]
  ];
  const p=palettes[idx%palettes.length];

  let spots="";
  const count=5+(h%6);
  for(let i=0;i<count;i++){
    const hh=hash32(idx+":"+i);
    const y=150+(hh%470);
    const x=250+((hh>>>8)%110)-55;
    const rx=30+((hh>>>16)%50);
    const ry=42+((hh>>>23)%68);
    const rot=((hh>>>5)%70)-35;
    const fill=(i%3===0?p[2]:p[1]);
    spots+=`
      <ellipse cx="${x+3}" cy="${y+4}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${x+3} ${y+4})" fill="#000" opacity=".10"/>
      <ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${x} ${y})" fill="${fill}" opacity=".96"/>
    `;
  }

  const stripe=(idx%5===0)?`
    <path d="M215 270 Q250 238 285 270 M205 365 Q250 330 295 365 M210 465 Q250 430 290 465"
      fill="none" stroke="${p[2]}" stroke-width="16" stroke-linecap="round" opacity=".82"/>`:"";

  const headMark=(idx%4===0)?
    `<circle cx="250" cy="610" r="${40+(idx%20)}" fill="${p[1]}" opacity=".95"/>`:"";

  let scales="";
  for(let y=205,row=0;y<610;y+=26,row++){
    const half=76+Math.sin((y-190)/430*Math.PI)*28;
    for(let x=250-half+(row%2?12:0);x<=250+half;x+=24){
      scales+=`<path d="M${x-11} ${y} Q${x} ${y-9} ${x+11} ${y}" fill="none" stroke="#8f887b" stroke-width="1.2" opacity=".28"/>`;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 760">
   <defs>
    <linearGradient id="bg${idx}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#dff3fb"/>
      <stop offset=".45" stop-color="#8fc9e4"/>
      <stop offset="1" stop-color="#4e9fca"/>
    </linearGradient>

    <linearGradient id="bodyShade${idx}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#b8b2a6"/>
      <stop offset=".16" stop-color="${p[0]}"/>
      <stop offset=".50" stop-color="#fffdf6"/>
      <stop offset=".84" stop-color="${p[0]}"/>
      <stop offset="1" stop-color="#b8b2a6"/>
    </linearGradient>

    <linearGradient id="finShade${idx}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fffdf4" stop-opacity=".92"/>
      <stop offset="1" stop-color="#c8d2d8" stop-opacity=".55"/>
    </linearGradient>

    <radialGradient id="highlight${idx}" cx="50%" cy="35%" r="55%">
      <stop offset="0" stop-color="#fff" stop-opacity=".55"/>
      <stop offset=".55" stop-color="#fff" stop-opacity=".08"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>

    <clipPath id="body${idx}">
      <path d="M250 80 C180 145 165 300 178 440 C188 560 205 665 250 700 C295 665 312 560 322 440 C335 300 320 145 250 80Z"/>
    </clipPath>

    <filter id="soft${idx}" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="1.2"/>
    </filter>

    <filter id="shadow${idx}" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#0b4f75" flood-opacity=".28"/>
    </filter>
   </defs>

   <rect width="500" height="760" rx="22" fill="url(#bg${idx})"/>
   <g opacity=".22" fill="none" stroke="#fff" stroke-width="4">
    <path d="M20 130 Q125 95 230 130 T480 130"/>
    <path d="M15 630 Q130 590 245 630 T485 630"/>
    <path d="M55 225 Q145 195 235 225 T445 225"/>
   </g>

   <g filter="url(#shadow${idx})">
    <path d="M250 94 C215 58 190 30 180 8 C225 18 250 38 250 68 C250 38 275 18 320 8 C310 30 285 58 250 94Z"
      fill="url(#finShade${idx})" stroke="#8a8172" stroke-width="3"/>

    <path d="M180 370 C120 340 78 350 55 390 C100 420 145 425 184 405Z"
      fill="url(#finShade${idx})" stroke="#8a8172" stroke-width="3"/>
    <path d="M320 370 C380 340 422 350 445 390 C400 420 355 425 316 405Z"
      fill="url(#finShade${idx})" stroke="#8a8172" stroke-width="3"/>

    <path d="M250 80 C180 145 165 300 178 440 C188 560 205 665 250 700 C295 665 312 560 322 440 C335 300 320 145 250 80Z"
      fill="url(#bodyShade${idx})" stroke="#71695e" stroke-width="4"/>

    <g clip-path="url(#body${idx})">
      ${spots}${stripe}${headMark}
      <g>${scales}</g>

      <ellipse cx="250" cy="330" rx="92" ry="230" fill="url(#highlight${idx})"/>
      <path d="M250 110 C242 245 244 500 250 675" stroke="#b9aa90" stroke-width="3" opacity=".38"/>
      <path d="M190 180 C165 300 168 520 210 640" stroke="#fff" stroke-width="5" opacity=".10" fill="none"/>
      <path d="M310 180 C335 300 332 520 290 640" stroke="#4a433b" stroke-width="5" opacity=".10" fill="none"/>
    </g>

    <ellipse cx="222" cy="635" rx="9" ry="13" fill="#171717"/>
    <ellipse cx="278" cy="635" rx="9" ry="13" fill="#171717"/>
    <circle cx="219" cy="631" r="2.6" fill="#fff" opacity=".85"/>
    <circle cx="275" cy="631" r="2.6" fill="#fff" opacity=".85"/>

    <path d="M230 674 Q250 689 270 674" fill="none" stroke="#8d6d5d" stroke-width="4" stroke-linecap="round"/>
    <path d="M228 671 L185 690 M272 671 L315 690" stroke="#8d6d5d" stroke-width="2"/>
   </g>
  </svg>`;
}

function isRealRare(s){
  return (hash32(canonicalSeed(s.id,"real42"))%1000)<8;
}

function isIllustrationRare(s){
  // 約6%の「少しレア」。伝説級とは重複させない。
  if(isRealRare(s))return false;
  const h=hash32(canonicalSeed(s.id,"illustrationRare"));
  return (h%1000)<60;
}

function legendFullBodySVG(s){
  // 通常の美麗SVGから水面背景だけを外し、鯉そのものを透明背景で取り出す。
  // SVG内IDは画面上の通常個体と衝突しないようLEGEND専用に変更する。
  let svg=beautifulNormalSVG(s);
  svg=svg.replace(/<rect width="500" height="760" rx="22"[^>]*\/>/,"");
  svg=svg.replace(/<g opacity="\.22" fill="none" stroke="#fff" stroke-width="4">[\s\S]*?<\/g>/,"");
  const suffix="_legend_"+String(s.id);
  svg=svg.replace(/\bid="([^"]+)"/g,(m,id)=>`id="${id}${suffix}"`);
  svg=svg.replace(/url\(#([^)]+)\)/g,(m,id)=>`url(#${id}${suffix})`);
  return svg;
}

function rareImageFor(s){ return RARE_REAL_IMAGES[s.variety % 42]; }
function applyRealRare(){
  const rare=isRealRare(state);
  const card=document.getElementById("rareRealCard");
  const img=document.getElementById("rareRealImg");
  const full=document.getElementById("rareFullKoi");
  const isNaturalFullBody = rare && ((state.variety % 42)===39);

  if(card){
    card.classList.toggle("show",rare);
    card.classList.toggle("natural-fullbody",isNaturalFullBody);
  }

  if(full){
    full.innerHTML = (rare && !isNaturalFullBody) ? legendFullBodySVG(state) : "";
  }

  const badgeEl=document.getElementById("badge");
  if(badgeEl)badgeEl.style.display=(rare||isIllustrationRare(state))?"none":"block";

  const newEl=document.getElementById("newBadge");
  if(newEl && rare)newEl.style.right="10px";

  if(rare && img){
    const src=rareImageFor(state);
    img.src=src;
    if(card){
      card.style.backgroundImage = isNaturalFullBody ? "none" : `url("${src}")`;
    }
  }

  const svg=document.getElementById("koiSvg");
  if(svg)svg.style.visibility=(rare||isIllustrationRare(state))?"hidden":"visible";

  if(rare){
    const sub=document.getElementById("rareRealSub");
    if(sub)sub.textContent=(VARIETIES[state.variety]||"越鯉")+"・全身表示";
  }
  return rare;
}

function render(){
 document.getElementById("koiSvg").outerHTML=beautifulNormalSVG(state).replace("<svg ","<svg id=\"koiSvg\" ");
 applyRealRare();
 applyIllustrationRare();
 badge.textContent=VARIETIES[state.variety];
 idOut.textContent=String(state.id).padStart(6,"0");
 nameOut.textContent=state.name||"生成個体"; koiNameOut.textContent=makeKoiName(state);
 varietyOut.textContent=VARIETIES[state.variety];
 lengthOut.textContent=SIZES[state.size]+"cm";
 bodyOut.textContent=BODY_TYPES[state.body][0];
 patternText.textContent=`${PATTERN_NAMES[state.big]}を基調に、${FINE_NAMES[state.fine]}を加えた配置。`;
 personality.textContent=PERSONALITIES[(state.id+state.big)%PERSONALITIES.length];
 const p1=30+(state.color*7)%35,p2=20+(state.big*5)%32,p3=100-p1-p2;
 bar1.style.width=p1+"%";bar1.style.background=COLORS[state.color%COLORS.length];pct1.textContent=p1+"%";
 bar2.style.width=p2+"%";bar2.style.background="#262626";pct2.textContent=p2+"%";
 bar3.style.width=Math.max(5,p3)+"%";bar3.style.background="#f3efe5";pct3.textContent=Math.max(5,p3)+"%";
 const ph=hash32(canonicalSeed(state.id,"price"));
 let price;
 // 通常個体：1万円～300万円以内。
 // 9万円以下は少なめ、100万円前後が最も出やすい分布。
 const r=(ph>>>8)&0xFFFFFF;
 const bucket=r%100;
 const frac=((ph>>>4)&0xFFFF)/0xFFFF;
 if(bucket<8){
   // 約8%：1万～9万円
   price=10000+Math.round(frac*80000/1000)*1000;
 }else if(bucket<28){
   // 約20%：10万～69万円
   price=100000+Math.round(frac*590000/1000)*1000;
 }else if(bucket<73){
   // 約45%：70万～130万円（100万円前後を中心）
   const centered=(frac+(((ph>>>12)&0xFFFF)/0xFFFF))/2;
   price=700000+Math.round(centered*600000/1000)*1000;
 }else{
   // 約27%：131万～300万円
   price=1310000+Math.round(frac*1690000/1000)*1000;
 }
 price=Math.min(3000000,Math.max(10000,price));
 if(isRealRare(state)){
   // All photo-real LEGEND specimens are genuinely top-tier.
   // Deterministic range: 300,000,000–999,999,999 yen.
   const premiumHash=hash32(canonicalSeed(state.id,"legendPrice"));
   price=300000000+(premiumHash%700000000);
 }
 if(isIllustrationRare(state)){
   // 希少級は 10,000,000～99,999,999円。
   const rh=hash32(canonicalSeed(state.id,"rarePrice"));
   price=10000000+(rh%90000000);
 }
 if(collectionPriceOverride!==null){
   price=collectionPriceOverride;
   collectionPriceOverride=null;
 }
 priceOut.textContent="金 "+price.toLocaleString("ja-JP")+"円";
 const comment=appraisalText(state,price);
 appraisalComment.textContent=comment;
 const isNew=(isRealRare(state)||isIllustrationRare(state))?false:registerVariety(state.variety);
 registerSpecimen(state.id,price);
 if(isRealRare(state)){
   saveLegendRecord(state,price);
   renderLegendCollection();
renderIllustrationRareCollection();
 }else if(isIllustrationRare(state)){
   saveIllustrationRareRecord(state,price);
   renderIllustrationRareCollection();
 }else{
   saveCollectionRecord(state.variety,state,price);
 }
 renderCollection();
 renderIllustrationRareCollection();
 renderLegendCollection();
 renderSpecimenStats();
 runRareEffects(isNew,price);
 updateActive();
}

global.KoiEngine={
  VARIETIES, KOSHI_DATA_VERSION, hash32, canonicalSeed, deriveFromId,
  beautifulPatternIndex, beautifulNormalSVG, isRealRare, isIllustrationRare, legendFullBodySVG
};
})(window);
