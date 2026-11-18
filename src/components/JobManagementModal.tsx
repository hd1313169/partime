
import React, { useState, useEffect } from 'react';
import { JobType } from '../types';
import { Select } from './Select';
import { X, Trash2, Save, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface JobManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobs: JobType[];
  onUpdateJobs: (jobs: JobType[]) => void;
}

const COLORS = [
  '#10b981', '#34d399', '#059669', '#f59e0b', '#ec4899', 
  '#6366f1', '#8b5cf6', '#f43f5e', '#0ea5e9', '#14b8a6'
];

export const JobManagementModal: React.FC<JobManagementModalProps> = ({
  isOpen,
  onClose,
  jobs,
  onUpdateJobs,
}) => {
  const [editedJobs, setEditedJobs] = useState<JobType[]>(jobs);

  useEffect(() => {
    if (isOpen) {
      setEditedJobs(jobs);
    }
  }, [isOpen, jobs]);

  if (!isOpen) return null;

  const handleAddJob = () => {
    const newJob: JobType = {
      id: Math.random().toString(36).substr(2, 9),
      name: '新工作項目',
      calcType: 'HOURLY',
      unitPrice: 200,
      color: COLORS[editedJobs.length % COLORS.length],
    };
    setEditedJobs([...editedJobs, newJob]);
  };

  const handleUpdateJob = (id: string, updates: Partial<JobType>) => {
    setEditedJobs(prev => prev.map(j => j.id === id ? { ...j, ...updates } : j));
  };

  const handleDeleteJob = (id: string) => {
    if (window.confirm('確定要刪除此工作項目嗎？這不會刪除已存在的紀錄，但該項目將不再顯示於表格中。')) {
      setEditedJobs(prev => prev.filter(j => j.id !== id));
    }
  };

  const handleSave = () => {
    onUpdateJobs(editedJobs);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="scrim" onClick={onClose}>
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="jobs-title"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          className="sheet sm:max-w-2xl flex flex-col max-h-[92vh]"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
        >
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-line">
            <div>
              <h3 id="jobs-title" className="text-[19px] font-semibold text-ink">工作項目管理</h3>
              <p className="text-[15px] text-muted mt-0.5">設定名稱、計算方式、單價與代表色</p>
            </div>
            <button onClick={onClose} className="icon-btn -mr-1.5" aria-label="關閉">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5">
            <ul className="divide-y divide-line">
              {editedJobs.map(job => (
                <li key={job.id} className="py-4">
                  <div className="grid grid-cols-[auto_1fr] sm:grid-cols-[auto_1fr_8rem_7rem_auto] items-end gap-x-3 gap-y-3">
                    <button
                      onClick={() => {
                        const nextColor = COLORS[(COLORS.indexOf(job.color) + 1) % COLORS.length];
                        handleUpdateJob(job.id, { color: nextColor });
                      }}
                      className="w-11 h-11 rounded-[var(--radius-ctl)] border border-line grid place-items-center hover:border-line-strong transition-colors"
                      title="更換顏色"
                      aria-label={`更換 ${job.name} 的顏色`}
                    >
                      <span className="w-4 h-4 rounded-full" style={{ backgroundColor: job.color }} />
                    </button>

                    <div>
                      <label htmlFor={`job-name-${job.id}`} className="field-label">項目名稱</label>
                      <input
                        id={`job-name-${job.id}`}
                        type="text"
                        value={job.name}
                        onChange={(e) => handleUpdateJob(job.id, { name: e.target.value })}
                        className="field"
                      />
                    </div>

                    <div className="col-span-2 sm:col-span-1 grid grid-cols-[1fr_1fr_auto] sm:contents gap-3">
                      <div>
                        <label htmlFor={`job-type-${job.id}`} className="field-label">計算方式</label>
                        <Select
                          id={`job-type-${job.id}`}
                          value={job.calcType}
                          options={[
                            { value: 'HOURLY', label: '時薪制' },
                            { value: 'PIECE', label: '計件制' },
                            { value: 'FIXED', label: '次數制' },
                          ]}
                          onChange={(v) => handleUpdateJob(job.id, { calcType: v as JobType['calcType'] })}
                        />
                      </div>

                      <div>
                        <label htmlFor={`job-price-${job.id}`} className="field-label">單價</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-muted">NT$</span>
                          <input
                            id={`job-price-${job.id}`}
                            type="number"
                            inputMode="decimal"
                            value={job.unitPrice}
                            onChange={(e) => handleUpdateJob(job.id, { unitPrice: Number(e.target.value) })}
                            className="field num pl-10 text-right"
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteJob(job.id)}
                        className="icon-btn w-11 h-11 text-muted hover:text-danger hover:bg-danger-soft self-end ml-2"
                        title="刪除項目"
                        aria-label={`刪除 ${job.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <button
              onClick={handleAddJob}
              className="btn-ghost w-full h-11 my-3 border border-dashed border-line-strong text-muted hover:text-ink"
            >
              <Plus className="w-4 h-4" /> 新增工作項目
            </button>
          </div>

          <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-line">
            <button onClick={onClose} className="btn-ghost">取消</button>
            <button onClick={handleSave} className="btn-primary h-10 px-5">
              <Save className="w-4 h-4" /> 儲存所有變更
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
