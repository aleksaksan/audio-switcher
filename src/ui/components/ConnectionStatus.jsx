import React from 'react';

export const ConnectionStatus = ({ isConnected }) => {
  return (
    <div className="text-right">
      {isConnected ? "connected" : "disconnected"}
      <div className="inline-grid *:[grid-area:1/1] ml-4">
        <div className={isConnected ? "status status-success animate-ping" : "status status-error animate-ping"}></div>
        <div className={isConnected ? "status status-success" : "status status-error"}></div>
      </div>
    </div>
  );
};
