import { Room, Seat } from '../types';

export function getAvailableRooms(rooms: Room[], seats: Seat[]): Room[] {
  // Only use AVAILABLE rooms with at least 1 AVAILABLE seat
  const availableRoomIds = new Set<string>();
  for (const s of seats) {
    if (s.status === 'AVAILABLE') {
      availableRoomIds.add(s.roomId);
    }
  }

  return rooms.filter(
    (r) => r.status === 'AVAILABLE' && availableRoomIds.has(r.id)
  );
}

/**
 * Orders rooms sequentially by Floor -> Room Number for consistent, standard room usage.
 */
export function sortRoomsSequential(rooms: Room[]): Room[] {
  return [...rooms].sort((a, b) => {
    if (a.floor !== b.floor) {
      return a.floor - b.floor;
    }
    return a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true });
  });
}
