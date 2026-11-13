import { initializeApp, getApps, cert, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

function getAdminApp() {
  if (getApps().length > 0) {
    return getApp();
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "elderblisscare1";
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  try {
    if (projectId && clientEmail && privateKey) {
      return initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    }
    // Safe initialization with project ID to allow non-credential operations
    return initializeApp({ projectId });
  } catch (error: any) {
    console.warn('Firebase admin initialization notice:', error.message);
    return getApps()[0] || null;
  }
}

// Resilient proxies that prevent top-level module crashes during Next.js builds on Vercel
export const adminAuth = new Proxy({} as ReturnType<typeof getAuth>, {
  get(_, prop) {
    const app = getAdminApp();
    if (!app) throw new Error("Firebase Admin not configured. Please set FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in your environment.");
    const auth = getAuth(app);
    const value = (auth as any)[prop];
    return typeof value === "function" ? value.bind(auth) : value;
  },
});

export const adminDb = new Proxy({} as ReturnType<typeof getFirestore>, {
  get(_, prop) {
    const app = getAdminApp();
    if (!app) throw new Error("Firebase Admin not configured. Please set FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in your environment.");
    const db = getFirestore(app);
    const value = (db as any)[prop];
    return typeof value === "function" ? value.bind(db) : value;
  },
});

export const adminMessaging = new Proxy({} as ReturnType<typeof getMessaging>, {
  get(_, prop) {
    const app = getAdminApp();
    if (!app) throw new Error("Firebase Admin not configured. Please set FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in your environment.");
    const msg = getMessaging(app);
    const value = (msg as any)[prop];
    return typeof value === "function" ? value.bind(msg) : value;
  },
});
