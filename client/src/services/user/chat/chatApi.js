import api from "@/services/api";

const chatApi = {
    getMessages: async (conversationId) => {
        const response = await api.get(`chat/conversations/${conversationId}/messages/`);
        return response.data;
    },

    sendMessage: async (conversationId, content) => {
        const response = await api.post(`chat/conversations/${conversationId}/messages/`, {
            content,
        });
        return response.data;
    },
    
    sendImage: async (conversationId, imageData) => {
        const response = await api.post(`chat/conversations/${conversationId}/messages/`, {
            image: imageData,
        });
        return response.data;
    },

    getConversations: async () => {
        const response = await api.get(`chat/conversations/`);
        return response;
    },

    createConversation: async (participant_id) => {
        const response = await api.post(`chat/conversations/`, {
            participant_id: participant_id,
        });
        return response.data;
    },

    getSocketToken: async () => {
        const response = await api.get("chat/get-ws-token/");
        return response.data.token;
    },

    getGroupConversations: async () => {
        const response = await api.get("chat/group-conversations/");
        return response;
    },

    getGroupMessages: async (group_id) => {
        const response = await api.get(`chat/group-conversations/${group_id}/messages/`);
        return response;
    },

    getChatInfo: async (chatID, type) => {
        const response = await api.get(`/chat/chatInfo/${chatID}/${type}/`);
        return response;
    },
};

export default chatApi;
