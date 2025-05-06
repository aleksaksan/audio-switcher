import React, { useState } from 'react';

function ClientList({ clients, ws, onRename, onToggleMute }) {
  const [editingId, setEditingId] = useState(null);
  const [tempName, setTempName] = useState('');

  const handleRename = (id, name) => {
    onRename(id, name);
    setEditingId(null);
  };

  return (
    <div className="client-list">
      {clients.map((client) => (
        <div key={client.id} className="client-item">
          {editingId === client.id ? (
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onBlur={() => handleRename(client.id, tempName)}
            />
          ) : (
            <span onClick={() => { setEditingId(client.id); setTempName(client.name); }}>
              {client.name}
            </span>
          )}
          <button
            onClick={() => onToggleMute(client.id, !client.isMuted)}
            className={client.isMuted ? 'muted' : ''}
          >
            {client.isMuted ? 'Unmute' : 'Mute'}
          </button>
        </div>
      ))}
    </div>
  );
}

export default ClientList;