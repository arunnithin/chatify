import { io } from 'socket.io-client';

const SOCKET_URL = 'http://10.197.204.26:5001';

let socket = null;

export const connectSocket = (userId) => {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    transports: ['websocket'],
    forceNew: false,
    reconnection: true,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => {
    console.log('✅ Socket connected:', socket.id);
    if (userId) socket.emit('user_online', userId);
  });

  socket.on('disconnect', () => console.log('Socket disconnected'));
  socket.on('connect_error', (err) => console.log('Socket error:', err.message));

  return socket;
};

export const getSocket = () => socket;

export const emitSocket = (type, payload) => {
  if (socket?.connected) socket.emit(type, payload);
};

export const onSocket = (event, handler) => {
  if (socket) socket.on(event, handler);
};

export const offSocket = (event) => {
  if (socket) socket.off(event);
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};