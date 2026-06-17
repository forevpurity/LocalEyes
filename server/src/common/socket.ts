import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { verifyAccessToken } from "./token-utils.js";
import { ensureNotBanned } from "./ban-users.js";

let io: Server | null = null;

// Room name for all users currently viewing the map
const MAP_VIEWERS_ROOM = "map-viewers";

export function emitToMapViewers(event: string, payload: unknown): void {
  if (io) {
    io.to(MAP_VIEWERS_ROOM).emit(event, payload);
  }
}

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

  io.use(async (socket, next) => {
    const token = parseCookies(socket.handshake.headers.cookie).access_token;
    if (!token) {
      return next(new Error("Unauthorized"));
    }

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      return next(new Error("Unauthorized"));
    }

    try {
      await ensureNotBanned(payload);
    } catch {
      return next(new Error("Account is banned"));
    }

    socket.data.actor = payload;
    return next();
  });

  io.on("connection", (socket) => {
    socket.join(`user:${socket.data.actor.sub}`);

    // Handle map room membership for real-time updates
    socket.on("map:join", () => {
      socket.join(MAP_VIEWERS_ROOM);
    });

    socket.on("map:leave", () => {
      socket.leave(MAP_VIEWERS_ROOM);
    });
  });

  return io;
}

export function getIO(): Server | null {
  return io;
}
