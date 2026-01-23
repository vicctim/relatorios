import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
};

// Users API
export const usersApi = {
  list: () => api.get('/users'),
  get: (id: number) => api.get(`/users/${id}`),
  create: (data: { name: string; email: string; password: string; role: string }) =>
    api.post('/users', data),
  update: (id: number, data: Partial<{ name: string; email: string; password: string; role: string; active: boolean }>) =>
    api.put(`/users/${id}`, data),
  delete: (id: number) => api.delete(`/users/${id}`),
};

// Professionals API
export const professionalsApi = {
  list: () => api.get('/professionals'),
  listAll: () => api.get('/professionals/all'),
  get: (id: number) => api.get(`/professionals/${id}`),
  create: (name: string) => api.post('/professionals', { name }),
  update: (id: number, data: Partial<{ name: string; active: boolean }>) =>
    api.put(`/professionals/${id}`, data),
  delete: (id: number) => api.delete(`/professionals/${id}`),
};

// Settings API
export const settingsApi = {
  getPublic: () => api.get('/settings/public'),
  get: () => api.get('/settings'),
  getAll: () => api.get('/settings/all'),
  update: (data: Record<string, any>) => api.put('/settings', data),
  uploadLogo: (file: File) => {
    const formData = new FormData();
    formData.append('logo', file);
    return api.post('/settings/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getNotificationRecipients: () => api.get('/settings/notification-recipients'),
  addNotificationRecipient: (type: 'email' | 'whatsapp', value: string) =>
    api.post('/settings/notification-recipients', { type, value }),
  updateNotificationRecipient: (id: number, data: Partial<{ value: string; active: boolean }>) =>
    api.put(`/settings/notification-recipients/${id}`, data),
  deleteNotificationRecipient: (id: number) =>
    api.delete(`/settings/notification-recipients/${id}`),
  testNotification: (type: 'email' | 'whatsapp', recipient: string) =>
    api.post('/notifications/test', { type, recipient }),
};

// Videos API
export const videosApi = {
  list: (params?: {
    month?: number;
    year?: number;
    professionalId?: number;
    search?: string;
    parentOnly?: boolean;
    page?: number;
    limit?: number;
  }) => api.get('/videos', { params }),
  get: (id: number) => api.get(`/videos/${id}`),
  upload: (file: File, data: {
    title?: string;
    requestDate: string;
    completionDate: string;
    professionalId: number;
    isTv?: boolean;
    tvTitle?: string;
    includeInReport?: boolean;
    customDurationSeconds?: number;
  }, onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    formData.append('video', file);
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, String(value));
      }
    });
    return api.post('/videos', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
  },
  uploadVersion: (parentId: number, file: File, customDurationSeconds?: number, onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    formData.append('video', file);
    if (customDurationSeconds !== undefined) {
      formData.append('customDurationSeconds', customDurationSeconds.toString());
    }
    return api.post(`/videos/${parentId}/versions`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
  },
  update: (id: number, data: Partial<{
    title: string;
    requestDate: string;
    completionDate: string;
    professionalId: number;
    isTv: boolean;
    tvTitle: string | null;
    includeInReport?: boolean;
    customDurationSeconds?: number;
  }>) => api.put(`/videos/${id}`, data),
  delete: (id: number) => api.delete(`/videos/${id}`),
  downloadZip: (videoIds: number[]) => api.post('/videos/download-zip', { videoIds }, { responseType: 'blob' }),
  getStreamUrl: (id: number) => {
    const token = localStorage.getItem('token');
    return `/api/videos/${id}/stream${token ? `?token=${token}` : ''}`;
  },
  getDownloadUrl: (id: number) => {
    const token = localStorage.getItem('token');
    return `/api/videos/${id}/download${token ? `?token=${token}` : ''}`;
  },
  getThumbnailUrl: (id: number) => {
    const token = localStorage.getItem('token');
    return `/api/videos/${id}/thumbnail${token ? `?token=${token}` : ''}`;
  },
};

// Reports API
export const reportsApi = {
  getStats: (month?: number, year?: number) => api.get('/reports/stats', { params: { month, year } }),
  getMonthly: (year: number, month: number) => api.get(`/reports/${year}/${month}`),
  getMonthlyUsage: (year: number, month: number) => api.get(`/reports/${year}/${month}/usage`),
  getExport: (startDate: string, endDate: string, dateField: 'requestDate' | 'completionDate' = 'requestDate') =>
    api.get('/reports/export', { params: { startDate, endDate, dateField } }),
  getExportPdfUrl: (startDate: string, endDate: string, dateField: 'requestDate' | 'completionDate' = 'requestDate', manualRollover?: number) => {
    const token = localStorage.getItem('token');
    const rolloverParam = manualRollover !== undefined && manualRollover !== null ? `&manualRollover=${manualRollover}` : '';
    return `/api/reports/export/pdf?startDate=${startDate}&endDate=${endDate}&dateField=${dateField}${rolloverParam}${token ? `&token=${token}` : ''}`;
  },
  // History API
  getHistory: () => api.get('/reports/history'),
  getHistoryItem: (id: number) => api.get(`/reports/history/${id}`),
  downloadHistory: (id: number) => {
    const token = localStorage.getItem('token');
    return `/api/reports/history/${id}/download${token ? `?token=${token}` : ''}`;
  },
  deleteHistory: (id: number) => api.delete(`/reports/history/${id}`),
};

// Logs API
export const logsApi = {
  getDownloads: (params?: {
    startDate?: string;
    endDate?: string;
    userId?: number;
    videoId?: number;
    page?: number;
    limit?: number;
  }) => api.get('/logs/downloads', { params }),
  getDownloadsSummary: (month?: number, year?: number) =>
    api.get('/logs/downloads/summary', { params: { month, year } }),
};

// Shares API
export const sharesApi = {
  create: (data: {
    videoIds: number[];
    name?: string;
    message?: string;
    expiresAt?: string;
    maxDownloads?: number;
    customSlug?: string;
  }) => api.post('/shares', data),
  get: (token: string) => api.get(`/shares/${token}`),
  download: (token: string, videoIds?: number[]) =>
    api.post(`/shares/${token}/download`, { videoIds }, { responseType: 'blob' }),
  list: () => api.get('/shares/list/my-shares'),
  checkExisting: (videoIds: number[]) => api.post('/shares/check-existing', { videoIds }),
  delete: (id: number) => api.delete(`/shares/${id}`),
};
