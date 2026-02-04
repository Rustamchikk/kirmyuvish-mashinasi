// src/contexts/AuthContext.js - TO'LIQ TUZATILGAN
import React, { createContext, useContext, useState, useEffect } from 'react'
import { startOfWeek, format } from 'date-fns'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [userFullName, setUserFullName] = useState(() => localStorage.getItem('userFullName') || '')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [userRoom, setUserRoom] = useState(() => localStorage.getItem('userRoom') || '')
  const [isAdmin, setIsAdmin] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [registrationWeek, setRegistrationWeek] = useState('')

  // Joriy haftani olish
  const getCurrentWeek = () => {
    return format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  }

  // LocalStorage'dan ma'lumotlarni yuklash
  useEffect(() => {
    const savedUserRoom = localStorage.getItem('userRoom')
    const savedUserFullName = localStorage.getItem('userFullName')
    const savedRegistrationWeek = localStorage.getItem('registrationWeek')
    const currentWeek = getCurrentWeek()

    if (savedUserRoom && savedUserFullName && savedRegistrationWeek) {
      if (savedRegistrationWeek === currentWeek) {
        setUserRoom(savedUserRoom)
        setUserFullName(savedUserFullName)
        setRegistrationWeek(savedRegistrationWeek)
        setIsAuthenticated(true)
        setIsAdmin(false)
      } else {
        localStorage.removeItem('userRoom')
        localStorage.removeItem('userFullName')
        localStorage.removeItem('registrationWeek')
        setIsAuthenticated(false)
      }
    }
  }, [])

  const login = (roomNumber, fullName) => {
    const currentWeek = getCurrentWeek()
    setUserRoom(roomNumber)
    setUserFullName(fullName)
    setRegistrationWeek(currentWeek)
    localStorage.setItem('userRoom', roomNumber)
    localStorage.setItem('userFullName', fullName)
    localStorage.setItem('registrationWeek', currentWeek)
    setIsAuthenticated(true)
    setIsAdmin(false)
  }

  const logout = () => {
    setUserRoom('')
    setUserFullName('')
    setRegistrationWeek('')
    localStorage.removeItem('userRoom')
    localStorage.removeItem('userFullName')
    localStorage.removeItem('registrationWeek')
    setIsAuthenticated(false)
    setIsAdmin(false)
  }

  const adminLogin = () => {
    setIsAuthenticated(true)
    setIsAdmin(true)
    setUserRoom('')
    setUserFullName('')
    setRegistrationWeek('')
    localStorage.removeItem('userRoom')
    localStorage.removeItem('userFullName')
    localStorage.removeItem('registrationWeek')
  }

  const adminLogout = () => {
    setIsAuthenticated(false)
    setIsAdmin(false)
    setUserRoom('')
    setUserFullName('')
    setRegistrationWeek('')
    localStorage.removeItem('userRoom')
    localStorage.removeItem('userFullName')
    localStorage.removeItem('registrationWeek')
  }

  const checkWeekValidity = () => {
    const currentWeek = getCurrentWeek()
    const savedWeek = localStorage.getItem('registrationWeek')
    
    if (savedWeek && savedWeek !== currentWeek) {
      logout()
      return false
    }
    return true
  }

  const value = {
    isAuthenticated,
    userRoom,
    userFullName,
    isAdmin,
    registrationWeek,
    login,
    logout,
    adminLogin,
    adminLogout,
    checkWeekValidity,
    getCurrentWeek
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}