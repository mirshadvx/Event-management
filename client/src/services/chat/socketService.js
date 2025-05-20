let socket = null;
let currentChatID = null;
let currentChatType = null;

const listeners = {
    message: [],
    read: [],
    typing: [],
    error: [],
};

function notify(type, data) {
    listeners[type]?.forEach((cb) => cb(data));
}

export const socketService = {
    async connect(chatID, token, chatType = 'personal') {
        if (socket && socket.readyState === WebSocket.OPEN && chatID === currentChatID && chatType === currentChatType) return;

        currentChatID = chatID;
        currentChatType = chatType;
        socket?.close();

        const path = chatType === 'group' ? `ws/group-chat/${chatID}/?token=${token}` : `ws/chat/${chatID}/?token=${token}`;
        socket = new WebSocket(`ws://localhost:8000/${path}`);

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

    sendMessage(message) {
        if (socket?.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: "message", message }));
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
    }
};



// let socket = null;
// let currentChatID = null;

// const listeners = {
//     message: [],
//     read: [],
//     typing: [],
//     error: [],
// };

// function notify(type, data) {
//     listeners[type]?.forEach((cb) => cb(data));
// }

// export const socketService = {
//     async connect(chatID, token) {
//         if (socket && socket.readyState === WebSocket.OPEN && chatID === currentChatID) return;

//         currentChatID = chatID;
//         socket?.close();

//         socket = new WebSocket(`ws://localhost:8000/ws/chat/${chatID}/?token=${token}`);

//         socket.onopen = () => {
//             console.log("Socket connected");
//         };

//         socket.onmessage = (event) => {
//             const data = JSON.parse(event.data);
//             notify(data.type, data);
//         };

//         socket.onerror = (err) => {
//             console.error("Socket error", err);
//             notify("error", { error: "Connection error" });
//         };

//         socket.onclose = () => {
//             console.log("Socket closed");
//             currentChatID = null;
//             socket = null;
//         };
//     },

//     disconnect() {
//         socket?.close();
//         socket = null;
//         currentChatID = null;
//     },

//     sendMessage(message) {
//         if (socket?.readyState === WebSocket.OPEN) {
//             socket.send(JSON.stringify({ type: "message", message }));
//         }
//     },

//     sendTyping() {
//         if (socket?.readyState === WebSocket.OPEN) {
//             socket.send(JSON.stringify({ type: "typing" }));
//         }
//     },

//     on(type, callback) {
//         if (listeners[type]) listeners[type].push(callback);
//     },

//     off(type, callback) {
//         if (listeners[type]) {
//             listeners[type] = listeners[type].filter((cb) => cb !== callback);
//         }
//     }
// };
