// @ts-nocheck
/** @jsxImportSource react */
import { useMemo, useState } from "react";
import { parts as diagramParts } from "../lib/parts";
import ResolvedImg from "./ResolvedImg";
import TouchImageViewer from "./TouchImageViewer";
import DocumentsReport from "./DocumentsReport";
import AppraisalReport from "./AppraisalReport";

export default function InventoryDetailDialog({
  open,
  onOpenChange,
  item,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  item: any | null;
}) {
  if (!open || !item) return null;
  const close = () => onOpenChange(false);
  const car = item.evaluation?.carData ?? {};
  const [docsOpen, setDocsOpen] = useState(false);
  const [appraisalOpen, setAppraisalOpen] = useState(false);
  const defects = (item.partDefects ?? []) as Array<{
    partId: string;
    list: Array<{ type: string; level?: string }>;
    photos?: string[];
  }>;

  const grouped = useMemo(() => {
    const byPart: Record<
      string,
      { title: string; items: string[]; photos: string[] }
    > = {};
    defects.forEach((pd) => {
      const part = diagramParts.find((p) => p.id === pd.partId);
      const title = part?.name ?? pd.partId;
      const items = (pd.list || []).map((d) =>
        d.level ? `${d.type}${d.level}` : d.type
      );
      const photos = Array.isArray(pd.photos) ? pd.photos : [];
      byPart[pd.partId] = {
        title,
        items,
        photos,
      };
    });
    return byPart;
  }, [defects]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div className="font-semibold text-slate-900">在庫詳細</div>
          <div className="flex items-center gap-2">
            <button
              className="btn btn-primary"
              onClick={() => setAppraisalOpen(true)}
            >
              鑑定書PDF
            </button>
            <button
              className="btn btn-outline"
              onClick={() => setDocsOpen(true)}
            >
              書類PDF
            </button>
            <button className="btn btn-ghost" onClick={close}>
              閉じる
            </button>
          </div>
        </div>
        <div className="p-6 space-y-6">
          {/* 車両基本情報 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="section-card p-4">
              <div className="text-sm text-slate-600">
                車名 / 型式 / 年式 / 走行距離
              </div>
              <div className="mt-1 text-slate-900 text-sm">
                {(car.model ?? "-") + " / " + (car.modelType ?? "-")}
              </div>
              <div className="text-slate-900 text-sm">
                {(car.year ?? "-") + " / " + (car.mileage ?? "-") + " km"}
              </div>
              <div className="text-slate-600 text-xs">
                VIN: {car.vin ?? "-"}
              </div>
            </div>
            <div className="section-card p-4">
              <div className="text-sm text-slate-600">グレード / カラーNo</div>
              <div className="mt-1 text-slate-900 text-sm">
                {(item.evaluation?.grade ?? "-") +
                  " / " +
                  ((car as any).colorNo ?? "-")}
              </div>
              {Array.isArray((car as any).equipment) &&
                (car as any).equipment.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(car as any).equipment.map((eq: string) => (
                      <span key={eq} className="badge">
                        {eq}
                      </span>
                    ))}
                  </div>
                )}
            </div>
          </div>

          {/* 瑕疵一覧 */}
          <div className="section-card p-4">
            <div className="text-sm font-medium text-slate-700">瑕疵一覧</div>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.keys(grouped).length === 0 && (
                <div className="text-slate-500 text-sm">
                  瑕疵登録がありません。
                </div>
              )}
              {Object.entries(grouped).map(([pid, info]) => (
                <DefectCard
                  key={pid}
                  title={info.title}
                  items={info.items}
                  photos={info.photos}
                />
              ))}
            </div>
          </div>

          {/* 必要書類 */}
          <div className="section-card p-4">
            <div className="text-sm font-medium text-slate-700">必要書類</div>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
              {(!Array.isArray(item.documents) ||
                item.documents.length === 0) && (
                <div className="text-slate-500 text-sm">
                  登録された書類はありません。
                </div>
              )}
              {Array.isArray(item.documents) &&
                item.documents.map((d: any, idx: number) => (
                  <DocumentCard key={idx} doc={d} />
                ))}
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t flex items-center justify-end gap-2">
          <button className="btn btn-ghost" onClick={close}>
            閉じる
          </button>
        </div>
      </div>
      <AppraisalReport
        open={appraisalOpen}
        onOpenChange={setAppraisalOpen}
        item={item}
      />
      <DocumentsReport open={docsOpen} onOpenChange={setDocsOpen} item={item} />
    </div>
  );
}

function DefectCard({
  title,
  items,
  photos,
}: {
  title: string;
  items: string[];
  photos: string[];
}) {
  const [viewer, setViewer] = useState<string | null>(null);
  return (
    <div className="section-card p-3 space-y-2">
      <div className="text-sm font-medium text-slate-800">{title}</div>
      <div className="flex flex-wrap gap-1">
        {items.map((t, i) => (
          <span key={i} className="badge">
            {t}
          </span>
        ))}
        {photos.length > 0 && <span className="badge">📷×{photos.length}</span>}
      </div>
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.slice(0, 6).map((src, idx) => (
            <button key={idx} onClick={() => setViewer(src)} className="block">
              <ResolvedImg
                src={src}
                alt={title}
                className="w-full aspect-4/3 object-cover rounded-md border"
              />
            </button>
          ))}
        </div>
      )}
      {viewer && (
        <TouchImageViewer
          src={viewer}
          title={title}
          onClose={() => setViewer(null)}
        />
      )}
    </div>
  );
}

function DocumentCard({
  doc,
}: {
  doc: {
    type?: string;
    key?: string;
    status?: string;
    images?: string[];
    note?: string;
  };
}) {
  const [viewer, setViewer] = useState<string | null>(null);
  const title = doc.type || doc.key || "書類";
  const images = Array.isArray(doc.images) ? doc.images : [];
  return (
    <div className="section-card p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-slate-800">{title}</div>
        <div className="badge">{doc.status || "未設定"}</div>
      </div>
      {doc.note && (
        <div className="text-xs text-slate-600 whitespace-pre-wrap">
          {doc.note}
        </div>
      )}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.slice(0, 6).map((src, idx) => (
            <button key={idx} onClick={() => setViewer(src)} className="block">
              <ResolvedImg
                src={src}
                alt={title}
                className="w-full aspect-4/3 object-cover rounded-md border"
              />
            </button>
          ))}
        </div>
      )}
      {viewer && (
        <TouchImageViewer
          src={viewer}
          title={title}
          onClose={() => setViewer(null)}
        />
      )}
    </div>
  );
}
