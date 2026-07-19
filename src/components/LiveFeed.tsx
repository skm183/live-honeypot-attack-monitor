import { CowrieEvent } from "../hooks/useAttackFeed";
import { getFlagEmoji } from "./StatsBar";
import { motion, AnimatePresence } from "motion/react";
import { ListCollapse, Flame } from "lucide-react";

interface LiveFeedProps {
  events: CowrieEvent[];
}

export default function LiveFeed({ events }: LiveFeedProps) {
  // We limit the displayed events to the top 50 in the feed
  const displayEvents = events.slice(0, 50);

  const formatTimestamp = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour12: false });
    } catch {
      return "00:00:00";
    }
  };

  const getEventStyleAndContent = (event: CowrieEvent) => {
    const flag = getFlagEmoji(event.country_code);
    const timestamp = formatTimestamp(event.timestamp);
    const ip = event.src_ip;

    switch (event.eventid) {
      case "cowrie.login.failed":
        return {
          textColor: "text-amber-400/90",
          bgColor: "bg-amber-950/20 border-amber-500/10",
          badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/30",
          label: "AUTH_FAIL",
          body: (
            <span>
              tried username <code className="text-amber-200 font-bold bg-slate-900/60 px-1 py-0.5 rounded">"{event.username}"</code> password <code className="text-amber-200 font-bold bg-slate-900/60 px-1 py-0.5 rounded">"{event.password}"</code>
            </span>
          )
        };

      case "cowrie.command.input":
        return {
          textColor: "text-cyan-400",
          bgColor: "bg-cyan-950/20 border-cyan-500/10",
          badgeColor: "bg-cyan-500/10 text-cyan-300 border-cyan-500/30",
          label: "CMD_INPUT",
          body: (
            <span>
              executed command: <code className="text-cyan-200 font-bold font-mono bg-slate-900/80 px-1.5 py-0.5 rounded"># {event.input}</code>
            </span>
          )
        };

      case "cowrie.session.file_download":
        return {
          textColor: "text-emerald-400",
          bgColor: "bg-emerald-950/25 border-emerald-500/15",
          badgeColor: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40 animate-pulse",
          label: "MALWARE_DROP",
          body: (
            <span>
              dropped payload: <code className="text-emerald-300 font-bold">{event.filename}</code> <span className="text-slate-500 font-mono text-[10px] hidden sm:inline">({event.shasum?.slice(0, 16)}...)</span>
            </span>
          )
        };

      default:
        return {
          textColor: "text-slate-300",
          bgColor: "bg-slate-950 border-slate-800",
          badgeColor: "bg-slate-800 text-slate-300",
          label: "UNKNOWN",
          body: <span>logged background action</span>
        };
    }
  };

  return (
    <div id="live-feed-panel" className="bg-surface-custom border border-border-custom rounded-lg h-full flex flex-col overflow-hidden shadow-2xl">
      {/* Panel Header */}
      <div className="px-5 py-4 border-b border-border-custom bg-surface-custom/80 backdrop-blur-md flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="relative">
            <span className="absolute inline-block w-2.5 h-2.5 bg-accent-red rounded-full animate-ping"></span>
            <span className="relative inline-block w-2.5 h-2.5 bg-accent-red rounded-full"></span>
          </div>
          <h2 className="text-sm font-mono font-bold tracking-wider text-slate-200 uppercase flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-accent-red" />
            <span>Real-time Activity Stream</span>
          </h2>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 bg-slate-900/60 border border-border-custom px-2 py-1 rounded-md">
          <ListCollapse className="w-3.5 h-3.5 text-accent-cyan" />
          <span>CAP: 50 LOGS</span>
        </div>
      </div>

      {/* Scrolling Stream Content */}
      <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2 scrollbar-thin scrollbar-thumb-border-custom scrollbar-track-transparent">
        <AnimatePresence initial={false}>
          {displayEvents.map((event, index) => {
            const config = getEventStyleAndContent(event);
            // We use timestamp + ip + country + index as the key to ensure uniqueness for dynamic additions
            const uniqueKey = `${event.timestamp}-${event.src_ip}-${event.eventid}-${index}`;

            return (
              <motion.div
                key={uniqueKey}
                initial={{ opacity: 0, y: -15, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className={`flex flex-col sm:flex-row sm:items-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-mono leading-relaxed transition-all duration-300 ${config.bgColor}`}
              >
                {/* Meta details segment */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-slate-500 select-none font-bold">[{formatTimestamp(event.timestamp)}]</span>
                  <span className="text-lg select-none" title={event.country}>{getFlagEmoji(event.country_code)}</span>
                  <span className="text-slate-300 font-bold hover:text-accent-red transition-colors cursor-pointer" title={`Source: ${event.country}`}>
                    {event.src_ip}
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold select-none ${config.badgeColor}`}>
                    {config.label}
                  </span>
                </div>

                {/* Event text segment */}
                <div className={`sm:pl-1 flex-1 ${config.textColor}`}>
                  {config.body}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
