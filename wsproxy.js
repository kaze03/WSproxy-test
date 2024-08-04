const WebSocket = require("ws");
const { HttpsProxyAgent } = require("https-proxy-agent");
const https = require("https");
const fs = require("fs");

const wss = new WebSocket.Server({ port: 1336 });
let bots = [];
let botsAmount = 200;
let int = null;
let proxies = loadProxies();
let botsRunning = false;

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", (msg) => {
    const data = new Uint8Array(msg).buffer;
    const buf = new DataView(data);
    let offset = 0;

    switch (buf.getUint8(offset++)) {
      case 10:
        console.log("Received message: {10}");
        startBots();
        break;
      case 11:
        console.log("Received message: {11}");
        stopBotsConnecting();
        break;
      case 9:
        console.log("Received message: {9}");
        break;
      default:
        console.log("Unknown message");
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});

function loadProxies() {
  const proxies = fs
    .readFileSync("./proxies.txt", "utf-8")
    .split("\n")
    .map((proxy) => proxy.trim())
    .filter((proxy) => proxy.length > 0);
  console.log(`Proxies reloaded: ${proxies.length} proxies`);
  return proxies;
}

const startBots = () => {
  if (botsRunning) return; // Prevent multiple start attempts
  botsRunning = true;

  for (let i = 0; i < botsAmount; i++) {
    bots.push(new Bot());
  }
  console.log(bots.length);

  let b = 0;
  int = setInterval(() => {
    let aliveBots = 0;
    for (let i in bots) if (!bots[i].inConnect && !bots[i].closed) aliveBots++;
    console.clear();
    console.log(`Alive Bots/Proxy: ${aliveBots}`);

    b++;
    if (b > botsAmount) b = 0;

    if (bots[b] && !bots[b].inConnect && bots[b].closed) {
      bots[b].start();
    }
  }, 150);
};

const stopBotsConnecting = () => {
  if (!botsRunning) return; // Prevent stopping if not started
  clearInterval(int);
  botsRunning = false;

  // Ensure no bots are in connecting state
  for (let i in bots) {
    if (bots[i].inConnect && !bots[i].closed) {
      bots[i].ws.close();
    }
  }
};

class Bot {
  constructor() {
    this.server = "wss://212-245-254-51-ip.gota.io:1502/";
    this.proxy = null;
    this.proxyAgent = null;
    this.ws = null;
    this.inConnect = false;
    this.closed = true;
  }

  start() {
    if (!botsRunning) return; // Prevent starting if stopped

    this.inConnect = true;
    this.proxy = proxies[Math.floor(Math.random() * proxies.length)];
    if (!this.proxy.startsWith("http://")) {
      this.proxy = "http://" + this.proxy;
    }
    this.proxyAgent = new HttpsProxyAgent(this.proxy);
    this.ws = new WebSocket(this.server, { agent: this.proxyAgent });
    this.ws.onopen = this.open.bind(this);
    this.ws.onclose = (event) => this.close(event.code, event.reason);
    this.ws.onerror = this.error.bind(this);
    this.ws.onmessage = this.message.bind(this);
  }

  open() {
    this.inConnect = false;
    this.closed = false;
    this.sendPacket(Buffer.from([71]));
    this.createConnectionStartPacket("3.6.4");
    setInterval(() => {
      this.sendPacket(Buffer.from([71]));
    }, 30000);
  }

  jakey(emanda, cameran, janaiah) {
    for (var anesty = 0; anesty < janaiah.length; anesty++) {
      cameran.setUint16(emanda, janaiah.charCodeAt(anesty), true);
      emanda += 2;
    }
    cameran.setUint16(emanda, 0, true);
  }

  createConnectionStartPacket(version) {
    const tyquane = "Gota Web " + version;
    const nykeisha = new ArrayBuffer(1 + tyquane.length + 1 + 1);
    const torris = new DataView(nykeisha);

    torris.setUint8(0, 255);
    torris.setUint8(1, 6);

    function shaquail(offset, view, string) {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
      view.setUint8(offset + string.length, 0);
    }

    shaquail(2, torris, tyquane);

    this.sendPacket(nykeisha);
  }

  close(code, reason) {
    this.inConnect = false;
    this.closed = true;
    console.log(
      `${this.proxy} - Disconnected from WebSocket server. Code: ${code}, Reason: ${reason}`
    );
    if (reason.includes("Invalid session")) {
      console.log(`It can be fixed!`);
    }
    if (reason.includes("")) {
      console.log(`Proxy not working at all`);
    }
    if (reason.includes("level 10")) {
      console.log(`Proxy is banned/blocked, they somehow detecting it`);
    }
  }

  error(error) {}

  message(message) {}

  sendPacket(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(data);
    }
  }
}

startBots();
