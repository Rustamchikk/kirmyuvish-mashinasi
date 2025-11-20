// services/api.js
import axios from 'axios'

const API_BASE_URL = process.env.REACT_APP_API_URL 

const api = axios.create({
    baseURL: API_BASE_URL, 
    headers: {
        'Content-Type': 'application/json',
    },
})

// USERS
export const userAPI = {
    register: data => api.post('/api/users/register', data),
    getAll: () => api.get('/api/users'),
    verifyUser: (roomNumber, fullName) =>
        api.get('/api/users/verify', { params: { room_number: roomNumber, full_name: fullName }}),
    getAvailableRooms: () => api.get('/api/users/available-rooms'),
}

// BOOKINGS
export const bookingAPI = {
    create: data => api.post('/api/bookings', data),
    getAll: (date = null) => api.get('/api/bookings', { params: { date }}),
    getUserBookings: roomNumber => api.get(`/api/bookings/user/${roomNumber}`),
    delete: id => api.delete(`/api/bookings/${id}`),
}

// MACHINES
export const machineAPI = {
    getAll: () => api.get('/api/machines'),
    update: (id, data) => api.patch(`/api/machines/${id}`, data),
    create: data => api.post('/api/machines', data),
    delete: id => api.delete(`/api/machines/${id}`),
}

// ADMIN AUTH
export const adminAuthAPI = {
    login: (username, password) => 
        api.post('/api/admin/auth/login', { username, password }),
}

// ADMIN MONITORING
export const adminMonitoringAPI = {
    getSessions: (username = null) => api.get('/api/admin/monitoring/sessions', { params: { username }}),
    getSessionStats: (username = null) => api.get('/api/admin/monitoring/session-stats', { params: { username }}),
    endSession: id => api.delete(`/api/admin/monitoring/sessions/${id}`),
    endAllSessions: username => api.delete(`/api/admin/monitoring/sessions?username=${username}`)
}

// ADMIN USERS
export const adminUsersAPI = {
    deleteUser: id => api.delete(`/api/admin/${id}`),
    deleteAllUsers: () => api.delete('/api/admin'),
}

export default api
