import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { getApps, initializeApp } from 'firebase-admin/app';

var serviceAccount = process.env.MY_FIREBASE_CREDENTIALS!;

// Chỉ khởi tạo Firebase admin nếu chưa có khởi tạo
const appAdmin = !getApps().length
  ? initializeApp({ credential: admin.credential.cert(JSON.parse(serviceAccount)) })
  : getApps()[0];

// Xuất Firestore admin để sử dụng
export const db = getFirestore(appAdmin);
