import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { KeyRound, UserCheck } from "lucide-react";

// Register ChartJS plugins/modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ChartItem {
  name: string;
  count: number;
}

interface CredentialChartsProps {
  topUsernames: ChartItem[];
  topPasswords: ChartItem[];
}

export default function CredentialCharts({ topUsernames, topPasswords }: CredentialChartsProps) {
  // Common chart configuration options
  const createOptions = (title: string, color: string): ChartOptions<"bar"> => ({
    indexAxis: "y" as const, // Makes the bar chart horizontal
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false // No legend needed for single dataset
      },
      tooltip: {
        backgroundColor: "#111827",
        titleFont: { family: "JetBrains Mono, monospace", size: 12 },
        bodyFont: { family: "JetBrains Mono, monospace", size: 12 },
        borderColor: "#1a2332",
        borderWidth: 1,
        padding: 10,
        displayColors: false
      }
    },
    scales: {
      x: {
        grid: {
          color: "#1a2332",
        },
        ticks: {
          color: "#94a3b8", // slate-400
          font: {
            family: "JetBrains Mono, monospace",
            size: 10
          }
        }
      },
      y: {
        grid: {
          display: false
        },
        ticks: {
          color: "#cbd5e1", // slate-300
          font: {
            family: "JetBrains Mono, monospace",
            size: 11,
            weight: "bold"
          }
        }
      }
    }
  });

  // Setup username data
  const usernameData: ChartData<"bar"> = {
    labels: topUsernames.map(item => item.name),
    datasets: [
      {
        data: topUsernames.map(item => item.count),
        backgroundColor: "rgba(0, 242, 255, 0.7)", // Sleek cyan
        borderColor: "#00f2ff",
        borderWidth: 1.5,
        borderRadius: 4,
        hoverBackgroundColor: "rgba(0, 242, 255, 0.95)",
      }
    ]
  };

  // Setup password data
  const passwordData: ChartData<"bar"> = {
    labels: topPasswords.map(item => item.name),
    datasets: [
      {
        data: topPasswords.map(item => item.count),
        backgroundColor: "rgba(255, 62, 62, 0.7)", // Sleek red
        borderColor: "#ff3e3e",
        borderWidth: 1.5,
        borderRadius: 4,
        hoverBackgroundColor: "rgba(255, 62, 62, 0.95)",
      }
    ]
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
      {/* USERNAMES CHART */}
      <div id="top-usernames-panel" className="bg-surface-custom border border-border-custom rounded-lg p-5 shadow-2xl flex flex-col h-[350px]">
        <div className="flex items-center gap-2 mb-4 shrink-0">
          <div className="p-1.5 bg-accent-cyan/10 border border-accent-cyan/25 text-accent-cyan rounded-md">
            <UserCheck className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-mono font-bold tracking-wider text-slate-200 uppercase">
            Top Targeted Usernames
          </h2>
        </div>
        <div className="flex-1 min-h-0">
          {topUsernames.length > 0 ? (
            <Bar data={usernameData} options={createOptions("Usernames", "#00f2ff")} />
          ) : (
            <div className="h-full flex items-center justify-center text-xs font-mono text-slate-500">
              Awaiting credentials intake...
            </div>
          )}
        </div>
      </div>

      {/* PASSWORDS CHART */}
      <div id="top-passwords-panel" className="bg-surface-custom border border-border-custom rounded-lg p-5 shadow-2xl flex flex-col h-[350px]">
        <div className="flex items-center gap-2 mb-4 shrink-0">
          <div className="p-1.5 bg-accent-red/10 border border-accent-red/25 text-accent-red rounded-md">
            <KeyRound className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-mono font-bold tracking-wider text-slate-200 uppercase">
            Top Targeted Passwords
          </h2>
        </div>
        <div className="flex-1 min-h-0">
          {topPasswords.length > 0 ? (
            <Bar data={passwordData} options={createOptions("Passwords", "#ff3e3e")} />
          ) : (
            <div className="h-full flex items-center justify-center text-xs font-mono text-slate-500">
              Awaiting credentials intake...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
