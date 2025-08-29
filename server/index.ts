import config from "./config";
import app, { initialize } from "./app";
import logger, { logWss } from "./utils/log";
import { IncomingMessage } from "http";
import { Duplex } from "stream";
import * as chat from "./components/chat";
import * as orchestrator from "./components/orchestrator";

const port = config.env.PORT;

const server = app.listen(port, async () => {
  logger.info(`Redis chat server listening on port ${port}`, {
    noStream: true,
  });

  await initialize();
});

function onUpgrade(
  req: IncomingMessage,
  socket: Duplex,
  head: Buffer<ArrayBufferLike>,
) {
  let url = req.url!;

  if (url.includes("wss://")) {
    url = new URL(url).pathname;
  }

  switch (url) {
    case "/chat":
      chat.socket.wss.handleUpgrade(req, socket, head, (ws) => {
        chat.socket.wss.emit("connection", ws, req);
      });
      break;
    case "/socket":
      orchestrator.socket.wss.handleUpgrade(req, socket, head, (ws) => {
        orchestrator.socket.wss.emit("connection", ws, req);
      });
      break;
    case "/log":
      logWss.handleUpgrade(req, socket, head, (ws) => {
        logWss.emit("connection", ws, req);
      });
      break;
    default:
      logger.warn(`Unknown WebSocket upgrade request to ${url}`);
      socket.destroy();
      return;
  }
}

server.on("upgrade", onUpgrade);

process.on("uncaughtException", (err) => {
  console.error(err);
});

process.on("unhandledRejection", (err, promise) => {
  console.error(err);
});

export default server;
