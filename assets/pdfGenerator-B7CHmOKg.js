import{E as v,h as m}from"./index-D4BP8hm8.js";async function b(t,n,o,r){var i;const d=new v("p","mm","a4"),a=210,e=document.createElement("div");e.style.position="absolute",e.style.left="-9999px",e.style.width="210mm",e.innerHTML=c(t,n,o,r),document.body.appendChild(e);try{await new Promise(f=>setTimeout(f,300));const s=await m(e,{scale:2,useCORS:!0,allowTaint:!0,backgroundColor:"#ffffff",windowWidth:e.scrollWidth,windowHeight:e.scrollHeight}),l=s.toDataURL("image/png"),p=a-20,g=s.height*p/s.width;d.addImage(l,"PNG",10,10,p,g);const x=`鑑定書_${t.name||"車両"}_${((i=t.chassisNumber)==null?void 0:i.slice(-4))||""}_${new Date().toISOString().split("T")[0]}.pdf`;d.save(x)}finally{document.body.removeChild(e)}}function c(t,n,o,r){const d={};n.forEach(e=>{d[e.part]=e.defects.map(i=>`${i.type}${i.level||""}`)});const a={"front-bumper":"Fバンパー",hood:"ボンネット","front-glass":"Fガラス",roof:"ルーフ","right-front-fender":"右Fフェンダー","right-front-door":"右Fドア","right-rear-door":"右Rドア","right-rear-fender":"右Rフェンダー","rear-gate":"Rゲート","rear-bumper":"Rバンパー","left-rear-fender":"左Rフェンダー","left-rear-door":"左Rドア","left-front-door":"左Fドア","left-front-fender":"左Fフェンダー","left-step":"左ステップ","right-step":"右ステップ"};return Object.entries(d).map(([e,i])=>`
      <div style="display: flex; border-bottom: 1px solid #e0e0e0; padding: 4px 0;">
        <div style="flex: 0 0 100px; font-size: 11px; color: #333; font-weight: 600;">${a[e]||e}</div>
        <div style="flex: 1; font-size: 11px; color: #555;">${i.join(", ")}</div>
      </div>
    `).join(""),`
    <div style="font-family: 'Noto Sans JP', 'Yu Gothic', 'Meiryo', sans-serif; background: #ffffff; padding: 12mm; box-sizing: border-box;">
      <!-- ヘッダー -->
      <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 16px 20px; margin-bottom: 16px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); border: 2px solid #c9a961;">
        <div style="position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, #c9a961 0%, #f4e5c3 50%, #c9a961 100%);"></div>
        <h1 style="margin: 0; font-size: 26px; font-weight: 900; color: #c9a961; text-align: center; letter-spacing: 4px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">自動車鑑定書</h1>
        <div style="margin-top: 8px; text-align: center; font-size: 11px; color: #c9a961; letter-spacing: 2px;">PROFESSIONAL VEHICLE INSPECTION CERTIFICATE</div>
      </div>

      <!-- 車両情報と検査員報告の2カラムレイアウト -->
      <div style="display: flex; gap: 16px; margin-bottom: 16px;">
        <!-- 左カラム: 検査員報告 (1:2の比率) -->
        <div style="flex: 1; background: #f8f9fa; padding: 12px; border-radius: 8px; border: 2px solid #c9a961;">
          <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: 700; color: #1a1a2e; border-bottom: 2px solid #c9a961; padding-bottom: 6px;">検査員報告</h3>
          <div style="margin-bottom: 12px;">
            <div style="font-size: 11px; color: #666; margin-bottom: 6px; font-weight: 600;">総合評価</div>
            <div style="font-size: 32px; font-weight: 900; color: #c9a961; text-shadow: 1px 1px 2px rgba(0,0,0,0.1);">${o.overallRating||"-"}</div>
          </div>
          <div style="margin-bottom: 12px;">
            <div style="font-size: 11px; color: #666; margin-bottom: 6px; font-weight: 600;">内装評価</div>
            <div style="font-size: 32px; font-weight: 900; color: #c9a961; text-shadow: 1px 1px 2px rgba(0,0,0,0.1);">${o.interiorRating||"-"}</div>
          </div>
          <div>
            <div style="font-size: 10px; color: #666; margin-bottom: 4px;">所見</div>
            <div style="font-size: 10px; color: #333; line-height: 1.6; white-space: pre-wrap;">${o.content||"特記事項なし"}</div>
          </div>
        </div>

        <!-- 右カラム: 展開図 (2:2の比率) -->
        <div style="flex: 2; background: #f8f9fa; padding: 12px; border-radius: 8px; border: 2px solid #c9a961;">
          <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: 700; color: #1a1a2e; border-bottom: 2px solid #c9a961; padding-bottom: 6px;">車両展開図</h3>
          ${r?`<img src="${r}" style="width: 100%; height: auto; border-radius: 4px;" />`:'<div style="text-align: center; padding: 40px; color: #999;">展開図なし</div>'}
        </div>
      </div>

      <!-- 車両基本情報 -->
      <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; margin-bottom: 16px; border: 2px solid #c9a961;">
        <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: 700; color: #1a1a2e; border-bottom: 2px solid #c9a961; padding-bottom: 6px;">車両基本情報</h3>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
          <div><span style="font-size: 10px; color: #666;">車名</span><div style="font-size: 12px; font-weight: 600; color: #333; margin-top: 2px;">${t.name||"-"}</div></div>
          <div><span style="font-size: 10px; color: #666;">型式</span><div style="font-size: 12px; font-weight: 600; color: #333; margin-top: 2px;">${t.model||"-"}</div></div>
          <div><span style="font-size: 10px; color: #666;">グレード</span><div style="font-size: 12px; font-weight: 600; color: #333; margin-top: 2px;">${t.grade||"-"}</div></div>
          <div><span style="font-size: 10px; color: #666;">年式</span><div style="font-size: 12px; font-weight: 600; color: #333; margin-top: 2px;">${t.year||"-"}</div></div>
          <div><span style="font-size: 10px; color: #666;">車体番号</span><div style="font-size: 12px; font-weight: 600; color: #333; margin-top: 2px;">${t.chassisNumber||"-"}</div></div>
          <div><span style="font-size: 10px; color: #666;">走行距離</span><div style="font-size: 12px; font-weight: 600; color: #333; margin-top: 2px;">${t.mileage||"-"}km</div></div>
        </div>
      </div>

      <!-- 車両画像 -->
      ${t.frontImage||t.rearImage?`
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 16px;">
          ${t.frontImage?`
            <div style="background: #f8f9fa; padding: 10px; border-radius: 8px; border: 2px solid #c9a961;">
              <div style="font-size: 12px; font-weight: 700; color: #1a1a2e; margin-bottom: 8px; text-align: center;">外装</div>
              <img src="${t.frontImage}" style="width: 100%; height: auto; border-radius: 6px; border: 1px solid #e0e0e0;" />
            </div>
          `:""}
          ${t.rearImage?`
            <div style="background: #f8f9fa; padding: 10px; border-radius: 8px; border: 2px solid #c9a961;">
              <div style="font-size: 12px; font-weight: 700; color: #1a1a2e; margin-bottom: 8px; text-align: center;">内装</div>
              <img src="${t.rearImage}" style="width: 100%; height: auto; border-radius: 6px; border: 1px solid #e0e0e0;" />
            </div>
          `:""}
        </div>
      `:""}

      <!-- フッター -->
      <div style="margin-top: 20px; padding-top: 12px; border-top: 2px solid #c9a961; text-align: center;">
        <div style="font-size: 10px; color: #666;">鑑定日: ${new Date().toLocaleDateString("ja-JP")}</div>
        <div style="font-size: 9px; color: #999; margin-top: 4px;">この鑑定書は専門検査員による詳細検査に基づいて発行されています</div>
      </div>
    </div>
  `}export{b as generateInspectionPDF};
