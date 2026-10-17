import 'server-only';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { getApps, initializeApp } from 'firebase-admin/app';

/**
 * Firebase Admin — server only.
 *
 * The service-account key bypasses every Firestore security rule, so it must
 * never reach a browser. Two guards:
 *  - the env var has no `NEXT_PUBLIC_` prefix, so Next.js never inlines it
 *    into client code even if something references it there;
 *  - `server-only` makes any client-side import of this module a build error.
 */
const credentialsB64 = process.env.FIREBASE_CREDENTIALS_BASE64;
if (!credentialsB64) {
  throw new Error('FIREBASE_CREDENTIALS_BASE64 is not set');
}

// Giải mã biến môi trường từ Base64 về JSON
const serviceAccount = JSON.parse(Buffer.from(credentialsB64, 'base64').toString('utf-8'));

// Chỉ khởi tạo Firebase admin nếu chưa có khởi tạo
const appAdmin = !getApps().length
  ? initializeApp({ credential: admin.credential.cert(serviceAccount) })
  : getApps()[0];

// Xuất Firestore admin để sử dụng
export const db = getFirestore(appAdmin);
