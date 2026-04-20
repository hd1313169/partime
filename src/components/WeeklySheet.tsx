
import React from 'react';
import { JobType, WorkLog } from '../types';
import { format, eachDayOfInterval, startOfWeek, endOfWeek } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { FileText, Plus, Wallet } from 'lucide-react';

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
    const dayLogMap = new Map(
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

  return (
    <div className="space-y-6">
      {/* Mobile View: Card List */}
      <div className="lg:hidden space-y-4">
        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dailyTotal = calculateDailyTotal(dateStr);
          
          return (
            <div key={dateStr} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="mobile-day-card-header p-4 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {format(day, 'EEEE', { locale: zhTW })}
                  </div>
                  <div className="text-lg font-black text-slate-900">
                    {format(day, 'MM/dd')}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">當日合計</div>
                    <div className="text-xl font-black text-emerald-600">${dailyTotal.toLocaleString()}</div>
                  </div>
                  {dailyTotal > 0 && (
                    <button 
                      onClick={() => generateReportText(dateStr)}
                      className="button-icon-strong p-3"
                      title="生成回報文字"
                    >
                      <FileText className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="divide-y divide-slate-50">
                {jobs.map(job => {
                  const log = getLogForJobAndDate(job.id, dateStr);
                  const currentPrice = weeklyPrices[job.id];
                  
                  return (
                    <div 
                      key={job.id} 
                      className="p-4 flex items-center justify-between active:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => onCellClick(job, dateStr, log)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: job.color }}></div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{job.name}</p>
                          <div className="flex items-center gap-1 mt-0.5" onClick={(e) => e.stopPropagation()}>
                            <span className="text-[10px] text-slate-400 font-bold uppercase">單價: $</span>
                            <input 
                              type="number"
                              value={currentPrice}
                              onChange={(e) => onUpdateWeeklyPrice(job.id, Number(e.target.value))}
                              className="w-14 bg-slate-100 border-none rounded px-1 py-0.5 text-[10px] font-black text-slate-600 outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500 transition-all"
                            />
                          </div>
                        </div>
                      </div>
                      
                      {log ? (
                        <div className="text-right">
                          <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md inline-block mb-1">
                            {job.calcType === 'HOURLY' ? `${log.startTime}-${log.endTime}` : `數量: ${log.quantity}`}
                          </div>
                          <div className="text-base font-black text-slate-900">${log.amount.toLocaleString()}</div>
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                          <Plus className="w-4 h-4 text-slate-300" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        
        {/* Mobile Grand Total */}
        <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-1">全週總計</p>
              <p className="text-3xl font-black text-emerald-400">NT$ {grandTotal.toLocaleString()}</p>
            </div>
            <div className="bg-white/10 p-4 rounded-2xl">
              <Wallet className="w-8 h-8 text-emerald-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Desktop View: Table */}
      <div className="hidden lg:block bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="desktop-weekly-head">
                <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-[0.2em] sticky left-0 z-10 border-r border-slate-100 whitespace-nowrap">工作項目</th>
                <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">本週單價</th>
                {days.map(day => (
                  <th key={day.toString()} className="p-4 text-center min-w-[120px]">
                    <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">
                      {format(day, 'EEEE', { locale: zhTW })}
                    </div>
                    <div className="text-lg font-black text-slate-900">
                      {format(day, 'MM/dd')}
                    </div>
                  </th>
                ))}
                <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-[0.2em] text-right sticky right-0 z-10 border-l border-slate-100">週合計</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map(job => (
                <tr key={job.id} className="border-b border-slate-50 group transition-all">
                  <td className="desktop-weekly-sticky-lead p-6 font-bold text-slate-900 sticky left-0 z-10 border-r border-slate-50 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)] whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: job.color }}></div>
                      {job.name}
                    </div>
                  </td>
                  <td className="desktop-weekly-sticky-lead p-6">
                    <div className="flex items-center gap-2 group/price">
                      <span className="text-[10px] font-black text-slate-300 uppercase">NT$</span>
                      <input 
                        type="number"
                        value={weeklyPrices[job.id]}
                        onChange={(e) => onUpdateWeeklyPrice(job.id, Number(e.target.value))}
                        className="w-16 bg-slate-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-xl px-2 py-1 text-sm font-black text-slate-700 transition-all outline-none"
                      />
                    </div>
                  </td>
                  {days.map(day => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const log = getLogForJobAndDate(job.id, dateStr);
                    
                    return (
                      <td 
                        key={dateStr} 
                        className="p-2 text-center cursor-pointer group/cell"
                        onClick={() => onCellClick(job, dateStr, log)}
                      >
                        <div className={`
                          min-h-[70px] rounded-2xl flex flex-col items-center justify-center transition-all border-2
                          ${log 
                            ? 'bg-emerald-50/50 border-emerald-100 group-hover/cell:bg-emerald-100 group-hover/cell:border-emerald-200' 
                            : 'bg-slate-50/30 border-transparent hover:bg-slate-50 hover:border-slate-200'
                          }
                        `}>
                          {log ? (
                            <div className="p-2">
                              <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-tight mb-1 bg-emerald-100/50 px-1.5 py-0.5 rounded-md">
                                {job.calcType === 'HOURLY' ? `${log.startTime}-${log.endTime}` : `數量: ${log.quantity}`}
                              </div>
                              <div className="text-lg font-black text-emerald-800">
                                ${log.amount.toLocaleString()}
                              </div>
                            </div>
                          ) : (
                            <Plus className="w-5 h-5 text-slate-200 opacity-0 group-hover/cell:opacity-100 transition-opacity" />
                          )}
                        </div>
                      </td>
                    );
                  })}
                  <td className="desktop-weekly-sticky-total p-6 text-right font-black text-slate-900 sticky right-0 z-10 border-l border-slate-50 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.05)]">
                    <span className="text-xs text-slate-300 mr-2">NT$</span>
                    {calculateJobWeeklyTotal(job.id).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-900 text-white">
                <td colSpan={2} className="p-6 font-black text-xs uppercase tracking-[0.3em] text-slate-400">每日合計</td>
                {days.map(day => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const total = calculateDailyTotal(dateStr);
                  return (
                    <td key={dateStr} className="p-4 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="text-lg font-black">${total.toLocaleString()}</div>
                        {total > 0 && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              generateReportText(dateStr);
                            }}
                            className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all group/btn"
                            title="生成回報文字"
                          >
                            <FileText className="w-4 h-4 text-white/60 group-hover/btn:text-white" />
                          </button>
                        )}
                      </div>
                    </td>
                  );
                })}
                <td className="desktop-weekly-sticky-total p-6 text-right font-black text-2xl bg-emerald-600 shadow-[-10px_0_20px_-5px_rgba(16,185,129,0.3)]">
                  <div className="text-[10px] font-black text-emerald-200 uppercase tracking-[0.2em] mb-1">全週總計</div>
                  NT$ {grandTotal.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
