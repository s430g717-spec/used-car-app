import React from 'react';
import jsPDF from 'jspdf';
import { CarSpec } from './SpecInput';
import { PartDefect } from '../CarPartSelector';
import { InspectorReportData } from './InspectorReport';

interface PDFExportProps {
  carSpec: CarSpec;
  partDefects: PartDefect[];
  inspectorReport: InspectorReportData | string;
  onExport?: () => void;
}

export function PDFExport({ carSpec, partDefects, inspectorReport, onExport }: PDFExportProps) {
  const [isGenerating, setIsGenerating] = React.useState(false);

  // 請求書ページ生成関数
  const addInvoicePage = async (pdf: jsPDF, carSpec: CarSpec, pageWidth: number, pageHeight: number) => {
    const today = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' });
    const unitPrice = 1650;
    const quantity = 1;
    const subtotal = unitPrice * quantity;
    const tax = Math.floor(subtotal * 0.1);
    const total = subtotal + tax;

    // ヘッダー
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('請求書', pageWidth / 2, 25, { align: 'center' });

    // 発行日
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`発行日: ${today}`, 15, 40);

    // 宛名
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('御中', 15, 55);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');

    // 請求元情報
    pdf.text('株式会社カーインスペクション', pageWidth - 15, 40, { align: 'right' });
    pdf.text('〒000-0000 東京都○○区○○', pageWidth - 15, 47, { align: 'right' });
    pdf.text('TEL: 00-0000-0000', pageWidth - 15, 54, { align: 'right' });

    // 車両情報
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('【車両情報】', 15, 70);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text(`車名: ${carSpec.name || '-'}`, 15, 77);
    pdf.text(`車体番号: ${carSpec.chassisNumber || '-'}`, 15, 84);
    pdf.text(`型式: ${carSpec.model || '-'}`, 15, 91);

    // 明細表
    const tableTop = 105;
    const colWidths = [15, 80, 30, 30, 35];
    const rowHeight = 8;

    // 表ヘッダー
    pdf.setFillColor(26, 26, 46);
    pdf.rect(15, tableTop, colWidths.reduce((a, b) => a + b, 0), rowHeight, 'F');
    pdf.setTextColor(201, 169, 97);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    
    let xPos = 15;
    pdf.text('No.', xPos + 5, tableTop + 5.5);
    xPos += colWidths[0];
    pdf.text('品目', xPos + 5, tableTop + 5.5);
    xPos += colWidths[1];
    pdf.text('数量', xPos + 10, tableTop + 5.5);
    xPos += colWidths[2];
    pdf.text('単価', xPos + 10, tableTop + 5.5);
    xPos += colWidths[3];
    pdf.text('金額', xPos + 10, tableTop + 5.5);

    // 明細行
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'normal');
    const dataTop = tableTop + rowHeight;
    
    xPos = 15;
    pdf.text('1', xPos + 5, dataTop + 5.5);
    xPos += colWidths[0];
    pdf.text('車両鑑定料', xPos + 5, dataTop + 5.5);
    xPos += colWidths[1];
    pdf.text(`${quantity}`, xPos + 15, dataTop + 5.5, { align: 'right' });
    xPos += colWidths[2];
    pdf.text(`¥${unitPrice.toLocaleString()}`, xPos + 25, dataTop + 5.5, { align: 'right' });
    xPos += colWidths[3];
    pdf.text(`¥${subtotal.toLocaleString()}`, xPos + 30, dataTop + 5.5, { align: 'right' });

    // 罫線
    pdf.setDrawColor(200, 200, 200);
    for (let i = 0; i <= 2; i++) {
      pdf.line(15, tableTop + (i * rowHeight), 15 + colWidths.reduce((a, b) => a + b, 0), tableTop + (i * rowHeight));
    }
    
    xPos = 15;
    for (let i = 0; i <= colWidths.length; i++) {
      pdf.line(xPos, tableTop, xPos, tableTop + (2 * rowHeight));
      if (i < colWidths.length) xPos += colWidths[i];
    }

    // 合計欄
    const summaryTop = dataTop + rowHeight + 10;
    const summaryX = pageWidth - 80;
    
    pdf.setFont('helvetica', 'normal');
    pdf.text('小計:', summaryX, summaryTop);
    pdf.text(`¥${subtotal.toLocaleString()}`, summaryX + 50, summaryTop, { align: 'right' });
    
    pdf.text('消費税(10%):', summaryX, summaryTop + 7);
    pdf.text(`¥${tax.toLocaleString()}`, summaryX + 50, summaryTop + 7, { align: 'right' });
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('合計金額:', summaryX, summaryTop + 17);
    pdf.text(`¥${total.toLocaleString()}`, summaryX + 50, summaryTop + 17, { align: 'right' });

    // フッター
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(100, 100, 100);
    pdf.text('上記の通り、ご請求申し上げます。', 15, summaryTop + 35);
    pdf.text('お振込先: ○○銀行 ○○支店 普通 1234567', 15, pageHeight - 20);
  };

  const generateInvoicePDF = async () => {
    setIsGenerating(true);
    try {
      // A4サイズ (210mm x 297mm)
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;
      
      // 請求書ページを追加
      await addInvoicePage(pdf, carSpec, pageWidth, pageHeight);
      
      // ファイル名生成
      const fileName = `請求書_${carSpec.name || '車両'}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      if (onExport) onExport();
      alert('請求書PDFを保存しました');
    } catch (error) {
      console.error('PDF生成エラー:', error);
      alert(`PDF生成に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const unitPrice = 1650;
  const quantity = 1;
  const subtotal = unitPrice * quantity;
  const tax = Math.floor(subtotal * 0.1);
  const total = subtotal + tax;

  return (
    <div style={{ padding: 20, background: 'linear-gradient(to bottom, #f8f9fa 0%, #e9ecef 100%)', minHeight: '100vh' }}>
      {/* 請求書出力ボタン */}
      <button
        onClick={generateInvoicePDF}
        disabled={isGenerating}
        style={{
          width: '100%',
          maxWidth: 800,
          margin: '0 auto 24px',
          display: 'block',
          padding: 18,
          borderRadius: 12,
          border: '3px solid #3b82f6',
          background: isGenerating 
            ? 'linear-gradient(135deg, #6c757d 0%, #495057 100%)' 
            : 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
          fontSize: 18,
          fontWeight: 900,
          color: '#fff',
          cursor: isGenerating ? 'not-allowed' : 'pointer',
          boxShadow: isGenerating 
            ? '0 4px 12px rgba(108,117,125,0.3)'
            : '0 6px 20px rgba(59,130,246,0.4)',
          textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
          letterSpacing: 2,
          transition: 'all 0.3s ease'
        }}
      >
        {isGenerating ? '⏳ 請求書生成中...' : '📋 請求書をPDF出力'}
      </button>

      {/* 請求書プレビュー */}
      <div
        style={{
          maxWidth: 800,
          margin: '0 auto',
          background: '#fff',
          padding: 40,
          borderRadius: 12,
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          fontFamily: '"Noto Sans JP", "Yu Gothic", "Meiryo", sans-serif'
        }}
      >
        <h2 style={{ fontSize: 24, fontWeight: 700, textAlign: 'center', marginBottom: 24, color: '#1e40af' }}>
          請求書プレビュー
        </h2>

        <div style={{ marginBottom: 20, padding: 16, background: '#f8f9fa', borderRadius: 8 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#333' }}>車両情報</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, fontSize: 14 }}>
            <div><span style={{ color: '#666' }}>車名:</span> <strong>{carSpec.name || '-'}</strong></div>
            <div><span style={{ color: '#666' }}>型式:</span> <strong>{carSpec.model || '-'}</strong></div>
            <div><span style={{ color: '#666' }}>車体番号:</span> <strong>{carSpec.chassisNumber || '-'}</strong></div>
            <div><span style={{ color: '#666' }}>年式:</span> <strong>{carSpec.year || '-'}</strong></div>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#333' }}>請求明細</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#1e40af', color: '#fff' }}>
                <th style={{ padding: 10, textAlign: 'left', fontSize: 14 }}>品目</th>
                <th style={{ padding: 10, textAlign: 'center', fontSize: 14 }}>数量</th>
                <th style={{ padding: 10, textAlign: 'right', fontSize: 14 }}>単価</th>
                <th style={{ padding: 10, textAlign: 'right', fontSize: 14 }}>金額</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: 10, fontSize: 14 }}>車両鑑定料</td>
                <td style={{ padding: 10, textAlign: 'center', fontSize: 14 }}>{quantity}</td>
                <td style={{ padding: 10, textAlign: 'right', fontSize: 14 }}>¥{unitPrice.toLocaleString()}</td>
                <td style={{ padding: 10, textAlign: 'right', fontSize: 14 }}>¥{subtotal.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ textAlign: 'right', padding: 16, background: '#f8f9fa', borderRadius: 8 }}>
          <div style={{ marginBottom: 8, fontSize: 14 }}>
            <span style={{ color: '#666' }}>小計:</span> <strong>¥{subtotal.toLocaleString()}</strong>
          </div>
          <div style={{ marginBottom: 12, fontSize: 14 }}>
            <span style={{ color: '#666' }}>消費税(10%):</span> <strong>¥{tax.toLocaleString()}</strong>
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#1e40af' }}>
            <span>合計金額:</span> <span>¥{total.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
