import { create } from 'zustand';
import { io } from 'socket.io-client';

// export interface Client {
//   id: number;
//   address: string;
// }

// interface SocketStore {
//   socket: Socket | null;
//   clients: Client[];
//   isConnected: boolean;

//   connect: (url: string) => void;
//   disconnect: () => void;
//   setClients: (clients: Client[]) => void;
// }

export const useSocketStore = create((set, get) => ({
  socket: null,
  clients: [],
  isConnected: false,
  isMuted: false,

  connect: (url) => {
    // Отключаем предыдущий сокет, если есть
    const currentSocket = get().socket;
    if (currentSocket && currentSocket.connected) {
      currentSocket.disconnect();
    }

    const socket = io(url);

    socket.on('connect', async () => {
      console.log('[zustand] connected to', url);
      set({ isConnected: true });
      
      const isMuted = await window.electron.getMute();
      set({ isMuted });

      // Также отправляем его на сервер
      socket.emit('client-muted-state-updated', isMuted);
    });
    

    socket.on('disconnect', () => {
      console.log('[zustand] disconnected');
      set({ isConnected: false });
    });

    socket.on('client-list', (clients) => {
      console.log('[zustand] client-list received:', clients);
      set({ clients });
    });
    
    socket.on('apply-mute', () => {
      const newMuted = !get().isMuted;
      window.electron.toggleMute(newMuted);
      set({ isMuted: newMuted });
      socket.emit('client-muted-state-updated', newMuted);
    })

    set({ socket });
  },

  disconnect: () => {
    const currentSocket = get().socket;
    if (currentSocket && currentSocket.connected) {
      currentSocket.disconnect();
      set({ socket: null, isConnected: false, clients: [] });
      console.log('[zustand] socket manually disconnected');
    }
  },

  setClients: (clients) => set({ clients }),

  sendToggle: (clientId) => {
    const socket = get().socket;
    if (socket) {
      socket.emit('mute-client', clientId);
    }
  },
}));
