import { useState, useEffect, useRef } from "react";
import {
  attackerPool,
  usernamePool,
  passwordPool,
  commandPool,
  fileDownloadPool,
  AttackerProfile
} from "../data/mockPools";

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

export function useAttackFeed() {
  const [events, setEvents] = useState<CowrieEvent[]>([]);
  const [stats, setStats] = useState<HoneypotStats>({
    totalAttacks: 14258,
    uniqueIPsCount: 427,
    topCountryName: "Russia",
    topCountryCode: "RU",
    topCountryCount: 4310,
    malwareCount: 184
  });

  // Track counts for live charts
  const [usernameCounts, setUsernameCounts] = useState<Record<string, number>>({});
  const [passwordCounts, setPasswordCounts] = useState<Record<string, number>>({});
  const [countryCounts, setCountryCounts] = useState<Record<string, number>>({});
  const [uniqueIPs, setUniqueIPs] = useState<Set<string>>(new Set());

  // Track latest attack event to pulse/ripple on the map
  const [latestEvent, setLatestEvent] = useState<CowrieEvent | null>(null);

  // References to keep the latest values in timeouts
  const uniqueIPsRef = useRef(uniqueIPs);
  const usernameCountsRef = useRef(usernameCounts);
  const passwordCountsRef = useRef(passwordCounts);
  const countryCountsRef = useRef(countryCounts);
  const statsRef = useRef(stats);

  // Helper to sync refs
  useEffect(() => {
    uniqueIPsRef.current = uniqueIPs;
    usernameCountsRef.current = usernameCounts;
    passwordCountsRef.current = passwordCounts;
    countryCountsRef.current = countryCounts;
    statsRef.current = stats;
  }, [uniqueIPs, usernameCounts, passwordCounts, countryCounts, stats]);

  // Generate a random single event
  const generateRandomEvent = (isHistorical = false): CowrieEvent => {
    const profile: AttackerProfile = attackerPool[Math.floor(Math.random() * attackerPool.length)];
    
    // Determine event type
    // 70% login failed, 20% command input, 10% file download
    const rand = Math.random();
    let eventid: CowrieEvent["eventid"] = "cowrie.login.failed";
    let username = "";
    let password = "";
    let input = "";
    let shasum = "";
    let filename = "";

    if (rand < 0.70) {
      eventid = "cowrie.login.failed";
      username = usernamePool[Math.floor(Math.random() * usernamePool.length)];
      password = passwordPool[Math.floor(Math.random() * passwordPool.length)];
    } else if (rand < 0.90) {
      eventid = "cowrie.command.input";
      input = commandPool[Math.floor(Math.random() * commandPool.length)];
      // Add standard credentials too just in case
      username = usernamePool[Math.floor(Math.random() * usernamePool.length)];
    } else {
      eventid = "cowrie.session.file_download";
      const file = fileDownloadPool[Math.floor(Math.random() * fileDownloadPool.length)];
      shasum = file.shasum;
      filename = file.filename;
    }

    // Timestamp calculation
    let timestampStr = new Date().toISOString();
    if (isHistorical) {
      // Subtract minutes to simulate previous activity
      const minutesAgo = Math.floor(Math.random() * 180) + 1; // up to 3 hours ago
      const historicalDate = new Date(Date.now() - minutesAgo * 60 * 1000);
      timestampStr = historicalDate.toISOString();
    }

    return {
      eventid,
      src_ip: profile.ip,
      country: profile.country,
      country_code: profile.countryCode,
      lat: profile.lat,
      lon: profile.lon,
      timestamp: timestampStr,
      ...(username ? { username } : {}),
      ...(password ? { password } : {}),
      ...(input ? { input } : {}),
      ...(shasum ? { shasum, filename } : {})
    };
  };

  // Populate historical data on load
  useEffect(() => {
    // Generate initial counts for charts
    const initialUsernames: Record<string, number> = {
      admin: 1540,
      root: 1321,
      user: 642,
      ubuntu: 489,
      pi: 395,
      support: 212,
      administrator: 198,
      guest: 145,
      test: 121,
      mysql: 98
    };

    const initialPasswords: Record<string, number> = {
      "123456": 1654,
      password: 1210,
      admin: 943,
      "12345678": 876,
      root: 612,
      "1234": 490,
      qwerty: 387,
      admin123: 245,
      pass123: 180,
      "12345": 142
    };

    const initialCountries: Record<string, number> = {
      Russia: 4310,
      China: 3824,
      "United States": 2104,
      Netherlands: 1450,
      Germany: 1102,
      Brazil: 840,
      India: 620,
      Ukraine: 531,
      Vietnam: 390,
      Turkey: 210
    };

    // Seed initial unique IPs list with existing IPs plus random ones
    const ipSet = new Set<string>();
    attackerPool.forEach(p => ipSet.add(p.ip));
    for (let i = 0; i < 400; i++) {
      ipSet.add(`193.56.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`);
    }

    setUsernameCounts(initialUsernames);
    setPasswordCounts(initialPasswords);
    setCountryCounts(initialCountries);
    setUniqueIPs(ipSet);

    // Create 40 initial events to populate feed immediately
    const historicalEvents: CowrieEvent[] = [];
    for (let i = 0; i < 40; i++) {
      historicalEvents.push(generateRandomEvent(true));
    }
    // Sort chronological so that when we display newest-at-top, it behaves correctly
    historicalEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setEvents(historicalEvents);

    // Set initial latest event
    if (historicalEvents.length > 0) {
      setLatestEvent(historicalEvents[0]);
    }
  }, []);

  // Set up live feed ticking
  useEffect(() => {
    let timerId: NodeJS.Timeout;

    const tick = () => {
      const nextEvent = generateRandomEvent(false);
      
      // Update state arrays
      setEvents(prev => {
        const updated = [nextEvent, ...prev];
        // Cap at 100 entries
        return updated.slice(0, 100);
      });

      setLatestEvent(nextEvent);

      // Extract details
      const { eventid, src_ip, country, username, password } = nextEvent;

      // Update credential counters if they exist
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

      // Update country count
      setCountryCounts(prev => ({
        ...prev,
        [country]: (prev[country] || 0) + 1
      }));

      // Update unique IPs
      const isNewIp = !uniqueIPsRef.current.has(src_ip);
      if (isNewIp) {
        setUniqueIPs(prev => {
          const nextSet = new Set(prev);
          nextSet.add(src_ip);
          return nextSet;
        });
      }

      // Update running stats
      setStats(prev => {
        const nextTotal = prev.totalAttacks + 1;
        const nextUnique = isNewIp ? prev.uniqueIPsCount + 1 : prev.uniqueIPsCount;
        const nextMalware = eventid === "cowrie.session.file_download" ? prev.malwareCount + 1 : prev.malwareCount;

        // Recalculate top country dynamically
        let currentTopCountry = prev.topCountryName;
        let currentTopCountryCode = prev.topCountryCode;
        let currentTopCount = prev.topCountryCount;

        // Simple check against updated counts
        const updatedCountryCount = (countryCountsRef.current[country] || 0) + 1;
        if (updatedCountryCount > currentTopCount) {
          currentTopCountry = country;
          // Find matching code
          const profile = attackerPool.find(p => p.country === country);
          currentTopCountryCode = profile ? profile.countryCode : "RU";
          currentTopCount = updatedCountryCount;
        }

        return {
          totalAttacks: nextTotal,
          uniqueIPsCount: nextUnique,
          topCountryName: currentTopCountry,
          topCountryCode: currentTopCountryCode,
          topCountryCount: currentTopCount,
          malwareCount: nextMalware
        };
      });

      // Schedule next event with a random delay of 2-5 seconds
      const nextDelay = Math.floor(Math.random() * 3000) + 2000; // 2000 to 5000 ms
      timerId = setTimeout(tick, nextDelay);
    };

    // Delay first tick slightly to allow UI to render stably
    timerId = setTimeout(tick, 3000);

    return () => {
      clearTimeout(timerId);
    };
  }, []);

  // Helper to format top chart data
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

  // Terminal commands feed (extracted from events)
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
