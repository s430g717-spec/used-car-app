import { useState } from 'react';
import { CarEvaluationForm } from './components/CarEvaluationForm';
import { EvaluationResult } from './components/EvaluationResult';
import { EvaluationHistory } from './components/EvaluationHistory';
import { CarPartSelector } from './components/CarPartSelector';
import { AppraisalReportLuxury } from './components/AppraisalReportLuxury';
import { InvoiceReportProfessional } from './components/InvoiceReportProfessional';
import { AppraisalQRCode } from './components/AppraisalQRCode';
import { Car, FileText, Layout, Package } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';

export interface CarData {
  modelType: string; // 型式
  model: string; // 車種
  year: number;
  mileage: number;
  inspectorComments: string[]; // 検査員報告（フリーワード12個）
  overallScore: string; // 総合評価（S点、6点、5点、4.5点、4点、3.5点、3点）
  interiorScore: string; // 内装補助評価（A、B、C、D、E）
  maintenanceRecords: string;
  carImage?: string; // 車両画像（Base64）
}

export interface EvaluationScore {
  referenceScore: number; // 参考値（自動算出）
  overallScore: string; // 総合評価（S点、6点、5点、4.5点、4点、3.5点、3点）
  interiorScore: string; // 内装補助評価（A、B、C、D、E）
  breakdown: {
    age: number;
    mileage: number;
  };
  grade: string;
  timestamp: string;
  carData: CarData;
  partDefects?: any[]; // 瑕疵情報
}

export default function App() {
  const [currentEvaluation, setCurrentEvaluation] = useState<EvaluationScore | null>(null);
  const [history, setHistory] = useState<EvaluationScore[]>([]);
  const [reportEvaluation, setReportEvaluation] = useState<EvaluationScore | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [invoiceEvaluation, setInvoiceEvaluation] = useState<EvaluationScore | null>(null);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [qrCodeEvaluation, setQrCodeEvaluation] = useState<EvaluationScore | null>(null);
  const [qrCodeOpen, setQrCodeOpen] = useState(false);

  const handleEvaluationComplete = (evaluation: EvaluationScore) => {
    setCurrentEvaluation(evaluation);
    setHistory([evaluation, ...history]);
  };

  const handleViewReport = (evaluation: EvaluationScore) => {
    setReportEvaluation(evaluation);
    setReportOpen(true);
  };

  const handleViewInvoice = (evaluation: EvaluationScore) => {
    setInvoiceEvaluation(evaluation);
    setInvoiceOpen(true);
  };

  const handleQrCodeDisplay = (evaluation: EvaluationScore) => {
    setQrCodeEvaluation(evaluation);
    setQrCodeOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-3 rounded-lg">
              <Car className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-slate-900">中古車評価点自動算出システム</h1>
              <p className="text-slate-600 text-sm">Used Car Evaluation System</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="parts" className="w-full">
          <TabsList className="grid w-full max-w-3xl mx-auto grid-cols-3 mb-8">
            <TabsTrigger value="parts" className="flex items-center gap-2">
              <Layout className="w-4 h-4" />
              瑕疵入力
            </TabsTrigger>
            <TabsTrigger value="evaluation" className="flex items-center gap-2">
              <Car className="w-4 h-4" />
              評価入力
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              在庫管理
            </TabsTrigger>
          </TabsList>

          <TabsContent value="parts">
            <CarPartSelector />
          </TabsContent>

          <TabsContent value="evaluation">
            <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
              <div>
                <CarEvaluationForm 
                  onEvaluationComplete={handleEvaluationComplete}
                />
              </div>
              <div className="lg:sticky lg:top-8 h-fit">
                {currentEvaluation ? (
                  <EvaluationResult 
                    evaluation={currentEvaluation}
                    onViewReport={() => handleViewReport(currentEvaluation)}
                  />
                ) : (
                  <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
                    <Car className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">
                      車両情報を入力すると、評価結果がここに表示されます
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <EvaluationHistory 
              history={history}
              onViewReport={handleViewReport}
              onViewInvoice={handleViewInvoice}
              onQrCodeDisplay={handleQrCodeDisplay}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* 鑑定書ダイアログ */}
      <AppraisalReportLuxury
        open={reportOpen}
        onOpenChange={setReportOpen}
        evaluation={reportEvaluation}
      />

      {/* 請求書ダイアログ */}
      <InvoiceReportProfessional
        open={invoiceOpen}
        onOpenChange={setInvoiceOpen}
        evaluation={invoiceEvaluation}
      />

      {/* QRコードダイアログ */}
      <AppraisalQRCode
        open={qrCodeOpen}
        onOpenChange={setQrCodeOpen}
        evaluation={qrCodeEvaluation}
      />
    </div>
  );
}