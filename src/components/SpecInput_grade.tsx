import React, { useState, useRef, useMemo } from 'react';
import Tesseract from 'tesseract.js';
import { searchCarNamesByModel } from './carModelDatabase';
import { inferGradeFromChassis, getGradeOptions } from './gradeInference';

export interface CarSpec {
  year: string;
  model: string;
  name: string;
  grade: string;
  chassisNumber: string;
}

// 和暦・西暦の年式リスト生成
const generateYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const years: Array<{ value: string; label: string }> = [];
  
  // 西暦2000年(平成12年)から現在まで
  for (let seireki = currentYear; seireki >= 2000; seireki--) {
    let wareki = '';
    if (seireki >= 2019) {
      wareki = `令和${seireki - 2018}年`;
    } else if (seireki >= 1989) {
      wareki = `平成${seireki - 1988}年`;
    }
    
    years.push({
      value: seireki.toString(),
      label: `${wareki} (${seireki}年)`
    });
  }
  
  return years;
};

export function SpecInput() {
  const [spec, setSpec] = useState<CarSpec>({
    year: '',
    model: '',
    name: '',
    grade: '',
    chassisNumber: ''
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const yearOptions = generateYearOptions();
  
  // 型式から車名候補を自動取得
  const carNameSuggestions = useMemo(() => {
    if (!spec.model) return [];
    return searchCarNamesByModel(spec.model);
  }, [spec.model]);
  
  // 型式からグレード候補を取得
  const gradeOptions = useMemo(() => {
    return getGradeOptions(spec.model);
  }, [spec.model]);

  const handleInput = (key: keyof CarSpec, value: string) => {
    setSpec({ ...spec, [key]: value });
  };

  const handleSave = () => {
    localStorage.setItem('carSpec', JSON.stringify(spec));
    alert('諸元を保存しました');
  };

  const handleClear = () => {
    if (confirm('入力内容をクリアしますか？')) {
      setSpec({
        year: '',
        model: '',
        name: '',
        grade: '',
        chassisNumber: ''
      });
    }
  };

  // OCR処理（グレード推測を追加）
  const processOCR = async (imageFile: File | Blob) => {
    setIsProcessing(true);
    setOcrProgress(0);

    try {
      const result = await Tesseract.recognize(imageFile, 'jpn', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setOcrProgress(Math.round(m.progress * 100));
          }
        }
      });

      const text = result.data.text;
      console.log('OCR結果:', text);

      let detectedModel = '';
      let detectedChassis = '';

      // 型式を抽出（DBA-、CBA-、DAA- などで始まるパターン）
      const modelMatch = text.match(/([A-Z]{3}-[A-Z0-9]+)/i);
      if (modelMatch) {
        detectedModel = modelMatch[1].toUpperCase();
        setSpec(prev => ({ ...prev, model: detectedModel }));
      }

      // 車体番号を抽出（アルファベット+ハイフン+数字のパターン）
      const chassisMatch = text.match(/([A-Z]{2,5}[-\s]?\d{6,8})/i);
      if (chassisMatch) {
        detectedChassis = chassisMatch[1].replace(/\s/g, '');
        setSpec(prev => ({ ...prev, chassisNumber: detectedChassis.toUpperCase() }));
      }

      // グレードを推測
      if (detectedModel && detectedChassis) {
        const gradeInfo = inferGradeFromChassis(detectedModel, detectedChassis);
        if (gradeInfo) {
          setSpec(prev => ({ ...prev, grade: gradeInfo.grade }));
          const confidenceText = gradeInfo.confidence === 'high' ? '高確度' : 
                                 gradeInfo.confidence === 'medium' ? '中確度' : '低確度';
          console.log(`グレード推測: ${gradeInfo.grade} (${confidenceText})`);
        }
      }

      alert('文字認識が完了しました。\n内容を確認して必要に応じて修正してください。');
    } catch (error) {
      console.error('OCR処理エラー:', error);
      alert('文字認識に失敗しました。\n画像を変えて再度お試しください。');
    } finally {
      setIsProcessing(false);
      setOcrProgress(0);
    }
  };

  // ファイル選択
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processOCR(file);
    }
  };

  // カメラ起動
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch (error) {
      console.error('カメラ起動エラー:', error);
      alert('カメラを起動できませんでした。\nファイル選択をお試しください。');
    }
  };

  // カメラで撮影
  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      canvas.toBlob(async (blob) => {
        if (blob) {
          stopCamera();
          await processOCR(blob);
        }
      }, 'image/jpeg', 0.95);
    }
  };

  // カメラ停止
  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
    }
  };

  // ページ読み込み時にLocalStorageから復元
  React.useEffect(() => {
    const saved = localStorage.getItem('carSpec');
    if (saved) {
      try {
        const loaded = JSON.parse(saved);
        // gradeフィールドがない古いデータに対応
        setSpec({
          year: loaded.year || '',
          model: loaded.model || '',
          name: loaded.name || '',
          grade: loaded.grade || '',
          chassisNumber: loaded.chassisNumber || ''
        });
      } catch (e) {
        console.error('Failed to load saved spec', e);
      }
    }
  }, []);

  // クリーンアップ
  React.useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div style={{
      maxWidth: 480,
      margin: '0 auto',
      padding: 20
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: 24,
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
      }}>
        <h2 style={{
          fontSize: 24,
          fontWeight: 700,
          marginBottom: 8,
          color: '#1e293b',
          textAlign: 'center'
        }}>
          車両諸元入力
        </h2>

        <p style={{
          fontSize: 13,
          color: '#64748b',
          textAlign: 'center',
          marginBottom: 24
        }}>
          コーションプレートを撮影するか、手動入力してください
        </p>

        {/* OCR機能 */}
        <div style={{
          marginBottom: 24,
          padding: 16,
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
          borderRadius: 12,
          border: '2px solid #38bdf8'
        }}>
          <div style={{
            fontSize: 14,
            fontWeight: 700,
            color: '#0c4a6e',
            marginBottom: 12,
            textAlign: 'center'
          }}>
            📷 コーションプレート撮影
          </div>

          {!isCameraActive ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={startCamera}
                disabled={isProcessing}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 8,
                  border: 'none',
                  background: isProcessing ? '#94a3b8' : '#0ea5e9',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#fff',
                  cursor: isProcessing ? 'not-allowed' : 'pointer'
                }}
              >
                📸 カメラ起動
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 8,
                  border: 'none',
                  background: isProcessing ? '#94a3b8' : '#06b6d4',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#fff',
                  cursor: isProcessing ? 'not-allowed' : 'pointer'
                }}
              >
                🖼️ ファイル選択
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </div>
          ) : (
            <div>
              <video
                ref={videoRef}
                style={{
                  width: '100%',
                  borderRadius: 8,
                  marginBottom: 12,
                  background: '#000'
                }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={capturePhoto}
                  style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: 8,
                    border: 'none',
                    background: '#10b981',
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  ✓ 撮影
                </button>
                <button
                  onClick={stopCamera}
                  style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: 8,
                    border: 'none',
                    background: '#ef4444',
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  ✕ キャンセル
                </button>
              </div>
            </div>
          )}

          {isProcessing && (
            <div style={{
              marginTop: 12,
              padding: 12,
              background: '#fff',
              borderRadius: 8
            }}>
              <div style={{
                fontSize: 13,
                fontWeight: 600,
                color: '#0c4a6e',
                marginBottom: 8,
                textAlign: 'center'
              }}>
                文字認識中... {ocrProgress}%
              </div>
              <div style={{
                height: 8,
                background: '#e0f2fe',
                borderRadius: 4,
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  background: 'linear-gradient(90deg, #0ea5e9, #06b6d4)',
                  width: `${ocrProgress}%`,
                  transition: 'width 0.3s'
                }} />
              </div>
            </div>
          )}

          <div style={{
            marginTop: 12,
            fontSize: 11,
            color: '#0369a1',
            textAlign: 'center',
            lineHeight: 1.5
          }}>
            ※ 型式・車体番号・グレードを自動認識します
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* 年式（プルダウン） */}
          <div>
            <label style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 600,
              color: '#475569',
              marginBottom: 6
            }}>
              年式
            </label>
            <select
              value={spec.year}
              onChange={(e) => handleInput('year', e.target.value)}
              style={{
                width: '100%',
                fontSize: 16,
                padding: '12px 14px',
                borderRadius: 8,
                border: '2px solid #e2e8f0',
                outline: 'none',
                transition: 'border-color 0.15s',
                boxSizing: 'border-box',
                background: '#fff',
                cursor: 'pointer'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
            >
              <option value="">-- 年式を選択 --</option>
              {yearOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* 型式 */}
          <div>
            <label style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 600,
              color: '#475569',
              marginBottom: 6
            }}>
              型式
            </label>
            <input
              type="text"
              value={spec.model}
              onChange={(e) => handleInput('model', e.target.value)}
              placeholder="例: DBA-ABC123"
              style={{
                width: '100%',
                fontSize: 16,
                padding: '12px 14px',
                borderRadius: 8,
                border: '2px solid #e2e8f0',
                outline: 'none',
                transition: 'border-color 0.15s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
            />
          </div>

          {/* 車名（型式から候補表示） */}
          <div>
            <label style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 600,
              color: '#475569',
              marginBottom: 6
            }}>
              車名
              {carNameSuggestions.length > 0 && (
                <span style={{
                  marginLeft: 8,
                  fontSize: 12,
                  fontWeight: 500,
                  color: '#3b82f6'
                }}>
                  （型式から候補を検出）
                </span>
              )}
            </label>
            
            {carNameSuggestions.length > 0 ? (
              <>
                <select
                  value={spec.name}
                  onChange={(e) => handleInput('name', e.target.value)}
                  style={{
                    width: '100%',
                    fontSize: 16,
                    padding: '12px 14px',
                    borderRadius: 8,
                    border: '2px solid #bfdbfe',
                    outline: 'none',
                    transition: 'border-color 0.15s',
                    boxSizing: 'border-box',
                    background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                    cursor: 'pointer'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#bfdbfe'}
                >
                  <option value="">-- 車名を選択 --</option>
                  {carNameSuggestions.map(name => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                  <option value="__manual__">手動入力...</option>
                </select>
                
                {spec.name === '__manual__' && (
                  <input
                    type="text"
                    value=""
                    onChange={(e) => handleInput('name', e.target.value)}
                    placeholder="車名を入力してください"
                    autoFocus
                    style={{
                      width: '100%',
                      fontSize: 16,
                      padding: '12px 14px',
                      borderRadius: 8,
                      border: '2px solid #e2e8f0',
                      outline: 'none',
                      marginTop: 8,
                      boxSizing: 'border-box'
                    }}
                  />
                )}
              </>
            ) : (
              <input
                type="text"
                value={spec.name}
                onChange={(e) => handleInput('name', e.target.value)}
                placeholder="例: カローラ"
                style={{
                  width: '100%',
                  fontSize: 16,
                  padding: '12px 14px',
                  borderRadius: 8,
                  border: '2px solid #e2e8f0',
                  outline: 'none',
                  transition: 'border-color 0.15s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
              />
            )}
            
            {carNameSuggestions.length === 0 && spec.model && (
              <div style={{
                marginTop: 6,
                fontSize: 11,
                color: '#64748b'
              }}>
                ※ 輸入車または型式が未登録です。手動で入力してください。
              </div>
            )}
          </div>

          {/* グレード */}
          <div>
            <label style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 600,
              color: '#475569',
              marginBottom: 6
            }}>
              グレード
              {spec.model && gradeOptions.length > 0 && (
                <span style={{
                  marginLeft: 8,
                  fontSize: 12,
                  fontWeight: 500,
                  color: '#10b981'
                }}>
                  （車体番号から推測）
                </span>
              )}
            </label>
            
            {spec.model && gradeOptions.length > 0 && gradeOptions[0] !== 'ベースグレード' ? (
              <select
                value={spec.grade}
                onChange={(e) => handleInput('grade', e.target.value)}
                style={{
                  width: '100%',
                  fontSize: 16,
                  padding: '12px 14px',
                  borderRadius: 8,
                  border: '2px solid #a7f3d0',
                  outline: 'none',
                  transition: 'border-color 0.15s',
                  boxSizing: 'border-box',
                  background: 'linear-gradient(135deg, #f0fdf4 0%, #d1fae5 100%)',
                  cursor: 'pointer'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#10b981'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#a7f3d0'}
              >
                <option value="">-- グレードを選択 --</option>
                {gradeOptions.map(grade => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
                <option value="__manual__">手動入力...</option>
              </select>
            ) : (
              <input
                type="text"
                value={spec.grade}
                onChange={(e) => handleInput('grade', e.target.value)}
                placeholder="例: G"
                style={{
                  width: '100%',
                  fontSize: 16,
                  padding: '12px 14px',
                  borderRadius: 8,
                  border: '2px solid #e2e8f0',
                  outline: 'none',
                  transition: 'border-color 0.15s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
              />
            )}
          </div>

          {/* 車体番号 */}
          <div>
            <label style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 600,
              color: '#475569',
              marginBottom: 6
            }}>
              車体番号
            </label>
            <input
              type="text"
              value={spec.chassisNumber}
              onChange={(e) => handleInput('chassisNumber', e.target.value)}
              placeholder="例: ABC-1234567"
              style={{
                width: '100%',
                fontSize: 16,
                padding: '12px 14px',
                borderRadius: 8,
                border: '2px solid #e2e8f0',
                outline: 'none',
                transition: 'border-color 0.15s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
            />
          </div>
        </div>

        {/* ボタン */}
        <div style={{
          display: 'flex',
          gap: 10,
          marginTop: 24
        }}>
          <button
            onClick={handleClear}
            style={{
              flex: 1,
              padding: 14,
              borderRadius: 8,
              border: '2px solid #e2e8f0',
              background: '#fff',
              fontSize: 16,
              fontWeight: 600,
              color: '#64748b',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            クリア
          </button>
          <button
            onClick={handleSave}
            style={{
              flex: 2,
              padding: 14,
              borderRadius: 8,
              border: 'none',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              fontSize: 16,
              fontWeight: 600,
              color: '#fff',
              cursor: 'pointer',
              transition: 'all 0.15s',
              boxShadow: '0 4px 12px rgba(37,99,235,0.3)'
            }}
          >
            保存
          </button>
        </div>

        {/* 入力状況 */}
        <div style={{
          marginTop: 20,
          padding: 12,
          background: '#f8fafc',
          borderRadius: 8,
          fontSize: 12,
          color: '#64748b'
        }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>入力状況</div>
          <div>
            {[spec.year, spec.model, spec.name, spec.grade, spec.chassisNumber].filter(v => v).length}/5 項目入力済み
          </div>
        </div>
      </div>
    </div>
  );
}
