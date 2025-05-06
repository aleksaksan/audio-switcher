import React, { useState } from 'react';

function ConnectModal({ onConnect }) {
  const [url, setUrl] = useState('ws://localhost:3001');

  const handleSave = () => {
    localStorage.setItem('serverUrl', url);
    onConnect(url);
  };

  return (
    <div className="modal">
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="ws://server-ip:port"
      />
      <button onClick={handleSave}>Подключиться</button>
    </div>
  );
}

export default ConnectModal;
