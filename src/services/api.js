import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const authApi = {
  register: (payload) => api.post('/auth/register', payload),
  login: (payload) => api.post('/auth/login', payload),
};

export const panApi = {
  save: (payload) => api.post('/pan', payload),
  validate: (payload) => api.post('/pan/validate', payload),
  getByUserId: (userId) => api.get(`/pan/${userId}`),
};

export const form16Api = {
  save: (payload) => api.post('/form16', payload),
  getByUserId: (userId) => api.get(`/form16/${userId}`),
};

export const analysisApi = {
  getByUserId: (userId) => api.get(`/analysis/${userId}`),
};

export const tasksApi = {
  getByUserId: (userId) => api.get(`/tasks/${userId}`),
  markComplete: (taskId) => api.put(`/tasks/${taskId}/complete`),
};

export default api;
