import { useEffect, useRef } from "react";
import {
  connectWebSocket,
  disconnectWebSocket,
} from "@/services/user/profile/websocketService";

export const useWebSocket = (url, userId, onMessage, shouldConnect) => {
  const wsInitialized = useRef(false);

  useEffect(() => {
    if (shouldConnect && userId && !wsInitialized.current) {
      wsInitialized.current = true;
      connectWebSocket(
        url,
        userId,
        onMessage,
        () => console.log("Socket.io connected"),
        () => console.log("Socket.io disconnected"),
        (error) => console.error("Socket.io error:", error)
      );
    }

    return () => {
      if (wsInitialized.current) {
        disconnectWebSocket(userId);
        wsInitialized.current = false;
      }
    };
  }, [url, userId, shouldConnect, onMessage]);
};
