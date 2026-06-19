export type MatchLevel = "high" | "medium";

export type Medication = {
  written: string;
  brand: string;
  generic: string;
  drugClass: string;
  match: MatchLevel;
};

export type TimeSlot = {
  key: string;
  label: string;
  bengali: string;
  icon: string;
  meds: { name: string; timing: string }[];
};

export const medications: Medication[] = [
  {
    written: "Napa Extra",
    brand: "Napa Extra",
    generic: "Paracetamol + Caffeine",
    drugClass: "Analgesic",
    match: "high",
  },
  {
    written: "Nap­rox 500",
    brand: "Naprox",
    generic: "Naproxen",
    drugClass: "NSAID",
    match: "high",
  },
  {
    written: "Azith 500",
    brand: "Azithrocin",
    generic: "Azithromycin",
    drugClass: "Antibiotic (Macrolide)",
    match: "medium",
  },
  {
    written: "Sergel 20",
    brand: "Sergel",
    generic: "Esomeprazole",
    drugClass: "Proton Pump Inhibitor",
    match: "high",
  },
  {
    written: "Fexo 120",
    brand: "Fexo",
    generic: "Fexofenadine",
    drugClass: "Antihistamine",
    match: "medium",
  },
];

export const schedule: TimeSlot[] = [
  {
    key: "morning",
    label: "Morning",
    bengali: "সকাল",
    icon: "\u2600\uFE0F",
    meds: [
      { name: "Napa Extra", timing: "after meal" },
      { name: "Sergel 20", timing: "before meal" },
    ],
  },
  {
    key: "afternoon",
    label: "Afternoon",
    bengali: "দুপুর",
    icon: "\uD83C\uDF24\uFE0F",
    meds: [{ name: "Naprox 500", timing: "after meal" }],
  },
  {
    key: "evening",
    label: "Evening",
    bengali: "বিকাল",
    icon: "\uD83C\uDF05",
    meds: [{ name: "Fexo 120", timing: "after meal" }],
  },
  {
    key: "night",
    label: "Night",
    bengali: "রাত",
    icon: "\uD83C\uDF19",
    meds: [
      { name: "Azith 500", timing: "after meal" },
      { name: "Sergel 20", timing: "before meal" },
    ],
  },
];

export const bengaliScheduleScript =
  "সকালে খাবারের পরে নাপা এক্সট্রা এবং খাবারের আগে সারজেল। দুপুরে খাবারের পরে ন্যাপ্রক্স। বিকালে খাবারের পরে ফেক্সো। রাতে খাবারের পরে অ্যাজিথ এবং খাবারের আগে সারজেল।";
