import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCYZltE84YeG4NP-DN6K1VkYGNiJV_A2uQ",
  authDomain: "used-car-app-803c6.firebaseapp.com",
  projectId: "used-car-app-803c6",
  storageBucket: "used-car-app-803c6.firebasestorage.app",
  messagingSenderId: "897288674738",
  appId: "1:897288674738:web:e0cec589b92109397118ab",
  measurementId: "G-92TNHVLTR0"
};

// Firebase の初期化
const app = initializeApp(firebaseConfig);

// Analytics（アナリティクス）
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// Firestore（データベース） - asia-northeast1 リージョンを明示的に指定
export const db = getFirestore(app, '(default)');

// Authentication（認証）
export const auth = getAuth(app);

// Storage（ファイルストレージ）
export const storage = getStorage(app);

export default app;
