import React, { useEffect, useState } from 'react';
import { handleConnectClick, SERVER_URL_KEY } from '../hooks/useSocket';

export const Settings = () => {
  const [url, setUrl] = useState(localStorage.getItem(SERVER_URL_KEY).replace('http://', '') || '');
  const [platform, setPlatform] = useState('');
  const changeUrl = (event) => {
    let inputUrl = event.target.value;
    // Убираем 'http://' если пользователь его ввел
    inputUrl = inputUrl.replace('http://', '');
    setUrl(inputUrl);
  };

  const connectToServer = () => {
    if (url.length > 0) {
      
      localStorage.setItem(SERVER_URL_KEY, url);
      handleConnectClick(localStorage.getItem(SERVER_URL_KEY));
    }
  }

  useEffect(() => {
    window.electron.getInfo().then(setPlatform);
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
      <div>
        <h3>OS: {platform}</h3>
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
    </div>
  );
};
