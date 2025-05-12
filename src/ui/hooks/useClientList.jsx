import { useEffect, useState } from 'react';

export const useClientList = () => {
  const [clients, setClients] = useState([]);

  useEffect(() => {
    const update = (newClients) => {
      setClients(newClients);
    };

    window.electron.onClientList(update);

    return () => {
      // желательно очистить слушатель
    };
  }, []);

  return clients;
};
