/**
 * Calculates the square perpendicular distance from a point to a line segment.
 * point format: [latitude, longitude, timestamp, speed, battery]
 */
export function getSqSegDist(p: number[], p1: number[], p2: number[]): number {
  let x = p1[0];
  let y = p1[1];
  let dx = p2[0] - x;
  let dy = p2[1] - y;

  if (dx !== 0 || dy !== 0) {
    const t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy);

    if (t > 1) {
      x = p2[0];
      y = p2[1];
    } else if (t > 0) {
      x += dx * t;
      y += dy * t;
    }
  }

  dx = p[0] - x;
  dy = p[1] - y;

  return dx * dx + dy * dy;
}

/**
 * Iterative Ramer-Douglas-Peucker algorithm using a stack.
 * Reduces the number of points in a curve.
 * points: array of [latitude, longitude, timestamp, speed, battery]
 */
export function simplifyRDP(points: number[][], tolerance: number): number[][] {
  if (points.length <= 2) return points;

  const sqTolerance = tolerance * tolerance;
  const len = points.length;
  const markers = new Uint8Array(len);
  
  // Always keep first and last points
  markers[0] = 1;
  markers[len - 1] = 1;

  const stack: [number, number][] = [[0, len - 1]];

  while (stack.length > 0) {
    const range = stack.pop()!;
    const first = range[0];
    const last = range[1];
    
    let maxSqDist = 0;
    let index = 0;

    for (let i = first + 1; i < last; i++) {
      const sqDist = getSqSegDist(points[i], points[first], points[last]);
      if (sqDist > maxSqDist) {
        index = i;
        maxSqDist = sqDist;
      }
    }

    if (maxSqDist > sqTolerance) {
      markers[index] = 1;
      
      if (index - first > 1) {
        stack.push([first, index]);
      }
      if (last - index > 1) {
        stack.push([index, last]);
      }
    }
  }

  const simplified: number[][] = [];
  for (let i = 0; i < len; i++) {
    if (markers[i] === 1) {
      simplified.push(points[i]);
    }
  }

  return simplified;
}

/**
 * Pre-filters stationary points where the driver hasn't moved much.
 * Always keeps the start, end, and points with significant speed/battery differences
 * or when the time gap exceeds maxTimeGapSec.
 */
export function preFilterPings(
  points: number[][],
  minDistanceDeg: number = 0.0001, // ~10-11 meters
  maxTimeGapSec: number = 300 // 5 minutes
): number[][] {
  if (points.length <= 2) return points;

  const filtered: number[][] = [];
  let lastKept = points[0];
  filtered.push(lastKept);

  const minDistanceSq = minDistanceDeg * minDistanceDeg;

  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i];
    
    // Distance change
    const dLat = p[0] - lastKept[0];
    const dLng = p[1] - lastKept[1];
    const distSq = dLat * dLat + dLng * dLng;

    // Time gap
    const timeGap = p[2] - lastKept[2];

    // Speed change (e.g. > 5 km/h difference)
    const speedDiff = Math.abs(p[3] - lastKept[3]);

    // Battery change (e.g. > 2% difference)
    const batteryDiff = Math.abs(p[4] - lastKept[4]);

    // Keep point if:
    // 1. Distance moved is greater than the threshold
    // 2. Speed has changed significantly
    // 3. Battery level has changed significantly
    // 4. We haven't recorded a point in the last 5 minutes (heartbeat)
    if (
      distSq >= minDistanceSq ||
      speedDiff > 5 ||
      batteryDiff > 2 ||
      timeGap >= maxTimeGapSec
    ) {
      filtered.push(p);
      lastKept = p;
    }
  }

  // Always keep the very last point to preserve the end of the shift
  filtered.push(points[points.length - 1]);

  return filtered;
}
