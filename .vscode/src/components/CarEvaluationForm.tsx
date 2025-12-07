import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { Calculator, QrCode, Camera, Image, Info } from 'lucide-react';
import { CarData, EvaluationScore } from '../App';
import { QRScanner } from './QRScanner';
import { CameraCapture } from './CameraCapture';
import { 
  getMaxAppraisalScore, 
  calculateElapsedMonths, 
  getScoreDescription,
  getScoreCriteria,
  type AppraisalScore as AppraisalScoreType,
  type InteriorRank
} from '../utils/appraisalLogic';

interface CarEvaluationFormProps {
  onEvaluationComplete: (evaluation: EvaluationScore) => void;
}

export function CarEvaluationForm({ onEvaluationComplete }: CarEvaluationFormProps) {
  const [formData, setFormData] = useState<CarData>({
    modelType: '',
    model: '',
    year: new Date().getFullYear(),
    mileage: 0,
    inspectorComments: Array(12).fill(''),
    overallScore: 'S点',
    interiorScore: 'A',
    maintenanceRecords: 'complete',
    carImage: undefined,
  });

  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);

  const calculateReferenceScore = (): number => {
    const currentYear = new Date().getFullYear();
    const carAge = currentYear - formData.year;

    // Age score (0-50 points)
    let ageScore = 50;
    if (carAge <= 3) ageScore = 50;
    else if (carAge <= 5) ageScore = 45;
    else if (carAge <= 7) ageScore = 38;
    else if (carAge <= 10) ageScore = 30;
    else if (carAge <= 15) ageScore = 20;
    else ageScore = 10;

    // Mileage score (0-50 points)
    let mileageScore = 50;
    if (formData.mileage <= 30000) mileageScore = 50;
    else if (formData.mileage <= 50000) mileageScore = 45;
    else if (formData.mileage <= 70000) mileageScore = 38;
    else if (formData.mileage <= 100000) mileageScore = 30;
    else if (formData.mileage <= 150000) mileageScore = 20;
    else mileageScore = 10;

    return Math.round(ageScore + mileageScore);
  };

  // 新しい評価ロジックに基づく推奨評価点を計算
  const getRecommendedScore = (): AppraisalScoreType => {
    const elapsedMonths = calculateElapsedMonths(formData.year);
    const interiorRank = formData.interiorScore as InteriorRank;
    
    // 修復歴の有無（現時点では常にfalse、将来的に追加可能）
    const isRepaired = false;
    
    // 外装部品の交換歴（現時点では常にfalse、将来的に追加可能）
    const hasExteriorReplacement = false;
    
    return getMaxAppraisalScore(
      formData.mileage,
      elapsedMonths,
      isRepaired,
      interiorRank,
      hasExteriorReplacement
    );
  };

  const handleQRScan = (data: any) => {
    setFormData({
      ...formData,
      modelType: data.modelType || formData.modelType,
      model: data.model || formData.model,
      year: data.year || formData.year,
      mileage: data.mileage || formData.mileage,
    });
  };

  const handleImageCapture = (imageData: string) => {
    setFormData({
      ...formData,
      carImage: imageData,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const referenceScore = calculateReferenceScore();
    const currentYear = new Date().getFullYear();
    const carAge = currentYear - formData.year;

    let ageScore = 50;
    if (carAge <= 3) ageScore = 50;
    else if (carAge <= 5) ageScore = 45;
    else if (carAge <= 7) ageScore = 38;
    else if (carAge <= 10) ageScore = 30;
    else if (carAge <= 15) ageScore = 20;
    else ageScore = 10;

    let mileageScore = 50;
    if (formData.mileage <= 30000) mileageScore = 50;
    else if (formData.mileage <= 50000) mileageScore = 45;
    else if (formData.mileage <= 70000) mileageScore = 38;
    else if (formData.mileage <= 100000) mileageScore = 30;
    else if (formData.mileage <= 150000) mileageScore = 20;
    else mileageScore = 10;

    // Grade based on overall score
    let grade = 'S';
    const scoreMap: { [key: string]: string } = {
      'S点': 'S (極上)',
      '6点': 'A (優良)',
      '5点': 'B (良好)',
      '4.5点': 'C (普通)',
      '4点': 'D (要注意)',
      '3.5点': 'E (不良)',
      '3点': 'F (不可)',
    };
    grade = scoreMap[formData.overallScore] || 'S (極上)';

    const evaluation: EvaluationScore = {
      referenceScore,
      overallScore: formData.overallScore,
      interiorScore: formData.interiorScore,
      breakdown: {
        age: Math.round(ageScore),
        mileage: Math.round(mileageScore),
      },
      grade,
      timestamp: new Date().toISOString(),
      carData: formData,
    };

    onEvaluationComplete(evaluation);
  };

  const updateComment = (index: number, value: string) => {
    const newComments = [...formData.inspectorComments];
    newComments[index] = value;
    setFormData({ ...formData, inspectorComments: newComments });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>車両情報入力</CardTitle>
          <CardDescription>評価対象の車両情報を入力してください</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* QRコード・カメラボタン */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setQrScannerOpen(true)}
                className="flex-1"
              >
                <QrCode className="w-4 h-4 mr-2" />
                車検証QR読取
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCameraOpen(true)}
                className="flex-1"
              >
                <Camera className="w-4 h-4 mr-2" />
                車両撮影
              </Button>
            </div>

            {/* 撮影済み画像プレビュー */}
            {formData.carImage && (
              <div className="relative rounded-lg overflow-hidden border-2 border-green-500">
                <img
                  src={formData.carImage}
                  alt="車両写真"
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                  <Image className="w-3 h-3" />
                  撮影済み
                </div>
              </div>
            )}

            {/* Basic Info */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="modelType">型式</Label>
                  <Input
                    id="modelType"
                    placeholder="DBA-ZVW30"
                    value={formData.modelType}
                    onChange={(e) => setFormData({ ...formData, modelType: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">車種</Label>
                  <Input
                    id="model"
                    placeholder="プリウス"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year">年式</Label>
                  <Input
                    id="year"
                    type="number"
                    min="1980"
                    max={new Date().getFullYear()}
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mileage">走行距離 (km)</Label>
                  <Input
                    id="mileage"
                    type="number"
                    min="0"
                    value={formData.mileage}
                    onChange={(e) => setFormData({ ...formData, mileage: parseInt(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maintenance">整備記録</Label>
                <Select
                  value={formData.maintenanceRecords}
                  onValueChange={(value) => setFormData({ ...formData, maintenanceRecords: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="complete">完全</SelectItem>
                    <SelectItem value="partial">一部あり</SelectItem>
                    <SelectItem value="none">なし</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 検査員報告 */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-slate-900">検査員報告</h3>
              <p className="text-sm text-slate-600">
                車両の状態や特記事項を記入してください（評価には影響しません）
              </p>
              <div className="grid grid-cols-2 gap-3">
                {formData.inspectorComments.map((comment, index) => (
                  <div key={index} className="space-y-1">
                    <Label htmlFor={`comment-${index}`} className="text-xs text-slate-600">
                      項目 {index + 1}
                    </Label>
                    <Input
                      id={`comment-${index}`}
                      placeholder={`例: ${index === 0 ? 'ルーム内汚れ' : index === 1 ? 'シート擦れ' : index === 2 ? 'エアコン異音' : '特記事項'}`}
                      value={comment}
                      onChange={(e) => updateComment(index, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 手入力評価 */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-slate-900">評価スコア（手入力）</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="overallScore">総合評価</Label>
                  <Select
                    value={formData.overallScore}
                    onValueChange={(value) => setFormData({ ...formData, overallScore: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="S点">S点</SelectItem>
                      <SelectItem value="6点">6点</SelectItem>
                      <SelectItem value="5点">5点</SelectItem>
                      <SelectItem value="4.5点">4.5点</SelectItem>
                      <SelectItem value="4点">4点</SelectItem>
                      <SelectItem value="3.5点">3.5点</SelectItem>
                      <SelectItem value="3点">3点</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="interiorScore">内装補助評価</Label>
                  <Select
                    value={formData.interiorScore}
                    onValueChange={(value) => setFormData({ ...formData, interiorScore: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">A</SelectItem>
                      <SelectItem value="B">B</SelectItem>
                      <SelectItem value="C">C</SelectItem>
                      <SelectItem value="D">D</SelectItem>
                      <SelectItem value="E">E</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                参考値（自動算出）: {calculateReferenceScore()}点
                <span className="block text-xs text-blue-600 mt-1">
                  ※年式と走行距離から算出される参考値です
                </span>
              </div>

              {/* 推奨評価点の表示 */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-sm">
                      <span className="text-green-800">推奨評価点: </span>
                      <span className="text-green-900">{getRecommendedScore()}</span>
                    </div>
                    <p className="text-xs text-green-700 mt-1">
                      {getScoreDescription(getRecommendedScore())}
                    </p>
                    {(() => {
                      const criteria = getScoreCriteria(getRecommendedScore());
                      const elapsedMonths = calculateElapsedMonths(formData.year);
                      return (
                        <div className="text-xs text-green-600 mt-2 space-y-1">
                          <div>• 走行距離: {formData.mileage.toLocaleString()}km（上限: {criteria.mileageLimit}）</div>
                          <div>• 経過月数: {elapsedMonths}ヶ月（上限: {criteria.monthsLimit}）</div>
                          {criteria.additionalConditions.length > 0 && (
                            <div>• 追加条件: {criteria.additionalConditions.join(', ')}</div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg">
              <Calculator className="w-4 h-4 mr-2" />
              評価を登録
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* QRスキャナー */}
      <QRScanner
        open={qrScannerOpen}
        onOpenChange={setQrScannerOpen}
        onScan={handleQRScan}
      />

      {/* カメラキャプチャ */}
      <CameraCapture
        open={cameraOpen}
        onOpenChange={setCameraOpen}
        onCapture={handleImageCapture}
      />
    </>
  );
}