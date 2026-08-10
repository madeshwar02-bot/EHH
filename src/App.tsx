import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { StudentsPage } from './pages/Students';
import { ProgramsPage } from './pages/Programs';
import { ClassesPage } from './pages/Classes';
import { RoomsPage } from './pages/Rooms';
import { AllotmentWorkflowPage } from './pages/AllotmentWorkflow';
import { ReportsPage } from './pages/Reports';
import { HistoryPage } from './pages/History';
import { SearchPage } from './pages/SearchPage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<any>(null);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/dashboard/stats');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [activeTab]);

  const handleGlobalSearch = (query: string) => {
    setActiveTab('search');
  };

  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'dashboard': return 'Dashboard';
      case 'students': return 'Student Register';
      case 'programs': return 'Programs';
      case 'classes': return 'Classes & Sections';
      case 'rooms': return 'Rooms & Seats Configuration';
      case 'allotments': return 'Allotment Engine Workflow';
      case 'reports': return 'Reports & Exports';
      case 'history': return 'Allotment History';
      case 'search': return 'Global Search';
      case 'settings': return 'System Settings';
      default: return 'Exam Hall Allotment System';
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans text-slate-800 antialiased selection:bg-indigo-500 selection:text-white">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeAllotmentName={stats?.activeAllotment?.name}
      />

      {/* Main Content Shell */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header onSearchSubmit={handleGlobalSearch} activeTabTitle={getTabTitle(activeTab)} />

        <main className="flex-1 overflow-y-auto pb-12">
          {activeTab === 'dashboard' && (
            <Dashboard stats={stats} onNavigate={setActiveTab} onRunAllocation={() => setActiveTab('allotments')} />
          )}
          {activeTab === 'students' && <StudentsPage />}
          {activeTab === 'programs' && <ProgramsPage />}
          {activeTab === 'classes' && <ClassesPage />}
          {activeTab === 'rooms' && <RoomsPage />}
          {activeTab === 'allotments' && <AllotmentWorkflowPage />}
          {activeTab === 'reports' && <ReportsPage />}
          {activeTab === 'history' && <HistoryPage />}
          {activeTab === 'search' && <SearchPage />}
          {activeTab === 'settings' && <SettingsPage />}
        </main>
      </div>
    </div>
  );
};

export default App;
