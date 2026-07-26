import { useState, useEffect, useRef } from "react";

export interface CowrieEvent {
  eventid: "cowrie.login.failed" | "cowrie.command.input" | "cowrie.session.file_download";
  src_ip: string;
  country: string;
  country_code: string;
  lat: number;
  lon: number;
  timestamp: string;
  username?: string;
  password?: string;
  input?: string;
  shasum?: string;
  filename?: string;
}

export interface HoneypotStats {
  totalAttacks: number;
  uniqueIPsCount: number;
  topCountryName: string;
  topCountryCode: string;
  topCountryCount: number;
  malwareCount: number;
}

// Global geolocation state
let geoCache = new Map<string, { country: string; countryCode: string; lat: number; lon: number }>();
let geoQueue: string[] = [];
let isProcessingGeo = false;
let useRealGeolocation = false; // ← Toggle this in console!
const MAX_GEO_REQUESTS_PER_SECOND = 10;
const GEO_REQUEST_DELAY = Math.floor(1000 / MAX_GEO_REQUESTS_PER_SECOND);

// Common attacker countries (for instant random fallback)
const FALLBACK_LOCATIONS: Record<string, { country: string; countryCode: string; lat: number; lon: number }> = {
  'RU': { country: 'Russia', countryCode: 'RU', lat: 55.7558, lon: 37.6173 },
  'CN': { country: 'China', countryCode: 'CN', lat: 39.9042, lon: 116.4074 },
  'US': { country: 'United States', countryCode: 'US', lat: 37.0902, lon: -95.7129 },
  'NL': { country: 'Netherlands', countryCode: 'NL', lat: 52.1326, lon: 5.2913 },
  'DE': { country: 'Germany', countryCode: 'DE', lat: 51.1657, lon: 10.4515 },
  'BR': { country: 'Brazil', countryCode: 'BR', lat: -14.2350, lon: -51.9253 },
  'IN': { country: 'India', countryCode: 'IN', lat: 20.5937, lon: 78.9629 },
  'UA': { country: 'Ukraine', countryCode: 'UA', lat: 48.3794, lon: 31.1656 },
  'VN': { country: 'Vietnam', countryCode: 'VN', lat: 14.0583, lon: 108.2772 },
  'TR': { country: 'Turkey', countryCode: 'TR', lat: 38.9637, lon: 35.2433 },
  'IR': { country: 'Iran', countryCode: 'IR', lat: 32.4279, lon: 53.6880 },
  'RO': { country: 'Romania', countryCode: 'RO', lat: 45.9432, lon: 24.9668 },
  'GB': { country: 'United Kingdom', countryCode: 'GB', lat: 55.3781, lon: -3.4360 },
  'KR': { country: 'South Korea', countryCode: 'KR', lat: 35.9078, lon: 127.7669 },
  'SG': { country: 'Singapore', countryCode: 'SG', lat: 1.3521, lon: 103.8198 },
  'FR': { country: 'France', countryCode: 'FR', lat: 46.2276, lon: 2.2137 },
  'JP': { country: 'Japan', countryCode: 'JP', lat: 36.2048, lon: 138.2529 },
  'PL': { country: 'Poland', countryCode: 'PL', lat: 51.9194, lon: 19.1451 },
  'IT': { country: 'Italy', countryCode: 'IT', lat: 41.8719, lon: 12.5674 },
  'ES': { country: 'Spain', countryCode: 'ES', lat: 40.4637, lon: -3.7492 },
  'CA': { country: 'Canada', countryCode: 'CA', lat: 56.1304, lon: -106.3468 },
  'AU': { country: 'Australia', countryCode: 'AU', lat: -25.2744, lon: 133.7751 }
};

function isPrivateIP(ip: string): boolean {
  return /^(10\.|172\.16\.|192\.168\.|127\.|169\.254)/.test(ip);
}

function getRandomFallback() {
  const keys = Object.keys(FALLBACK_LOCATIONS);
  return FALLBACK_LOCATIONS[keys[Math.floor(Math.random() * keys.length)]];
}

// Fetch real geolocation
async function fetchGeoSingle(ip: string): Promise<{ country: string; countryCode: string; lat: number; lon: number } | null> {
  try {
    const response = await fetch(`https://ip-api.com/json/${ip}?fields=country,countryCode,lat,lon`, {
      signal: AbortSignal.timeout(2000)
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.status === "success") {
        return {
          country: data.country,
          countryCode: data.countryCode,
          lat: data.lat,
          lon: data.lon
        };
      }
    }
  } catch (e) {
    // Silently fail
  }

  // Fallback to ipinfo.io
  try {
    const response = await fetch(`https://ipinfo.io/${ip}/json`, {
      signal: AbortSignal.timeout(2000)
    });
    
    if (response.ok) {
      const data = await response.json();
      const [lat, lon] = (data.loc || '0,0').split(',').map(Number);
      return {
        country: data.country || 'Unknown',
        countryCode: data.country || 'XX',
        lat: lat || 0,
        lon: lon || 0
      };
    }
  } catch (e) {
    // Both APIs failed
  }

  return null;
}

