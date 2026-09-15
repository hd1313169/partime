import React from 'react';
import { Mail } from 'lucide-react';
import { isDemoMode } from '../services/demoMode';

export const DemoFooter: React.FC = () => {
  if (!isDemoMode) return null;

  return (
    <footer className="app-shell-wide px-4 sm:px-6 lg:px-8 py-6 border-t border-slate-200">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 text-center sm:text-left">
        <p className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
          <span>※ 本網站僅供展示用，如有使用需求歡迎連絡我們了解更多</span>
          <a
            href="mailto:wsad71155@gmail.com"
            className="inline-flex items-center gap-1 font-bold text-emerald-600 hover:text-emerald-700 underline underline-offset-2"
          >
            <Mail className="w-3.5 h-3.5" />
            wsad71155@gmail.com
          </a>
        </p>
        <p className="font-medium whitespace-nowrap">© 2026 Ryan Chiang. All rights reserved.</p>
      </div>
    </footer>
  );
};
