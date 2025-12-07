/**
 * 中古車評価点自動算出ロジック
 * USS形式の評価基準に基づく
 */

export type AppraisalScore = 'S' | '6' | '5' | '4.5' | '4' | '3.5' | '3' | 'R';
export type InteriorRank = 'A' | 'B' | 'C' | 'D' | 'E';

/**
 * 車両の基本情報に基づいて評価点の上限を算出
 * 
 * @param mileageKm - 走行距離（キロメートル）
 * @param elapsedMonths - 経過月数
 * @param isRepaired - 修復歴の有無
 * @param interiorRank - 内装ランク（4.5点以上の判定に使用）
 * @param hasExteriorReplacement - 外装部品の交換歴の有無（5点判定に使用）
 * @returns 総合評価点の最大値
 */
export function getMaxAppraisalScore(
  mileageKm: number,
  elapsedMonths: number,
  isRepaired: boolean = false,
  interiorRank: InteriorRank = 'C',
  hasExteriorReplacement: boolean = false
): AppraisalScore {
  // 修復歴車は即座にR点
  if (isRepaired) {
    return 'R';
  }

  // S点: 10,000km未満 かつ 12ヶ月まで
  if (mileageKm < 10000 && elapsedMonths <= 12) {
    return 'S';
  }

  // 6点: 30,000km未満 かつ 36ヶ月まで
  if (mileageKm < 30000 && elapsedMonths <= 36) {
    return '6';
  }

  // 5点: 50,000km未満 かつ 外装部品の交換のないもの
  if (mileageKm < 50000 && !hasExteriorReplacement) {
    return '5';
  }

  // 4.5点: 100,000km未満 かつ 内装ランクB以上
  if (mileageKm < 100000 && ['A', 'B'].includes(interiorRank)) {
    return '4.5';
  }

  // 4点: 150,000km未満 かつ 内装ランクC以上
  if (mileageKm < 150000 && ['A', 'B', 'C'].includes(interiorRank)) {
    return '4';
  }

  // 3.5点: 上記に該当しない場合の基本点
  if (mileageKm < 200000) {
    return '3.5';
  }

  // 3点: それ以外
  return '3';
}

/**
 * 年式から経過月数を計算
 * 
 * @param year - 車両の年式
 * @returns 経過月数
 */
export function calculateElapsedMonths(year: number): number {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // 0-11 -> 1-12

  // 年式は通常1月を基準とするため、年の差×12 + 現在の月数
  const elapsedYears = currentYear - year;
  const elapsedMonths = elapsedYears * 12 + currentMonth;

  return elapsedMonths;
}

/**
 * 評価点を数値に変換（比較・計算用）
 * 
 * @param score - 評価点
 * @returns 数値
 */
export function scoreToNumber(score: AppraisalScore): number {
  switch (score) {
    case 'S': return 10;
    case '6': return 6;
    case '5': return 5;
    case '4.5': return 4.5;
    case '4': return 4;
    case '3.5': return 3.5;
    case '3': return 3;
    case 'R': return 0;
    default: return 0;
  }
}

/**
 * 数値を評価点に変換
 * 
 * @param num - 数値
 * @returns 評価点
 */
export function numberToScore(num: number): AppraisalScore {
  if (num >= 10) return 'S';
  if (num >= 6) return '6';
  if (num >= 5) return '5';
  if (num >= 4.5) return '4.5';
  if (num >= 4) return '4';
  if (num >= 3.5) return '3.5';
  if (num >= 3) return '3';
  return 'R';
}

/**
 * 瑕疵情報から減点を計算
 * 
 * @param defects - 瑕疵の配列
 * @returns 減点（0.5点刻み）
 */
export function calculateDefectDeduction(defects: Array<{ type: string; level: string }>): number {
  let totalDeduction = 0;

  defects.forEach(defect => {
    const level = parseInt(defect.level);
    
    // 交換歴（XX）は大減点
    if (defect.type === 'XX' || defect.type === '✖✖') {
      totalDeduction += 1.0;
      return;
    }

    // レベルに応じた減点
    switch (level) {
      case 1: // 軽微な瑕疵
        totalDeduction += 0.1;
        break;
      case 2: // 中程度の瑕疵
        totalDeduction += 0.3;
        break;
      case 3: // 重大な瑕疵
        totalDeduction += 0.5;
        break;
      default:
        totalDeduction += 0.1;
    }

    // 瑕疵の種類による追加減点
    if (defect.type === 'A' || defect.type === 'U') {
      // 凹み系は追加減点
      totalDeduction += 0.1;
    }
  });

  // 0.5点刻みに丸める
  return Math.ceil(totalDeduction * 2) / 2;
}

