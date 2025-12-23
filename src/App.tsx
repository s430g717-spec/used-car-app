// @ts-nocheck
/** @jsxImportSource react */
import { useState } from "react";
// import { CarEvaluationForm } from "./components/CarEvaluationForm";
import EvaluationInput from "./components/EvaluationInput";
import { EvaluationResult } from "./components/EvaluationResult";
import { EvaluationHistory } from "./components/EvaluationHistory";
import { CarPartSelector } from "./components/CarPartSelector";
import { AppraisalReportLuxury } from "./components/AppraisalReportLuxury";
import { InvoiceReportProfessional } from "./components/InvoiceReportProfessional";
import { AppraisalQRCode } from "./components/AppraisalQRCode";
import { Car, FileText, Layout, Package, List } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import VehicleSpecsInput from "./components/VehicleSpecsInput";
import InventoryList from "./components/InventoryList";
import InventoryEditDialog from "./components/InventoryEditDialog";
import { loadInventory, upsertItem } from "./lib/inventoryStore";
import InventoryDetailDialog from "./components/InventoryDetailDialog";
import DocumentChecklist from "./components/DocumentChecklist";
import ImageStorageToolsDialog from "./components/ImageStorageToolsDialog";
import BackupToolsDialog from "./components/BackupToolsDialog";
import PWAInstallButton from "./components/PWAInstallButton";

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
  const [tab, setTab] = useState<string>("parts");
  const [currentEvaluation, setCurrentEvaluation] =
    useState<EvaluationScore | null>(null);
  const [history, setHistory] = useState<EvaluationScore[]>([]);
  const [reportEvaluation, setReportEvaluation] =
    useState<EvaluationScore | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [invoiceEvaluation, setInvoiceEvaluation] =
    useState<EvaluationScore | null>(null);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [qrCodeEvaluation, setQrCodeEvaluation] =
    useState<EvaluationScore | null>(null);
  const [qrCodeOpen, setQrCodeOpen] = useState(false);
  const [partDefects, setPartDefects] = useState<any[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<any | null>(null);
  const [imgToolsOpen, setImgToolsOpen] = useState(false);
  const [backupOpen, setBackupOpen] = useState(false);

  const openSampleReport = () => {
    const sample: EvaluationScore = {
      referenceScore: 0,
      overallScore: "4.5",
      interiorScore: "B",
      breakdown: { age: 0, mileage: 0 },
      grade: "",
      timestamp: new Date().toISOString(),
      carData: {
        modelType: "ZRE212",
        model: "カローラ",
        year: 2021,
        mileage: 32500,
        inspectorComments: ["内外装良好", "タイヤ7分山", "記録簿あり"],
        overallScore: "4.5",
        interiorScore: "B",
        maintenanceRecords: "定期点検整備記録簿",
      },
    };
    const sampleDefects = [
      { partId: "left-f-door", list: [{ type: "A", level: "2" }] },
      { partId: "front-bumper", list: [{ type: "U", level: "1" }] },
      { partId: "roof", list: [{ type: "W" }] },
    ];
    setReportEvaluation(sample);
    setPartDefects(sampleDefects as any);
    setReportOpen(true);
  };

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
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-3 rounded-lg">
                <Car className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-slate-900">中古車評価点自動算出システム</h1>
                <p className="text-slate-600 text-sm">
                  Used Car Evaluation System
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="btn btn-primary hidden sm:inline-flex gap-2"
                onClick={openSampleReport}
              >
                <FileText className="w-4 h-4" /> サンプル鑑定書
              </button>
              <PWAInstallButton className="btn btn-outline hidden sm:inline-flex" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid w-full max-w-4xl mx-auto grid-cols-5 mb-8">
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
            <TabsTrigger value="specs" className="flex items-center gap-2">
              <List className="w-4 h-4" />
              諸元入力
            </TabsTrigger>
            <TabsTrigger value="docs" className="flex items-center gap-2">
              <List className="w-4 h-4" />
              書類
            </TabsTrigger>
          </TabsList>

          <TabsContent value="parts">
            <CarPartSelector onDefectsChange={setPartDefects} />
          </TabsContent>

          <TabsContent value="evaluation">
            <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
              <div>
                <EvaluationInput />
              </div>
              <div className="lg:sticky lg:top-8 h-fit">
                {currentEvaluation ? (
                  <EvaluationResult
                    evaluation={currentEvaluation}
                    onViewReport={() => handleViewReport(currentEvaluation)}
                  />
                ) : (
                  <div className="section-card p-12 text-center">
                    <Car className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">
                      評価入力タブから評価を選択してください
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <div className="space-y-6">
              <EvaluationHistory
                history={history}
                onViewReport={handleViewReport}
                onViewInvoice={handleViewInvoice}
                onQrCodeDisplay={handleQrCodeDisplay}
              />
              <div className="flex justify-end">
                <button
                  className="btn btn-outline"
                  onClick={() => setImgToolsOpen(true)}
                >
                  画像ストレージ管理
                </button>
                <button
                  className="btn btn-outline ml-2"
                  onClick={() => setBackupOpen(true)}
                >
                  バックアップ / 復元
                </button>
              </div>
              <InventoryList
                onViewReport={(item) => {
                  if (item.evaluation) {
                    setReportEvaluation(item.evaluation as EvaluationScore);
                    setReportOpen(true);
                    setPartDefects(item.partDefects ?? []);
                  } else if (currentEvaluation) {
                    const ev: EvaluationScore = {
                      ...currentEvaluation,
                      carData: {
                        ...currentEvaluation.carData,
                        model: item.carName,
                      },
                    };
                    handleViewReport(ev);
                  }
                }}
                onViewInvoice={(item) => {
                  if (item.evaluation) {
                    setInvoiceEvaluation(item.evaluation as EvaluationScore);
                    setInvoiceOpen(true);
                  } else if (currentEvaluation) {
                    const ev: EvaluationScore = {
                      ...currentEvaluation,
                      carData: {
                        ...currentEvaluation.carData,
                        model: item.carName,
                      },
                    };
                    handleViewInvoice(ev);
                  }
                }}
                onEdit={(item) => {
                  setEditItem({
                    id: item.id,
                    date: item.date,
                    evaluation: item.evaluation,
                    partDefects: item.partDefects ?? [],
                  });
                  setEditOpen(true);
                }}
                onApplyDefects={(id) => {
                  const persisted = loadInventory();
                  const found = persisted.find((i) => i.id === id);
                  if (!found) {
                    alert(
                      "この在庫はサンプルです。諸元入力から保存した在庫に対して反映してください。"
                    );
                    return;
                  }
                  const updated = {
                    ...found,
                    partDefects: partDefects ?? [],
                  };
                  upsertItem(updated);
                  alert("現在の瑕疵を在庫へ反映しました");
                }}
                onViewDetail={(item) => {
                  setDetailItem({
                    id: item.id,
                    date: item.date,
                    evaluation: item.evaluation,
                    partDefects: item.partDefects ?? [],
                  });
                  setDetailOpen(true);
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="specs">
            <VehicleSpecsInput />
          </TabsContent>

          <TabsContent value="docs">
            <DocumentChecklist />
          </TabsContent>
        </Tabs>
      </main>

      {/* モバイル固定ボトムナビ */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-t md:hidden">
        <div className="grid grid-cols-5">
          <button
            className={`py-3 text-xs ${
              tab === "parts"
                ? "text-slate-900 font-semibold"
                : "text-slate-600"
            }`}
            onClick={() => setTab("parts")}
          >
            瑕疵
          </button>
          <button
            className={`py-3 text-xs ${
              tab === "evaluation"
                ? "text-slate-900 font-semibold"
                : "text-slate-600"
            }`}
            onClick={() => setTab("evaluation")}
          >
            評価
          </button>
          <button
            className={`py-3 text-xs ${
              tab === "history"
                ? "text-slate-900 font-semibold"
                : "text-slate-600"
            }`}
            onClick={() => setTab("history")}
          >
            在庫
          </button>
          <button
            className={`py-3 text-xs ${
              tab === "specs"
                ? "text-slate-900 font-semibold"
                : "text-slate-600"
            }`}
            onClick={() => setTab("specs")}
          >
            諸元
          </button>
          <button
            className={`py-3 text-xs ${
              tab === "docs" ? "text-slate-900 font-semibold" : "text-slate-600"
            }`}
            onClick={() => setTab("docs")}
          >
            書類
          </button>
        </div>
      </nav>

      {/* 鑑定書ダイアログ */}
      <AppraisalReportLuxury
        open={reportOpen}
        onOpenChange={setReportOpen}
        evaluation={reportEvaluation}
        partDefects={partDefects}
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

      {/* 在庫編集ダイアログ */}
      <InventoryEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        item={editItem}
      />

      {/* 在庫詳細ダイアログ */}
      <InventoryDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        item={detailItem}
      />

      {/* 画像ストレージ管理ダイアログ */}
      <ImageStorageToolsDialog
        open={imgToolsOpen}
        onOpenChange={setImgToolsOpen}
      />
      {/* バックアップダイアログ */}
      <BackupToolsDialog open={backupOpen} onOpenChange={setBackupOpen} />
    </div>
  );
}
