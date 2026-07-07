import { openDB, type IDBPDatabase } from 'idb'
import imageCompression from 'browser-image-compression'

const DB_NAME = 'shasthyahub-offline-queue'
const DB_VERSION = 1
const STORE_NAME = 'pending-analyses'

export interface QueueItem {
  id?: number
  agentType: 'nayan' | 'scriptguard' | 'glycovision'
  imageBlob: Blob
  localResult: Record<string, unknown>
  compressedSizeBytes?: number
  status: 'pending' | 'syncing' | 'synced' | 'failed'
  createdAt: number
  syncedAt?: number
  retryCount: number
}

let dbPromise: Promise<IDBPDatabase> | null = null

async function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, {
            keyPath: 'id',
            autoIncrement: true,
          })
          store.createIndex('status', 'status')
          store.createIndex('agentType', 'agentType')
        }
      },
    })
  }
  return dbPromise
}

async function requestPersistentStorage(): Promise<boolean> {
  if (
    typeof navigator !== 'undefined' &&
    'storage' in navigator &&
    'persist' in navigator.storage
  ) {
    try {
      const granted = await navigator.storage.persist()
      if (granted) {
        console.log('[OfflineQueue] Persistent storage granted')
      } else {
        console.warn('[OfflineQueue] Persistent storage denied — data may be evicted under storage pressure')
      }
      const persisted = await navigator.storage.persisted()
      console.log('[OfflineQueue] Persisted status:', persisted)
      return granted
    } catch (err) {
      console.warn('[OfflineQueue] Error requesting persistent storage:', err)
      return false
    }
  }
  console.log('[OfflineQueue] Storage Manager API not available')
  return false
}

export async function initQueue(): Promise<void> {
  await getDb()
  await requestPersistentStorage()
}

export async function enqueueAnalysis(
  agentType: QueueItem['agentType'],
  imageBlob: Blob | File,
  localResult: Record<string, unknown>
): Promise<number> {
  const file = imageBlob instanceof File ? imageBlob : new File([imageBlob], 'capture.webp', { type: 'image/webp' })
  const compressed = await imageCompression(file, {
    maxSizeMB: 0.15,
    maxWidthOrHeight: 1024,
    useWebWorker: true,
    fileType: 'image/webp',
  })

  const db = await getDb()
  const item: Omit<QueueItem, 'id'> = {
    agentType,
    imageBlob: compressed,
    localResult,
    compressedSizeBytes: compressed.size,
    status: 'pending',
    createdAt: Date.now(),
    retryCount: 0,
  }

  const id = await db.add(STORE_NAME, item)

  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready
      if ('sync' in registration) {
        const reg = registration as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }
        await reg.sync.register('sync-analyses')
      }
    } catch (err) {
      console.warn('[OfflineQueue] Background Sync registration failed:', err)
    }
  }

  return id as number
}

export async function getPendingAnalyses(): Promise<QueueItem[]> {
  const db = await getDb()
  const index = db.transaction(STORE_NAME, 'readonly').store.index('status')
  return index.getAll('pending')
}

export async function getUnsyncedAnalyses(): Promise<QueueItem[]> {
  const db = await getDb()
  const tx = db.transaction(STORE_NAME, 'readonly')
  const store = tx.objectStore(STORE_NAME)
  const index = store.index('status')
  const pending = await index.getAll('pending')
  const failed = await index.getAll('failed')
  return [...pending, ...failed]
}

export async function markSynced(id: number): Promise<void> {
  const db = await getDb()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)
  const item = await store.get(id)
  if (item) {
    item.status = 'synced'
    item.syncedAt = Date.now()
    await store.put(item)
  }
}

export async function markFailed(id: number): Promise<void> {
  const db = await getDb()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)
  const item = await store.get(id)
  if (item) {
    item.status = 'failed'
    item.retryCount += 1
    await store.put(item)
  }
}

export async function markSyncing(id: number): Promise<void> {
  const db = await getDb()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)
  const item = await store.get(id)
  if (item) {
    item.status = 'syncing'
    await store.put(item)
  }
}

export async function getQueueLength(): Promise<number> {
  const db = await getDb()
  const tx = db.transaction(STORE_NAME, 'readonly')
  const store = tx.objectStore(STORE_NAME)
  return store.count()
}

export async function clearSynced(): Promise<void> {
  const db = await getDb()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)
  const index = store.index('status')
  const syncedItems = await index.getAllKeys('synced')
  for (const key of syncedItems) {
    await store.delete(key)
  }
}
