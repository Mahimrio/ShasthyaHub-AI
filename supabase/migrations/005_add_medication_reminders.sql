-- ============================================================
-- Migration 005: Medication Reminders & Missed Dose Alert System
-- ShasthyaHub-AI — AUST CSE Carnival 8.0
-- ============================================================

-- 1. USER REMINDER SETTINGS TABLE
CREATE TABLE IF NOT EXISTS user_reminder_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  breakfast_time TEXT DEFAULT '08:00',
  lunch_time TEXT DEFAULT '13:30',
  dinner_time TEXT DEFAULT '21:30',
  bedtime TEXT DEFAULT '22:30',
  notifications_enabled BOOLEAN DEFAULT TRUE,
  sound_enabled BOOLEAN DEFAULT TRUE,
  notify_caregivers_on_missed BOOLEAN DEFAULT TRUE,
  grace_period_minutes INT DEFAULT 45,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_reminder_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reminder settings"
  ON user_reminder_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reminder settings"
  ON user_reminder_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reminder settings"
  ON user_reminder_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- 2. MEDICATION SCHEDULES TABLE
CREATE TABLE IF NOT EXISTS medication_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prescription_id UUID REFERENCES prescription_analyses(id) ON DELETE SET NULL,
  drug_name_en TEXT NOT NULL,
  drug_name_bn TEXT NOT NULL,
  dosage TEXT NOT NULL,
  meal_timing TEXT DEFAULT 'after_meal' CHECK (meal_timing IN ('before_meal', 'after_meal', 'with_meal', 'empty_stomach', 'anytime')),
  scheduled_time TEXT NOT NULL, -- e.g. "08:00"
  slot_type TEXT DEFAULT 'morning' CHECK (slot_type IN ('morning', 'afternoon', 'evening', 'night', 'custom')),
  frequency_code TEXT,
  interval_hours INT,
  instructions_en TEXT,
  instructions_bn TEXT,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  duration_days INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE medication_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own medication schedules"
  ON medication_schedules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own medication schedules"
  ON medication_schedules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own medication schedules"
  ON medication_schedules FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own medication schedules"
  ON medication_schedules FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_med_schedules_user_active ON medication_schedules(user_id, is_active);

-- 3. DOSE LOGS TABLE (Daily tracking)
CREATE TABLE IF NOT EXISTS dose_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_id UUID NOT NULL REFERENCES medication_schedules(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scheduled_for TIMESTAMPTZ NOT NULL,
  scheduled_time TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'taken', 'snoozed', 'missed', 'skipped')),
  logged_at TIMESTAMPTZ,
  snoozed_until TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE dose_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own dose logs"
  ON dose_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own dose logs"
  ON dose_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own dose logs"
  ON dose_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own dose logs"
  ON dose_logs FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_dose_logs_user_date ON dose_logs(user_id, scheduled_for);
