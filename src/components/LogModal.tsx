
import React, { useState, useEffect } from 'react';
import { JobType, WorkLog } from '../types';
import { calculateLogAmount } from '../utils/salary';
import { X, Trash2, Save, Clock, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LogModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: JobType;
  date: string;
  unitPrice: number;
  existingLog?: WorkLog;
  onSave: (log: WorkLog) => void;
  onDelete: (id: string) => void;
}

export const LogModal: React.FC<LogModalProps> = ({
  isOpen,
  onClose,
  job,
  date,
  unitPrice,
  existingLog,
  onSave,
  onDelete,
}) => {
  const [startTime, setStartTime] = useState(existingLog?.startTime || '08:15');
  const [endTime, setEndTime] = useState(existingLog?.endTime || '14:20');
  const [quantity, setQuantity] = useState<number>(existingLog?.quantity || 1);

  useEffect(() => {
    if (existingLog) {
      setStartTime(existingLog.startTime || '08:15');
      setEndTime(existingLog.endTime || '14:20');
      setQuantity(existingLog.quantity || 1);
    } else {
      setStartTime('08:15');
      setEndTime('14:20');
      setQuantity(1);
    }
  }, [existingLog, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    const amount = calculateLogAmount(job, unitPrice, startTime, endTime, quantity);
    const log: WorkLog = {
      id: existingLog?.id || Math.random().toString(36).substr(2, 9),
      jobId: job.id,
      date,
      startTime: job.calcType === 'HOURLY' ? startTime : undefined,
      endTime: job.calcType === 'HOURLY' ? endTime : undefined,
      quantity: job.calcType !== 'HOURLY' ? quantity : undefined,
      amount,
      unitPriceAtTime: unitPrice,
    };
    onSave(log);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div>
              <h3 className="text-xl font-bold text-slate-900">{existingLog ? '編輯紀錄' : '新增紀錄'}</h3>
              <p className="text-sm text-slate-600 font-medium">{date} · {job.name}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          <div className="p-8 space-y-6">
            {job.calcType === 'HOURLY' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> 開始時間
                    </label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full bg-white border-2 border-slate-200 focus:border-emerald-500 focus:bg-white rounded-2xl px-4 py-3 text-lg font-medium text-slate-900 transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> 結束時間
                    </label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full bg-white border-2 border-slate-200 focus:border-emerald-500 focus:bg-white rounded-2xl px-4 py-3 text-lg font-medium text-slate-900 transition-all outline-none"
                    />
                  </div>
                </div>
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <p className="text-xs text-emerald-600 font-bold uppercase mb-1">預估金額</p>
                  <p className="text-2xl font-black text-emerald-700">
                    NT$ {calculateLogAmount(job, unitPrice, startTime, endTime, quantity).toLocaleString()}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5" /> {job.calcType === 'PIECE' ? '數量' : '次數'}
                  </label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full bg-white border-2 border-slate-200 focus:border-emerald-500 focus:bg-white rounded-2xl px-4 py-3 text-lg font-medium text-slate-900 transition-all outline-none"
                  />
                </div>
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <p className="text-xs text-emerald-600 font-bold uppercase mb-1">預估金額</p>
                  <p className="text-2xl font-black text-emerald-700">
                    NT$ {calculateLogAmount(job, unitPrice, undefined, undefined, quantity).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 bg-slate-100 border-t border-slate-200 flex gap-3">
            {existingLog && (
              <button
                onClick={() => {
                  onDelete(existingLog.id);
                  onClose();
                }}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-white border-2 border-red-200 text-red-600 font-bold rounded-2xl hover:bg-red-50 transition-all"
              >
                <Trash2 className="w-5 h-5" /> 刪除
              </button>
            )}
            <button
              onClick={handleSave}
              className="flex-[2] flex items-center justify-center gap-2 py-3.5 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
            >
              <Save className="w-5 h-5" /> 儲存
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
