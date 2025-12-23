/** @jsxImportSource react */
import { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { Camera, ScanLine, Upload, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { upsertItem, loadInventory } from "../lib/inventoryStore";
import type { InventoryItem } from "../lib/inventoryStore";
import { QRScanner } from "./QRScanner";
import { saveImageFromDataUrl, getImageDataUrl } from "../lib/idb";
import ResolvedImg from "./ResolvedImg";
import ImageCropDialog from "./ImageCropDialog";

type Specs = { year: string; carName: string; vin: string };

export default function VehicleSpecsInput() {
  const [specs, setSpecs] = useState<Specs>({ year: "", carName: "", vin: "" });
  const [carImage, setCarImage] = useState<string>("");
  const webcamRef = useRef<Webcam | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [targetId, setTargetId] = useState<string>("__new__");
  const [modelType, setModelType] = useState<string>("");
  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
  const [vinEmissions, setVinEmissions] = useState<string>("");
  const [vinSerial, setVinSerial] = useState<string>("");
  const [qrOpen, setQrOpen] = useState<boolean>(false);
  const [grade, setGrade] = useState<string>("");
  const [colorNo, setColorNo] = useState<string>("");
  const [cropOpen, setCropOpen] = useState<boolean>(false);
  const equipmentItems = [
    "サンルーフ",
    "レザーシート",
    "ナビ",
    "エアロ",
    "パワースライドドア",
    "カメラ",
    "TV",
    "リアモニター",
    "アルミ",
    "ヘッドライト",
    "サウンド",
    "AC",
    "ETC",
    "記録簿",
    "保証書",
    "取説",
    "ワンオーナー",
    "キーレス",
    "スペアキー",
    "安全装置",
  ];
  const [selectedEquipments, setSelectedEquipments] = useState<
    Record<string, boolean>
  >({});
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 40 }, (_, i) => String(currentYear - i));

  const toWareki = (y: number) => {
    if (!Number.isFinite(y)) return "";
    if (y >= 2019) return `R${y - 2018}`;
    if (y >= 1989) return `H${y - 1988}`;
    if (y >= 1926) return `S${y - 1925}`;
    return "";
  };

  useEffect(() => {
    setInventory(loadInventory());
  }, []);

  const MODEL_MAP: Array<{ pattern: RegExp; name: string }> = [
    { pattern: /^(ZVW|NHW|ZRE|NGX)/i, name: "プリウス/カローラ系" },
    { pattern: /^(E12|K13)/i, name: "ノート" },
    { pattern: /^(GRS|ARS)/i, name: "クラウン" },
    { pattern: /^(AXUH|MXUA)/i, name: "ハリアー" },
    { pattern: /^(ZC|ZD)/i, name: "スイフト" },
    { pattern: /^(GK|GR)/i, name: "フィット" },
    { pattern: /^[A-Z]{2,}\d{2,}/i, name: "該当候補あり" },
  ];

  useEffect(() => {
    const mt = modelType.trim();
    if (!mt) {
      setNameSuggestions([]);
      return;
    }
    const hits = MODEL_MAP.filter((m) => m.pattern.test(mt)).map((m) => m.name);
    setNameSuggestions(Array.from(new Set(hits)));
  }, [modelType]);

  const capture = () => {
    const shot = webcamRef.current?.getScreenshot();
    if (shot) compressAndSet(shot);
  };

  const preprocessImage = async (dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imageData.data;
        for (let i = 0; i < d.length; i += 4) {
          const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
          const contrasted = Math.min(
            255,
            Math.max(0, (gray - 128) * 1.4 + 128)
          );
          d[i] = d[i + 1] = d[i + 2] = contrasted;
        }
        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
      img.src = dataUrl;
    });
  };

  const extractFromText = (txt: string) => {
    const modelMatch = txt.match(/[A-Z]{2,}[A-Z]*-?[0-9]{2,}/i);
    const emissionsMatch = txt.match(/\b[0-9][A-Z]{2,3}\b/i);
    const serialMatch = txt.match(/\b[0-9]{6,8}\b/);
    return {
      modelType: modelMatch?.[0]?.toUpperCase() || "",
      vinEmissions: emissionsMatch?.[0]?.toUpperCase() || "",
      vinSerial: serialMatch?.[0] || "",
    };
  };

  const autoFillFromImage = async () => {
    if (!carImage) {
      alert("先に撮影または画像選択をしてください");
      return;
    }
    try {
      const { default: Tesseract } = await import("tesseract.js");
      const srcForOcr = carImage.startsWith("idb:")
        ? (await getImageDataUrl(carImage.slice(4))) || ""
        : carImage;
      const pre = await preprocessImage(srcForOcr);
      const result = await Tesseract.recognize(pre, "eng", {
        logger: () => {},
      });
      const {
        modelType: mtRec,
        vinEmissions: emRec,
        vinSerial: snRec,
      } = extractFromText(result.data.text || "");
      if (mtRec) setModelType(mtRec);
      if (emRec) setVinEmissions(emRec);
      if (snRec) setVinSerial(snRec);
      if (!mtRec && !emRec && !snRec)
        alert("OCRでは項目を特定できませんでした");
    } catch (e) {
      alert("OCRの解析に失敗しました");
    }
  };

  const handleQRScan = (data: any) => {
    // data: { modelType, model, year, mileage, vin }
    if (data?.modelType) setModelType(String(data.modelType).toUpperCase());
    if (data?.model) setSpecs((s) => ({ ...s, carName: data.model }));
    if (data?.year) setSpecs((s) => ({ ...s, year: String(data.year) }));
    if (data?.vin) {
      const parts = String(data.vin).split(/-/);
      if (parts.length >= 2) {
        setVinEmissions(parts[0].toUpperCase());
        setVinSerial(parts[1].replace(/[^0-9]/g, ""));
      }
    }
    if (data?.grade) setGrade(String(data.grade));
    if (data?.colorNo) setColorNo(String(data.colorNo).toUpperCase());
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => compressAndSet(String(reader.result));
    reader.readAsDataURL(file);
  };

  const compressAndSet = (dataUrl: string) => {
    const img = new Image();
    img.onload = async () => {
      const maxW = 1200;
      const scale = img.width > maxW ? maxW / img.width : 1;
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setCarImage(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      const out = canvas.toDataURL("image/jpeg", 0.8);
      try {
        const id = await saveImageFromDataUrl(out);
        setCarImage(`idb:${id}`);
      } catch {
        setCarImage(out);
      }
    };
    img.src = dataUrl;
  };

  const save = () => {
    const now = new Date().toISOString().slice(0, 10);
    const yearNum = parseInt(specs.year || `${new Date().getFullYear()}`);
    const mt = modelType.trim();
    if (mt && !/^[A-Za-z0-9-]+$/.test(mt)) {
      alert("型式は英数字とハイフンのみで入力してください");
      return;
    }
    let carNameFinal = specs.carName?.trim();
    if (!carNameFinal && nameSuggestions.length > 0) {
      carNameFinal = nameSuggestions[0];
      setSpecs((s) => ({ ...s, carName: carNameFinal! }));
    }

    const vinCombined = [vinEmissions.trim(), vinSerial.trim()]
      .filter(Boolean)
      .join("-");

    if (targetId !== "__new__") {
      const existing = inventory.find((i) => i.id === targetId);
      if (existing) {
        const nextEvaluation = {
          ...existing.evaluation,
          grade: grade || existing.evaluation?.grade || "",
          carData: {
            ...(existing.evaluation?.carData || {}),
            modelType: mt || (existing.evaluation?.carData?.modelType ?? ""),
            model: carNameFinal,
            year: yearNum,
            mileage: existing.evaluation?.carData?.mileage ?? 0,
            inspectorComments:
              existing.evaluation?.carData?.inspectorComments ?? [],
            maintenanceRecords:
              existing.evaluation?.carData?.maintenanceRecords ?? "",
            overallScore:
              existing.evaluation?.carData?.overallScore ??
              existing.evaluation?.overallScore ??
              "-",
            interiorScore:
              existing.evaluation?.carData?.interiorScore ??
              existing.evaluation?.interiorScore ??
              "-",
            carImage: carImage,
            vin: vinCombined || (existing.evaluation?.carData?.vin ?? ""),
            colorNo:
              colorNo || (existing.evaluation?.carData as any)?.colorNo || "",
            equipment:
              Object.keys(selectedEquipments).filter(
                (k) => selectedEquipments[k]
              ) ||
              ((existing.evaluation?.carData as any)?.equipment ?? []),
          },
        };
        upsertItem({ ...existing, evaluation: nextEvaluation });
        alert("諸元を保存し、既存在庫を更新しました");
        return;
      }
    }

    const id = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const evaluation = {
      referenceScore: 0,
      overallScore: "-",
      interiorScore: "-",
      breakdown: { age: 0, mileage: 0 },
      grade: grade || "",
      timestamp: new Date().toISOString(),
      carData: {
        modelType: mt,
        model: carNameFinal,
        year: yearNum,
        mileage: 0,
        inspectorComments: [],
        maintenanceRecords: "",
        overallScore: "-",
        interiorScore: "-",
        carImage: carImage,
        vin: vinCombined,
        colorNo: colorNo || "",
        equipment: Object.keys(selectedEquipments).filter(
          (k) => selectedEquipments[k]
        ),
      },
    };
    upsertItem({ id, date: now, evaluation, partDefects: [] });
    alert("諸元を保存し、新規在庫を作成しました");
  };

  return (
    <div className="max-w-3xl mx-auto section-card p-6 space-y-4">
      <h2 className="text-xl font-semibold text-slate-900">車両諸元入力</h2>
      <p className="text-sm text-slate-600">
        コーションプレートを撮影するか、手動入力してください
      </p>
      <div className="grid grid-cols-1 gap-4">
        <div className="sticky top-16 z-10 section-card p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" onClick={capture} className="gap-2">
              <Camera className="size-4" /> カメラ起動
            </Button>
            <Button
              variant="outline"
              onClick={autoFillFromImage}
              className="gap-2"
            >
              <ScanLine className="size-4" /> OCRで自動反映
            </Button>
            {carImage && (
              <Button
                variant="outline"
                onClick={() => setCropOpen(true)}
                className="gap-2"
              >
                <ScanLine className="size-4" /> OCR前に切り出し
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setQrOpen(true)}
              className="gap-2"
            >
              <ScanLine className="size-4" /> 車検証QR読取
            </Button>
            <label className="inline-flex items-center gap-2">
              <Upload className="size-4 text-slate-600" />
              <input
                className="file:mr-2 file:py-2 file:px-3 file:rounded-md file:border file:text-sm file:bg-slate-100 file:text-slate-700"
                type="file"
                accept="image/*"
                onChange={onFileChange}
              />
            </label>
            {carImage && (
              <Button
                variant="ghost"
                onClick={() => setCarImage("")}
                className="gap-2"
              >
                <Trash2 className="size-4" /> 削除
              </Button>
            )}
          </div>
          <div className="mt-2 text-xs text-slate-600">
            ※
            型式・車体番号・グレードを自動認識します（撮影画像からの自動反映は現状試験的対応）
          </div>
        </div>

        <label className="form-control">
          <span className="label text-sm font-medium text-slate-700">
            保存先在庫
          </span>
          <select
            className="input min-h-11 rounded-xl"
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
          >
            <option value="__new__">新規作成</option>
            {inventory.map((item) => (
              <option key={item.id} value={item.id}>
                {(item.evaluation?.carData?.model || "未設定") +
                  " (" +
                  item.date +
                  ")"}
              </option>
            ))}
          </select>
        </label>

        <label className="form-control">
          <span className="label text-sm font-medium text-slate-700">型式</span>
          <input
            className="input min-h-11 rounded-xl"
            value={modelType}
            onChange={(e) => setModelType(e.target.value.toUpperCase())}
            placeholder="例: ZRE212"
            inputMode="text"
            pattern="[A-Za-z0-9-]+"
            autoCapitalize="characters"
            autoCorrect="off"
          />
        </label>

        {nameSuggestions.length > 0 && (
          <label className="form-control">
            <span className="label text-sm font-medium text-slate-700">
              車名候補
            </span>
            <select
              className="input min-h-11 rounded-xl"
              value={specs.carName}
              onChange={(e) => setSpecs({ ...specs, carName: e.target.value })}
            >
              <option value="">選択してください</option>
              {nameSuggestions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="form-control">
          <span className="label text-sm font-medium text-slate-700">年式</span>
          <select
            className="input min-h-11 rounded-xl"
            value={specs.year}
            onChange={(e) => setSpecs({ ...specs, year: e.target.value })}
          >
            <option value="">-- 年式を選択 --</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {`${y} (${toWareki(Number(y))})`}
              </option>
            ))}
          </select>
          {specs.year && (
            <div className="mt-1 text-xs text-slate-600">
              和暦: {toWareki(Number(specs.year)) || "-"}
            </div>
          )}
        </label>

        <label className="form-control">
          <span className="label text-sm font-medium text-slate-700">車名</span>
          <input
            className="input min-h-11 rounded-xl"
            value={specs.carName}
            onChange={(e) => setSpecs({ ...specs, carName: e.target.value })}
            placeholder="例: カローラ"
          />
        </label>

        <div className="grid grid-cols-1 gap-2 section-card p-4">
          <label className="form-control">
            <span className="label text-sm font-medium text-slate-700">
              排ガス記号
            </span>
            <input
              className="input min-h-11 rounded-xl"
              value={vinEmissions}
              onChange={(e) => setVinEmissions(e.target.value.toUpperCase())}
              placeholder="例: 3BA"
              inputMode="text"
              pattern="[A-Za-z0-9]+"
              autoCapitalize="characters"
              autoCorrect="off"
            />
          </label>
          <label className="form-control">
            <span className="label text-sm font-medium text-slate-700">
              車体番号（ハイフン以下）
            </span>
            <input
              className="input min-h-11 rounded-xl"
              value={vinSerial}
              onChange={(e) =>
                setVinSerial(e.target.value.replace(/[^0-9]/g, ""))
              }
              placeholder="例: 1234567"
              inputMode="numeric"
              pattern="[0-9]+"
            />
          </label>
          <div className="mt-1">
            <div className="text-xs text-slate-500">組み合わせプレビュー</div>
            <div className="mt-1 font-mono text-base tracking-wider px-3 py-2 rounded-lg border border-slate-200 bg-slate-50">
              {vinEmissions || "___"}-{vinSerial || "______"}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 section-card p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="form-control">
              <span className="label text-sm font-medium text-slate-700">
                グレード
              </span>
              <input
                className="input min-h-11 rounded-xl"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="例: Z, G, RS等"
              />
            </label>
            <label className="form-control">
              <span className="label text-sm font-medium text-slate-700">
                カラーNo
              </span>
              <input
                className="input min-h-11 rounded-xl"
                value={colorNo}
                onChange={(e) => setColorNo(e.target.value.toUpperCase())}
                placeholder="例: 070, 202等"
                autoCapitalize="characters"
                autoCorrect="off"
              />
            </label>
          </div>
          <div>
            <div className="text-sm font-medium text-slate-700">
              装備チェック
            </div>
            <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
              {equipmentItems.map((eq) => (
                <label
                  key={eq}
                  className="flex items-center gap-2 rounded-lg border px-3 py-2"
                >
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={!!selectedEquipments[eq]}
                    onChange={(e) =>
                      setSelectedEquipments((prev) => ({
                        ...prev,
                        [eq]: e.target.checked,
                      }))
                    }
                  />
                  <span className="text-sm text-slate-700">{eq}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-sm font-medium text-slate-800">車体画像</div>
        <div className="grid grid-cols-1 gap-3">
          <div className="rounded-2xl border overflow-hidden bg-slate-50">
            <Webcam
              ref={webcamRef as any}
              audio={false}
              screenshotFormat="image/jpeg"
              className="w-full aspect-4/3 object-cover"
            />
          </div>
          {carImage && (
            <div className="rounded-2xl border overflow-hidden">
              <ResolvedImg
                src={carImage}
                alt="preview"
                className="w-full aspect-4/3 object-cover"
              />
            </div>
          )}
        </div>
        <div className="text-xs text-slate-500">
          ※
          型式・車体番号・グレードを自動認識します（撮影画像からの自動反映は将来対応）
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          variant="default"
          onClick={save}
          className="min-h-11 rounded-xl px-4"
        >
          保存
        </Button>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-slate-700">
          最近の在庫（5件）
        </h3>
        <div className="mt-2 grid grid-cols-1 gap-2">
          {inventory.slice(0, 5).map((i) => (
            <div
              key={i.id}
              className="rounded-lg border px-3 py-2 text-sm flex items-center justify-between"
            >
              <div>
                <div className="font-medium">
                  {i.evaluation?.carData?.model || "未設定"}
                </div>
                <div className="text-slate-600">
                  型式: {i.evaluation?.carData?.modelType || "-"}
                </div>
              </div>
              <div className="text-right">
                <div className="text-slate-600">
                  VIN: {i.evaluation?.carData?.vin || "-"}
                </div>
                <div className="text-slate-500 text-xs">{i.date}</div>
              </div>
            </div>
          ))}
          {inventory.length === 0 && (
            <div className="text-slate-500 text-sm">在庫がまだありません。</div>
          )}
        </div>
      </div>

      {/* QR Scanner Modal */}
      <QRScanner open={qrOpen} onOpenChange={setQrOpen} onScan={handleQRScan} />

      {/* Crop Dialog */}
      {carImage && (
        <ImageCropDialog
          open={cropOpen}
          onOpenChange={setCropOpen}
          src={carImage}
          onCropped={(newSrc) => setCarImage(newSrc)}
        />
      )}
    </div>
  );
}
