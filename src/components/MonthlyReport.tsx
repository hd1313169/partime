// src/components/MonthlyReport.tsx
import React, { useState, useMemo } from 'react';
import { JobType, WorkLog } from '../types';
import { computeMonthlyReport } from '../utils/monthly';
import { exportMonthToExcel } from '../utils/export';
import { Select } from './Select';
import { MonthlyCharts, ChartTab } from './MonthlyCharts';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Download } from 'lucide-react';
import { addMonths, subMonths, addYears, subYears, format, getYear, getMonth } from 'date-fns';

interface MonthlyReportProps {
  logs: WorkLog[];
  jobs: JobType[];
}

export const MonthlyReport: React.FC<MonthlyReportProps> = ({ logs, jobs }) => {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [chartTab, setChartTab] = useState<ChartTab>('daily');

  const year = getYear(selectedMonth);
  const month = getMonth(selectedMonth) + 1; // date-fns getMonth is 0-based

  const report = useMemo(
    () => computeMonthlyReport(logs, jobs, year, month),
    [logs, jobs, year, month]
  );

  // Year options: current year ± 2
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);



  const typeLabel = (t: JobType['calcType']) => (t === 'HOURLY' ? '計時' : t === 'PIECE' ? '計件' : '固定');
  const qtyLabel = (stat: (typeof report.stats)[number]) =>
    stat.job.calcType === 'HOURLY'
      ? `${Math.ceil((stat.totalMinutes ?? 0) / 60)} 小時`
      : stat.job.calcType === 'PIECE'
        ? `${stat.totalQuantity ?? 0} 件`
        : `${stat.totalQuantity ?? 0} 次`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-[22px] sm:text-[26px] font-semibold tracking-[-0.02em] text-ink">薪資月報表</h2>
          <p className="text-[15px] text-muted mt-0.5">依實際工作日期統計，跨月的週會自動拆開計算</p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex items-center gap-1 sm:gap-1.5 w-full sm:w-auto">
          <button onClick={() => setSelectedMonth(prev => subYears(prev, 1))} className="icon-btn" title="上一年" aria-label="上一年">
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center justify-between flex-1 min-w-0 sm:flex-none h-9 border border-line bg-surface rounded-[var(--radius-ctl)]">
            <button onClick={() => setSelectedMonth(prev => subMonths(prev, 1))} className="h-full px-2 sm:px-2.5 text-muted hover:text-ink border-r border-line" title="上一月" aria-label="上一月">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <Select
              variant="inline"
              ariaLabel="年份"
              value={year}
              options={yearOptions.map(y => ({ value: y, label: `${y} 年` }))}
              onChange={(y) => setSelectedMonth(new Date(y, month - 1, 1))}
            />
            <Select
              variant="inline"
              ariaLabel="月份"
              value={month}
              options={monthOptions.map(m => ({ value: m, label: `${m} 月` }))}
              onChange={(m) => setSelectedMonth(new Date(year, m - 1, 1))}
            />
            <button onClick={() => setSelectedMonth(prev => addMonths(prev, 1))} className="h-full px-2 sm:px-2.5 text-muted hover:text-ink border-l border-line" title="下一月" aria-label="下一月">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <button onClick={() => setSelectedMonth(prev => addYears(prev, 1))} className="icon-btn" title="下一年" aria-label="下一年">
            <ChevronsRight className="w-4 h-4" />
          </button>
          </div>
          <button
            onClick={() => exportMonthToExcel(logs, jobs, year, month)}
            className="button-secondary-strong w-full sm:w-auto sm:ml-1 justify-center"
            title="匯出 Excel"
          >
            <Download className="w-4 h-4 text-muted" />
            匯出
          </button>
        </div>
      </div>

      {report.stats.length === 0 ? (
        <div className="border-y border-line py-14 text-center">
          <p className="text-[17px] font-medium text-ink-2">{format(selectedMonth, 'yyyy 年 M 月')}還沒有工作紀錄</p>
          <p className="text-[15px] text-muted mt-1">切換月份，或回到週報新增紀錄。</p>
        </div>
      ) : (
        <>
          <section aria-label="當月總工資" className="border-y border-line py-4 sm:py-5">
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-[15px] text-muted">{year} 年 {month} 月總工資</span>
              <span className="num text-[28px] sm:text-[32px] font-semibold tracking-[-0.02em] text-ink leading-none">
                <span className="text-[17px] font-medium text-muted mr-1">NT$</span>
                {report.grandTotal.toLocaleString()}
              </span>
            </div>
            {report.grandTotal > 0 && (
              <div className="mt-3.5 flex h-2 w-full overflow-hidden rounded-full bg-sunken gap-px" aria-hidden>
                {report.stats.filter(s => s.totalAmount > 0).map(({ job, totalAmount }) => (
                  <div key={job.id} style={{ width: `${(totalAmount / report.grandTotal) * 100}%`, backgroundColor: job.color }} />
                ))}
              </div>
            )}
          </section>

          <MonthlyCharts logs={logs} jobs={jobs} year={year} month={month} tab={chartTab} onTabChange={setChartTab} />

          <div className="bg-surface border border-line rounded-[var(--radius-sheet)] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-line">
                  <th scope="col" className="text-left text-[14px] font-medium text-muted px-2.5 sm:px-4 py-3">工作項目</th>
                  <th scope="col" className="text-right text-[14px] font-medium text-muted px-2.5 sm:px-4 py-3">時數／件數</th>
                  <th scope="col" className="hidden sm:table-cell text-right text-[14px] font-medium text-muted px-2.5 sm:px-4 py-3">佔比</th>
                  <th scope="col" className="text-right text-[14px] font-medium text-muted px-2.5 sm:px-4 py-3">工資</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/70">
                {report.stats.map((stat) => (
                  <tr key={stat.job.id}>
                    <th scope="row" className="px-2.5 sm:px-4 py-3 text-left font-normal">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: stat.job.color }} />
                        <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2.5">
                          <span className="text-[16px] font-medium text-ink whitespace-nowrap">{stat.job.name}</span>
                          <span className="text-[14px] text-muted whitespace-nowrap">{typeLabel(stat.job.calcType)}</span>
                        </div>
                      </div>
                    </th>
                    <td className="num px-2.5 sm:px-4 py-3 text-right text-[16px] text-ink-2 whitespace-nowrap">{qtyLabel(stat)}</td>
                    <td className="num hidden sm:table-cell px-2.5 sm:px-4 py-3 text-right text-[16px] text-muted">
                      {report.grandTotal > 0 ? `${Math.round((stat.totalAmount / report.grandTotal) * 100)}%` : '—'}
                    </td>
                    <td className="num px-2.5 sm:px-4 py-3 text-right text-[16px] font-medium text-ink">{stat.totalAmount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-line bg-sunken/70">
                  <th scope="row" colSpan={2} className="px-2.5 sm:px-4 py-3 text-left text-[14px] font-medium text-muted">合計</th>
                  <td className="hidden sm:table-cell" />
                  <td className="num px-2.5 sm:px-4 py-3 text-right text-[17px] font-semibold text-ink whitespace-nowrap"><span className="text-[14px] font-medium text-muted mr-1">NT$</span>{report.grandTotal.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  );
};
