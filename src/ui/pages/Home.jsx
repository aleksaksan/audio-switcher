import React from 'react';
import { ConnectionStatus } from '../components/ConnectionStatus';
import { ClientsList } from '../components/ClientsList';
import { useSocketStore } from '../store/socketStore';

export const Home = () => {
  const clients = useSocketStore((state) => state.clients);
  const isConnected = useSocketStore((state) => state.isConnected);

  return (
    <div className="">
      <div className="py-4 px-10">
        <ConnectionStatus isConnected={isConnected} />
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
