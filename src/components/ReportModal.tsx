import React, { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  text: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="scrim" onClick={onClose}>
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-title"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          className="sheet sm:max-w-md"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
        >
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-line">
            <div>
              <h3 id="report-title" className="text-[19px] font-semibold text-ink">當日回報文字</h3>
              <p className="text-[15px] text-muted mt-0.5">複製後可直接貼給雇主</p>
            </div>
            <button onClick={onClose} className="icon-btn -mr-1.5" aria-label="關閉">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-5 py-5">
            <pre className="num bg-sunken rounded-[var(--radius-ctl)] px-4 py-3.5 font-sans text-[16px] leading-[1.7] text-ink whitespace-pre-wrap">
              {text}
            </pre>
          </div>

          <div className="px-5 py-4 border-t border-line">
            <button onClick={handleCopy} className="btn-primary w-full h-11" aria-live="polite">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? '已複製到剪貼簿' : '複製回報文字'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
