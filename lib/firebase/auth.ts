"use client";

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  type User,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth, db } from "./client";
import { doc, getDoc } from "firebase/firestore";

export async function signIn(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signUp(email: string, password: string) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}

export async function signOut() {
  return firebaseSignOut(auth);
}

export async function resetPassword(email: string) {
  return sendPasswordResetEmail(auth, email);
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function getIdTokenResult(user: User) {
  return user.getIdTokenResult(true);
}

export interface UserClaims {
  companyId?: string;
  role?: string;
  employeeId?: string;
}

export async function getUserClaims(user: User): Promise<UserClaims> {
  const tokenResult = await user.getIdTokenResult(true);

  let companyId = tokenResult.claims.companyId as string | undefined;
  let role = tokenResult.claims.role as UserClaims["role"];
  let employeeId = tokenResult.claims.employeeId as string | undefined;

  // Fallback for manually created super admins without custom claims
  if (!role) {
    try {
      const adminDoc = await getDoc(doc(db, "admins", user.uid));
      if (adminDoc.exists()) {
        const data = adminDoc.data();
        role = data.role;
        companyId = data.companyId;
      } else {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          role = data.role;
          companyId = data.companyId;
          employeeId = data.employeeId;
        }
      }
    } catch (e) {
      console.error("Error fetching claims fallback", e);
    }
  }

  // Failsafe for the developer's email to guarantee access even if Firestore document UID mismatch
  if (user.email === "adarshshrivasta55@gmail.com" || user.email === "adarshshrivastav55@gmail.com") {
    role = "super_admin";
  }

  // Prevent crashes by always providing a default company if none is found
  if (!companyId) {
    companyId = "demo_company";
  }

  return {
    companyId,
    role,
    employeeId,
  };
}
