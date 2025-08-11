import { Server } from "socket.io";
import { rootNamespaceHandler } from "./namespaces/root.js";
import cookieParser from "cookie-parser";
import { chatNamespaceHandler } from "./namespaces/chat.js";
import { socketAuthAndMapping } from "../middleware/socketAuthMapping.js";

function initialiseSocketServer(httpServer, options) {
  const socketServer = new Server(httpServer, {
    ...options,
    cors: { origin: "*" },
    pingInterval: 2000,
    pingTimeout: 1000,
  });

  const idToSocketMap = new Map();

  const namespaces = ["/ws", "/ws/chat", "/ws/notifications"];

  namespaces.forEach((ns) => {
    socketServer.of(ns).use(socketAuthAndMapping(idToSocketMap));
  });

  const rootNamespace = socketServer.of("/ws");
  const chatNamespace = socketServer.of("/ws/chat");
  const notificationNamespace = socketServer.of("/ws/notifications");

  rootNamespace.on("connection", rootNamespaceHandler());
  chatNamespace.on("connection", chatNamespaceHandler());
  // notificationNamespace.on("connection", notificationNamespaceHandler());

  return socketServer;
}

export default initialiseSocketServer;
