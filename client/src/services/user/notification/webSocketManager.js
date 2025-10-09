import chatApi from "../chat/chatApi";

const baseWSUrl =
    import.meta.env.VITE_DEBUG === "true" ? import.meta.env.VITE_WS_DEV_URL : import.meta.env.VITE_WS_PROD_URL;

let socket = null;
let listeners = [];
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;

export const connectWebSocket = async (userId, onMessage) => {
    addListener(onMessage);
    
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
        console.log("WebSocket connection already established or connecting");
        return;
    }

    if (socket) {
        socket.close();
        socket = null;
    }

    try {
        const token = await chatApi.getSocketToken();
        const socketUrl = `${baseWSUrl}/ws/notifications/${userId}/?token=${token}`;
        console.log("Creating new WebSocket connection for user:", userId);
        socket = new WebSocket(socketUrl);

        socket.onopen = () => {
            console.log("WebSocket connected for user:", userId);
            reconnectAttempts = 0;
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log("WebSocket notification received for user:", userId, data);
                listeners.forEach((callback) => callback(data));
            } catch (err) {
                console.error("Error parsing WebSocket message:", err);
            }
        };

        socket.onclose = () => {
            console.log("WebSocket disconnected for user:", userId);
            socket = null;
            if (reconnectAttempts < maxReconnectAttempts) {
                reconnectAttempts++;
                const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000);
                console.log(`Reconnecting... Attempt ${reconnectAttempts} after ${delay}ms`);
                setTimeout(() => connectWebSocket(userId, onMessage), delay);
            } else {
                console.warn("Max reconnection attempts reached. No further reconnection.");
            }
        };

        socket.onerror = (error) => {
            console.error("WebSocket error:", error);
            socket.close();
        };
    } catch (error) {
        console.error("Error connecting WebSocket:", error);
    }
};

export const disconnectWebSocket = () => {
    if (socket) {
        socket.close();
        socket = null;
    }
    reconnectAttempts = 0;
    listeners = [];
};

export const addListener = (callback) => {
    if (typeof callback === "function" && !listeners.includes(callback)) {
        listeners.push(callback);
    }
};

export const removeListener = (callback) => {
    listeners = listeners.filter((listener) => listener !== callback);
};
