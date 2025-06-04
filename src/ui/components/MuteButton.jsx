export const MuteButton = ({ isMuted, onClick }) => {
  return (
    <div className="tooltip text-nowrap" data-tip={isMuted ? "Включить звук" : "Выключить звук"}>
      <button className={`min-w-[100px] ${isMuted ? "btn btn-secondary" : "btn btn-success"}`} onClick={onClick}>
        {isMuted ? "Unmute" : "Mute"}
      </button>
    </div>
  );
};
