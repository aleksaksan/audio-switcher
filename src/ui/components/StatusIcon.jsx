import React from 'react';

export const StatusIcon = ({ isTrue }) => {
  return (
    <div className="inline-grid *:[grid-area:1/1]">
      <div className={isTrue ? "status status-success animate-ping" : "status status-error animate-ping"}></div>
      <div className={isTrue ? "status status-success" : "status status-error"}></div>
    </div>
  );
};
