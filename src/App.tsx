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
import { DemoFooter } from './components/DemoFooter';
import { getStoredAppSecret, isUnauthorizedError, mapApiError, setStoredAppSecret } from './services/apiClient';
import { salaryApi } from './services/salaryApi';
import { isDemoMode } from './services/demoMode';
import { ChevronLeft, ChevronRight, RotateCcw, Settings2 } from 'lucide-react';
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
    <div className="min-h-screen bg-ground text-ink font-sans">
      {!isUnlocked && <UnlockGate onSubmit={handleUnlockSubmit} />}

      <header className="app-topbar">
        <div className="app-shell-wide px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 sm:gap-5 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="hidden min-[400px]:block text-[17px] font-semibold tracking-[-0.01em] text-ink truncate">個人工資管理系統</h1>
            </div>
            <div className="segmented" role="group" aria-label="切換報表">
              <button aria-pressed={view === 'weekly'} onClick={() => setView('weekly')}>週報</button>
              <button aria-pressed={view === 'monthly'} onClick={() => setView('monthly')}>月報</button>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <DemoResetButton />
            <button
              onClick={() => setJobManagementOpen(true)}
              className="button-secondary-strong"
              title="工作項目管理"
            >
              <Settings2 className="w-4 h-4 text-muted" />
              <span className="hidden sm:inline">工作項目</span>
            </button>
          </div>
        </div>
      </header>

      <main className="app-shell-wide px-4 sm:px-6 lg:px-8 pt-5 sm:pt-8 pb-16">
        <div className="space-y-5 sm:space-y-6">
          {isLoading && (
            <div className="feedback-banner-strong loading">正在載入資料…</div>
          )}
          {apiError && (
            <div className="feedback-banner-strong error" role="alert">{apiError}</div>
          )}

          {view === 'weekly' && (
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <h2 className="text-[22px] sm:text-[26px] font-semibold tracking-[-0.02em] text-ink">薪資週報表</h2>
                <p className="text-[15px] text-muted mt-0.5">點擊項目即可記錄；單價可針對本週調整</p>
              </div>

              <nav className="flex items-center gap-1" aria-label="切換週次">
                <button onClick={prevYear} className="btn-ghost h-8 px-2 text-[14px] text-muted hidden sm:inline-flex" title="上一年" aria-label="上一年">
                  <ChevronLeft className="w-3.5 h-3.5" />年
                </button>
                <button onClick={prevMonth} className="btn-ghost h-8 px-2 text-[14px] text-muted hidden sm:inline-flex" title="上一月" aria-label="上一月">
                  <ChevronLeft className="w-3.5 h-3.5" />月
                </button>
                <div className="flex items-center flex-1 sm:flex-none h-9 border border-line bg-surface rounded-[var(--radius-ctl)]">
                  <button onClick={prevWeek} className="h-full px-2.5 text-muted hover:text-ink border-r border-line" title="上一週" aria-label="上一週">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="num flex-1 sm:flex-none px-2 sm:px-3 text-[15px] font-medium text-ink text-center whitespace-nowrap sm:min-w-[188px]">
                    {format(weekStart, 'yyyy/MM/dd')} – {format(addDays(weekStart, 6), 'MM/dd')}
                  </span>
                  <button onClick={nextWeek} className="h-full px-2.5 text-muted hover:text-ink border-l border-line" title="下一週" aria-label="下一週">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <button onClick={nextMonth} className="btn-ghost h-8 px-2 text-[14px] text-muted hidden sm:inline-flex" title="下一月" aria-label="下一月">
                  月<ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button onClick={nextYear} className="btn-ghost h-8 px-2 text-[14px] text-muted hidden sm:inline-flex" title="下一年" aria-label="下一年">
                  年<ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={jumpToToday}
                  disabled={isCurrentWeek}
                  className="btn-ghost h-9 px-2.5 text-accent disabled:text-faint disabled:opacity-100"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  本週
                </button>
              </nav>
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

      <DemoFooter />
    </div>
  );
}
