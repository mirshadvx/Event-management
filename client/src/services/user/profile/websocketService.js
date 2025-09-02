let socket = null;
let currentUserId = null;

export const connectWebSocket = (url, userId, onMessage, onOpen, onClose, onError) => {
  if (socket && socket.readyState === WebSocket.OPEN && currentUserId === userId) {
    console.log("WebSocket already connected for user:", userId);
    return;
  }

  if (socket && socket.readyState === WebSocket.OPEN && currentUserId !== userId) {
    socket.close();
    socket = null;
  }

  currentUserId = userId;
  socket = new WebSocket(`${url}/ws/organizer/${userId}/`);

  socket.onopen = () => {
    console.log("WebSocket connected for user:", userId);
    if (onOpen) onOpen();
  };

  socket.onmessage = (e) => {
    const data = JSON.parse(e.data);
    if (onMessage) onMessage(data);
  };

  socket.onclose = () => {
    console.log("WebSocket disconnected for user:", userId);
    if (onClose) onClose();
  };

  socket.onerror = (error) => {
    console.error("WebSocket error for user:", userId, error);
    if (onError) onError(error);
  };
};

export const disconnectWebSocket = (userId) => {
  if (socket && socket.readyState === WebSocket.OPEN && currentUserId === userId) {
    socket.close();
    socket = null;
    currentUserId = null;
  }
};
