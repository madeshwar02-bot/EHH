import { Seat } from '../types';
import { calculateSeatDistance, parseSeatLabel } from './adjacency';

/**
 * Scores a contiguous block of seats.
 * Higher numerical score = better physical contiguity & compactness.
 */
export function scoreSeatBlock(seats: Seat[]): number {
  if (seats.length <= 1) return 100;

  let totalPairwiseDistance = 0;
  let count = 0;
  let sameColumnBonus = 0;
  let pairBonus = 0;

  for (let i = 0; i < seats.length; i++) {
    const parseI = parseSeatLabel(seats[i].seatLabel);
    for (let j = i + 1; j < seats.length; j++) {
      const parseJ = parseSeatLabel(seats[j].seatLabel);
      const dist = calculateSeatDistance(seats[i], seats[j]);
      totalPairwiseDistance += dist;
      count++;

      if (parseI && parseJ) {
        if (parseI.column === parseJ.column) {
          sameColumnBonus += 5;
        }
        if (parseI.column === parseJ.column && parseI.row === parseJ.row && parseI.side !== parseJ.side) {
          pairBonus += 20; // Exact L/R bench pair
        }
      }
    }
  }

  const avgDistance = count > 0 ? totalPairwiseDistance / count : 1;
  // Score formula: Higher is better
  const baseScore = 1000 - avgDistance * 10 + sameColumnBonus + pairBonus;
  return Math.max(0, baseScore);
}
