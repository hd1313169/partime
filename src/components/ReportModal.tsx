
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-xl font-bold text-slate-900">當日回報文字</h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          <div className="p-8">
            <div className="bg-slate-50 p-6 rounded-2xl border-2 border-slate-100 font-mono text-sm whitespace-pre-wrap text-slate-700 leading-relaxed">
              {text}
            </div>
          </div>

          <div className="p-6 bg-slate-50 border-t border-slate-100">
            <button
              onClick={handleCopy}
              className={`w-full flex items-center justify-center gap-2 py-4 font-bold rounded-2xl transition-all shadow-lg ${
                copied 
                ? 'bg-emerald-500 text-white shadow-emerald-100' 
                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-100'
              }`}
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              {copied ? '已複製到剪貼簿' : '複製回報文字'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
