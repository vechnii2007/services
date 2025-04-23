import api from "../middleware/api";

export class BaseService {
  constructor(basePath) {
    this.basePath = basePath;
  }

  async get(endpoint = "", params = {}) {
    const response = await api.get(`${this.basePath}${endpoint}`, { params });
    return response.data;
  }

  async post(endpoint = "", data = {}) {
    const response = await api.post(`${this.basePath}${endpoint}`, data);
    return response.data;
  }

  async put(endpoint = "", data = {}) {
    const response = await api.put(`${this.basePath}${endpoint}`, data);
    return response.data;
  }

  async delete(endpoint = "") {
    const response = await api.delete(`${this.basePath}${endpoint}`);
    return response.data;
  }

  async upload(endpoint = "", formData) {
    const response = await api.post(`${this.basePath}${endpoint}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  }
}
