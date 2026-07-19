# Live Honeypot Attack Monitor 🚨

A dark, cinematic **Security Operations Center (SOC) room style** live dashboard displaying simulated honeypot cyber attacks in real-time. Built specifically for college cybersecurity club showcases, events, and projection screens to captivate freshers with real-world threat monitoring aesthetics.

---

## 🛠️ Tech Stack & Key Libraries

- **Frontend Core**: React 19 + TypeScript + Vite
- **Interactive Map**: `react-leaflet` + Leaflet (CartoDB Dark Matter tile style)
- **Live Visual Analytics**: `chart.js` + `react-chartjs-2` for horizontal threat vectors
- **Smooth Animations**: `motion` (Framer Motion) for active logs, stats ticking, and entrance alerts
- **Styling & Typography**: Tailwind CSS + Google Fonts (Outfit, Inter, and JetBrains Mono)
- **Icons**: `lucide-react` for slick cyber indicators

---

## 🚀 Quick Start Guide

### Prerequisites
Make sure you have **Node.js (version 18+)** and **npm** installed on your system.

### 1. Install Dependencies
Clone or download the project files into a directory, then run:
```bash
npm install
```

### 2. Run the Development Server
Launch the local Vite server:
```bash
npm run dev
```
By default, the application will boot on [http://localhost:3000](http://localhost:3000) (configured for AI Studio, or standard port 5173 / custom port when run elsewhere).

### 3. Compile for Production
To bundle and optimize the application for static hosting platforms (such as GitHub Pages, Netlify, or Vercel):
```bash
npm run build
```
This compiles all TypeScript modules into highly optimized static HTML, CSS, and JS files under the `dist/` folder.

---

## 🔌 Architecture & Back-End Integration

This project is carefully structured as a **proper multi-file modular application**, isolated so that the simulation can be swapped out for a live production feed (e.g. standard Cowrie JSON logs from an SSH/Telnet server) with virtually **zero adjustments to components**.

### How to connect a real backend (WebSocket / Server-Sent Events)

The mock event loop is fully encapsulated inside **`src/hooks/useAttackFeed.ts`**.
The events generated follow the exact log format outputted by **Cowrie SSH Honeypots**:

```json
{
  "eventid": "cowrie.login.failed",
  "src_ip": "185.220.101.45",
  "country": "Russia",
  "country_code": "RU",
  "lat": 55.7558,
  "lon": 37.6173,
  "username": "admin",
  "password": "123456",
  "timestamp": "2026-07-18T10:22:31Z"
}
```

To wire this up to a live Flask, Node, or Go WebSocket endpoint:
1. Open `src/hooks/useAttackFeed.ts`.
2. Replace the interval/timeout code inside the `useEffect` with a standard WebSocket connection:
   ```typescript
   useEffect(() => {
     const socket = new WebSocket("ws://YOUR_BACKEND_IP/api/threat-stream");
     
     socket.onmessage = (event) => {
       const newEvent = JSON.parse(event.data);
       // Push into events state and update counters
       handleIncomingEvent(newEvent);
     };

     return () => socket.close();
   }, []);
   ```
3. None of your layout files or components (`WorldMap`, `LiveFeed`, `TerminalFeed`, etc.) will require any modifications as they all consume standard props provided by the hook!

---

## 🎛️ SOC Display Interactive Features

- **Dynamic StatsBar**: Metrics increment dynamically with pulsing glows to draw attention to updates.
- **Glowing Map Indicators**: Every attacker is represented as a target with pinging radar circles. Marker sizes scale proportionally based on continuous intrusions from specific IPs.
- **Interactive Auto-Pan**: Enable `AUTO-PAN` mode to smoothly fly the camera across the globe to the latest attacker coordinates. Or disable it to keep a steady global view.
- **Monospace Terminal Feed**: Fully scrolling bash interactive shell simulating active commands typed in by mock hackers, complete with high-priority crimson red payload isolation alerts.
- **Horizontal Credential Analytics**: Bar charts updating live showcasing Top Usernames and Top Passwords targeted by threat actors.
