
import React, { useEffect } from 'react';
import { JobType, WorkLog } from '../types';
import { format, eachDayOfInterval, startOfWeek, endOfWeek } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { FileText, Plus } from 'lucide-react';

interface WeeklySheetProps {
  logs: WorkLog[];
  jobs: JobType[];
  currentDate: Date;
  weeklyPrices: Record<string, number>;
  onUpdateWeeklyPrice: (jobId: string, price: number) => void;
  onCellClick: (job: JobType, date: string, existingLog?: WorkLog) => void;
  onGenerateReport: (text: string) => void;
}

export const WeeklySheet: React.FC<WeeklySheetProps> = ({ 
  logs, 
  jobs, 
  currentDate, 
  weeklyPrices,
  onUpdateWeeklyPrice,
  onCellClick,
  onGenerateReport
}) => {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getLogForJobAndDate = (jobId: string, dateStr: string) => {
    return logs.find(l => l.jobId === jobId && l.date === dateStr);
  };

  const calculateJobWeeklyTotal = (jobId: string) => {
    const dateStrings = days.map(d => format(d, 'yyyy-MM-dd'));
    return logs
      .filter(l => l.jobId === jobId && dateStrings.includes(l.date))
      .reduce((sum, l) => sum + l.amount, 0);
  };

  const calculateDailyTotal = (dateStr: string) => {
    return logs
      .filter(l => l.date === dateStr)
      .reduce((sum, l) => sum + l.amount, 0);
  };

  const generateReportText = (dateStr: string) => {
    const dayLogMap = new Map<string, WorkLog>(
      logs.filter(l => l.date === dateStr).map(l => [l.jobId, l])
    );
    if (dayLogMap.size === 0) return;

    const formattedDate = format(new Date(dateStr), 'MM/dd');
    let report = `${formattedDate}\n`;

    const amounts: number[] = [];
    jobs.forEach(job => {
      const log = dayLogMap.get(job.id);
      if (!log) return;

      const currentPrice = weeklyPrices[job.id];
      let detail = '';
      if (job.calcType === 'HOURLY') {
        detail = `${log.startTime}-${log.endTime}`;
      } else {
        detail = `${currentPrice}*${log.quantity}`;
      }

      report += `${job.name} ${detail} ${log.amount}\n`;
      amounts.push(log.amount);
    });

    if (amounts.length > 1) {
      const sumStr = amounts.join('+');
      const total = amounts.reduce((a, b) => a + b, 0);
      report += `${sumStr}=${total}`;
    }

    onGenerateReport(report);
  };

  const grandTotal = days.reduce((sum, day) => {
    return sum + calculateDailyTotal(format(day, 'yyyy-MM-dd'));
  }, 0);

  const jobTotals = jobs
    .map(job => ({ job, total: calculateJobWeeklyTotal(job.id) }))
    .filter(entry => entry.total > 0);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    if (typeof window === 'undefined' || window.innerWidth >= 1024) return;
    const el = document.getElementById(`day-${todayStr}`);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 64 });
  }, [todayStr, days[0]?.getTime(), jobs.length]);

  const activate = (e: React.KeyboardEvent, fn: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fn();
    }
  };

  return (
    <div className="space-y-6">
      {/* Week summary: total and where it came from */}
      <section aria-label="本週摘要" className="border-y border-line py-4 sm:py-5">
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-[15px] text-muted">本週總計</span>
          <span className="num text-[28px] sm:text-[32px] font-semibold tracking-[-0.02em] text-ink leading-none">
            <span className="text-[17px] font-medium text-muted mr-1">NT$</span>
            {grandTotal.toLocaleString()}
          </span>
        </div>
        {grandTotal > 0 ? (
          <>
            <div className="mt-3.5 flex h-2 w-full overflow-hidden rounded-full bg-sunken gap-px" aria-hidden>
              {jobTotals.map(({ job, total }) => (
                <div key={job.id} style={{ width: `${(total / grandTotal) * 100}%`, backgroundColor: job.color }} />
              ))}
            </div>
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
              {jobTotals.map(({ job, total }) => (
                <li key={job.id} className="flex items-center gap-1.5 text-[15px]">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: job.color }} />
                  <span className="text-ink-2">{job.name}</span>
                  <span className="num text-muted">{total.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="mt-2 text-[15px] text-muted">這週還沒有紀錄。點下方任一項目開始記錄。</p>
        )}
      </section>

      {/* Mobile: day groups */}
      <div className="lg:hidden space-y-5">
        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dailyTotal = calculateDailyTotal(dateStr);
          const isToday = dateStr === todayStr;

          return (
            <section key={dateStr} id={`day-${dateStr}`} aria-label={format(day, 'MM/dd EEEE', { locale: zhTW })}>
              <div className="mobile-day-card-header flex items-center justify-between h-9 border-b border-line">
                <div className="flex items-baseline gap-2">
                  <span className={`num text-[17px] font-semibold ${isToday ? 'text-accent' : 'text-ink'}`}>
                    {format(day, 'MM/dd')}
                  </span>
                  <span className="text-[15px] text-muted">{format(day, 'EEEE', { locale: zhTW })}</span>
                  {isToday && <span className="text-[14px] font-medium text-accent">今天</span>}
                </div>
                <div className="flex items-center gap-1">
                  <span className={`num text-[16px] font-medium ${dailyTotal > 0 ? 'text-ink' : 'text-faint'}`}>
                    {dailyTotal > 0 ? `NT$ ${dailyTotal.toLocaleString()}` : '—'}
                  </span>
                  {dailyTotal > 0 && (
                    <button
                      onClick={() => generateReportText(dateStr)}
                      className="icon-btn -mr-1.5"
                      title="生成回報文字"
                      aria-label="生成回報文字"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <ul className="divide-y divide-line">
                {jobs.map(job => {
                  const log = getLogForJobAndDate(job.id, dateStr);
                  const currentPrice = weeklyPrices[job.id];

                  return (
                    <li key={job.id}>
                      <div
                        role="button"
                        tabIndex={0}
                        className="flex items-center justify-between gap-3 min-h-[52px] py-2 -mx-2 px-2 rounded-[var(--radius-ctl)] cursor-pointer active:bg-sunken hover:bg-sunken/60 transition-colors"
                        onClick={() => onCellClick(job, dateStr, log)}
                        onKeyDown={(e) => activate(e, () => onCellClick(job, dateStr, log))}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: job.color }} />
                          <div className="min-w-0">
                            <p className="text-[17px] text-ink truncate">{job.name}</p>
                            <label
                              className="flex items-center gap-1.5 mt-0.5 text-[14px] text-muted"
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => e.stopPropagation()}
                            >
                              單價
                              <input
                                type="number"
                                inputMode="decimal"
                                value={currentPrice}
                                onChange={(e) => onUpdateWeeklyPrice(job.id, Number(e.target.value))}
                                className="price-input mobile-price-input"
                                aria-label={`${job.name} 本週單價`}
                              />
                            </label>
                          </div>
                        </div>

                        {log ? (
                          <div className="text-right shrink-0">
                            <div className="num text-[17px] font-medium text-ink">{log.amount.toLocaleString()}</div>
                                                      </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[15px] text-faint shrink-0">
                            <Plus className="w-3.5 h-3.5 text-line-strong" /> 記錄
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      {/* Desktop: table */}
      <div className="hidden lg:block bg-surface border border-line rounded-[var(--radius-sheet)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="desktop-weekly-head">
                <th scope="col" className="desktop-weekly-sticky-lead sticky left-0 z-10 px-4 py-3 text-[14px] font-medium text-muted border-r border-line whitespace-nowrap">工作項目</th>
                <th scope="col" className="px-3 py-3 text-[14px] font-medium text-muted whitespace-nowrap text-right">本週單價</th>
                {days.map(day => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const isToday = dateStr === todayStr;
                  return (
                    <th scope="col" key={dateStr} className={`px-2 py-3 text-center min-w-[112px] ${isToday ? 'bg-accent-soft/60' : ''}`}>
                      <div className={`text-[14px] font-medium ${isToday ? 'text-accent' : 'text-muted'}`}>
                        {format(day, 'EEEE', { locale: zhTW })}{isToday && ' · 今天'}
                      </div>
                      <div className={`num text-[17px] font-semibold ${isToday ? 'text-accent' : 'text-ink'}`}>{format(day, 'MM/dd')}</div>
                    </th>
                  );
                })}
                <th scope="col" className="desktop-weekly-sticky-total sticky right-0 z-10 px-4 py-3 text-[14px] font-medium text-muted text-right border-l border-line">週合計</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map(job => (
                <tr key={job.id} className="border-b border-line/70">
                  <th scope="row" className="desktop-weekly-sticky-lead sticky left-0 z-10 px-4 py-2 text-[16px] font-medium text-ink border-r border-line whitespace-nowrap">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: job.color }} />
                      {job.name}
                    </div>
                  </th>
                  <td className="px-3 py-2 text-right">
                    <div className="inline-flex items-center justify-end gap-0.5 text-[14px] text-muted">
                      NT$
                      <input
                        type="number"
                        value={weeklyPrices[job.id]}
                        onChange={(e) => onUpdateWeeklyPrice(job.id, Number(e.target.value))}
                        className="price-input"
                        aria-label={`${job.name} 本週單價`}
                      />
                    </div>
                  </td>
                  {days.map(day => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const log = getLogForJobAndDate(job.id, dateStr);
                    const isToday = dateStr === todayStr;

                    return (
                      <td key={dateStr} className={`p-1 text-center ${isToday ? 'bg-accent-soft/40' : ''}`}>
                        <button
                          onClick={() => onCellClick(job, dateStr, log)}
                          className="group/cell w-full min-h-[56px] rounded-[var(--radius-ctl)] flex flex-col items-center justify-center hover:bg-sunken transition-colors"
                          aria-label={`${format(day, 'MM/dd')} ${job.name}${log ? ` ${log.amount} 元，編輯` : '，新增紀錄'}`}
                        >
                          {log ? (
                            <>
                              <span className="num text-[17px] font-medium text-ink">{log.amount.toLocaleString()}</span>
                                                          </>
                          ) : (
                            <Plus className="w-4 h-4 text-line-strong group-hover/cell:text-accent transition-colors" />
                          )}
                        </button>
                      </td>
                    );
                  })}
                  <td className="desktop-weekly-sticky-total sticky right-0 z-10 px-4 py-2 text-right border-l border-line">
                    <span className="num text-[16px] font-medium text-ink">{calculateJobWeeklyTotal(job.id).toLocaleString()}</span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-sunken/70 border-t border-line">
                <th scope="row" colSpan={2} className="px-4 py-3 text-[14px] font-medium text-muted">每日合計</th>
                {days.map(day => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const total = calculateDailyTotal(dateStr);
                  return (
                    <td key={dateStr} className="px-2 py-2 text-center">
                      <div className="flex items-center justify-center gap-0.5">
                        <span className={`num text-[16px] font-semibold ${total > 0 ? 'text-ink' : 'text-faint'}`}>
                          {total > 0 ? total.toLocaleString() : '—'}
                        </span>
                        {total > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              generateReportText(dateStr);
                            }}
                            className="icon-btn w-7 h-7"
                            title="生成回報文字"
                            aria-label="生成回報文字"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  );
                })}
                <td className="desktop-weekly-sticky-total sticky right-0 z-10 px-4 py-3 text-right border-l border-line !bg-sunken">
                  <span className="num text-[16px] font-semibold text-ink">NT$ {grandTotal.toLocaleString()}</span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
