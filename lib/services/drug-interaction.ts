export interface DrugInteraction {
  drug1: string;
  drug2: string;
  severity: 'minor' | 'moderate' | 'major';
  description: string;
}

export const drugInteractions: DrugInteraction[] = [];

export function checkInteractions(drugs: string[]): DrugInteraction[] {
  return drugInteractions.filter(
    (interaction) =>
      drugs.includes(interaction.drug1) && drugs.includes(interaction.drug2)
  );
}