import api from "../middleware/api";

export const ChatService = {
  getMessages: async (requestId) => {
    const response = await api.get(`/services/messages/${requestId}`);
    return response.data;
  },

  getMyChats: async () => {
    const response = await api.get("/services/my-chats");
    return response.data;
  },

  getProviderChats: async () => {
    const response = await api.get("/services/provider-chats");
    return response.data;
  },

  sendMessage: async (requestId, message) => {
    const response = await api.post(`/services/messages/${requestId}`, {
      message,
    });
    return response.data;
  },
};

export default ChatService;
