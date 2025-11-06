import io from "socket.io-client";
import chatApi from "../chat/chatApi";

const baseWSUrl =
  import.meta.env.VITE_DEBUG === "true"
    ? import.meta.env.VITE_WS_DEV_URL
    : import.meta.env.VITE_WS_PROD_URL;

let socket = null;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
let isConnecting = false;
let currentUserId = null;

const joinNotificationsRoom = () => {
  if (socket && socket.connected && currentUserId) {
    console.log("Joining notifications room for user:", currentUserId);
    socket.emit("join_notifications", { user_id: currentUserId });
  }
};

export const connectWebSocket = async (userId, onMessage) => {
  if (
    (socket && socket.connected && currentUserId === userId) ||
    isConnecting
  ) {
    console.log("Socket.io connection already established or in progress");
    if (socket && socket.connected) {
      joinNotificationsRoom();
    }
    return;
  }

  isConnecting = true;
  currentUserId = userId;

  try {
    const token = await chatApi.getSocketToken();

    socket = io(baseWSUrl, {
      path: "/socket.io/",
      query: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 3000,
      reconnectionDelayMax: 5000,
    });

    socket.on("connect", () => {
      console.log("Socket.io connection established");
      reconnectAttempts = 0;
      isConnecting = false;
      setTimeout(() => {
        joinNotificationsRoom();
      }, 100);
    });

    socket.on("notifications_joined", (data) => {
      console.log("Successfully joined notifications room:", data.room);
    });

    socket.on("notification", (data) => {
      console.log("Notification received:", data);
      if (onMessage) {
        try {
          onMessage(data);
        } catch (error) {
          console.error("Error in notification callback:", error);
        }
      }
    });

    socket.on("error", (error) => {
      console.error("Socket.io error event:", error);
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket.io connection closed, reason:", reason);
      isConnecting = false;
    });

    socket.on("connect_error", (error) => {
      console.error("Socket.io connection error:", error);
      isConnecting = false;
    });

    socket.on("reconnect", (attemptNumber) => {
      console.log("Socket.io reconnected, attempt:", attemptNumber);
      reconnectAttempts = 0;
      setTimeout(() => {
        joinNotificationsRoom();
      }, 100);
    });

    socket.on("reconnect_attempt", (attemptNumber) => {
      console.log("Socket.io reconnection attempt:", attemptNumber);
    });

    socket.on("reconnect_error", (error) => {
      console.error("Socket.io reconnection error:", error);
    });

    socket.on("reconnect_failed", () => {
      console.error("Socket.io reconnection failed");
    });
  } catch (error) {
    console.error("Error getting socket token:", error);
    isConnecting = false;
  }
};

export const disconnectWebSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    reconnectAttempts = 0;
    currentUserId = null;
  }
};
