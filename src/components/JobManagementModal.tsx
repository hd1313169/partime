
import React, { useState, useEffect } from 'react';
import { JobType } from '../types';
import { X, Trash2, Save, Plus, Settings2, Palette } from 'lucide-react';
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
        >
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-emerald-600" />
              <h3 className="text-xl font-bold text-slate-900">工作項目管理</h3>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          <div className="p-4 sm:p-6 max-h-[70vh] overflow-y-auto space-y-4">
            {editedJobs.map(job => (
              <div key={job.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4 group hover:border-emerald-200 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">項目名稱</label>
                    <input
                      type="text"
                      value={job.name}
                      onChange={(e) => handleUpdateJob(job.id, { name: e.target.value })}
                      className="w-full bg-white border-2 border-transparent focus:border-emerald-500 rounded-xl px-3 py-2 font-bold text-slate-900 transition-all outline-none"
                    />
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="flex-1 sm:w-32">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">計算方式</label>
                      <select
                        value={job.calcType}
                        onChange={(e) => handleUpdateJob(job.id, { calcType: e.target.value as any })}
                        className="w-full bg-white border-2 border-transparent focus:border-emerald-500 rounded-xl px-3 py-2 font-bold text-slate-900 transition-all outline-none appearance-none cursor-pointer"
                      >
                        <option value="HOURLY">時薪制</option>
                        <option value="PIECE">計件制</option>
                        <option value="FIXED">次數制</option>
                      </select>
                    </div>

                    <div className="flex-1 sm:w-28">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">預設單價</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">NT$</span>
                        <input
                          type="number"
                          value={job.unitPrice}
                          onChange={(e) => handleUpdateJob(job.id, { unitPrice: Number(e.target.value) })}
                          className="w-full bg-white border-2 border-transparent focus:border-emerald-500 rounded-xl pl-10 pr-3 py-2 text-right font-black text-slate-900 transition-all outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 sm:pt-0">
                    <button
                      onClick={() => {
                        const nextColor = COLORS[(COLORS.indexOf(job.color) + 1) % COLORS.length];
                        handleUpdateJob(job.id, { color: nextColor });
                      }}
                      className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
                      title="更換顏色"
                    >
                      <Palette className="w-4 h-4" style={{ color: job.color }} />
                    </button>
                    <button
                      onClick={() => handleDeleteJob(job.id)}
                      className="p-2.5 bg-white border border-red-100 text-red-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all"
                      title="刪除項目"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={handleAddJob}
              className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold hover:border-emerald-300 hover:text-emerald-500 hover:bg-emerald-50/30 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" /> 新增工作項目
            </button>
          </div>

          <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="flex-[2] flex items-center justify-center gap-2 py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
            >
              <Save className="w-5 h-5" /> 儲存所有變更
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
