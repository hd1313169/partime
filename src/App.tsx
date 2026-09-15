/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect } from 'react';
import { JobType, WorkLog, WeeklyPriceConfig } from './types';
import { WeeklySheet } from './components/WeeklySheet';
import { MonthlyReport } from './components/MonthlyReport';
import { LogModal } from './components/LogModal';
import { ReportModal } from './components/ReportModal';
import { JobManagementModal } from './components/JobManagementModal';
import { UnlockGate } from './components/UnlockGate';
import { DemoResetButton } from './components/DemoResetButton';
import { getStoredAppSecret, isUnauthorizedError, mapApiError, setStoredAppSecret } from './services/apiClient';
import { salaryApi } from './services/salaryApi';
import { isDemoMode } from './services/demoMode';
import { Wallet, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, RotateCcw, Settings2 } from 'lucide-react';
import { addWeeks, subWeeks, format, startOfWeek, addMonths, subMonths, addYears, subYears, isSameWeek, addDays } from 'date-fns';
import { zhTW } from 'date-fns/locale';

export default function App() {
  const [jobs, setJobs] = useState<JobType[]>([]);
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weeklyPrices, setWeeklyPrices] = useState<WeeklyPriceConfig>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => isDemoMode || Boolean(getStoredAppSecret()));
  const [isLoading, setIsLoading] = useState<boolean>(() => isDemoMode || Boolean(getStoredAppSecret()));

  useEffect(() => {
    if (!isUnlocked) return;

    let cancelled = false;
    setIsLoading(true);

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
        if (isUnauthorizedError(error)) {
          setIsUnlocked(false);
        } else {
          setApiError(mapApiError(error));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isUnlocked]);

  const handleUnlockSubmit = async (secret: string) => {
    setStoredAppSecret(secret);
    const data = await salaryApi.getBootstrap();
    setJobs(data.jobs);
    setLogs(data.logs);
    setWeeklyPrices(data.weeklyPrices);
    setApiError(null);
    setIsLoading(false);
    setIsUnlocked(true);
  };

  // Modal states
  const [logModal, setLogModal] = useState<{ isOpen: boolean; job?: JobType; date?: string; log?: WorkLog }>({ isOpen: false });
  const [reportModal, setReportModal] = useState<{ isOpen: boolean; text: string }>({ isOpen: false, text: '' });
  const [jobManagementOpen, setJobManagementOpen] = useState(false);
  const [view, setView] = useState<'weekly' | 'monthly'>('weekly');

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
      if (isUnauthorizedError(error)) {
        setIsUnlocked(false);
      } else {
        setApiError(mapApiError(error));
      }
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
      if (isUnauthorizedError(error)) {
        setIsUnlocked(false);
      } else {
        setApiError(mapApiError(error));
      }
    }
  };

  const handleDeleteLog = async (id: string) => {
    try {
      await salaryApi.deleteLog(id);
      setLogs(prev => prev.filter(l => l.id !== id));
    } catch (error) {
      if (isUnauthorizedError(error)) {
        setIsUnlocked(false);
      } else {
        setApiError(mapApiError(error));
      }
    }
  };

  const handleUpdateJobs = async (updatedJobs: JobType[]) => {
    const previousJobsById = new Map<string, JobType>(jobs.map(job => [job.id, job]));
    const nextJobsById = new Map<string, JobType>(updatedJobs.map(job => [job.id, job]));

    const hasJobChanged = (prev: JobType, next: JobType) => {
      return (
        prev.name !== next.name ||
        prev.calcType !== next.calcType ||
        prev.unitPrice !== next.unitPrice ||
        prev.color !== next.color
      );
    };

    const jobsToCreate = updatedJobs.filter(job => !previousJobsById.has(job.id));

    const jobsToUpdate = updatedJobs.filter(job => {
      const prev = previousJobsById.get(job.id);
      return Boolean(prev) && hasJobChanged(prev, job);
    });

    const jobIdsToDelete = jobs
      .filter(job => !nextJobsById.has(job.id))
      .map(job => job.id);

    const hasAnyChange = jobsToCreate.length > 0 || jobsToUpdate.length > 0 || jobIdsToDelete.length > 0;

    if (!hasAnyChange) {
      return;
    }

    try {
      await Promise.all(jobsToCreate.map(job => salaryApi.createJob(job)));
      await Promise.all(jobsToUpdate.map(job => salaryApi.updateJob(job)));
      await Promise.all(jobIdsToDelete.map(id => salaryApi.deleteJob(id)));
      setJobs(updatedJobs);
    } catch (error) {
      if (isUnauthorizedError(error)) {
        setIsUnlocked(false);
      } else {
        setApiError(mapApiError(error));
      }
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
      {!isUnlocked && <UnlockGate onSubmit={handleUnlockSubmit} />}

      <header className="app-topbar">
        <div className="app-shell-wide px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-600 p-2.5 rounded-2xl shadow-lg shadow-emerald-200 rotate-3">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-black tracking-tight text-slate-900">個人工資管理系統</h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Personal Salary Tracker</p>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setView('weekly')}
                className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all ${view === 'weekly' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                週報
              </button>
              <button
                onClick={() => setView('monthly')}
                className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all ${view === 'monthly' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                月報
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {view === 'weekly' && !isCurrentWeek && (
              <button 
                onClick={jumpToToday}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 font-bold rounded-2xl hover:bg-emerald-100 transition-all border border-emerald-100 whitespace-nowrap"
              >
                <RotateCcw className="w-4 h-4" />
                回到本週
              </button>
            )}
            <DemoResetButton />
            <button
              onClick={() => setJobManagementOpen(true)}
              className="button-secondary-strong group"
            >
              <Settings2 className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
              <span className="hidden sm:inline">工作項目管理</span>
            </button>
          </div>
        </div>
      </header>

      <main className="app-shell-wide px-4 sm:px-6 lg:px-8 py-10">
        <div className="space-y-8">
          {isLoading && (
            <div className="feedback-banner-strong loading">
              正在載入資料...
            </div>
          )}
          {apiError && (
            <div className="feedback-banner-strong error">
              {apiError}
            </div>
          )}
          {view === 'weekly' && (
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
          )}
          
          {view === 'weekly' ? (
            <WeeklySheet 
              logs={logs} 
              jobs={jobs} 
              currentDate={currentDate} 
              weeklyPrices={currentWeekPrices}
              onUpdateWeeklyPrice={handleUpdateWeeklyPrice}
              onCellClick={(job, date, log) => setLogModal({ isOpen: true, job, date, log })}
              onGenerateReport={(text) => setReportModal({ isOpen: true, text })}
            />
          ) : (
            <MonthlyReport logs={logs} jobs={jobs} />
          )}
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

      <footer className="app-shell-wide px-4 sm:px-6 lg:px-8 py-16 text-center">
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
