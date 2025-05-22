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

export const useSocketStore = create((set, get) => {
  // Интервал проверки статуса динамика (в миллисекундах)
  const SPEAKER_STATUS_CHECK_INTERVAL = 2000;
  let speakerCheckInterval = null;
  
  return {
    socket: null,
    clients: [],
    isConnected: false,
    isMuted: false,
    isAllMuted: false, 

    // Функция для проверки статуса динамика
    checkSpeakerStatus: async () => {
      const socket = get().socket;
      const currentMuteState = get().isMuted;
      
      if (!socket || !socket.connected) return;
      
      try {
        // Получаем текущий статус динамика
        const isMuted = await window.electron.getMute();
        
        // Если статус изменился, обновляем состояние и отправляем на сервер
        if (isMuted !== currentMuteState) {
          console.log('[checkSpeakerStatus] Mute state changed:', isMuted);
          set({ isMuted });
          socket.emit('client-muted-state-updated', isMuted);
        }
      } catch (error) {
        console.error('[checkSpeakerStatus] Error:', error);
      }
    },

    // Запуск периодической проверки
    startSpeakerStatusCheck: () => {
      const { checkSpeakerStatus } = get();
      
      // Очищаем предыдущий интервал, если он существует
      if (speakerCheckInterval) {
        clearInterval(speakerCheckInterval);
      }
      
      // Устанавливаем новый интервал
      speakerCheckInterval = setInterval(checkSpeakerStatus, SPEAKER_STATUS_CHECK_INTERVAL);
      console.log('[socketStore] Speaker status check started');
    },

    // Остановка периодической проверки
    stopSpeakerStatusCheck: () => {
      if (speakerCheckInterval) {
        clearInterval(speakerCheckInterval);
        speakerCheckInterval = null;
        console.log('[socketStore] Speaker status check stopped');
      }
    },

    connect: async (url) => {
      const currentSocket = get().socket;
      const { startSpeakerStatusCheck, stopSpeakerStatusCheck } = get();
      
      // Останавливаем предыдущую проверку при переподключении
      stopSpeakerStatusCheck();
      
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
        let order = localStorage.getItem('client_order');
        if (!name) {
          name = hostname;
          localStorage.setItem('client_name', name);
        }
        if (!order) {
          order = 0;
          localStorage.setItem('client_order', order);
        }

        socket.emit('register-client', {
          id: clientId,
          name,
          order,
        });

        socket.emit('client-muted-state-updated', isMuted);
        
        // Запускаем периодическую проверку после подключения
        startSpeakerStatusCheck();
      });

      socket.on('disconnect', () => {
        console.log('[zustand] disconnected');
        set({ isConnected: false });
        window.electron.sendConnectionStatus(false);
        
        // Останавливаем проверку при отключении
        stopSpeakerStatusCheck();
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

      // Добавляем новый обработчик для принудительного выключения динамиков
      socket.on('force-mute', () => {
        // Всегда устанавливаем значение true для выключения динамиков
        window.electron.toggleMute(true);
        set({ isMuted: true });
        socket.emit('client-muted-state-updated', true);
      });
      set({ socket });
    },

    disconnect: () => {
      const socket = get().socket;
      const { stopSpeakerStatusCheck } = get();
      
      if (socket) {
        socket.disconnect();
        set({ socket: null, isConnected: false, clients: [] });
        console.log('[zustand] socket manually disconnected');
      }
      
      // Останавливаем проверку при ручном отключении
      stopSpeakerStatusCheck();
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

    updateClientOrder: (targetId, newOrder) => {
      const socket = get().socket;
      if (!socket) return;

      if (targetId === socket.id) {
        localStorage.setItem('client_order', newOrder);
      }

      socket.emit('change-client-order', { id: targetId, order: newOrder });
    },

    updateClientNameAndOrder: (targetId, newName, newOrder) => {
      const socket = get().socket;
      if (!socket) return;

      if (targetId === socket.id) {
        if (newName) localStorage.setItem('client_name', newName);
        if (newOrder !== undefined) localStorage.setItem('client_order', newOrder);
      }

      socket.emit('change-client-info', { id: targetId, name: newName, order: newOrder });
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
  }
});
