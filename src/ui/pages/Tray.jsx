import { useEffect, useRef, useState } from "react";
import { MuteButton } from "../components/MuteButton";
import { TrayClientList } from "../components/TrayClientList";
import { TRAY_POSITION_KEY } from "./Settings";


export const Tray = () => {
  // const [isConnected, setIsConnected] = useState(false);
  const [clients, setClients] = useState([]);
  const [isVertical, setIsVertical] = useState(false);
  const isAllmuted = clients?.length > 0 && clients.every(client => client.isMuted);
  const containerRef = useRef(null);
  const handleToggleClient = (clientId) => {
    console.log('Toggling client mute from tray:', clientId);
    window.electron.sendToggleClient(clientId);
  };

  // Функция для сортировки клиентов по порядковому номеру
  const getSortedClients = () => {
    return [...clients].sort((a, b) => a.order - b.order);
  };

  const position = localStorage.getItem(TRAY_POSITION_KEY) || 'top-center';
  
  useEffect(() => {
    document.documentElement.classList.add('bg-transparent');
    // window.electron.onConnectionStatus(setIsConnected);
    window.electron.onClientListUpdate(setClients);

    window.electron.requestClientList().then(setClients);
    // window.electron.requestConnectionStatus().then(setIsConnected);

    window.electron.sendTrayReady?.();

    const intervalId = setInterval(() => {
      window.electron.requestClientList().then(setClients);
      // window.electron.requestConnectionStatus().then(setIsConnected);
    }, 2000);
  
    return () => {
      document.documentElement.classList.remove('bg-transparent');
      // window.electron.removeConnectionStatusListener();
      window.electron.removeClientListListener();
      clearInterval(intervalId);
    }
  }, []);

  useEffect(() => {
    window.electron.setTrayPosition(position);
    if (position === 'top-center' || position === 'bottom-center') {
      setIsVertical(false)
    } else {
      setIsVertical(true);
    }
  }, [position]);

  const updateWindowSize = () => {
    const container = containerRef.current;
    if (!container) return;

    // Получаем размеры контента
    const rect = container.getBoundingClientRect();
    
    // Добавляем небольшой запас для предотвращения появления полос прокрутки
    const width = Math.ceil(Math.max(rect.width, container.scrollWidth)) + (isVertical ? 10 : 0);
    const height = Math.ceil(Math.max(rect.height, container.scrollHeight)) + 5;

    window.electron?.resizeWindow(width, height);
  };

  // Вызываем при монтировании и после изменений
  useEffect(() => {
    // Используем несколько таймаутов для более надежного обновления размеров
    const timer1 = setTimeout(updateWindowSize, 50);
    const timer2 = setTimeout(updateWindowSize, 150);
    const timer3 = setTimeout(updateWindowSize, 300);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [clients, isVertical]);

  const toggleMute = () => {
    window.electron.sendMuteAll();
  };
 
  const sortedClients = getSortedClients();
  
  return (
    <div ref={containerRef} className="overflow-hidden">
      <div className={`p-4 pt-7 text-xs flex gap-8 flex-nowrap${isVertical ? " flex-col" : " flex-row"}`}>
          <MuteButton
            isMuted={isAllmuted}
            onClick={toggleMute}
          />
        {sortedClients.length > 0 && (
          <TrayClientList list={sortedClients.map(client => ({
            id: client.id,
            title: client.name,
            description: `ID: ${client.id}`,
            isMuted: client.isMuted,
          }))}
            onToggleClient={handleToggleClient}
            isVertical= {isVertical}
          />
        )}
      </div>
    </div>
  );
};
  