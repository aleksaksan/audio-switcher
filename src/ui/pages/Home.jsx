import React, { useEffect } from 'react';
import { ConnectionStatus } from '../components/ConnectionStatus';
import { ClientsList } from '../components/ClientsList';
import { useSocketStore } from '../store/socketStore';
import { MuteButton } from '../components/MuteButton';

export const Home = () => {
  const clients = useSocketStore((state) => state.clients);
  const isConnected = useSocketStore((state) => state.isConnected);
  const isMuted = useSocketStore((state) => state.isMuted);
  const broadcastToggleMute = useSocketStore((state) => state.broadcastToggleMute);
  const initializeMuteAll = useSocketStore((state) => state.initializeMuteAll);

  useEffect(() => {
    initializeMuteAll();
  }, []);

  return (
    <div>
      <div className="py-4 px-10">
        <ConnectionStatus isConnected={isConnected} />
      </div>
      <div className="py-2 px-10 text-end">
        <span className="mr-8 text-xs opacity-60 ">Заглушить всех</span><MuteButton isMuted={isMuted} onClick={broadcastToggleMute} />
      </div>
      {clients.length > 0 ? (
        <ClientsList list={clients.map(client => ({
          id: client.id,
          title: client.name,
          description: `ID: ${client.id}`,
          isMuted: client.isMuted,
        }))} />
      ) : (
        <div className="text-center mt-4 opacity-60">
          Нет подключенных устройств
        </div>
      )}
    </div>
  );
};
