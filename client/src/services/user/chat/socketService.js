import io from "socket.io-client";

let socket = null;
let currentChatID = null;
let currentChatType = null;

const listeners = {
  message: [],
  image: [],
  read: [],
  typing: [],
  error: [],
};

function notify(type, data) {
  listeners[type]?.forEach((cb) => cb(data));
}

export const socketService = {
  async connect(chatID, token, chatType = "personal") {
    if (
      socket &&
      socket.connected &&
      chatID === currentChatID &&
      chatType === currentChatType
    )
      return;

    currentChatID = chatID;
    currentChatType = chatType;
    socket?.disconnect();

    const debug = import.meta.env.VITE_DEBUG === "true";
    const baseWsUrl = debug
      ? import.meta.env.VITE_WS_DEV_URL
      : import.meta.env.VITE_WS_PROD_URL;

    socket = io(baseWsUrl, {
      path: "/socket.io/",
      query: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      console.log("Socket connected");
      socket.emit("join_chat", {
        chat_type: chatType,
        chat_id: chatID,
      });
    });

    socket.on("joined", (data) => {
      console.log("Joined chat room:", data.room);
    });

    socket.on("message", (data) => {
      notify("message", data);
    });

    socket.on("image", (data) => {
      notify("image", data);
    });

    socket.on("read", (data) => {
      notify("read", data);
    });

    socket.on("typing", (data) => {
      notify("typing", data);
    });

    socket.on("error", (data) => {
      console.error("Socket error", data);
      notify("error", data);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
      currentChatID = null;
      currentChatType = null;
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error", error);
      notify("error", { error: "Connection error" });
    });
  },

  disconnect() {
    if (socket) {
      if (socket.connected) {
        socket.emit("leave_chat", {});
      }
      socket.disconnect();
      socket = null;
    }
    currentChatID = null;
    currentChatType = null;
  },

  sendMessage(data) {
    if (socket?.connected) {
      socket.emit("send_message", data);
    } else {
      console.error("Socket is not connected");
    }
  },

  sendTyping() {
    if (socket?.connected) {
      socket.emit("typing", {});
    }
  },

  sendImage(data) {
    if (socket?.connected) {
      socket.emit("send_image", data);
    } else {
      console.error("Socket is not connected");
    }
  },

  markRead(messageId) {
    if (socket?.connected) {
      socket.emit("mark_read", { message_id: messageId });
    }
  },

  on(type, callback) {
    if (listeners[type]) listeners[type].push(callback);
  },

  off(type, callback) {
    if (listeners[type]) {
      listeners[type] = listeners[type].filter((cb) => cb !== callback);
    }
  },
};
