import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { verifyAccessToken } from "./token-utils.js";

let io: Server | null = null;

function parseCookies(header: string | undefined): Record<string, string> {
  if (!header) return {};

  const cookies: Record<string, string> = {};

  for (const part of header.split(";")) {
    const [name, ...valueParts] = part.trim().split("=");
    if (!name) continue;

    try {
      cookies[name] = decodeURIComponent(valueParts.join("="));
    } catch {
      cookies[name] = valueParts.join("=");
    }
  }

  return cookies;
}

export function initSocket(server: HttpServer): Server {
  io = new Server(server, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = parseCookies(socket.handshake.headers.cookie).access_token;
    if (!token) {
      return next(new Error("Unauthorized"));
    }

    try {
      const payload = verifyAccessToken(token);
      socket.data.actor = payload;
      return next();
    } catch {
      return next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(`user:${socket.data.actor.sub}`);
  });

  return io;
}

export function getIO(): Server | null {
  return io;
}
