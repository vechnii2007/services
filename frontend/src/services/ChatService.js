import { BaseService } from "./BaseService";

class ChatServiceClass extends BaseService {
  constructor() {
    super("/services"); // Используем тот же базовый путь, что и в OfferService
  }

  async getMessages(requestId) {
    return this.get(`/messages/${requestId}`);
  }

  async getMyChats() {
    return this.get("/my-chats");
  }

  async getProviderChats() {
    return this.get("/provider-chats");
  }

  async sendMessage(requestId, message, recipientId) {
    return this.post(`/messages/${requestId}`, {
      message,
      recipientId,
    });
  }
}

const ChatService = new ChatServiceClass();
export default ChatService;
