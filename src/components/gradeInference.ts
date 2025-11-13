// 型式と車体番号からグレードを推測
export interface GradeInfo {
  grade: string;
  confidence: 'high' | 'medium' | 'low'; // 推測の確度
}

// 型式別のグレード推測ルール
const GRADE_PATTERNS: Record<string, (chassisNumber: string) => GradeInfo | null> = {
  // トヨタ カローラ
  'ZRE212': (chassis) => {
    if (chassis.includes('1') || chassis.endsWith('1')) return { grade: 'X', confidence: 'medium' };
    if (chassis.includes('2') || chassis.endsWith('2')) return { grade: 'S', confidence: 'medium' };
    if (chassis.includes('3') || chassis.endsWith('3')) return { grade: 'G', confidence: 'medium' };
    return null;
  },
  
  // トヨタ ハリアー
  'MXUA80': (chassis) => {
    if (chassis.includes('0001')) return { grade: 'S', confidence: 'medium' };
    if (chassis.includes('0002')) return { grade: 'G', confidence: 'medium' };
    if (chassis.includes('0003')) return { grade: 'Z', confidence: 'medium' };
    return null;
  },
  'AXAH54': (chassis) => {
    if (chassis.includes('0001')) return { grade: 'S', confidence: 'medium' };
    if (chassis.includes('0002')) return { grade: 'G', confidence: 'medium' };
    if (chassis.includes('0003')) return { grade: 'Z', confidence: 'medium' };
    return null;
  },
  
  // トヨタ プリウス
  'ZVW50': (chassis) => {
    if (chassis.includes('E')) return { grade: 'E', confidence: 'high' };
    if (chassis.includes('S')) return { grade: 'S', confidence: 'high' };
    if (chassis.includes('A')) return { grade: 'A', confidence: 'high' };
    return null;
  },
  
  // ホンダ シビック
  'FC1': (chassis) => {
    const last = chassis.slice(-1);
    if (last === '1') return { grade: 'ハッチバック', confidence: 'medium' };
    if (last === '2') return { grade: 'TYPE R', confidence: 'medium' };
    return null;
  },
  
  // ホンダ ヴェゼル
  'RU1': (chassis) => {
    if (chassis.includes('G')) return { grade: 'G', confidence: 'medium' };
    if (chassis.includes('X')) return { grade: 'X', confidence: 'medium' };
    if (chassis.includes('Z')) return { grade: 'Z', confidence: 'medium' };
    return null;
  },
  
  // マツダ3
  'BP5P': (chassis) => {
    if (chassis.includes('15S')) return { grade: '15S', confidence: 'high' };
    if (chassis.includes('20S')) return { grade: '20S', confidence: 'high' };
    if (chassis.includes('XD')) return { grade: 'XD', confidence: 'high' };
    return null;
  },
  
  // スバル レヴォーグ
  'VM4': (chassis) => {
    if (chassis.includes('16GT')) return { grade: '1.6GT', confidence: 'high' };
    if (chassis.includes('16S')) return { grade: '1.6GT-S', confidence: 'high' };
    if (chassis.includes('20GT')) return { grade: '2.0GT-S', confidence: 'high' };
    if (chassis.includes('STI')) return { grade: 'STI Sport', confidence: 'high' };
    return null;
  },
  'VN5': (chassis) => {
    if (chassis.includes('GT')) return { grade: 'GT', confidence: 'medium' };
    if (chassis.includes('STI')) return { grade: 'STI Sport', confidence: 'high' };
    if (chassis.includes('EX')) return { grade: 'GT-EX', confidence: 'high' };
    return null;
  }
};

