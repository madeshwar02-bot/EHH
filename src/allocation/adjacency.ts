import { Seat, SeatSide } from '../types';

export interface SeatCoordinate {
  seat: Seat;
  colIndex: number;
  row: number;
  side: SeatSide;
}

export function parseSeatLabel(label: string): { roomNumber: string; column: string; row: number; side: SeatSide } | null {
  // Pattern: ROOM-COLUMN-ROW-L/R (e.g., IB002-A-1-L)
  const parts = label.split('-');
  if (parts.length < 4) return null;
  const sideStr = parts[parts.length - 1];
  const rowNum = parseInt(parts[parts.length - 2], 10);
  const column = parts[parts.length - 3];
  const roomNumber = parts.slice(0, parts.length - 3).join('-');

  if (isNaN(rowNum) || (sideStr !== 'L' && sideStr !== 'R')) {
    return null;
  }

  return {
    roomNumber,
    column,
    row: rowNum,
    side: sideStr as SeatSide,
  };
}

/**
 * Calculates physical distance score between two seats in the same room.
 * Lower value = closer physical proximity.
 * Different rooms return Infinity.
 */
export function calculateSeatDistance(seatA: Seat, seatB: Seat): number {
  if (seatA.roomId !== seatB.roomId) {
    return Infinity;
  }

  const parseA = parseSeatLabel(seatA.seatLabel);
  const parseB = parseSeatLabel(seatB.seatLabel);

  if (!parseA || !parseB) return 1000;

  const colDiff = Math.abs(parseA.column.charCodeAt(0) - parseB.column.charCodeAt(0));
  const rowDiff = Math.abs(parseA.row - parseB.row);

  // 1. Same L/R pair (same col, same row, opposite L/R)
  if (colDiff === 0 && rowDiff === 0 && parseA.side !== parseB.side) {
    return 1;
  }

  // 2. Consecutive rows in same column
  if (colDiff === 0 && rowDiff === 1) {
    return 2 + (parseA.side === parseB.side ? 0.2 : 0);
  }

  // 3. Nearby rows in same column
  if (colDiff === 0) {
    return 2 + rowDiff * 2;
  }

  // 4. Adjacent columns
  if (colDiff === 1) {
    return 10 + rowDiff * 2;
  }

  return colDiff * 20 + rowDiff * 2;
}

/**
 * Returns neighbor seats for a given seat within a room.
 */
export function getAdjacentSeats(targetSeat: Seat, allRoomSeats: Seat[]): Seat[] {
  const parseTarget = parseSeatLabel(targetSeat.seatLabel);
  if (!parseTarget) return [];

  const neighbors: Seat[] = [];

  for (const s of allRoomSeats) {
    if (s.id === targetSeat.id) continue;
    const dist = calculateSeatDistance(targetSeat, s);
    if (dist <= 5) {
      neighbors.push(s);
    }
  }

  // Sort neighbors by closeness
  return neighbors.sort((a, b) => calculateSeatDistance(targetSeat, a) - calculateSeatDistance(targetSeat, b));
}

/**
 * Orders available room seats physically in standard traversal order:
 * Column A (Row 1 L, Row 1 R, Row 2 L, Row 2 R...)
 * Column B (Row 1 L, Row 1 R, Row 2 L, Row 2 R...)
 * etc.
 */
export function orderSeatsPhysically(seats: Seat[]): Seat[] {
  return [...seats].sort((a, b) => {
    const pA = parseSeatLabel(a.seatLabel);
    const pB = parseSeatLabel(b.seatLabel);

    if (!pA || !pB) return a.seatLabel.localeCompare(b.seatLabel);

    if (pA.column !== pB.column) {
      return pA.column.localeCompare(pB.column);
    }
    if (pA.row !== pB.row) {
      return pA.row - pB.row;
    }
    // L before R
    return pA.side === 'L' ? -1 : 1;
  });
}
