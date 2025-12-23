// @ts-nocheck
/**
 * 車両検査内部規程に基づく簡易評価ロジック。
 * 距離上限と内外装ランク、部位の損傷から参考点を算出します。
 */

export type InteriorRank = "A" | "B" | "C" | "D" | "E";

export type DefectEntry = {
  partId: string;
  list: Array<{ type: string; level?: string }>;
};

export type FinalScoreResult = {
  score: number;
  label: string; // 表示用（例: "4.5" / "S"）
  reasons: string[];
  caps: {
    distanceCap: number;
    distanceLabel: string;
    baseFromInterior: number;
    baseLabel: string;
    penalty: number;
  };
};

const INTERIOR_BASE: Record<InteriorRank, number> = {
  A: 5.0,
  B: 4.5,
  C: 4.0,
  D: 3.5,
  E: 3.0,
};

const DISTANCE_CAPS: Array<{ max: number; value: number; label: string }> = [
  { max: 10_000, value: 6.5, label: "S" },
  { max: 30_000, value: 6.0, label: "6" },
  { max: 50_000, value: 5.0, label: "5" },
  { max: 100_000, value: 4.5, label: "4.5" },
  { max: 150_000, value: 4.0, label: "4" },
  { max: Number.POSITIVE_INFINITY, value: 3.5, label: "3.5" },
];

/** 距離から上限点とラベルを決定 */
function resolveDistanceCap(mileageKm: number): {
  cap: number;
  label: string;
  reason: string;
} {
  const match =
    DISTANCE_CAPS.find((c) => mileageKm < c.max) ||
    DISTANCE_CAPS[DISTANCE_CAPS.length - 1];
  const reason = `走行距離が${mileageKm.toLocaleString()}kmのため、上限は${
    match.label
  }点に制限`; // 日本語説明
  return { cap: match.value, label: match.label, reason };
}

/**
 * 損傷数に応じた簡易ペナルティ。
 * 1件0.25点、最大1.5点まで。
 */
function defectPenalty(defects: DefectEntry[]): {
  penalty: number;
  reason: string;
} {
  const count = defects.reduce((sum, d) => sum + (d.list?.length || 0), 0);
  const penalty = Math.min(1.5, count * 0.25);
  const reason =
    count > 0
      ? `損傷 ${count} 件で ${penalty.toFixed(2)} 点減点`
      : "損傷登録なし";
  return { penalty, reason };
}

export function calculateFinalScore(params: {
  mileageKm: number;
  interiorRank: InteriorRank;
  defects: DefectEntry[];
}): FinalScoreResult {
  const mileageKm = Number(params.mileageKm) || 0;
  const interiorRank = (params.interiorRank || "A") as InteriorRank;
  const {
    cap: distanceCap,
    label: distanceLabel,
    reason: distanceReason,
  } = resolveDistanceCap(mileageKm);
  const baseFromInterior = INTERIOR_BASE[interiorRank] ?? 4.0;
  const baseLabel = `${interiorRank}ランク基準 ${baseFromInterior.toFixed(
    1
  )}点`;
  const { penalty, reason: defectReason } = defectPenalty(params.defects || []);

  const raw = baseFromInterior - penalty;
  const final = Math.max(1, Math.min(distanceCap, raw));
  const label =
    final === distanceCap && distanceLabel === "S" ? "S" : final.toFixed(1);

  const reasons = [distanceReason, baseLabel, defectReason].filter(Boolean);

  return {
    score: Number(final.toFixed(1)),
    label,
    reasons,
    caps: {
      distanceCap,
      distanceLabel,
      baseFromInterior,
      baseLabel,
      penalty,
    },
  };
}

/** 早見表（ツールチップ向け文言） */
export const QUICK_REFERENCE = `距離上限: <1万=S, <3万=6, <5万=5, <10万=4.5, <15万=4, それ以上=3.5`;
