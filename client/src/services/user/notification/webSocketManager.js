import io from "socket.io-client";
import chatApi from "../chat/chatApi";

const baseWSUrl =
  import.meta.env.VITE_DEBUG === "true"
    ? import.meta.env.VITE_WS_DEV_URL
    : import.meta.env.VITE_WS_PROD_URL;

let socket = null;
let listeners = [];
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
let currentUserId = null;
let eventListenersRegistered = false;
let isConnecting = false;

const joinNotificationsRoom = () => {
  if (socket && socket.connected && currentUserId) {
    const user_id = String(currentUserId);
    socket.emit("join_notifications", { user_id: user_id });
  }
};

const registerEventListeners = () => {
  if (!socket || eventListenersRegistered) {
    return;
  }

  socket.on("connect", () => {
    reconnectAttempts = 0;
    isConnecting = false;
    setTimeout(() => {
      joinNotificationsRoom();
    }, 500);
  });

  socket.on("notifications_joined", () => {});

  socket.on("error", (error) => {
    console.error("Socket.io error:", error);
    isConnecting = false;
  });

  socket.on("notification", (data) => {
    if (!data) {
      console.error("Notification data is null or undefined");
      return;
    }

    if (listeners.length === 0) {
      console.warn("Notification received but no listeners registered");
      return;
    }

    listeners.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error("Error in notification callback:", error);
      }
    });
  });

  socket.on("organizer_status_update", (data) => {
    if (!data) {
      console.error("Organizer status update data is null or undefined");
      return;
    }

    listeners.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error("Error in organizer status update callback:", error);
      }
    });
  });

  socket.on("disconnect", () => {});

  socket.on("connect_error", (error) => {
    console.error("Socket.io connection error:", error);
    reconnectAttempts++;
    if (reconnectAttempts >= maxReconnectAttempts) {
      console.warn("Max reconnection attempts reached");
    }
  });

  socket.on("reconnect", () => {
    reconnectAttempts = 0;
    setTimeout(() => {
      joinNotificationsRoom();
    }, 200);
  });

  socket.on("reconnect_failed", () => {
    console.error("Socket.io reconnection failed");
  });

  eventListenersRegistered = true;
};

export const connectWebSocket = async (userId, onMessage) => {
  const userIdStr = String(userId);
  addListener(onMessage);

  if (isConnecting) {
    return;
  }
  if (socket && currentUserId !== null && String(currentUserId) !== userIdStr) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    eventListenersRegistered = false;
    isConnecting = false;
  }

  currentUserId = userIdStr;

  if (socket && socket.connected && String(currentUserId) === userIdStr) {
    if (!eventListenersRegistered) {
      registerEventListeners();
    }
    joinNotificationsRoom();
    return;
  }

  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    eventListenersRegistered = false;
  }

  isConnecting = true;
  try {
    const token = await chatApi.getSocketToken();

    socket = io(baseWSUrl, {
      path: "/socket.io/",
      query: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      forceNew: false,
    });

    registerEventListeners();

    if (socket.connected) {
      isConnecting = false;
      setTimeout(() => {
        joinNotificationsRoom();
      }, 200);
    }
  } catch (error) {
    console.error("Error connecting Socket.io:", error);
    eventListenersRegistered = false;
    isConnecting = false;
  }
};

export const disconnectWebSocket = () => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
  reconnectAttempts = 0;
  listeners = [];
  currentUserId = null;
  eventListenersRegistered = false;
  isConnecting = false;
};

export const addListener = (callback) => {
  if (typeof callback === "function" && !listeners.includes(callback)) {
    listeners.push(callback);
  }
};

export const removeListener = (callback) => {
  listeners = listeners.filter((listener) => listener !== callback);
};
