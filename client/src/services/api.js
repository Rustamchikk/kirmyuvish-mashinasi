// services/api.js
import axios from 'axios'

const API_BASE_URL = process.env.REACT_APP_API_URL 
console.log("API BASE URL:", process.env.REACT_APP_API_URL);

const api = axios.create({
	baseURL: API_BASE_URL, 
	headers: {
		'Content-Type': 'application/json',
	},
})

export const userAPI = {
	register: userData => api.post('/api/users/register', userData), // ✅ /api/ qo'shildi
	getAll: () => api.get('/api/users'), // ✅ /api/ qo'shildi
	verifyUser: (roomNumber, fullName) => 
		api.get('/api/users/verify', { // ✅ /api/ qo'shildi
			params: { 
				room_number: roomNumber, 
				full_name: fullName 
			} 
		}),
	getAvailableRooms: () => api.get('/api/users/available-rooms'), // ✅ /api/ qo'shildi
}

export const bookingAPI = {
	create: bookingData => api.post('/api/bookings', bookingData), // ✅ /api/ qo'shildi
	getAll: (date = null) => api.get('/api/bookings', { params: { date } }), // ✅ /api/ qo'shildi
	getUserBookings: roomNumber => api.get(`/api/bookings/user/${roomNumber}`), // ✅ /api/ qo'shildi
	delete: id => api.delete(`/api/bookings/${id}`), // ✅ /api/ qo'shildi
}

export const machineAPI = {
	getAll: () => api.get('/api/machines'), // ✅ /api/ qo'shildi
	update: (id, data) => api.patch(`/api/machines/${id}`, data), // ✅ /api/ qo'shildi
	create: data => api.post('/api/machines', data), // ✅ /api/ qo'shildi
	delete: id => api.delete(`/api/machines/${id}`), // ✅ /api/ qo'shildi
}

export const adminAuthAPI = {
	login: (username, password) => 
		api.post('/api/admin/auth/login', { username, password }), // ✅ /api/ qo'shildi
}

export const adminMonitoringAPI = {
  getSessions: (username = null) => 
    api.get('/api/admin/monitoring/sessions', { params: { username } }), // ✅ /api/ qo'shildi
  
  getSessionStats: (username = null) => 
    api.get('/api/admin/monitoring/session-stats', { params: { username } }), // ✅ /api/ qo'shildi
  
  endSession: (sessionId) => 
    api.delete(`/api/admin/monitoring/sessions/${sessionId}`), // ✅ /api/ qo'shildi
  
  endAllSessions: (username) => 
  api.delete(`/api/admin/monitoring/sessions?username=${username}`) // ✅ /api/ qo'shildi
};

export const adminUsersAPI = {
  deleteUser: (userId) => api.delete(`/api/admin/users/${userId}`), // ✅ /api/ qo'shildi
  deleteAllUsers: () => api.delete('/api/admin/users') // ✅ /api/ qo'shildi
};

export default api