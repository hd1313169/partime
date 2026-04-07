
import { differenceInMinutes, parse } from 'date-fns';
import { JobType, WorkLog } from '../types';

export function calculateLogAmount(
  job: JobType,
  unitPrice: number,
  startTime?: string,
  endTime?: string,
  quantity?: number
): number {
  if (job.calcType === 'HOURLY' && startTime && endTime) {
    const start = parse(startTime, 'HH:mm', new Date(0));
    const end = parse(endTime, 'HH:mm', new Date(0));
    
    const diffMinutes = differenceInMinutes(end, start);
    
    return Math.round((diffMinutes / 60) * unitPrice);
  }
  
  if ((job.calcType === 'PIECE' || job.calcType === 'FIXED') && quantity) {
    return quantity * unitPrice;
  }
  
  return 0;
}
