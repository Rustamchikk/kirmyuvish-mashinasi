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
	register: userData => api.post('/users/register', userData),
	getAll: () => api.get('/users'),
	verifyUser: (roomNumber, fullName) => 
		api.get('/users/verify', { 
			params: { 
				room_number: roomNumber, 
				full_name: fullName 
			} 
		}),
	// YANGI: Mavjud xonalarni olish
	getAvailableRooms: () => api.get('/users/available-rooms'),
}

export const bookingAPI = {
	create: bookingData => api.post('/bookings', bookingData),
	getAll: (date = null) => api.get('/bookings', { params: { date } }),
	getUserBookings: roomNumber => api.get(`/bookings/user/${roomNumber}`),
	delete: id => api.delete(`/bookings/${id}`),
}

export const machineAPI = {
	getAll: () => api.get('/machines'),
	update: (id, data) => api.patch(`/machines/${id}`, data),
	create: data => api.post('/machines', data),
	delete: id => api.delete(`/machines/${id}`),
}

export const adminAuthAPI = {
	login: (username, password) => 
		api.post('/admin/auth/login', { username, password }),
}

export const adminMonitoringAPI = {
  getSessions: (username = null) => 
    api.get('/admin/monitoring/sessions', { params: { username } }),
  
  getSessionStats: (username = null) => 
    api.get('/admin/monitoring/session-stats', { params: { username } }),
  
  endSession: (sessionId) => 
    api.delete(`/admin/monitoring/sessions/${sessionId}`),
  
  endAllSessions: (username) => 
  api.delete(`/admin/monitoring/sessions?username=${username}`)
};

export const adminUsersAPI = {
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  deleteAllUsers: () => api.delete('/admin/users')
};

export default api