// Start global geolocation processor
let geoProcessorInterval: NodeJS.Timeout | null = null;

function startGeoProcessor() {
  if (geoProcessorInterval) return;
  
  geoProcessorInterval = setInterval(async () => {
    if (isProcessingGeo || geoQueue.length === 0) return;
    
    isProcessingGeo = true;
    const ip = geoQueue.shift();
    
    if (!ip) {
      isProcessingGeo = false;
      return;
    }

    if (geoCache.has(ip)) {
      isProcessingGeo = false;
      return;
    }

    const geo = await fetchGeoSingle(ip);
    
    if (geo) {
      geoCache.set(ip, geo);
      console.log(`[Geo] Resolved ${ip} → ${geo.country} (queue: ${geoQueue.length})`);
    } else {
      const fallback = getRandomFallback();
      geoCache.set(ip, fallback);
    }

    isProcessingGeo = false;
  }, GEO_REQUEST_DELAY);
}

function queueGeoLocation(ip: string) {
  if (geoCache.has(ip) || isPrivateIP(ip)) {
    if (isPrivateIP(ip)) {
      geoCache.set(ip, getRandomFallback());
    }
    return;
  }

  if (!geoQueue.includes(ip)) {
    geoQueue.push(ip);
  }

  startGeoProcessor();
}

async function getGeoLocation(ip: string): Promise<{ country: string; countryCode: string; lat: number; lon: number }> {
  // Already cached - always use it
  if (geoCache.has(ip)) {
    return geoCache.get(ip)!;
  }

  // Private IP - instant fallback
  if (isPrivateIP(ip)) {
    const fallback = getRandomFallback();
    geoCache.set(ip, fallback);
    return fallback;
  }

  // If real geolocation is OFF, return random immediately
  if (!useRealGeolocation) {
    const fallback = getRandomFallback();
    geoCache.set(ip, fallback);
    // Still queue it in background for when it's switched ON
    queueGeoLocation(ip);
    return fallback;
  }

  // Real geolocation is ON - queue for processing
  queueGeoLocation(ip);
  
  // Return random while real data loads
  const fallback = getRandomFallback();
  return fallback;
}

async function enrichCowrieEvent(rawEvent: any): Promise<CowrieEvent | null> {
  try {
    let eventid: CowrieEvent["eventid"] = "cowrie.login.failed";

    if (rawEvent.eventid === "cowrie.login.failed") {
      eventid = "cowrie.login.failed";
    } else if (rawEvent.eventid === "cowrie.command.input") {
      eventid = "cowrie.command.input";
    } else if (rawEvent.eventid === "cowrie.session.file_download") {
      eventid = "cowrie.session.file_download";
    } else {
      return null;
    }

    const geo = await getGeoLocation(rawEvent.src_ip);

    const enrichedEvent: CowrieEvent = {
      eventid,
      src_ip: rawEvent.src_ip,
      country: geo.country,
      country_code: geo.countryCode,
      lat: geo.lat,
      lon: geo.lon,
      timestamp: rawEvent.timestamp || new Date().toISOString(),
      ...(rawEvent.username ? { username: rawEvent.username } : {}),
      ...(rawEvent.password ? { password: rawEvent.password } : {}),
      ...(rawEvent.input ? { input: rawEvent.input } : {}),
      ...(rawEvent.shasum ? { shasum: rawEvent.shasum, filename: rawEvent.filename } : {})
    };

    return enrichedEvent;
  } catch (error) {
    console.error("Error enriching event:", error);
    return null;
  }
}

// Expose console commands for toggling
if (typeof window !== 'undefined') {
  (window as any).honeypot = {
    enableRealGeo: () => {
      useRealGeolocation = true;
      console.log(`Real geolocation ENABLED (${geoCache.size} cached, ${geoQueue.length} queued)`);
    },
    disableRealGeo: () => {
      useRealGeolocation = false;
      console.log(`Real geolocation DISABLED - using random fallback`);
    },
    toggleGeo: () => {
      useRealGeolocation = !useRealGeolocation;
      console.log(`${useRealGeolocation ? 'ENABLED' : 'DISABLED'} - Cached: ${geoCache.size}, Queued: ${geoQueue.length}`);
    },
    status: () => {
      console.log(`
🗺️  Geolocation Status:
  Mode: ${useRealGeolocation ? 'REAL GEOLOCATION' : 'RANDOM FALLBACK'}
  Cached IPs: ${geoCache.size}
  Queued IPs: ${geoQueue.length}
  Processing: ${isProcessingGeo ? 'Yes' : 'No'}
  Queue Speed: ${MAX_GEO_REQUESTS_PER_SECOND} req/sec
      `);
    },
    clearCache: () => {
      geoCache.clear();
      geoQueue = [];
      console.log('🧹 Cache cleared');
    }
  };
}

