import React from 'react';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Building2,
  DoorClosed,
  Grid,
  FileSpreadsheet,
  History,
  Search,
  Settings,
  Building,
  CheckCircle2,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeAllotmentName?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, activeAllotmentName }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'programs', label: 'Programs', icon: GraduationCap },
    { id: 'classes', label: 'Classes', icon: Building2 },
    { id: 'rooms', label: 'Rooms & Seats', icon: DoorClosed },
    { id: 'allotments', label: 'Allotment Workflow', icon: Grid, highlight: true },
    { id: 'reports', label: 'Reports & Export', icon: FileSpreadsheet },
    { id: 'history', label: 'History', icon: History },
    { id: 'search', label: 'Global Search', icon: Search },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col h-screen sticky top-0 border-r border-slate-800 shadow-xl z-20 shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
          <Building className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-sm text-white tracking-wide leading-tight">
            EXAM HALL
          </h1>
          <p className="text-xs text-indigo-400 font-medium">Allotment System</p>
        </div>
      </div>

      {/* Active Allotment Badge */}
      <div className="mx-3 mt-4 mb-2 p-3 bg-slate-800/80 rounded-lg border border-slate-700/60 flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        <div className="overflow-hidden">
          <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Active Session</p>
          <p className="text-xs font-medium text-slate-200 truncate" title={activeAllotmentName || 'Default Session'}>
            {activeAllotmentName || 'Fall Semester Allotment'}
          </p>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold'
                  : item.highlight
                  ? 'bg-indigo-950/40 text-indigo-200 hover:bg-indigo-900/50 border border-indigo-800/40'
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.highlight ? 'text-indigo-400' : 'text-slate-400'}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 text-center">
        <p className="text-[11px] text-slate-400 font-medium">University Exam Cell</p>
        <p className="text-[10px] text-slate-500">Physical Room & Seat Engine</p>
      </div>
    </aside>
  );
};
