import React, { useState } from "react";
import { SpecInputSheet, CarSpec } from "./SpecInputSheet";

export default function SpecPage() {
  const [spec, setSpec] = useState<CarSpec>({
    year: "",
    model: "",
    name: "",
    mileage: ""
  });

  return (
    <div style={{ padding: 24 }}>
      <h2>車両諸元入力</h2>
      <SpecInputSheet value={spec} onChange={setSpec} />
      {/* 必要なら保存ボタンや他のUIも追加 */}
    </div>
  );
}

