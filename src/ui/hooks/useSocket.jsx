import { useEffect } from 'react';
import { useSocketStore } from '../store/socketStore';

export const SERVER_URL_KEY = 'server_url';

export const useSocket = () => {
  const connect = useSocketStore((state) => state.connect);

  useEffect(() => {
    const url = localStorage.getItem(SERVER_URL_KEY);
    if (url) {
      connect(url);
    }
  }, [connect]);
};


export const handleConnectClick = (url) => {
  const fullUrl = `http://${url}`;
  localStorage.setItem('server_url', fullUrl);

  const store = useSocketStore.getState();

  store.disconnect(); // отключаем старый сокет
  store.connect(fullUrl); // подключаем новый
};
