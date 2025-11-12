// 型式から車名を推測するデータベース（主要な国産車）
export const CAR_MODEL_DATABASE: Record<string, string[]> = {
  // トヨタ
  'NRE210': ['カローラスポーツ'],
  'ZRE212': ['カローラ', 'カローラツーリング'],
  'ZWE211': ['カローラ', 'カローラツーリング'],
  'MZEA12': ['カローラクロス'],
  'AXAH54': ['ハリアー'],
  'MXUA80': ['ハリアー'],
  'AXVH70': ['ノア', 'ヴォクシー'],
  'ZWR95': ['ノア', 'ヴォクシー'],
  'GR210': ['クラウン'],
  'AZSH20': ['クラウン'],
  'TNGA1': ['プリウス'],
  'ZVW50': ['プリウス'],
  'ZVW55': ['プリウス'],
  'MXAA54': ['RAV4'],
  'AXAH52': ['RAV4'],
  'ZSU60': ['ハリアー（旧型）'],
  'NHP10': ['アクア'],
  'MXPK10': ['アクア'],
  
  // 日産
  'E13': ['ノート'],
  'SNE13': ['ノート e-POWER'],
  'HE12': ['ノート（旧型）'],
  'C27': ['セレナ'],
  'GC27': ['セレナ'],
  'T33': ['エクストレイル'],
  'NT33': ['エクストレイル'],
  'Z12': ['キューブ'],
  'E52': ['エルグランド'],
  'B17': ['シルフィ'],
  'Z34': ['フェアレディZ'],
  'R35': ['GT-R'],
  'V37': ['スカイライン'],
  
  // ホンダ
  'FC1': ['シビック'],
  'FK7': ['シビック'],
  'RU1': ['ヴェゼル'],
  'RV3': ['ヴェゼル'],
  'RP1': ['ステップワゴン'],
  'RP5': ['ステップワゴン'],
  'GB5': ['フリード'],
  'GB7': ['フリード'],
  'RK1': ['ステップワゴン（旧型）'],
  'GK3': ['フィット'],
  'GR1': ['フィット'],
  'ZF1': ['CR-Z'],
  'RT1': ['CR-V'],
  
  // マツダ
  'BP5P': ['マツダ3', 'アクセラ'],
  'BP8P': ['マツダ3', 'アクセラ'],
  'BPEP': ['マツダ3', 'アクセラ'],
  'KF2P': ['CX-5'],
  'KF5P': ['CX-5'],
  'DM8P': ['CX-8'],
  'DMFP': ['CX-8'],
  '3DA': ['CX-30'],
  '3BA': ['CX-3'],
  'ND5RC': ['ロードスター'],
  'DJ5FS': ['デミオ'],
  
  // スバル
  'VM4': ['レヴォーグ'],
  'VMG': ['レヴォーグ'],
  'VN5': ['レヴォーグ'],
  'SK9': ['フォレスター'],
  'SKE': ['フォレスター'],
  'GT3': ['インプレッサ'],
  'GT7': ['インプレッサ'],
  'GK2': ['インプレッサ'],
  'VAB': ['WRX STI'],
  'VAG': ['WRX'],
  'ZD8': ['BRZ'],
  
  // ダイハツ
  'LA250S': ['キャスト'],
  'LA800S': ['ムーヴキャンバス'],
  'LA150S': ['ムーヴ'],
  'LA600S': ['タント'],
  'M700S': ['ブーン'],
  'LA710S': ['ウェイク'],
  
  // スズキ
  'MR52S': ['ハスラー'],
  'MR92S': ['ハスラー'],
  'MA37S': ['ソリオ'],
  'ZC33S': ['スイフトスポーツ'],
  'ZC13S': ['スイフト'],
  'MK53S': ['スペーシア'],
  'MN71S': ['クロスビー'],
  'JB64W': ['ジムニー'],
  'JB74W': ['ジムニーシエラ']
};

// 型式の一部から車名候補を検索
export function searchCarNamesByModel(modelInput: string): string[] {
  if (!modelInput || modelInput.length < 3) return [];
  
  const upperModel = modelInput.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const candidates = new Set<string>();
  
  // 完全一致
  if (CAR_MODEL_DATABASE[upperModel]) {
    CAR_MODEL_DATABASE[upperModel].forEach(name => candidates.add(name));
  }
  
  // 部分一致（型式の後半部分で検索）
  Object.entries(CAR_MODEL_DATABASE).forEach(([key, names]) => {
    if (key.includes(upperModel) || upperModel.includes(key)) {
      names.forEach(name => candidates.add(name));
    }
  });
  
  return Array.from(candidates).sort();
}
