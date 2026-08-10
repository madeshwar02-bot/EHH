import React, { useState } from 'react';
import { Search, UserCheck, ShieldCheck, Bell } from 'lucide-react';

interface HeaderProps {
  onSearchSubmit: (query: string) => void;
  activeTabTitle: string;
}

export const Header: React.FC<HeaderProps> = ({ onSearchSubmit, activeTabTitle }) => {
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearchSubmit(query.trim());
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-10 shadow-xs">
      {/* Title */}
      <div>
        <h2 className="text-base font-bold text-slate-800 tracking-tight">{activeTabTitle}</h2>
        <p className="text-xs text-slate-500">University Exam Hall Room & Physical Seat Allocation</p>
      </div>

      {/* Global Quick Search Bar & User Session */}
      <div className="flex items-center gap-4">
        <form onSubmit={handleSearch} className="relative w-64 md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search register no, student, room..."
            className="w-full bg-slate-50 border border-slate-200 pl-9 pr-3 py-1.5 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </form>

        <div className="h-6 w-px bg-slate-200 mx-1" />

        {/* User Session Profile */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs border border-indigo-200">
            EC
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-slate-800 leading-none">Exam Cell Officer</p>
            <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
              <ShieldCheck className="w-3 h-3 text-emerald-600 inline" /> Admin Access
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
