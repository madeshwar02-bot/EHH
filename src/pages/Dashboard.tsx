import React from 'react';
import {
  Users,
  GraduationCap,
  Building2,
  DoorClosed,
  Grid,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Upload,
  Plus,
  FileSpreadsheet,
} from 'lucide-react';

interface DashboardProps {
  stats: any;
  onNavigate: (tab: string) => void;
  onRunAllocation: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ stats, onNavigate, onRunAllocation }) => {
  if (!stats) return <div className="p-8 text-center text-slate-500">Loading dashboard metrics...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 auto-rows-[minmax(140px,auto)]">
        
        {/* HERO BANNER - 8 cols, 2 rows */}
        <div className="md:col-span-8 md:row-span-2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-[32px] p-8 text-white shadow-lg flex flex-col justify-between border border-slate-700 relative overflow-hidden group">
          <div className="absolute -right-12 -top-12 w-64 h-64 bg-slate-500/10 rounded-full blur-3xl group-hover:bg-slate-500/20 transition-all duration-700"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {stats.activeAllotment?.status || 'ACTIVE SESSION'}
              </span>
              <span className="text-xs font-medium text-slate-400 font-sans">
                {new Date(stats.activeAllotment?.createdAt || Date.now()).toLocaleDateString()}
              </span>
            </div>
            <h3 className="text-4xl font-serif font-light tracking-tight text-white mb-2">
              {stats.activeAllotment?.name || 'Fall Exam Room & Seat Allocation'}
            </h3>
            <p className="text-sm text-slate-300 max-w-lg leading-relaxed font-sans">
              Group-first physical seat engine active for {stats.totalStudents} students across {stats.availableRooms} available rooms. Manage your allocations and exports efficiently.
            </p>
          </div>

          <div className="relative z-10 mt-8 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('allotments')}
              className="px-6 py-3 bg-white hover:bg-slate-50 text-slate-900 rounded-full text-sm font-semibold shadow-md transition-all flex items-center gap-2 font-sans"
            >
              Launch Workflow <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('reports')}
              className="px-6 py-3 bg-slate-800/50 hover:bg-slate-700 text-white border border-slate-600 rounded-full text-sm font-semibold transition-all flex items-center gap-2 backdrop-blur-md font-sans"
            >
              <FileSpreadsheet className="w-4 h-4" /> Export Reports
            </button>
          </div>
        </div>

        {/* QUICK ACTIONS - 4 cols, 2 rows */}
        <div className="md:col-span-4 md:row-span-2 bg-white rounded-[32px] p-6 border border-slate-200 shadow-sm flex flex-col">
          <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 font-sans">
            <Plus className="w-4 h-4 text-slate-600" /> Quick Actions
          </h4>
          <div className="grid grid-cols-2 gap-3 flex-1 font-sans">
            <button
              onClick={() => onNavigate('students')}
              className="bg-slate-50/50 hover:bg-slate-100 border border-slate-100 hover:border-slate-200 rounded-2xl p-4 text-left transition-all group flex flex-col justify-between"
            >
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm mb-3 group-hover:scale-110 transition-transform">
                <Upload className="w-4 h-4 text-slate-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Students</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Upload records</p>
              </div>
            </button>
            <button
              onClick={() => onNavigate('allotments')}
              className="bg-emerald-50/50 hover:bg-emerald-100 border border-emerald-100 hover:border-emerald-200 rounded-2xl p-4 text-left transition-all group flex flex-col justify-between"
            >
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm mb-3 group-hover:scale-110 transition-transform">
                <Grid className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Allocate</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Run engine</p>
              </div>
            </button>
            <button
              onClick={() => onNavigate('rooms')}
              className="bg-amber-50/50 hover:bg-amber-100 border border-amber-100 hover:border-amber-200 rounded-2xl p-4 text-left transition-all group flex flex-col justify-between"
            >
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm mb-3 group-hover:scale-110 transition-transform">
                <DoorClosed className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Rooms</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Edit matrix</p>
              </div>
            </button>
            <button
              onClick={() => onNavigate('reports')}
              className="bg-blue-50/50 hover:bg-blue-100 border border-blue-100 hover:border-blue-200 rounded-2xl p-4 text-left transition-all group flex flex-col justify-between"
            >
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm mb-3 group-hover:scale-110 transition-transform">
                <FileSpreadsheet className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Reports</p>
                <p className="text-[10px] text-slate-500 mt-0.5">View & Export</p>
              </div>
            </button>
          </div>
        </div>

        {/* STUDENTS OVERVIEW - 4 cols, 2 rows */}
        <div className="md:col-span-4 md:row-span-2 bg-white rounded-[32px] p-6 border border-slate-200 shadow-sm flex flex-col justify-between font-sans">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-slate-600" />
            </div>
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Student Registry</h4>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-serif font-light text-slate-900">{stats.totalStudents.toLocaleString()}</span>
              <span className="text-xs font-medium text-slate-400">Total</span>
            </div>
          </div>
          
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-600 flex items-center gap-2"><div className="w-2 h-2 rounded-sm bg-emerald-500"></div> Allocated</span>
              <span className="font-bold text-slate-900">{stats.allocatedSeats.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-600 flex items-center gap-2"><div className="w-2 h-2 rounded-sm border border-slate-300"></div> Pending</span>
              <span className="font-bold text-slate-900">{(stats.totalStudents - stats.allocatedSeats).toLocaleString()}</span>
            </div>
            
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-2 flex">
              <div className="h-full bg-emerald-500" style={{ width: `${stats.totalStudents > 0 ? (stats.allocatedSeats / stats.totalStudents) * 100 : 0}%` }}></div>
            </div>
          </div>
        </div>

        {/* SEATS CAPACITY - 4 cols, 2 rows */}
        <div className="md:col-span-4 md:row-span-2 bg-white rounded-[32px] p-6 border border-slate-200 shadow-sm flex flex-col justify-between font-sans">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
              <Grid className="w-6 h-6 text-amber-600" />
            </div>
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Seat Capacity</h4>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-serif font-light text-slate-900">{stats.totalSeats.toLocaleString()}</span>
              <span className="text-xs font-medium text-slate-400">Seats</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col justify-center items-center text-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Available</span>
              <span className="text-2xl font-bold text-slate-800">{stats.availableSeats.toLocaleString()}</span>
            </div>
            <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 flex flex-col justify-center items-center text-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 mb-1">Utilized</span>
              <span className="text-2xl font-bold text-emerald-900">{stats.allocatedSeats.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* INFRASTRUCTURE - 4 cols, 2 rows */}
        <div className="md:col-span-4 md:row-span-2 bg-[#E9E9E0] rounded-[32px] p-6 border border-slate-200 shadow-sm flex flex-col justify-between font-sans">
          <h4 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-4">Infrastructure</h4>
          <div className="grid grid-rows-3 h-full gap-2">
            <div className="flex items-center justify-between bg-white/60 p-4 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                  <DoorClosed className="w-4 h-4 text-slate-700" />
                </div>
                <span className="text-sm font-bold text-slate-800">Exam Rooms</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-slate-900">{stats.totalRooms}</span>
              </div>
            </div>

            <div className="flex items-center justify-between bg-white/60 p-4 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-slate-700" />
                </div>
                <span className="text-sm font-bold text-slate-800">Class Sections</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-slate-900">{stats.totalClasses}</span>
              </div>
            </div>

            <div className="flex items-center justify-between bg-white/60 p-4 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                  <GraduationCap className="w-4 h-4 text-slate-700" />
                </div>
                <span className="text-sm font-bold text-slate-800">Programs</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-slate-900">{stats.totalPrograms}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
