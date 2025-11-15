// src/types/appraisal.ts

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

// src/types/user.ts

export enum UserType {
  // 契約店舗の一般鑑定士（無料鑑定のみ）
  STORE_USER = 'STORE_USER',
  // 契約店舗の管理者（在庫管理、鑑定依頼が可能）
  STORE_ADMIN = 'STORE_ADMIN',
  // 公認鑑定士（田中、下城）（再鑑定・認定の権限あり）
  CERTIFIED_APPRAISER = 'CERTIFIED_APPRAISER',
}

export interface User {
  uid: string;                    // FirebaseのユーザーID
  storeId: string;                // 所属店舗ID（例: "youpos-hakata"）
  userType: UserType;             // ユーザー権限
  name: string;                   // 鑑定士の名前
  email?: string;                 // メールアドレス（任意）
  createdAt: Date;                // アカウント作成日
}

// 店舗情報
export interface Store {
  id: string;                     // 店舗ID
  name: string;                   // 店舗名
  certifiedAppraisers: string[];  // 所属する公認鑑定士のUID
}