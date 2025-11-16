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
  mileage: string;
  frontImage?: string;
  rearImage?: string;
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
  const [spec, setSpec] = useState<CarSpec>(() => {
    const saved = localStorage.getItem('carSpec');
    return saved ? JSON.parse(saved) : {
      year: '',
      model: '',
      name: '',
      grade: '',
      chassisNumber: '',
      mileage: '',
      frontImage: '',
      rearImage: ''
    };
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // 自動保存機能
  React.useEffect(() => {
    localStorage.setItem('carSpec', JSON.stringify(spec));
  }, [spec]);

  const yearOptions = generateYearOptions();
  
  // 型式から車名候補を自動取得
  const carNameSuggestions = useMemo(() => {
    if (!spec.model) return [];
    // 排ガス記号を除去して検索
    const baseModel = spec.model.replace(/^[A-Z]{3}-/, '');
    return searchCarNamesByModel(baseModel);
  }, [spec.model]);
  
  // 型式からグレード候補を取得
  const gradeOptions = useMemo(() => {
    return getGradeOptions(spec.model);
  }, [spec.model]);

  const handleInput = (key: keyof CarSpec, value: string) => {
    const newSpec = { ...spec, [key]: value };
    
    // 車体番号入力時にグレードを自動推測
    if (key === 'chassisNumber' && value && newSpec.model) {
      const inferredGrade = inferGradeFromChassis(newSpec.model, value);
      if (inferredGrade && !newSpec.grade) {
        newSpec.grade = inferredGrade.grade;
      }
    }
    
    setSpec(newSpec);
  };

  const handleClear = () => {
    if (confirm('入力内容をクリアしますか？')) {
      const emptySpec: CarSpec = {
        year: '',
        model: '',
        name: '',
        grade: '',
        chassisNumber: '',
        mileage: '',
        frontImage: '',
        rearImage: ''
      };
      setSpec(emptySpec);
      localStorage.setItem('carSpec', JSON.stringify(emptySpec));
    }
  };

  // OCR処理（グレード推測を追加）
  const processOCR = async (imageFile: File | Blob) => {
    setIsProcessing(true);
    setOcrProgress(0);

    try {
      // 画像を前処理（コントラスト強化）
      const img = new Image();
      const imageUrl = URL.createObjectURL(imageFile);
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });

      // Canvasで画像を前処理
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        
        // コントラストを上げる
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const contrast = 1.5; // コントラスト倍率
        const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
        
        for (let i = 0; i < data.length; i += 4) {
          data[i] = factor * (data[i] - 128) + 128;     // R
          data[i + 1] = factor * (data[i + 1] - 128) + 128; // G
          data[i + 2] = factor * (data[i + 2] - 128) + 128; // B
        }
        
        ctx.putImageData(imageData, 0, 0);
      }

      URL.revokeObjectURL(imageUrl);

      // OCR実行（前処理済み画像を使用）
      const processedBlob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.95);
      });

      const result = await Tesseract.recognize(processedBlob, 'jpn+eng', {
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

      // 型式を抽出（より柔軟なパターン）
      const modelPatterns = [
        /([A-Z]{3}[-\s]?[A-Z0-9]{4,8})/i,  // DBA-ZRE212形式
        /型式[：:\s]*([A-Z0-9]{4,8})/i,     // 型式: ZRE212形式
        /([A-Z]{2,4}[0-9]{3,5}[A-Z]?)/       // ZRE212形式
      ];

      for (const pattern of modelPatterns) {
        const match = text.match(pattern);
        if (match) {
          let fullModel = match[1].replace(/\s/g, '').toUpperCase();
          // 排ガス記号を除去
          detectedModel = fullModel.replace(/^[A-Z]{3}-/, '');
          if (detectedModel.length >= 4) {
            setSpec(prev => ({ ...prev, model: detectedModel }));
            console.log('検出された型式:', detectedModel);
            break;
          }
        }
      }

      // 車体番号を抽出（より柔軟なパターン）
      const chassisPatterns = [
        /車体番号[：:\s]*([A-Z]{2,5}[-\s]?\d{6,8})/i,
        /([A-Z]{2,5}[-\s]\d{6,8})/i,
        /([A-Z]{3,5}\d{6,8})/i
      ];

      for (const pattern of chassisPatterns) {
        const match = text.match(pattern);
        if (match) {
          detectedChassis = match[1].replace(/\s/g, '').toUpperCase();
          if (detectedChassis.length >= 8) {
            setSpec(prev => ({ ...prev, chassisNumber: detectedChassis }));
            console.log('検出された車体番号:', detectedChassis);
            break;
          }
        }
      }

      // グレードを推測
      if (detectedModel && detectedChassis) {
        const gradeInfo = inferGradeFromChassis(detectedModel, detectedChassis);
        if (gradeInfo) {
          setSpec(prev => ({ ...prev, grade: gradeInfo.grade }));
          console.log(`グレード推測: ${gradeInfo.grade}`);
        }
      }

      if (detectedModel || detectedChassis) {
        alert('文字認識が完了しました。\n内容を確認して必要に応じて修正してください。');
      } else {
        alert('型式・車体番号を認識できませんでした。\n・明るい場所で撮影してください\n・ピントを合わせてください\n・手動入力もご利用いただけます');
      }
    } catch (error) {
      console.error('OCR処理エラー:', error);
      alert('文字認識に失敗しました。\n・明るい場所で撮影してください\n・画像を変えて再度お試しください\n・手動入力もご利用いただけます');
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
      // iOSではconstraintsを単純化する必要がある
      let stream;
      try {
        // まずシンプルな設定で試す（iOS対応）
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });
      } catch (e) {
        console.log('背面カメラ使用不可、前面カメラを試します:', e);
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: 'user',
              width: { ideal: 1280 },
              height: { ideal: 720 }
            },
            audio: false
          });
        } catch (e2) {
          // 最終的に最もシンプルな設定で試す
          console.log('特定のカメラ指定失敗、デフォルト設定で試します:', e2);
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
        }
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // iOSではplaysinlineが必須
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('webkit-playsinline', 'true');
        try {
          await videoRef.current.play();
          setIsCameraActive(true);
        } catch (playError) {
          console.error('ビデオ再生エラー:', playError);
          alert('カメラの起動に失敗しました。\nブラウザの設定でカメラの使用を許可してください。');
          // ストリームを停止
          stream.getTracks().forEach(track => track.stop());
        }
      }
    } catch (error) {
      console.error('カメラ起動エラー:', error);
      alert('カメラを起動できませんでした。\n・Safariの設定でカメラの使用を許可してください\n・プライベートブラウズモードの場合は通常モードをお試しください\n・ファイル選択もご利用いただけます');
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
        // 古いデータに対応（mileageフィールドを追加）
        setSpec({
          year: loaded.year || '',
          model: loaded.model || '',
          name: loaded.name || '',
          grade: loaded.grade || '',
          chassisNumber: loaded.chassisNumber || '',
          mileage: loaded.mileage || ''
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
                playsInline
                autoPlay
                muted
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
              <span style={{
                marginLeft: 8,
                fontSize: 11,
                fontWeight: 400,
                color: '#94a3b8'
              }}>
                （排ガス記号なし）
              </span>
            </label>
            <input
              type="text"
              inputMode="text"
              pattern="[A-Z0-9-]*"
              value={spec.model}
              onChange={(e) => handleInput('model', e.target.value.toUpperCase())}
              placeholder="例: ZRE212"
              style={{
                width: '100%',
                fontSize: 16,
                padding: '12px 14px',
                borderRadius: 8,
                border: '2px solid #e2e8f0',
                outline: 'none',
                transition: 'border-color 0.15s',
                boxSizing: 'border-box',
                textTransform: 'uppercase'
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
              inputMode="text"
              pattern="[A-Z0-9-]*"
              value={spec.chassisNumber}
              onChange={(e) => handleInput('chassisNumber', e.target.value.toUpperCase())}
              placeholder="例: ABC-1234567"
              style={{
                width: '100%',
                fontSize: 16,
                padding: '12px 14px',
                borderRadius: 8,
                border: '2px solid #e2e8f0',
                outline: 'none',
                transition: 'border-color 0.15s',
                boxSizing: 'border-box',
                textTransform: 'uppercase'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
            />
          </div>

          {/* 走行距離 */}
          <div>
            <label style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 600,
              color: '#475569',
              marginBottom: 6
            }}>
              走行距離 (km)
            </label>
            <input
              type="number"
              inputMode="numeric"
              value={spec.mileage}
              onChange={(e) => handleInput('mileage', e.target.value)}
              placeholder="例: 50000"
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

        {/* 車両画像 */}
        <div style={{ marginTop: 24, padding: 20, background: '#f8fafc', borderRadius: 12 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#1e293b' }}>
            📷 車両画像（鑑定書用）
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* 外装画像 */}
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#475569', marginBottom: 8 }}>
                外装画像
              </label>
              {spec.frontImage ? (
                <div style={{ position: 'relative' }}>
                  <img src={spec.frontImage} alt="外装" style={{ width: '100%', borderRadius: 8, border: '2px solid #e2e8f0' }} />
                  <button
                    onClick={() => handleInput('frontImage', '')}
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      padding: '6px 12px',
                      background: '#ef4444',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    削除
                  </button>
                </div>
              ) : (
                <label style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 150,
                  border: '2px dashed #cbd5e1',
                  borderRadius: 8,
                  cursor: 'pointer',
                  background: '#fff'
                }}>
                  <span style={{ fontSize: 32, marginBottom: 8 }}>📷</span>
                  <span style={{ fontSize: 13, color: '#64748b' }}>タップして撮影/選択</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () => handleInput('frontImage', reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                    style={{ display: 'none' }}
                  />
                </label>
              )}
            </div>

            {/* 内装画像 */}
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#475569', marginBottom: 8 }}>
                内装画像
              </label>
              {spec.rearImage ? (
                <div style={{ position: 'relative' }}>
                  <img src={spec.rearImage} alt="内装" style={{ width: '100%', borderRadius: 8, border: '2px solid #e2e8f0' }} />
                  <button
                    onClick={() => handleInput('rearImage', '')}
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      padding: '6px 12px',
                      background: '#ef4444',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    削除
                  </button>
                </div>
              ) : (
                <label style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 150,
                  border: '2px dashed #cbd5e1',
                  borderRadius: 8,
                  cursor: 'pointer',
                  background: '#fff'
                }}>
                  <span style={{ fontSize: 32, marginBottom: 8 }}>📷</span>
                  <span style={{ fontSize: 13, color: '#64748b' }}>タップして撮影/選択</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () => handleInput('rearImage', reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                    style={{ display: 'none' }}
                  />
                </label>
              )}
            </div>
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
          <div
            style={{
              flex: 2,
              padding: 14,
              borderRadius: 8,
              border: 'none',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              fontSize: 14,
              fontWeight: 600,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            <span>✓</span>
            <span>自動保存中</span>
          </div>
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
