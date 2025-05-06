import React, { useState, useEffect } from 'react';
import ConnectModal from './ConnectModal';
import ClientList from './ClientList';
import './styles.css';

function App() {
  const [clients, setClients] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [ws, setWs] = useState(null);
  const [showModal, setShowModal] = useState(!localStorage.getItem('serverUrl'));

  const connectToServer = (url) => {
    const socket = new WebSocket(url || localStorage.getItem('serverUrl'));
    setWs(socket);

    socket.onopen = () => {
      setIsConnected(true);
      setShowModal(false);
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'client_list') setClients(data.clients);
    };

    socket.onclose = () => setIsConnected(false);
  };

  return (
    <div className="app">
      {showModal ? (
        <ConnectModal onConnect={connectToServer} />
      ) : (
        <ClientList
          clients={clients}
          ws={ws}
          onRename={(id, name) => ws.send(JSON.stringify({ type: 'rename', id, name }))}
          onToggleMute={(id, isMuted) => ws.send(JSON.stringify({ type: 'mute', target: id, isMuted }))}
        />
      )}
    </div>
  );
}

export default App;