/**
 * 総合的な評価点を算出（上限点数から減点を引く）
 * 
 * @param maxScore - 基本情報から算出された上限点数
 * @param defects - 瑕疵の配列
 * @returns 最終的な評価点
 */
export function calculateFinalScore(
  maxScore: AppraisalScore,
  defects: Array<{ type: string; level: string }>
): AppraisalScore {
  // R点の場合はそのまま返す
  if (maxScore === 'R') {
    return 'R';
  }

  const maxScoreNum = scoreToNumber(maxScore);
  const deduction = calculateDefectDeduction(defects);
  const finalScoreNum = Math.max(3, maxScoreNum - deduction); // 最低3点

  return numberToScore(finalScoreNum);
}

/**
 * 内装ランクを判定（仮実装）
 * 実際のシステムでは内装の状態評価から判定
 * 
 * @param interiorCondition - 内装状態（仮のパラメータ）
 * @returns 内装ランク
 */
export function determineInteriorRank(interiorCondition: string): InteriorRank {
  // 仮実装：文字列から判定
  const condition = interiorCondition.toUpperCase();
  
  if (condition.includes('A') || condition === 'EXCELLENT') return 'A';
  if (condition.includes('B') || condition === 'GOOD') return 'B';
  if (condition.includes('C') || condition === 'FAIR') return 'C';
  if (condition.includes('D') || condition === 'POOR') return 'D';
  return 'E';
}

/**
 * 評価基準の詳細情報を取得
 * 
 * @param score - 評価点
 * @returns 評価基準の説明
 */
export function getScoreDescription(score: AppraisalScore): string {
  switch (score) {
    case 'S':
      return '極上車：走行距離10,000km未満、12ヶ月以内、ほぼ無傷';
    case '6':
      return '特選車：走行距離30,000km未満、36ヶ月以内、小傷程度';
    case '5':
      return '良好車：走行距離50,000km未満、外装部品交換なし';
    case '4.5':
      return '良車：走行距離100,000km未満、内装Bランク以上';
    case '4':
      return '標準車：走行距離150,000km未満、内装Cランク以上';
    case '3.5':
      return '標準車：一般的な中古車';
    case '3':
      return '走行過多車：加修が必要、または走行過多';
    case 'R':
      return '修復歴車：事故修復歴あり';
    default:
      return '';
  }
}

/**
 * 評価基準の上限情報を文字列で取得
 * 
 * @param score - 評価点
 * @returns 基準の詳細
 */
export function getScoreCriteria(score: AppraisalScore): {
  mileageLimit: string;
  monthsLimit: string;
  additionalConditions: string[];
} {
  switch (score) {
    case 'S':
      return {
        mileageLimit: '10,000km未満',
        monthsLimit: '12ヶ月まで',
        additionalConditions: [],
      };
    case '6':
      return {
        mileageLimit: '30,000km未満',
        monthsLimit: '36ヶ月まで',
        additionalConditions: [],
      };
    case '5':
      return {
        mileageLimit: '50,000km未満',
        monthsLimit: '制限なし',
        additionalConditions: ['外装部品の交換のないもの'],
      };
    case '4.5':
      return {
        mileageLimit: '100,000km未満',
        monthsLimit: '制限なし',
        additionalConditions: ['内装Bランク以上'],
      };
    case '4':
      return {
        mileageLimit: '150,000km未満',
        monthsLimit: '制限なし',
        additionalConditions: ['内装Cランク以上'],
      };
    case '3.5':
    case '3':
      return {
        mileageLimit: '制限なし',
        monthsLimit: '制限なし',
        additionalConditions: [],
      };
    case 'R':
      return {
        mileageLimit: '-',
        monthsLimit: '-',
        additionalConditions: ['修復歴車'],
      };
    default:
      return {
        mileageLimit: '-',
        monthsLimit: '-',
        additionalConditions: [],
      };
  }
}
