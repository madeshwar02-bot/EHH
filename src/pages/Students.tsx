import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Trash2,
  Plus,
  X,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { Student, StudentImportSummary } from '../types';
import { downloadSampleStudentTemplate } from '../lib/excelPdf';

export const StudentsPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  // Upload validation drawer/summary
  const [uploadSummary, setUploadSummary] = useState<StudentImportSummary | null>(null);
  const [rawParsedRows, setRawParsedRows] = useState<any[]>([]);
  const [isParsing, setIsParsing] = useState(false);

  const fetchStudents = async () => {
    try {
      let url = '/api/students?';
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (selectedProgram) url += `programId=${encodeURIComponent(selectedProgram)}&`;
      if (selectedClass) url += `classId=${encodeURIComponent(selectedClass)}&`;
      if (selectedSubject) url += `subjectCode=${encodeURIComponent(selectedSubject)}&`;

      const res = await fetch(url);
      const data = await res.json();
      setStudents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [search, selectedProgram, selectedClass, selectedSubject]);

  // Handle Excel / CSV File Drop
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet);

        setRawParsedRows(rows);

        // Validate preview with backend
        const res = await fetch('/api/students/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rawRows: rows, commit: false }),
        });

        const data = await res.json();
        setUploadSummary(data.summary);
      } catch (err) {
        console.error('Failed to parse file:', err);
      } finally {
        setIsParsing(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  // Confirm Import Commit
  const confirmImport = async () => {
    if (!rawParsedRows.length) return;
    try {
      const res = await fetch('/api/students/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawRows: rawParsedRows, commit: true }),
      });
      const data = await res.json();
      setUploadSummary(null);
      setRawParsedRows([]);
      fetchStudents();
      alert(`Import complete! ${data.importedCount} valid student records imported into database.`);
    } catch (err) {
      console.error(err);
    }
  };

  const clearAllStudents = async () => {
    if (!confirm('Are you sure you want to clear ALL student records?')) return;
    try {
      await fetch('/api/students/clear-all', { method: 'DELETE' });
      fetchStudents();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Student Register Management</h2>
          <p className="text-xs text-slate-500">Upload Excel/CSV student master data, validate, and group by Class + Subject Code</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={downloadSampleStudentTemplate}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 border border-slate-200"
          >
            <Download className="w-3.5 h-3.5" /> Sample Template
          </button>

          <label className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/20 cursor-pointer transition-all flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5" /> Upload Excel / CSV
            <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} className="hidden" />
          </label>

          {students.length > 0 && (
            <button
              onClick={clearAllStudents}
              className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-all flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear All
            </button>
          )}
        </div>
      </div>

      {/* Upload Validation Summary Drawer */}
      {uploadSummary && (
        <div className="bg-white border-2 border-indigo-200 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b pb-3 border-slate-100">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-slate-800 text-sm">Upload File Validation Summary</h3>
            </div>
            <button onClick={() => setUploadSummary(null)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Metrics breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <p className="text-[10px] uppercase font-bold text-slate-400">Total Records</p>
              <p className="text-lg font-bold text-slate-800 mt-0.5">{uploadSummary.totalRecords}</p>
            </div>
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <p className="text-[10px] uppercase font-bold text-emerald-700">Valid Records</p>
              <p className="text-lg font-bold text-emerald-800 mt-0.5">{uploadSummary.validRecords}</p>
            </div>
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
              <p className="text-[10px] uppercase font-bold text-rose-700">Errors</p>
              <p className="text-lg font-bold text-rose-800 mt-0.5">{uploadSummary.invalidRecords}</p>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-[10px] uppercase font-bold text-amber-700">Duplicates</p>
              <p className="text-lg font-bold text-amber-800 mt-0.5">{uploadSummary.duplicates}</p>
            </div>
            <div className="p-3 bg-violet-50 border border-violet-200 rounded-xl">
              <p className="text-[10px] uppercase font-bold text-violet-700">Missing Fields</p>
              <p className="text-lg font-bold text-violet-800 mt-0.5">{uploadSummary.missingFields}</p>
            </div>
          </div>

          {/* Row level errors table */}
          {uploadSummary.errors.length > 0 && (
            <div className="max-h-40 overflow-y-auto border border-rose-100 rounded-xl bg-rose-50/40 p-3 space-y-1.5 text-xs">
              <p className="font-bold text-rose-800 text-[11px] mb-1">Row-Level Error Details:</p>
              {uploadSummary.errors.slice(0, 10).map((err, i) => (
                <div key={i} className="flex items-center gap-2 text-rose-900 bg-white p-2 rounded-lg border border-rose-200/60">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span className="font-bold font-mono text-[10px]">Row {err.row}:</span>
                  <span className="font-semibold">{err.field}</span> - {err.message} ({err.registerNumber || 'No Reg'})
                </div>
              ))}
              {uploadSummary.errors.length > 10 && (
                <p className="text-[10px] text-rose-600 italic">...and {uploadSummary.errors.length - 10} more errors.</p>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-slate-500">
              Only valid records ({uploadSummary.validRecords}) will be saved to the student register database.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setUploadSummary(null)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmImport}
                disabled={uploadSummary.validRecords === 0}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-emerald-600/20 disabled:opacity-50"
              >
                Import {uploadSummary.validRecords} Valid Records
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student name, reg no, subject..."
            className="w-full bg-slate-50 border border-slate-200 pl-9 pr-3 py-2 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700"
        >
          <option value="">All Subjects</option>
          <option value="CS501">CS501</option>
          <option value="EC501">EC501</option>
          <option value="EE501">EE501</option>
          <option value="IT501">IT501</option>
          <option value="AD301">AD301</option>
        </select>
      </div>

      {/* Students Table */}
      {loading ? (
        <div className="p-8 text-center text-slate-500">Loading student registry...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <span className="text-xs font-bold text-slate-700">Total Registered Students: {students.length}</span>
          </div>

          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-3.5">Register Number</th>
                <th className="px-6 py-3.5">Student Name</th>
                <th className="px-6 py-3.5">Class Section</th>
                <th className="px-6 py-3.5">Year</th>
                <th className="px-6 py-3.5">Subject Code</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((std) => (
                <tr key={std.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-3.5 font-mono font-bold text-indigo-600">{std.registerNumber}</td>
                  <td className="px-6 py-3.5 font-medium text-slate-800">{std.name}</td>
                  <td className="px-6 py-3.5 font-semibold text-slate-700">{std.classId}</td>
                  <td className="px-6 py-3.5 text-slate-600">Year {std.year}</td>
                  <td className="px-6 py-3.5">
                    <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-md font-mono font-bold text-[11px]">
                      {std.subjectCode}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <button
                      onClick={async () => {
                        await fetch(`/api/students/${std.id}`, { method: 'DELETE' });
                        fetchStudents();
                      }}
                      className="p-1.5 hover:bg-rose-50 rounded-md text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
