/**
 * TRACE Platform — Phase 5.3 Offline Pending Queue Manager
 * Provides client-side persistent queueing for field observations with
 * Base64 photo serialization, duplicate protection, and state management.
 */

import type { FieldObservationCreatePayload, FieldObservationResponse } from './api';

export type SyncStatus = 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';

export interface PendingObservation {
  localId: string;
  caseId: string;
  payload: FieldObservationCreatePayload;
  photoBase64?: string | null;
  photoName?: string | null;
  photoType?: string | null;
  syncStatus: SyncStatus;
  retryCount: number;
  lastError?: string | null;
  createdAt: string;
  updatedAt: string;
  serverId?: string | null;
  userId?: string | null;
}

const STORAGE_KEY = 'trace_offline_pending_observations_v1';

/**
 * Event emitter callback type for queue state changes
 */
type QueueChangeListener = (queue: PendingObservation[]) => void;
const queueListeners: Set<QueueChangeListener> = new Set();

export function subscribeToQueueChanges(listener: QueueChangeListener): () => void {
  queueListeners.add(listener);
  return () => {
    queueListeners.delete(listener);
  };
}

function notifyQueueListeners(queue: PendingObservation[]) {
  queueListeners.forEach((listener) => {
    try {
      listener(queue);
    } catch (err) {
      console.error('Error in queue listener callback:', err);
    }
  });
}

/**
 * Helper: Generate unique client local ID
 */
export function generateLocalId(): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 9);
  return `obs_local_${timestamp}_${randomStr}`;
}

/**
 * Helper: Convert File object to Base64 string for persistent offline storage
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Helper: Reconstruct File object from stored Base64 string for upload
 */
export function base64ToFile(base64String: string, filename: string = 'field_observation_photo.jpg'): File {
  const arr = base64String.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const bstr = atob(arr[1] || arr[0]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

/**
 * Load all pending observations from local persistent storage
 */
export function getPendingQueue(): PendingObservation[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const parsed: PendingObservation[] = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to parse offline pending queue from localStorage:', err);
    return [];
  }
}

/**
 * Save complete pending queue to local persistent storage
 */
export function savePendingQueue(queue: PendingObservation[]): boolean {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    notifyQueueListeners(queue);
    return true;
  } catch (err) {
    console.error('Failed to save offline pending queue to localStorage:', err);
    return false;
  }
}

/**
 * Enqueue a new field observation for offline persistence & retry
 */
export async function enqueueObservation(
  caseId: string,
  payload: FieldObservationCreatePayload,
  photoFile?: File | null,
  userId?: string | null
): Promise<PendingObservation> {
  let photoBase64: string | null = null;
  let photoName: string | null = null;
  let photoType: string | null = null;

  if (photoFile) {
    try {
      photoBase64 = await fileToBase64(photoFile);
      photoName = photoFile.name;
      photoType = photoFile.type;
    } catch (err) {
      console.warn('Could not convert photo to Base64 for offline queueing:', err);
    }
  }

  const now = new Date().toISOString();
  const newItem: PendingObservation = {
    localId: generateLocalId(),
    caseId,
    payload,
    photoBase64,
    photoName,
    photoType,
    syncStatus: 'PENDING',
    retryCount: 0,
    lastError: null,
    createdAt: now,
    updatedAt: now,
    userId: userId || 'anonymous_sentinel',
  };

  const currentQueue = getPendingQueue();
  // Prevent duplicate enqueue of exact same payload within 2 seconds
  const isDuplicate = currentQueue.some(
    (item) =>
      item.caseId === caseId &&
      item.payload.latitude === payload.latitude &&
      item.payload.longitude === payload.longitude &&
      item.payload.note === payload.note &&
      Math.abs(new Date(item.createdAt).getTime() - new Date(now).getTime()) < 2000
  );

  if (isDuplicate) {
    console.log('Prevented duplicate offline queue insertion.');
    return currentQueue.find(
      (item) =>
        item.caseId === caseId &&
        item.payload.latitude === payload.latitude &&
        item.payload.longitude === payload.longitude
    )!;
  }

  const updatedQueue = [newItem, ...currentQueue];
  const saved = savePendingQueue(updatedQueue);

  if (!saved && photoBase64) {
    // If quota exceeded due to Base64 image, fallback to saving metadata without Base64 photo to preserve observation
    console.warn('Storage quota exceeded with Base64 photo. Saving observation metadata without Base64 photo.');
    const fallbackItem: PendingObservation = { ...newItem, photoBase64: null };
    const fallbackQueue = [fallbackItem, ...currentQueue];
    const fallbackSaved = savePendingQueue(fallbackQueue);
    if (!fallbackSaved) {
      throw new Error('Local storage capacity exceeded. Unable to save observation offline.');
    }
    return fallbackItem;
  } else if (!saved) {
    throw new Error('Local storage capacity exceeded. Unable to save observation offline.');
  }

  return newItem;
}

/**
 * Update state of a specific observation in the queue
 */
export function updateObservationStatus(
  localId: string,
  status: SyncStatus,
  updates?: Partial<PendingObservation>
): PendingObservation | null {
  const currentQueue = getPendingQueue();
  const idx = currentQueue.findIndex((item) => item.localId === localId);
  if (idx === -1) return null;

  const updatedItem: PendingObservation = {
    ...currentQueue[idx],
    ...updates,
    syncStatus: status,
    updatedAt: new Date().toISOString(),
  };

  currentQueue[idx] = updatedItem;
  savePendingQueue(currentQueue);
  return updatedItem;
}

/**
 * Mark a local observation as SYNCED upon server response confirmation
 */
export function markObservationSynced(localId: string, serverId: string): PendingObservation | null {
  return updateObservationStatus(localId, 'SYNCED', {
    serverId,
    lastError: null,
  });
}

/**
 * Remove a specific observation from the queue
 */
export function removePendingObservation(localId: string): void {
  const currentQueue = getPendingQueue();
  const updatedQueue = currentQueue.filter((item) => item.localId !== localId);
  savePendingQueue(updatedQueue);
}

/**
 * Clear all SYNCED observations from the local queue to free storage space
 */
export function clearSyncedObservations(): void {
  const currentQueue = getPendingQueue();
  const activeQueue = currentQueue.filter((item) => item.syncStatus !== 'SYNCED');
  savePendingQueue(activeQueue);
}

/**
 * Count active unsynced (PENDING / SYNCING / FAILED) items in queue
 */
export function getUnsyncedCount(): number {
  const queue = getPendingQueue();
  return queue.filter((item) => item.syncStatus !== 'SYNCED').length;
}
