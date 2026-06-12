import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

/**
 * Lazily create (or reuse) the singleton Socket.io client. Connects same-origin
 * so the `access_token` HTTP-only cookie is sent on the handshake (dev proxies
 * `/socket.io` to the API server with ws upgrade — see vite.config.ts).
 */
export function getSocket(): Socket {
  if (!socket) {
    socket = io({ withCredentials: true });
  }
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
