import React, { useEffect } from 'react';
import { ConnectionStatus } from '../components/ConnectionStatus';
import { ClientsList } from '../components/ClientsList';

const listMock = [
  { id: 0, title: "Comp 0", description: "description" },
  { id: 1, title: "Comp 1", description: "description1" },
  { id: 2, title: "Comp 2", description: "description2" },
]

export const Home = () => {
  // useEffect(() => {
  //   const loadData = async () => {
  //     try {
  //       const data = await window.electron.getSystemInfo();
  //       console.log(data);
  //     } catch (err) {
  //       console.error(err);
  //     }
  //   };

  //   loadData();
  // }, []);
  return (
    <div>
      <ConnectionStatus isConnected={true} />
      <ClientsList list={listMock}/>
    </div>
  );
};
