"use client";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  type DocumentData,
  type QueryConstraint,
  type DocumentReference,
  serverTimestamp,
  onSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./client";

/**
 * Get a reference to a company's subcollection.
 * All data is scoped under companies/{companyId}/...
 */
export function getCompanyCollection(companyId: string, collectionName: string) {
  return collection(db, "companies", companyId, collectionName);
}

export function getCompanyDoc(companyId: string, collectionName: string, docId: string) {
  return doc(db, "companies", companyId, collectionName, docId);
}

export function getCompanyRef(companyId: string) {
  return doc(db, "companies", companyId);
}

/* ── Generic CRUD helpers ────────────────────────────── */

export async function createDocument<T extends DocumentData>(
  companyId: string,
  collectionName: string,
  data: T,
  customId?: string
): Promise<string> {
  const timestampedData = {
    ...data,
    companyId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (customId) {
    const docRef = getCompanyDoc(companyId, collectionName, customId);
    await setDoc(docRef, timestampedData);
    return customId;
  }

  const collRef = getCompanyCollection(companyId, collectionName);
  const docRef = await addDoc(collRef, timestampedData);
  return docRef.id;
}

export async function getDocument<T>(
  companyId: string,
  collectionName: string,
  docId: string
): Promise<(T & { id: string }) | null> {
  const docRef = getCompanyDoc(companyId, collectionName, docId);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as T & { id: string };
}

export async function listDocuments<T>(
  companyId: string,
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<(T & { id: string })[]> {
  const collRef = getCompanyCollection(companyId, collectionName);
  const q = query(collRef, ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as T & { id: string });
}

export async function updateDocument<T extends DocumentData>(
  companyId: string,
  collectionName: string,
  docId: string,
  data: Partial<T>
): Promise<void> {
  const docRef = getCompanyDoc(companyId, collectionName, docId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  } as DocumentData);
}

export async function deleteDocument(
  companyId: string,
  collectionName: string,
  docId: string
): Promise<void> {
  const docRef = getCompanyDoc(companyId, collectionName, docId);
  await deleteDoc(docRef);
}

export function subscribeToCollection<T>(
  companyId: string,
  collectionName: string,
  callback: (docs: (T & { id: string })[]) => void,
  constraints: QueryConstraint[] = []
): Unsubscribe {
  const collRef = getCompanyCollection(companyId, collectionName);
  const q = query(collRef, ...constraints);
  return onSnapshot(q, (snapshot) => {
    const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as T & { id: string });
    callback(docs);
  });
}

export function subscribeToDocument<T>(
  companyId: string,
  collectionName: string,
  docId: string,
  callback: (doc: (T & { id: string }) | null) => void
): Unsubscribe {
  const docRef = getCompanyDoc(companyId, collectionName, docId);
  return onSnapshot(docRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }
    callback({ id: snapshot.id, ...snapshot.data() } as T & { id: string });
  });
}

/* Re-export query helpers for convenience */
export { where, orderBy, limit, startAfter, serverTimestamp };
