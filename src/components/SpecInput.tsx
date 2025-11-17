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
  chassisPrefix: string; // 車体番号の型式部分
  chassisSerial: string; // 車体番号のシリアル番号部分
  mileage: string;
  isImported: boolean; // 輸入車フラグ
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

// TOYOTA型式末尾補正
const correctToyotaModel = (model: string): string => {
  if (!model) return model;
  
  const upper = model.toUpperCase();
  
  // TOYOTAの型式パターン（例: ZRE212 → ZRE212W, GRS204 → GRS204G）
  const toyotaPatterns = [
    { base: /^ZRE\d{3}$/, suffix: 'W' },
    { base: /^NRE\d{3}$/, suffix: 'W' },
    { base: /^ZWE\d{3}$/, suffix: 'W' },
    { base: /^MXAA\d{2}$/, suffix: 'W' },
    { base: /^GRS\d{3}$/, suffix: 'G' },
    { base: /^UZS\d{3}$/, suffix: 'G' },
  ];
  
  for (const pattern of toyotaPatterns) {
    if (pattern.base.test(upper)) {
      return upper + pattern.suffix;
    }
  }
  
  return upper;
};

// 走行距離フォーマット（3桁カンマ）
const formatMileage = (value: string): string => {
  const numbers = value.replace(/[^\d]/g, '');
  if (!numbers) return '';
  return parseInt(numbers, 10).toLocaleString('ja-JP');
};

// 走行距離パース（カンマ除去）
const parseMileage = (value: string): string => {
  return value.replace(/[^\d]/g, '');
};

