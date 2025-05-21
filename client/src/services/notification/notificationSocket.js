import chatApi from "../chatApi";

let socket = null;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
let isConnecting = false;

export const connectWebSocket = async (userId, onMessage) => {
    if (socket && socket.readyState === WebSocket.OPEN || isConnecting) {
        console.log("WebSocket connection already established or in progress");
        return;
    }

    isConnecting = true;

    try {
        const token = await chatApi.getSocketToken();

        socket = new WebSocket(`ws://localhost:8000/ws/notifications/${userId}/?token=${token}`);

        socket.onopen = () => {
            console.log("WebSocket connection established");
            reconnectAttempts = 0; 
            isConnecting = false;
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log("********",data)
            onMessage(data);
        };

        socket.onclose = () => {
            console.log("WebSocket connection closed");
            isConnecting = false;

           
            if (reconnectAttempts < maxReconnectAttempts) {
                reconnectAttempts++;
                console.log(`Attempting to reconnect (${reconnectAttempts}/${maxReconnectAttempts})...`);
                setTimeout(() => connectWebSocket(userId, onMessage), 3000);
            } else {
                console.log("Max reconnection attempts reached");
            }
        };

        socket.onerror = (error) => {
            console.error("WebSocket error:", error);
            isConnecting = false;
        };
    } catch (error) {
        console.error("Error getting socket token:", error);
        isConnecting = false;
    }
};

export const disconnectWebSocket = () => {
    if (socket) {
        socket.close();
        socket = null;
        reconnectAttempts = 0;
    }
};
