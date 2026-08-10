import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { z } from 'zod';
import { groupStudents } from '../allocation/grouping';
import { runAllocationEngine } from '../allocation/allocator';
import { parseSeatLabel, calculateSeatDistance } from '../allocation/adjacency';
import {
  Program,
  ClassEntity,
  Room,
  Seat,
  Student,
  Allotment,
  StudentAllocation,
  StudentValidationError,
} from '../types';

export const apiRouter = Router();

// -------------------------------------------------------------
// 1. AUTH ROUTES
// -------------------------------------------------------------
apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  const users = db.getUsers();
  const user = users.find((u) => u.email.toLowerCase() === (email || '').toLowerCase());

  if (user && (password === 'admin123' || password === 'admin' || password === 'password')) {
    return res.json({ success: true, user, token: 'session-token-admin' });
  }

  // Default fallback for demo teacher login
  if (email === 'teacher@university.edu' || email === 'admin@university.edu') {
    return res.json({
      success: true,
      user: {
        id: 'u-admin',
        email: email,
        name: 'Exam Cell Staff',
        role: 'ADMIN',
        createdAt: new Date().toISOString(),
      },
      token: 'session-token-admin',
    });
  }

  return res.status(401).json({ success: false, error: 'Invalid credentials. Use admin@university.edu / admin123' });
});

apiRouter.get('/auth/me', (req: Request, res: Response) => {
  const users = db.getUsers();
  return res.json({ user: users[0] || null });
});

// -------------------------------------------------------------
// 2. PROGRAM ROUTES
// -------------------------------------------------------------
const programSchema = z.object({
  name: z.string().min(2, 'Program name required'),
  code: z.string().min(2, 'Program code required'),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

apiRouter.get('/programs', (req: Request, res: Response) => {
  res.json(db.getPrograms());
});

apiRouter.post('/programs', (req: Request, res: Response) => {
  try {
    const data = programSchema.parse(req.body);
    const programs = db.getPrograms();

    if (programs.some((p) => p.code.toUpperCase() === data.code.toUpperCase())) {
      return res.status(400).json({ error: `Program code '${data.code}' already exists.` });
    }

    const now = new Date().toISOString();
    const newProg: Program = {
      id: `prog-${Date.now()}`,
      name: data.name,
      code: data.code.toUpperCase(),
      status: data.status,
      createdAt: now,
      updatedAt: now,
    };

    programs.push(newProg);
    db.setPrograms(programs);
    res.status(201).json(newProg);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Invalid program data' });
  }
});

apiRouter.put('/programs/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const programs = db.getPrograms();
  const index = programs.findIndex((p) => p.id === id);

  if (index === -1) return res.status(404).json({ error: 'Program not found' });

  const updated = {
    ...programs[index],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };
  programs[index] = updated;
  db.setPrograms(programs);
  res.json(updated);
});

apiRouter.delete('/programs/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  let programs = db.getPrograms();
  programs = programs.filter((p) => p.id !== id);
  db.setPrograms(programs);
  res.json({ success: true });
});

// -------------------------------------------------------------
// 3. CLASS ROUTES
// -------------------------------------------------------------
const classSchema = z.object({
  name: z.string().min(2, 'Class name required'), // e.g. CSE-A
  programId: z.string().min(1, 'Program ID required'),
  year: z.number().min(1).max(5),
  section: z.string().min(1),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

apiRouter.get('/classes', (req: Request, res: Response) => {
  let classes = db.getClasses();
  if (req.query.programId) {
    classes = classes.filter((c) => c.programId === req.query.programId);
  }
  res.json(classes);
});

apiRouter.post('/classes', (req: Request, res: Response) => {
  try {
    const data = classSchema.parse(req.body);
    const classes = db.getClasses();

    if (classes.some((c) => c.name.toUpperCase() === data.name.toUpperCase())) {
      return res.status(400).json({ error: `Class '${data.name}' already exists.` });
    }

    const now = new Date().toISOString();
    const newClass: ClassEntity = {
      id: `cls-${Date.now()}`,
      name: data.name,
      programId: data.programId,
      year: data.year,
      section: data.section,
      status: data.status,
      createdAt: now,
      updatedAt: now,
    };

    classes.push(newClass);
    db.setClasses(classes);
    res.status(201).json(newClass);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Invalid class data' });
  }
});

apiRouter.put('/classes/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const classes = db.getClasses();
  const index = classes.findIndex((c) => c.id === id);

  if (index === -1) return res.status(404).json({ error: 'Class not found' });

  const updated = {
    ...classes[index],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };
  classes[index] = updated;
  db.setClasses(classes);
  res.json(updated);
});

apiRouter.delete('/classes/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  let classes = db.getClasses();
  classes = classes.filter((c) => c.id !== id);
  db.setClasses(classes);
  res.json({ success: true });
});

