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

// Geolocation cache to avoid rate limits
const geoCache = new Map<string, { country: string; countryCode: string; lat: number; lon: number }>();

async function getGeoLocation(ip: string): Promise<{ country: string; countryCode: string; lat: number; lon: number } | null> {
  if (geoCache.has(ip)) {
    return geoCache.get(ip) || null;
  }

  try {
    const response = await fetch(`https://ip-api.com/json/${ip}?fields=country,countryCode,lat,lon`);
    const data = await response.json();

    if (data.status === "success") {
      const geo = {
        country: data.country,
        countryCode: data.countryCode,
        lat: data.lat,
        lon: data.lon
      };
      geoCache.set(ip, geo);
      return geo;
    }
  } catch (error) {
    console.error(`Failed to geolocate IP ${ip}:`, error);
  }

  return null;
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

    // const geo = await getGeoLocation(rawEvent.src_ip);
    const geo = {"country":"in", "countryCode":"IND", "lat":0, "lon":0}
    if (!geo) {
      return null;
    }

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

export function useAttackFeed() {
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
    };

    ws.onmessage = async (event) => {
      try {
        const message = JSON.parse(event.data);

        if (message.type === "cowrie_event") {
          const rawEvent = message.data;
          const enrichedEvent = await enrichCowrieEvent(rawEvent);
          if (!enrichedEvent) return;

          // Update events feed (keep last 50)
          setEvents(prev => {
            const updated = [enrichedEvent, ...prev];
            return updated.slice(0, 50);
          });

          setLatestEvent(enrichedEvent);

          const { eventid, src_ip, country, username, password } = enrichedEvent;

          // Update username counts
          if (username) {
            setUsernameCounts(prev => ({
              ...prev,
              [username]: (prev[username] || 0) + 1
            }));
          }

          // Update password counts
          if (password) {
            setPasswordCounts(prev => ({
              ...prev,
              [password]: (prev[password] || 0) + 1
            }));
          }

          // Update country counts
          setCountryCounts(prev => ({
            ...prev,
            [country]: (prev[country] || 0) + 1
          }));

          // Track unique IPs
          const isNewIp = !uniqueIPsRef.current.has(src_ip);
          if (isNewIp) {
            setUniqueIPs(prev => {
              const nextSet = new Set(prev);
              nextSet.add(src_ip);
              return nextSet;
            });
          }

          // Update statistics
          setStats(prev => {
            const nextTotal = prev.totalAttacks + 1;
            const nextUnique = isNewIp ? prev.uniqueIPsCount + 1 : prev.uniqueIPsCount;
            const nextMalware = eventid === "cowrie.session.file_download" ? prev.malwareCount + 1 : prev.malwareCount;

            // Find top country
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

  // Format top usernames for charts
  const getTopUsernames = (limit = 10) => {
    return Object.entries(usernameCounts)
      .map(([name, count]) => ({ name, count: count as number }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  };

  // Format top passwords for charts
  const getTopPasswords = (limit = 10) => {
    return Object.entries(passwordCounts)
      .map(([name, count]) => ({ name, count: count as number }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  };

  // Extract terminal commands from events
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