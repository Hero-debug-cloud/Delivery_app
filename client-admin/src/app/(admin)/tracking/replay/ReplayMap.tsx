import React, { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface ReplayMapProps {
  autoCenter?: boolean;
}

export interface ReplayMapRef {
  drawRoute: (pings: number[][]) => void;
  updateMarker: (lat: number, lng: number) => void;
  clearRoute: () => void;
}

const ReplayMap = forwardRef<ReplayMapRef, ReplayMapProps>(({ autoCenter = true }, ref) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const startMarkerRef = useRef<L.CircleMarker | null>(null);
  const endMarkerRef = useRef<L.CircleMarker | null>(null);

  // SVG Custom Pin for Replaying Driver (compass shape in primary blue)
  const driverIcon = L.divIcon({
    className: "custom-leaflet-driver-pin",
    html: `
      <div style="transform: translate(-18px, -18px); width: 36px; height: 36px; display: flex; items: center; justify-content: center; position: relative;">
        <div style="absolute; inset: -4px; border-radius: 50%; background-color: rgba(37, 99, 235, 0.2); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="background-color: #2563eb; color: white; padding: 6px; border-radius: 50%; border: 2px solid white; box-shadow: 0px 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="transform: rotate(45deg);">
            <polygon points="3 11 22 2 13 21 11 13 3 11"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });

  // 1. Initialize Map instance
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Center of Bangalore by default
    const map = L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: false,
    }).setView([12.9716, 77.5946], 13);

    mapInstanceRef.current = map;

    // Load OpenStreetMap Tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const clearRoute = () => {
    if (routePolylineRef.current) {
      routePolylineRef.current.remove();
      routePolylineRef.current = null;
    }
    if (startMarkerRef.current) {
      startMarkerRef.current.remove();
      startMarkerRef.current = null;
    }
    if (endMarkerRef.current) {
      endMarkerRef.current.remove();
      endMarkerRef.current = null;
    }
    if (driverMarkerRef.current) {
      driverMarkerRef.current.remove();
      driverMarkerRef.current = null;
    }
  };

  // 2. Expose imperative handles for parent page control
  useImperativeHandle(ref, () => ({
    drawRoute: (pings: number[][]) => {
      const map = mapInstanceRef.current;
      if (!map || pings.length === 0) return;

      // Clear existing overlays
      clearRoute();

      const coordinates = pings.map(p => [p[0], p[1]] as [number, number]);

      // 1. Draw route polyline
      routePolylineRef.current = L.polyline(coordinates, {
        color: "#2563eb",
        weight: 4,
        opacity: 0.8,
        dashArray: "2, 8" // dashed line showing complete history
      }).addTo(map);

      // 2. Add Start Marker (Green circle)
      const startPos = coordinates[0];
      startMarkerRef.current = L.circleMarker(startPos, {
        radius: 8,
        fillColor: "#10b981",
        color: "white",
        weight: 2,
        fillOpacity: 1,
      }).addTo(map).bindPopup("Shift Started Here");

      // 3. Add End Marker (Red circle)
      const endPos = coordinates[coordinates.length - 1];
      endMarkerRef.current = L.circleMarker(endPos, {
        radius: 8,
        fillColor: "#ef4444",
        color: "white",
        weight: 2,
        fillOpacity: 1,
      }).addTo(map).bindPopup("Shift Ended Here");

      // 4. Create active playing driver marker
      driverMarkerRef.current = L.marker(startPos, { icon: driverIcon }).addTo(map);

      // Fit map view bounds to cover the complete route
      const bounds = L.latLngBounds(coordinates);
      map.fitBounds(bounds, { padding: [40, 40] });
    },

    updateMarker: (lat: number, lng: number) => {
      const map = mapInstanceRef.current;
      if (!map) return;

      if (driverMarkerRef.current) {
        driverMarkerRef.current.setLatLng([lat, lng]);
      } else {
        driverMarkerRef.current = L.marker([lat, lng], { icon: driverIcon }).addTo(map);
      }

      if (autoCenter) {
        map.setView([lat, lng], map.getZoom());
      }
    },

    clearRoute
  }));

  return (
    <div className="relative w-full h-full bg-neutral-100 overflow-hidden">
      <div ref={mapRef} className="w-full h-full z-0" />
      <style jsx global>{`
        @keyframes ping {
          0% {
            transform: scale(0.6);
            opacity: 1;
          }
          100% {
            transform: scale(1.6);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
});

ReplayMap.displayName = "ReplayMap";
export default ReplayMap;
