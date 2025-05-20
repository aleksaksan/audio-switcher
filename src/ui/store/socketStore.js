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
  isAllMuted: false, 

  connect: async (url) => {
    const currentSocket = get().socket;
    if (currentSocket && currentSocket.connected) {
      currentSocket.disconnect();
    }

    const socket = io(url);

    socket.on('connect', async () => {
      console.log('[zustand] connected to', url);
      set({ isConnected: true });
      
      window.electron.sendConnectionStatus(true);
      const isMuted = await window.electron.getMute();
      set({ isMuted });

      const info = await window.electron.getInfo();
      const hostname = info.hostname;

      const clientId = socket.id;

      let name = localStorage.getItem('client_name');
      if (!name) {
        name = hostname;
        localStorage.setItem('client_name', name);
      }

      socket.emit('register-client', {
        id: clientId,
        name,
      });

      socket.emit('client-muted-state-updated', isMuted);
    });

    socket.on('disconnect', () => {
      console.log('[zustand] disconnected');
      set({ isConnected: false });
      window.electron.sendConnectionStatus(false);
    });

    socket.on('client-list', (clients) => {
      console.log('[zustand] client-list received:', clients);
      set({ 
        clients,
        isAllMuted: clients.length > 0 && clients.every(client => client.isMuted)
      });
      window.electron.sendClientList(clients);
    });

    socket.on('apply-mute', () => {
      const newMuted = !get().isMuted;
      window.electron.toggleMute(newMuted);
      set({ isMuted: newMuted });
      socket.emit('client-muted-state-updated', newMuted);
    });

    set({ socket });
  },

  disconnect: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false, clients: [] });
      console.log('[zustand] socket manually disconnected');
    }
  },

  sendToggle: (clientId) => {
    const socket = get().socket;
    console.log('[sendToggle] called with clientId:', clientId);

    if (socket) {
      console.log('[sendToggle] emitting mute-client...');
      socket.emit('mute-client', clientId);
    } else {
      console.warn('[sendToggle] No socket available');
    }
  },

  updateClientName: (targetId, newName) => {
    const socket = get().socket;
    if (!socket) return;

    if (targetId === socket.id) {
      localStorage.setItem('client_name', newName);
    }

    socket.emit('change-client-name', { id: targetId, name: newName });
  },

  broadcastToggleMute: () => {
    const socket = get().socket;
    const clients = get().clients;

    if (!socket) return;

    const hasUnmutedClient = clients.some(client => !client.isMuted);
    
    if (hasUnmutedClient) {
      socket.emit('force-mute-all'); 
    } else {
      socket.emit('broadcast-toggle-mute');
    }
  },
}));
