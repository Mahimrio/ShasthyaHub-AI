'use client'

import { useState, useEffect, useCallback } from 'react'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { initQueue, enqueueAnalysis, getPendingAnalyses, getUnsyncedAnalyses, clearSynced, getQueueLength } from '@/lib/offline-queue'

function drawDummyCanvasBlob(): Promise<Blob> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    canvas.width = 200
    canvas.height = 200
    const ctx = canvas.getContext('2d')!
    const gradient = ctx.createLinearGradient(0, 0, 200, 200)
    gradient.addColorStop(0, '#0ea5e9')
    gradient.addColorStop(1, '#10b981')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 200, 200)
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 24px sans-serif'
    ctx.fillText('DEBUG', 40, 110)
    canvas.toBlob((blob) => resolve(blob!), 'image/webp', 0.85)
  })
}

export default function DebugOfflinePage() {
  const { isOnline } = useNetworkStatus()
  const [persisted, setPersisted] = useState<boolean | null>(null)
  const [queueItems, setQueueItems] = useState<Awaited<ReturnType<typeof getPendingAnalyses>>>([])
  const [unsyncedCount, setUnsyncedCount] = useState(0)
  const [queueTotal, setQueueTotal] = useState(0)
  const [swRegistered, setSwRegistered] = useState(false)
  const [swActive, setSwActive] = useState(false)
  const [log, setLog] = useState<string[]>([])

  const addLog = useCallback((msg: string) => {
    setLog((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50))
  }, [])

  useEffect(() => {
    initQueue()
      .then(() => addLog('Queue initialised'))
      .catch((err) => addLog(`Queue init error: ${err}`))

    if ('storage' in navigator && 'persisted' in navigator.storage) {
      navigator.storage.persisted().then(setPersisted)
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        setSwRegistered(true)
        setSwActive(!!reg.active)
        addLog(`SW registered: ${reg.scope}`)
      }).catch(() => {
        setSwRegistered(false)
        addLog('SW not available')
      })
    }
  }, [addLog])

  const refreshQueue = useCallback(async () => {
    const pending = await getPendingAnalyses()
    const unsynced = await getUnsyncedAnalyses()
    const total = await getQueueLength()
    setQueueItems(pending)
    setUnsyncedCount(unsynced.length)
    setQueueTotal(total)
    addLog(`Queue refreshed: ${pending.length} pending, ${unsynced.length} unsynced, ${total} total`)
  }, [addLog])

  const handleInjectDummy = useCallback(async () => {
    try {
      const canvasBlob = await drawDummyCanvasBlob()
      const agents: ('nayan' | 'scriptguard' | 'glycovision')[] = ['nayan', 'scriptguard', 'glycovision']
      const agent = agents[Math.floor(Math.random() * agents.length)]
      const id = await enqueueAnalysis(agent, canvasBlob, {
        debug: true,
        injectedAt: Date.now(),
        agent,
      })
      addLog(`Injected dummy ${agent} analysis → ID: ${id}, compressed size: ${Math.round(canvasBlob.size / 1024)}KB`)
      await refreshQueue()
    } catch (err) {
      addLog(`Inject error: ${err}`)
    }
  }, [addLog, refreshQueue])

  const handleClientSync = useCallback(async () => {
    addLog('Triggering client sync...')
    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready
        if ('sync' in reg) {
          const syncReg = reg as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }
          await syncReg.sync.register('sync-analyses')
          addLog('Background Sync "sync-analyses" registered')
          return
        }
      }
      addLog('Background Sync not available — would use online fallback (Phase 1)')
    } catch (err) {
      addLog(`Sync error: ${err}`)
    }
  }, [addLog])

  const handleClearSynced = useCallback(async () => {
    await clearSynced()
    addLog('Cleared synced items')
    await refreshQueue()
  }, [addLog, refreshQueue])

  const handlePersistRequest = useCallback(async () => {
    if ('storage' in navigator && 'persist' in navigator.storage) {
      const granted = await navigator.storage.persist()
      setPersisted(granted)
      addLog(`Persistent storage ${granted ? 'GRANTED' : 'DENIED'}`)
    }
  }, [addLog])

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full bg-amber-500" />
        <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100 tracking-tight">Debug — Offline Infrastructure</h1>
      </div>
      <p className="text-xs text-gray-400 -mt-4">Phase 0 testing panel. Remove before production.</p>

      {/* 1. Network & Storage Status */}
      <Section title="1. Network &amp; Storage Status">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <StatusBadge label="Online" value={isOnline} />
          <StatusBadge label="Persistent Storage" value={persisted} />
        </div>
        {persisted === false && (
          <button onClick={handlePersistRequest} className="mt-2 text-xs text-sky-600 underline">
            Request persistent storage
          </button>
        )}
      </Section>

      {/* 2. IndexedDB Queue Viewer */}
      <Section title="2. IndexedDB Queue Viewer">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs text-gray-500">
            Pending: <strong>{queueItems.length}</strong> &middot; Unsynced: <strong>{unsyncedCount}</strong> &middot; Total: <strong>{queueTotal}</strong>
          </span>
          <button onClick={refreshQueue} className="text-xs px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            Refresh
          </button>
        </div>
        {queueItems.length === 0 ? (
          <p className="text-xs text-gray-400 italic">No pending items in queue.</p>
        ) : (
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {queueItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 rounded-lg px-3 py-2 text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-gray-400">#{item.id}</span>
                  <span className="font-medium">{item.agentType}</span>
                  <span className="text-gray-400">{Math.round((item.compressedSizeBytes ?? item.imageBlob.size) / 1024)}KB</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                  item.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                  item.status === 'syncing' ? 'bg-blue-100 text-blue-700' :
                  item.status === 'failed' ? 'bg-red-100 text-red-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* 3. Queue Test Controls */}
      <Section title="3. Queue Test Controls">
        <div className="flex flex-wrap gap-2">
          <button onClick={handleInjectDummy} className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-xs font-medium rounded-lg transition-colors">
            Inject Dummy Analysis
          </button>
          <button onClick={handleClientSync} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium rounded-lg transition-colors">
            Trigger Sync
          </button>
          <button onClick={handleClearSynced} className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white text-xs font-medium rounded-lg transition-colors">
            Clear Synced
          </button>
        </div>
        <p className="text-[10px] text-gray-400 mt-2">
          Inject creates a 200x200 gradient canvas, compresses via browser-image-compression, and enqueues.
          Trigger Sync registers a Background Sync event (Chromium) or falls back to online listener.
        </p>
      </Section>

      {/* 4. Service Worker Status */}
      <Section title="4. Service Worker Status">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <StatusBadge label="Registered" value={swRegistered} />
          <StatusBadge label="Active" value={swActive} />
        </div>
      </Section>

      {/* Log */}
      <Section title="Log">
        <div className="bg-gray-900 dark:bg-black rounded-xl p-3 max-h-48 overflow-y-auto font-mono text-[11px] leading-relaxed">
          {log.length === 0 ? (
            <span className="text-gray-500 italic">No events yet.</span>
          ) : (
            log.map((entry, i) => (
              <div key={i} className="text-gray-300">
                {entry}
              </div>
            ))
          )}
        </div>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{title}</h2>
      {children}
    </div>
  )
}

function StatusBadge({ label, value }: { label: string; value: boolean | null }) {
  return (
    <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 rounded-lg px-3 py-2">
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`text-xs font-mono font-bold ${
        value === true ? 'text-green-600' :
        value === false ? 'text-red-500' :
        'text-gray-400'
      }`}>
        {value === null ? '—' : String(value)}
      </span>
    </div>
  )
}
