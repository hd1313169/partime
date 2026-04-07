/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect } from 'react';
import { JobType, WorkLog, WeeklyPriceConfig } from './types';
import { WeeklySheet } from './components/WeeklySheet';
import { LogModal } from './components/LogModal';
import { ReportModal } from './components/ReportModal';
import { JobManagementModal } from './components/JobManagementModal';
import { mapApiError } from './services/apiClient';
import { salaryApi } from './services/salaryApi';
import { Wallet, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, RotateCcw, Settings2 } from 'lucide-react';
import { addWeeks, subWeeks, format, startOfWeek, addMonths, subMonths, addYears, subYears, isSameWeek, addDays } from 'date-fns';
import { zhTW } from 'date-fns/locale';

export default function App() {
  const [jobs, setJobs] = useState<JobType[]>([]);
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weeklyPrices, setWeeklyPrices] = useState<WeeklyPriceConfig>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    salaryApi
      .getBootstrap()
      .then((data) => {
        if (cancelled) return;
        setJobs(data.jobs);
        setLogs(data.logs);
        setWeeklyPrices(data.weeklyPrices);
      })
      .catch((error) => {
        if (cancelled) return;
        setApiError(mapApiError(error));
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Modal states
  const [logModal, setLogModal] = useState<{ isOpen: boolean; job?: JobType; date?: string; log?: WorkLog }>({ isOpen: false });
  const [reportModal, setReportModal] = useState<{ isOpen: boolean; text: string }>({ isOpen: false, text: '' });
  const [jobManagementOpen, setJobManagementOpen] = useState(false);

  const weekStartISO = useMemo(() => format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd'), [currentDate]);

  // Get current week's prices, inheriting from most recent set price or global job price
  const currentWeekPrices = useMemo(() => {
    const prices: Record<string, number> = {};
    const weekKeys = Object.keys(weeklyPrices).sort().reverse();
    
    jobs.forEach(job => {
      // Find the most recent week (including current or before) that has this job's price
      const mostRecentWeekWithPrice = weekKeys.find(w => w <= weekStartISO && weeklyPrices[w][job.id] !== undefined);
      
      if (mostRecentWeekWithPrice) {
        prices[job.id] = weeklyPrices[mostRecentWeekWithPrice][job.id];
      } else {
        prices[job.id] = job.unitPrice;
      }
    });
    return prices;
  }, [jobs, weeklyPrices, weekStartISO]);

  const handleUpdateWeeklyPrice = (jobId: string, price: number) => {
    setWeeklyPrices(prev => ({
      ...prev,
      [weekStartISO]: {
        ...(prev[weekStartISO] || {}),
        [jobId]: price
      }
    }));

    salaryApi.setWeeklyPrice(weekStartISO, jobId, price).catch((error) => {
      setApiError(mapApiError(error));
    });
  };

  const handleSaveLog = async (log: WorkLog) => {
    const exists = logs.find(l => l.id === log.id);

    try {
      if (exists) {
        await salaryApi.updateLog(log);
      } else {
        await salaryApi.createLog(log);
      }

      setLogs(prev => {
        const hasLog = prev.find(l => l.id === log.id);
        if (hasLog) {
          return prev.map(l => (l.id === log.id ? log : l));
        }
        return [...prev, log];
      });
    } catch (error) {
      setApiError(mapApiError(error));
    }
  };

  const handleDeleteLog = async (id: string) => {
    try {
      await salaryApi.deleteLog(id);
      setLogs(prev => prev.filter(l => l.id !== id));
    } catch (error) {
      setApiError(mapApiError(error));
    }
  };

  const handleUpdateJobs = async (updatedJobs: JobType[]) => {
    const previousJobsById = new Map(jobs.map(job => [job.id, job]));
    const nextJobsById = new Map(updatedJobs.map(job => [job.id, job]));

    const createOps = updatedJobs
      .filter(job => !previousJobsById.has(job.id))
      .map(job => salaryApi.createJob(job));

    const updateOps = updatedJobs
      .filter(job => {
        const prev = previousJobsById.get(job.id);
        return Boolean(prev) && JSON.stringify(prev) !== JSON.stringify(job);
      })
      .map(job => salaryApi.updateJob(job));

    const deleteOps = jobs
      .filter(job => !nextJobsById.has(job.id))
      .map(job => salaryApi.deleteJob(job.id));

    try {
      await Promise.all([...createOps, ...updateOps, ...deleteOps]);
      setJobs(updatedJobs);
    } catch (error) {
      setApiError(mapApiError(error));
    }
  };

  const nextWeek = () => setCurrentDate(prev => addWeeks(prev, 1));
  const prevWeek = () => setCurrentDate(prev => subWeeks(prev, 1));
  const nextMonth = () => setCurrentDate(prev => addMonths(prev, 1));
  const prevMonth = () => setCurrentDate(prev => subMonths(prev, 1));
  const nextYear = () => setCurrentDate(prev => addYears(prev, 1));
  const prevYear = () => setCurrentDate(prev => subYears(prev, 1));
  const jumpToToday = () => setCurrentDate(new Date());

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const isCurrentWeek = isSameWeek(currentDate, new Date(), { weekStartsOn: 1 });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-600 p-2.5 rounded-2xl shadow-lg shadow-emerald-200 rotate-3">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-black tracking-tight text-slate-900">個人工資管理系統</h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Personal Salary Tracker</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {!isCurrentWeek && (
              <button 
                onClick={jumpToToday}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 font-bold rounded-2xl hover:bg-emerald-100 transition-all border border-emerald-100 whitespace-nowrap"
              >
                <RotateCcw className="w-4 h-4" />
                回到本週
              </button>
            )}
            <button 
              onClick={() => setJobManagementOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all shadow-sm group"
            >
              <Settings2 className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
              <span className="hidden sm:inline">工作項目管理</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="space-y-8">
          {isLoading && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
              正在載入資料...
            </div>
          )}
          {apiError && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
              {apiError}
            </div>
          )}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <h2 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">薪資週報表</h2>
              <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1">點擊儲存格即可新增或編輯工作紀錄，單價欄位可手動調整本週工資</p>
            </div>
            
            <div className="flex flex-wrap items-center justify-center lg:justify-end gap-2 sm:gap-3">
              {/* Year Nav */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl shadow-sm border border-slate-200">
                <button onClick={prevYear} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-emerald-600 transition-all" title="上一年">
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <span className="text-[10px] font-black px-1 text-slate-500 uppercase tracking-widest">年</span>
                <button onClick={nextYear} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-emerald-600 transition-all" title="下一年">
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>

              {/* Month Nav */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl shadow-sm border border-slate-200">
                <button onClick={prevMonth} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-emerald-600 transition-all" title="上一月">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-[10px] font-black px-1 text-slate-500 uppercase tracking-widest">月</span>
                <button onClick={nextMonth} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-emerald-600 transition-all" title="下一月">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Week Nav */}
              <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 w-full sm:w-auto justify-between sm:justify-start">
                <button 
                  onClick={prevWeek}
                  className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-emerald-600"
                  title="上一週"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="px-3 py-1.5 bg-slate-50 rounded-xl text-xs font-black text-slate-700 min-w-[180px] text-center">
                  {format(weekStart, 'yyyy/MM/dd')} - {format(addDays(weekStart, 6), 'yyyy/MM/dd')}
                </div>
                <button 
                  onClick={nextWeek}
                  className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-emerald-600"
                  title="下一週"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
          
          <WeeklySheet 
            logs={logs} 
            jobs={jobs} 
            currentDate={currentDate} 
            weeklyPrices={currentWeekPrices}
            onUpdateWeeklyPrice={handleUpdateWeeklyPrice}
            onCellClick={(job, date, log) => setLogModal({ isOpen: true, job, date, log })}
            onGenerateReport={(text) => setReportModal({ isOpen: true, text })}
          />
        </div>
      </main>

      {/* Modals */}
      {logModal.job && logModal.date && (
        <LogModal
          isOpen={logModal.isOpen}
          onClose={() => setLogModal({ ...logModal, isOpen: false })}
          job={logModal.job}
          date={logModal.date}
          unitPrice={currentWeekPrices[logModal.job.id]}
          existingLog={logModal.log}
          onSave={(log) => {
            void handleSaveLog(log);
          }}
          onDelete={(id) => {
            void handleDeleteLog(id);
          }}
        />
      )}

      <ReportModal
        isOpen={reportModal.isOpen}
        onClose={() => setReportModal({ ...reportModal, isOpen: false })}
        text={reportModal.text}
      />

      <JobManagementModal
        isOpen={jobManagementOpen}
        onClose={() => setJobManagementOpen(false)}
        jobs={jobs}
        onUpdateJobs={(updatedJobs) => {
          void handleUpdateJobs(updatedJobs);
        }}
      />

      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-200 shadow-sm">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
            系統運作正常 · 2026 工資計算表
          </p>
        </div>
      </footer>
    </div>
  );
}
