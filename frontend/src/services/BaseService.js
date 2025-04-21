import api from "../middleware/api";

export class BaseService {
  constructor(basePath) {
    this.basePath = basePath;
  }

  async get(endpoint = "", params = {}) {
    try {
      const response = await api.get(`${this.basePath}${endpoint}`, { params });
      return response.data;
    } catch (error) {
      console.error(`[${this.constructor.name}] GET Error:`, error);
      throw error;
    }
  }

  async post(endpoint = "", data = {}) {
    try {
      const response = await api.post(`${this.basePath}${endpoint}`, data);
      return response.data;
    } catch (error) {
      console.error(`[${this.constructor.name}] POST Error:`, error);
      throw error;
    }
  }

  async put(endpoint = "", data = {}) {
    try {
      const response = await api.put(`${this.basePath}${endpoint}`, data);
      return response.data;
    } catch (error) {
      console.error(`[${this.constructor.name}] PUT Error:`, error);
      throw error;
    }
  }

  async delete(endpoint = "") {
    try {
      const response = await api.delete(`${this.basePath}${endpoint}`);
      return response.data;
    } catch (error) {
      console.error(`[${this.constructor.name}] DELETE Error:`, error);
      throw error;
    }
  }

  async upload(endpoint = "", formData) {
    try {
      const response = await api.post(`${this.basePath}${endpoint}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      console.error(`[${this.constructor.name}] UPLOAD Error:`, error);
      throw error;
    }
  }
}
