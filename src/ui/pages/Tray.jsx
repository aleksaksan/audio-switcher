import { ClientsList } from "../components/ClientsList";
import { ConnectionStatus } from "../components/ConnectionStatus";
import { MuteButton } from "../components/MuteButton";
import { useSocketStore } from "../store/socketStore";

export const Tray = () => {
    const clients = useSocketStore((state) => state.clients);
    const isConnected = useSocketStore((state) => state.isConnected);
    const broadcastToggleMute = useSocketStore((state) => state.broadcastToggleMute);
    const isAllMuted = useSocketStore((state) => state.isAllMuted);
  
    return (
      <div className="p-4 text-xs">
        <div className="flex items-center justify-between mb-2 p-4">
          <ConnectionStatus isConnected={isConnected} />
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
          <div className="text-center mt-2 opacity-60">
            Нет подключенных устройств
          </div>
        )}
      </div>
    );
  };
  