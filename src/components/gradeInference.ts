// 型式と車体番号からグレードを推測
export interface GradeInfo {
  grade: string;
  confidence: 'high' | 'medium' | 'low'; // 推測の確度
}

// 型式別のグレード推測ルール
const GRADE_PATTERNS: Record<string, (chassisNumber: string) => GradeInfo | null> = {
  // ========== トヨタ ==========
  // カローラ
  'ZRE212': (chassis) => {
    if (chassis.includes('1') || chassis.endsWith('1')) return { grade: 'X', confidence: 'medium' };
    if (chassis.includes('2') || chassis.endsWith('2')) return { grade: 'S', confidence: 'medium' };
    if (chassis.includes('3') || chassis.endsWith('3')) return { grade: 'G', confidence: 'medium' };
    if (chassis.includes('4') || chassis.endsWith('4')) return { grade: 'W×B', confidence: 'medium' };
    return null;
  },
  'ZWE211': (chassis) => {
    if (chassis.includes('1')) return { grade: 'HYBRID S', confidence: 'medium' };
    if (chassis.includes('2')) return { grade: 'HYBRID G', confidence: 'medium' };
    if (chassis.includes('3')) return { grade: 'HYBRID W×B', confidence: 'medium' };
    return null;
  },
  
  // ハリアー
  'MXUA80': (chassis) => {
    if (chassis.includes('0001') || chassis.includes('1')) return { grade: 'S', confidence: 'medium' };
    if (chassis.includes('0002') || chassis.includes('2')) return { grade: 'G', confidence: 'medium' };
    if (chassis.includes('0003') || chassis.includes('3')) return { grade: 'Z', confidence: 'medium' };
    if (chassis.includes('0004')) return { grade: 'Z Leather Package', confidence: 'medium' };
    return null;
  },
  'AXAH54': (chassis) => {
    if (chassis.includes('0001') || chassis.includes('1')) return { grade: 'S', confidence: 'medium' };
    if (chassis.includes('0002') || chassis.includes('2')) return { grade: 'G', confidence: 'medium' };
    if (chassis.includes('0003') || chassis.includes('3')) return { grade: 'Z', confidence: 'medium' };
    if (chassis.includes('0005')) return { grade: 'Progress', confidence: 'high' };
    return null;
  },
  
  // プリウス
  'ZVW50': (chassis) => {
    if (chassis.includes('E')) return { grade: 'E', confidence: 'high' };
    if (chassis.includes('S')) return { grade: 'S', confidence: 'high' };
    if (chassis.includes('A')) return { grade: 'A', confidence: 'high' };
    return null;
  },
  
  // RAV4
  'MXAA54': (chassis) => {
    if (chassis.includes('1')) return { grade: 'X', confidence: 'medium' };
    if (chassis.includes('2')) return { grade: 'G', confidence: 'medium' };
    if (chassis.includes('3')) return { grade: 'G Z package', confidence: 'medium' };
    if (chassis.includes('4')) return { grade: 'Adventure', confidence: 'high' };
    return null;
  },
  
  // ========== ホンダ ==========
  // シビック
  'FC1': (chassis) => {
    const last = chassis.slice(-1);
    if (last === '1') return { grade: 'ハッチバック', confidence: 'medium' };
    if (last === '2') return { grade: 'TYPE R', confidence: 'medium' };
    return null;
  },
  'FK7': (chassis) => {
    return { grade: 'TYPE R', confidence: 'high' };
  },
  'FL1': (chassis) => {
    if (chassis.includes('1')) return { grade: 'LX', confidence: 'medium' };
    if (chassis.includes('2')) return { grade: 'EX', confidence: 'medium' };
    return null;
  },
  
  // ヴェゼル
  'RU1': (chassis) => {
    if (chassis.includes('G')) return { grade: 'G', confidence: 'medium' };
    if (chassis.includes('X')) return { grade: 'X', confidence: 'medium' };
    if (chassis.includes('Z')) return { grade: 'Z', confidence: 'medium' };
    return null;
  },
  'RV3': (chassis) => {
    if (chassis.includes('1')) return { grade: 'G', confidence: 'medium' };
    if (chassis.includes('2')) return { grade: 'e:HEV X', confidence: 'medium' };
    if (chassis.includes('3')) return { grade: 'e:HEV Z', confidence: 'medium' };
    if (chassis.includes('4')) return { grade: 'e:HEV PLaY', confidence: 'high' };
    return null;
  },
  
  // ステップワゴン
  'RP1': (chassis) => {
    if (chassis.includes('B')) return { grade: 'B', confidence: 'medium' };
    if (chassis.includes('G')) return { grade: 'G', confidence: 'medium' };
    if (chassis.includes('EX')) return { grade: 'G EX', confidence: 'high' };
    return null;
  },
  'RP5': (chassis) => {
    return { grade: 'Spada', confidence: 'high' };
  },
  
  // フィット
  'GR1': (chassis) => {
    if (chassis.includes('1')) return { grade: 'BASIC', confidence: 'medium' };
    if (chassis.includes('2')) return { grade: 'HOME', confidence: 'medium' };
    if (chassis.includes('3')) return { grade: 'NESS', confidence: 'medium' };
    if (chassis.includes('4')) return { grade: 'CROSSTAR', confidence: 'high' };
    if (chassis.includes('5')) return { grade: 'LUXE', confidence: 'medium' };
    return null;
  },
  
  // ========== マツダ ==========
  // マツダ3
  'BP5P': (chassis) => {
    if (chassis.includes('15S')) return { grade: '15S', confidence: 'high' };
    if (chassis.includes('20S')) return { grade: '20S', confidence: 'high' };
    if (chassis.includes('XD')) return { grade: 'XD', confidence: 'high' };
    if (chassis.includes('Touring')) return { grade: '15S Touring', confidence: 'high' };
    return null;
  },
  'BP8P': (chassis) => {
    if (chassis.includes('15S')) return { grade: '15S', confidence: 'high' };
    if (chassis.includes('20S')) return { grade: '20S', confidence: 'high' };
    if (chassis.includes('XD')) return { grade: 'XD', confidence: 'high' };
    if (chassis.includes('L')) return { grade: 'XD L Package', confidence: 'high' };
    return null;
  },
  
  // CX-5
  'KF2P': (chassis) => {
    if (chassis.includes('20S')) return { grade: '20S', confidence: 'high' };
    if (chassis.includes('25S')) return { grade: '25S', confidence: 'high' };
    if (chassis.includes('XD')) return { grade: 'XD', confidence: 'high' };
    return null;
  },
  'KF5P': (chassis) => {
    if (chassis.includes('20S')) return { grade: '20S', confidence: 'high' };
    if (chassis.includes('25S')) return { grade: '25S', confidence: 'high' };
    if (chassis.includes('XD')) return { grade: 'XD', confidence: 'high' };
    if (chassis.includes('L')) return { grade: 'XD L Package', confidence: 'high' };
    return null;
  },
  
  // ========== スバル ==========
  // レヴォーグ
  'VM4': (chassis) => {
    if (chassis.includes('16GT')) return { grade: '1.6GT', confidence: 'high' };
    if (chassis.includes('16S')) return { grade: '1.6GT-S', confidence: 'high' };
    if (chassis.includes('STI')) return { grade: 'STI Sport', confidence: 'high' };
    return null;
  },
  'VMG': (chassis) => {
    if (chassis.includes('20GT')) return { grade: '2.0GT-S', confidence: 'high' };
    if (chassis.includes('STI')) return { grade: 'STI Sport', confidence: 'high' };
    return null;
  },
  'VN5': (chassis) => {
    if (chassis.includes('GT')) return { grade: 'GT', confidence: 'medium' };
    if (chassis.includes('STI')) return { grade: 'STI Sport', confidence: 'high' };
    if (chassis.includes('EX')) return { grade: 'GT-EX', confidence: 'high' };
    if (chassis.includes('H')) return { grade: 'GT-H', confidence: 'high' };
    return null;
  },
  
  // フォレスター
  'SK9': (chassis) => {
    if (chassis.includes('Touring')) return { grade: 'Touring', confidence: 'high' };
    if (chassis.includes('Premium')) return { grade: 'Premium', confidence: 'high' };
    if (chassis.includes('X-BREAK')) return { grade: 'X-BREAK', confidence: 'high' };
    if (chassis.includes('Advance')) return { grade: 'Advance', confidence: 'high' };
    if (chassis.includes('Sport')) return { grade: 'Sport', confidence: 'high' };
    return null;
  },
  
  // インプレッサ
  'GT3': (chassis) => {
    if (chassis.includes('1')) return { grade: '1.6i-L', confidence: 'medium' };
    if (chassis.includes('2')) return { grade: '2.0i-L', confidence: 'medium' };
    if (chassis.includes('S')) return { grade: '2.0i-S', confidence: 'high' };
    return null;
  },
  'GT7': (chassis) => {
    if (chassis.includes('L')) return { grade: '2.0e-L', confidence: 'medium' };
    if (chassis.includes('S')) return { grade: '2.0e-S', confidence: 'high' };
    return null;
  },
  
  // WRX
  'VAB': (chassis) => {
    return { grade: 'STI', confidence: 'high' };
  },
  'VAG': (chassis) => {
    return { grade: 'S4', confidence: 'high' };
  },
  
  // ========== 日産 ==========
  // ノート
  'E13': (chassis) => {
    if (chassis.includes('X')) return { grade: 'X', confidence: 'medium' };
    if (chassis.includes('S')) return { grade: 'S', confidence: 'medium' };
    if (chassis.includes('MEDALIST')) return { grade: 'MEDALIST', confidence: 'high' };
    return null;
  },
  'SNE13': (chassis) => {
    if (chassis.includes('X')) return { grade: 'e-POWER X', confidence: 'medium' };
    if (chassis.includes('S')) return { grade: 'e-POWER S', confidence: 'medium' };
    if (chassis.includes('MEDALIST')) return { grade: 'e-POWER MEDALIST', confidence: 'high' };
    if (chassis.includes('NISMO')) return { grade: 'e-POWER NISMO', confidence: 'high' };
    return null;
  },
  
  // セレナ
  'C27': (chassis) => {
    if (chassis.includes('X')) return { grade: 'X', confidence: 'medium' };
    if (chassis.includes('XV')) return { grade: 'XV', confidence: 'medium' };
    if (chassis.includes('G')) return { grade: 'G', confidence: 'medium' };
    if (chassis.includes('Highway')) return { grade: 'Highway STAR', confidence: 'high' };
    return null;
  },
  'GFC27': (chassis) => {
    return { grade: 'e-POWER', confidence: 'high' };
  },
  
  // エクストレイル
  'T33': (chassis) => {
    if (chassis.includes('20S')) return { grade: '20S', confidence: 'high' };
    if (chassis.includes('20Xi')) return { grade: '20Xi', confidence: 'high' };
    return null;
  },
  'SNT33': (chassis) => {
    return { grade: 'e-POWER', confidence: 'high' };
  },
  
  // ========== ダイハツ ==========
  // タント
  'LA650S': (chassis) => {
    if (chassis.includes('L')) return { grade: 'L', confidence: 'medium' };
    if (chassis.includes('X')) return { grade: 'X', confidence: 'medium' };
    if (chassis.includes('Custom')) return { grade: 'Custom', confidence: 'high' };
    return null;
  },
  
  // タフト
  'LA900S': (chassis) => {
    if (chassis.includes('X')) return { grade: 'X', confidence: 'medium' };
    if (chassis.includes('G')) return { grade: 'G', confidence: 'medium' };
    if (chassis.includes('Gターボ')) return { grade: 'Gターボ', confidence: 'high' };
    return null;
  },
  
  // ========== スズキ ==========
  // ハスラー
  'MR52S': (chassis) => {
    if (chassis.includes('A')) return { grade: 'A', confidence: 'medium' };
    if (chassis.includes('G')) return { grade: 'G', confidence: 'medium' };
    if (chassis.includes('Xターボ')) return { grade: 'Xターボ', confidence: 'high' };
    if (chassis.includes('HYBRID')) return { grade: 'HYBRID X', confidence: 'high' };
    return null;
  },
  
  // スペーシア
  'MK53S': (chassis) => {
    if (chassis.includes('G')) return { grade: 'G', confidence: 'medium' };
    if (chassis.includes('X')) return { grade: 'X', confidence: 'medium' };
    if (chassis.includes('Custom')) return { grade: 'Custom', confidence: 'high' };
    return null;
  },
  
  // スイフト
  'ZC83S': (chassis) => {
    if (chassis.includes('XG')) return { grade: 'XG', confidence: 'medium' };
    if (chassis.includes('RS')) return { grade: 'RS', confidence: 'high' };
    if (chassis.includes('HYBRID')) return { grade: 'HYBRID RS', confidence: 'high' };
    return null;
  },
  'ZC33S': (chassis) => {
    return { grade: 'Sport', confidence: 'high' };
  }
};

