# TypeScript Strict Patterns

## Core Interface Definitions (types/index.ts)

```typescript
// --- Supabase DB Types ---
export type AnalysisStatus = 'pending' | 'processing' | 'complete' | 'failed'
export type Severity = 'Normal' | 'Low' | 'Medium' | 'High' | 'Critical'
export type RiskLevel = 'Green' | 'Yellow' | 'Red'
export type Language = 'en' | 'bn'

export interface Profile {
  id: string; name: string | null; phone: string | null;
  district: string | null; preferred_language: Language; updated_at: string
}

export interface EyeAnalysis {
  id: string; user_id: string; status: AnalysisStatus;
  diagnosis: string | null; confidence_score: number | null;
  severity: Severity | null; recommendation_en: string | null;
  recommendation_bn: string | null; urgency_days: number | null;
  specialist_needed: string | null; created_at: string
}

export interface ExtractedMedication {
  written_text: string; brand_name: string; generic_name: string;
  drug_class: string; dosage: string; frequency: string;
  duration: string; instructions: string;
  mapping_confidence: 'high' | 'medium' | 'low'
}

export interface DrugInteraction {
  drugs_involved: [string, string]; severity: 'Mild' | 'Moderate' | 'Severe' | 'Critical';
  risk_en: string; risk_bn: string; recommendation_en: string; recommendation_bn: string
}

export interface ScheduleSlot {
  drug_en: string; drug_bn: string; dosage: string;
  instructions_en: string; instructions_bn: string
}
export interface MedicationSchedule {
  morning: ScheduleSlot[]; afternoon: ScheduleSlot[];
  evening: ScheduleSlot[]; night: ScheduleSlot[];
  duration_days: number; special_instructions_en: string[];
  special_instructions_bn: string[]; audio_script_bn: string
}

export interface EnrichedFoodItem {
  name_en: string; name_bn: string; estimated_grams: number;
  calories: number; confidence: number; carbs_g: number;
  protein_g: number; fat_g: number
}

// --- API Response Types ---
export interface ApiSuccess<T> { success: true; data: T }
export interface ApiError { success: false; error: string; error_bn?: string; code: string }
export type ApiResponse<T> = ApiSuccess<T> | ApiError

// --- AI Output Types (from LLM responses) ---
export interface GeminiEyeOutput {
  detected_conditions: string[]; pupillary_clarity: 'clear' | 'cloudy' | 'severely_cloudy';
  retinal_observations: string; confidence: number; image_quality: 'good' | 'poor' | 'unusable';
  raw_findings: string
}
export interface GroqEyeOutput {
  diagnosis: string; severity: Severity; recommendation_en: string;
  recommendation_bn: string; urgency_days: number;
  next_steps: string[]; specialist_needed: string
}
```

## No-Any Policy

NEVER use `any` type. Replace with:
- `unknown` — when you don't know the type (then narrow with type guards)
- `Record<string, unknown>` — for arbitrary JSON objects
- Specific interfaces — for known shapes

```typescript
// BAD
function processAI(output: any) { return output.diagnosis }

// GOOD
function processAI(output: unknown): string {
  if (!isGroqEyeOutput(output)) throw new Error('Invalid AI output shape')
  return output.diagnosis
}
```

## Type Guards for LLM Outputs

```typescript
// lib/type-guards.ts
export function isGroqEyeOutput(val: unknown): val is GroqEyeOutput {
  return (
    typeof val === 'object' && val !== null &&
    'diagnosis' in val && typeof (val as any).diagnosis === 'string' &&
    'severity' in val && ['Normal','Low','Medium','High','Critical'].includes((val as any).severity) &&
    'urgency_days' in val && typeof (val as any).urgency_days === 'number'
  )
}
```

## Zod Validation for API Inputs

```typescript
import { z } from 'zod'

// Validated request schemas
export const AnalyzeImageSchema = z.object({
  // For FormData — validate file in route handler separately
})

export const RegisterSchema = z.object({
  name:     z.string().min(2).max(100),
  email:    z.string().email(),
  phone:    z.string().regex(/^01[3-9]\d{8}$/, 'Invalid Bangladeshi phone number'),
  district: z.enum([/* all 64 Bangladesh districts */] as const),
  password: z.string().min(8).max(100),
})
```

## Hook Return Types (always explicit)

```typescript
interface UseNayanAnalysisReturn {
  analyze: (file: File) => Promise<void>
  result: EyeAnalysis | null
  isLoading: boolean
  isError: boolean
  error: { code: string; message: string } | null
  reset: () => void
}

export function useNayanAnalysis(): UseNayanAnalysisReturn { ... }
```