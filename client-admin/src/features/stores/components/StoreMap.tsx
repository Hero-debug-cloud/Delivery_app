import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface StoreMapProps {
  latitude?: number;
  longitude?: number;
  onLocationSelect: (lat: number, lng: number, address: string) => void;
  isConfirmed: boolean;
  catchmentPolygon?: string | null;
  onPolygonChange?: (wkt: string | null) => void;
}

// Helpers for WKT conversion
function parseWktPolygon(wkt: string): L.LatLngLiteral[] {
  const match = wkt.match(/POLYGON\s*\(\s*\(([^)]+)\)\s*\)/i);
  if (!match) return [];
  const coordsStr = match[1];
  const parts = coordsStr.split(",");
  // Map back to lat/lng. WKT is (lng lat)
  const coords = parts.map(part => {
    const [lngStr, latStr] = part.trim().split(/\s+/);
    return { lat: parseFloat(latStr), lng: parseFloat(lngStr) };
  });
  // Remove duplicate ending point if it closes
  if (coords.length > 1) {
    const first = coords[0];
    const last = coords[coords.length - 1];
    if (Math.abs(first.lat - last.lat) < 0.000001 && Math.abs(first.lng - last.lng) < 0.000001) {
      coords.pop();
    }
  }
  return coords;
}

function latLngsToWkt(latlngs: L.LatLngLiteral[]): string {
  if (latlngs.length < 3) return "";
  const points = [...latlngs];
  // Ensure closed
  const first = points[0];
  const last = points[points.length - 1];
  if (first.lat !== last.lat || first.lng !== last.lng) {
    points.push(first);
  }
  const coordsStr = points.map(p => `${p.lng.toFixed(6)} ${p.lat.toFixed(6)}`).join(", ");
  return `POLYGON((${coordsStr}))`;
}

