import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { getApps, initializeApp } from 'firebase-admin/app';

// Giải mã biến môi trường từ Base64 về JSON
const serviceAccount = JSON.parse(
    Buffer.from(process.env.NEXT_PUBLIC_FIREBASE_CREDENTIALS_BASE64!, 'base64').toString('utf-8')
  );

// Chỉ khởi tạo Firebase admin nếu chưa có khởi tạo
const appAdmin = !getApps().length
  ? initializeApp({ credential: admin.credential.cert(serviceAccount) })
  : getApps()[0];

// Xuất Firestore admin để sử dụng
export const db = getFirestore(appAdmin);
