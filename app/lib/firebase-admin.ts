import "server-only";

import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { normalizeFirebasePrivateKey } from "@/app/lib/firebase-admin-config-core";

export const firebaseAdminPrivateKey = normalizeFirebasePrivateKey(process.env.FIREBASE_PRIVATE_KEY);
const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();

const app = getApps().length
  ? getApp()
  : initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: firebaseAdminPrivateKey,
      }),
    });

export const adminDb = getFirestore(app);
export const adminAuth = getAuth(app);
