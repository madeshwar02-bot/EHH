import {
  Student,
  Room,
  Seat,
  StudentAllocation,
  AllocationValidationResult,
  AllocationGroup,
} from '../types';

export function validateAllocations(
  students: Student[],
  rooms: Room[],
  seats: Seat[],
  allocations: StudentAllocation[],
  groups: AllocationGroup[]
): AllocationValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const studentMap = new Map<string, Student>();
  for (const s of students) studentMap.set(s.id, s);

  const roomMap = new Map<string, Room>();
  for (const r of rooms) roomMap.set(r.id, r);

  const seatMap = new Map<string, Seat>();
  for (const st of seats) seatMap.set(st.id, st);

  // 1. Duplicate student allocation check
  const allocatedStudentIds = new Set<string>();
  let duplicateStudentAllocations = 0;
  for (const alloc of allocations) {
    if (allocatedStudentIds.has(alloc.studentId)) {
      errors.push(`Duplicate allocation detected for student ID ${alloc.studentId}`);
      duplicateStudentAllocations++;
    }
    allocatedStudentIds.add(alloc.studentId);
  }

  // 2. Duplicate seat allocation check
  const allocatedSeatIds = new Set<string>();
  let duplicateSeatAllocations = 0;
  for (const alloc of allocations) {
    if (allocatedSeatIds.has(alloc.seatId)) {
      errors.push(`Duplicate seat allocation detected for seat ID ${alloc.seatId} (${alloc.seatLabel})`);
      duplicateSeatAllocations++;
    }
    allocatedSeatIds.add(alloc.seatId);
  }

  // 3. Room capacity and availability check
  const roomOccupancy = new Map<string, number>();
  const overCapacityRooms: string[] = [];

  for (const alloc of allocations) {
    const room = roomMap.get(alloc.roomId);
    if (!room) {
      errors.push(`Allocation references non-existent room ID ${alloc.roomId}`);
      continue;
    }
    if (room.status === 'UNAVAILABLE') {
      errors.push(`Allocation assigned seat in unavailable room ${room.roomNumber}`);
    }

    const count = (roomOccupancy.get(alloc.roomId) || 0) + 1;
    roomOccupancy.set(alloc.roomId, count);

    if (count > room.capacity && !overCapacityRooms.includes(room.roomNumber)) {
      errors.push(`Room ${room.roomNumber} exceeds capacity (${count} / ${room.capacity})`);
      overCapacityRooms.push(room.roomNumber);
    }
  }

  // 4. Check seat availability
  for (const alloc of allocations) {
    const seat = seatMap.get(alloc.seatId);
    if (!seat) {
      errors.push(`Allocation references non-existent seat ID ${alloc.seatId}`);
    } else if (seat.status === 'UNAVAILABLE') {
      errors.push(`Allocation assigned unavailable seat ${seat.seatLabel}`);
    }
  }

  // 5. Unallocated students check
  const totalStudents = students.length;
  const allocatedStudents = allocations.length;
  const unallocatedStudents = totalStudents - allocatedStudents;

  if (unallocatedStudents > 0) {
    warnings.push(`${unallocatedStudents} student(s) could not be allocated due to room capacity shortage.`);
  }

  // 6. Split group count calculation
  let groupsSplit = 0;
  for (const g of groups) {
    const groupAllocations = allocations.filter((a) => a.groupId === g.id);
    const assignedRooms = new Set(groupAllocations.map((a) => a.roomId));
    if (assignedRooms.size > 1) {
      groupsSplit++;
      warnings.push(`Group ${g.className} (${g.subjectCode}) was split across ${assignedRooms.size} rooms.`);
    }
  }

  const passed = errors.length === 0;

  return {
    passed,
    errors,
    warnings,
    details: {
      totalStudents,
      allocatedStudents,
      unallocatedStudents,
      duplicateStudentAllocations,
      duplicateSeatAllocations,
      overCapacityRooms,
      groupsSplit,
      lockedPreservedCount: allocations.filter((a) => a.locked).length,
    },
  };
}
