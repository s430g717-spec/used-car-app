import React from 'react';

// 仮のprops定義 (元のコード構造に合わせるため)
interface AppraisalOutputModalProps {
  // ここにpropsを定義
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evaluation: any; // EvaluationScore型を想定
}

// 名前付きエクスポートを使用
export function AppraisalOutputModal({ open, onOpenChange, evaluation }: AppraisalOutputModalProps) {
  if (!open || !evaluation) return null; // モーダルが閉じていたら何も表示しない

  return (
    // ここにモーダルのUIを記述します (現在はシンプルな仮の内容)
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full">
        <h2 className="text-xl font-bold mb-4">鑑定書出力モーダル (仮)</h2>
        <p>コンポーネントは正常にロードされました。</p>
        <button 
          onClick={() => onOpenChange(false)} 
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          閉じる
        </button>
      </div>
    </div>
  );
}