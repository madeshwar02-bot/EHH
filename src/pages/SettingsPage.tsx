import React, { useState } from 'react';
import { RotateCcw, Database, ShieldCheck } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset the database to initial seed data?')) return;
    setResetting(true);
    try {
      await fetch('/api/settings/reset-db', { method: 'POST' });
      alert('Database successfully reset to initial university seed state.');
      window.location.reload();
    } catch (err) {
      console.error(err);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-800">System & Database Settings</h2>
        <p className="text-xs text-slate-500">Configure room layout constraints, seed data, and administrative settings</p>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <Database className="w-4 h-4 text-indigo-600" /> Database Management
        </h3>
        <p className="text-xs text-slate-600">Reset database state back to standard 72 rooms (6 floors × 12 rooms) and sample student registry.</p>

        <button
          onClick={handleReset}
          disabled={resetting}
          className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset Database to Initial Seed
        </button>
      </div>
    </div>
  );
};
