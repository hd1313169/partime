export type CalcType = 'HOURLY' | 'PIECE' | 'FIXED';

export interface Job {
  id: string;
  name: string;
  calcType: CalcType;
  unitPrice: number;
  color: string;
}

export interface WorkLog {
  id: string;
  jobId: string;
  date: string;
  startTime?: string;
  endTime?: string;
  quantity?: number;
  amount: number;
  unitPriceAtTime: number;
}

export interface WeeklyPriceRow {
  weekStart: string;
  jobId: string;
  unitPrice: number;
}
