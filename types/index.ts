export type AnalysisStatus = 'pending' | 'processing' | 'complete' | 'failed'
export type Severity = 'Normal' | 'Low' | 'Medium' | 'High' | 'Critical'
export type RiskLevel = 'Green' | 'Yellow' | 'Red'
export type Language = 'en' | 'bn'
export type MappingConfidence = 'high' | 'medium' | 'low'

export interface Profile {
  id: string
  name: string | null
  email?: string | null
  username?: string | null
  phone: string | null
  district: string | null
  preferred_language: Language
  updated_at: string
}

export interface EyeAnalysis {
  id: string
  user_id: string
  status: AnalysisStatus
  diagnosis: string | null
  confidence_score: number | null
  severity: Severity | null
  recommendation_en: string | null
  recommendation_bn: string | null
  urgency_days: number | null
  specialist_needed: string | null
  gemini_raw_output: Record<string, unknown> | null
  groq_processed_output: Record<string, unknown> | null
  error_message: string | null
  created_at: string
}

export interface ExtractedMedication {
  written_text: string
  brand_name: string
  generic_name: string
  drug_class: string
  dosage: string
  frequency: string
  duration: string
  instructions: string
  mapping_confidence: MappingConfidence
}

export interface DrugInteraction {
  drugs_involved: [string, string]
  severity: 'Mild' | 'Moderate' | 'Severe' | 'Critical'
  /** Pharmacological basis of the interaction (from the Groq reasoning layer). */
  mechanism_en?: string
  risk_en: string
  risk_bn: string
  recommendation_en: string
  recommendation_bn: string
}

export interface ScheduleSlot {
  drug_en: string
  drug_bn: string
  dosage: string
  instructions_en: string
  instructions_bn: string
}

export interface MedicationSchedule {
  morning: ScheduleSlot[]
  afternoon: ScheduleSlot[]
  evening: ScheduleSlot[]
  night: ScheduleSlot[]
  duration_days: number
  special_instructions_en: string[]
  special_instructions_bn: string[]
  audio_script_bn: string
}

export interface PrescriptionAnalysis {
  id: string
  user_id: string
  status: AnalysisStatus
  extracted_drugs: ExtractedMedication[] | null
  interaction_warnings: DrugInteraction[] | null
  digital_schedule: MedicationSchedule | null
  has_dangerous_interactions: boolean
  image_hash: string | null
  error_message: string | null
  created_at: string
}

export interface EnrichedFoodItem {
  name_en: string
  name_bn: string
  estimated_grams: number
  calories: number
  confidence: number
  carbs_g: number
  protein_g: number
  fat_g: number
}

export interface ChronicDiseaseRisk {
  disease_en: string
  disease_bn: string
  status: 'Safe' | 'Caution' | 'Danger'
  reason_bn: string
}

export interface MealModification {
  suggestion_en: string
  suggestion_bn: string
  impact: 'positive' | 'caution' | 'High' | 'Medium' | 'Low'
  nutrient: string
  current_value: number
  suggested_value: number
  calories_saved?: number
}

export interface FoodAnalysis {
  id: string
  user_id: string
  status: AnalysisStatus
  identified_items: EnrichedFoodItem[] | null
  total_calories: number | null
  total_carbs_g: number | null
  total_protein_g: number | null
  total_fat_g: number | null
  glycemic_load: number | null
  risk_level: RiskLevel | null
  risk_summary_en: string | null
  risk_summary_bn: string | null
  chronic_disease_risks: ChronicDiseaseRisk[] | null
  meal_modifications: Record<string, unknown> | null
  error_message: string | null
  created_at: string
}

/**
 * UI-facing shape of a single GlycoVision analysis — the `data` payload
 * returned by POST /api/glycovision/analyze on success.
 */
export interface GlycoVisionResult {
  id: string
  identified_items: EnrichedFoodItem[]
  total_calories: number
  total_carbs_g: number
  total_protein_g: number
  total_fat_g: number
  glycemic_load: number
  risk_level: RiskLevel
  risk_summary_en: string
  risk_summary_bn: string
  chronic_disease_risks: ChronicDiseaseRisk[]
  meal_modifications: MealModification[]
}

export interface BdDrug {
  id: number
  brand_name: string
  generic_name: string
  manufacturer: string | null
  drug_class: string | null
  atc_code: string | null
  common_in_bd: boolean
}

export interface BdFoodItem {
  id: number
  name_en: string
  name_bn: string | null
  calories_per_100g: number
  carbs_per_100g: number | null
  protein_per_100g: number | null
  fat_per_100g: number | null
  glycemic_index: number | null
  category: string | null
}

