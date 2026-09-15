
export type CalcType = 'HOURLY' | 'PIECE' | 'FIXED';

export interface JobType {
  id: string;
  name: string;
  calcType: CalcType;
  unitPrice: number; // Default/Base price
  color: string;
}

export interface WeeklyPriceConfig {
  [weekStart: string]: {
    [jobId: string]: number;
  };
}

export interface WorkLog {
  id: string;
  jobId: string;
  date: string; // ISO date string
  startTime?: string; // HH:mm
  endTime?: string;
  quantity?: number;
  amount: number;
  unitPriceAtTime: number; // Store the price used for this log
}

export interface DailyTotal {
  date: string;
  total: number;
  logs: WorkLog[];
}

export interface BootstrapData {
  jobs: JobType[];
  logs: WorkLog[];
  weeklyPrices: WeeklyPriceConfig;
}