// 一般的なグレード推測（パターンマッチング）
function inferGradeFromChassisGeneric(chassisNumber: string, model: string): GradeInfo | null {
  const upper = chassisNumber.toUpperCase();
  
  // よくあるグレード文字列のパターン
  const commonGrades = [
    { pattern: /STI/i, grade: 'STI', confidence: 'high' as const },
    { pattern: /TYPE[-\s]?R/i, grade: 'TYPE R', confidence: 'high' as const },
    { pattern: /\bRS\b/i, grade: 'RS', confidence: 'medium' as const },
    { pattern: /\bGT\b/i, grade: 'GT', confidence: 'medium' as const },
    { pattern: /\bGTI\b/i, grade: 'GTI', confidence: 'high' as const },
    { pattern: /SPORT/i, grade: 'SPORT', confidence: 'medium' as const },
    { pattern: /CUSTOM/i, grade: 'CUSTOM', confidence: 'medium' as const },
    { pattern: /HYBRID/i, grade: 'HYBRID', confidence: 'medium' as const }
  ];
  
  for (const { pattern, grade, confidence } of commonGrades) {
    if (pattern.test(upper)) {
      return { grade, confidence };
    }
  }
  
  return null;
}

// メイン推測関数
export function inferGradeFromChassis(
  model: string,
  chassisNumber: string
): GradeInfo | null {
  if (!model || !chassisNumber) return null;
  
  // 型式から基本型式を抽出（DBA-などの接頭辞を除去）
  const baseModel = model.replace(/^[A-Z]{3}-/, '').toUpperCase();
  
  // 特定の型式用のルールを適用
  if (GRADE_PATTERNS[baseModel]) {
    const result = GRADE_PATTERNS[baseModel](chassisNumber);
    if (result) return result;
  }
  
  // 一般的なパターンで推測
  return inferGradeFromChassisGeneric(chassisNumber, model);
}

// グレード候補リスト（型式ごと）
export const GRADE_OPTIONS: Record<string, string[]> = {
  // トヨタ
  'ZRE212': ['X', 'S', 'G', 'W×B'],
  'ZWE211': ['HYBRID S', 'HYBRID G', 'HYBRID W×B'],
  'MXUA80': ['S', 'G', 'Z', 'Z Leather Package'],
  'AXAH54': ['S', 'G', 'Z', 'Z Leather Package', 'Progress'],
  'ZVW50': ['E', 'S', 'A', 'A Premium'],
  'MXAA54': ['X', 'G', 'G Z package', 'Adventure'],
  'AXAH52': ['HYBRID X', 'HYBRID G', 'HYBRID G Z package'],
  
  // ホンダ
  'FC1': ['ハッチバック', 'TYPE R'],
  'FK7': ['TYPE R'],
  'RU1': ['G', 'X', 'Z'],
  'RV3': ['G', 'e:HEV X', 'e:HEV Z', 'e:HEV PLaY'],
  'RP1': ['B', 'G', 'G EX', 'Spada'],
  'GB5': ['B', 'G', 'G Honda SENSING', 'Hybrid G'],
  
  // マツダ
  'BP5P': ['15S', '15S Touring', '20S', 'XD', 'XD Proactive'],
  'BP8P': ['15S', '20S', 'XD', 'XD L Package'],
  'KF2P': ['20S', '25S', 'XD'],
  'KF5P': ['20S', '25S', 'XD', 'XD L Package'],
  
  // スバル
  'VM4': ['1.6GT', '1.6GT-S', '1.6STI Sport'],
  'VMG': ['2.0GT-S', '2.0STI Sport'],
  'VN5': ['GT', 'GT-H', 'GT-EX', 'STI Sport', 'STI Sport EX'],
  'SK9': ['Touring', 'Premium', 'X-BREAK', 'Advance', 'Sport'],
  'GT3': ['1.6i-L', '2.0i-L', '2.0i-S'],
  'GT7': ['2.0e-L', '2.0e-S'],
  
  // 日産
  'E13': ['X', 'X FOUR', 'S', 'MEDALIST'],
  'SNE13': ['X', 'S', 'MEDALIST', 'e-POWER NISMO'],
  'C27': ['X', 'XV', 'G', 'Highway STAR'],
  'T33': ['20S', '20Xi', '20Xi HYBRID'],
  
  // その他
  'DEFAULT': ['ベースグレード', 'スタンダード', 'カスタム']
};

// 型式からグレード候補を取得
export function getGradeOptions(model: string): string[] {
  if (!model) return GRADE_OPTIONS['DEFAULT'];
  
  const baseModel = model.replace(/^[A-Z]{3}-/, '').toUpperCase();
  return GRADE_OPTIONS[baseModel] || GRADE_OPTIONS['DEFAULT'];
}
