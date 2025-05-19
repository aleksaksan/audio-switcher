import { useEffect, useState } from "react";
import { ClientsList } from "../components/ClientsList";
import { ConnectionStatus } from "../components/ConnectionStatus";
import { MuteButton } from "../components/MuteButton";

export const Tray = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [clients, setClients] = useState([]);
  const isAllmuted = clients?.length > 0 && clients.every(client => client.isMuted);
  const handleToggleClient = (clientId) => {
    console.log('Toggling client mute from tray:', clientId);
    window.electron.sendToggleClient(clientId);
  };

  useEffect(() => {
    window.electron.onConnectionStatus(setIsConnected);
    window.electron.onClientListUpdate(setClients);

    window.electron.requestClientList().then(setClients);
    window.electron.requestConnectionStatus().then(setIsConnected);

    window.electron.sendTrayReady?.();

    const intervalId = setInterval(() => {
      window.electron.requestClientList().then(setClients);
      window.electron.requestConnectionStatus().then(setIsConnected);
    }, 2000);
  
    return () => {
      window.electron.removeConnectionStatusListener();
      window.electron.removeClientListListener();
      clearInterval(intervalId);
    }
  }, []);

  const toggleMute = () => {
    window.electron.sendMuteAll();
  };
 
  
    return (
      <div className="p-4 text-xs">
        <div className="flex items-center justify-between mb-2 p-4">
          <ConnectionStatus isConnected={isConnected} />
          {clients.length > 0 && (
            <MuteButton
              isMuted={isAllmuted}
              onClick={toggleMute}
            />
          )}
        </div>
        {clients.length > 0 ? (
          <ClientsList list={clients.map(client => ({
            id: client.id,
            title: client.name,
            description: `ID: ${client.id}`,
            isMuted: client.isMuted,
          }))}
            onToggleClient={handleToggleClient}
          />
        ) : (
          <div className="text-center mt-2 opacity-60">
            Нет подключенных устройств
          </div>
        )}
      </div>
    );
  };
  