import React from 'react';
import { TrayClientListItem } from './TrayClientListItem';

export const TrayClientList = ({ isVertical, list, onToggleClient }) => {
  
  return (
    <ul className={`flex gap-4 flex-nowrap${isVertical ? " flex-col" : " flex-row"}`}>
      {list.map(item =>(
        <TrayClientListItem
          key={item.id}
          id={item.id}
          title={item.title}
          description={item.description}
          isMuted={item.isMuted}
          onToggle={() => onToggleClient(item.id)}
        />
      ))}
    </ul>
  );
};
