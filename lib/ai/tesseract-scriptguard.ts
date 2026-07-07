import { createWorker, PSM } from 'tesseract.js'

export type OcrStatus =
  | 'unloaded'
  | 'loading'
  | 'ready'
  | 'unsupported'
  | 'missing'

export interface OfflineOcrResult {
  rawText: string
  confidence: number
  mode: 'offline'
}

const LANG_PATH = '/tesseract-lang'

let status: OcrStatus = 'unloaded'
let workerPromise: Promise<Awaited<ReturnType<typeof createWorker>> | null> | null = null
let worker: Awaited<ReturnType<typeof createWorker>> | null = null

export function getOcrStatus(): OcrStatus {
  return status
}

async function initWorker() {
  if (worker) return worker
  if (workerPromise) return workerPromise

  status = 'loading'
  workerPromise = (async () => {
    try {
      const w = await createWorker(
        ['eng', 'ben'],
        1,
        {
          langPath: LANG_PATH,
          cachePath: LANG_PATH,
          corePath: LANG_PATH,
          workerPath: `${LANG_PATH}/tesseract-worker.min.js`,
          workerBlobURL: false,
          gzip: false,
        }
      )
      // PSM 4 = Assume a single column of text (prescription layout)
      await w.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_COLUMN })
      worker = w
      status = 'ready'
      return w
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      // 404 from loading language files = files not yet set up
      if (msg.includes('404') || msg.includes('traineddata') || msg.includes('Failed to fetch') || msg.includes('Network error')) {
        status = 'missing'
      } else {
        status = 'unsupported'
      }
      workerPromise = null
      return null
    }
  })()

  return workerPromise
}

export async function checkOcrAvailability(): Promise<OcrStatus> {
  const w = await initWorker()
  if (!w) return status
  return status
}

export async function extractPrescriptionTextOffline(
  imageBlob: Blob
): Promise<OfflineOcrResult> {
  const w = await initWorker()

  if (!w) {
    if (status === 'missing') {
      throw new Error('missing')
    }
    throw new Error('unsupported')
  }

  const { data } = await w.recognize(imageBlob)
  return {
    rawText: data.text,
    confidence: data.confidence ?? 0,
    mode: 'offline',
  }
}
