import io from "socket.io-client";

let socket = null;
let currentUserId = null;

export const connectWebSocket = (
  url,
  userId,
  onMessage,
  onOpen,
  onClose,
  onError
) => {
  if (socket && socket.connected && currentUserId === userId) {
    console.log("Socket.io already connected for user:", userId);
    return;
  }

  if (socket && socket.connected && currentUserId !== userId) {
    socket.disconnect();
    socket = null;
  }

  currentUserId = userId;

  socket = io(url, {
    path: "/socket.io/",
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on("connect", () => {
    console.log("Socket.io connected for user:", userId);
    socket.emit("join_organizer", { user_id: userId });
    if (onOpen) onOpen();
  });

  socket.on("organizer_joined", (data) => {
    console.log("Joined organizer room:", data.room);
  });

  socket.on("status_update", (data) => {
    if (onMessage) onMessage(data);
  });

  socket.on("disconnect", () => {
    console.log("Socket.io disconnected for user:", userId);
    if (onClose) onClose();
  });

  socket.on("connect_error", (error) => {
    console.error("Socket.io error for user:", userId, error);
    if (onError) onError(error);
  });
};

export const disconnectWebSocket = (userId) => {
  if (socket && socket.connected && currentUserId === userId) {
    socket.disconnect();
    socket = null;
    currentUserId = null;
  }
};
