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

      // Check if the employee exists under companies/{companyId}/employees
      if (!role) {
        const effectiveCompany = companyId || "demo_company";
        const empDoc = await getDoc(doc(db, "companies", effectiveCompany, "employees", user.uid));
        if (empDoc.exists()) {
          const empData = empDoc.data();
          role = empData.role;
          if (empData.companyId) companyId = empData.companyId;
          employeeId = empDoc.id;
        } else if (user.email) {
          const { collection, query, where, getDocs } = await import("firebase/firestore");
          const q = query(collection(db, "companies", effectiveCompany, "employees"), where("email", "==", user.email));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const empData = snap.docs[0].data();
            role = empData.role;
            if (empData.companyId) companyId = empData.companyId;
            employeeId = snap.docs[0].id;
          }
        }
      }
    } catch (e) {
      console.error("Error fetching claims fallback", e);
    }
  }

  // Failsafe for admin and developer emails to guarantee access
  const emailLower = (user.email || "").toLowerCase();
  if (
    emailLower === "adarshshrivasta55@gmail.com" ||
    emailLower === "adarshshrivastav55@gmail.com" ||
    emailLower === "admin@nsc.com"
  ) {
    role = "super_admin";
  } else if (!role && emailLower.includes("admin")) {
    role = "hr_admin";
  }

  // Prevent crashes by always providing a default company if none is found
  if (!companyId) {
    companyId = "demo_company";
  }

  if (!employeeId) {
    employeeId = user.uid;
  }

  return {
    companyId,
    role,
    employeeId,
  };
}
