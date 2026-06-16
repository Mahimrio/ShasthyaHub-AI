export interface User {
  id: string;
  email: string;
  name: string;
  role: 'patient' | 'doctor' | 'admin';
  createdAt: string;
}

export interface Report {
  id: string;
  userId: string;
  type: 'nayan-ai' | 'scriptguard' | 'glycovision';
  data: Record<string, unknown>;
  createdAt: string;
}

export interface AnalysisResult {
  id: string;
  type: 'nayan-ai' | 'scriptguard' | 'glycovision';
  status: 'pending' | 'completed' | 'failed';
  result?: Record<string, unknown>;
  error?: string;
  createdAt: string;
}