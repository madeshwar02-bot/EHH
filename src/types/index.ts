export type EntityStatus = 'ACTIVE' | 'INACTIVE';
export type RoomStatus = 'AVAILABLE' | 'UNAVAILABLE';
export type AllotmentStatus = 'DRAFT' | 'GENERATED' | 'REVIEWED' | 'FINALIZED';
export type SeatSide = 'L' | 'R';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'TEACHER';
  createdAt: string;
}

export interface Program {
  id: string;
  name: string;
  code: string;
  status: EntityStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ClassEntity {
  id: string;
  name: string; // e.g. CSE-A
  programId: string;
  year: number;
  section: string;
  status: EntityStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Room {
  id: string;
  roomNumber: string; // e.g. IB002
  building: string;   // e.g. Science Block
  floor: number;      // e.g. 2
  capacity: number;   // e.g. 40
  columns: number;    // e.g. 4
  rows: number;       // e.g. 5
  status: RoomStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Seat {
  id: string;
  roomId: string;
  column: string;     // e.g. A, B, C...
  row: number;        // e.g. 1, 2, 3...
  side: SeatSide;     // L or R
  seatLabel: string;  // e.g. IB002-A-1-L
  status: RoomStatus;
  createdAt: string;
}

export interface Student {
  id: string;
  allotmentId?: string; // Optional binding to specific allotment session or global pool
  registerNumber: string;
  name: string;
  programId: string;
  classId: string;
  year: number;
  section: string;
  subjectCode: string;
  createdAt: string;
}

export interface StudentValidationError {
  row: number;
  registerNumber: string;
  studentName: string;
  field: string;
  message: string;
  severity: 'ERROR' | 'WARNING' | 'DUPLICATE';
}

export interface StudentImportSummary {
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  duplicates: number;
  missingFields: number;
  errors: StudentValidationError[];
}

export interface AllocationGroup {
  id: string;
  allotmentId: string;
  classId: string;
  className: string;
  subjectCode: string;
  studentCount: number;
  studentIds: string[];
}

export interface StudentAllocation {
  id: string;
  allotmentId: string;
  studentId: string;
  groupId: string;
  roomId: string;
  seatId: string;
  seatLabel: string;
  locked: boolean;
  createdAt: string;
}

export interface Allotment {
  id: string;
  name: string;
  status: AllotmentStatus;
  studentCount: number;
  roomCount: number;
  allocatedStudentsCount: number;
  unallocatedStudentsCount: number;
  emptySeatsCount: number;
  splitGroupsCount: number;
  createdAt: string;
  updatedAt: string;
  finalizedAt?: string;
  notes?: string;
}

export interface SeatAdjacencyInfo {
  seatId: string;
  seatLabel: string;
  roomId: string;
  column: string;
  row: number;
  side: SeatSide;
  neighbors: {
    partnerSideSeatId?: string; // Same L/R pair
    nextRowSeatId?: string;     // Next row same column & side
    prevRowSeatId?: string;     // Prev row same column & side
    adjacentColumnSeatId?: string;
  };
}

export interface SeatBlock {
  roomId: string;
  roomNumber: string;
  seats: Seat[];
  score: number;
  isContiguous: boolean;
  columnDistribution: Record<string, number>;
}

export interface AllocationValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
  details: {
    totalStudents: number;
    allocatedStudents: number;
    unallocatedStudents: number;
    duplicateStudentAllocations: number;
    duplicateSeatAllocations: number;
    overCapacityRooms: string[];
    groupsSplit: number;
    lockedPreservedCount: number;
  };
}

export interface AllotmentRunResult {
  allotment: Allotment;
  groups: AllocationGroup[];
  allocations: StudentAllocation[];
  validation: AllocationValidationResult;
  stats: {
    totalStudents: number;
    allocatedStudents: number;
    unallocatedStudents: number;
    roomsUsedCount: number;
    totalSeatsCapacity: number;
    allocatedSeatsCount: number;
    emptySeatsCount: number;
    groupsCount: number;
    groupsSplitCount: number;
  };
}
