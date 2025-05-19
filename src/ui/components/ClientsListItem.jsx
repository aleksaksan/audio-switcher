import React from 'react';
import { MuteButton } from './MuteButton';

export const ClientsListItem = ({ id, title, description, isMuted, onToggle }) => {

  return (
    <li className="list-row px-10">
      <div>
        <div>{title}</div>
        <div className="text-xs uppercase font-semibold opacity-60">{description}</div>
      </div>
      <div className="ml-auto">
        <MuteButton
          onClick={() => onToggle(id)}
          isMuted={isMuted}
        />
      </div>
    </li>
  );
};
