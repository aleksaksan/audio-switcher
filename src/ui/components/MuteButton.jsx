import React from 'react';

export const MuteButton = ({ isMuted }) => {
  return (
    <div className="tooltip" data-tip={isMuted ? "Включить звук" : "Выключить звук"}>
      <button className={isMuted ? "btn btn-secondary" : "btn btn-success"}>
        {isMuted ? "Unmute" : "Mute"}
      </button>
    </div>
  );
};
