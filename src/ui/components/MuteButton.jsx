import React from 'react';

export const MuteButton = ({ isMuted, onClick }) => {
  return (
    <div className="tooltip ml-auto text-nowrap" data-tip={isMuted ? "Включить звук" : "Выключить звук"}>
      <button className={isMuted ? "btn btn-secondary" : "btn btn-success"} onClick={onClick}>
        {isMuted ? "Unmute" : "Mute"}
      </button>
    </div>
  );
};
