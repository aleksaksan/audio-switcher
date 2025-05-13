import React from 'react';
import { ConnectionStatus } from '../components/ConnectionStatus';
import { ClientsList } from '../components/ClientsList';
import { useSocketStore } from '../store/socketStore';

// const listMock = [
//   { id: 0, title: "Comp 0", description: "description" },
//   { id: 1, title: "Comp 1", description: "description1" },
//   { id: 2, title: "Comp 2", description: "description2" },
// ]

export const Home = () => {
  const clients = useSocketStore((state) => state.clients);
  const isConnected = useSocketStore((state) => state.isConnected);

  return (
    <div>
      <ConnectionStatus isConnected={isConnected} />
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
