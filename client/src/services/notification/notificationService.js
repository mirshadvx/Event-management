import api from "../api";

export const fetchNotifications = async () => {
    try {
        const response = await api.get("chat/notifications/");
        return response.data;
    } catch (error) {
        console.error("Error fetching notifications:", error);
        throw error;
    }
};

export const deleteNotification = async (notificationId) => {
    try {
        await api.delete(`chat/notifications/${notificationId}/`);
    } catch (error) {
        console.error("Error deleting notification:", error);
        throw error;
    }
};

export const clearAllNotification = async () => {
    try {
        const response = await api.delete("chat/notifications/");
        return response.data;
    } catch (error) {
        console.error("Error deleting notifications:", error);
        throw error;
    }
};
