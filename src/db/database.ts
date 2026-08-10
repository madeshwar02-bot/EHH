import fs from 'fs';
import path from 'path';
import {
  User,
  Program,
  ClassEntity,
  Room,
  Seat,
  Student,
  Allotment,
  AllocationGroup,
  StudentAllocation,
} from '../types';

interface DatabaseSchema {
  users: User[];
  programs: Program[];
  classes: ClassEntity[];
  rooms: Room[];
  seats: Seat[];
  students: Student[];
  allotments: Allotment[];
  allocationGroups: AllocationGroup[];
  studentAllocations: StudentAllocation[];
}

const DB_FILE = path.join(process.cwd(), 'data', 'db.json');

class DatabaseEngine {
  private data: DatabaseSchema = {
    users: [],
    programs: [],
    classes: [],
    rooms: [],
    seats: [],
    students: [],
    allotments: [],
    allocationGroups: [],
    studentAllocations: [],
  };

  constructor() {
    this.init();
  }

  private init() {
    try {
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        // Ensure default properties exist if schema expanded
        this.data.users = this.data.users || [];
        this.data.programs = this.data.programs || [];
        this.data.classes = this.data.classes || [];
        this.data.rooms = this.data.rooms || [];
        this.data.seats = this.data.seats || [];
        this.data.students = this.data.students || [];
        this.data.allotments = this.data.allotments || [];
        this.data.allocationGroups = this.data.allocationGroups || [];
        this.data.studentAllocations = this.data.studentAllocations || [];
      } else {
        this.seedInitialData();
        this.save();
      }
    } catch (err) {
      console.error('Error initializing database file, resetting to initial seed:', err);
      this.seedInitialData();
      this.save();
    }
  }

  public save() {
    try {
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save DB file:', err);
    }
  }

  public seedInitialData() {
    const now = new Date().toISOString();

    // Default admin user
    this.data.users = [
      {
        id: 'u-admin',
        email: 'admin@university.edu',
        name: 'Exam Cell Admin',
        role: 'ADMIN',
        createdAt: now,
      },
    ];

    // Initial Programs
    const defaultPrograms = [
      { id: 'prog-cse', name: 'Computer Science & Engineering', code: 'CSE', status: 'ACTIVE' as const },
      { id: 'prog-ece', name: 'Electronics & Communication Engineering', code: 'ECE', status: 'ACTIVE' as const },
      { id: 'prog-eee', name: 'Electrical & Electronics Engineering', code: 'EEE', status: 'ACTIVE' as const },
      { id: 'prog-mech', name: 'Mechanical Engineering', code: 'MECH', status: 'ACTIVE' as const },
      { id: 'prog-civil', name: 'Civil Engineering', code: 'CIVIL', status: 'ACTIVE' as const },
      { id: 'prog-it', name: 'Information Technology', code: 'IT', status: 'ACTIVE' as const },
      { id: 'prog-aids', name: 'Artificial Intelligence & Data Science', code: 'AIDS', status: 'ACTIVE' as const },
      { id: 'prog-aiml', name: 'Artificial Intelligence & Machine Learning', code: 'AIML', status: 'ACTIVE' as const },
      { id: 'prog-bca', name: 'Bachelor of Computer Applications', code: 'BCA', status: 'ACTIVE' as const },
      { id: 'prog-mca', name: 'Master of Computer Applications', code: 'MCA', status: 'ACTIVE' as const },
    ];
    this.data.programs = defaultPrograms.map((p) => ({ ...p, createdAt: now, updatedAt: now }));

    // Initial Classes
    const defaultClasses = [
      { id: 'cls-cse-a', name: 'CSE-A', programId: 'prog-cse', year: 3, section: 'A', status: 'ACTIVE' as const },
      { id: 'cls-cse-b', name: 'CSE-B', programId: 'prog-cse', year: 3, section: 'B', status: 'ACTIVE' as const },
      { id: 'cls-ece-a', name: 'ECE-A', programId: 'prog-ece', year: 3, section: 'A', status: 'ACTIVE' as const },
      { id: 'cls-ece-b', name: 'ECE-B', programId: 'prog-ece', year: 3, section: 'B', status: 'ACTIVE' as const },
      { id: 'cls-eee-a', name: 'EEE-A', programId: 'prog-eee', year: 3, section: 'A', status: 'ACTIVE' as const },
      { id: 'cls-it-a', name: 'IT-A', programId: 'prog-it', year: 3, section: 'A', status: 'ACTIVE' as const },
      { id: 'cls-aids-a', name: 'AIDS-A', programId: 'prog-aids', year: 2, section: 'A', status: 'ACTIVE' as const },
      { id: 'cls-mech-a', name: 'MECH-A', programId: 'prog-mech', year: 4, section: 'A', status: 'ACTIVE' as const },
    ];
    this.data.classes = defaultClasses.map((c) => ({ ...c, createdAt: now, updatedAt: now }));

    // Initial University Rooms: 6 floors, 12 rooms per floor = 72 rooms total
    // Building: "Instruction Block" (IB)
    this.data.rooms = [];
    this.data.seats = [];

    const colLabels = ['A', 'B', 'C', 'D']; // 4 columns
    const totalRows = 5; // 5 rows per column
    // Each row in a column has L and R side = 2 seats per row per column = 10 seats per column = 40 seats capacity per room

    let roomCounter = 1;
    for (let floor = 1; floor <= 6; floor++) {
      for (let rIndex = 1; rIndex <= 12; rIndex++) {
        const roomNum = `IB${floor}${rIndex < 10 ? '0' + rIndex : rIndex}`;
        const roomId = `room-${roomNum}`;
        const capacity = colLabels.length * totalRows * 2; // 40

        const room: Room = {
          id: roomId,
          roomNumber: roomNum,
          building: 'Instruction Block',
          floor: floor,
          capacity: capacity,
          columns: colLabels.length,
          rows: totalRows,
          status: 'AVAILABLE',
          createdAt: now,
          updatedAt: now,
        };
        this.data.rooms.push(room);

        // Generate seats for this room automatically
        // Pattern: ROOM-COLUMN-ROW-L/R (e.g. IB101-A-1-L)
        for (const col of colLabels) {
          for (let row = 1; row <= totalRows; row++) {
            for (const side of ['L', 'R'] as const) {
              const seatLabel = `${roomNum}-${col}-${row}-${side}`;
              const seat: Seat = {
                id: `seat-${seatLabel}`,
                roomId: roomId,
                column: col,
                row: row,
                side: side,
                seatLabel: seatLabel,
                status: 'AVAILABLE',
                createdAt: now,
              };
              this.data.seats.push(seat);
            }
          }
        }
        roomCounter++;
      }
    }

    // Seed sample students for testing grouping and allotment
    this.data.students = [];
    const sampleSpecs = [
      { classId: 'cls-cse-a', className: 'CSE-A', programId: 'prog-cse', year: 3, section: 'A', subjectCode: 'CS501', count: 32, regPrefix: '24CS00' },
      { classId: 'cls-cse-b', className: 'CSE-B', programId: 'prog-cse', year: 3, section: 'B', subjectCode: 'CS501', count: 28, regPrefix: '24CS10' },
      { classId: 'cls-ece-a', className: 'ECE-A', programId: 'prog-ece', year: 3, section: 'A', subjectCode: 'EC501', count: 30, regPrefix: '24EC00' },
      { classId: 'cls-ece-b', className: 'ECE-B', programId: 'prog-ece', year: 3, section: 'B', subjectCode: 'EC501', count: 25, regPrefix: '24EC10' },
      { classId: 'cls-eee-a', className: 'EEE-A', programId: 'prog-eee', year: 3, section: 'A', subjectCode: 'EE501', count: 22, regPrefix: '24EE00' },
      { classId: 'cls-it-a', className: 'IT-A', programId: 'prog-it', year: 3, section: 'A', subjectCode: 'IT501', count: 35, regPrefix: '24IT00' },
      { classId: 'cls-aids-a', className: 'AIDS-A', programId: 'prog-aids', year: 2, section: 'A', subjectCode: 'AD301', count: 20, regPrefix: '24AD00' },
    ];

    const firstNames = ['Arun', 'Bhavya', 'Chetan', 'Divya', 'Eshwar', 'Farhan', 'Gautam', 'Harini', 'Irfan', 'Jaya', 'Kiran', 'Lokesh', 'Manoj', 'Naveen', 'Ojas', 'Pooja', 'Rahul', 'Sneha', 'Tanya', 'Varun', 'Yash', 'Zoya', 'Anand', 'Deepak', 'Gita', 'Kavita', 'Mohan', 'Priya', 'Rohan', 'Swati'];
    const lastNames = ['Kumar', 'Sharma', 'Reddy', 'Patel', 'Singh', 'Rao', 'Verma', 'Nair', 'Iyer', 'Joshi', 'Gupta', 'Deshmukh', 'Das', 'Chatterjee', 'Bhat', 'Shetty', 'Pillai', 'Mehta'];

    let sIndex = 1;
    for (const spec of sampleSpecs) {
      for (let i = 1; i <= spec.count; i++) {
        const fn = firstNames[i % firstNames.length];
        const ln = lastNames[(i * 3) % lastNames.length];
        const regNum = `${spec.regPrefix}${i < 10 ? '0' + i : i}`;
        this.data.students.push({
          id: `std-${sIndex}`,
          registerNumber: regNum,
          name: `${fn} ${ln}`,
          programId: spec.programId,
          classId: spec.classId,
          year: spec.year,
          section: spec.section,
          subjectCode: spec.subjectCode,
          createdAt: now,
        });
        sIndex++;
      }
    }

    // Default initial draft allotment session
    this.data.allotments = [
      {
        id: 'allot-default',
        name: 'Fall Semester End Examinations Allotment',
        status: 'DRAFT',
        studentCount: this.data.students.length,
        roomCount: this.data.rooms.length,
        allocatedStudentsCount: 0,
        unallocatedStudentsCount: this.data.students.length,
        emptySeatsCount: this.data.seats.length,
        splitGroupsCount: 0,
        createdAt: now,
        updatedAt: now,
      },
    ];

    this.data.allocationGroups = [];
    this.data.studentAllocations = [];
  }

  // Getters
  public getUsers() { return this.data.users; }
  public getPrograms() { return this.data.programs; }
  public getClasses() { return this.data.classes; }
  public getRooms() { return this.data.rooms; }
  public getSeats() { return this.data.seats; }
  public getStudents() { return this.data.students; }
  public getAllotments() { return this.data.allotments; }
  public getAllocationGroups() { return this.data.allocationGroups; }
  public getStudentAllocations() { return this.data.studentAllocations; }

  // Setters/Updaters with automatic persistence
  public setPrograms(items: Program[]) { this.data.programs = items; this.save(); }
  public setClasses(items: ClassEntity[]) { this.data.classes = items; this.save(); }
  public setRooms(items: Room[]) { this.data.rooms = items; this.save(); }
  public setSeats(items: Seat[]) { this.data.seats = items; this.save(); }
  public setStudents(items: Student[]) { this.data.students = items; this.save(); }
  public setAllotments(items: Allotment[]) { this.data.allotments = items; this.save(); }
  public setAllocationGroups(items: AllocationGroup[]) { this.data.allocationGroups = items; this.save(); }
  public setStudentAllocations(items: StudentAllocation[]) { this.data.studentAllocations = items; this.save(); }
}

export const db = new DatabaseEngine();
