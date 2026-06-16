export const drugMapping: Record<string, string> = {};

export function getGenericName(brandName: string): string {
  return drugMapping[brandName.toLowerCase()] || brandName;
}

export function mapDrugs(brandNames: string[]): string[] {
  return brandNames.map(getGenericName);
}