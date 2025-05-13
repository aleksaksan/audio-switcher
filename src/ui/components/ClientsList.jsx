import React from 'react';
import { ClientsListItem } from './ClientsListItem';

export const ClientsList = ({ list }) => {
  return (
    <ul className="list bg-base-100 rounded-box shadow-md">
    
        <li className="p-4 pb-2 text-xs opacity-60 tracking-wide">
          Список подключённых устройств
        </li>
    
        {list.map(item =>(
          <ClientsListItem
            key={item.id}
            id={item.id}
            title={item.title}
            description={item.description}
            isMuted={item.isMuted}
          />
        ))}
    
      </ul>
  );
};
