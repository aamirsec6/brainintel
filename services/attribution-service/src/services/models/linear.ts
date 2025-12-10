/**
 * Linear Attribution Model
 * Distributes credit equally across all touchpoints
 */
export function linearModel(touchpointCount: number): number[] {
  const weight = 1.0 / touchpointCount;
  return new Array(touchpointCount).fill(weight);
}

