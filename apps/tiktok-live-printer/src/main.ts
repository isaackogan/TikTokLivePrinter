import path from "node:path";
import { configureNativeModules } from "./native.ts";
import { openBrowser } from "./open-browser.ts";
import { createServer } from "./server.ts";

const FIRST_PORT = 7474;
const PORT_ATTEMPTS = 10;
const staticDir = process.env.TLP_STATIC_DIR ?? path.join(import.meta.dir, "web");

function listen() {
  for (let port = FIRST_PORT; port < FIRST_PORT + PORT_ATTEMPTS; port++) {
    try {
      return createServer({ port, staticDir });
    } catch (err) {
      if (!String(err).includes("EADDRINUSE")) throw err;
    }
  }
  throw new Error(`No free port between ${FIRST_PORT} and ${FIRST_PORT + PORT_ATTEMPTS - 1}`);
}

configureNativeModules();
const server = listen();
const url = `http://127.0.0.1:${server.port}`;
console.log(`TikTok Live Printer is running at ${url}`);
if (!process.env.TLP_NO_BROWSER) openBrowser(url);
