// src/constants/stores.ts

export const STORES = {
  'youpos-hakata': {
    id: 'youpos-hakata',
    name: 'ユーポス博多',
    certifiedAppraisers: [], // 公認鑑定士のUIDを後で追加
  },
  'youpos-hikarinomori': {
    id: 'youpos-hikarinomori',
    name: 'ユーポス光の森',
    certifiedAppraisers: [],
  },
  'youpos-fukuokahigashi': {
    id: 'youpos-fukuokahigashi',
    name: 'ユーポス福岡東',
    certifiedAppraisers: [],
  },
} as const;

export const CERTIFIED_APPRAISERS = {
  TANAKA: 'tanaka',
  SHIMOJO: 'shimojo',
} as const;