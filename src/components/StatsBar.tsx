import { useEffect, useState } from "react";
import { ShieldAlert, Users, Globe, FolderGit2 } from "lucide-react";
import { HoneypotStats } from "../hooks/useAttackFeed";
import { motion, AnimatePresence } from "motion/react";

interface StatsBarProps {
  stats: HoneypotStats;
}

// Helper to convert country code (e.g., 'RU') to native emoji flag (e.g., 🇷🇺)
export function getFlagEmoji(countryCode: string) {
  if (!countryCode) return "🌐";
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map(char => 127397 + char.charCodeAt(0));
  try {
    return String.fromCodePoint(...codePoints);
  } catch (e) {
    return "🌐";
  }
}

export default function StatsBar({ stats }: StatsBarProps) {
  const [pulseTotal, setPulseTotal] = useState(false);
  const [pulseUnique, setPulseUnique] = useState(false);
  const [pulseMalware, setPulseMalware] = useState(false);

  // Trigger pulse effect when metrics increment
  useEffect(() => {
    setPulseTotal(true);
    const t = setTimeout(() => setPulseTotal(false), 300);
    return () => clearTimeout(t);
  }, [stats.totalAttacks]);

  useEffect(() => {
    setPulseUnique(true);
    const t = setTimeout(() => setPulseUnique(false), 300);
    return () => clearTimeout(t);
  }, [stats.uniqueIPsCount]);

  useEffect(() => {
    setPulseMalware(true);
    const t = setTimeout(() => setPulseMalware(false), 300);
    return () => clearTimeout(t);
  }, [stats.malwareCount]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {/* CARD 1: TOTAL ATTACKS */}
      <div 
        id="stats-total-attacks"
        className="relative bg-surface-custom border border-border-custom rounded-lg p-5 shadow-md overflow-hidden transition-all duration-300 hover:border-accent-red/40 before:absolute before:top-0 before:left-0 before:w-[2px] before:h-full before:bg-accent-red"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-accent-red/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">Total Attacks Today</p>
            <motion.h3 
              animate={{ scale: pulseTotal ? 1.05 : 1, color: pulseTotal ? "#ff6b6b" : "#ff3e3e" }}
              transition={{ duration: 0.15 }}
              className="text-3xl font-mono font-bold mt-2 text-accent-red"
            >
              {stats.totalAttacks.toLocaleString()}
            </motion.h3>
          </div>
          <div className="p-2.5 rounded-md bg-accent-red/10 border border-accent-red/25 text-accent-red">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-xs font-mono text-accent-red/80">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent-red animate-ping"></span>
          <span>Live feed capturing active events</span>
        </div>
      </div>

      {/* CARD 2: UNIQUE IPS */}
      <div 
        id="stats-unique-ips"
        className="relative bg-surface-custom border border-border-custom rounded-lg p-5 shadow-md overflow-hidden transition-all duration-300 hover:border-accent-cyan/40 before:absolute before:top-0 before:left-0 before:w-[2px] before:h-full before:bg-accent-cyan"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-accent-cyan/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">Unique Attacker IPs</p>
            <motion.h3 
              animate={{ scale: pulseUnique ? 1.05 : 1, color: pulseUnique ? "#55f7ff" : "#00f2ff" }}
              transition={{ duration: 0.15 }}
              className="text-3xl font-mono font-bold mt-2 text-accent-cyan"
            >
              {stats.uniqueIPsCount.toLocaleString()}
            </motion.h3>
          </div>
          <div className="p-2.5 rounded-md bg-accent-cyan/10 border border-accent-cyan/25 text-accent-cyan">
            <Users className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-xs font-mono text-accent-cyan/80">
          <span>+{(stats.uniqueIPsCount - 427 > 0 ? stats.uniqueIPsCount - 427 : 0)} since boot</span>
        </div>
      </div>

      {/* CARD 3: TOP COUNTRY */}
      <div 
        id="stats-top-country"
        className="relative bg-surface-custom border border-border-custom rounded-lg p-5 shadow-md overflow-hidden transition-all duration-300 hover:border-amber-500/40 before:absolute before:top-0 before:left-0 before:w-[2px] before:h-full before:bg-amber-500"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">Top Source Country</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-3xl select-none" title={stats.topCountryName}>
                {getFlagEmoji(stats.topCountryCode)}
              </span>
              <h3 className="text-2xl font-mono font-bold text-amber-500 truncate max-w-[150px]">
                {stats.topCountryName}
              </h3>
            </div>
          </div>
          <div className="p-2.5 rounded-md bg-amber-500/10 border border-amber-500/25 text-amber-400 flex flex-col items-center justify-center">
            <Globe className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-2 text-xs font-mono text-amber-400/80">
          <span>{stats.topCountryCount.toLocaleString()} total logged events</span>
        </div>
      </div>

      {/* CARD 4: MALWARE SAMPLES */}
      <div 
        id="stats-malware-samples"
        className="relative bg-surface-custom border border-border-custom rounded-lg p-5 shadow-md overflow-hidden transition-all duration-300 hover:border-emerald-500/40 before:absolute before:top-0 before:left-0 before:w-[2px] before:h-full before:bg-emerald-500"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">Malware Captured</p>
            <motion.h3 
              animate={{ scale: pulseMalware ? 1.05 : 1, color: pulseMalware ? "#5af7c0" : "#10b981" }}
              transition={{ duration: 0.15 }}
              className="text-3xl font-mono font-bold mt-2 text-emerald-400"
            >
              {stats.malwareCount.toLocaleString()}
            </motion.h3>
          </div>
          <div className="p-2.5 rounded-md bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
            <FolderGit2 className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-2 text-xs font-mono text-emerald-400/80">
          <span>ELF & Script binaries isolated</span>
        </div>
      </div>
    </div>
  );
}
