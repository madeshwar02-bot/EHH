import { Student, ClassEntity, AllocationGroup } from '../types';

/**
 * Groups students strictly by CLASS + SUBJECT CODE.
 * CSE-A + CS501 is one group.
 * CSE-B + CS501 is a separate group.
 * ECE-A + EC501 is a separate group.
 */
export function groupStudents(
  students: Student[],
  classes: ClassEntity[],
  allotmentId: string
): AllocationGroup[] {
  const classMap = new Map<string, ClassEntity>();
  for (const c of classes) {
    classMap.set(c.id, c);
  }

  // Map key: `${classId}___${subjectCode}`
  const groupMap = new Map<string, Student[]>();

  for (const student of students) {
    const key = `${student.classId}___${student.subjectCode.trim().toUpperCase()}`;
    if (!groupMap.has(key)) {
      groupMap.set(key, []);
    }
    groupMap.get(key)!.push(student);
  }

  const groups: AllocationGroup[] = [];
  let index = 1;

  for (const [key, studentList] of groupMap.entries()) {
    const [classId, subjectCode] = key.split('___');
    const classObj = classMap.get(classId);
    const className = classObj ? classObj.name : classId;

    groups.push({
      id: `grp-${allotmentId}-${index}`,
      allotmentId,
      classId,
      className,
      subjectCode,
      studentCount: studentList.length,
      studentIds: studentList.map((s) => s.id),
    });
    index++;
  }

  // Sort groups by size descending for optimal bin-packing allocation
  return groups.sort((a, b) => b.studentCount - a.studentCount);
}