// -------------------------------------------------------------
// 4. ROOMS & SEATS ROUTES
// -------------------------------------------------------------
const roomSchema = z.object({
  roomNumber: z.string().min(1, 'Room number required'),
  building: z.string().default('Main Block'),
  floor: z.number().min(0),
  columns: z.number().min(1).max(10), // e.g. 4 columns (A, B, C, D)
  rows: z.number().min(1).max(20),    // e.g. 5 rows
  status: z.enum(['AVAILABLE', 'UNAVAILABLE']).default('AVAILABLE'),
});

apiRouter.get('/rooms', (req: Request, res: Response) => {
  let rooms = db.getRooms();
  if (req.query.floor) {
    rooms = rooms.filter((r) => r.floor === parseInt(req.query.floor as string, 10));
  }
  if (req.query.status) {
    rooms = rooms.filter((r) => r.status === req.query.status);
  }
  res.json(rooms);
});

apiRouter.get('/rooms/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const room = db.getRooms().find((r) => r.id === id);
  if (!room) return res.status(404).json({ error: 'Room not found' });

  const seats = db.getSeats().filter((s) => s.roomId === id);
  res.json({ room, seats });
});

apiRouter.post('/rooms', (req: Request, res: Response) => {
  try {
    const data = roomSchema.parse(req.body);
    const rooms = db.getRooms();

    if (rooms.some((r) => r.roomNumber.toUpperCase() === data.roomNumber.toUpperCase())) {
      return res.status(400).json({ error: `Room number '${data.roomNumber}' already exists.` });
    }

    const now = new Date().toISOString();
    const capacity = data.columns * data.rows * 2; // L and R side
    const roomId = `room-${data.roomNumber.toUpperCase()}`;

    const newRoom: Room = {
      id: roomId,
      roomNumber: data.roomNumber.toUpperCase(),
      building: data.building,
      floor: data.floor,
      capacity,
      columns: data.columns,
      rows: data.rows,
      status: data.status,
      createdAt: now,
      updatedAt: now,
    };

    // Automatically generate seats following ROOM-COLUMN-ROW-L/R format
    const colLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].slice(0, data.columns);
    const seats: Seat[] = db.getSeats();
    const newSeats: Seat[] = [];

    for (const col of colLabels) {
      for (let r = 1; r <= data.rows; r++) {
        for (const side of ['L', 'R'] as const) {
          const seatLabel = `${newRoom.roomNumber}-${col}-${r}-${side}`;
          const seat: Seat = {
            id: `seat-${seatLabel}`,
            roomId: roomId,
            column: col,
            row: r,
            side,
            seatLabel,
            status: data.status,
            createdAt: now,
          };
          newSeats.push(seat);
        }
      }
    }

    rooms.push(newRoom);
    db.setRooms(rooms);
    db.setSeats([...seats, ...newSeats]);

    res.status(201).json({ room: newRoom, seatsGeneratedCount: newSeats.length });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Invalid room data' });
  }
});

apiRouter.put('/rooms/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const rooms = db.getRooms();
  const index = rooms.findIndex((r) => r.id === id);

  if (index === -1) return res.status(404).json({ error: 'Room not found' });

  const updatedRoom = {
    ...rooms[index],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };

  rooms[index] = updatedRoom;
  db.setRooms(rooms);

  // Sync seat status if room status changed
  if (req.body.status) {
    const seats = db.getSeats().map((s) => {
      if (s.roomId === id) {
        return { ...s, status: req.body.status as 'AVAILABLE' | 'UNAVAILABLE' };
      }
      return s;
    });
    db.setSeats(seats);
  }

  res.json(updatedRoom);
});

