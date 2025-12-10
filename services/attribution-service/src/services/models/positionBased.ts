/**
 * Position-Based Attribution Model (U-Shaped)
 * Gives 40% to first touch, 40% to last touch, 20% distributed to middle touchpoints
 */
export function positionBasedModel(touchpointCount: number): number[] {
  if (touchpointCount === 0) return [];
  if (touchpointCount === 1) return [1.0];
  if (touchpointCount === 2) return [0.5, 0.5];

  const weights = new Array(touchpointCount).fill(0);
  
  // First touchpoint: 40%
  weights[0] = 0.4;
  
  // Last touchpoint: 40%
  weights[touchpointCount - 1] = 0.4;
  
  // Middle touchpoints: 20% distributed equally
  const middleWeight = 0.2 / (touchpointCount - 2);
  for (let i = 1; i < touchpointCount - 1; i++) {
    weights[i] = middleWeight;
  }

  return weights;
}

