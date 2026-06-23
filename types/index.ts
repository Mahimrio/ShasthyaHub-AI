export type AnalysisStatus = 'pending' | 'processing' | 'complete' | 'failed'
export type Severity = 'Normal' | 'Low' | 'Medium' | 'High' | 'Critical'
export type RiskLevel = 'Green' | 'Yellow' | 'Red'
export type Language = 'en' | 'bn'
export type MappingConfidence = 'high' | 'medium' | 'low'

export interface Profile {
  id: string
  name: string | null
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
  meal_modifications: Record<string, unknown> | null
  error_message: string | null
  created_at: string
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
  /** Confidence as an integer percentage 0–100. */
  confidence_score: number
}

/** Lightweight projection used by the history list. */
export interface NayanResultLight {
  id: string
  diagnosis: string | null
  severity: Severity | null
  created_at: string
  confidence_score: number | null
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
