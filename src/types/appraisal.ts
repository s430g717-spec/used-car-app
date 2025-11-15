export enum CertificationStatus {
  NONE = 'NONE',               // 認定なし（通常鑑定）
  REQUESTED = 'REQUESTED',     // 認定依頼中
  CERTIFIED = 'CERTIFIED',     // 認定済み
}

export interface Defect {
  type: string;
  level?: string;
  note?: string;
}

export interface CarSpec {
  year: string;
  model: string;
  name: string;
  mileage: string;
  [key: string]: string;
}

export interface AppraisalData {
  id?: string;                              // ドキュメントID
  storeId: string;                          // 鑑定を行った店舗のID
  appraiserId: string;                      // 鑑定士のUID
  appraiserName: string;                    // 鑑定士の名前
  
  // 車両情報
  carSpec: CarSpec;                         // 諸元
  defects: { [partName: string]: Defect[] }; // 瑕疵データ
  
  // 認定関連
  certificationStatus: CertificationStatus; // 認定状態
  certifiedBy?: string;                     // 認定した公認鑑定士のUID
  certifiedByName?: string;                 // 認定した公認鑑定士の名前
  certifiedAt?: Date;                       // 認定日時
  
  // メタデータ
  createdAt: Date;                          // 作成日時
  updatedAt: Date;                          // 更新日時
}