import { TrayMuteButton } from "./TrayMuteButton";

export const TrayClientListItem = ({ id, title, isMuted, onToggle }) => {
  return (
    <li>
      <div>
        <TrayMuteButton
          title={title}
          onClick={() => onToggle(id)}
          isMuted={isMuted}
        />
      </div>
    </li>
  );
};