export function SpecInput() {
  const [spec, setSpec] = useState<CarSpec>(() => {
    const saved = localStorage.getItem('carSpec');
    if (saved) {
      try {
        const loaded = JSON.parse(saved);
        return {
          year: loaded.year || '',
          model: loaded.model || '',
          name: loaded.name || '',
          grade: loaded.grade || '',
          chassisNumber: loaded.chassisNumber || '',
          chassisPrefix: loaded.chassisPrefix || '',
          chassisSerial: loaded.chassisSerial || '',
          mileage: loaded.mileage || '',
          isImported: loaded.isImported || false,
          frontImage: loaded.frontImage || '',
          rearImage: loaded.rearImage || ''
        };
      } catch (e) {
        console.error('Failed to load saved spec', e);
      }
    }
    return {
      year: '',
      model: '',
      name: '',
      grade: '',
      chassisNumber: '',
      chassisPrefix: '',
      chassisSerial: '',
      mileage: '',
      isImported: false,
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
  
  // 型式+車体番号からグレード候補を取得
  const gradeOptions = useMemo(() => {
    if (!spec.model) return [];
    const options = getGradeOptions(spec.model);
    
    // 車体番号がある場合はさらに絞り込み
    if (spec.chassisNumber && options.length > 1) {
      const inferredGrade = inferGradeFromChassis(spec.model, spec.chassisNumber);
      if (inferredGrade) {
        // 推測されたグレードを最初に配置
        return [inferredGrade.grade, ...options.filter(g => g !== inferredGrade.grade)];
      }
    }
    
    return options;
  }, [spec.model, spec.chassisNumber]);

  const handleInput = (key: keyof CarSpec, value: string) => {
    const newSpec = { ...spec };
    
    if (key === 'model') {
      // 型式入力時に大文字変換 + TOYOTA補正
      const corrected = correctToyotaModel(value);
      newSpec.model = corrected;
      
      // 型式が変更されたら車体番号のプレフィックスにも反映
      if (!spec.isImported) {
        newSpec.chassisPrefix = corrected;
        newSpec.chassisNumber = corrected + (spec.chassisSerial ? '-' + spec.chassisSerial : '');
      }
    } else if (key === 'chassisPrefix') {
      // 車体番号の型式部分が変更されたら型式入力にも反映
      const upper = value.toUpperCase();
      newSpec.chassisPrefix = upper;
      newSpec.model = upper;
      
      if (!spec.isImported) {
        newSpec.chassisNumber = upper + (spec.chassisSerial ? '-' + spec.chassisSerial : '');
      }
    } else if (key === 'chassisSerial') {
      // 車体番号のシリアル番号部分
      const upper = value.toUpperCase();
      newSpec.chassisSerial = upper;
      
      if (spec.isImported) {
        newSpec.chassisNumber = (spec.chassisPrefix + upper).slice(0, 17);
      } else {
        newSpec.chassisNumber = spec.chassisPrefix + (upper ? '-' + upper : '');
      }
    } else if (key === 'chassisNumber' && spec.isImported) {
      // 輸入車の場合は17桁で分割なし
      const upper = value.toUpperCase().slice(0, 17);
      newSpec.chassisNumber = upper;
      newSpec.chassisPrefix = upper.slice(0, 11);
      newSpec.chassisSerial = upper.slice(11);
    } else if (key === 'mileage') {
      // 走行距離は数字のみ保存、表示時にフォーマット
      newSpec.mileage = parseMileage(value);
    } else {
      newSpec[key] = value as any;
    }
    
    // 車体番号入力時にグレードを自動推測
    if ((key === 'chassisSerial' || key === 'chassisNumber') && newSpec.chassisNumber && newSpec.model) {
      const inferredGrade = inferGradeFromChassis(newSpec.model, newSpec.chassisNumber);
      if (inferredGrade && !newSpec.grade) {
        newSpec.grade = inferredGrade.grade;
      }
    }
    
    setSpec(newSpec);
  };

  // 輸入車切り替え
  const toggleImported = () => {
    const newSpec = { ...spec, isImported: !spec.isImported };
    
    if (newSpec.isImported) {
      // 輸入車モード: ハイフンなし17桁
      newSpec.chassisNumber = (spec.chassisPrefix + spec.chassisSerial).replace(/-/g, '').slice(0, 17);
      newSpec.chassisPrefix = newSpec.chassisNumber.slice(0, 11);
      newSpec.chassisSerial = newSpec.chassisNumber.slice(11);
    } else {
      // 国産車モード: 型式-シリアル番号
      if (spec.model) {
        newSpec.chassisPrefix = spec.model;
        newSpec.chassisNumber = spec.model + (spec.chassisSerial ? '-' + spec.chassisSerial : '');
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
        chassisPrefix: '',
        chassisSerial: '',
        mileage: '',
        isImported: false,
        frontImage: '',
        rearImage: ''
      };
      setSpec(emptySpec);
      localStorage.setItem('carSpec', JSON.stringify(emptySpec));
    }
  };

  // OCR処理
  const processOCR = async (imageFile: File | Blob) => {
    setIsProcessing(true);
    setOcrProgress(0);

    try {
      // 画像を読み込み
      const img = new Image();
      const imageUrl = URL.createObjectURL(imageFile);
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });

      // Canvasで画像を前処理（より強力な処理）
      const canvas = document.createElement('canvas');
      
      // 画像を拡大（解像度を上げる）
      const scale = Math.min(3000 / Math.max(img.width, img.height), 2);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // 高品質スケーリング
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // 画像を描画
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // グレースケール化＋コントラスト強化
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
          // グレースケール化
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          
          // コントラスト強化（より強力）
          const contrast = 2.0;
          const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
          const enhanced = factor * (gray - 128) + 128;
          
          // 二値化（白黒はっきり）
          const threshold = 128;
          const binary = enhanced > threshold ? 255 : 0;
          
          data[i] = binary;
          data[i + 1] = binary;
          data[i + 2] = binary;
        }
        
        ctx.putImageData(imageData, 0, 0);
      }

      URL.revokeObjectURL(imageUrl);

      // OCR実行
      const processedBlob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/png');
      });

      console.log('OCR開始...');
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
        /([A-Z]{3}[-\s]?[A-Z0-9]{4,8})/i,
        /型式[：:\s]*([A-Z0-9]{4,8})/i,
        /([A-Z]{2,4}[0-9]{3,5}[A-Z]?)/
      ];

      for (const pattern of modelPatterns) {
        const match = text.match(pattern);
        if (match) {
          let fullModel = match[1].replace(/\s/g, '').toUpperCase();
          detectedModel = fullModel.replace(/^[A-Z]{3}-/, '');
          if (detectedModel.length >= 4) {
            const corrected = correctToyotaModel(detectedModel);
            handleInput('model', corrected);
            console.log('検出された型式:', corrected);
            break;
          }
        }
      }

      // 車体番号を抽出
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
            const parts = detectedChassis.split('-');
            if (parts.length === 2) {
              handleInput('chassisPrefix', parts[0]);
              handleInput('chassisSerial', parts[1]);
            }
            console.log('検出された車体番号:', detectedChassis);
            break;
          }
        }
      }

      if (detectedModel || detectedChassis) {
        alert(`文字認識が完了しました！\n\n検出内容:\n型式: ${detectedModel || '未検出'}\n車体番号: ${detectedChassis || '未検出'}`);
      } else {
        alert('型式・車体番号を認識できませんでした。手動入力をご利用ください。');
      }
    } catch (error) {
      console.error('OCR処理エラー:', error);
      alert('文字認識に失敗しました。');
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
      console.log('カメラ起動を試みます...');
      
      let stream;
      const constraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      };

      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log('カメラストリーム取得成功');
      } catch (e) {
        console.log('高解像度カメラ失敗、標準設定で再試行:', e);
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false
        });
      }
      
      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
        
        // 再生を待機
        await new Promise((resolve, reject) => {
          if (!videoRef.current) return reject();
          
          videoRef.current.onloadedmetadata = async () => {
            try {
              await videoRef.current!.play();
              console.log('カメラ表示成功');
              resolve(true);
            } catch (playError) {
              console.error('再生エラー:', playError);
              reject(playError);
            }
          };
          
          videoRef.current.onerror = reject;
        });
        
        setIsCameraActive(true);
      }
    } catch (error) {
      console.error('カメラ起動エラー:', error);
      alert('カメラを起動できませんでした。\n\n代わりに「🖼️ ファイル選択」ボタンから：\n1. 写真を撮る\n2. 既存の写真を選択\nをお試しください。');
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
          {/* 年式 */}
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
                boxSizing: 'border-box',
                background: '#fff',
                cursor: 'pointer'
              }}
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
                （排ガス記号なし、自動で大文字変換）
              </span>
            </label>
            <input
              type="text"
              value={spec.model}
              onChange={(e) => {
                const corrected = correctToyotaModel(e.target.value);
                handleInput('model', corrected);
                if (corrected && !spec.chassisPrefix) {
                  handleInput('chassisPrefix', corrected);
                }
              }}
              onBlur={(e) => {
                const corrected = correctToyotaModel(e.target.value);
                if (corrected !== e.target.value) {
                  handleInput('model', corrected);
                }
              }}
              placeholder="例: ZRE212W"
              inputMode="text"  // アルファベット＋数字キーボード
              style={{
                width: '100%',
                fontSize: 16,
                fontWeight: 600,
                padding: '12px 14px',
                marginTop: 6,
                borderRadius: 8,
                border: '2px solid #e2e8f0',
                outline: 'none',
                transition: 'border-color 0.15s',
                textTransform: 'uppercase',
                fontFamily: 'monospace',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
            />
          </div>

          {/* 車名 */}
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
                  boxSizing: 'border-box',
                  background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                  cursor: 'pointer'
                }}
              >
                <option value="">-- 車名を選択 --</option>
                {carNameSuggestions.map(name => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
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
                  boxSizing: 'border-box'
                }}
              />
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
              {spec.chassisNumber && gradeOptions.length > 0 && (
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
                  border: spec.chassisNumber ? '2px solid #a7f3d0' : '2px solid #e2e8f0',
                  outline: 'none',
                  boxSizing: 'border-box',
                  background: spec.chassisNumber ? 'linear-gradient(135deg, #f0fdf4 0%, #d1fae5 100%)' : '#fff',
                  cursor: 'pointer'
                }}
              >
                <option value="">-- グレードを選択 --</option>
                {gradeOptions.map(grade => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
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
                  boxSizing: 'border-box'
                }}
              />
            )}
          </div>

          {/* 車体番号 */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{
                fontSize: 14,
                fontWeight: 600,
                color: '#475569'
              }}>
                車体番号
              </label>
              <button
                onClick={toggleImported}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: spec.isImported ? '2px solid #f59e0b' : '2px solid #e2e8f0',
                  background: spec.isImported ? '#fef3c7' : '#fff',
                  fontSize: 12,
                  fontWeight: 600,
                  color: spec.isImported ? '#92400e' : '#64748b',
                  cursor: 'pointer'
                }}
              >
                {spec.isImported ? '🌍 輸入車' : '🇯🇵 国産車'}
              </button>
            </div>

            {spec.isImported ? (
              // 輸入車: 17桁連続入力
              <input
                type="text"
                inputMode="text"
                value={spec.chassisNumber}
                onChange={(e) => handleInput('chassisNumber', e.target.value)}
                placeholder="17桁のVIN (例: JTHBK1GG8E2012345)"
                maxLength={17}
                style={{
                  width: '100%',
                  fontSize: 16,
                  padding: '12px 14px',
                  borderRadius: 8,
                  border: '2px solid #fcd34d',
                  outline: 'none',
                  boxSizing: 'border-box',
                  textTransform: 'uppercase',
                  background: '#fef3c7',
                  fontFamily: 'monospace',
                  letterSpacing: '1px'
                }}
              />
            ) : (
              // 国産車: 型式 - シリアル番号
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>型式部分</div>
                  <input
                    type="text"
                    inputMode="text"
                    value={spec.chassisPrefix}
                    onChange={(e) => handleInput('chassisPrefix', e.target.value)}
                    placeholder="例: ZRE212W"
                    style={{
                      width: '100%',
                      fontSize: 16,
                      padding: '12px 14px',
                      borderRadius: 8,
                      border: '2px solid #e2e8f0',
                      outline: 'none',
                      boxSizing: 'border-box',
                      textTransform: 'uppercase'
                    }}
                  />
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'flex-end', 
                  paddingBottom: 12, 
                  fontSize: 20, 
                  fontWeight: 700, 
                  color: '#94a3b8' 
                }}>
                  -
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>シリアル番号</div>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={spec.chassisSerial}
                    onChange={(e) => handleInput('chassisSerial', e.target.value)}
                    placeholder="例: 1234567"
                    style={{
                      width: '100%',
                      fontSize: 16,
                      padding: '12px 14px',
                      borderRadius: 8,
                      border: '2px solid #e2e8f0',
                      outline: 'none',
                      boxSizing: 'border-box',
                      textTransform: 'uppercase'
                    }}
                  />
                </div>
              </div>
            )}
            
            {!spec.isImported && spec.chassisNumber && (
              <div style={{
                marginTop: 6,
                fontSize: 12,
                color: '#64748b',
                fontFamily: 'monospace'
              }}>
                完全な車体番号: {spec.chassisNumber}
              </div>
            )}
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
              type="text"
              inputMode="numeric"
              value={formatMileage(spec.mileage)}
              onChange={(e) => handleInput('mileage', e.target.value)}
              placeholder="例: 50,000"
              style={{
                width: '100%',
                fontSize: 16,
                padding: '12px 14px',
                borderRadius: 8,
                border: '2px solid #e2e8f0',
                outline: 'none',
                boxSizing: 'border-box'
              }}
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
