import {
  Student,
  Room,
  Seat,
  StudentAllocation,
  Allotment,
  AllotmentRunResult,
  ClassEntity,
} from '../types';
import { groupStudents } from './grouping';
import { getAvailableRooms, sortRoomsSequential } from './roomSelector';
import { buildRoomSeatMap } from './seatMap';
import { validateAllocations } from './validator';

export function runAllocationEngine(
  allotment: Allotment,
  students: Student[],
  rooms: Room[],
  seats: Seat[],
  classes: ClassEntity[],
  existingAllocations: StudentAllocation[] = []
): AllotmentRunResult {
  const now = new Date().toISOString();

  // 1. Separate locked allocations vs unlocked
  const lockedAllocations = existingAllocations.filter((a) => a.locked);
  const occupiedSeatIds = new Set<string>(lockedAllocations.map((a) => a.seatId));
  const allocatedStudentIds = new Set<string>(lockedAllocations.map((a) => a.studentId));

  // Filter unallocated students
  const unallocatedStudents = students.filter((s) => !allocatedStudentIds.has(s.id));

  // 2. Form allocation groups for unallocated students
  const groups = groupStudents(unallocatedStudents, classes, allotment.id);

  // 3. Filter available rooms & sort them sequentially
  const availableRooms = sortRoomsSequential(getAvailableRooms(rooms, seats));

  // Build room seat maps
  const roomSeatMaps = availableRooms.map((r) => {
    const rSeats = seats.filter((s) => s.roomId === r.id);
    return buildRoomSeatMap(r, rSeats, occupiedSeatIds);
  });

  const newAllocations: StudentAllocation[] = [...lockedAllocations];
  let groupsSplitCount = 0;

  // 4. Group-first deterministic allocation
  for (const group of groups) {
    const studentIds = group.studentIds;
    if (studentIds.length === 0) continue;

    let unassignedIds = [...studentIds];

    // First attempt: Find a single room that can fit the ENTIRE group contiguously
    let targetRoomMap = roomSeatMaps.find(
      (rm) => rm.availableSeats.length >= unassignedIds.length
    );

    if (targetRoomMap) {
      // Fit whole group in targetRoomMap
      const seatsToAssign = targetRoomMap.availableSeats.splice(0, unassignedIds.length);
      seatsToAssign.forEach((seat, idx) => {
        const studentId = unassignedIds[idx];
        newAllocations.push({
          id: `alloc-${allotment.id}-${studentId}`,
          allotmentId: allotment.id,
          studentId,
          groupId: group.id,
          roomId: targetRoomMap!.room.id,
          seatId: seat.id,
          seatLabel: seat.seatLabel,
          locked: false,
          createdAt: now,
        });
        occupiedSeatIds.add(seat.id);
      });
      unassignedIds = [];
    } else {
      // Must split group across multiple rooms
      let isSplit = false;
      let roomsUsedForGroup = 0;

      for (const rm of roomSeatMaps) {
        if (unassignedIds.length === 0) break;
        if (rm.availableSeats.length === 0) continue;

        const takeCount = Math.min(rm.availableSeats.length, unassignedIds.length);
        const seatsToAssign = rm.availableSeats.splice(0, takeCount);
        const currentBatch = unassignedIds.splice(0, takeCount);

        seatsToAssign.forEach((seat, idx) => {
          const studentId = currentBatch[idx];
          newAllocations.push({
            id: `alloc-${allotment.id}-${studentId}`,
            allotmentId: allotment.id,
            studentId,
            groupId: group.id,
            roomId: rm.room.id,
            seatId: seat.id,
            seatLabel: seat.seatLabel,
            locked: false,
            createdAt: now,
          });
          occupiedSeatIds.add(seat.id);
        });

        roomsUsedForGroup++;
      }

      if (roomsUsedForGroup > 1) {
        groupsSplitCount++;
      }
    }
  }

  // 5. Validation check
  const validation = validateAllocations(students, rooms, seats, newAllocations, groups);

  // Calculate statistics
  const totalStudents = students.length;
  const allocatedStudents = newAllocations.length;
  const unallocatedCount = totalStudents - allocatedStudents;
  const roomsUsedSet = new Set(newAllocations.map((a) => a.roomId));
  const roomsUsedCount = roomsUsedSet.size;

  const totalSeatsCapacity = rooms.reduce((acc, r) => acc + (r.status === 'AVAILABLE' ? r.capacity : 0), 0);
  const allocatedSeatsCount = newAllocations.length;
  const emptySeatsCount = totalSeatsCapacity - allocatedSeatsCount;

  const updatedAllotment: Allotment = {
    ...allotment,
    status: allotment.status === 'DRAFT' ? 'GENERATED' : allotment.status,
    studentCount: totalStudents,
    roomCount: roomsUsedCount,
    allocatedStudentsCount: allocatedStudents,
    unallocatedStudentsCount: unallocatedCount,
    emptySeatsCount,
    splitGroupsCount: groupsSplitCount,
    updatedAt: now,
  };

  return {
    allotment: updatedAllotment,
    groups,
    allocations: newAllocations,
    validation,
    stats: {
      totalStudents,
      allocatedStudents,
      unallocatedStudents: unallocatedCount,
      roomsUsedCount,
      totalSeatsCapacity,
      allocatedSeatsCount,
      emptySeatsCount,
      groupsCount: groups.length,
      groupsSplitCount,
    },
  };
}
