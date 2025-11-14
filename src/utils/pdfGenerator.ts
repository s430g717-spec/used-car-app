import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { CarSpec } from '../components/SpecInput';
import { PartDefect } from '../CarPartSelector';
import { InspectorReportData } from '../components/InspectorReport';

// 鑑定書PDF生成（在庫管理から呼び出し用）
export async function generateInspectionPDF(
  carSpec: CarSpec,
  partDefects: PartDefect[],
  inspectorReport: InspectorReportData,
  diagramImageData: string | null
): Promise<void> {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;
  const pageHeight = 297;

  // 鑑定書を一時的にDOMに追加してキャプチャ
  const tempDiv = document.createElement('div');
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.width = '210mm';
  tempDiv.innerHTML = createInspectionHTML(carSpec, partDefects, inspectorReport, diagramImageData);
  document.body.appendChild(tempDiv);

  try {
    await new Promise(resolve => setTimeout(resolve, 300));

    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      windowWidth: tempDiv.scrollWidth,
      windowHeight: tempDiv.scrollHeight
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = pageWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);

    const fileName = `鑑定書_${carSpec.name || '車両'}_${carSpec.chassisNumber?.slice(-4) || ''}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
  } finally {
    document.body.removeChild(tempDiv);
  }
}

// 鑑定書HTML生成
function createInspectionHTML(
  carSpec: CarSpec,
  partDefects: PartDefect[],
  inspectorReport: InspectorReportData,
  diagramImageData: string | null
): string {
  const defectMap: Record<string, string[]> = {};
  partDefects.forEach(pd => {
    defectMap[pd.part] = pd.defects.map(d => `${d.type}${d.level || ''}`);
  });

  const partLabels: Record<string, string> = {
    'front-bumper': 'Fバンパー',
    'hood': 'ボンネット',
    'front-glass': 'Fガラス',
    'roof': 'ルーフ',
    'right-front-fender': '右Fフェンダー',
    'right-front-door': '右Fドア',
    'right-rear-door': '右Rドア',
    'right-rear-fender': '右Rフェンダー',
    'rear-gate': 'Rゲート',
    'rear-bumper': 'Rバンパー',
    'left-rear-fender': '左Rフェンダー',
    'left-rear-door': '左Rドア',
    'left-front-door': '左Fドア',
    'left-front-fender': '左Fフェンダー',
    'left-step': '左ステップ',
    'right-step': '右ステップ'
  };

  const defectRows = Object.entries(defectMap)
    .map(([part, defects]) => `
      <div style="display: flex; border-bottom: 1px solid #e0e0e0; padding: 4px 0;">
        <div style="flex: 0 0 100px; font-size: 11px; color: #333; font-weight: 600;">${partLabels[part] || part}</div>
        <div style="flex: 1; font-size: 11px; color: #555;">${defects.join(', ')}</div>
      </div>
    `)
    .join('');

  return `
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
          <div style="margin-bottom: 10px;">
            <div style="font-size: 10px; color: #666; margin-bottom: 4px;">総合評価</div>
            <div style="font-size: 16px; font-weight: 700; color: #c9a961;">${inspectorReport.overallRating || '-'}</div>
          </div>
          <div style="margin-bottom: 10px;">
            <div style="font-size: 10px; color: #666; margin-bottom: 4px;">内装評価</div>
            <div style="font-size: 16px; font-weight: 700; color: #c9a961;">${inspectorReport.interiorRating || '-'}</div>
          </div>
          <div>
            <div style="font-size: 10px; color: #666; margin-bottom: 4px;">所見</div>
            <div style="font-size: 10px; color: #333; line-height: 1.6; white-space: pre-wrap;">${inspectorReport.content || '特記事項なし'}</div>
          </div>
        </div>

        <!-- 右カラム: 展開図 (2:2の比率) -->
        <div style="flex: 2; background: #f8f9fa; padding: 12px; border-radius: 8px; border: 2px solid #c9a961;">
          <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: 700; color: #1a1a2e; border-bottom: 2px solid #c9a961; padding-bottom: 6px;">車両展開図</h3>
          ${diagramImageData ? `<img src="${diagramImageData}" style="width: 100%; height: auto; border-radius: 4px;" />` : '<div style="text-align: center; padding: 40px; color: #999;">展開図なし</div>'}
        </div>
      </div>

      <!-- 車両基本情報 -->
      <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; margin-bottom: 16px; border: 2px solid #c9a961;">
        <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: 700; color: #1a1a2e; border-bottom: 2px solid #c9a961; padding-bottom: 6px;">車両基本情報</h3>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
          <div><span style="font-size: 10px; color: #666;">車名</span><div style="font-size: 12px; font-weight: 600; color: #333; margin-top: 2px;">${carSpec.name || '-'}</div></div>
          <div><span style="font-size: 10px; color: #666;">型式</span><div style="font-size: 12px; font-weight: 600; color: #333; margin-top: 2px;">${carSpec.model || '-'}</div></div>
          <div><span style="font-size: 10px; color: #666;">グレード</span><div style="font-size: 12px; font-weight: 600; color: #333; margin-top: 2px;">${carSpec.grade || '-'}</div></div>
          <div><span style="font-size: 10px; color: #666;">年式</span><div style="font-size: 12px; font-weight: 600; color: #333; margin-top: 2px;">${carSpec.year || '-'}</div></div>
          <div><span style="font-size: 10px; color: #666;">車体番号</span><div style="font-size: 12px; font-weight: 600; color: #333; margin-top: 2px;">${carSpec.chassisNumber || '-'}</div></div>
          <div><span style="font-size: 10px; color: #666;">走行距離</span><div style="font-size: 12px; font-weight: 600; color: #333; margin-top: 2px;">${carSpec.mileage || '-'}km</div></div>
        </div>
      </div>

      <!-- 瑕疵一覧 -->
      <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; border: 2px solid #c9a961;">
        <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: 700; color: #1a1a2e; border-bottom: 2px solid #c9a961; padding-bottom: 6px;">瑕疵一覧</h3>
        ${defectRows || '<div style="text-align: center; padding: 20px; color: #999; font-size: 11px;">瑕疵なし</div>'}
      </div>

      <!-- 車両画像 -->
      ${carSpec.frontImage || carSpec.rearImage ? `
        <div style="margin-top: 16px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
          ${carSpec.frontImage ? `
            <div>
              <div style="font-size: 11px; font-weight: 600; color: #666; margin-bottom: 6px;">外装</div>
              <img src="${carSpec.frontImage}" style="width: 100%; height: auto; border-radius: 8px; border: 2px solid #c9a961;" />
            </div>
          ` : ''}
          ${carSpec.rearImage ? `
            <div>
              <div style="font-size: 11px; font-weight: 600; color: #666; margin-bottom: 6px;">内装</div>
              <img src="${carSpec.rearImage}" style="width: 100%; height: auto; border-radius: 8px; border: 2px solid #c9a961;" />
            </div>
          ` : ''}
        </div>
      ` : ''}

      <!-- フッター -->
      <div style="margin-top: 20px; padding-top: 12px; border-top: 2px solid #c9a961; text-align: center;">
        <div style="font-size: 10px; color: #666;">鑑定日: ${new Date().toLocaleDateString('ja-JP')}</div>
        <div style="font-size: 9px; color: #999; margin-top: 4px;">この鑑定書は専門検査員による詳細検査に基づいて発行されています</div>
      </div>
    </div>
  `;
}
