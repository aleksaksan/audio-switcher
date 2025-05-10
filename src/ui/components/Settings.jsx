import React from 'react';

export const Settings = () => {
  return (
    <div>
      Settings Page
      <label className="input">
        <span className="label">http://</span>
        <input type="text" placeholder="URL" />
      </label>
      <button className="btn btn-soft">Connect</button>
    </div>
  );
};
