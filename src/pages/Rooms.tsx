import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, DoorClosed, Grid, Eye, CheckCircle2 } from 'lucide-react';
import { Room, Seat } from '../types';

export const RoomsPage: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  // Room View Drawer state
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [roomSeats, setRoomSeats] = useState<Seat[]>([]);

  const [formRoomNumber, setFormRoomNumber] = useState('');
  const [formBuilding, setFormBuilding] = useState('Instruction Block');
  const [formFloor, setFormFloor] = useState(1);
  const [formColumns, setFormColumns] = useState(4);
  const [formRows, setFormRows] = useState(5);
  const [formStatus, setFormStatus] = useState<'AVAILABLE' | 'UNAVAILABLE'>('AVAILABLE');
  const [error, setError] = useState<string | null>(null);

  const fetchRooms = async () => {
    try {
      const res = await fetch('/api/rooms');
      const data = await res.json();
      setRooms(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const openAddModal = () => {
    setEditingRoom(null);
    setFormRoomNumber('');
    setFormBuilding('Instruction Block');
    setFormFloor(1);
    setFormColumns(4);
    setFormRows(5);
    setFormStatus('AVAILABLE');
    setError(null);
    setShowModal(true);
  };

  const openEditModal = (room: Room) => {
    setEditingRoom(room);
    setFormRoomNumber(room.roomNumber);
    setFormBuilding(room.building);
    setFormFloor(room.floor);
    setFormColumns(room.columns);
    setFormRows(room.rows);
    setFormStatus(room.status);
    setError(null);
    setShowModal(true);
  };

  const openRoomSeatsView = async (room: Room) => {
    setSelectedRoom(room);
    try {
      const res = await fetch(`/api/rooms/${room.id}`);
      const data = await res.json();
      setRoomSeats(data.seats || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const url = editingRoom ? `/api/rooms/${editingRoom.id}` : '/api/rooms';
      const method = editingRoom ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomNumber: formRoomNumber,
          building: formBuilding,
          floor: formFloor,
          columns: formColumns,
          rows: formRows,
          status: formStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to save room');
        return;
      }

      setShowModal(false);
      fetchRooms();
    } catch (err: any) {
      setError(err.message || 'Server error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this room and its seats?')) return;
    try {
      await fetch(`/api/rooms/${id}`, { method: 'DELETE' });
      fetchRooms();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleStatus = async (room: Room) => {
    const nextStatus = room.status === 'AVAILABLE' ? 'UNAVAILABLE' : 'AVAILABLE';
    try {
      await fetch(`/api/rooms/${room.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      fetchRooms();
    } catch (err) {
      console.error(err);
    }
  };

  // Generate preview seat labels for modal
  const colLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].slice(0, formColumns);
  const previewSeats: string[] = [];
  const previewRoomNum = formRoomNumber || 'IB001';
  colLabels.forEach((col) => {
    for (let r = 1; r <= Math.min(formRows, 2); r++) {
      previewSeats.push(`${previewRoomNum}-${col}-${r}-L`);
      previewSeats.push(`${previewRoomNum}-${col}-${r}-R`);
    }
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Examination Rooms & Physical Seats</h2>
          <p className="text-xs text-slate-500">Configure university exam rooms and automatically generate seat layouts (ROOM-COLUMN-ROW-L/R)</p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add Room & Generate Seats
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500">Loading exam rooms...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-3.5">Room No</th>
                <th className="px-6 py-3.5">Building</th>
                <th className="px-6 py-3.5">Floor</th>
                <th className="px-6 py-3.5">Grid (Cols × Rows)</th>
                <th className="px-6 py-3.5">Total Capacity</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rooms.map((room) => (
                <tr key={room.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-slate-900">{room.roomNumber}</td>
                  <td className="px-6 py-4 font-medium text-slate-700">{room.building}</td>
                  <td className="px-6 py-4 font-medium text-slate-600">Floor {room.floor}</td>
                  <td className="px-6 py-4 font-mono text-slate-600">
                    {room.columns} Cols × {room.rows} Rows
                  </td>
                  <td className="px-6 py-4 font-bold text-indigo-600">{room.capacity} Seats</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleStatus(room)}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                        room.status === 'AVAILABLE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                          : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                      }`}
                    >
                      {room.status}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => openRoomSeatsView(room)}
                      className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md font-medium text-xs inline-flex items-center gap-1 transition-colors"
                      title="View Seat Matrix"
                    >
                      <Eye className="w-3.5 h-3.5" /> View Matrix
                    </button>
                    <button
                      onClick={() => openEditModal(room)}
                      className="p-1.5 hover:bg-slate-100 rounded-md text-slate-600 hover:text-indigo-600 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(room.id)}
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

      {/* Add / Configure Room Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm">
                {editingRoom ? 'Edit Room Configuration' : 'Configure New Room & Seats'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Room Number (e.g. IB002)</label>
                  <input
                    type="text"
                    required
                    value={formRoomNumber}
                    onChange={(e) => setFormRoomNumber(e.target.value.toUpperCase())}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-mono font-bold"
                    placeholder="IB002"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Building</label>
                  <input
                    type="text"
                    required
                    value={formBuilding}
                    onChange={(e) => setFormBuilding(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs"
                    placeholder="Instruction Block"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Floor Number</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={formFloor}
                    onChange={(e) => setFormFloor(parseInt(e.target.value, 10))}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Columns</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    required
                    value={formColumns}
                    onChange={(e) => setFormColumns(parseInt(e.target.value, 10))}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Rows per Col</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    required
                    value={formRows}
                    onChange={(e) => setFormRows(parseInt(e.target.value, 10))}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-800">Total Calculated Capacity:</p>
                  <p className="text-sm font-bold text-indigo-600 font-mono">{formColumns * formRows * 2} Seats</p>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Format: ROOM-COLUMN-ROW-L/R (e.g. {previewRoomNum}-A-1-L, {previewRoomNum}-A-1-R)
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {previewSeats.slice(0, 6).map((lbl) => (
                    <span key={lbl} className="px-1.5 py-0.5 bg-white border border-slate-200 rounded-md font-mono text-[10px] text-slate-700">
                      {lbl}
                    </span>
                  ))}
                  {previewSeats.length > 6 && <span className="text-[10px] text-slate-400 font-mono self-center">... +more</span>}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-500 shadow-md shadow-indigo-600/20"
                >
                  Save & Generate Seats
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Interactive Room Matrix Drawer/Modal */}
      {selectedRoom && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <DoorClosed className="w-4 h-4 text-indigo-600" />
                  Room Seat Layout: <span className="font-mono text-indigo-600 font-extrabold">{selectedRoom.roomNumber}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Floor {selectedRoom.floor} • Capacity: {selectedRoom.capacity} Seats ({selectedRoom.columns} Columns × {selectedRoom.rows} Rows)
                </p>
              </div>
              <button onClick={() => setSelectedRoom(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-100/50">
              {/* Board Indicator */}
              <div className="w-2/3 mx-auto py-2 bg-slate-800 text-white text-center text-xs font-bold tracking-widest uppercase rounded-lg shadow-sm">
                BLACKBOARD / FRONT STAGE
              </div>

              {/* Columns Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {Array.from({ length: selectedRoom.columns }).map((_, colIdx) => {
                  const colLetter = String.fromCharCode(65 + colIdx); // A, B, C...
                  return (
                    <div key={colLetter} className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                      <div className="text-center font-bold text-xs text-indigo-700 bg-indigo-50 py-1 rounded-md border border-indigo-100">
                        COLUMN {colLetter}
                      </div>

                      <div className="space-y-1.5">
                        {Array.from({ length: selectedRoom.rows }).map((_, rIdx) => {
                          const rowNum = rIdx + 1;
                          const seatL = roomSeats.find((s) => s.column === colLetter && s.row === rowNum && s.side === 'L');
                          const seatR = roomSeats.find((s) => s.column === colLetter && s.row === rowNum && s.side === 'R');

                          return (
                            <div key={rowNum} className="grid grid-cols-2 gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200/60">
                              <div className="p-1 bg-white border border-slate-200 rounded text-center">
                                <p className="text-[10px] font-mono font-bold text-slate-800">{seatL ? seatL.seatLabel : `${colLetter}-${rowNum}-L`}</p>
                              </div>
                              <div className="p-1 bg-white border border-slate-200 rounded text-center">
                                <p className="text-[10px] font-mono font-bold text-slate-800">{seatR ? seatR.seatLabel : `${colLetter}-${rowNum}-R`}</p>
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

            <div className="p-4 border-t border-slate-200 bg-white flex justify-end">
              <button
                onClick={() => setSelectedRoom(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-700"
              >
                Close Matrix View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