// 一般的なグレード推測（パターンマッチング）
function inferGradeFromChassisGeneric(chassisNumber: string, model: string): GradeInfo | null {
  const upper = chassisNumber.toUpperCase();
  
  // よくあるグレード文字列のパターン
  const commonGrades = [
    { pattern: /STI/i, grade: 'STI', confidence: 'high' as const },
    { pattern: /TYPE[-\s]?R/i, grade: 'TYPE R', confidence: 'high' as const },
    { pattern: /NISMO/i, grade: 'NISMO', confidence: 'high' as const },
    { pattern: /\bRS\b/i, grade: 'RS', confidence: 'medium' as const },
    { pattern: /\bGT\b/i, grade: 'GT', confidence: 'medium' as const },
    { pattern: /\bGTI\b/i, grade: 'GTI', confidence: 'high' as const },
    { pattern: /SPORT/i, grade: 'SPORT', confidence: 'medium' as const },
    { pattern: /CUSTOM/i, grade: 'CUSTOM', confidence: 'medium' as const },
    { pattern: /HYBRID/i, grade: 'HYBRID', confidence: 'medium' as const },
    { pattern: /e[-:]?POWER/i, grade: 'e-POWER', confidence: 'high' as const },
    { pattern: /PREMIUM/i, grade: 'PREMIUM', confidence: 'medium' as const },
    { pattern: /LUXURY/i, grade: 'LUXURY', confidence: 'medium' as const }
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
  const baseModel = model.replace(/^[A-Z]{3}-/, '').replace(/^[A-Z]-/, '').toUpperCase();
  
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
  // ========== トヨタ ==========
  // カローラシリーズ
  'ZRE212': ['X', 'S', 'G', 'W×B'],
  'ZRE214': ['X', 'S', 'G', 'W×B'],
  'ZWE211': ['HYBRID S', 'HYBRID G', 'HYBRID W×B'],
  'ZWE214': ['HYBRID S', 'HYBRID G', 'HYBRID W×B'],
  'NRE210': ['G', 'G Z', 'GX'],
  'NRE180': ['HYBRID', 'HYBRID G', '1.5G'],
  'NZE161': ['X', 'X-ビジネスパッケージ', 'LUXEL'],
  
  // クラウン
  'GRS210': ['2.5アスリート', '2.5アスリートS', '3.5アスリート', '3.5アスリートS'],
  'GRS214': ['ロイヤル', 'ロイヤルサルーン', 'ロイヤルサルーンG'],
  'AWS210': ['ハイブリッド アスリート', 'ハイブリッド アスリートS'],
  'AZSH20': ['RS', 'RS Advance', 'G', 'G Advance', 'X'],
  'AZSH21': ['RS', 'RS Advance', 'G', 'G Advance'],
  
  // プリウス
  'ZVW50': ['E', 'S', 'S Touring Selection', 'A', 'A Premium', 'A Premium ツーリングセレクション'],
  'ZVW51': ['E', 'S', 'A'],
  'ZVW55': ['S', 'A', 'A Premium'],
  'ZVW30': ['S', 'G', 'L'],
  
  // アクア
  'NHP10': ['S', 'G', 'L'],
  'MXPK10': ['X', 'G', 'Z'],
  'MXPK11': ['X', 'G', 'Z'],
  'MXPK15': ['CROSSOVER'],
  
  // ハリアー
  'MXUA80': ['S', 'G', 'Z', 'Z Leather Package'],
  'MXUA85': ['S', 'G', 'Z', 'Z Leather Package'],
  'AXUH80': ['S', 'G', 'Z', 'Z Leather Package', 'Progress'],
  'AXUH85': ['S', 'G', 'Z', 'Progress'],
  'ZSU60': ['PREMIUM', 'ELEGANCE', 'GRAND'],
  'ZSU65': ['PREMIUM', 'ELEGANCE', 'GRAND'],
  
  // ノア・ヴォクシー
  'ZRR80': ['X', 'Si', 'ZS'],
  'ZRR85': ['X', 'Si', 'ZS'],
  'ZWR80': ['HYBRID X', 'HYBRID Si', 'HYBRID ZS'],
  'MZRA90': ['X', 'G', 'Z'],
  'MZRA95': ['X', 'G', 'Z'],
  
  // アルファード・ヴェルファイア
  'AGH30': ['X', 'S', 'SA', 'SC'],
  'AGH35': ['X', 'S', 'SA'],
  'GGH30': ['SA', 'SC', 'Executive Lounge'],
  'AYH30': ['X', 'S', 'SR', 'SR-C', 'Executive Lounge'],
  'TAHA40': ['Z', 'Executive Lounge'],
  
  // RAV4
  'MXAA54': ['X', 'G', 'G Z package', 'Adventure'],
  'MXAA52': ['X', 'G'],
  'AXAH54': ['HYBRID X', 'HYBRID G', 'HYBRID G Z package'],
  'AXAH52': ['HYBRID X', 'HYBRID G'],
  'AXAP54': ['Z', 'G Z', 'BLACK TONE'],
  
  // ヤリス
  'MXPA10': ['X', 'G', 'Z'],
  'MXPA15': ['X', 'G', 'Z'],
  'MXPH10': ['HYBRID X', 'HYBRID G', 'HYBRID Z'],
  'MXPH15': ['HYBRID X', 'HYBRID G', 'HYBRID Z'],
  
  // C-HR
  'NGX50': ['S', 'G', 'G-T'],
  'ZYX10': ['HYBRID S', 'HYBRID G'],
  'ZYX11': ['HYBRID S', 'HYBRID G'],
  
  // カローラクロス
  'MZEA12': ['G', 'S', 'Z'],
  'ZVG11': ['HYBRID S', 'HYBRID Z'],
  'ZVG15': ['HYBRID G', 'HYBRID Z'],
  
  // ランドクルーザー
  'VJA300': ['ZX', 'GR SPORT'],
  'GRJ150': ['TX', 'TZ-G'],
  'TRJ150': ['TX'],
  'GDJ150': ['TX', 'TZ-G'],
  
  // ハイエース
  'TRH200': ['DX', 'DX GLパッケージ', 'スーパーGL'],
  'TRH211': ['DX', 'DX GLパッケージ'],
  'TRH214': ['DX', 'スーパーGL'],
  'TRH221': ['DX', 'DX GLパッケージ', 'スーパーGL'],
  
  // カムリ
  'AXVH70': ['X', 'G', 'G Leather Package', 'WS', 'WS Leather Package'],
  
  // 86・GR86
  'ZN6': ['G', 'GT', 'GT Limited'],
  'ZN8': ['SZ', 'RZ'],
  
  // スープラ
  'DB42': ['SZ', 'SZ-R', 'RZ'],
  'DB22': ['SZ'],
  
  // ========== レクサス ==========
  'VXFA50': ['LS500 I package', 'LS500 version L', 'LS500 F SPORT', 'LS500 EXECUTIVE'],
  'GVF50': ['LS500h I package', 'LS500h version L', 'LS500h F SPORT', 'LS500h EXECUTIVE'],
  'AVE30': ['IS300', 'IS300 F SPORT', 'IS300 version L'],
  'ASE30': ['IS300h', 'IS300h F SPORT', 'IS300h version L'],
  'AYZ10': ['NX250 I package', 'NX250 version L', 'NX250 F SPORT'],
  'AAZH20': ['NX350h I package', 'NX350h version L', 'NX350h F SPORT'],
  'AGL20': ['RX450h', 'RX450h F SPORT', 'RX450h version L'],
  'AALH10': ['LBX COOL', 'LBX RELAX', 'LBX ACTIVE'],
  
  // ========== 日産 ==========
  // ノート
  'E12': ['X', 'X DIG-S', 'MEDALIST', 'NISMO'],
  'E13': ['F', 'X', 'X FOUR', 'S', 'MEDALIST'],
  'HE12': ['e-POWER X', 'e-POWER MEDALIST', 'e-POWER NISMO'],
  'SNE13': ['e-POWER X', 'e-POWER S', 'e-POWER MEDALIST', 'e-POWER NISMO'],
  'FE11': ['AURASURA G', 'AURA NISMO'],
  
  // セレナ
  'C27': ['X', 'XV', 'G', 'Highway STAR', 'Highway STAR V', 'NISMO'],
  'GC27': ['X', 'Highway STAR'],
  'GFC27': ['e-POWER X', 'e-POWER XV', 'e-POWER Highway STAR', 'e-POWER NISMO'],
  'HC27': ['Highway STAR', 'Highway STAR V'],
  
  // エクストレイル
  'T33': ['S', 'X', 'G'],
  'NT33': ['20S', '20Xi', '20Xi HYBRID', '20Xi HYBRID 4WD'],
  'SNT33': ['e-POWER X', 'e-POWER G'],
  'T32': ['20S', '20X', '20Xi'],
  'HNT32': ['20Xi HYBRID', '20Xi HYBRID 4WD'],
  
  // スカイライン
  'V37': ['GT Type P', 'GT Type SP', '400R'],
  'HV37': ['HYBRID Type P', 'HYBRID Type SP'],
  'RV37': ['400R'],
  
  // GT-R
  'R35': ['Pure edition', 'Black edition', 'Premium edition', 'Track edition', 'NISMO'],
  
  // フェアレディZ
  'Z34': ['Version S', 'Version T', 'Version ST', 'NISMO'],
  'RZ34': ['Version S', 'Version ST', 'Proto Spec'],
  
  // リーフ
  'ZE0': ['S', 'X', 'G'],
  'ZE1': ['S', 'X', 'G', 'e+ G', 'e+ X'],
  
  // ========== ホンダ ==========
  // シビック
  'FC1': ['ハッチバック', 'TYPE R'],
  'FK7': ['TYPE R'],
  'FK8': ['TYPE R', 'TYPE R Limited Edition'],
  'FL1': ['LX', 'EX'],
  'FL4': ['LX', 'EX'],
  'FL5': ['TYPE R'],
  
  // フィット
  'GK3': ['13G', '13G L', '13G S', '13G F'],
  'GK5': ['15X', '15X L', 'RS'],
  'GP5': ['HYBRID', 'HYBRID L', 'HYBRID S'],
  'GR1': ['BASIC', 'HOME', 'NESS', 'CROSSTAR', 'LUXE'],
  'GR3': ['BASIC', 'HOME', 'NESS', 'CROSSTAR', 'LUXE'],
  
  // ヴェゼル
  'RU1': ['G', 'X', 'Z'],
  'RU3': ['HYBRID', 'HYBRID X', 'HYBRID Z', 'HYBRID RS'],
  'RV3': ['G', 'e:HEV X', 'e:HEV Z', 'e:HEV PLaY'],
  'RV5': ['e:HEV X', 'e:HEV Z', 'e:HEV PLaY'],
  
  // ステップワゴン
  'RP1': ['B', 'G', 'G EX'],
  'RP3': ['B', 'G'],
  'RP5': ['Spada', 'Spada Cool Spirit'],
  'AIR1': ['AIR', 'SPADA'],
  'AIR3': ['e:HEV AIR', 'e:HEV SPADA', 'e:HEV SPADA PREMIUM LINE'],
  
  // フリード
  'GB5': ['B', 'G', 'G Honda SENSING'],
  'GB7': ['HYBRID B', 'HYBRID G', 'HYBRID EX'],
  'GP3': ['HYBRID', 'HYBRID G'],
  
  // CR-V
  'RT5': ['EX', 'EX Masterpiece'],
  'RW1': ['EX', 'EX Masterpiece'],
  'RW2': ['e:HEV EX', 'e:HEV EX Masterpiece'],
  
  // オデッセイ
  'RC1': ['G', 'G EX', 'ABSOLUTE', 'ABSOLUTE EX'],
  'RC2': ['G', 'ABSOLUTE'],
  'RC4': ['HYBRID', 'HYBRID ABSOLUTE', 'HYBRID ABSOLUTE EX'],
  
  // アコード
  'CV3': ['LX', 'EX'],
  
  // N-BOX
  'JF3': ['G', 'G L', 'G EX', 'Custom G', 'Custom G L', 'Custom G EX'],
  'JF4': ['G', 'G L', 'G EX', 'Custom G', 'Custom G L', 'Custom G EX'],
  
  // N-WGN
  'JH3': ['G', 'L', 'Custom G', 'Custom L'],
  'JH4': ['G', 'L', 'Custom G', 'Custom L'],
  
  // N-ONE
  'JG3': ['Original', 'Premium', 'Premium Tourer', 'RS'],
  'JG4': ['Original', 'Premium', 'RS'],
  
  // ========== マツダ ==========
  // マツダ3
  'BP5P': ['15S', '15S Touring', '15S L Package', '20S', '20S Proactive', '20S L Package', 'XD', 'XD Proactive', 'XD L Package'],
  'BP8P': ['15S', '15S Touring', '20S', '20S Proactive', 'XD', 'XD Proactive', 'XD L Package'],
  'BPEP': ['e-SKYACTIV X', 'e-SKYACTIV X Proactive', 'e-SKYACTIV X L Package'],
  
  // CX-5
  'KF2P': ['20S', '20S PROACTIVE', '25S', '25S PROACTIVE', '25S L Package', 'XD', 'XD PROACTIVE', 'XD L Package'],
  'KF5P': ['20S', '25S', '25S L Package', 'XD', 'XD PROACTIVE', 'XD L Package'],
  'KFEP': ['25T', '25T L Package'],
  
  // CX-8
  'KG2P': ['20S', '25S', '25S PROACTIVE', '25S L Package', 'XD', 'XD PROACTIVE', 'XD L Package'],
  'KG5P': ['25S', 'XD', 'XD PROACTIVE', 'XD L Package', 'XD Exclusive Mode'],
  
  // CX-30
  'DMEP': ['20S', '20S PROACTIVE', '20S L Package', 'XD', 'XD PROACTIVE', 'XD L Package'],
  'DM8P': ['20S', '20S PROACTIVE', 'XD PROACTIVE'],
  
  // CX-3
  'DK5AW': ['15S', '20S', '20S PROACTIVE', 'XD', 'XD PROACTIVE', 'XD Touring'],
  'DKEAW': ['15S', 'XD', 'XD PROACTIVE', 'XD Touring'],
  
  // ロードスター
  'ND5RC': ['S', 'S Special Package', 'S Leather Package', 'RS'],
  'NDERC': ['S', 'VS', 'RS'],
  
  // ========== スバル ==========
  // レヴォーグ
  'VM4': ['1.6GT', '1.6GT-S', '1.6GT EyeSight', '1.6STI Sport'],
  'VMG': ['2.0GT-S', '2.0STI Sport EyeSight'],
  'VN5': ['GT', 'GT-H', 'GT-EX', 'STI Sport', 'STI Sport EX', 'STI Sport R'],
  'VNH': ['Layback'],
  
  // フォレスター
  'SK5': ['Touring', 'Premium', 'X-BREAK'],
  'SK9': ['Touring', 'Premium', 'X-BREAK', 'Advance', 'Sport'],
  'SKE': ['Advance', 'X-EDITION'],
  
  // インプレッサ
  'GT2': ['1.6i-L', '1.6i-L EyeSight'],
  'GT3': ['1.6i-L', '2.0i-L', '2.0i-S'],
  'GT7': ['2.0e-L', '2.0e-S'],
  'GK3': ['1.6i-L', '2.0i-L', '2.0i-S'],
  
  // WRX
  'VAB': ['STI', 'STI Type S', 'STI tS'],
  'VAG': ['S4', 'S4 tS'],
  'VB5': ['GT-H', 'GT-H EX'],
  'VBH': ['S4', 'S4 STI Sport'],
  
  // BRZ
  'ZC6': ['S', 'R', 'R Customize Package', 'GT', 'STI Sport'],
  'ZD8': ['S', 'R', 'R EX', 'STI Sport'],
  
  // レガシィ
  'BN9': ['B4 Limited', 'B4 Limited EX'],
  'BS9': ['Touring Wagon Limited', 'Touring Wagon Limited EX'],
  
  // アウトバック
  'BS9': ['Limited', 'X-BREAK'],
  'BT5': ['Touring XT', 'X-BREAK EX'],
  
  // XV
  'GT3': ['1.6i', '1.6i-L', '2.0i-L'],
  'GT7': ['2.0e-L', '2.0e-S'],
  'GTE': ['Advance'],
  
  // ソルテラ
  'XEAM10': ['ET-SS', 'ET-HS'],
  
  // ========== ダイハツ ==========
  // タント
  'LA650S': ['L', 'L SAIII', 'X', 'X Turbo', 'Custom X', 'Custom RS'],
  'LA660S': ['L', 'X', 'Custom X', 'Custom RS'],
  
  // ムーヴ
  'LA150S': ['L', 'L SAIII', 'X', 'X SAIII', 'X Turbo', 'Custom X', 'Custom RS'],
  'LA160S': ['L', 'X', 'Custom X', 'Custom RS'],
  
  // ムーヴキャンバス
  'LA800S': ['X', 'X リミテッド', 'G'],
  'LA810S': ['X', 'G', 'G メイクアップ'],
  
  // タフト
  'LA900S': ['X', 'G', 'Gターボ'],
  'LA910S': ['X', 'G', 'Gターボ'],
  
  // ロッキー
  'A200S': ['L', 'X', 'G', 'Premium'],
  'A210S': ['L', 'X', 'G', 'Premium'],
  
  // ミライース
  'LA300S': ['L', 'L SAIII', 'X', 'X SAIII', 'G', 'G SAIII'],
  'LA350S': ['B', 'L', 'X', 'G'],
  
  // コペン
  'LA400K': ['Robe', 'Robe S', 'XPLAY', 'Cero'],
  
  // ========== スズキ ==========
  // ハスラー
  'MR31S': ['A', 'G', 'Gターボ', 'X', 'Xターボ'],
  'MR52S': ['HYBRID G', 'HYBRID Gターボ', 'HYBRID X', 'HYBRID Xターボ'],
  'MR92S': ['HYBRID G', 'HYBRID X'],
  
  // スペーシア
  'MK32S': ['G', 'X', 'Xリミテッド', 'Custom GS', 'Custom XS'],
  'MK53S': ['HYBRID G', 'HYBRID X', 'Custom HYBRID XS', 'Custom HYBRID XS Turbo'],
  
  // ワゴンR
  'MH34S': ['FA', 'FX', 'FX Limited', 'Stingray X', 'Stingray T'],
  'MH55S': ['FA', 'HYBRID FX', 'HYBRID FZ', 'Custom HYBRID XS'],
  
  // アルト
  'HA36S': ['F', 'L', 'S', 'X'],
  'HA97S': ['A', 'L', 'X', 'HYBRID S'],
  
  // スイフト
  'ZC13S': ['XG', 'XL', 'RS'],
  'ZC83S': ['XG', 'XL', 'HYBRID MG', 'HYBRID RS', 'HYBRID SL'],
  'ZD83S': ['HYBRID MG', 'HYBRID RS', 'HYBRID SL'],
  'ZC33S': ['Sport', 'Sport KATANA Edition'],
  
  // ソリオ
  'MA15S': ['G', 'S'],
  'MA36S': ['G', 'HYBRID MX', 'HYBRID MZ'],
  'MA46S': ['G', 'HYBRID MX', 'HYBRID MZ', 'HYBRID SX', 'HYBRID SZ'],
  
  // クロスビー
  'MN71S': ['HYBRID MX', 'HYBRID MZ'],
  
  // ジムニー
  'JB64W': ['XC', 'XL', 'XG'],
  'JB74W': ['JC', 'JL'],
  
  // エスクード
  'YEA1S': ['1.4ターボ'],
  
  // ========== 三菱 ==========
  // デリカD:5
  'CV1W': ['M', 'G'],
  'CV5W': ['M', 'G', 'G Power Package', 'P', 'URBAN GEAR'],
  
  // アウトランダー
  'GF7W': ['M', 'G'],
  'GF8W': ['G', 'G Plus Package'],
  'GN0W': ['M', 'G', 'G Premium Package'],
  'GGFW': ['M', 'G', 'G Premium Package', 'P'],
  
  // エクリプスクロス
  'GK1W': ['M', 'G', 'G Plus Package'],
  'GL3W': ['M', 'G'],
  
  // RVR
  'GA3W': ['M', 'G'],
  'GA4W': ['G', 'ACTIVE GEAR'],
  
  // eKワゴン
  'B11W': ['M', 'E', 'G'],
  'B33W': ['M', 'G'],
  
  // eKクロス
  'B34W': ['M', 'G', 'T'],
  'B35W': ['M', 'G', 'T', 'T Premium'],
  
  // ========== 輸入車 ==========
  // メルセデス・ベンツ
  'W205': ['C180', 'C200', 'C220d', 'C250', 'C350e', 'C43 AMG', 'C63 AMG'],
  'W213': ['E200', 'E220d', 'E250', 'E300', 'E350e', 'E43 AMG', 'E53 AMG', 'E63 AMG'],
  'W223': ['S350d', 'S400d', 'S450', 'S500', 'S500 4MATIC', 'S580e', 'Maybach S650'],
  'X253': ['GLC200', 'GLC220d', 'GLC250', 'GLC300', 'GLC43 AMG', 'GLC63 AMG'],
  'W177': ['A180', 'A200', 'A220', 'A250', 'A35 AMG', 'A45 AMG'],
  
  // BMW
  'F30': ['318i', '320i', '320d', '328i', '330i', '335i', '340i'],
  'G20': ['318i', '320i', '320d', '330i', '330e', 'M340i'],
  'G30': ['520i', '523i', '530i', '530e', '540i', 'M550i'],
  'G05': ['X5 xDrive35d', 'X5 xDrive40i', 'X5 xDrive45e', 'X5 M50i', 'X5 M'],
  'F48': ['X1 sDrive18i', 'X1 xDrive18d', 'X1 xDrive20i', 'X1 xDrive25i'],
  
  // アウディ
  '8V': ['A3 1.4 TFSI', 'A3 1.8 TFSI', 'A3 2.0 TFSI', 'S3', 'RS3'],
  '8Y': ['A3 35 TFSI', 'A3 40 TFSI', 'S3', 'RS3'],
  'B9': ['A4 35 TFSI', 'A4 40 TFSI', 'A4 45 TFSI', 'S4', 'RS4'],
  'F5': ['A5 40 TFSI', 'A5 45 TFSI', 'S5', 'RS5'],
  'FY': ['Q3 35 TFSI', 'Q3 40 TFSI', 'Q3 45 TFSI', 'RS Q3'],
  
  // フォルクスワーゲン
  '5G': ['TSI Trendline', 'TSI Comfortline', 'TSI Highline', 'GTI', 'R'],
  '8G': ['eTSI Active', 'eTSI Style', 'GTI', 'R'],
  'AW': ['TSI Trendline', 'TSI Comfortline', 'TSI Highline', 'GTI'],
  '5N': ['TSI Trendline', 'TSI Comfortline', 'TSI Highline', 'R-Line'],
  
  // ボルボ
  'VB': ['T4', 'T5', 'T6', 'T8 Twin Engine', 'Polestar'],
  'ZB': ['T5', 'T6', 'T8 Twin Engine', 'Polestar'],
  'LD': ['T5', 'T6', 'T8 Twin Engine'],
  
  // ミニ
  'XM': ['Cooper', 'Cooper D', 'Cooper S', 'John Cooper Works'],
  'YM': ['Cooper Clubman', 'Cooper S Clubman', 'John Cooper Works Clubman'],
  'ZA': ['Cooper Crossover', 'Cooper S Crossover', 'Cooper SD Crossover', 'John Cooper Works Crossover'],
  
  // ジープ
  'JL': ['Sport', 'Sport S', 'Sahara', 'Rubicon', '4xe'],
  'KL': ['Longitude', 'Limited', 'Trailhawk'],
  'WK': ['Laredo', 'Limited', 'Summit', 'Trackhawk'],
  
  // ポルシェ
  '992': ['Carrera', 'Carrera S', 'Carrera 4', 'Carrera 4S', 'Turbo', 'Turbo S', 'GT3'],
  '982': ['718 Boxster', '718 Cayman', '718 Boxster S', '718 Cayman S', '718 GTS'],
  '971': ['4', '4S', '4 E-Hybrid', 'Turbo', 'Turbo S'],
  '9YA': ['Cayenne', 'Cayenne S', 'Cayenne E-Hybrid', 'Cayenne Turbo', 'Cayenne Turbo S E-Hybrid'],
  '95B': ['Macan', 'Macan S', 'Macan GTS', 'Macan Turbo'],
  
  // テスラ
  'MODEL3': ['Standard Range Plus', 'Long Range', 'Performance'],
  'MODELY': ['Long Range', 'Performance'],
  'MODELS': ['Long Range', 'Plaid'],
  'MODELX': ['Long Range', 'Plaid'],
  
  // デフォルト
  'DEFAULT': ['ベースグレード', 'スタンダード', 'カスタム', 'ハイグレード']
};

// 型式からグレード候補を取得
export function getGradeOptions(model: string): string[] {
  if (!model) return GRADE_OPTIONS['DEFAULT'];
  
  const baseModel = model.replace(/^[A-Z]{3}-/, '').replace(/^[A-Z]-/, '').toUpperCase();
  return GRADE_OPTIONS[baseModel] || GRADE_OPTIONS['DEFAULT'];
}
