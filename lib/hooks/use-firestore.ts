import useSWR from 'swr';
import { listDocuments, getDocument } from '@/lib/firebase/firestore';
import type { QueryConstraint } from 'firebase/firestore';
/**
 * Hook to fetch and cache a collection from Firestore using SWR.
 */
export function useCollection<T>(companyId: string | undefined | null, collectionName: string, constraints: QueryConstraint[] = []) {
  // We use a serialized key so SWR can properly cache based on constraints.
  // Since QueryConstraint objects aren't easily serializable, we just use the collection name and companyId as the primary cache key.
  const key = companyId ? `collection_${companyId}_${collectionName}` : null;

  const fetcher = async () => {
    if (!companyId) throw new Error("Company ID required");
    return listDocuments<T>(companyId, collectionName, constraints);
  };

  const { data, error, isLoading, mutate } = useSWR<Array<T & { id: string }>>(key, fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 60000, // Dedupe requests within 1 minute
  });

  return {
    data: data || [],
    loading: isLoading,
    error,
    mutate,
  };
}

/**
 * Hook to fetch and cache a single document from Firestore using SWR.
 */
export function useDoc<T>(companyId: string | undefined | null, collectionName: string, docId: string | undefined | null) {
  const key = companyId && docId ? `doc_${companyId}_${collectionName}_${docId}` : null;

  const fetcher = async () => {
    if (!companyId || !docId) throw new Error("Company ID or Doc ID required");
    return getDocument<T>(companyId, collectionName, docId);
  };

  const { data, error, isLoading, mutate } = useSWR<(T & { id: string }) | null>(key, fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 60000,
  });

  return {
    data,
    loading: isLoading,
    error,
    mutate,
  };
}
