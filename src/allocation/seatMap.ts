import { Room, Seat } from '../types';
import { orderSeatsPhysically, parseSeatLabel } from './adjacency';

export interface RoomSeatMap {
  room: Room;
  seats: Seat[];
  availableSeats: Seat[];
  seatsByColumn: Map<string, Seat[]>;
}

export function buildRoomSeatMap(room: Room, roomSeats: Seat[], occupiedSeatIds: Set<string>): RoomSeatMap {
  const orderedSeats = orderSeatsPhysically(roomSeats);
  const availableSeats = orderedSeats.filter(
    (s) => s.status === 'AVAILABLE' && !occupiedSeatIds.has(s.id)
  );

  const seatsByColumn = new Map<string, Seat[]>();
  for (const s of availableSeats) {
    const parse = parseSeatLabel(s.seatLabel);
    const col = parse ? parse.column : 'A';
    if (!seatsByColumn.has(col)) {
      seatsByColumn.set(col, []);
    }
    seatsByColumn.get(col)!.push(s);
  }

  return {
    room,
    seats: orderedSeats,
    availableSeats,
    seatsByColumn,
  };
}
