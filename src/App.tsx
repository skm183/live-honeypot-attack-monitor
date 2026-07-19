import { useAttackFeed } from "./hooks/useAttackFeed";
import StatsBar from "./components/StatsBar";
import WorldMap from "./components/WorldMap";
import LiveFeed from "./components/LiveFeed";
import CredentialCharts from "./components/CredentialCharts";
import TerminalFeed from "./components/TerminalFeed";
import { ShieldCheck, Cpu, Radio, Zap, Clock, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";

export default function App() {
  const {
    events,
    stats,
    topUsernames,
    topPasswords,
    terminalCommands,
    latestEvent
  } = useAttackFeed();

  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current display time in the SOC header
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen w-full bg-bg-dark text-slate-200 flex flex-col selection:bg-accent-red/30 selection:text-accent-red">
      
      {/* BACKGROUND DECORATIVE GRID */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#1a2332_1px,transparent_1px),linear-gradient(to_bottom,#1a2332_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-15 pointer-events-none z-0"></div>

      {/* HEADER BAR */}
      <header className="relative z-10 border-b border-border-custom bg-surface-custom/80 backdrop-blur-md px-6 py-4 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Title & Pulse */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-accent-red/10 border border-accent-red/25 text-accent-red rounded-lg shadow-[0_0_15px_rgba(255,62,62,0.1)]">
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-sans font-extrabold tracking-tight text-white uppercase">
                  Live Honeypot Attack Monitor
                </h1>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-accent-red/10 border border-accent-red/25">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-red opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-red"></span>
                  </span>
                  <span className="text-[10px] font-mono font-bold text-accent-red uppercase tracking-widest">LIVE</span>
                </div>
              </div>
              <p className="text-xs font-mono text-slate-400 mt-0.5">
                CYBERSECURITY showcase VM TTY & AUTH INTRUSION METRICS
              </p>
            </div>
          </div>

          {/* SOC Details */}
          <div className="flex flex-wrap items-center gap-3 md:gap-5">
            {/* System Status */}
            <div className="flex items-center gap-2 bg-surface-custom border border-border-custom px-3 py-1.5 rounded-lg font-mono text-xs text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>HONEYPOT_NODE:</span>
              <span className="text-emerald-400 font-bold uppercase">SECURE</span>
            </div>

            {/* Live Clock */}
            <div className="flex items-center gap-2 bg-surface-custom border border-border-custom px-3 py-1.5 rounded-lg font-mono text-xs text-slate-300">
              <Clock className="w-4 h-4 text-accent-cyan" />
              <span>SYSTEM TIME:</span>
              <span className="text-accent-cyan font-bold">
                {currentTime.toLocaleTimeString([], { hour12: false })}
              </span>
            </div>

            {/* Banner info */}
            <div className="hidden lg:flex items-center gap-2 bg-surface-custom border border-border-custom px-3 py-1.5 rounded-lg font-mono text-xs text-accent-red">
              <Radio className="w-3.5 h-3.5 animate-bounce" />
              <span>COLLEGE CYBERSECURITY CLASS SHOWCASE</span>
            </div>
          </div>

        </div>
      </header>

      {/* DASHBOARD CONTAINER */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6 overflow-hidden">
        
        {/* ROW 1: CORE STATS BAR */}
        <StatsBar stats={stats} />

        {/* ROW 2: WORLD MAP & LIVE FEED */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Map Column */}
          <div className="xl:col-span-2 h-[420px] md:h-[480px]">
            <WorldMap events={events} latestEvent={latestEvent} />
          </div>
          {/* Live Feed Column */}
          <div className="xl:col-span-1 h-[420px] md:h-[480px]">
            <LiveFeed events={events} />
          </div>
        </div>

        {/* ROW 3: LIVE CHARTS & TERMINAL */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Side-by-Side Charts */}
          <div className="xl:col-span-2">
            <CredentialCharts topUsernames={topUsernames} topPasswords={topPasswords} />
          </div>
          {/* Terminal Command Shell */}
          <div className="xl:col-span-1">
            <TerminalFeed terminalCommands={terminalCommands} />
          </div>
        </div>

        {/* NOTIFICATION HIGHLIGHT BANNER */}
        <div className="bg-surface-custom border border-border-custom p-4 rounded-lg flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-xs text-slate-400">
          <div className="flex items-center gap-2.5">
            <Zap className="w-4 h-4 text-accent-cyan animate-pulse shrink-0" />
            <span>
              This client-side dashboard simulates live SSH & Telnet Cowrie logs. Ready to connect a real-time event source.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-slate-500">To replace mock feed:</span>
            <span className="bg-bg-dark border border-border-custom text-slate-300 px-2.5 py-1 rounded-md">
              src/hooks/useAttackFeed.ts
            </span>
          </div>
        </div>

      </main>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-border-custom bg-surface-custom/30 py-4 px-6 text-center text-xs font-mono text-slate-500 shrink-0">
        <p>Live Honeypot Attack Monitor © 2026. Made with React + Vite + Leaflet + Chart.js.</p>
      </footer>

    </div>
  );
}
