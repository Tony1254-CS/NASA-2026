'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getPendingQueue,
  getUnsyncedCount,
  subscribeToQueueChanges,
  updateObservationStatus,
  markObservationSynced,
  base64ToFile,
  enqueueObservation,
  type PendingObservation,
} from './offlineQueue';
import { createFieldObservation, fetchHealthStatus, type FieldObservationCreatePayload, type FieldObservationResponse } from './api';

export interface UseOfflineSyncReturn {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  lastSyncTime: string | null;
  syncError: string | null;
  syncPendingQueue: () => Promise<void>;
  enqueueAndSync: (
    caseId: string,
    payload: FieldObservationCreatePayload,
    photoFile?: File | null,
    userId?: string | null
  ) => Promise<{ observation: FieldObservationResponse | null; pendingItem: PendingObservation }>;
}

export function useOfflineSync(): UseOfflineSyncReturn {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const isSyncingRef = useRef<boolean>(false);

  // Sync count on queue change
  useEffect(() => {
    setPendingCount(getUnsyncedCount());
    const unsubscribe = subscribeToQueueChanges(() => {
      setPendingCount(getUnsyncedCount());
    });
    return () => unsubscribe();
  }, []);

  // Sync process implementation
  const syncPendingQueue = useCallback(async () => {
    if (isSyncingRef.current) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOnline(false);
      return;
    }

    const queue = getPendingQueue();
    // Only auto-sync items that are PENDING and have not exceeded 5 max retries
    const itemsToSync = queue.filter((item) => item.syncStatus === 'PENDING' && item.retryCount < 5);

    if (itemsToSync.length === 0) return;

    isSyncingRef.current = true;
    setIsSyncing(true);
    setSyncError(null);

    let syncedAny = false;

    for (const item of itemsToSync) {
      // Re-verify network status before starting each item
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setIsOnline(false);
        break;
      }

      updateObservationStatus(item.localId, 'SYNCING');

      try {
        let file: File | undefined = undefined;
        if (item.photoBase64) {
          file = base64ToFile(item.photoBase64, item.photoName || 'field_photo.jpg');
        }

        const res = await createFieldObservation(item.caseId, item.payload, file);

        if (res && res.id) {
          markObservationSynced(item.localId, res.id);
          syncedAny = true;
        } else {
          updateObservationStatus(item.localId, 'FAILED', {
            lastError: 'Server returned empty response metadata.',
            retryCount: item.retryCount + 1,
          });
        }
      } catch (err: any) {
        const errorMsg = err.message || 'Synchronization request failed.';
        const isNetworkErr =
          errorMsg.includes('Failed to fetch') ||
          errorMsg.includes('NetworkError') ||
          errorMsg.includes('HTTP 502') ||
          errorMsg.includes('HTTP 503') ||
          errorMsg.includes('HTTP 504') ||
          (typeof navigator !== 'undefined' && !navigator.onLine);

        if (isNetworkErr) {
          setIsOnline(false);
          updateObservationStatus(item.localId, 'PENDING', {
            lastError: `Network temporary issue: ${errorMsg}`,
            retryCount: item.retryCount + 1,
          });
          // Pause queue processing on network failure
          break;
        } else {
          // Validation / Permanent error
          updateObservationStatus(item.localId, 'FAILED', {
            lastError: errorMsg,
            retryCount: item.retryCount + 1,
          });
        }
      }
    }

    if (syncedAny) {
      setLastSyncTime(new Date().toISOString());
    }

    isSyncingRef.current = false;
    setIsSyncing(false);
  }, []);

  // Monitor network status changes (online/offline)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
      // Soft ping to confirm server availability before syncing
      fetchHealthStatus()
        .then(() => {
          syncPendingQueue();
        })
        .catch(() => {
          // Connected to network but server down
        });
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check on mount
    if (navigator.onLine && getUnsyncedCount() > 0) {
      syncPendingQueue();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncPendingQueue]);

  /**
   * Safe submission entrypoint: Save locally first, then attempt server sync if online
   */
  const enqueueAndSync = useCallback(
    async (
      caseId: string,
      payload: FieldObservationCreatePayload,
      photoFile?: File | null,
      userId?: string | null
    ) => {
      // Step 1: Save locally first
      const pendingItem = await enqueueObservation(caseId, payload, photoFile, userId);

      // Step 2: Attempt sync if online
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        try {
          updateObservationStatus(pendingItem.localId, 'SYNCING');
          const res = await createFieldObservation(caseId, payload, photoFile);
          if (res && res.id) {
            markObservationSynced(pendingItem.localId, res.id);
            setLastSyncTime(new Date().toISOString());
            return { observation: res, pendingItem };
          }
        } catch (err: any) {
          const errorMsg = err.message || 'Direct upload failed, saved in offline queue.';
          updateObservationStatus(pendingItem.localId, 'PENDING', {
            lastError: errorMsg,
            retryCount: pendingItem.retryCount + 1,
          });
        }
      }

      return { observation: null, pendingItem };
    },
    []
  );

  return {
    isOnline,
    pendingCount,
    isSyncing,
    lastSyncTime,
    syncError,
    syncPendingQueue,
    enqueueAndSync,
  };
}
