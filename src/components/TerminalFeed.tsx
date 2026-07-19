import { useEffect, useRef } from "react";
import { Terminal, ShieldX, Play } from "lucide-react";

interface TerminalCommand {
  timestamp: string;
  ip: string;
  country: string;
  countryCode: string;
  command: string;
}

interface TerminalFeedProps {
  terminalCommands: TerminalCommand[];
}

export default function TerminalFeed({ terminalCommands }: TerminalFeedProps) {
  const terminalContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom of the terminal container as new lines are logged
  useEffect(() => {
    if (terminalContainerRef.current) {
      terminalContainerRef.current.scrollTop = terminalContainerRef.current.scrollHeight;
    }
  }, [terminalCommands]);

  const formatTime = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleTimeString([], { hour12: false });
    } catch {
      return "00:00:00";
    }
  };

  return (
    <div id="terminal-feed-panel" className="bg-[#020204] border border-border-custom rounded-lg h-[350px] flex flex-col overflow-hidden shadow-2xl">
      {/* Terminal Bar */}
      <div className="px-4 py-3 border-b border-border-custom bg-surface-custom flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-accent-cyan animate-pulse" />
          <h2 className="text-xs font-mono font-bold tracking-widest text-slate-200 uppercase">
            Honeypot Bash TTY Interactive Shell
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {/* Mock Window Controls for cyber aesthetic */}
          <span className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-border-custom"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-border-custom"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-accent-cyan/60 border border-accent-cyan"></span>
        </div>
      </div>

      {/* Terminal Screen */}
      <div 
        ref={terminalContainerRef}
        className="flex-1 overflow-y-auto px-5 py-4 font-mono text-xs leading-relaxed text-emerald-500/90 space-y-2 scrollbar-thin scrollbar-thumb-border-custom scrollbar-track-transparent"
      >
        {/* Terminal MOTD */}
        <div className="text-emerald-600/60 border-b border-border-custom/50 pb-2 mb-3 select-none">
          <p>COWRIE SHELL VM SECURE SANDBOX v2.8-RELEASE</p>
          <p>LOGGING DIRECT SHELL INTERACTIONS ON LOGICAL PORTS 22, 23, 2222</p>
          <p>SYS_STATUS: ACTIVE | TTY_MONITOR: ATTACHED</p>
        </div>

        {terminalCommands.length === 0 ? (
          <div className="text-emerald-700/50 flex items-center gap-2 py-4 justify-center">
            <Play className="w-3.5 h-3.5 animate-pulse text-emerald-700" />
            <span>Listening for shell interactions...</span>
          </div>
        ) : (
          terminalCommands.map((item, idx) => {
            const isAlert = item.command.startsWith("downloaded:");
            const time = formatTime(item.timestamp);

            if (isAlert) {
              return (
                <div key={idx} className="bg-red-950/20 border border-red-950 text-red-400 px-3 py-1.5 rounded-md my-1.5">
                  <p className="flex items-start gap-1.5 font-bold text-[11px]">
                    <ShieldX className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span>
                      [{time}] ALERT_PAYLOAD_DOWNLOAD - SESSION DISCONNECTED & PAYLOAD ISOLATED:
                      <br />
                      <code className="text-red-200 block mt-1 bg-black/40 px-1.5 py-0.5 rounded border border-red-950/40">{item.command}</code>
                    </span>
                  </p>
                </div>
              );
            }

            return (
              <div key={idx} className="hover:bg-emerald-950/10 py-0.5 px-1 rounded transition-colors duration-150">
                <span className="text-emerald-700 select-none font-bold">[{time}] </span>
                <span className="text-emerald-600 select-none">attacker@{item.ip}:~$ </span>
                <span className="text-emerald-300 font-bold break-all">{item.command}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
