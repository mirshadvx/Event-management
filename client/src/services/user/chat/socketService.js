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
        if (socket && socket.readyState === WebSocket.OPEN && chatID === currentChatID && chatType === currentChatType)
            return;

        currentChatID = chatID;
        currentChatType = chatType;
        socket?.close();

        const path = `ws/chat/${chatType}/${chatID}/?token=${token}`;

        const debug = import.meta.env.VITE_DEBUG === 'true';
        const baseWsUrl = debug
            ? import.meta.env.VITE_WS_DEV_URL
            : import.meta.env.VITE_WS_PROD_URL;

        socket = new WebSocket(`${baseWsUrl}/${path}`);

        socket.onopen = () => {
            console.log("Socket connected");
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            notify(data.type, data);
        };

        socket.onerror = (err) => {
            console.error("Socket error", err);
            notify("error", { error: "Connection error" });
        };

        socket.onclose = () => {
            console.log("Socket closed");
            currentChatID = null;
            currentChatType = null;
            socket = null;
        };
    },

    disconnect() {
        socket?.close();
        socket = null;
        currentChatID = null;
        currentChatType = null;
    },

    sendMessage(data) {
        if (socket?.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(data));
        } else {
            console.error("Socket is not open");
        }
    },

    sendTyping() {
        if (socket?.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: "typing" }));
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