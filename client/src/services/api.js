// services/api.js
import axios from 'axios'

const API_BASE_URL =
	process.env.REACT_APP_API_URL || 'http://localhost:5000/api'

const api = axios.create({
	baseURL: API_BASE_URL,
	headers: {
		'Content-Type': 'application/json',
	},
})

export const userAPI = {
	register: userData => api.post('/users/register', userData),
	getAll: () => api.get('/users'),
	// YANGI: Foydalanuvchini tekshirish funksiyasi
	verifyUser: (roomNumber, fullName) => 
		api.get('/users/verify', { 
			params: { 
				room_number: roomNumber, 
				full_name: fullName 
			} 
		}),
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

export default api