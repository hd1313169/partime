import React from 'react';
import { RefreshCcw } from 'lucide-react';
import { isDemoMode } from '../services/demoMode';

export const DemoResetButton: React.FC = () => {
  if (!isDemoMode) return null;

  const handleReset = async () => {
    const { resetToSeed } = await import('../services/salaryApi.mock');
    resetToSeed();
    window.location.reload();
  };

  return (
    <button
      onClick={() => {
        void handleReset();
      }}
      className="button-secondary-strong group"
      title="重置示範資料"
    >
      <RefreshCcw className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
      <span className="hidden sm:inline">重置示範資料</span>
    </button>
  );
};
