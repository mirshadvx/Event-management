let socket = null;
let listeners = [];
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;

export const connectWebSocket = async (userId, onMessage) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
        console.log("WebSocket connection already established");
        return;
    }

    try {
        const token = await fetch("/api/v1/chat/get-ws-token/")
            .then((res) => res.json())
            .then((data) => data.token);

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
            if (reconnectAttempts < maxReconnectAttempts) {
                reconnectAttempts++;
                setTimeout(() => connectWebSocket(userId, onMessage), 3000);
            }
        };

        socket.onerror = (error) => {
            console.error("WebSocket error:", error);
        };

        listeners.push(onMessage);
    } catch (error) {
        console.error("Error connecting WebSocket:", error);
    }
};

export const disconnectWebSocket = () => {
    if (socket) {
        socket.close();
        socket = null;
        reconnectAttempts = 0;
    }
};

export const addListener = (callback) => {
    listeners.push(callback);
};

export const removeListener = (callback) => {
    const index = listeners.indexOf(callback);
    if (index !== -1) {
        listeners.splice(index, 1);
    }
};
