import Fuse, { type IFuseOptions } from 'fuse.js'
import { drugMapping } from './drug-mapping'
import type { ExtractedMedication } from '@/types'

const MAX_DRUG_WORDS = 5

const COMMON_NON_DRUGS = new Set([
  'rx', 'rp', 'tab', 'cap', 'syp', 'susp', 'inj', 'cream',
  'ointment', 'drops', 'spray', 'inh', 'iv', 'im', 'sc',
  'bd', 'tid', 'qid', 'hs', 'ac', 'pc', 'stat', 'prn',
  'mg', 'ml', 'gm', 'mcg', 'iu', 'unit', 'mmole', 'mmol',
  'once', 'daily', 'twice', 'thrice', 'four', 'times', 'day',
  'before', 'after', 'meal', 'empty', 'stomach', 'at', 'bedtime',
  'morning', 'afternoon', 'evening', 'night', 'with', 'water',
  'food', 'oral', 'topical', 'sublingual', 'rectal', 'vaginal',
  'doctor', 'patient', 'name', 'age', 'weight', 'address', 'date',
  'signature', 'registration', 'bmdc', 'phone', 'mobile',
])

const STATIC_CLASS: Record<string, string> = {
  paracetamol: 'Analgesic/Antipyretic',
  omeprazole: 'Proton Pump Inhibitor',
  lansoprazole: 'Proton Pump Inhibitor',
  pantoprazole: 'Proton Pump Inhibitor',
  esomeprazole: 'Proton Pump Inhibitor',
  azithromycin: 'Macrolide Antibiotic',
  ciprofloxacin: 'Fluoroquinolone Antibiotic',
  metronidazole: 'Nitroimidazole Antibiotic',
  metformin: 'Biguanide Antidiabetic',
  losartan: 'ARB Antihypertensive',
  diclofenac: 'NSAID',
  naproxen: 'NSAID',
  ibuprofen: 'NSAID',
  atorvastatin: 'Statin',
  simvastatin: 'Statin',
  rosuvastatin: 'Statin',
  amlodipine: 'Calcium Channel Blocker',
  atenolol: 'Beta-blocker',
  bisoprolol: 'Beta-blocker',
  furosemide: 'Loop Diuretic',
  gliclazide: 'Sulfonylurea',
  glimepiride: 'Sulfonylurea',
  salbutamol: 'Bronchodilator',
  montelukast: 'Leukotriene Receptor Antagonist',
  fexofenadine: 'Antihistamine',
  amoxicillin: 'Penicillin Antibiotic',
  cefalexin: 'Cephalosporin Antibiotic',
  domperidone: 'Antiemetic/Prokinetic',
  ranitidine: 'H2 Blocker',
  dexamethasone: 'Corticosteroid',
  clonazepam: 'Benzodiazepine',
  escitalopram: 'SSRI',
  sertraline: 'SSRI',
  triazolam: 'Benzodiazepine',
}

const fuseOptions: IFuseOptions<{ brand: string; generic: string }> = {
  keys: [
    { name: 'brand', weight: 0.7 },
    { name: 'generic', weight: 0.3 },
  ],
  threshold: 0.4,
  distance: 100,
  minMatchCharLength: 3,
}

let fuse: Fuse<{ brand: string; generic: string }> | null = null
const fuseDocs = Object.entries(drugMapping).map(([brand, generic]) => ({ brand, generic }))

function getFuse() {
  if (!fuse) {
    fuse = new Fuse(fuseDocs, fuseOptions)
  }
  return fuse
}

function isLikelyDrugWord(word: string): boolean {
  if (word.length < 2 || word.length > 20) return false
  if (COMMON_NON_DRUGS.has(word)) return false
  if (/^[\d.,%]+$/.test(word)) return false
  return true
}

function extractMedications(ocrLines: string[]): Array<{
  text: string
  dosage: string
  frequency: string
  duration: string
  instructions: string
}> {
  const results: Array<{
    text: string
    dosage: string
    frequency: string
    duration: string
    instructions: string
  }> = []

  for (const line of ocrLines) {
    const cleaned = line.trim().toLowerCase()
    if (!cleaned) continue

    const words = cleaned.split(/\s+/).filter(isLikelyDrugWord)
    if (words.length === 0) continue
    const drugName = words.slice(0, MAX_DRUG_WORDS).join(' ')

    const freqMatch = cleaned.match(/(\d+)\s*(?:times?|বার)\s*(?:daily|a\s*day|দিনে|প্রতিদিন|per\s*day)/i)
    const dosMatch = cleaned.match(/(\d+)\s*(mg|ml|gm|mcg|iu)/i)
    const durMatch = cleaned.match(/(?:for|জন্য|দিন)\s*(\d+)\s*(?:days|দিন|weeks|সপ্তাহ)/i)

    results.push({
      text: drugName,
      dosage: dosMatch ? `${dosMatch[1]} ${dosMatch[2]}` : '',
      frequency: freqMatch ? `${freqMatch[1]}x/day` : '',
      duration: durMatch ? `${durMatch[1]} days` : '',
      instructions: cleaned
        .replace(words.slice(0, MAX_DRUG_WORDS).join(' '), '')
        .trim()
        .substring(0, 100),
    })
  }

  return results
}

export function parseOcrToMeds(
  rawText: string,
  _ocrConfidence: number
): ExtractedMedication[] {
  if (!rawText) return []

  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  const extracted = extractMedications(lines)
  const fuseInstance = getFuse()

  return extracted.map((med) => {
    const fuseResult = fuseInstance.search(med.text)
    let brandName = med.text
    let genericName = med.text
    let drugClass = 'Unknown'
    let mappingConfidence: 'high' | 'medium' | 'low' = 'low'

    if (fuseResult.length > 0 && fuseResult[0].score !== undefined && fuseResult[0].score! < 0.4) {
      const best = fuseResult[0].item
      brandName = best.brand
      genericName = best.generic
      drugClass = STATIC_CLASS[best.generic] ?? 'Unknown'
      mappingConfidence = 'medium'
    }

    return {
      written_text: med.text,
      brand_name: brandName,
      generic_name: genericName,
      drug_class: drugClass,
      dosage: med.dosage,
      frequency: med.frequency,
      duration: med.duration,
      instructions: med.instructions,
      mapping_confidence: mappingConfidence,
    }
  })
}
