import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { CowrieEvent } from "../hooks/useAttackFeed";
import { getFlagEmoji } from "./StatsBar";
import { Crosshair, Navigation2 } from "lucide-react";

interface WorldMapProps {
  events: CowrieEvent[];
  latestEvent: CowrieEvent | null;
}

// Map Controller component to programmatically pan/fly to the latest event coordinates
function MapController({ latestEvent, autoPan }: { latestEvent: CowrieEvent | null; autoPan: boolean }) {
  const map = useMap();

  useEffect(() => {
    if (latestEvent && autoPan) {
      map.flyTo([latestEvent.lat, latestEvent.lon], 4, {
        animate: true,
        duration: 1.5
      });
    }
  }, [latestEvent, autoPan, map]);

  return null;
}

export default function WorldMap({ events, latestEvent }: WorldMapProps) {
  const [autoPan, setAutoPan] = useState(true);

  // Extract unique locations from active events to display on the map
  const uniqueLocationsMap: Record<string, {
    ip: string;
    country: string;
    country_code: string;
    lat: number;
    lon: number;
    count: number;
    lastEventId: string;
    lastTimestamp: string;
  }> = {};

  // Build aggregate data for markers from current events in memory
  events.forEach(event => {
    const key = event.src_ip;
    if (!uniqueLocationsMap[key]) {
      uniqueLocationsMap[key] = {
        ip: event.src_ip,
        country: event.country,
        country_code: event.country_code,
        lat: event.lat,
        lon: event.lon,
        count: 1,
        lastEventId: event.eventid,
        lastTimestamp: event.timestamp
      };
    } else {
      uniqueLocationsMap[key].count += 1;
    }
  });

  const locations = Object.values(uniqueLocationsMap);

  // Custom icon generator using DivIcon and Tailwind styling
  const createCustomMarker = (ip: string, count: number) => {
    const isLatest = latestEvent?.src_ip === ip;
    // Scale marker size based on attempt count (min 1x, max 2.5x)
    const scale = Math.min(1 + count * 0.15, 2.5);
    const dotSize = 8 * scale;
    const pulseSize = 24 * scale;

    return L.divIcon({
      className: "custom-glowing-marker",
      html: `
        <div class="relative flex items-center justify-center" style="width: ${pulseSize}px; height: ${pulseSize}px;">
          <!-- Glowing Pulse Waves -->
          <div class="absolute rounded-full bg-red-500/25 animate-ping" style="width: ${pulseSize}px; height: ${pulseSize}px; animation-duration: ${isLatest ? '0.8s' : '2.5s'};"></div>
          ${isLatest ? `
            <div class="absolute rounded-full bg-cyan-500/30 animate-ping" style="width: ${pulseSize * 1.5}px; height: ${pulseSize * 1.5}px; animation-duration: 1.2s;"></div>
          ` : ""}
          <div class="absolute rounded-full bg-red-500/40 animate-pulse" style="width: ${dotSize * 1.6}px; height: ${dotSize * 1.6}px;"></div>
          <!-- Solid Center Core -->
          <div class="bg-red-500 rounded-full border border-slate-100 shadow-[0_0_12px_rgba(239,68,68,1)]" style="width: ${dotSize}px; height: ${dotSize}px;"></div>
        </div>
      `,
      iconSize: [pulseSize, pulseSize],
      iconAnchor: [pulseSize / 2, pulseSize / 2]
    });
  };

  return (
    <div id="world-map-container" className="relative h-full w-full bg-surface-custom border border-border-custom rounded-lg overflow-hidden shadow-2xl flex flex-col">
      {/* Map Header / Controls */}
      <div className="absolute top-3 right-3 z-[1000] flex gap-2">
        <button
          id="toggle-autopan"
          onClick={() => setAutoPan(!autoPan)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono border transition-all duration-300 backdrop-blur-md ${
            autoPan
              ? "bg-cyan-950/80 border-accent-cyan/50 text-accent-cyan shadow-[0_0_10px_rgba(0,242,255,0.15)]"
              : "bg-surface-custom/80 border-border-custom text-slate-400 hover:text-slate-200"
          }`}
          title="Toggle automatic camera tracking of newest threat coordinates"
        >
          <Crosshair className={`w-3.5 h-3.5 ${autoPan ? "animate-spin" : ""}`} style={{ animationDuration: "6s" }} />
          <span>AUTO-PAN: {autoPan ? "ON" : "OFF"}</span>
        </button>
      </div>

      <div className="absolute top-3 left-3 z-[1000] bg-surface-custom/80 border border-border-custom px-3 py-1.5 rounded-lg backdrop-blur-md pointer-events-none">
        <p className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
          <Navigation2 className="w-3 h-3 text-accent-red rotate-45 animate-pulse" />
          <span>GLOBAL TARGET ACQUISITION</span>
        </p>
      </div>

      {/* Map Content */}
      <div className="flex-1 w-full min-h-[350px] relative z-10">
        <MapContainer
          center={[20, 10]}
          zoom={2}
          zoomControl={false}
          scrollWheelZoom={false}
          style={{ height: "100%", width: "100%", background: "#0a0e14" }}
        >
          {/* CartoDB Dark Matter base tiles */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {/* Map Controllers */}
          <MapController latestEvent={latestEvent} autoPan={autoPan} />

          {/* Render glowing markers for each unique IP */}
          {locations.map(loc => (
            <Marker
              key={loc.ip}
              position={[loc.lat, loc.lon]}
              icon={createCustomMarker(loc.ip, loc.count)}
            >
              <Popup>
                <div className="bg-surface-custom text-slate-200 border border-border-custom p-2.5 rounded-md font-mono text-xs max-w-xs shadow-xl leading-relaxed">
                  <div className="flex items-center gap-2 border-b border-border-custom pb-1.5 mb-1.5">
                    <span className="text-lg">{getFlagEmoji(loc.country_code)}</span>
                    <div>
                      <span className="font-bold text-accent-red">{loc.ip}</span>
                      <p className="text-[10px] text-slate-400">{loc.country}</p>
                    </div>
                  </div>
                  <div className="space-y-1 text-[10px]">
                    <p><span className="text-slate-500">Coordinates:</span> {loc.lat.toFixed(4)}, {loc.lon.toFixed(4)}</p>
                    <p><span className="text-slate-500">Attempt Count:</span> <span className="text-accent-cyan font-bold">{loc.count}</span></p>
                    <p><span className="text-slate-500">Last Action:</span> <span className="text-accent-red">{loc.lastEventId}</span></p>
                    <p><span className="text-slate-500">Time:</span> {new Date(loc.lastTimestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Map Footer status */}
      {latestEvent && (
        <div className="bg-surface-custom/90 border-t border-border-custom px-4 py-2 text-xs font-mono flex items-center justify-between text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-accent-red animate-ping"></span>
            <span>LATEST INTERCEPT:</span>
            <span className="text-accent-red font-bold">{latestEvent.src_ip}</span>
            <span>({latestEvent.country})</span>
          </div>
          <div className="text-[10px] text-slate-500 hidden sm:block">
            LAT: {latestEvent.lat} | LON: {latestEvent.lon}
          </div>
        </div>
      )}
    </div>
  );
}
