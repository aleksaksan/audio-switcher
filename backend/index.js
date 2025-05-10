const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 5000 });

const clients = new Map();

wss.on('connection', (ws) => {
  const clientId = Math.random().toString(36).substr(2, 9);
  let clientName = `Client-${clientId}`;

  clients.set(clientId, { ws, name: clientName });

  // Отправляем обновлённый список всем
  broadcastClientList();

  ws.on('message', (message) => {
    const data = JSON.parse(message);

    if (data.type === 'rename') {
      clientName = data.name;
      clients.get(clientId).name = clientName;
      broadcastClientList();
    } else if (data.type === 'mute') {
      broadcast({ type: 'mute', target: data.target, isMuted: data.isMuted });
    }
  });

  ws.on('close', () => {
    clients.delete(clientId);
    broadcastClientList();
  });
});

function broadcastClientList() {
  const clientList = Array.from(clients.values()).map(client => ({
    id: client.ws._socket.remoteAddress,
    name: client.name
  }));
  broadcast({ type: 'client_list', clients: clientList });
}

function broadcast(message) {
  const data = JSON.stringify(message);
  clients.forEach(({ ws }) => {
    if (ws.readyState === WebSocket.OPEN) ws.send(data);
  });
}
