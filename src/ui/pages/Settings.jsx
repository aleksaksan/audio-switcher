import React, { useState } from 'react';
import { handleConnectClick, SERVER_URL_KEY } from '../hooks/useSocket';

export const Settings = () => {
  const [url, setUrl] = useState(localStorage.getItem(SERVER_URL_KEY) || '');

  const changeUrl = (event) => {
    setUrl(event.target.value);
  };

  const connectToServer = () => {
    if (url.length > 0) {
      localStorage.setItem(SERVER_URL_KEY, url);
    }
    handleConnectClick(url);
  }

  return (
    <div>
      Settings Page
      <label className="input">
        <span className="label">http://</span>
        <input type="text" placeholder="URL" value={url} onChange={changeUrl} />
      </label>
      <button className="btn btn-soft" onClick={connectToServer}>Connect</button>
    </div>
  );
};
