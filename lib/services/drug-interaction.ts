export interface DrugInteraction {
  drug1: string;
  drug2: string;
  severity: 'minor' | 'moderate' | 'major';
  description: string;
}

export const drugInteractions: DrugInteraction[] = [
  // Metformin interactions
  { drug1: 'metformin', drug2: 'furosemide', severity: 'moderate', description: 'Furosemide may increase metformin levels, risk of lactic acidosis. Monitor renal function.' },
  { drug1: 'metformin', drug2: 'diclofenac', severity: 'moderate', description: 'NSAIDs may reduce metformin effectiveness and affect kidney function.' },
  { drug1: 'metformin', drug2: 'atenolol', severity: 'minor', description: 'Beta-blockers may mask hypoglycemia symptoms. Monitor blood glucose.' },

  // Warfarin interactions
  { drug1: 'warfarin', drug2: 'aspirin', severity: 'major', description: 'Increased bleeding risk. Avoid combination unless absolutely necessary.' },
  { drug1: 'warfarin', drug2: 'diclofenac', severity: 'major', description: 'NSAIDs significantly increase bleeding risk with warfarin.' },
  { drug1: 'warfarin', drug2: 'ciprofloxacin', severity: 'major', description: 'Ciprofloxacin potentiates warfarin effect. Monitor INR closely.' },
  { drug1: 'warfarin', drug2: 'metronidazole', severity: 'major', description: 'Metronidazole potentiates warfarin effect. Monitor INR closely.' },
  { drug1: 'warfarin', drug2: 'omeprazole', severity: 'moderate', description: 'May slightly increase warfarin effect. Monitor INR.' },

  // ACE Inhibitor interactions
  { drug1: 'enalapril', drug2: 'spironolactone', severity: 'major', description: 'Risk of severe hyperkalemia. Monitor potassium levels closely.' },
  { drug1: 'ramipril', drug2: 'spironolactone', severity: 'major', description: 'Risk of severe hyperkalemia. Monitor potassium levels closely.' },
  { drug1: 'enalapril', drug2: 'furosemide', severity: 'moderate', description: 'Enhanced hypotensive effect. Monitor blood pressure.' },
  { drug1: 'ramipril', drug2: 'furosemide', severity: 'moderate', description: 'Enhanced hypotensive effect. Monitor blood pressure.' },
  { drug1: 'enalapril', drug2: 'diclofenac', severity: 'moderate', description: 'NSAIDs reduce antihypertensive effect of ACE inhibitors.' },
  { drug1: 'ramipril', drug2: 'diclofenac', severity: 'moderate', description: 'NSAIDs reduce antihypertensive effect of ACE inhibitors.' },

  // Statin interactions
  { drug1: 'atorvastatin', drug2: 'warfarin', severity: 'moderate', description: 'Atorvastatin may slightly increase INR. Monitor.' },
  { drug1: 'simvastatin', drug2: 'amlodipine', severity: 'moderate', description: 'Increased risk of myopathy/rhabdomyolysis. Limit simvastatin to 20mg.' },

  // Antibiotic interactions
  { drug1: 'ciprofloxacin', drug2: 'metformin', severity: 'moderate', description: 'Ciprofloxacin may enhance metformin effect. Monitor blood glucose.' },
  { drug1: 'azithromycin', drug2: 'warfarin', severity: 'moderate', description: 'May potentiate warfarin effect. Monitor INR.' },

  // Diuretic interactions
  { drug1: 'furosemide', drug2: 'diclofenac', severity: 'moderate', description: 'NSAIDs reduce diuretic effectiveness. Monitor fluid status.' },
  { drug1: 'furosemide', drug2: 'atenolol', severity: 'moderate', description: 'Enhanced hypotensive effect. Monitor blood pressure.' },
  { drug1: 'spironolactone', drug2: 'losartan', severity: 'major', description: 'Risk of severe hyperkalemia. Avoid combination or monitor potassium closely.' },

  // Clopidogrel interactions
  { drug1: 'clopidogrel', drug2: 'aspirin', severity: 'moderate', description: 'Increased bleeding risk. Use only when clinically indicated (e.g., DAPT after stent).' },
  { drug1: 'clopidogrel', drug2: 'omeprazole', severity: 'moderate', description: 'Omeprazole may reduce clopidogrel effectiveness. Consider pantoprazole instead.' },

  // Insulin interactions
  { drug1: 'insulin', drug2: 'atenolol', severity: 'moderate', description: 'Beta-blockers may mask hypoglycemia symptoms. Monitor blood glucose closely.' },

  // Digoxin interactions
  { drug1: 'digoxin', drug2: 'furosemide', severity: 'major', description: 'Furosemide-induced hypokalemia increases digoxin toxicity risk. Monitor potassium.' },
  { drug1: 'digoxin', drug2: 'spironolactone', severity: 'moderate', description: 'May increase digoxin levels. Monitor digoxin levels.' },
];

export function checkInteractions(drugs: string[]): DrugInteraction[] {
  return drugInteractions.filter(
    (interaction) =>
      drugs.includes(interaction.drug1) && drugs.includes(interaction.drug2)
  );
}