// Shared parts configuration for diagram and reports
export type Part = {
  id: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export const DIAGRAM_SRC = `${import.meta.env.BASE_URL}car_diagram_v3.png`;
export const STEP_Y = 4;

export const parts: Part[] = [
  {
    id: "front-bumper",
    name: "フロントバンパー",
    x: 35,
    y: 5 - STEP_Y,
    w: 30,
    h: 8,
  },
  {
    id: "hood",
    name: "ボンネット",
    x: 35,
    y: 13 - STEP_Y,
    w: 30,
    h: 15 + STEP_Y,
  },
  {
    id: "left-fender",
    name: "左Fフェンダー",
    x: 35 - 12,
    y: 13 - STEP_Y,
    w: 12,
    h: 15 + STEP_Y,
  },
  {
    id: "right-fender",
    name: "右Fフェンダー",
    x: 35 + 30,
    y: 13 - STEP_Y,
    w: 12,
    h: 15 + STEP_Y,
  },
  { id: "left-f-door", name: "左Fドア", x: 23, y: 28, w: 12, h: 20 },
  { id: "left-r-door", name: "左Rドア", x: 23, y: 48, w: 12, h: 21 },
  { id: "right-f-door", name: "右Fドア", x: 65, y: 28, w: 12, h: 20 },
  { id: "right-r-door", name: "右Rドア", x: 65, y: 48, w: 12, h: 21 },
  {
    id: "left-step",
    name: "左ステップ",
    x: 18 - STEP_Y,
    y: 28,
    w: 5 + STEP_Y,
    h: 41 - 2 * STEP_Y,
  },
  {
    id: "right-step",
    name: "右ステップ",
    x: 77,
    y: 28,
    w: 5 + STEP_Y,
    h: 41 - 2 * STEP_Y,
  },
  {
    id: "left-r-fender",
    name: "左Rフェンダー",
    x: 23,
    y: 69,
    w: 12,
    h: 12 + STEP_Y,
  },
  {
    id: "right-r-fender",
    name: "右Rフェンダー",
    x: 65,
    y: 69,
    w: 12,
    h: 12 + STEP_Y,
  },
  (() => {
    const hoodY = 13 - STEP_Y;
    const hoodH = 15 + STEP_Y;
    const windshieldH = 3 * STEP_Y;
    const roofTop = hoodY + hoodH + windshieldH;
    const rearGateTop = 69;
    const roofH = Math.max(0, rearGateTop - roofTop);
    return {
      id: "roof",
      name: "ルーフ",
      x: 35,
      y: roofTop,
      w: 30,
      h: roofH,
    } as Part;
  })(),
  (() => {
    const hoodY = 13 - STEP_Y;
    const hoodH = 15 + STEP_Y;
    const y = hoodY + hoodH;
    const h = 3 * STEP_Y;
    return { id: "front-glass", name: "Fガラス", x: 35, y, w: 30, h } as Part;
  })(),
  { id: "rear-gate", name: "リアゲート", x: 35, y: 69, w: 30, h: 12 + STEP_Y },
  {
    id: "rear-bumper",
    name: "リアバンパー",
    x: 35,
    y: 80 + 2 * STEP_Y,
    w: 30,
    h: 8,
  },
];
