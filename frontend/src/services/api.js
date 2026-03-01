import axios from 'axios';
const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});
// Request interceptor to add auth token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});
// Response interceptor to handle auth errors
api.interceptors.response.use((response) => response, (error) => {
    if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    }
    return Promise.reject(error);
});
export default api;
// Auth API
export const authApi = {
    login: (email, password) => api.post('/auth/login', { email, password }),
    logout: () => api.post('/auth/logout'),
    me: () => api.get('/auth/me'),
    changePassword: (currentPassword, newPassword) => api.post('/auth/change-password', { currentPassword, newPassword }),
};
// Users API
export const usersApi = {
    list: () => api.get('/users'),
    get: (id) => api.get(`/users/${id}`),
    create: (data) => api.post('/users', data),
    update: (id, data) => api.put(`/users/${id}`, data),
    delete: (id) => api.delete(`/users/${id}`),
};
// Professionals API
export const professionalsApi = {
    list: () => api.get('/professionals'),
    listAll: () => api.get('/professionals/all'),
    get: (id) => api.get(`/professionals/${id}`),
    create: (name) => api.post('/professionals', { name }),
    update: (id, data) => api.put(`/professionals/${id}`, data),
    delete: (id) => api.delete(`/professionals/${id}`),
};
// Settings API
export const settingsApi = {
    getPublic: () => api.get('/settings/public'),
    get: () => api.get('/settings'),
    getAll: () => api.get('/settings/all'),
    update: (data) => api.put('/settings', data),
    uploadLogo: (file) => {
        const formData = new FormData();
        formData.append('logo', file);
        return api.post('/settings/logo', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
    getNotificationRecipients: () => api.get('/settings/notification-recipients'),
    addNotificationRecipient: (type, value) => api.post('/settings/notification-recipients', { type, value }),
    updateNotificationRecipient: (id, data) => api.put(`/settings/notification-recipients/${id}`, data),
    deleteNotificationRecipient: (id) => api.delete(`/settings/notification-recipients/${id}`),
    testNotification: (type, recipient) => api.post('/notifications/test', { type, recipient }),
};
// Videos API
export const videosApi = {
    list: (params) => api.get('/videos', { params }),
    get: (id) => api.get(`/videos/${id}`),
    upload: (file, data, onProgress) => {
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
    uploadVersion: (parentId, file, customDurationSeconds, onProgress) => {
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
    update: (id, data) => api.put(`/videos/${id}`, data),
    delete: (id) => api.delete(`/videos/${id}`),
    downloadZip: (videoIds) => api.post('/videos/download-zip', { videoIds }, { responseType: 'blob' }),
    getStreamUrl: (id) => {
        const token = localStorage.getItem('token');
        return `/api/videos/${id}/stream${token ? `?token=${token}` : ''}`;
    },
    getDownloadUrl: (id) => {
        const token = localStorage.getItem('token');
        return `/api/videos/${id}/download${token ? `?token=${token}` : ''}`;
    },
    getThumbnailUrl: (id) => {
        const token = localStorage.getItem('token');
        return `/api/videos/${id}/thumbnail${token ? `?token=${token}` : ''}`;
    },
};
// Reports API
export const reportsApi = {
    getStats: (month, year) => api.get('/reports/stats', { params: { month, year } }),
    getMonthly: (year, month) => api.get(`/reports/${year}/${month}`),
    getMonthlyUsage: (year, month) => api.get(`/reports/${year}/${month}/usage`),
    getExport: (startDate, endDate, dateField = 'requestDate') => api.get('/reports/export', { params: { startDate, endDate, dateField } }),
    getExportPdfUrl: (startDate, endDate, dateField = 'requestDate') => {
        const token = localStorage.getItem('token');
        return `/api/reports/export/pdf?startDate=${startDate}&endDate=${endDate}&dateField=${dateField}${token ? `&token=${token}` : ''}`;
    },
    // History API
    getHistory: () => api.get('/reports/history'),
    getHistoryItem: (id) => api.get(`/reports/history/${id}`),
    downloadHistory: (id) => {
        const token = localStorage.getItem('token');
        return `/api/reports/history/${id}/download${token ? `?token=${token}` : ''}`;
    },
    deleteHistory: (id) => api.delete(`/reports/history/${id}`),
};
// Logs API
export const logsApi = {
    getDownloads: (params) => api.get('/logs/downloads', { params }),
    getDownloadsSummary: (month, year) => api.get('/logs/downloads/summary', { params: { month, year } }),
};
// Shares API
export const sharesApi = {
    create: (data) => api.post('/shares', data),
    get: (token) => api.get(`/shares/${token}`),
    download: (token, videoIds) => api.post(`/shares/${token}/download`, { videoIds }, { responseType: 'blob' }),
    list: () => api.get('/shares/list/my-shares'),
    checkExisting: (videoIds) => api.post('/shares/check-existing', { videoIds }),
    delete: (id) => api.delete(`/shares/${id}`),
};
