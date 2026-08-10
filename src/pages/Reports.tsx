import React, { useState, useEffect } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Printer,
  Download,
  CheckCircle,
  Building,
  DoorClosed,
  Layers,
  GraduationCap,
  BookOpen,
  Grid,
} from 'lucide-react';
import { exportToExcel, exportToCSV, exportToPDF } from '../lib/excelPdf';

export const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'complete' | 'roomWise' | 'floorWise' | 'classWise' | 'subjectWise' | 'matrix'
  >('complete');

  const [allotment, setAllotment] = useState<any>(null);
  const [reportData, setReportData] = useState<any[]>([]);
  const [roomWiseData, setRoomWiseData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const resList = await fetch('/api/allotments');
        const list = await resList.json();
        if (list.length > 0) {
          const active = list[0];
          setAllotment(active);

          const [resComp, resRoom] = await Promise.all([
            fetch(`/api/reports/${active.id}/complete`),
            fetch(`/api/reports/${active.id}/room-wise`),
          ]);

          const dataComp = await resComp.json();
          const dataRoom = await resRoom.json();

          setReportData(dataComp.reportData || []);
          setRoomWiseData(dataRoom || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const handleExportPDF = () => {
    const headers = ['Register No', 'Student Name', 'Program', 'Class', 'Subject', 'Floor', 'Room', 'Seat'];
    const rows = reportData.map((d) => [
      d.registerNumber,
      d.studentName,
      d.program,
      d.class,
      d.subjectCode,
      `Floor ${d.floor}`,
      d.roomNumber,
      d.seatLabel,
    ]);
    exportToPDF('EXAM HALL ALLOTMENT MASTER REPORT', headers, rows, 'Exam_Hall_Allotment_Report');
  };

  const handleExportExcel = () => {
    exportToExcel('Exam_Hall_Allotment_Report', 'Allotment', reportData);
  };

  const handleExportCSV = () => {
    exportToCSV('Exam_Hall_Allotment_Report', reportData);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading reports workspace...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 print:p-0 print:m-0">
      {/* Header & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Exam Hall Allotment Reports</h2>
          <p className="text-xs text-slate-500">Generate, view, and export official room and physical seat allotment reports</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPDF}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-md transition-all flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> PDF Export
          </button>
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Excel Export
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" /> CSV
          </button>
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" /> Print
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl p-1.5 border border-slate-200/80 shadow-2xs flex overflow-x-auto gap-1 print:hidden">
        {[
          { id: 'complete', label: 'Complete Allotment', icon: FileText },
          { id: 'roomWise', label: 'Room-wise Allotment', icon: DoorClosed },
          { id: 'floorWise', label: 'Floor-wise Summary', icon: Layers },
          { id: 'classWise', label: 'Class-wise Allotment', icon: GraduationCap },
          { id: 'subjectWise', label: 'Subject-wise Allotment', icon: BookOpen },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 shrink-0 transition-all ${
                isActive ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Report Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden print:border-none print:shadow-none">
        <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">
              {activeTab === 'complete' && 'Master Complete Room & Seat Allotment Report'}
              {activeTab === 'roomWise' && 'Room-wise Student Allocation Report'}
              {activeTab === 'floorWise' && 'Floor-wise Exam Room Allocation Summary'}
              {activeTab === 'classWise' && 'Class Section Allocation Report'}
              {activeTab === 'subjectWise' && 'Subject-wise Seat Allotment Report'}
            </h3>
            <p className="text-[11px] text-slate-500">Session: {allotment?.name}</p>
          </div>
          <span className="text-xs font-bold font-mono text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            {reportData.length} Total Allocations
          </span>
        </div>

        {activeTab === 'complete' && (
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-3.5">Register Number</th>
                <th className="px-6 py-3.5">Student Name</th>
                <th className="px-6 py-3.5">Program</th>
                <th className="px-6 py-3.5">Class</th>
                <th className="px-6 py-3.5">Subject</th>
                <th className="px-6 py-3.5">Floor</th>
                <th className="px-6 py-3.5">Room</th>
                <th className="px-6 py-3.5">Seat Label</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reportData.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-3.5 font-mono font-bold text-indigo-600">{row.registerNumber}</td>
                  <td className="px-6 py-3.5 font-medium text-slate-800">{row.studentName}</td>
                  <td className="px-6 py-3.5 font-semibold text-slate-600">{row.program}</td>
                  <td className="px-6 py-3.5 font-bold text-slate-700">{row.class}</td>
                  <td className="px-6 py-3.5">
                    <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded font-mono font-bold text-[11px]">
                      {row.subjectCode}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 font-medium text-slate-600">Floor {row.floor}</td>
                  <td className="px-6 py-3.5 font-mono font-bold text-slate-900">{row.roomNumber}</td>
                  <td className="px-6 py-3.5 font-mono font-extrabold text-indigo-700 bg-indigo-50/60 rounded">{row.seatLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'roomWise' && (
          <div className="p-6 space-y-6">
            {roomWiseData.map((r) => (
              <div key={r.roomNumber} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                <div className="p-3 bg-slate-800 text-white flex items-center justify-between font-bold text-xs">
                  <span>
                    ROOM: <span className="font-mono text-indigo-300 font-extrabold">{r.roomNumber}</span> (FLOOR {r.floor})
                  </span>
                  <span>
                    ALLOCATED: {r.allocatedCount} / {r.capacity} SEATS
                  </span>
                </div>
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b">
                    <tr>
                      <th className="p-2.5 pl-4">Seat</th>
                      <th className="p-2.5">Register No</th>
                      <th className="p-2.5">Student Name</th>
                      <th className="p-2.5">Class</th>
                      <th className="p-2.5">Subject</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {r.students.map((st: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2.5 pl-4 font-mono font-bold text-indigo-600">{st.seatLabel}</td>
                        <td className="p-2.5 font-mono font-semibold">{st.registerNumber}</td>
                        <td className="p-2.5 font-medium">{st.studentName}</td>
                        <td className="p-2.5 font-bold">{st.className}</td>
                        <td className="p-2.5 font-mono text-indigo-700">{st.subjectCode}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
