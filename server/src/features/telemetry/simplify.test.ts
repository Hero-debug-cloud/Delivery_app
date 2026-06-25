import { describe, expect, test } from "bun:test";
import { getSqSegDist, simplifyRDP, preFilterPings } from "./simplify.ts";

describe("Telemetry Simplification Logic", () => {
  describe("getSqSegDist", () => {
    test("calculates perpendicular distance from point to segment", () => {
      const p = [0, 1]; // x=0, y=1
      const p1 = [0, 0];
      const p2 = [0, 2];
      
      // Point is exactly on the segment
      expect(getSqSegDist(p, p1, p2)).toBe(0);

      // Point is offset perpendicular to segment
      const pOffset = [1, 1]; // x=1, y=1
      expect(getSqSegDist(pOffset, p1, p2)).toBe(1); // 1^2 = 1
    });

    test("handles projection beyond segment ends correctly", () => {
      const p1 = [0, 0];
      const p2 = [0, 2];
      
      // Point projects before start
      const pBefore = [-1, -1];
      // Nearest point on segment should be p1 [0,0]. Sq distance is (-1-0)^2 + (-1-0)^2 = 2
      expect(getSqSegDist(pBefore, p1, p2)).toBe(2);

      // Point projects after end
      const pAfter = [1, 3];
      // Nearest point on segment should be p2 [0,2]. Sq distance is (1-0)^2 + (3-2)^2 = 2
      expect(getSqSegDist(pAfter, p1, p2)).toBe(2);
    });
  });

  describe("simplifyRDP", () => {
    test("keeps arrays of size <= 2 unchanged", () => {
      const empty: number[][] = [];
      const one = [[12.9, 77.5, 1000, 0, 80]];
      const two = [
        [12.9, 77.5, 1000, 0, 80],
        [12.91, 77.51, 1010, 10, 80]
      ];

      expect(simplifyRDP(empty, 0.01)).toEqual(empty);
      expect(simplifyRDP(one, 0.01)).toEqual(one);
      expect(simplifyRDP(two, 0.01)).toEqual(two);
    });

    test("simplifies collinear points in a straight line", () => {
      // 5 points in a perfectly straight diagonal line
      const points = [
        [0.0, 0.0, 100, 0, 80],
        [0.1, 0.1, 110, 0, 80],
        [0.2, 0.2, 120, 0, 80],
        [0.3, 0.3, 130, 0, 80],
        [0.4, 0.4, 140, 0, 80]
      ];

      // With tolerance = 0.01, collinear middle points should be removed
      const simplified = simplifyRDP(points, 0.01);
      expect(simplified.length).toBe(2);
      expect(simplified[0]).toEqual(points[0]);
      expect(simplified[1]).toEqual(points[4]);
    });

    test("keeps corner points when deviation exceeds tolerance", () => {
      // Track with a sharp turn at point 2
      const points = [
        [0.0, 0.0, 100, 0, 80],
        [0.1, 0.0, 110, 0, 80],
        [0.2, 0.5, 120, 0, 80], // Sharp deviation in longitude
        [0.3, 0.0, 130, 0, 80],
        [0.4, 0.0, 140, 0, 80]
      ];

      // Tolerance of 0.1 should detect the deviation at [0.2, 0.5] and keep it
      const simplified = simplifyRDP(points, 0.1);
      expect(simplified.length).toBe(3);
      expect(simplified[0]).toEqual(points[0]);
      expect(simplified[1]).toEqual(points[2]); // keeps corner point
      expect(simplified[2]).toEqual(points[4]);
    });
  });

  describe("preFilterPings", () => {
    test("filters out consecutive stationary points", () => {
      const points = [
        [12.9, 77.5, 1000, 0, 80],
        [12.9, 77.5, 1010, 0, 80], // duplicate
        [12.9, 77.5, 1020, 0, 80], // duplicate
        [12.9, 77.5, 1030, 0, 80], // duplicate
        [12.9, 77.5, 1040, 0, 80]  // last point is kept anyway
      ];

      const filtered = preFilterPings(points, 0.0001, 300);
      expect(filtered.length).toBe(2);
      expect(filtered[0]).toEqual(points[0]);
      expect(filtered[1]).toEqual(points[4]);
    });

    test("keeps point if distance threshold is exceeded", () => {
      const points = [
        [12.9, 77.5, 1000, 0, 80],
        [12.9, 77.5002, 1010, 0, 80], // moved ~22 meters (dist 0.0002 deg)
        [12.9, 77.5002, 1020, 0, 80]
      ];

      const filtered = preFilterPings(points, 0.0001, 300);
      expect(filtered.length).toBe(3);
    });

    test("keeps point if speed changes significantly", () => {
      const points = [
        [12.9, 77.5, 1000, 0, 80],
        [12.9, 77.5, 1010, 15, 80], // stationary in coordinates, but speed spiked to 15km/h
        [12.9, 77.5, 1020, 15, 80]
      ];

      const filtered = preFilterPings(points, 0.0001, 300);
      expect(filtered.length).toBe(3);
    });

    test("keeps point if battery level drops significantly", () => {
      const points = [
        [12.9, 77.5, 1000, 0, 80],
        [12.9, 77.5, 1010, 0, 77], // battery drops by 3%
        [12.9, 77.5, 1020, 0, 77]
      ];

      const filtered = preFilterPings(points, 0.0001, 300);
      expect(filtered.length).toBe(3);
    });

    test("keeps point if time gap exceeds threshold (heartbeat)", () => {
      const points = [
        [12.9, 77.5, 1000, 0, 80],
        [12.9, 77.5, 1310, 0, 80], // 310 seconds later (exceeds 300s limit)
        [12.9, 77.5, 1320, 0, 80]
      ];

      const filtered = preFilterPings(points, 0.0001, 300);
      expect(filtered.length).toBe(3);
    });
  });
});
