import React from 'react';
import { MuteButton } from './MuteButton';
import { useSocketStore } from '../store/socketStore';

export const ClientsListItem = ({ id, title, description, isMuted}) => {
  const sendToggle = useSocketStore((state) => state.sendToggle);

  return (
    <li className="list-row px-10">
      <div>
        <div>{title}</div>
        <div className="text-xs uppercase font-semibold opacity-60">{description}</div>
      </div>
      <div className="ml-auto">
        <MuteButton
          onClick={()=>sendToggle(id)}
          isMuted={isMuted}
        />
      </div>
    </li>
  );
};