export interface ApiSuccess<T> {
  success: true
  data: T
}

export interface ApiError {
  success: false
  error: string
  error_bn?: string
  code: string
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

export interface GeminiEyeOutput {
  detected_conditions: string[]
  pupillary_clarity: 'clear' | 'cloudy' | 'severely_cloudy'
  retinal_observations: string
  confidence: number
  image_quality: 'good' | 'poor' | 'unusable'
  raw_findings: string
}

export interface GroqEyeOutput {
  diagnosis: string
  severity: Severity
  recommendation_en: string
  recommendation_bn: string
  urgency_days: number
  next_steps: string[]
  specialist_needed: string
  disease_description_en: string
  disease_description_bn: string
  disease_stage: string
}

// --- ScriptGuard (prescription) AI output types ---

/**
 * A single medication as read off the prescription by Gemini OCR — before any
 * brand→generic mapping has been applied. Contains only what is literally
 * written on the paper.
 */
export interface GeminiMedication {
  written_text: string
  dosage: string
  frequency: string
  duration: string
  instructions: string
}

/** Parsed JSON returned by Gemini from the prescription OCR prompt. */
export interface GeminiPrescriptionOutput {
  raw_text: string
  medications: GeminiMedication[]
  prescriber_qualification: string | null
  prescription_date: string | null
  ocr_confidence: number
}

/** Parsed JSON returned by Groq from the drug-interaction reasoning prompt. */
export interface GroqPrescriptionInteractionOutput {
  has_dangerous_interactions: boolean
  interactions: DrugInteraction[]
}

/**
 * Full result of the prescription analysis pipeline — the shape returned by
 * `analyzePrescription()` and (as the `data` payload) by POST
 * /api/scriptguard/analyze on success.
 */
export interface PrescriptionAnalysisResult {
  extracted_drugs: ExtractedMedication[]
  interaction_warnings: DrugInteraction[]
  has_dangerous_interactions: boolean
  gemini_raw: GeminiPrescriptionOutput
}

/**
 * UI-facing shape of a ScriptGuard analysis — the `data` payload returned
 * by POST /api/scriptguard/analyze on success. Flattened schedule fields
 * (not the full MedicationSchedule) so the UI can read them directly.
 */
export interface ScriptGuardResult {
  id: string
  extracted_drugs: ExtractedMedication[]
  interaction_warnings: DrugInteraction[]
  has_dangerous_interactions: boolean
  gemini_raw: GeminiPrescriptionOutput
  schedule: Pick<MedicationSchedule, 'morning' | 'afternoon' | 'evening' | 'night'>
  duration_days: number
  special_instructions_en: string[]
  special_instructions_bn: string[]
  audio_script_bn: string
}

/**
 * UI-facing shape of a single Nayan AI analysis — the `data` payload returned
 * by POST /api/nayan/analyze on success. Kept distinct from the persisted
 * EyeAnalysis DB row (which also carries raw JSONB + timestamps).
 */
export interface NayanResult {
  id: string
  diagnosis: string
  severity: Severity
  recommendation_en: string
  recommendation_bn: string
  urgency_days: number
  next_steps: string[]
  specialist_needed: string
  disease_description_en?: string
  disease_description_bn?: string
  disease_stage?: string
  /** Confidence as an integer percentage 0–100. */
  confidence_score: number
  /** Whether this result came from online API or offline TF.js model. */
  analysis_mode?: 'online' | 'offline'
}

/** Lightweight projection used by the history list. */
export interface NayanResultLight {
  id: string
  diagnosis: string | null
  severity: Severity | null
  created_at: string
  confidence_score: number | null
}

// --- Lokhon (Symptom Screener) types ---

export type RiskBand = 'Low' | 'Moderate' | 'High' | 'Urgent'

export interface LokhonQuestion {
  id: string
  disease_slug: string
  text_en: string
  text_bn: string
  weight: number
  is_red_flag: boolean
  order_index: number
}

export interface LokhonDisease {
  slug: string
  name_en: string
  name_bn: string
  description_en: string | null
  description_bn: string | null
  icon: string | null
  estimated_time_en: string | null
  estimated_time_bn: string | null
  question_count: number | null
}

export interface LokhonAnswer {
  questionId: string
  value: number
}

export interface LokhonAdvice {
  advice_en: string
  advice_bn: string
  doctor_type_en: string
  doctor_type_bn: string
  urgency: string
}

export interface LokhonResult {
  id: string
  riskPercentage: number
  riskBand: RiskBand
  isRedFlag: boolean
  advice: LokhonAdvice
  disclaimer: string
  diseaseSlug: string
  diseaseNameEn: string
  diseaseNameBn: string
  topSymptoms: { text_en: string; text_bn: string; value: number }[]
  requiresImmediateSupport?: boolean
  crisisResources?: { helpline: string; messageEn: string; messageBn: string }
  created_at?: string
}

export interface LokhonAnalysisRow {
  id: string
  user_id: string
  disease_slug: string
  answers: Record<string, number>
  risk_percentage: number | null
  risk_band: string | null
  is_red_flag: boolean | null
  advice: LokhonAdvice | null
  created_at: string
}

export const BANGLADESH_DISTRICTS = [
  'Bagerhat', 'Bandarban', 'Barguna', 'Barishal', 'Bhola', 'Bogra', 'Brahmanbaria',
  'Chandpur', 'Chapainawabganj', 'Chattogram', 'Chuadanga', 'Cox\'s Bazar',
  'Cumilla', 'Dhaka', 'Dinajpur', 'Faridpur', 'Feni', 'Gaibandha', 'Gazipur',
  'Gopalganj', 'Habiganj', 'Jamalpur', 'Jashore', 'Jhalokati', 'Jhenaidah',
  'Joypurhat', 'Khagrachhari', 'Khulna', 'Kishoreganj', 'Kurigram', 'Kushtia',
  'Lakshmipur', 'Lalmonirhat', 'Madaripur', 'Magura', 'Manikganj', 'Meherpur',
  'Moulvibazar', 'Munshiganj', 'Mymensingh', 'Naogaon', 'Narail', 'Narayanganj',
  'Narsingdi', 'Natore', 'Netrokona', 'Nilphamari', 'Noakhali', 'Pabna',
  'Panchagarh', 'Patuakhali', 'Pirojpur', 'Rajbari', 'Rajshahi', 'Rangamati',
  'Rangpur', 'Satkhira', 'Shariatpur', 'Sherpur', 'Sirajganj', 'Sunamganj',
  'Sylhet', 'Tangail', 'Thakurgaon',
] as const

// --- Family System (Poribar / পরিবার) types ---

export type RelationType =
  | 'Father'
  | 'Mother'
  | 'Son'
  | 'Daughter'
  | 'Husband'
  | 'Wife'
  | 'Brother'
  | 'Sister'
  | 'Grandfather'
  | 'Grandmother'
  | 'Grandson'
  | 'Granddaughter'
  | 'Uncle'
  | 'Aunt'
  | 'Cousin'
  | 'Guardian'
  | 'Caregiver'
  | 'Other'
  | (string & {})

export type FamilyConnectionStatus = 'pending' | 'accepted' | 'rejected'

export interface FamilyConnection {
  id: string
  requester_id: string
  target_id: string
  relation_type: RelationType
  reverse_relation_type: RelationType
  status: FamilyConnectionStatus
  created_at: string
  accepted_at: string | null
  // Associated profile of the other member
  other_user: {
    id: string
    name: string | null
    email?: string | null
    username: string | null
    district: string | null
  }
  is_requester: boolean
}

export interface FamilyMemberHealthSummary {
  userId: string
  name: string
  email?: string | null
  username: string | null
  relation: RelationType
  relationBn: string
  district: string | null
  isCurrentUser: boolean
  totalPrescriptions: number
  totalEyeAnalyses: number
  totalFoodAnalyses: number
  hasUrgentCondition: boolean
  lastActive: string | null
  activeMedications: {
    name: string
    dosage: string
    frequency: string
    scheduleSlot?: 'morning' | 'afternoon' | 'evening' | 'night'
  }[]
  latestHealthStatus?: {
    eyeSeverity?: Severity | null
    dietRisk?: RiskLevel | null
    hasDangerousInteraction?: boolean
  }
}

export interface FamilyTreeNode {
  id: string
  userId: string
  name: string
  email?: string | null
  username: string | null
  relation: RelationType
  relationBn: string
  generation: number // -2 (grandparents), -1 (parents/uncles), 0 (self/spouse/siblings), 1 (children), 2 (grandchildren)
  isCurrentUser: boolean
  healthSummary?: FamilyMemberHealthSummary
  children?: FamilyTreeNode[]
}

export interface UserSearchResult {
  id: string
  name: string | null
  email?: string | null
  username: string | null
  district: string | null
  connectionStatus?: FamilyConnectionStatus | 'none'
  existingConnectionId?: string
}

// ============================================================
// Medication Reminders & Adherence Tracking Types
// ============================================================

export type MealTimingType = 'before_meal' | 'after_meal' | 'with_meal' | 'empty_stomach' | 'anytime'
export type SlotType = 'morning' | 'afternoon' | 'evening' | 'night' | 'custom'
export type DoseStatus = 'pending' | 'taken' | 'snoozed' | 'missed' | 'skipped'
export type PillShapeType =
  | 'round_tablet'
  | 'capsule'
  | 'caplet_oval'
  | 'syrup_liquid'
  | 'drops'
  | 'inhaler'
  | 'injection_pen'

export interface MedicationScheduleItem {
  id: string
  user_id: string
  prescription_id?: string | null
  drug_name_en: string
  drug_name_bn: string
  generic_name?: string
  dosage: string
  meal_timing: MealTimingType
  scheduled_time: string // e.g. "08:00" (24hr format HH:mm)
  slot_type: SlotType
  frequency_code?: string // e.g. "1+0+1", "TDS", "Every 8 hrs"
  interval_hours?: number | null // e.g. 8 for 8-hour intervals
  instructions_en?: string
  instructions_bn?: string
  indication_en?: string // e.g. "Acidity & Reflux", "Fever & Pain"
  indication_bn?: string
  pill_shape?: PillShapeType
  pill_color?: string // Hex code or tailwind color
  pill_color_secondary?: string // for 2-tone capsules
  total_prescribed_quantity?: number // e.g. 30
  remaining_quantity?: number // e.g. 14
  refill_threshold?: number // e.g. 4
  start_date: string // YYYY-MM-DD
  end_date?: string | null
  duration_days?: number
  is_active: boolean
  is_archived?: boolean
  created_at: string
}

export interface CabinetMedicineSummary {
  schedule: MedicationScheduleItem
  times: string[] // all daily times for this drug e.g. ["08:00", "20:00"]
  frequency: string // e.g. "1+0+1 (Twice Daily)"
  pillShape: PillShapeType
  pillColor: string
  pillColorSecondary?: string
  pillDescriptorBn: string
  pillDescriptorEn: string
  remainingPills: number
  totalPills: number
  daysRemaining: number
  isLowStock: boolean
  courseProgressPercent: number
  takenCount: number
  missedCount: number
  adherenceRate: number
  todayStatus: DoseStatus
}

export interface FamilyMemberMedicationStatus {
  memberId: string
  totalMeds: number
  totalDosesToday: number
  takenDosesToday: number
  missedDosesToday: number
  complianceRate: number
  status: 'all_taken' | 'upcoming' | 'missed' | 'none'
  nextDoseTime?: string
  activePills: Array<{
    drugNameEn: string
    drugNameBn: string
    dosage: string
    shape: PillShapeType
    color: string
    colorSecondary?: string
    descriptorBn: string
    isDueNow?: boolean
  }>
}

export interface DoseLog {
  id: string
  schedule_id: string
  user_id: string
  scheduled_for: string // ISO timestamp of target dose time
  scheduled_time: string // HH:mm
  status: DoseStatus
  logged_at?: string | null // ISO timestamp when user marked action
  snoozed_until?: string | null // ISO timestamp if snoozed
  notes?: string | null
  created_at: string
}

export interface UserReminderSettings {
  id?: string
  user_id: string
  breakfast_time: string // "08:00"
  lunch_time: string // "13:30"
  dinner_time: string // "21:30"
  bedtime: string // "22:30"
  notifications_enabled: boolean
  sound_enabled: boolean
  notify_caregivers_on_missed: boolean
  grace_period_minutes: number // default 45 minutes
  created_at?: string
  updated_at?: string
}

export interface ActiveDoseWithStatus {
  schedule: MedicationScheduleItem
  todayLog: DoseLog | null
  status: DoseStatus
  dueTime: string // "08:00 AM"
  isDueNow: boolean
  isMissed: boolean
  timeDiffMinutes: number // positive = in future, negative = in past
  clinicalMissedAdvice?: {
    action: 'take_now' | 'skip' | 'consult'
    advice_en: string
    advice_bn: string
    reason_en: string
    reason_bn: string
  }
}

export interface MedicationAdherenceSummary {
  totalDosesToday: number
  takenToday: number
  missedToday: number
  pendingToday: number
  adherencePercentage: number
  weeklyStreakDays: number
  nextDose?: ActiveDoseWithStatus | null
}



