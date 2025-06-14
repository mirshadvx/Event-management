import chatApi from "../chat/chatApi";

let socket = null;
let listeners = [];
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;

export const connectWebSocket = async (userId, onMessage) => {
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
        console.log("WebSocket connection already established or connecting");
        addListener(onMessage);
        return;
    }

    if (socket) {
        socket.close();
        socket = null;
    }

    try {
        const token = await chatApi.getSocketToken();
        socket = new WebSocket(`ws://localhost:8000/ws/notifications/${userId}/?token=${token}`);

        socket.onopen = () => {
            console.log("WebSocket connected");
            reconnectAttempts = 0;
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            listeners.forEach((callback) => callback(data));
        };

        socket.onclose = () => {
            console.log("WebSocket disconnected");
            socket = null;
            if (reconnectAttempts < maxReconnectAttempts) {
                reconnectAttempts++;
                const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000);
                console.log(`Reconnecting... Attempt ${reconnectAttempts} after ${delay}ms`);
                setTimeout(() => connectWebSocket(userId, onMessage), delay);
            }
        };

        socket.onerror = (error) => {
            console.error("WebSocket error:", error);
            socket.close();
        };

        addListener(onMessage);
    } catch (error) {
        console.error("Error connecting WebSocket:", error);
    }
};

export const disconnectWebSocket = () => {
    if (socket) {
        socket.close();
        socket = null;
        reconnectAttempts = 0;
        listeners = [];
    }
};

export const addListener = (callback) => {
    if (typeof callback === "function" && !listeners.includes(callback)) {
        listeners.push(callback);
    }
};

export const removeListener = (callback) => {
    listeners = listeners.filter((listener) => listener !== callback);
};
