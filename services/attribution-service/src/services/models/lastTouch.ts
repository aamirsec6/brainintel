/**
 * Last Touch Attribution Model
 * Gives 100% credit to the last touchpoint
 */
export function lastTouchModel(touchpointCount: number): number[] {
  const weights = new Array(touchpointCount).fill(0);
  weights[touchpointCount - 1] = 1.0; // Last touchpoint gets 100%
  return weights;
}

