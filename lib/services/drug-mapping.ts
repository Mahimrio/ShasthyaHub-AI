export const drugMapping: Record<string, string> = {
  napa: 'paracetamol',
  ace: 'paracetamol',
  paracip: 'paracetamol',
  monas: 'montelukast',
  seclo: 'omeprazole',
  losectil: 'lansoprazole',
  maxpro: 'pantoprazole',
  nexivum: 'esomeprazole',
  azimax: 'azithromycin',
  cipro: 'ciprofloxacin',
  metro: 'metronidazole',
  flagyl: 'metronidazole',
  glucophage: 'metformin',
  lortan: 'losartan',
  fexo: 'fexofenadine',
  neoceptin: 'ranitidine',
  omidon: 'domperidone',
  oradexon: 'dexamethasone',
  amoxil: 'amoxicillin',
  clavulin: 'amoxicillin+clavulanate',
  sefalin: 'cefalexin',
  diclofenac: 'diclofenac',
  naprosyn: 'naproxen',
  brufen: 'ibuprofen',
  trika: 'triazolam',
  rivotril: 'clonazepam',
  lexapro: 'escitalopram',
  sertraline: 'sertraline',
  atorva: 'atorvastatin',
  lipovas: 'simvastatin',
  rosuvas: 'rosuvastatin',
  amlodipine: 'amlodipine',
  tenolol: 'atenolol',
  concor: 'bisoprolol',
  lasix: 'furosemide',
  diamicron: 'gliclazide',
  amaryl: 'glimepiride',
  ventolin: 'salbutamol',
  mebex: 'mebendazole',
};

export function getGenericName(brandName: string): string {
  return drugMapping[brandName.toLowerCase()] || brandName;
}

export function mapDrugs(brandNames: string[]): string[] {
  return brandNames.map(getGenericName);
}