import { db } from '../db/database';
import { groupStudents } from '../allocation/grouping';
import { calculateSeatDistance, parseSeatLabel, orderSeatsPhysically } from '../allocation/adjacency';
import { runAllocationEngine } from '../allocation/allocator';
import { Student, Room, Seat, ClassEntity, Allotment } from '../types';

console.log('=== STARTING EXAM ALLOTMENT SYSTEM ENGINE TESTS ===');

let passes = 0;
let fails = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`✅ PASS: ${msg}`);
    passes++;
  } else {
    console.error(`❌ FAIL: ${msg}`);
    fails++;
  }
}

// TEST 1: Seat Label Parsing & Adjacency
console.log('\n--- Test 1: Seat Adjacency & Parsing ---');
const label1 = 'IB002-A-1-L';
const parsed1 = parseSeatLabel(label1);
assert(parsed1?.roomNumber === 'IB002' && parsed1.column === 'A' && parsed1.row === 1 && parsed1.side === 'L', 'Parsed IB002-A-1-L correctly');

const seatA: Seat = { id: 's1', roomId: 'r1', column: 'A', row: 1, side: 'L', seatLabel: 'IB002-A-1-L', status: 'AVAILABLE', createdAt: '' };
const seatB: Seat = { id: 's2', roomId: 'r1', column: 'A', row: 1, side: 'R', seatLabel: 'IB002-A-1-R', status: 'AVAILABLE', createdAt: '' };
const seatC: Seat = { id: 's3', roomId: 'r1', column: 'A', row: 2, side: 'L', seatLabel: 'IB002-A-2-L', status: 'AVAILABLE', createdAt: '' };
const seatDiffRoom: Seat = { id: 's4', roomId: 'r2', column: 'A', row: 1, side: 'L', seatLabel: 'IB003-A-1-L', status: 'AVAILABLE', createdAt: '' };

const distAB = calculateSeatDistance(seatA, seatB);
const distAC = calculateSeatDistance(seatA, seatC);
const distDiff = calculateSeatDistance(seatA, seatDiffRoom);

assert(distAB < distAC, 'Same L/R pair (IB002-A-1-L & R) is closer than next row');
assert(distDiff === Infinity, 'Different rooms return Infinite distance');

// TEST 2: Student Grouping Logic
console.log('\n--- Test 2: Student Grouping (CLASS + SUBJECT CODE) ---');
const dummyClasses: ClassEntity[] = [
  { id: 'c1', name: 'CSE-A', programId: 'p1', year: 3, section: 'A', status: 'ACTIVE', createdAt: '', updatedAt: '' },
  { id: 'c2', name: 'CSE-B', programId: 'p1', year: 3, section: 'B', status: 'ACTIVE', createdAt: '', updatedAt: '' },
];

const dummyStudents: Student[] = [
  { id: 'std1', registerNumber: '24CS001', name: 'Student 1', programId: 'p1', classId: 'c1', year: 3, section: 'A', subjectCode: 'CS501', createdAt: '' },
  { id: 'std2', registerNumber: '24CS002', name: 'Student 2', programId: 'p1', classId: 'c1', year: 3, section: 'A', subjectCode: 'CS501', createdAt: '' },
  { id: 'std3', registerNumber: '24CS003', name: 'Student 3', programId: 'p1', classId: 'c2', year: 3, section: 'B', subjectCode: 'CS501', createdAt: '' }, // Same subject, different class!
];

const groups = groupStudents(dummyStudents, dummyClasses, 'allot-1');
assert(groups.length === 2, 'CSE-A + CS501 and CSE-B + CS501 formed 2 separate groups');
const cseAGroup = groups.find((g) => g.classId === 'c1');
assert(cseAGroup?.studentCount === 2, 'CSE-A group has 2 students');

// TEST 3: Core Room + Seat Allocation Engine
console.log('\n--- Test 3: Allocation Engine Execution ---');
const dbStudents = db.getStudents();
const dbRooms = db.getRooms();
const dbSeats = db.getSeats();
const dbClasses = db.getClasses();
const dummyAllotment: Allotment = {
  id: 'test-allotment',
  name: 'Test Allotment Session',
  status: 'DRAFT',
  studentCount: dbStudents.length,
  roomCount: dbRooms.length,
  allocatedStudentsCount: 0,
  unallocatedStudentsCount: dbStudents.length,
  emptySeatsCount: dbSeats.length,
  splitGroupsCount: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const result = runAllocationEngine(dummyAllotment, dbStudents, dbRooms, dbSeats, dbClasses);

assert(result.validation.passed, 'Allocation engine validation passed');
assert(result.stats.allocatedStudents === dbStudents.length, `All ${dbStudents.length} students allocated successfully`);
assert(result.stats.unallocatedStudents === 0, '0 unallocated students');
assert(result.allocations.length === dbStudents.length, 'Allocation count matches student count');

// Check seat duplicate constraint
const seatIds = new Set(result.allocations.map((a) => a.seatId));
assert(seatIds.size === result.allocations.length, 'No seat was allocated twice');

// Check student duplicate constraint
const studentIds = new Set(result.allocations.map((a) => a.studentId));
assert(studentIds.size === result.allocations.length, 'No student was allocated twice');

console.log(`\n=== TEST SUMMARY: ${passes} Passed, ${fails} Failed ===`);
if (fails > 0) {
  process.exit(1);
} else {
  console.log('All core engine tests passed successfully!');
}
