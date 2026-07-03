-- ============================================================
-- 7. DOCTORS DIRECTORY TABLE (for Nayan AI referrals)
-- ============================================================
CREATE TABLE doctors (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name          TEXT NOT NULL,
  name_bn       TEXT,
  qualification TEXT NOT NULL,
  specialty     TEXT NOT NULL,
  hospital_name TEXT NOT NULL,
  hospital_bn   TEXT,
  area          TEXT NOT NULL,
  district      TEXT NOT NULL,
  phone         TEXT,
  visiting_hours TEXT,
  rating        DECIMAL(2,1),
  experience_years INT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view doctors"
  ON doctors FOR SELECT
  USING (true);

-- ============================================================
-- SEED DATA — 12 doctors (8 Ophthalmologists, 4 General Physicians)
-- ============================================================

INSERT INTO doctors (name, name_bn, qualification, specialty,
  hospital_name, hospital_bn, area, district, phone,
  visiting_hours, rating, experience_years) VALUES

-- Ophthalmologists (8)
('Dr. Md. Sharful Islam', 'ডা. মো. শরফুল ইসলাম',
  'MBBS, DO, FCPS (Ophthalmology)',
  'Ophthalmologist',
  'National Eye Care, BIRDEM General Hospital',
  'জাতীয় চক্ষু সেবা, বার্ডেম জেনারেল হাসপাতাল',
  'Shahbag, Dhaka', 'Dhaka', '+880-2-8626625',
  'Sun-Thu: 8AM-2PM', 4.8, 18),

('Dr. Ferdousi Begum', 'ডা. ফেরদৌসী বেগম',
  'MBBS, MS (Ophthalmology)',
  'Ophthalmologist',
  'Dhaka Medical College Hospital',
  'ঢাকা মেডিকেল কলেজ হাসপাতাল',
  'Bakshibazar, Dhaka', 'Dhaka', '+880-2-55165088',
  'Sat-Wed: 9AM-1PM', 4.7, 22),

('Dr. A.K.M. Anwaruzzaman', 'ডা. একেএম আনওয়ারুজ্জামান',
  'MBBS, FCPS, MS (Vitreo-Retina)',
  'Ophthalmologist',
  'Popular Medical Centre',
  'পপুলার মেডিক্যাল সেন্টার',
  'Dhanmondi, Dhaka', 'Dhaka', '+880-2-8617344',
  'Sat-Thu: 5PM-9PM', 4.9, 25),

('Dr. Rokeya Khanam', 'ডা. রোকেয়া খানম',
  'MBBS, DO, MS (Ophthalmology)',
  'Ophthalmologist',
  'Square Hospital Ltd',
  'স্কয়ার হাসপাতাল লিমিটেড',
  'Panthapath, Dhaka', 'Dhaka', '+880-2-8159457',
  'Sun-Thu: 10AM-3PM', 4.6, 15),

('Dr. Mofazzal Hossain', 'ডা. মোফাজ্জল হোসেন',
  'MBBS, FCPS (Eye), FRCS (Glasgow)',
  'Ophthalmologist',
  'Chittagong Eye Infirmary & Training Complex',
  'চট্টগ্রাম চক্ষু হাসপাতাল',
  'Pahartali, Chittagong', 'Chittagong', '+880-31-751666',
  'Sat-Thu: 8AM-2PM', 4.7, 20),

('Dr. Niaz Ahmed', 'ডা. নিয়াজ আহমেদ',
  'MBBS, DO, D-OPHTH',
  'Ophthalmologist',
  'Bangladesh Eye Hospital',
  'বাংলাদেশ আই হাসপাতাল',
  'Mirpur, Dhaka', 'Dhaka', '+880-2-9007076',
  'Sun-Thu: 10AM-1PM, 5PM-8PM', 4.5, 12),

('Dr. Sharmin Jahan', 'ডা. শারমিন জাহান',
  'MBBS, FCPS (Ophthalmology)',
  'Ophthalmologist',
  'Ibn Sina Medical College',
  'ইবনে সিনা মেডিকেল কলেজ',
  'Kallyanpur, Dhaka', 'Dhaka', '+880-2-9103161',
  'Sat-Thu: 9AM-3PM', 4.4, 10),

('Dr. Mohammad Ali', 'ডা. মোহাম্মদ আলী',
  'MBBS, MS (Ophthalmology), FICO (UK)',
  'Ophthalmologist',
  'Rajshahi Medical College Hospital',
  'রাজশাহী মেডিকেল কলেজ হাসপাতাল',
  'Rajshahi Sadar, Rajshahi', 'Rajshahi', '+880-721-774325',
  'Sun-Thu: 8AM-2PM', 4.6, 16),

-- General Physicians (4)
('Dr. Farhana Rahman', 'ডা. ফারহানা রহমান',
  'MBBS, FCPS (Medicine)',
  'General Physician',
  'Labaid Hospital',
  'ল্যাবএইড হাসপাতাল',
  'Dhanmondi, Dhaka', 'Dhaka', '+880-2-9670517',
  'Sun-Thu: 6PM-10PM', 4.7, 14),

('Dr. Mahbub Ullah', 'ডা. মাহবুব উল্লাহ',
  'MBBS, MD (Internal Medicine)',
  'General Physician',
  'United Hospital',
  'ইউনাইটেড হাসপাতাল',
  'Gulshan, Dhaka', 'Dhaka', '+880-2-8836444',
  'Sat-Thu: 9AM-1PM', 4.8, 20),

('Dr. Taslima Nasrin', 'ডা. তাসলিমা নাসরিন',
  'MBBS, MRCP (UK)',
  'General Physician',
  'Sylhet MAG Osmani Medical College',
  'সিলেট এমএজি ওসমানী মেডিকেল কলেজ',
  'Sylhet Sadar, Sylhet', 'Sylhet', '+880-821-717195',
  'Sun-Thu: 8AM-2PM', 4.5, 13),

('Dr. Shahidul Islam', 'ডা. শহীদুল ইসলাম',
  'MBBS, MD (Cardiology)',
  'General Physician',
  'National Heart Foundation',
  'জাতীয় হৃদরোগ ইনস্টিটিউট',
  'Sher-e-Bangla Nagar, Dhaka', 'Dhaka', '+880-2-8117161',
  'Sun-Thu: 10AM-4PM', 4.6, 17);
