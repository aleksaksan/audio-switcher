import React, { useEffect } from 'react';
import { ConnectionStatus } from '../components/ConnectionStatus';
import { ClientsList } from '../components/ClientsList';
import { useClientList } from '../hooks/useClientList';

const listMock = [
  { id: 0, title: "Comp 0", description: "description" },
  { id: 1, title: "Comp 1", description: "description1" },
  { id: 2, title: "Comp 2", description: "description2" },
]

export const Home = () => {
  const clients = useClientList();
  useEffect(() => {
    console.log(clients)
  }, [clients]);
  
  return (
    <div>
      <ConnectionStatus isConnected={true} />
      <ClientsList list={listMock}/>
    </div>
  );
};
