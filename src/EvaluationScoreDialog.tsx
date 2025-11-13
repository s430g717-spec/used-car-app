import React from 'react';

export function EvaluationScoreDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partDefects: { partId: string; partName: string; defects: { type: string; level: number }[] }[];
}) {
  const { open, onOpenChange, partDefects } = props;
  if (!open) return null;

  const totalDefects = partDefects.reduce((s, p) => s + p.defects.length, 0);
  const score = Math.max(0, 100 - totalDefects * 2 - partDefects.reduce((s, p) => s + p.defects.reduce((a, d) => a + d.level, 0), 0));

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ width: '90%', maxWidth: 420, background: '#fff', borderRadius: 8, padding: 16 }}>
        <h4 style={{ margin: 0 }}>評価点</h4>
        <div style={{ marginTop: 12 }}>
          <div>登録部位: {partDefects.length} 箇所</div>
          <div style={{ marginTop: 8 }}>総瑕疵数: {totalDefects}</div>
          <div style={{ marginTop: 8, fontSize: 20, fontWeight: 700 }}>スコア: {score}</div>
        </div>

        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <button onClick={() => onOpenChange(false)} style={{ flex: 1, padding: 10 }}>閉じる</button>
        </div>
      </div>
    </div>
  );
}