// src/components/MonthlyReport.tsx
import React, { useState, useMemo } from 'react';
import { JobType, WorkLog } from '../types';
import { computeMonthlyReport } from '../utils/monthly';
import { exportMonthToExcel } from '../utils/export';
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

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMonth(new Date(Number(e.target.value), month - 1, 1));
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMonth(new Date(year, Number(e.target.value) - 1, 1));
  };

  const selectClass = "text-xs font-bold bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400";

  return (
    <div className="space-y-8">
      {/* Title + Nav */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">薪資月報表</h2>
          <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1">依實際工作日期統計，跨月週自動分開計算</p>
        </div>

        <div className="flex flex-wrap items-center justify-center lg:justify-end gap-2 sm:gap-3">
          {/* Arrow nav */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl shadow-sm border border-slate-200">
            <button onClick={() => setSelectedMonth(prev => subYears(prev, 1))} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-emerald-600 transition-all" title="上一年">
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setSelectedMonth(prev => subMonths(prev, 1))} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-emerald-600 transition-all" title="上一月">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-black px-2 text-slate-700 min-w-[80px] text-center">
              {format(selectedMonth, 'yyyy/MM')}
            </span>
            <button onClick={() => setSelectedMonth(prev => addMonths(prev, 1))} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-emerald-600 transition-all" title="下一月">
              <ChevronRight className="w-4 h-4" />
            </button>
            <button onClick={() => setSelectedMonth(prev => addYears(prev, 1))} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-emerald-600 transition-all" title="下一年">
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>

          {/* Dropdowns */}
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl shadow-sm border border-slate-200">
            <select value={year} onChange={handleYearChange} className={selectClass}>
              {yearOptions.map(y => (
                <option key={y} value={y}>{y} 年</option>
              ))}
            </select>
            <select value={month} onChange={handleMonthChange} className={selectClass}>
              {monthOptions.map(m => (
                <option key={m} value={m}>{m} 月</option>
              ))}
            </select>
          </div>

          {/* 匯出 Excel */}
          <button
            onClick={() => exportMonthToExcel(logs, jobs, year, month)}
            className="flex items-center gap-1.5 bg-white px-3 py-2 rounded-xl shadow-sm border border-slate-200 text-slate-500 hover:text-emerald-600 hover:bg-slate-50 transition-all text-xs font-bold"
            title="匯出 Excel"
          >
            <Download className="w-4 h-4" />
            <span>匯出</span>
          </button>
        </div>
      </div>

      {report.stats.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-16 text-center">
          <p className="text-slate-400 font-bold text-lg">本月尚無工作記錄</p>
          <p className="text-slate-300 text-sm mt-2">切換月份或前往週報新增記錄</p>
        </div>
      ) : (
        <>
          {/* Stats Table */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left text-xs font-black text-slate-500 uppercase tracking-wider px-6 py-4">工作項目</th>
                  <th className="text-right text-xs font-black text-slate-500 uppercase tracking-wider px-6 py-4">時數 / 件數</th>
                  <th className="text-right text-xs font-black text-slate-500 uppercase tracking-wider px-6 py-4">工資</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.stats.map(({ job, totalMinutes, totalQuantity, totalAmount }) => (
                  <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: job.color }} />
                        <span className="font-bold text-slate-800">{job.name}</span>
                        <span className="text-xs text-slate-400 font-medium">
                          {job.calcType === 'HOURLY' ? '計時' : job.calcType === 'PIECE' ? '計件' : '固定'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-700">
                      {job.calcType === 'HOURLY'
                        ? `${Math.ceil((totalMinutes ?? 0) / 60)} 小時`
                        : job.calcType === 'PIECE'
                          ? `${totalQuantity ?? 0} 件`
                          : `${totalQuantity ?? 0} 次`
                      }
                    </td>
                    <td className="px-6 py-4 text-right font-black text-slate-900">
                      ${totalAmount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Grand Total Card */}
          <div className="bg-white rounded-3xl shadow-xl shadow-emerald-100/50 border border-emerald-100 p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-black text-slate-500 uppercase tracking-widest">{year} 年 {month} 月</p>
                <p className="text-lg font-black text-slate-700 mt-1">當月總工資</p>
              </div>
              <p className="text-4xl font-black text-emerald-600">${report.grandTotal.toLocaleString()}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