export function useAttackFeed() {
  const getWSUrl = (): string => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    return `${protocol}//${host}/ws`;
  };

  const wsUrl = "wss://skm183.is-a.dev/ws";

  const [events, setEvents] = useState<CowrieEvent[]>([]);
  const [stats, setStats] = useState<HoneypotStats>({
    totalAttacks: 0,
    uniqueIPsCount: 0,
    topCountryName: "Connecting...",
    topCountryCode: "XX",
    topCountryCount: 0,
    malwareCount: 0
  });

  const [usernameCounts, setUsernameCounts] = useState<Record<string, number>>({});
  const [passwordCounts, setPasswordCounts] = useState<Record<string, number>>({});
  const [countryCounts, setCountryCounts] = useState<Record<string, number>>({});
  const [uniqueIPs, setUniqueIPs] = useState<Set<string>>(new Set());
  const [latestEvent, setLatestEvent] = useState<CowrieEvent | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const uniqueIPsRef = useRef(uniqueIPs);
  const countryCountsRef = useRef(countryCounts);
  const statsRef = useRef(stats);

  useEffect(() => {
    uniqueIPsRef.current = uniqueIPs;
    countryCountsRef.current = countryCounts;
    statsRef.current = stats;
  }, [uniqueIPs, countryCounts, stats]);

  useEffect(() => {
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log(`[Cowrie Monitor] Connected to WebSocket: ${wsUrl}`);
      console.log(`[Honeypot] Type "honeypot.enableRealGeo()" to enable real geolocation`);
      console.log(`[Honeypot] Type "honeypot.status()" to check status`);
    };

    ws.onmessage = async (event) => {
      try {
        const message = JSON.parse(event.data);

        if (message.type === "cowrie_event") {
          const rawEvent = message.data;
          const enrichedEvent = await enrichCowrieEvent(rawEvent);
          if (!enrichedEvent) return;

          setEvents(prev => {
            const updated = [enrichedEvent, ...prev];
            return updated.slice(0, 50);
          });

          setLatestEvent(enrichedEvent);

          const { eventid, src_ip, country, username, password } = enrichedEvent;

          if (username) {
            setUsernameCounts(prev => ({
              ...prev,
              [username]: (prev[username] || 0) + 1
            }));
          }

          if (password) {
            setPasswordCounts(prev => ({
              ...prev,
              [password]: (prev[password] || 0) + 1
            }));
          }

          setCountryCounts(prev => ({
            ...prev,
            [country]: (prev[country] || 0) + 1
          }));

          const isNewIp = !uniqueIPsRef.current.has(src_ip);
          if (isNewIp) {
            setUniqueIPs(prev => {
              const nextSet = new Set(prev);
              nextSet.add(src_ip);
              return nextSet;
            });
          }

          setStats(prev => {
            const nextTotal = prev.totalAttacks + 1;
            const nextUnique = isNewIp ? prev.uniqueIPsCount + 1 : prev.uniqueIPsCount;
            const nextMalware = eventid === "cowrie.session.file_download" ? prev.malwareCount + 1 : prev.malwareCount;

            let topCountry = prev.topCountryName;
            let topCountryCode = prev.topCountryCode;
            let topCount = prev.topCountryCount;

            const updatedCountryCount = (countryCountsRef.current[country] || 0) + 1;
            if (updatedCountryCount > topCount) {
              topCountry = country;
              topCountryCode = enrichedEvent.country_code;
              topCount = updatedCountryCount;
            }

            return {
              totalAttacks: nextTotal,
              uniqueIPsCount: nextUnique,
              topCountryName: topCountry,
              topCountryCode: topCountryCode,
              topCountryCount: topCount,
              malwareCount: nextMalware
            };
          });
        }
      } catch (error) {
        console.error("[Cowrie Monitor] Error processing message:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("[Cowrie Monitor] WebSocket error:", error);
    };

    ws.onclose = () => {
      console.log("[Cowrie Monitor] WebSocket disconnected");
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, [wsUrl]);

  const getTopUsernames = (limit = 10) => {
    return Object.entries(usernameCounts)
      .map(([name, count]) => ({ name, count: count as number }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  };

  const getTopPasswords = (limit = 10) => {
    return Object.entries(passwordCounts)
      .map(([name, count]) => ({ name, count: count as number }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  };

  const getTerminalCommands = () => {
    return events
      .filter(e => e.eventid === "cowrie.command.input" || e.eventid === "cowrie.session.file_download")
      .map(e => ({
        timestamp: e.timestamp,
        ip: e.src_ip,
        country: e.country,
        countryCode: e.country_code,
        command: e.eventid === "cowrie.command.input" ? e.input : `downloaded: ${e.filename} (${e.shasum?.slice(0, 8)}...)`
      }));
  };

  return {
    events,
    stats,
    topUsernames: getTopUsernames(),
    topPasswords: getTopPasswords(),
    terminalCommands: getTerminalCommands(),
    latestEvent
  };
}