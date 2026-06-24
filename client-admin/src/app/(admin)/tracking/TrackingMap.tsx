import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface DriverLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: string;
  battery: number;
  speed: string;
  activeOrder: string;
}

interface TrackingMapProps {
  drivers: DriverLocation[];
  selectedDriverId?: string;
  onSelectDriver: (driverId: string) => void;
}

export default function TrackingMap({ drivers, selectedDriverId, onSelectDriver }: TrackingMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  // SVG Custom Pin (Lucide Navigation/Compass styled with brand primary blue #2563eb)
  const createDriverIcon = (name: string, isSelected: boolean) => {
    const color = isSelected ? "#ef4444" : "#2563eb"; // red pin for selected, blue for others
    return L.divIcon({
      className: "custom-leaflet-driver-pin",
      html: `
        <div style="transform: translate(-18px, -18px); width: 36px; height: 36px; display: flex; flex-col; items: center; justify-content: center; position: relative;">
          ${isSelected ? `<div style="absolute; inset: -4px; border-radius: 50%; background-color: rgba(239, 68, 68, 0.2); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>` : ""}
          <div style="background-color: ${color}; color: white; padding: 6px; border-radius: 50%; border: 2px solid white; box-shadow: 0px 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="transform: rotate(45deg);">
              <polygon points="3 11 22 2 13 21 11 13 3 11"/>
            </svg>
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });
  };

  // 1. Initialize Map instance
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Center of Bangalore by default
    const initialLat = 12.9716;
    const initialLng = 77.5946;

    const map = L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: false,
    }).setView([initialLat, initialLng], 13);

    mapInstanceRef.current = map;

    // Load OpenStreetMap Tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    // Cleanup on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersRef.current.clear();
      }
    };
  }, []);

  // 2. Synchronize active drivers markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const currentDriverIds = new Set(drivers.map((d) => d.id));
    const activeMarkers = markersRef.current;

    // Remove offline markers
    for (const [id, marker] of activeMarkers.entries()) {
      if (!currentDriverIds.has(id)) {
        marker.remove();
        activeMarkers.delete(id);
      }
    }

    // Add or update markers
    for (const driver of drivers) {
      const isSelected = selectedDriverId === driver.id;
      const markerIcon = createDriverIcon(driver.name, isSelected);

      if (activeMarkers.has(driver.id)) {
        const marker = activeMarkers.get(driver.id)!;
        marker.setLatLng([driver.lat, driver.lng]);
        marker.setIcon(markerIcon);
        
        // Keep selected marker popup content updated
        marker.setPopupContent(`
          <div style="font-family: sans-serif; font-size: 12px; padding: 4px;">
            <strong style="font-size: 13px;">${driver.name}</strong><br/>
            Speed: <strong>${driver.speed}</strong><br/>
            Battery: <strong>${driver.battery}%</strong>
          </div>
        `);
      } else {
        // Create new marker
        const marker = L.marker([driver.lat, driver.lng], { icon: markerIcon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family: sans-serif; font-size: 12px; padding: 4px;">
              <strong style="font-size: 13px;">${driver.name}</strong><br/>
              Speed: <strong>${driver.speed}</strong><br/>
              Battery: <strong>${driver.battery}%</strong>
            </div>
          `);

        marker.on("click", () => {
          onSelectDriver(driver.id);
        });

        activeMarkers.set(driver.id, marker);
      }
    }
  }, [drivers, selectedDriverId]);

  // 3. Auto-center map on selected driver
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedDriverId) return;

    const selectedDriver = drivers.find((d) => d.id === selectedDriverId);
    if (selectedDriver) {
      map.setView([selectedDriver.lat, selectedDriver.lng], map.getZoom() < 15 ? 15 : map.getZoom());
      
      const marker = markersRef.current.get(selectedDriverId);
      if (marker && !marker.isPopupOpen()) {
        marker.openPopup();
      }
    }
  }, [selectedDriverId]);

  return (
    <div className="relative w-full h-full bg-neutral-100 overflow-hidden">
      {/* Map Target Container */}
      <div ref={mapRef} className="w-full h-full z-0" />
      
      {/* CSS Animation Keyframes for custom selected pin radar pulse */}
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
}
