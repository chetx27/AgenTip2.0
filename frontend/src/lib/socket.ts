import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:3001';
let socket: Socket | null = null;

export function getSocket(): Socket | null {
  if (!socket && typeof window !== 'undefined') {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'], // Allow polling fallback
      autoConnect: true,
    });
  }
  return socket;
}

export function createSocket(url: string = SOCKET_URL): Socket | null {
  if (typeof window === 'undefined') return null;
  return io(url, {
    transports: ['websocket', 'polling'],
    autoConnect: true,
  });
}

export function subscribeToGlobalTips(cb: (data: any) => void) {
  const s = getSocket();
  if (s) {
    s.on('global-tip', cb);
    s.on('global-agent-payment', cb);
    return () => {
      s.off('global-tip', cb);
      s.off('global-agent-payment', cb);
    };
  }
  return () => {};
}
