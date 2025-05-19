import { ConnectionStatus } from '../components/ConnectionStatus';
import { ClientsList } from '../components/ClientsList';
import { useSocketStore } from '../store/socketStore';
import { MuteButton } from '../components/MuteButton';
import { useEffect } from 'react';

export const Home = () => {
  const { clients, isConnected, broadcastToggleMute, isAllMuted } = useSocketStore();

  useEffect(() => {
    window.electron.sendClientList(clients);
  }, [clients]);

  useEffect(() => {
    const handler = () => {
      broadcastToggleMute();
    };

    window.electron.onMuteAllTriggered(handler);
    return () => {
      window.electron.removeMuteAllTriggeredListener();
    };
  }, [broadcastToggleMute]);

  return (
    <div>
      <div className="py-4 px-10">
        <ConnectionStatus isConnected={isConnected} />
      </div>
      <div className="py-2 px-10 text-end">
        <span className="mr-8 text-xs opacity-60 ">Заглушить всех</span>
        <MuteButton
          isMuted={isAllMuted}
          onClick={broadcastToggleMute}
        />
      </div>
      {clients.length > 0 ? (
        <ClientsList list={clients.map(client => ({
          id: client.id,
          title: client.name,
          description: `ID: ${client.id}`,
          isMuted: client.isMuted,
        }))} />
      ) : (
        <div className="text-center mt-4 opacity-60">
          Нет подключенных устройств
        </div>
      )}
    </div>
  );
};
