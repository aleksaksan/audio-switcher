import { io, Socket } from 'socket.io-client';

let socket = null;

export const connectToServer = (url) => {
  if (!socket || !socket.connected) {
    socket = io(url);
  }
  return socket;
};

export const getSocket = () => socket;