apiRouter.delete('/rooms/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  let rooms = db.getRooms().filter((r) => r.id !== id);
  let seats = db.getSeats().filter((s) => s.roomId !== id);
  db.setRooms(rooms);
  db.setSeats(seats);
  res.json({ success: true });
});

apiRouter.get('/seats', (req: Request, res: Response) => {
  let seats = db.getSeats();
  if (req.query.roomId) {
    seats = seats.filter((s) => s.roomId === req.query.roomId);
  }
  res.json(seats);
});

// -------------------------------------------------------------
// 5. STUDENTS & IMPORT ROUTES
// -------------------------------------------------------------
apiRouter.get('/students', (req: Request, res: Response) => {
  let students = db.getStudents();
  const { search, programId, classId, year, section, subjectCode } = req.query;

  if (search) {
    const q = (search as string).toLowerCase().trim();
    students = students.filter(
      (s) =>
        s.registerNumber.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.subjectCode.toLowerCase().includes(q)
    );
  }
  if (programId) students = students.filter((s) => s.programId === programId);
  if (classId) students = students.filter((s) => s.classId === classId);
  if (year) students = students.filter((s) => s.year === parseInt(year as string, 10));
  if (section) students = students.filter((s) => s.section.toUpperCase() === (section as string).toUpperCase());
  if (subjectCode) students = students.filter((s) => s.subjectCode.toUpperCase() === (subjectCode as string).toUpperCase());

  res.json(students);
});

