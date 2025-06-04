import React, { useEffect, useState } from 'react';
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
  const [newPort, setNewPort] = useState(port.toString());

  useEffect(() => {
    checkServerStatus();
  }, [checkServerStatus]);
  
  const setPortHandler = () => {
    setPort(Number(newPort));
  };

  return (
    <div className="py-4 px-10">
      <div className="pb-4 pl-10 flex justify-between items-center">
        <h2 className="block">Сервер</h2>
        {isLoading ? <Loader /> :
        <div className="flex items-center">
          {isServerRunning && <div className="mr-4">started...</div>}
          <StatusIcon isTrue={isServerRunning} />
        </div>}
      </div>
      <div className="text-center">
        <label className="input">
          <span className="label">PORT</span>
          <input type="text" placeholder="5000" value={newPort} onChange={e=>setNewPort(e.target.value)} />
        </label>
        <button className="btn btn-soft" onClick={setPortHandler}>Применить</button>
      </div>
      

      {serverUrls.length > 0 && (
        <div className="urls-section mt-10 mb-6 px-10">
          <div className="urls-title mb-6">URL для подключения к этому компьютеру:</div>
          {serverUrls.map(item => (
            <div className="url-item flex justify-between items-center py-1" key={item.url}>
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

      <div className="m-auto text-center mt-10">
        <input 
          type="checkbox" 
          className="toggle toggle-primary" 
          checked={isServerRunning}
          onChange={toggleServer}
          disabled={isLoading}
        />
      </div>
    </div>
  )
}