export default function StoreMap({
  latitude,
  longitude,
  onLocationSelect,
  isConfirmed,
  catchmentPolygon,
  onPolygonChange,
}: StoreMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerInstanceRef = useRef<L.Marker | null>(null);
  const polygonInstanceRef = useRef<L.Polygon | null>(null);
  
  const [isResolving, setIsResolving] = useState(false);
  const [mode, setMode] = useState<"marker" | "polygon">("marker");
  const [polygonPoints, setPolygonPoints] = useState<L.LatLngLiteral[]>([]);
  const [customRadiusKm, setCustomRadiusKm] = useState<number>(5);

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
      return `Hub location near (${lat.toFixed(5)}, ${lng.toFixed(5)})`;
    } finally {
      setIsResolving(false);
    }
  };

  // Sync initial/existing polygon
  useEffect(() => {
    if (catchmentPolygon) {
      const parsed = parseWktPolygon(catchmentPolygon);
      setPolygonPoints(parsed);
    } else {
      setPolygonPoints([]);
    }
  }, [catchmentPolygon]);

  // Main Map Init
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const initialLat = latitude || 12.9716;
    const initialLng = longitude || 77.5946;
    const zoom = latitude && longitude ? 15 : 13;

    const map = L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: false,
    }).setView([initialLat, initialLng], zoom);

    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    if (latitude && longitude) {
      const marker = L.marker([latitude, longitude], { icon: customIcon }).addTo(map);
      markerInstanceRef.current = marker;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerInstanceRef.current = null;
        polygonInstanceRef.current = null;
      }
    };
  }, []);

  // Update map click listener when mode changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.off("click");
    map.on("click", async (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;

      if (mode === "marker") {
        if (markerInstanceRef.current) {
          markerInstanceRef.current.setLatLng([lat, lng]);
        } else {
          const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
          markerInstanceRef.current = marker;
        }
        map.panTo([lat, lng]);
        const resolvedAddress = await reverseGeocode(lat, lng);
        onLocationSelect(lat, lng, resolvedAddress);
      } else {
        // polygon mode: add point
        setPolygonPoints(prev => [...prev, { lat, lng }]);
      }
    });
  }, [mode, onLocationSelect]);

  // Update visual polygon when points change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (polygonPoints.length === 0) {
      if (polygonInstanceRef.current) {
        polygonInstanceRef.current.remove();
        polygonInstanceRef.current = null;
      }
      return;
    }

    if (polygonInstanceRef.current) {
      polygonInstanceRef.current.setLatLngs(polygonPoints);
    } else {
      const poly = L.polygon(polygonPoints, {
        color: "#2563eb",
        fillColor: "#3b82f6",
        fillOpacity: 0.2,
        weight: 3,
      }).addTo(map);
      polygonInstanceRef.current = poly;
    }

    // Call callback with new WKT
    if (onPolygonChange) {
      const wkt = latLngsToWkt(polygonPoints);
      onPolygonChange(wkt);
    }
  }, [polygonPoints, onPolygonChange]);

  // Update marker if lat/lng changes externally
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

  // Generate Hexagon Zone around center with custom radius
  const generateCustomCatchment = () => {
    const lat = latitude || 12.9716;
    const lng = longitude || 77.5946;
    const points: L.LatLngLiteral[] = [];
    const R = 6371000;
    const d = customRadiusKm * 1000; // custom radius in meters
    for (let i = 0; i < 6; i++) {
      const angle = (i * 60 * Math.PI) / 180;
      const dLat = (d * Math.cos(angle)) / R;
      const dLng = (d * Math.sin(angle)) / (R * Math.cos((lat * Math.PI) / 180));
      points.push({
        lat: lat + (dLat * 180) / Math.PI,
        lng: lng + (dLng * 180) / Math.PI,
      });
    }
    setPolygonPoints(points);
    // Pan out to fit the whole zone
    const map = mapInstanceRef.current;
    if (map) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds);
    }
  };

  const clearPolygon = () => {
    setPolygonPoints([]);
    if (onPolygonChange) {
      onPolygonChange(null);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Mode Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-neutral-50 border border-neutral-200/80 rounded-xl shadow-sm">
        {/* Left: Premium Segmented Mode Selector */}
        <div className="flex bg-neutral-200/70 p-0.5 rounded-lg border border-neutral-300/30 shadow-inner select-none">
          <button
            type="button"
            onClick={() => setMode("marker")}
            className={`px-3.5 py-1.5 rounded-md text-[11px] font-semibold transition-all duration-150 flex items-center gap-1.5 ${
              mode === "marker"
                ? "bg-white text-neutral-800 shadow-sm font-bold"
                : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            📍 Pin Location
          </button>
          <button
            type="button"
            onClick={() => setMode("polygon")}
            className={`px-3.5 py-1.5 rounded-md text-[11px] font-semibold transition-all duration-150 flex items-center gap-1.5 ${
              mode === "polygon"
                ? "bg-white text-neutral-800 shadow-sm font-bold"
                : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            ⬡ Boundary Area
          </button>
        </div>

        {/* Right: Mode-Specific Actions */}
        {mode === "polygon" ? (
          <div className="flex items-center gap-2 animate-fade-in">
            {/* Radius selector group */}
            <div className="flex items-center gap-1 bg-white border border-neutral-200 rounded-lg p-0.5 shadow-sm">
              <span className="text-[10px] text-neutral-400 font-semibold pl-1.5 select-none">Radius:</span>
              <input
                type="number"
                min="0.5"
                max="100"
                step="0.5"
                value={customRadiusKm}
                onChange={(e) => setCustomRadiusKm(Math.max(0.5, parseFloat(e.target.value) || 1))}
                className="w-10 text-center text-[11px] font-extrabold text-neutral-800 focus:outline-none bg-neutral-50 border border-neutral-200/50 rounded py-0.5 ml-1"
              />
              <span className="text-[10px] font-bold text-neutral-500 select-none pr-1.5">km</span>
              <button
                type="button"
                onClick={generateCustomCatchment}
                className="px-2.5 py-1 bg-primary-50 hover:bg-primary-100 active:bg-primary-200 text-primary-700 rounded-md text-[11px] font-extrabold transition-all border border-primary-100 shadow-sm cursor-pointer"
                title={`Generate operational hexagon with radius of ${customRadiusKm}km`}
              >
                ⚡ Auto Zone
              </button>
            </div>

            {polygonPoints.length > 0 && (
              <button
                type="button"
                onClick={clearPolygon}
                className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-600 border border-red-100 rounded-lg text-[11px] font-bold transition-all shadow-sm cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        ) : (
          <div className="text-[10.5px] text-neutral-400 font-semibold italic pr-1 select-none">
            click map to drop hub pin location
          </div>
        )}
      </div>

      <div className="relative w-full h-[280px] bg-neutral-100 border border-neutral-200 rounded overflow-hidden">
        {/* Map Target Element */}
        <div ref={mapRef} className="w-full h-full z-0" />

        {/* Mode Indicator Overlay */}
        <div className="absolute top-2 right-2 z-10 bg-white/90 backdrop-blur-sm px-2 py-1 rounded border border-neutral-200 shadow-sm pointer-events-none select-none">
          <span className="text-[10px] font-extrabold tracking-wider uppercase text-neutral-600">
            {mode === "marker" ? "📍 Location mode" : "⬡ Drawing mode (click map to add points)"}
          </span>
        </div>

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
    </div>
  );
}