apiRouter.post('/students/import', (req: Request, res: Response) => {
  try {
    const { rawRows, commit } = req.body; // Array of objects
    if (!Array.isArray(rawRows)) {
      return res.status(400).json({ error: 'Expected rawRows array' });
    }

    const programs = db.getPrograms();
    const classes = db.getClasses();
    const existingStudents = db.getStudents();

    const errors: StudentValidationError[] = [];
    const validStudentsToInsert: Student[] = [];
    const seenEnrollmentsInFile = new Set<string>();

    let totalRecords = rawRows.length;
    let missingFieldsCount = 0;
    let duplicatesCount = 0;

    rawRows.forEach((row, idx) => {
      const rowNum = idx + 2; // Header is line 1
      const regNo = String(row['Register Number'] || row['registerNumber'] || row['RegNo'] || '').trim();
      const name = String(row['Student Name'] || row['name'] || row['StudentName'] || '').trim();
      const progCodeName = String(row['Program'] || row['program'] || '').trim();
      const className = String(row['Class'] || row['class'] || '').trim();
      const yearVal = parseInt(String(row['Year'] || row['year'] || '1'), 10);
      const section = String(row['Section'] || row['section'] || 'A').trim();
      const rawSubjectCode = String(row['Subject Code'] || row['subjectCode'] || '').trim().toUpperCase();

      // Split subject codes by comma if they provide multiple
      const subjectCodes = rawSubjectCode.split(',').map(s => s.trim()).filter(Boolean);

      let hasError = false;

      // Validation 1: Required fields
      if (!regNo) {
        errors.push({ row: rowNum, registerNumber: regNo || 'N/A', studentName: name, field: 'Register Number', message: 'Missing register number', severity: 'ERROR' });
        missingFieldsCount++;
        hasError = true;
      }
      if (!name) {
        errors.push({ row: rowNum, registerNumber: regNo, studentName: name || 'N/A', field: 'Student Name', message: 'Missing student name', severity: 'ERROR' });
        missingFieldsCount++;
        hasError = true;
      }
      if (!className) {
        errors.push({ row: rowNum, registerNumber: regNo, studentName: name, field: 'Class', message: 'Missing class name', severity: 'ERROR' });
        missingFieldsCount++;
        hasError = true;
      }
      if (subjectCodes.length === 0) {
        errors.push({ row: rowNum, registerNumber: regNo, studentName: name, field: 'Subject Code', message: 'Missing subject code', severity: 'ERROR' });
        missingFieldsCount++;
        hasError = true;
      }

      // Matching program and class
      let targetProg = programs.find((p) => p.code.toUpperCase() === progCodeName.toUpperCase() || p.name.toUpperCase().includes(progCodeName.toUpperCase()));
      let targetClass = classes.find((c) => c.name.toUpperCase() === className.toUpperCase());

      if (!targetClass && !hasError) {
        // Auto-create or resolve class
        if (commit) {
          const newClassObj: ClassEntity = {
            id: `cls-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
            name: className,
            programId: targetProg ? targetProg.id : programs[0]?.id || 'prog-cse',
            year: yearVal || 1,
            section: section || 'A',
            status: 'ACTIVE',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          classes.push(newClassObj);
          db.setClasses(classes);
          targetClass = newClassObj;
        }
      }

      if (!hasError) {
        subjectCodes.forEach((subject, subIdx) => {
          const enrollmentKey = `${regNo.toUpperCase()}-${subject.toUpperCase()}`;
          
          // Validation 2: Duplicate check inside uploaded file
          if (regNo && seenEnrollmentsInFile.has(enrollmentKey)) {
            errors.push({ row: rowNum, registerNumber: regNo, studentName: name, field: 'Subject Code', message: `Duplicate enrollment for subject ${subject} in upload file`, severity: 'DUPLICATE' });
            duplicatesCount++;
            return;
          } else if (regNo) {
            seenEnrollmentsInFile.add(enrollmentKey);
          }

          // Validation 3: Duplicate check against existing DB
          if (regNo && existingStudents.some((s) => s.registerNumber.toUpperCase() === regNo.toUpperCase() && s.subjectCode.toUpperCase() === subject.toUpperCase()) && !commit) {
            errors.push({ row: rowNum, registerNumber: regNo, studentName: name, field: 'Subject Code', message: `Student already enrolled in ${subject} in database`, severity: 'DUPLICATE' });
            duplicatesCount++;
            return;
          }

          validStudentsToInsert.push({
            id: `std-imp-${Date.now()}-${idx}-${subIdx}`,
            registerNumber: regNo,
            name,
            programId: targetProg ? targetProg.id : targetClass ? targetClass.programId : programs[0]?.id || 'prog-cse',
            classId: targetClass ? targetClass.id : className,
            year: yearVal || 1,
            section: section || 'A',
            subjectCode: subject,
            createdAt: new Date().toISOString(),
          });
        });
      }
    });

    const validRecords = validStudentsToInsert.length;
    const invalidRecords = totalRecords - validRecords;

    if (commit && validStudentsToInsert.length > 0) {
      // Overwrite or append students
      db.setStudents([...existingStudents, ...validStudentsToInsert]);
    }

    res.json({
      summary: {
        totalRecords,
        validRecords,
        invalidRecords,
        duplicates: duplicatesCount,
        missingFields: missingFieldsCount,
        errors,
      },
      committed: !!commit,
      importedCount: commit ? validStudentsToInsert.length : 0,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error processing student upload' });
  }
});

apiRouter.delete('/students/clear-all', (req: Request, res: Response) => {
  db.setStudents([]);
  res.json({ success: true, message: 'Cleared all student records' });
});

apiRouter.delete('/students/:id', (req: Request, res: Response) => {
  let students = db.getStudents().filter((s) => s.id !== req.params.id);
  db.setStudents(students);
  res.json({ success: true });
});

// -------------------------------------------------------------
// 6. ALLOTMENTS & ALLOCATION ENGINE ROUTES
// -------------------------------------------------------------
apiRouter.get('/allotments', (req: Request, res: Response) => {
  res.json(db.getAllotments());
});

apiRouter.get('/allotments/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const allotments = db.getAllotments();
  const allotment = allotments.find((a) => a.id === id);

  if (!allotment) return res.status(404).json({ error: 'Allotment session not found' });

  const groups = db.getAllocationGroups().filter((g) => g.allotmentId === id);
  const allocations = db.getStudentAllocations().filter((a) => a.allotmentId === id);
  const students = db.getStudents();
  const rooms = db.getRooms();
  const seats = db.getSeats();

  res.json({
    allotment,
    groups,
    allocations,
    students,
    rooms,
    seats,
  });
});

apiRouter.post('/allotments', (req: Request, res: Response) => {
  const { name, notes } = req.body;
  const now = new Date().toISOString();
  const students = db.getStudents();
  const rooms = db.getRooms();
  const seats = db.getSeats();

  const newAllotment: Allotment = {
    id: `allot-${Date.now()}`,
    name: name || `Examination Allotment - ${new Date().toLocaleDateString()}`,
    status: 'DRAFT',
    studentCount: students.length,
    roomCount: rooms.length,
    allocatedStudentsCount: 0,
    unallocatedStudentsCount: students.length,
    emptySeatsCount: seats.length,
    splitGroupsCount: 0,
    createdAt: now,
    updatedAt: now,
    notes,
  };

  const allotments = db.getAllotments();
  allotments.unshift(newAllotment);
  db.setAllotments(allotments);

  res.status(201).json(newAllotment);
});

apiRouter.post('/allotments/:id/generate', (req: Request, res: Response) => {
  const { id } = req.params;
  const allotments = db.getAllotments();
  const index = allotments.findIndex((a) => a.id === id);

  if (index === -1) return res.status(404).json({ error: 'Allotment session not found' });

  const allotment = allotments[index];
  const students = db.getStudents();
  const rooms = db.getRooms();
  const seats = db.getSeats();
  const classes = db.getClasses();
  const existingAllocations = db.getStudentAllocations().filter((a) => a.allotmentId === id);

  // Run core group-first room & seat allocation engine
  const result = runAllocationEngine(allotment, students, rooms, seats, classes, existingAllocations);

  // Persist updated allotment, groups, and allocations
  allotments[index] = result.allotment;
  db.setAllotments(allotments);

  // Filter out non-current allotment groups & allocations, then replace
  const otherGroups = db.getAllocationGroups().filter((g) => g.allotmentId !== id);
  db.setAllocationGroups([...otherGroups, ...result.groups]);

  const otherAllocations = db.getStudentAllocations().filter((a) => a.allotmentId !== id);
  db.setStudentAllocations([...otherAllocations, ...result.allocations]);

  res.json(result);
});

apiRouter.put('/allotments/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const allotments = db.getAllotments();
  const index = allotments.findIndex((a) => a.id === id);

  if (index === -1) return res.status(404).json({ error: 'Allotment session not found' });

  const now = new Date().toISOString();
  allotments[index].status = status;
  allotments[index].updatedAt = now;
  if (status === 'FINALIZED') {
    allotments[index].finalizedAt = now;
  }

  db.setAllotments(allotments);
  res.json(allotments[index]);
});

// Manual modification endpoint (moving a student to a different seat)
apiRouter.post('/allotments/:id/move-student', (req: Request, res: Response) => {
  const { id } = req.params;
  const { studentId, targetSeatId } = req.body;

  const allocations = db.getStudentAllocations();
  const seats = db.getSeats();
  const rooms = db.getRooms();
  const students = db.getStudents();

  const currentAllocIndex = allocations.findIndex((a) => a.allotmentId === id && a.studentId === studentId);
  if (currentAllocIndex === -1) {
    return res.status(404).json({ error: 'Student has no active allocation in this allotment.' });
  }

  const currentAlloc = allocations[currentAllocIndex];
  const targetSeat = seats.find((s) => s.id === targetSeatId);
  if (!targetSeat) return res.status(400).json({ error: 'Target seat does not exist.' });

  if (targetSeat.status === 'UNAVAILABLE') {
    return res.status(400).json({ error: 'Target seat is unavailable.' });
  }

  // Check if destination seat is already occupied by ANOTHER student
  const seatOccupant = allocations.find((a) => a.allotmentId === id && a.seatId === targetSeatId && a.studentId !== studentId);
  if (seatOccupant) {
    return res.status(400).json({ error: `Destination seat ${targetSeat.seatLabel} is already occupied.` });
  }

  // Calculate adjacency impact warning
  const student = students.find((s) => s.id === studentId);
  const targetRoom = rooms.find((r) => r.id === targetSeat.roomId);

  let warning: string | null = null;
  if (student) {
    // Find peers in same Class + Subject Code
    const groupPeers = students.filter(
      (s) => s.id !== studentId && s.classId === student.classId && s.subjectCode === student.subjectCode
    );
    const peerIds = new Set(groupPeers.map((s) => s.id));
    const peerAllocations = allocations.filter((a) => a.allotmentId === id && peerIds.has(a.studentId));

    const inSameTargetRoom = peerAllocations.filter((a) => a.roomId === targetSeat.roomId);
    if (peerAllocations.length > 0 && inSameTargetRoom.length === 0) {
      warning = `Moving student ${student.name} (${student.registerNumber}) to room ${targetRoom?.roomNumber || targetSeat.roomId} separates them from their Class + Subject Code group (${student.subjectCode}).`;
    }
  }

  // Apply move
  allocations[currentAllocIndex] = {
    ...currentAlloc,
    roomId: targetSeat.roomId,
    seatId: targetSeat.id,
    seatLabel: targetSeat.seatLabel,
  };

  db.setStudentAllocations(allocations);

  res.json({
    success: true,
    allocation: allocations[currentAllocIndex],
    warning,
  });
});

apiRouter.post('/allotments/:id/toggle-lock', (req: Request, res: Response) => {
  const { id } = req.params;
  const { allocationId } = req.body;

  const allocations = db.getStudentAllocations();
  const index = allocations.findIndex((a) => a.allotmentId === id && a.id === allocationId);

  if (index === -1) return res.status(404).json({ error: 'Allocation not found' });

  allocations[index].locked = !allocations[index].locked;
  db.setStudentAllocations(allocations);

  res.json({ success: true, allocation: allocations[index] });
});

apiRouter.delete('/allotments/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  let allotments = db.getAllotments().filter((a) => a.id !== id);
  let groups = db.getAllocationGroups().filter((g) => g.allotmentId !== id);
  let allocations = db.getStudentAllocations().filter((a) => a.allotmentId !== id);

  db.setAllotments(allotments);
  db.setAllocationGroups(groups);
  db.setStudentAllocations(allocations);

  res.json({ success: true });
});

// -------------------------------------------------------------
// 7. REPORTS API
// -------------------------------------------------------------
apiRouter.get('/reports/:allotmentId/complete', (req: Request, res: Response) => {
  const { allotmentId } = req.params;
  const allotment = db.getAllotments().find((a) => a.id === allotmentId);
  if (!allotment) return res.status(404).json({ error: 'Allotment not found' });

  const allocations = db.getStudentAllocations().filter((a) => a.allotmentId === allotmentId);
  const studentsMap = new Map(db.getStudents().map((s) => [s.id, s]));
  const roomsMap = new Map(db.getRooms().map((r) => [r.id, r]));
  const programsMap = new Map(db.getPrograms().map((p) => [p.id, p]));
  const classesMap = new Map(db.getClasses().map((c) => [c.id, c]));

  const reportData = allocations.map((alloc) => {
    const student = studentsMap.get(alloc.studentId);
    const room = roomsMap.get(alloc.roomId);
    const prog = student ? programsMap.get(student.programId) : null;
    const cls = student ? classesMap.get(student.classId) : null;

    return {
      registerNumber: student?.registerNumber || 'N/A',
      studentName: student?.name || 'N/A',
      program: prog?.code || 'N/A',
      class: cls?.name || 'N/A',
      subjectCode: student?.subjectCode || 'N/A',
      floor: room?.floor ?? 'N/A',
      roomNumber: room?.roomNumber || 'N/A',
      seatLabel: alloc.seatLabel,
      locked: alloc.locked,
    };
  });

  res.json({ allotment, reportData });
});

apiRouter.get('/reports/:allotmentId/room-wise', (req: Request, res: Response) => {
  const { allotmentId } = req.params;
  const allocations = db.getStudentAllocations().filter((a) => a.allotmentId === allotmentId);
  const studentsMap = new Map(db.getStudents().map((s) => [s.id, s]));
  const roomsMap = new Map(db.getRooms().map((r) => [r.id, r]));
  const classesMap = new Map(db.getClasses().map((c) => [c.id, c]));

  const roomGroupsMap = new Map<string, any[]>();

  for (const alloc of allocations) {
    const room = roomsMap.get(alloc.roomId);
    const rNum = room ? room.roomNumber : alloc.roomId;

    if (!roomGroupsMap.has(rNum)) {
      roomGroupsMap.set(rNum, []);
    }

    const student = studentsMap.get(alloc.studentId);
    const cls = student ? classesMap.get(student.classId) : null;

    roomGroupsMap.get(rNum)!.push({
      seatLabel: alloc.seatLabel,
      registerNumber: student?.registerNumber || 'N/A',
      studentName: student?.name || 'N/A',
      className: cls?.name || 'N/A',
      subjectCode: student?.subjectCode || 'N/A',
    });
  }

  const roomReports = Array.from(roomGroupsMap.entries()).map(([roomNumber, studentList]) => {
    const roomObj = db.getRooms().find((r) => r.roomNumber === roomNumber);
    return {
      roomNumber,
      floor: roomObj?.floor || 1,
      capacity: roomObj?.capacity || 40,
      allocatedCount: studentList.length,
      students: studentList,
    };
  });

  res.json(roomReports);
});

// -------------------------------------------------------------
// 8. GLOBAL SEARCH API
// -------------------------------------------------------------
apiRouter.get('/search', (req: Request, res: Response) => {
  const query = (req.query.q as string || '').trim().toLowerCase();
  if (!query) return res.json([]);

  const students = db.getStudents();
  const rooms = db.getRooms();
  const allocations = db.getStudentAllocations();
  const classesMap = new Map(db.getClasses().map((c) => [c.id, c]));
  const seatsMap = new Map(db.getSeats().map((s) => [s.id, s]));

  const results: any[] = [];

  students.forEach((s) => {
    if (
      s.registerNumber.toLowerCase().includes(query) ||
      s.name.toLowerCase().includes(query) ||
      s.subjectCode.toLowerCase().includes(query)
    ) {
      const alloc = allocations.find((a) => a.studentId === s.id);
      const cls = classesMap.get(s.classId);
      let roomObj: Room | undefined;
      if (alloc) {
        roomObj = rooms.find((r) => r.id === alloc.roomId);
      }

      results.push({
        type: 'STUDENT',
        studentName: s.name,
        registerNumber: s.registerNumber,
        className: cls?.name || 'N/A',
        subjectCode: s.subjectCode,
        roomNumber: roomObj?.roomNumber || 'Unassigned',
        floor: roomObj?.floor ?? 'N/A',
        seatLabel: alloc?.seatLabel || 'Unassigned',
      });
    }
  });

  res.json(results.slice(0, 30));
});

// -------------------------------------------------------------
// 9. DASHBOARD STATS & RESET
// -------------------------------------------------------------
apiRouter.get('/dashboard/stats', (req: Request, res: Response) => {
  const students = db.getStudents();
  const programs = db.getPrograms();
  const classes = db.getClasses();
  const rooms = db.getRooms();
  const seats = db.getSeats();
  const allotments = db.getAllotments();
  const activeAllotment = allotments[0] || null;

  const availableRooms = rooms.filter((r) => r.status === 'AVAILABLE').length;
  const usedRooms = activeAllotment ? activeAllotment.roomCount : 0;
  const allocatedSeats = activeAllotment ? activeAllotment.allocatedStudentsCount : 0;

  res.json({
    totalStudents: students.length,
    totalPrograms: programs.length,
    totalClasses: classes.length,
    totalRooms: rooms.length,
    availableRooms,
    usedRooms,
    totalSeats: seats.length,
    allocatedSeats,
    availableSeats: seats.length - allocatedSeats,
    activeAllotment,
  });
});

apiRouter.post('/settings/reset-db', (req: Request, res: Response) => {
  db.seedInitialData();
  db.save();
  res.json({ success: true, message: 'Database reset to initial seed data' });
});
