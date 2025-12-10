/**
 * Time Decay Attribution Model
 * Gives more credit to touchpoints closer to conversion
 */
export function timeDecayModel(touchpoints: any[]): number[] {
  if (touchpoints.length === 0) return [];
  if (touchpoints.length === 1) return [1.0];

  const firstTime = new Date(touchpoints[0].event_ts).getTime();
  const lastTime = new Date(touchpoints[touchpoints.length - 1].event_ts).getTime();
  const totalTime = lastTime - firstTime;

  if (totalTime === 0) {
    // All touchpoints at same time, use linear
    return new Array(touchpoints.length).fill(1.0 / touchpoints.length);
  }

  // Calculate weights based on time proximity to conversion
  const weights: number[] = [];
  let totalWeight = 0;

  for (const touchpoint of touchpoints) {
    const time = new Date(touchpoint.event_ts).getTime();
    const timeFromFirst = time - firstTime;
    const timeToConversion = lastTime - time;
    
    // More weight for touchpoints closer to conversion
    // Using exponential decay: weight = e^(-k * time_to_conversion)
    const k = 0.1; // Decay constant
    const weight = Math.exp(-k * (timeToConversion / (1000 * 60 * 60))); // Convert to hours
    weights.push(weight);
    totalWeight += weight;
  }

  // Normalize weights to sum to 1.0
  return weights.map(w => w / totalWeight);
}

