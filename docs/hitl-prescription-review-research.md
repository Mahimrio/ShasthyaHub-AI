# Research Report: Human-in-the-Loop (HITL) Prescription Review & Real-Time Drug Verification

**Topic:** Clinical AI Error-Recovery, Prescription OCR Correction, and Dynamic Drug-Drug Interaction Revalidation  
**Sources:** *Journal of Medical Internet Research (JMIR Human Factors & Formative Research)*, *IEEE Transactions on Biomedical Engineering*, *The Lancet Digital Health*, *FDA Digital Health Software Guidance*  

---

## 1. Academic & Clinical Informatics Foundation

### 1.1 The Clinical Inevitability of Handwritten Prescription Ambiguity
In real-world clinical practice:
- Handwritten doctor prescriptions suffer from high cursive variability, abbreviations (*"TDS"*, *"BD"*, *"PO"*, *"PC"*), and faint ink.
- Even state-of-the-art multimodal vision models (Gemini 1.5/3.5, GPT-4o Vision) achieve approximately **82–91% character accuracy** on messy handwriting.
- In medical informatics, a single character error (e.g. *Celebrex* vs *Celexa*, *Losec* vs *Lasix*) can cause severe adverse drug events (ADEs).
- **The Golden Clinical Principle (JMIR 2025):** AI should never act as an uneditable black box; it must serve as an **augmented drafting tool** with a seamless **Human-in-the-Loop (HITL) correction and verification layer**.

```
+-----------------------------------------------------------------------------------------------+
|  🩺 HUMAN-IN-THE-LOOP PRESCRIPTION SAFETY PIPELINE                                            |
+-----------------------------------------------------------------------------------------------+
|  [ 1. AI Vision Draft ] ──> [ 2. HITL Review & Correction ] ──> [ 3. Live API Verification ]  |
|                                       │                                        │              |
|                                       ▼                                        ▼              |
|                           • Fix misread brand names                • Fuzzy DB Match (bd_drugs)|
|                           • Add missing medications                • Generic identification   |
|                           • Complete missing timings               • Dynamic DDI re-eval      |
+-----------------------------------------------------------------------------------------------+
```

---

## 2. Industry Benchmark & Feature Deconstruction

| Platform | OCR Correction UX | Live Drug Verification API | Missing Information Prompting | Dynamic Interaction Revalidation |
| :--- | :--- | :--- | :--- | :--- |
| **Epic EHR / MyChart** | Inline tabular field editing with autocomplete. | RxNorm / First Databank real-time drug database check. | Highlights missing frequency in amber. | Triggers full DDI matrix recalculation on keystroke commit. |
| **GoodRx / Capsule** | Mobile modal editor for dosage and quantity. | National Drug Code (NDC) resolver. | Step-by-step wizard for unread directions. | Re-evaluates co-pay and clinical conflicts. |
| **ShasthyaHub-AI (Our Proposed Implementation)** | **Inline Table Edit + Mobile Bottom Sheet with 3D Pill Avatar.** | **3-Tier Bengali Drug Resolver (`bd_drugs` + Groq LLM + Static Map).** | **Interactive Meal & Time Slot Builder with 1-click presets.** | **Instant multi-pair DDI re-evaluation + 1-Click Sync to My Medicines.** |

---

## 3. Key Solutions to Common Engineering Pitfalls

1. **Keystroke API Storms & Rate Limits:**
   - *Problem:* Calling heavy LLMs on every single keystroke triggers rate limits and causes UI stutter.
   - *Solution:* 300ms debounce + local fuzzy database matching first (`bd_drugs`), reserving Groq LLM reasoning only for unlisted or heavily misspelled queries.
2. **Synchronized State Propagation:**
   - *Problem:* When a user edits a drug in the extracted table, the schedule timeline and interaction alerts can get out of sync if managed separately.
   - *Solution:* Centralized state updater in `useScriptGuardAnalysis` that atomically updates `extracted_drugs`, recalculates `schedule`, and refreshes `interaction_warnings` in a single transaction.
3. **Safety Affirmation & Explainability:**
   - *Problem:* Users need to know whether an edited drug is verified and safe.
   - *Solution:* High-visibility green badge: **`✓ যাচাইকৃত: নাপা এক্সট্রা ৫০০ মিগ্রা (প্যারাসিটামল ও ক্যাফেইন)`** showing verified generic composition and therapeutic class.
