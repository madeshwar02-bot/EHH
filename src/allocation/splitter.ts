import { AllocationGroup } from '../types';

export interface GroupChunk {
  groupId: string;
  className: string;
  subjectCode: string;
  studentIds: string[];
  chunkIndex: number;
  totalChunks: number;
  isSplit: boolean;
}

/**
 * Splits a group if its student count exceeds a target room capacity.
 */
export function splitGroupIfNeeded(group: AllocationGroup, maxChunkSize: number): GroupChunk[] {
  const studentIds = group.studentIds;
  if (studentIds.length <= maxChunkSize) {
    return [
      {
        groupId: group.id,
        className: group.className,
        subjectCode: group.subjectCode,
        studentIds,
        chunkIndex: 0,
        totalChunks: 1,
        isSplit: false,
      },
    ];
  }

  const chunks: GroupChunk[] = [];
  let index = 0;
  const totalChunks = Math.ceil(studentIds.length / maxChunkSize);

  for (let i = 0; i < studentIds.length; i += maxChunkSize) {
    const chunkIds = studentIds.slice(i, i + maxChunkSize);
    chunks.push({
      groupId: group.id,
      className: group.className,
      subjectCode: group.subjectCode,
      studentIds: chunkIds,
      chunkIndex: index,
      totalChunks,
      isSplit: true,
    });
    index++;
  }

  return chunks;
}
