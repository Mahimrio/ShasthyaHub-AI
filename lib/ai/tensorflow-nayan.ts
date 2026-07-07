import * as tf from '@tensorflow/tfjs'

export type NayanModelStatus =
  | 'unloaded'
  | 'loading'
  | 'ready'
  | 'unsupported'
  | 'missing'

export interface OfflineNayanResult {
  severity: 'normal' | 'refer' | 'urgent'
  confidence: number
  mode: 'offline'
}

const MODEL_URL = '/models/nayan-ai/model.json'
const INPUT_SHAPE: [number, number, number, number] = [1, 224, 224, 3]

const SEVERITY_STRINGS: Record<
  OfflineNayanResult['severity'],
  { en: string; bn: string }
> = {
  normal: {
    en: 'Your eye appears healthy. No signs of diabetic retinopathy detected.',
    bn: 'আপনার চোখ সুস্থ দেখাচ্ছে। ডায়াবেটিক রেটিনোপ্যাথির কোনো লক্ষণ পাওয়া যায়নি।',
  },
  refer: {
    en: 'Mild abnormalities detected. Please consult an eye specialist for a comprehensive examination.',
    bn: 'কিছু অস্বাভাবিকতা সনাক্ত করা হয়েছে। সম্পূর্ণ পরীক্ষার জন্য একজন চক্ষু বিশেষজ্ঞের পরামর্শ নিন।',
  },
  urgent: {
    en: 'Signs of advanced eye disease detected. Seek immediate medical attention from an eye specialist.',
    bn: 'চোখের উন্নত রোগের লক্ষণ সনাক্ত করা হয়েছে। অবিলম্বে একজন চক্ষু বিশেষজ্ঞের পরামর্শ নিন।',
  },
}

let status: NayanModelStatus = 'unloaded'
let modelPromise: Promise<tf.LayersModel | null> | null = null
let model: tf.LayersModel | null = null

function devLog(...args: unknown[]) {
  console.log('[NayanTF]', ...args)
}

export function getModelStatus(): NayanModelStatus {
  return status
}

async function selectBackend(): Promise<void> {
  const backends = ['webgpu', 'webgl', 'wasm']
  for (const backend of backends) {
    try {
      await tf.setBackend(backend)
      devLog(`Backend selected: ${backend}`)
      return
    } catch {
      devLog(`Backend ${backend} not available, trying next...`)
    }
  }
  throw new Error('No suitable TensorFlow.js backend found')
}

async function loadModel(): Promise<tf.LayersModel | null> {
  console.log('[NayanTF] loadModel() called, status:', status)
  if (model) return model
  if (modelPromise) return modelPromise

  status = 'loading'
  modelPromise = (async () => {
    try {
      await selectBackend()
      await tf.ready()

      let loaded: tf.LayersModel | null = null
      try {
        loaded = await tf.loadLayersModel(MODEL_URL)
      } catch (loadErr) {
        const msg = loadErr instanceof Error ? loadErr.message : String(loadErr)
        // 404 from loadLayersModel means files don't exist on server
        if (msg.includes('404')) {
          status = 'missing'
          devLog(
            'Nayan AI offline model not found at public/models/nayan-ai/ — offline analysis will be unavailable until the model is added. See Phase 1a in the implementation plan.'
          )
        } else {
          status = 'unsupported'
          devLog('Model load failed:', msg)
        }
        modelPromise = null
        return null
      }
      model = loaded

      const warmInput = tf.zeros(INPUT_SHAPE)
      const warmResult = loaded.predict(warmInput) as tf.Tensor
      warmResult.dispose()
      warmInput.dispose()

      status = 'ready'
      devLog(`Model loaded. Input shape: ${INPUT_SHAPE}`)
      return loaded
    } catch (err) {
      status = 'unsupported'
      modelPromise = null
      devLog('Model load failed:', err)
      return null
    }
  })()

  return modelPromise
}

function imageToTensor(image: HTMLImageElement): tf.Tensor3D {
  const tensor = tf.browser.fromPixels(image)
  const resized = tf.image.resizeBilinear(tensor as tf.Tensor3D, [
    INPUT_SHAPE[1],
    INPUT_SHAPE[2],
  ])
  const scaled = resized.div(127.5) as tf.Tensor3D
  const normalized = scaled.sub(tf.scalar(1.0)) as tf.Tensor3D
  return normalized
}

export async function analyzeEyeImageOffline(
  imageElement: HTMLImageElement
): Promise<OfflineNayanResult> {
  const loadedModel = await loadModel()

  if (!loadedModel) {
    if (status === 'missing') {
      throw new Error(
        'Offline analysis is not set up on this device yet — connect to the internet for analysis.'
      )
    }
    throw new Error(
      'Offline AI is not supported on this device — please connect to the internet for analysis.'
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_batch, height, width, _channels] = loadedModel.inputs[0].shape ?? []
  devLog(
    `Model expected shape: [${loadedModel.inputs[0].shape}] | Input image: ${imageElement.width}x${imageElement.height}`
  )

  const inputTensor = imageToTensor(imageElement)
  const batched = inputTensor.expandDims(0) as tf.Tensor4D

  let logits: tf.Tensor
  try {
    logits = tf.tidy(() => {
      return loadedModel.predict(batched) as tf.Tensor
    })
  } finally {
    batched.dispose()
    inputTensor.dispose()
  }

  const probabilities = logits.dataSync()
  logits.dispose()

  const classIndex = probabilities.indexOf(Math.max(...probabilities))
  const confidence = Math.round(probabilities[classIndex] * 100)

  const severityMap: OfflineNayanResult['severity'][] = [
    'normal',
    'refer',
    'urgent',
  ]
  const severity = severityMap[classIndex] ?? 'refer'

  return { severity, confidence, mode: 'offline' }
}

export function getSeverityStrings(): typeof SEVERITY_STRINGS {
  return SEVERITY_STRINGS
}
