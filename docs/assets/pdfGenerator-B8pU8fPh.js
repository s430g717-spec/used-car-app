import{E as b,h as c}from"./index-CgOuJbtB.js";async function h(t,o,a,n){var s;const p=new b("p","mm","a4"),l=210,e=document.createElement("div");e.style.position="absolute",e.style.left="-9999px",e.style.width="210mm",e.innerHTML=m(t,o,a,n),document.body.appendChild(e);try{await new Promise(f=>setTimeout(f,300));const d=await c(e,{scale:2,useCORS:!0,allowTaint:!0,backgroundColor:"#ffffff",windowWidth:e.scrollWidth,windowHeight:e.scrollHeight}),i=d.toDataURL("image/png"),r=l-20,x=d.height*r/d.width;p.addImage(i,"PNG",10,10,r,x);const g=`鑑定書_${t.name||"車両"}_${((s=t.chassisNumber)==null?void 0:s.slice(-4))||""}_${new Date().toISOString().split("T")[0]}.pdf`;p.save(g)}finally{document.body.removeChild(e)}}function m(t,o,a,n){const p={};o.forEach(i=>{p[i.part]=i.defects.map(r=>`${r.type}${r.level||""}`)});const l={"front-bumper":"Fバンパー",hood:"ボンネット","front-glass":"Fガラス",roof:"ルーフ","right-front-fender":"右Fフェンダー","right-front-door":"右Fドア","right-rear-door":"右Rドア","right-rear-fender":"右Rフェンダー","rear-gate":"Rゲート","rear-bumper":"Rバンパー","left-rear-fender":"左Rフェンダー","left-rear-door":"左Rドア","left-front-door":"左Fドア","left-front-fender":"左Fフェンダー","left-step":"左ステップ","right-step":"右ステップ"},e=o.reduce((i,r)=>i+r.defects.length,0),s=e===0?"5.0":e<=2?"4.5":e<=5?"4.0":"3.5",d=e===0?"S":e<=2?"A":e<=5?"B":"C";return`
    <div style="font-family: 'Noto Sans JP', 'Yu Gothic', 'Meiryo', sans-serif; background: #ffffff; padding: 12mm; box-sizing: border-box; position: relative; max-width: 210mm;">
      <!-- 装飾的な背景パターン -->
      <div style="position: absolute; top: 0; left: 0; right: 0; height: 4px; background: repeating-linear-gradient(90deg, #c9a961 0px, #c9a961 15px, transparent 15px, transparent 30px);"></div>
      <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 4px; background: repeating-linear-gradient(90deg, #c9a961 0px, #c9a961 15px, transparent 15px, transparent 30px);"></div>

      <!-- ヘッダー：豪華な鑑定書タイトル -->
      <div style="background: linear-gradient(135deg, #1a1a2e 0%, #0f3460 50%, #1a1a2e 100%); padding: 20px 16px; margin-bottom: 16px; border-radius: 10px; box-shadow: 0 6px 20px rgba(0,0,0,0.2); border: 3px solid #c9a961; position: relative; overflow: hidden;">
        <div style="position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: radial-gradient(circle, rgba(201,169,97,0.1) 0%, transparent 70%);"></div>
        <div style="position: relative; z-index: 1;">
          <h1 style="margin: 0 0 10px 0; font-size: 28px; font-weight: 900; color: #c9a961; text-align: center; letter-spacing: 6px; text-shadow: 2px 2px 4px rgba(0,0,0,0.5), 0 0 15px rgba(201,169,97,0.3);">自動車鑑定書</h1>
          <div style="text-align: center; font-size: 10px; color: #d4af37; letter-spacing: 2px; font-weight: 600; text-transform: uppercase;">VEHICLE INSPECTION CERTIFICATE</div>
          <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(201,169,97,0.3); text-align: center; font-size: 9px; color: #c9a961; letter-spacing: 0.5px;">認定鑑定士による詳細検査済み</div>
        </div>
      </div>

      <!-- 車両基本情報：2列グリッド -->
      <div style="background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%); padding: 16px; margin-bottom: 16px; border-radius: 10px; border: 2px solid #c9a961; box-shadow: 0 3px 10px rgba(201,169,97,0.15);">
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
          <div style="padding: 10px; background: linear-gradient(135deg, #fff8e7 0%, #ffffff 100%); border-radius: 6px; border-left: 3px solid #c9a961;">
            <div style="font-size: 9px; color: #8b7355; font-weight: 700; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Vehicle Name</div>
            <div style="font-size: 18px; font-weight: 900; color: #1a1a2e; line-height: 1.2;">${t.name||"-"}</div>
          </div>
          <div style="padding: 10px; background: #ffffff; border-radius: 6px; border-left: 3px solid #8b7355;">
            <div style="font-size: 9px; color: #8b7355; font-weight: 700; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Model Year</div>
            <div style="font-size: 18px; font-weight: 900; color: #1a1a2e;">${t.year||"-"}</div>
          </div>
          <div style="padding: 10px; background: #ffffff; border-radius: 6px; border-left: 3px solid #8b7355;">
            <div style="font-size: 9px; color: #8b7355; font-weight: 700; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Model Code</div>
            <div style="font-size: 15px; font-weight: 700; color: #1a1a2e; font-family: 'Courier New', monospace;">${t.model||"-"}</div>
          </div>
          <div style="padding: 10px; background: linear-gradient(135deg, #fff8e7 0%, #ffffff 100%); border-radius: 6px; border-left: 3px solid #c9a961;">
            <div style="font-size: 9px; color: #8b7355; font-weight: 700; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Chassis No.</div>
            <div style="font-size: 13px; font-weight: 700; color: #1a1a2e; font-family: 'Courier New', monospace; word-break: break-all;">${t.chassisNumber||"-"}</div>
          </div>
        </div>
      </div>

      <!-- 総合評価：横並び2列 -->
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 16px;">
        <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 16px; border-radius: 10px; border: 3px solid #f59e0b; box-shadow: 0 4px 12px rgba(245,158,11,0.3); text-align: center;">
          <div style="font-size: 10px; font-weight: 800; color: #92400e; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Overall Grade</div>
          <div style="font-size: 48px; font-weight: 900; color: #b45309; text-shadow: 2px 2px 4px rgba(0,0,0,0.1); font-family: Arial, sans-serif; line-height: 1;">${d}</div>
          <div style="margin-top: 10px; padding-top: 10px; border-top: 2px solid rgba(180,83,9,0.3);">
            <div style="font-size: 9px; color: #92400e; font-weight: 700; margin-bottom: 3px;">外装評価</div>
            <div style="font-size: 24px; font-weight: 900; color: #b45309;">${s}</div>
          </div>
        </div>

        <div style="background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%); padding: 16px; border-radius: 10px; border: 3px solid #0ea5e9; box-shadow: 0 4px 12px rgba(14,165,233,0.3);">
          <div style="font-size: 10px; font-weight: 800; color: #075985; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; text-align: center;">Inspector</div>
          <div style="margin-bottom: 12px; padding: 10px; background: rgba(255,255,255,0.6); border-radius: 6px; text-align: center;">
            <div style="font-size: 9px; color: #075985; font-weight: 700; margin-bottom: 4px;">総合</div>
            <div style="font-size: 28px; font-weight: 900; color: #0369a1; text-shadow: 1px 1px 2px rgba(0,0,0,0.1);">${a.overallRating||"-"}</div>
          </div>
          <div style="padding: 10px; background: rgba(255,255,255,0.6); border-radius: 6px; text-align: center;">
            <div style="font-size: 9px; color: #075985; font-weight: 700; margin-bottom: 4px;">内装</div>
            <div style="font-size: 28px; font-weight: 900; color: #0369a1; text-shadow: 1px 1px 2px rgba(0,0,0,0.1);">${a.interiorRating||"-"}</div>
          </div>
        </div>
      </div>

      <!-- 展開図：フル幅 -->
      <div style="background: #f8f9fa; padding: 14px; margin-bottom: 16px; border-radius: 10px; border: 2px solid #c9a961; box-shadow: 0 3px 10px rgba(201,169,97,0.15);">
        <div style="font-size: 12px; font-weight: 800; color: #1a1a2e; margin-bottom: 10px; text-align: center; padding-bottom: 8px; border-bottom: 2px solid #c9a961; text-transform: uppercase; letter-spacing: 1px;">Vehicle Diagram</div>
        ${n?`<img src="${n}" style="width: 100%; height: auto; border-radius: 6px; border: 1px solid #e5e7eb;" />`:'<div style="text-align: center; padding: 40px 20px; color: #9ca3af; font-size: 13px;">展開図データなし</div>'}
      </div>

      <!-- 検査員コメント -->
      <div style="background: linear-gradient(135deg, #f0f9ff 0%, #ffffff 100%); padding: 14px; margin-bottom: 16px; border-radius: 10px; border: 2px solid #0ea5e9; box-shadow: 0 3px 10px rgba(14,165,233,0.15);">
        <div style="font-size: 11px; font-weight: 800; color: #075985; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center;">
          <span style="display: inline-block; width: 3px; height: 16px; background: #0ea5e9; margin-right: 8px; border-radius: 2px;"></span>
          Inspector's Comments
        </div>
        <div style="font-size: 10px; color: #1e293b; line-height: 1.7; white-space: pre-wrap; padding: 10px; background: rgba(255,255,255,0.7); border-radius: 6px; min-height: 60px;">
          ${a.content||"特記事項なし"}
        </div>
      </div>

      <!-- 瑕疵一覧 -->
      ${o.length>0?`
        <div style="background: #ffffff; padding: 14px; margin-bottom: 16px; border-radius: 10px; border: 2px solid #dc2626; box-shadow: 0 3px 10px rgba(220,38,38,0.15);">
          <div style="font-size: 11px; font-weight: 800; color: #991b1b; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center;">
            <span style="display: inline-block; width: 3px; height: 16px; background: #dc2626; margin-right: 8px; border-radius: 2px;"></span>
            Defects & Repairs
          </div>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
            ${o.map(i=>`
              <div style="padding: 10px; background: linear-gradient(135deg, #fff 0%, #fef2f2 100%); border-radius: 6px; border: 1px solid #fecaca;">
                <div style="font-size: 9px; color: #991b1b; font-weight: 700; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.3px;">${l[i.part]||i.part}</div>
                <div style="display: flex; flex-wrap: wrap; gap: 3px;">
                  ${i.defects.map(r=>`
                    <span style="display: inline-block; padding: 3px 6px; background: #fee2e2; border: 1px solid #dc2626; border-radius: 3px; font-size: 10px; font-weight: 700; color: #991b1b;">
                      ${r.type}${r.level||""}
                    </span>
                  `).join("")}
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      `:`
        <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); padding: 20px; margin-bottom: 16px; border-radius: 10px; border: 2px solid #10b981; box-shadow: 0 3px 10px rgba(16,185,129,0.15); text-align: center;">
          <div style="font-size: 16px; font-weight: 800; color: #047857; letter-spacing: 0.5px;">✓ 瑕疵なし（優良車両）</div>
          <div style="font-size: 10px; color: #059669; margin-top: 6px;">NO DEFECTS - EXCELLENT</div>
        </div>
      `}

      <!-- 車両画像 -->
      ${t.frontImage||t.rearImage?`
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 16px;">
          ${t.frontImage?`
            <div style="background: #f8f9fa; padding: 12px; border-radius: 10px; border: 2px solid #c9a961; box-shadow: 0 3px 10px rgba(201,169,97,0.15);">
              <div style="font-size: 10px; font-weight: 800; color: #1a1a2e; margin-bottom: 8px; text-align: center; text-transform: uppercase; letter-spacing: 0.5px;">Exterior</div>
              <img src="${t.frontImage}" style="width: 100%; height: auto; border-radius: 6px; border: 1px solid #e5e7eb;" />
            </div>
          `:""}
          ${t.rearImage?`
            <div style="background: #f8f9fa; padding: 12px; border-radius: 10px; border: 2px solid #c9a961; box-shadow: 0 3px 10px rgba(201,169,97,0.15);">
              <div style="font-size: 10px; font-weight: 800; color: #1a1a2e; margin-bottom: 8px; text-align: center; text-transform: uppercase; letter-spacing: 0.5px;">Interior</div>
              <img src="${t.rearImage}" style="width: 100%; height: auto; border-radius: 6px; border: 1px solid #e5e7eb;" />
            </div>
          `:""}
        </div>
      `:""}

      <!-- フッター -->
      <div style="margin-top: 20px; padding: 16px; background: linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%); border-radius: 10px; border: 2px solid #c9a961; box-shadow: 0 3px 10px rgba(201,169,97,0.2);">
        <div style="text-align: center; color: #c9a961; font-size: 10px; font-weight: 700; margin-bottom: 6px; letter-spacing: 1.5px;">INSPECTION DATE</div>
        <div style="text-align: center; color: #d4af37; font-size: 14px; font-weight: 900; margin-bottom: 10px;">${new Date().toLocaleDateString("ja-JP",{year:"numeric",month:"long",day:"numeric"})}</div>
        <div style="text-align: center; padding-top: 10px; border-top: 1px solid rgba(201,169,97,0.3); color: #8b7355; font-size: 8px; line-height: 1.5;">
          この鑑定書は認定検査員による厳格な検査基準に基づいて発行されています
        </div>
      </div>
    </div>
  `}export{h as generateInspectionPDF};
