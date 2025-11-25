// services/api.js
import axios from 'axios'

const API_BASE_URL = process.env.REACT_APP_API_URL 
const api = axios.create({
	baseURL: API_BASE_URL, 
	headers: {
		'Content-Type': 'application/json',
	},
})

// ✅ Request interceptor - token qo'shish
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ✅ Response interceptor - xatolarni handle qilish
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminType');
      window.location.href = '/admin';
    }
    return Promise.reject(error);
  }
);

export const userAPI = {
	register: userData => api.post('/api/users/register', userData),
	getAll: () => api.get('/api/users'),
	verifyUser: (roomNumber, fullName) => 
		api.get('/api/users/verify', {
			params: { 
				room_number: roomNumber, 
				full_name: fullName 
			} 
		}),
	getAvailableRooms: () => api.get('/api/users/available-rooms'),
}

export const bookingAPI = {
	create: bookingData => api.post('/api/bookings', bookingData),
	getAll: (date = null) => api.get('/api/bookings', { params: { date } }),
	getUserBookings: roomNumber => api.get(`/api/bookings/user/${roomNumber}`),
	delete: id => api.delete(`/api/bookings/${id}`),
}

export const machineAPI = {
	getAll: () => api.get('/api/machines'),
	update: (id, data) => api.patch(`/api/machines/${id}`, data),
	create: data => api.post('/api/machines', data),
	delete: id => api.delete(`/api/machines/${id}`),
}

export const adminAuthAPI = {
	login: (username, password) => 
		api.post('/api/admin/auth/login', { username, password }),
	logout: () => {
		localStorage.removeItem('adminToken');
		localStorage.removeItem('adminType');
		return api.post('/api/admin/auth/logout');
	},
}

export const adminMonitoringAPI = {
  getSessions: (username = null) => 
    api.get('/api/admin/monitoring/sessions', { params: { username } }),
  
  getSessionStats: (username = null) => 
    api.get('/api/admin/monitoring/session-stats', { params: { username } }),
  
  endSession: (sessionId) => 
    api.delete(`/api/admin/monitoring/sessions/${sessionId}`),
  
  endAllSessions: (username = null) => 
    api.delete('/api/admin/monitoring/sessions', { 
      params: { username } 
    }),
};

export const adminUsersAPI = {
  deleteUser: (userId) => api.delete(`/api/admin/users/${userId}`),
  deleteAllUsers: () => api.delete('/api/admin/users'),
};

// ✅ YANGILANGAN: Admin Users History API (usersadmin uchun)
export const adminUsersHistoryAPI = {
  // Barcha foydalanuvchilarni olish (usersadmin jadvalidan)
  getAllUsers: () => api.get('/api/admin/history/users'),
  
  // Foydalanuvchilarni qidirish
  searchUsers: (query) => api.get('/api/admin/history/users/search', { 
    params: { q: query } 
  }),
  
  // Foydalanuvchi statistikasi
  getStats: () => api.get('/api/admin/history/stats')
};

export default api