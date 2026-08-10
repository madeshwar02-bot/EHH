import React, { useState } from 'react';
import { Search, User, DoorClosed, Grid, ArrowRight } from 'lucide-react';

export const SearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-800">Global Seat & Student Allocation Search</h2>
        <p className="text-xs text-slate-500">
          Instantly lookup student seat allocations by Register Number, Name, Class, Subject, Room, or Seat Label
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search e.g. '24CS001', 'Arun', 'IB002', 'IB002-A-1-L'..."
            className="w-full bg-white border border-slate-200 pl-9 pr-3 py-2.5 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 font-medium shadow-2xs"
          />
        </div>
        <button
          type="submit"
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-all"
        >
          Search Seat
        </button>
      </form>

      {loading && <div className="p-8 text-center text-slate-500">Searching seat registry...</div>}

      {!loading && results.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-bold text-slate-600">Search Results ({results.length}):</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {results.map((res, i) => (
              <div key={i} className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-2">
                <div className="flex items-center justify-between border-b pb-2 border-slate-100">
                  <span className="font-mono font-bold text-xs text-indigo-600">{res.registerNumber}</span>
                  <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 font-mono font-bold text-[10px] rounded">
                    {res.subjectCode}
                  </span>
                </div>

                <div>
                  <p className="text-xs font-bold text-slate-800">{res.studentName}</p>
                  <p className="text-[11px] text-slate-500">Class: {res.className}</p>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Allocated Room & Seat</p>
                    <p className="text-xs font-bold text-slate-800">
                      Room {res.roomNumber} (Floor {res.floor})
                    </p>
                  </div>
                  <span className="px-2.5 py-1 bg-indigo-600 text-white font-mono font-extrabold text-xs rounded shadow-2xs">
                    {res.seatLabel}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
