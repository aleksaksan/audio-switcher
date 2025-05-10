import React from 'react';
import { ConnectionStatus } from './ConnectionStatus';
import { ClientsList } from './ClientsList';

const listMock = [
  { id: 0, title: "Comp 0", description: "description" },
  { id: 1, title: "Comp 1", description: "description1" },
  { id: 2, title: "Comp 2", description: "description2" },
]

export const Home = () => {
  return (
    <div>
      <ConnectionStatus isConnected={true} />
      <ClientsList list={listMock}/>
    </div>
  );
};
