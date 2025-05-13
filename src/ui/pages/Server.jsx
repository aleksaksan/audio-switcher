import React, { useEffect } from 'react';
import { StatusIcon } from '../components/StatusIcon';
import { Loader } from '../components/Loader';
import { useServerStore } from '../store/serverStore';

export const Server = () => {
  const {
    port,
    setPort,
    isLoading,
    isServerRunning,
    serverUrls,
    toggleServer,
    checkServerStatus,
  } = useServerStore();

  useEffect(() => {
    checkServerStatus();
  }, [checkServerStatus]);
  
  const setPortHandler = (e) => {
    setPort(Number(e.target.value));
  };

  return (
    <div className=''>
      Server Page
      <label className="input">
        <span className="label">PORT</span>
        <input type="text" placeholder="5000" value={port} onChange={setPortHandler} />
      </label>
      <button className="btn btn-soft">Применить</button>

      {isLoading ? <Loader /> :<StatusIcon isTrue={isServerRunning} />}

      {serverUrls.length > 0 && (
        <div className="urls-section">
          <div className="urls-title">URL для подключения к этому компьютеру:</div>
          {serverUrls.map(item => (
            <div className="url-item" key={item.url}>
              <span className="url-value">{item.url}</span>
              <button 
                className="copy-btn"
                onClick={() => navigator.clipboard.writeText(item.url)}
              >
                Скопировать
              </button>
            </div>
          ))}
        </div>
      )}

      <input 
          type="checkbox" 
          className="toggle toggle-primary" 
          checked={isServerRunning}
          onChange={toggleServer}
          disabled={isLoading}
        />
    </div>
  )
}
