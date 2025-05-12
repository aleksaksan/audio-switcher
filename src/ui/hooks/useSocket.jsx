import { useEffect } from 'react';
import { connectToServer } from '../socket';

export const SERVER_URL_KEY = 'server_url';

export const useSocket = () => {
  useEffect(() => {
    const url = localStorage.getItem(SERVER_URL_KEY);
    if (url) {
      connectToServer(url);
    }
  }, []);
};

export const handleConnectClick = (url) => {
  connectToServer(url);
};
