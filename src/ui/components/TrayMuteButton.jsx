import React from 'react';

export const TrayMuteButton = ({ title, isMuted, onClick }) => {
  return (
    <div className="tooltip w-full text-nowrap" data-tip={isMuted ? "Включить звук" : "Выключить звук"}>
      <button className={`min-w-[100px] w-full ${isMuted ? "btn btn-secondary" : "btn btn-success"}`} onClick={onClick}>
        {title}
      </button>
    </div>
  );
};
