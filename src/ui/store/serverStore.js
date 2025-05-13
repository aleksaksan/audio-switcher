import { create } from 'zustand';

export const PORT = 5000;

export const useServerStore = create((set, get) => ({
  port: localStorage.getItem(PORT) || PORT,
  isLoading: false,
  isServerRunning: false,
  serverUrls: [],

  setPort: (newPort) => {
    if (!isNaN(newPort)) {
      localStorage.setItem('port', newPort);
      set({ port: newPort });
    } else {
      console.error("PORT is not a number!");
    }
  },

  startServer: async () => {
    const port = get().port;
    set({ isLoading: true });

    try {
      const urls = await window.electron.startServer(port);
      set({
        isServerRunning: true,
        serverUrls: urls,
      });
    } catch (error) {
      console.error("Server start error:", error);
      set({ isServerRunning: false, serverUrls: [] });
    } finally {
      set({ isLoading: false });
    }
  },

  stopServer: async () => {
    set({ isLoading: true });

    try {
      await window.electron.stopServer();
      set({
        isServerRunning: false,
        serverUrls: [],
      });
    } catch (error) {
      console.error("Server stop error:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  toggleServer: async () => {
    const { isServerRunning, startServer, stopServer } = get();
    if (isServerRunning) {
      await stopServer();
    } else {
      await startServer();
    }
  },

  checkServerStatus: async () => {
    const isRunning = await window.electron.isServerRunning();
    set({ isServerRunning: isRunning });
  }
}));
