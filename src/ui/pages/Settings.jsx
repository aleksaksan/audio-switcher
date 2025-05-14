import React, { useEffect, useState } from 'react';
import { handleConnectClick, SERVER_URL_KEY } from '../hooks/useSocket';
import { useSocketStore } from '../store/socketStore';

export const Settings = () => {
  const [url, setUrl] = useState(localStorage.getItem(SERVER_URL_KEY).replace('http://', '') || '');
  const [platform, setPlatform] = useState('');
  const [hostname, setHostname] = useState('');

  const { clients, updateClientName } = useSocketStore();
  const [editNames, setEditNames] = useState({});

  const changeUrl = (event) => {
    let inputUrl = event.target.value;
    
    inputUrl = inputUrl.replace('http://', '');
    setUrl(inputUrl);
  };

  const connectToServer = () => {
    if (url.length > 0) {
      
      localStorage.setItem(SERVER_URL_KEY, url);
      handleConnectClick(localStorage.getItem(SERVER_URL_KEY));
    }
  }

  const handleNameChange = (id, newName) => {
    setEditNames(prev => ({ ...prev, [id]: newName }));
  };

  const handleApplyName = (id) => {
    const name = editNames[id];
    if (name?.trim()) {
      updateClientName(id, name.trim());
    }
  };

  useEffect(() => {
    window.electron.getInfo().then(data=>{
      setPlatform(data.platform);
      setHostname(data.hostname);
    });
  }, []);

  return (
    <div>
      <h2>Настройки подключения</h2>
      <label className="input">
        <span className="label">http://</span>
        <input 
          type="text" 
          placeholder="localhost:5000" 
          value={url} 
          onChange={changeUrl} 
        />
      </label>
      <button 
        className="btn btn-soft" 
        onClick={connectToServer}
        disabled={!url}
      >
        Подключиться
      </button>
      <div className="mt-4">
        <h2>Имя компьютера: {hostname}</h2>
        <h3>OС: {platform}</h3>
        <div>

          {platform === 'linux' && (
          <>
            <p>
              Для корректной работы приложение в OS Linux необходимо установить amixer. Вы можете это сделать выполнив следующие команды в терминале:<br/>
              sudo apt update<br/>
              sudo apt install alsa-utils
            </p>
            <button className="btn btn-soft mt-4" onClick={() => window.electron.openLinuxInstallTerminal()}>
              Установить alsa-utils
            </button>
          </>
          )}
          
        </div>
      </div>
      
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Подключённые клиенты:</h3>
        {clients.length === 0 ? (
          <p className="text-gray-500">Нет подключённых клиентов.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {clients.map((client) => (
              <div
                key={client.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-4 border rounded-xl bg-gray-50 shadow-sm"
              >
                <div className="text-xs text-gray-500 break-all">{client.id}</div>

                <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                  <input
                    type="text"
                    className="input input-sm w-full sm:w-48"
                    value={editNames[client.id] ?? client.name}
                    onChange={(e) => handleNameChange(client.id, e.target.value)}
                  />
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => handleApplyName(client.id)}
                  >
                    Применить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
