
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ground">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-6">
          <span aria-hidden className="grid place-items-center w-7 h-7 rounded-[6px] bg-ink text-white text-[15px] font-semibold">工</span>
          <span className="text-[17px] font-semibold text-ink">個人工資管理系統</span>
        </div>

        <div className="bg-surface border border-line rounded-[var(--radius-sheet)]">
          <div className="px-5 pt-5 pb-4 border-b border-line flex items-start gap-3">
            <Lock className="w-4 h-4 text-muted mt-1" />
            <div>
              <h3 className="text-[19px] font-semibold text-ink">需要密鑰</h3>
              <p className="text-[15px] text-muted mt-0.5">請輸入密鑰以解鎖系統</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
            <div>
              <label htmlFor="unlock-secret" className="field-label">密鑰</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-faint absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="unlock-secret"
                  type="password"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  placeholder="貼上密鑰"
                  autoFocus
                  aria-invalid={Boolean(error)}
                  className="field pl-9"
                />
              </div>
            </div>

            {error && (
              <div className="feedback-banner-strong error" role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!secret.trim() || isSubmitting}
              className="btn-primary w-full h-11"
            >
              {isSubmitting ? '驗證中…' : '解鎖'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
