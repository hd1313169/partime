
import React, { useState, useEffect } from 'react';
import { JobType, WorkLog } from '../types';
import { calculateLogAmount } from '../utils/salary';
import { X, Trash2, Save, Minus, Plus } from 'lucide-react';
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

  const amount = job.calcType === 'HOURLY'
    ? calculateLogAmount(job, unitPrice, startTime, endTime, quantity)
    : calculateLogAmount(job, unitPrice, undefined, undefined, quantity);

  const minutes = (() => {
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    return (eh * 60 + em) - (sh * 60 + sm);
  })();
  const hoursLabel = (minutes / 60).toFixed(2).replace(/\.?0+$/, '');
  const invalidRange = job.calcType === 'HOURLY' && minutes <= 0;

  const unitLabel = job.calcType === 'HOURLY' ? '小時' : job.calcType === 'PIECE' ? '件' : '次';
  const typeLabel = job.calcType === 'HOURLY' ? '時薪制' : job.calcType === 'PIECE' ? '計件制' : '次數制';

  return (
    <AnimatePresence>
      <div className="scrim" onClick={onClose}>
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="log-sheet-title"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          className="sheet sm:max-w-md"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
        >
          <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4 border-b border-line">
            <div className="min-w-0">
              <h3 id="log-sheet-title" className="text-[19px] font-semibold text-ink">{existingLog ? '編輯紀錄' : '新增紀錄'}</h3>
              <p className="mt-1 flex items-center gap-1.5 text-[15px] text-muted">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: job.color }} />
                <span className="text-ink-2">{job.name}</span>
                <span aria-hidden>·</span>
                <span className="num">{date}</span>
                <span aria-hidden>·</span>
                <span>{typeLabel}</span>
              </p>
            </div>
            <button onClick={onClose} className="icon-btn -mr-1.5" aria-label="關閉">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-5 py-5 space-y-5">
            {job.calcType === 'HOURLY' ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="log-start" className="field-label">開始時間</label>
                  <input
                    id="log-start"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="field num"
                  />
                </div>
                <div>
                  <label htmlFor="log-end" className="field-label">結束時間</label>
                  <input
                    id="log-end"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="field num"
                    aria-invalid={invalidRange}
                  />
                </div>
              </div>
            ) : (
              <div>
                <label htmlFor="log-qty" className="field-label">{job.calcType === 'PIECE' ? '數量' : '次數'}</label>
                <div className="flex items-stretch gap-2">
                  <button
                    type="button"
                    className="button-secondary-strong h-11 w-11 px-0 text-lg"
                    onClick={() => setQuantity(q => Math.max(0, q - 1))}
                    aria-label="減少"
                  ><Minus className="w-4 h-4" /></button>
                  <input
                    id="log-qty"
                    type="number"
                    inputMode="numeric"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="field num text-center text-[19px] font-medium"
                  />
                  <button
                    type="button"
                    className="button-secondary-strong h-11 w-11 px-0 text-lg"
                    onClick={() => setQuantity(q => q + 1)}
                    aria-label="增加"
                  ><Plus className="w-4 h-4" /></button>
                </div>
              </div>
            )}

            {/* Formula line: the arithmetic is always visible */}
            <div className="rounded-[var(--radius-ctl)] bg-sunken px-4 py-3.5" aria-live="polite">
              <div className="num flex items-center justify-between gap-3 text-[15px] text-muted">
                <span>
                  {job.calcType === 'HOURLY'
                    ? <>NT$ {unitPrice} × {invalidRange ? '—' : hoursLabel} {unitLabel}</>
                    : <>NT$ {unitPrice} × {quantity} {unitLabel}</>}
                </span>
                {job.calcType === 'HOURLY' && !invalidRange && <span>無條件進位</span>}
              </div>
              <div className="num mt-1 flex items-baseline justify-between">
                <span className="text-[15px] text-muted">金額</span>
                <span className="text-[26px] font-semibold tracking-[-0.02em] text-ink leading-none">
                  <span className="text-[16px] font-medium text-muted mr-1">NT$</span>{amount.toLocaleString()}
                </span>
              </div>
              {existingLog && existingLog.unitPriceAtTime !== unitPrice && (
                <p className="mt-2 text-[15px] text-ink-2">原紀錄單價 NT$ {existingLog.unitPriceAtTime}（NT$ {existingLog.amount.toLocaleString()}），儲存後改用本週單價 NT$ {unitPrice}。</p>
              )}
              {invalidRange && (
                <p className="mt-2 text-[15px] text-danger">結束時間要晚於開始時間。</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-line">
            {existingLog ? (
              <button
                onClick={() => {
                  onDelete(existingLog.id);
                  onClose();
                }}
                className="btn-danger -ml-2"
              >
                <Trash2 className="w-4 h-4" /> 刪除
              </button>
            ) : <span />}
            <div className="flex items-center gap-2">
              <button onClick={onClose} className="btn-ghost">取消</button>
              <button onClick={handleSave} disabled={invalidRange} className="btn-primary h-10 px-5">
                <Save className="w-4 h-4" /> 儲存
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
