export interface MedicationSchedule {
  id: string;
  name: string;
  dosage: string;
  frequency: 'daily' | 'twice-daily' | 'thrice-daily' | 'weekly';
  times: string[];
  startDate: string;
  endDate?: string;
}

export function generateSchedule(medications: MedicationSchedule[]): Record<string, MedicationSchedule[]> {
  const schedule: Record<string, MedicationSchedule[]> = {};
  
  medications.forEach((med) => {
    med.times.forEach((time) => {
      const key = `${med.frequency}-${time}`;
      if (!schedule[key]) schedule[key] = [];
      schedule[key].push(med);
    });
  });
  
  return schedule;
}