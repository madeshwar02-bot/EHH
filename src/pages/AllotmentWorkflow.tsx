import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Play,
  Lock,
  Unlock,
  Move,
  RefreshCw,
  Check,
  X,
  DoorClosed,
  Users,
  Grid,
  ShieldCheck,
  AlertCircle,
  Eye,
  Info,
} from 'lucide-react';
import {
  Allotment,
  AllocationGroup,
  StudentAllocation,
  Student,
  Room,
  Seat,
  AllotmentRunResult,
} from '../types';

export const AllotmentWorkflowPage: React.FC = () => {
  const [allotment, setAllotment] = useState<Allotment | null>(null);
  const [groups, setGroups] = useState<AllocationGroup[]>([]);
  const [allocations, setAllocations] = useState<StudentAllocation[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);

  const [activeStep, setActiveStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Selected Room for Visual Room Matrix Review
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  // Manual move student modal state
  const [moveModalStudentId, setMoveModalStudentId] = useState<string | null>(null);
  const [targetSeatInput, setTargetSeatInput] = useState('');
  const [moveWarning, setMoveWarning] = useState<string | null>(null);

  const fetchAllotmentData = async () => {
    try {
      const resList = await fetch('/api/allotments');
      const list: Allotment[] = await resList.json();

      if (list.length > 0) {
        const active = list[0];
        const resDetail = await fetch(`/api/allotments/${active.id}`);
        const data = await resDetail.json();

        setAllotment(data.allotment);
        setGroups(data.groups || []);
        setAllocations(data.allocations || []);
        setStudents(data.students || []);
        setRooms(data.rooms || []);
        setSeats(data.seats || []);

        if (data.rooms.length > 0) {
          setSelectedRoomId(data.rooms[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllotmentData();
  }, []);

  const runEngine = async () => {
    if (!allotment) return;
    setGenerating(true);
    try {
      const res = await fetch(`/api/allotments/${allotment.id}/generate`, { method: 'POST' });
      const data: AllotmentRunResult = await res.json();

      setAllotment(data.allotment);
      setGroups(data.groups || []);
      setAllocations(data.allocations || []);
      setActiveStep(5); // Advance to Review Step
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleLock = async (allocationId: string) => {
    if (!allotment) return;
    try {
      const res = await fetch(`/api/allotments/${allotment.id}/toggle-lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allocationId }),
      });
      const data = await res.json();
      if (data.success) {
        setAllocations((prev) =>
          prev.map((a) => (a.id === allocationId ? { ...a, locked: !a.locked } : a))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMoveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allotment || !moveModalStudentId || !targetSeatInput) return;

    // Find seat ID by label or ID
    const targetSeatObj = seats.find(
      (s) => s.seatLabel.toUpperCase() === targetSeatInput.trim().toUpperCase() || s.id === targetSeatInput
    );

    if (!targetSeatObj) {
      alert(`Seat label '${targetSeatInput}' not found.`);
      return;
    }

    try {
      const res = await fetch(`/api/allotments/${allotment.id}/move-student`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: moveModalStudentId, targetSeatId: targetSeatObj.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to move student');
        return;
      }

      if (data.warning) {
        setMoveWarning(data.warning);
      } else {
        setMoveModalStudentId(null);
        setTargetSeatInput('');
        setMoveWarning(null);
        fetchAllotmentData();
      }
    } catch (err: any) {
      alert(err.message || 'Server error');
    }
  };

  const confirmMoveWithWarning = async () => {
    setMoveModalStudentId(null);
    setTargetSeatInput('');
    setMoveWarning(null);
    fetchAllotmentData();
  };

  const handleFinalize = async () => {
    if (!allotment) return;
    if (!confirm('Are you sure you want to finalize this allotment? It will become read-only.')) return;

    try {
      const res = await fetch(`/api/allotments/${allotment.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'FINALIZED' }),
      });
      const data = await res.json();
      setAllotment(data);
      alert('Allotment session successfully FINALIZED!');
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading allotment engine workspace...</div>;
  if (!allotment) return <div className="p-8 text-center text-slate-500">No active allotment session found.</div>;

  const isFinalized = allotment.status === 'FINALIZED';
  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);
  const selectedRoomSeats = seats.filter((s) => s.roomId === selectedRoomId);
  const roomAllocations = allocations.filter((a) => a.roomId === selectedRoomId);

  // Group color map generator for visual matrix
  const groupColors = [
    'bg-indigo-50 border-indigo-200 text-indigo-900',
    'bg-emerald-50 border-emerald-200 text-emerald-900',
    'bg-violet-50 border-violet-200 text-violet-900',
    'bg-amber-50 border-amber-200 text-amber-900',
    'bg-sky-50 border-sky-200 text-sky-900',
    'bg-rose-50 border-rose-200 text-rose-900',
  ];
  const groupColorMap = new Map<string, string>();
  groups.forEach((g, idx) => {
    groupColorMap.set(g.id, groupColors[idx % groupColors.length]);
  });

  const studentsMap = new Map<string, Student>(students.map((s) => [s.id, s]));

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Workflow Stepper Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
        <div className="flex items-center justify-between overflow-x-auto gap-2 pb-1">
          {[
            { num: 1, label: 'Student Data' },
            { num: 2, label: 'Grouping' },
            { num: 3, label: 'Rooms & Capacity' },
            { num: 4, label: 'Generate' },
            { num: 5, label: 'Review & Matrix' },
            { num: 6, label: 'Manual Adjust' },
            { num: 7, label: 'Finalize' },
          ].map((s) => (
            <button
              key={s.num}
              onClick={() => setActiveStep(s.num)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                activeStep === s.num
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${
                activeStep === s.num ? 'bg-white text-indigo-700' : 'bg-slate-200 text-slate-700'
              }`}>
                {s.num}
              </span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* STEP 1: STUDENT DATA */}
      {activeStep === 1 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Step 1: Student Registry Verification</h3>
              <p className="text-xs text-slate-500 mt-0.5">Verify uploaded student records for allotment</p>
            </div>
            <button
              onClick={() => setActiveStep(2)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-500 shadow-md shadow-indigo-600/20"
            >
              Proceed to Grouping →
            </button>
          </div>

          <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-indigo-950">Total Registered Students Available:</p>
              <p className="text-2xl font-extrabold text-indigo-600 mt-0.5">{students.length} Students</p>
            </div>
            <div className="text-right">
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
                ✓ Ready for Engine
              </span>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: GROUPING (CLASS + SUBJECT CODE) */}
      {activeStep === 2 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Step 2: Class + Subject Code Groups</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                CRITICAL RULE: Students are grouped strictly by <strong className="text-indigo-600 font-mono">CLASS + SUBJECT CODE</strong>
              </p>
            </div>
            <button
              onClick={() => setActiveStep(3)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-500 shadow-md shadow-indigo-600/20"
            >
              Proceed to Rooms →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {groups.map((grp) => (
              <div key={grp.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800">{grp.className}</span>
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded text-[11px] font-mono font-bold">
                    {grp.subjectCode}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                  <span className="text-slate-500">Student Count:</span>
                  <span className="font-bold text-slate-900">{grp.studentCount} Students</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 3: ROOMS & CAPACITY */}
      {activeStep === 3 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Step 3: Available Exam Rooms & Seat Capacity</h3>
              <p className="text-xs text-slate-500 mt-0.5">Verify total seat capacity against student group demand</p>
            </div>
            <button
              onClick={() => setActiveStep(4)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-500 shadow-md shadow-indigo-600/20"
            >
              Proceed to Engine Execution →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <p className="text-xs font-bold text-emerald-800">Available Exam Rooms</p>
              <p className="text-2xl font-bold text-emerald-900 mt-1">{rooms.filter((r) => r.status === 'AVAILABLE').length} Rooms</p>
            </div>
            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
              <p className="text-xs font-bold text-indigo-800">Total Seat Capacity</p>
              <p className="text-2xl font-bold text-indigo-900 mt-1">{seats.filter((s) => s.status === 'AVAILABLE').length} Seats</p>
            </div>
            <div className="p-4 bg-violet-50 border border-violet-200 rounded-xl">
              <p className="text-xs font-bold text-violet-800">Student Demand</p>
              <p className="text-2xl font-bold text-violet-900 mt-1">{students.length} Students</p>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: GENERATE ENGINE */}
      {activeStep === 4 && (
        <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-2xs text-center space-y-6 max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
            <Grid className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-800">Execute Group-First Allotment Engine</h3>
            <p className="text-xs text-slate-500 mt-1">
              Groups students by Class + Subject Code, selects contiguous physical seats (`ROOM-COLUMN-ROW-L/R`), and minimizes splitting.
            </p>
          </div>

          <button
            onClick={runEngine}
            disabled={generating || isFinalized}
            className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {generating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Allocating Students to Contiguous Seats...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Run Automatic Allotment Engine
              </>
            )}
          </button>
        </div>
      )}

      {/* STEP 5: REVIEW & VISUAL ROOM MATRIX */}
      {(activeStep === 5 || activeStep === 6 || activeStep === 7) && (
        <div className="space-y-6">
          {/* Summary Metrics */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-4 border-slate-100">
              <div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  allotment.status === 'FINALIZED' ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
                }`}>
                  {allotment.status}
                </span>
                <h3 className="text-lg font-bold text-slate-800 mt-1">{allotment.name}</h3>
              </div>

              {allotment.status !== 'FINALIZED' && (
                <button
                  onClick={handleFinalize}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" /> Finalize Allotment
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3 text-center">
              <div className="p-3 bg-slate-50 border rounded-xl">
                <p className="text-[10px] uppercase font-semibold text-slate-400">Total Students</p>
                <p className="text-base font-bold text-slate-800 mt-0.5">{allotment.studentCount}</p>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <p className="text-[10px] uppercase font-semibold text-emerald-700">Allocated</p>
                <p className="text-base font-bold text-emerald-800 mt-0.5">{allotment.allocatedStudentsCount}</p>
              </div>
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                <p className="text-[10px] uppercase font-semibold text-rose-700">Unallocated</p>
                <p className="text-base font-bold text-rose-800 mt-0.5">{allotment.unallocatedStudentsCount}</p>
              </div>
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                <p className="text-[10px] uppercase font-semibold text-indigo-700">Groups</p>
                <p className="text-base font-bold text-indigo-800 mt-0.5">{groups.length}</p>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-[10px] uppercase font-semibold text-amber-700">Rooms Used</p>
                <p className="text-base font-bold text-amber-800 mt-0.5">{allotment.roomCount}</p>
              </div>
              <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl">
                <p className="text-[10px] uppercase font-semibold text-sky-700">Allocated Seats</p>
                <p className="text-base font-bold text-sky-800 mt-0.5">{allotment.allocatedStudentsCount}</p>
              </div>
              <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl">
                <p className="text-[10px] uppercase font-semibold text-slate-600">Empty Seats</p>
                <p className="text-base font-bold text-slate-800 mt-0.5">{allotment.emptySeatsCount}</p>
              </div>
              <div className="p-3 bg-violet-50 border border-violet-200 rounded-xl">
                <p className="text-[10px] uppercase font-semibold text-violet-700">Groups Split</p>
                <p className="text-base font-bold text-violet-800 mt-0.5">{allotment.splitGroupsCount}</p>
              </div>
            </div>
          </div>

          {/* Visual Room Matrix Interactive Drawer */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden space-y-4 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 border-slate-100">
              <div className="flex items-center gap-2">
                <DoorClosed className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-800 text-sm">Visual Room & Physical Seat Allocation Matrix</h3>
              </div>

              {/* Room Select Dropdown */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-600">Select Room View:</label>
                <select
                  value={selectedRoomId || ''}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-indigo-700"
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      Room {r.roomNumber} (Floor {r.floor})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedRoom && (
              <div className="bg-slate-100/60 p-6 rounded-xl border border-slate-200/80 space-y-6">
                {/* Board */}
                <div className="w-1/2 mx-auto py-2 bg-slate-800 text-white text-center text-xs font-bold tracking-widest uppercase rounded-lg shadow-xs">
                  BLACKBOARD / FRONT STAGE
                </div>

                {/* Columns Matrix */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {Array.from({ length: selectedRoom.columns }).map((_, colIdx) => {
                    const colLetter = String.fromCharCode(65 + colIdx); // A, B, C...
                    return (
                      <div key={colLetter} className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                        <div className="text-center font-bold text-xs text-indigo-800 bg-indigo-50 py-1 rounded-md border border-indigo-100">
                          COLUMN {colLetter}
                        </div>

                        <div className="space-y-2">
                          {Array.from({ length: selectedRoom.rows }).map((_, rIdx) => {
                            const rowNum = rIdx + 1;
                            const seatL = selectedRoomSeats.find((s) => s.column === colLetter && s.row === rowNum && s.side === 'L');
                            const seatR = selectedRoomSeats.find((s) => s.column === colLetter && s.row === rowNum && s.side === 'R');

                            const allocL = seatL ? roomAllocations.find((a) => a.seatId === seatL.id) : null;
                            const allocR = seatR ? roomAllocations.find((a) => a.seatId === seatR.id) : null;

                            const stdL = allocL ? studentsMap.get(allocL.studentId) : null;
                            const stdR = allocR ? studentsMap.get(allocR.studentId) : null;

                            return (
                              <div key={rowNum} className="grid grid-cols-2 gap-1.5 bg-slate-50 p-1.5 rounded-lg border border-slate-200/60">
                                {/* Left Seat */}
                                <div
                                  className={`p-2 rounded border text-left flex flex-col justify-between transition-all ${
                                    allocL
                                      ? `${groupColorMap.get(allocL.groupId) || 'bg-indigo-50 border-indigo-200'} shadow-2xs`
                                      : 'bg-white border-slate-200 text-slate-400'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-mono font-bold">{seatL?.seatLabel || `${colLetter}-${rowNum}-L`}</span>
                                    {allocL && (
                                      <button
                                        onClick={() => handleToggleLock(allocL.id)}
                                        className="text-slate-400 hover:text-indigo-600"
                                        title={allocL.locked ? 'Locked' : 'Unlocked'}
                                      >
                                        {allocL.locked ? <Lock className="w-3 h-3 text-amber-600" /> : <Unlock className="w-3 h-3 text-slate-300" />}
                                      </button>
                                    )}
                                  </div>

                                  {stdL ? (
                                    <div className="mt-1">
                                      <p className="text-[11px] font-mono font-bold leading-tight">{stdL.registerNumber}</p>
                                      <p className="text-[10px] font-medium truncate" title={stdL.name}>{stdL.name}</p>
                                      <div className="flex items-center gap-1 mt-0.5">
                                        <span className="text-[9px] font-bold px-1 rounded bg-white/80 border">{stdL.classId}</span>
                                        <span className="text-[9px] font-mono font-bold">{stdL.subjectCode}</span>
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-[10px] text-slate-400 font-medium italic mt-2">EMPTY</p>
                                  )}
                                </div>

                                {/* Right Seat */}
                                <div
                                  className={`p-2 rounded border text-left flex flex-col justify-between transition-all ${
                                    allocR
                                      ? `${groupColorMap.get(allocR.groupId) || 'bg-indigo-50 border-indigo-200'} shadow-2xs`
                                      : 'bg-white border-slate-200 text-slate-400'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-mono font-bold">{seatR?.seatLabel || `${colLetter}-${rowNum}-R`}</span>
                                    {allocR && (
                                      <button
                                        onClick={() => handleToggleLock(allocR.id)}
                                        className="text-slate-400 hover:text-indigo-600"
                                        title={allocR.locked ? 'Locked' : 'Unlocked'}
                                      >
                                        {allocR.locked ? <Lock className="w-3 h-3 text-amber-600" /> : <Unlock className="w-3 h-3 text-slate-300" />}
                                      </button>
                                    )}
                                  </div>

                                  {stdR ? (
                                    <div className="mt-1">
                                      <p className="text-[11px] font-mono font-bold leading-tight">{stdR.registerNumber}</p>
                                      <p className="text-[10px] font-medium truncate" title={stdR.name}>{stdR.name}</p>
                                      <div className="flex items-center gap-1 mt-0.5">
                                        <span className="text-[9px] font-bold px-1 rounded bg-white/80 border">{stdR.classId}</span>
                                        <span className="text-[9px] font-mono font-bold">{stdR.subjectCode}</span>
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-[10px] text-slate-400 font-medium italic mt-2">EMPTY</p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manual Move Warning Modal */}
      {moveWarning && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-amber-200 space-y-4">
            <div className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-slate-800 text-sm">Adjacency Warning</h3>
            </div>
            <p className="text-xs text-slate-600">{moveWarning}</p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setMoveWarning(null)}
                className="px-4 py-2 border border-slate-200 text-xs font-semibold rounded-lg text-slate-600"
              >
                Cancel Move
              </button>
              <button
                onClick={confirmMoveWithWarning}
                className="px-4 py-2 bg-amber-600 text-white text-xs font-semibold rounded-lg shadow-md hover:bg-amber-500"
              >
                Confirm Move Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
