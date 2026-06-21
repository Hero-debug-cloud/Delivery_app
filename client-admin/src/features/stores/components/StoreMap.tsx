import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface StoreMapProps {
  latitude?: number;
  longitude?: number;
  onLocationSelect: (lat: number, lng: number, address: string) => void;
  isConfirmed: boolean;
}

export default function StoreMap({ latitude, longitude, onLocationSelect, isConfirmed }: StoreMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerInstanceRef = useRef<L.Marker | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  // SVG Custom Pin (Lucide MapPin styled with brand primary blue #2563eb)
  const customIcon = L.divIcon({
    className: "custom-leaflet-pin-wrapper",
    html: `
      <div style="transform: translate(-16px, -32px); width: 32px; height: 32px; filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.3));">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="white" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0z"/>
          <circle cx="12" cy="10" r="3" fill="#2563eb"/>
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });

  // Reverse Geocoding helper using OpenStreetMap Nominatim
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      setIsResolving(true);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        {
          headers: {
            "Accept-Language": "en",
            "User-Agent": "LogiRoute-Admin-Dashboard/1.0",
          },
        }
      );
      if (!response.ok) throw new Error("Reverse geocoding failed");
      const data = await response.json();
      return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    } catch (err) {
      console.warn("Nominatim reverse geocoding failed, falling back to mock:", err);
      // Fallback local address if offline or rate-limited
      return `Hub location near (${lat.toFixed(5)}, ${lng.toFixed(5)})`;
    } finally {
      setIsResolving(false);
    }
  };

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Default coordinates: Bangalore center
    const initialLat = latitude || 12.9716;
    const initialLng = longitude || 77.5946;
    const zoom = latitude && longitude ? 15 : 13;

    // Initialize Leaflet Map
    const map = L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: false,
    }).setView([initialLat, initialLng], zoom);

    mapInstanceRef.current = map;

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    // Place initial marker if coords exist
    if (latitude && longitude) {
      const marker = L.marker([latitude, longitude], { icon: customIcon }).addTo(map);
      markerInstanceRef.current = marker;
    }

    // Map click handler to drop/move pin
    map.on("click", async (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;

      // Update or create marker
      if (markerInstanceRef.current) {
        markerInstanceRef.current.setLatLng([lat, lng]);
      } else {
        const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
        markerInstanceRef.current = marker;
      }

      // Pan to click
      map.panTo([lat, lng]);

      // Resolve Address
      const resolvedAddress = await reverseGeocode(lat, lng);
      onLocationSelect(lat, lng, resolvedAddress);
    });

    // Cleanup on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerInstanceRef.current = null;
      }
    };
  }, []);

  // Update map view when preset or coordinates change externally (e.g. preset search selection)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || latitude === undefined || longitude === undefined) return;

    const currentCenter = map.getCenter();
    const isDifferent = Math.abs(currentCenter.lat - latitude) > 0.0001 || Math.abs(currentCenter.lng - longitude) > 0.0001;

    if (isDifferent) {
      map.setView([latitude, longitude], 15);
      
      if (markerInstanceRef.current) {
        markerInstanceRef.current.setLatLng([latitude, longitude]);
      } else {
        const marker = L.marker([latitude, longitude], { icon: customIcon }).addTo(map);
        markerInstanceRef.current = marker;
      }
    }
  }, [latitude, longitude]);

  return (
    <div className="relative w-full h-[280px] bg-neutral-100 border border-neutral-200 rounded overflow-hidden">
      {/* Map Target Element */}
      <div ref={mapRef} className="w-full h-full z-0" />

      {/* Loading Overlay */}
      {isResolving && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10 pointer-events-none">
          <div className="flex items-center gap-2 bg-neutral-900/90 text-white text-[12px] px-3 py-1.5 rounded shadow">
            <svg className="animate-spin h-4.5 w-4.5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="font-semibold">Resolving address details...</span>
          </div>
        </div>
      )}
    </div>
  );
}
