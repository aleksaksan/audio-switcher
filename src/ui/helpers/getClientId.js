export function getOrCreateClientId(socketId) {
  let id = localStorage.getItem('client-id');
  if (!id) {
    id = socketId;
    localStorage.setItem('client-id', id);
  }
  return id;
}
