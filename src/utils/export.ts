// src/utils/export.ts
import * as XLSX from 'xlsx';
import {
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  format,
  getDay,
  differenceInMinutes,
  parse,
} from 'date-fns';
import { JobType, WorkLog } from '../types';

const WEEKDAY_NAMES = ['日', '一', '二', '三', '四', '五', '六'] as const;

function formatAmount(amount: number): string {
  return `NT$${amount.toLocaleString('en-US')}`;
}

/**
 * 組裝月份資料為二維陣列（純函式，不觸發下載，可單元測試）。
 * 結構：header | 每日資料列 | 週合計列（每週日後或月底後插入）| 月合計列
 */
export function buildMonthRows(
  logs: WorkLog[],
  jobs: JobType[],
  year: number,
  month: number,
): (string | number)[][] {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  const monthLogs = logs.filter(l => l.date.startsWith(prefix));

  // date -> jobId -> WorkLog
  const logMap = new Map<string, Map<string, WorkLog>>();
  for (const log of monthLogs) {
    if (!logMap.has(log.date)) logMap.set(log.date, new Map());
    logMap.get(log.date)!.set(log.jobId, log);
  }

  const header: string[] = ['日期', '星期', ...jobs.map(j => j.name), '當日合計'];
  const rows: (string | number)[][] = [header];

  const days = eachDayOfInterval({
    start: startOfMonth(new Date(year, month - 1)),
    end: endOfMonth(new Date(year, month - 1)),
  });

  // 週累計器
  let wkMinutes: (number | undefined)[] = jobs.map(j => (j.calcType === 'HOURLY' ? 0 : undefined));
  let wkQuantities: (number | undefined)[] = jobs.map(j => (j.calcType !== 'HOURLY' ? 0 : undefined));
  let wkTotal = 0;

  const resetWeek = () => {
    wkMinutes = jobs.map(j => (j.calcType === 'HOURLY' ? 0 : undefined));
    wkQuantities = jobs.map(j => (j.calcType !== 'HOURLY' ? 0 : undefined));
    wkTotal = 0;
  };

  for (let i = 0; i < days.length; i++) {
    const day = days[i];
    const dateStr = format(day, 'yyyy-MM-dd');
    const dayLogs = logMap.get(dateStr) ?? new Map<string, WorkLog>();
    const row: (string | number)[] = [format(day, 'MM/dd'), WEEKDAY_NAMES[getDay(day)]];
    let dailyTotal = 0;

    for (let j = 0; j < jobs.length; j++) {
      const job = jobs[j];
      const log = dayLogs.get(job.id);

      if (!log) {
        row.push('-');
        continue;
      }

      dailyTotal += log.amount;
      wkTotal += log.amount;

      if (job.calcType === 'HOURLY') {
        let mins = 0;
        if (log.startTime && log.endTime) {
          const s = parse(log.startTime, 'HH:mm', new Date(0));
          const e = parse(log.endTime, 'HH:mm', new Date(0));
          mins = differenceInMinutes(e, s);
        }
        wkMinutes[j] = (wkMinutes[j] ?? 0) + mins;
        row.push(`${Math.ceil(mins / 60)}h`);
      } else {
        const qty = log.quantity ?? 0;
        wkQuantities[j] = (wkQuantities[j] ?? 0) + qty;
        row.push(`${qty}件`);
      }
    }

    row.push(dailyTotal > 0 ? formatAmount(dailyTotal) : '-');
    rows.push(row);

    // 週合計列：週日後或月底最後一天後插入
    const isLastDay = i === days.length - 1;
    const isSunday = getDay(day) === 0;

    if (isSunday || isLastDay) {
      const wkRow: (string | number)[] = ['▸ 週合計', ''];
      for (let j = 0; j < jobs.length; j++) {
        if (jobs[j].calcType === 'HOURLY') {
          const mins = wkMinutes[j] ?? 0;
          wkRow.push(mins > 0 ? `${Math.ceil(mins / 60)}h` : '-');
        } else {
          const qty = wkQuantities[j] ?? 0;
          wkRow.push(qty > 0 ? `${qty}件` : '-');
        }
      }
      wkRow.push(wkTotal > 0 ? formatAmount(wkTotal) : '-');
      rows.push(wkRow);
      resetWeek();
    }
  }

  // 月合計列
  const monthRow: (string | number)[] = ['▸ 月合計', ''];
  let grandTotal = 0;

  for (const job of jobs) {
    const jobLogs = monthLogs.filter(l => l.jobId === job.id);
    grandTotal += jobLogs.reduce((s, l) => s + l.amount, 0);

    if (job.calcType === 'HOURLY') {
      let totalMins = 0;
      for (const l of jobLogs) {
        if (l.startTime && l.endTime) {
          const s = parse(l.startTime, 'HH:mm', new Date(0));
          const e = parse(l.endTime, 'HH:mm', new Date(0));
          totalMins += differenceInMinutes(e, s);
        }
      }
      monthRow.push(totalMins > 0 ? `${Math.ceil(totalMins / 60)}h` : '-');
    } else {
      const totalQty = jobLogs.reduce((s, l) => s + (l.quantity ?? 0), 0);
      monthRow.push(totalQty > 0 ? `${totalQty}件` : '-');
    }
  }

  monthRow.push(grandTotal > 0 ? formatAmount(grandTotal) : '-');
  rows.push(monthRow);

  return rows;
}

/** 產生並觸發瀏覽器下載 xlsx 檔。 */
export function exportMonthToExcel(
  logs: WorkLog[],
  jobs: JobType[],
  year: number,
  month: number,
): void {
  const rows = buildMonthRows(logs, jobs, year, month);
  const sheetName = `${year}年${String(month).padStart(2, '0')}月`;
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `partime-${year}-${String(month).padStart(2, '0')}.xlsx`);
}
