import React, { useEffect, useState } from 'react';
import { StatusIcon } from '../components/StatusIcon';
import { Loader } from '../components/Loader';

export const Server = () => {
  const [port, setPort] = useState(5000);
  const [isChecked, setIsChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isServerRunning, setIsServerRunning] = useState(false);
  const [serverUrls, setServerUrls] = useState([]);
  
  const setPortHandler = (event) => {
    const value = Number(event.target.value)
    if (!isNaN(value)) {
      setPort(value);
    } else {
      console.log("PORT is not number!!!")
    }
  };

  const startServer = async () => {
    setIsLoading(true);
    try {
      const urls = await window.electron.startServer(port);
      setIsChecked(true);
      setIsServerRunning(true);
      setServerUrls(urls);
    } catch (error) {
      console.error('Server error:', error);
      setIsChecked(false);
    } finally {
      setIsLoading(false);
    }
  };

  const stopServer = async () => {
    setIsLoading(true);
    try {
      await window.electron.stopServer();
      setIsChecked(false);
      setIsServerRunning(false);
      setServerUrls([]);
    } catch (error) {
      console.error('Stop server error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleServer = () => {
    if (isChecked) {
      stopServer();
    } else {
      startServer();
    }
  };

  useEffect(() => {
    window.electron.isServerRunning().then(running => {
      setIsChecked(running);
      setIsServerRunning(running);
    });
  },[])

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
          checked={isChecked}
          onChange={toggleServer}
          disabled={isLoading}
        />
    </div>
  )
}
