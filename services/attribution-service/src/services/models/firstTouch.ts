/**
 * First Touch Attribution Model
 * Gives 100% credit to the first touchpoint
 */
export function firstTouchModel(touchpointCount: number): number[] {
  const weights = new Array(touchpointCount).fill(0);
  weights[0] = 1.0; // First touchpoint gets 100%
  return weights;
}

