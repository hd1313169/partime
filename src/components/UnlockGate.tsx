
import React, { useState } from 'react';
import { Lock, KeyRound } from 'lucide-react';

interface UnlockGateProps {
  onSubmit: (secret: string) => Promise<void>;
}

export const UnlockGate: React.FC<UnlockGateProps> = ({ onSubmit }) => {
  const [secret, setSecret] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secret.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(secret.trim());
    } catch {
      setError('密鑰錯誤，請重新輸入');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
          <div className="bg-emerald-600 p-2.5 rounded-2xl shadow-lg shadow-emerald-200">
            <Lock className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">需要密鑰</h3>
            <p className="text-xs text-slate-400 font-medium">請輸入密鑰以解鎖系統</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="relative">
            <KeyRound className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="貼上密鑰"
              autoFocus
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:border-emerald-400 transition-colors"
            />
          </div>

          {error && (
            <div className="feedback-banner-strong error">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!secret.trim() || isSubmitting}
            className="w-full py-3 font-bold rounded-2xl transition-all shadow-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '驗證中...' : '解鎖'}
          </button>
        </form>
      </div>
    </div>
  );
};
