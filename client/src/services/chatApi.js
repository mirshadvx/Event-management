import api from "./api";

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
};

export default chatApi;
