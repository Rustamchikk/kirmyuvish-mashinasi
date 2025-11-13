// src/contexts/AuthContext.js
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
  const [userRoom, setUserRoom] = useState('')
  const [userName, setUserName] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [registrationWeek, setRegistrationWeek] = useState('')

  // Joriy haftani olish
  const getCurrentWeek = () => {
    return format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  }

  // LocalStorage'dan ma'lumotlarni yuklash
  useEffect(() => {
    const savedUserRoom = localStorage.getItem('userRoom')
    const savedUserName = localStorage.getItem('userName')
    const savedRegistrationWeek = localStorage.getItem('registrationWeek')
    const currentWeek = getCurrentWeek()

    if (savedUserRoom && savedUserName && savedRegistrationWeek) {
      // Agar ro'yxatdan o'tgan hafta joriy haftaga teng bo'lsa
      if (savedRegistrationWeek === currentWeek) {
        setUserRoom(savedUserRoom)
        setUserName(savedUserName)
        setRegistrationWeek(savedRegistrationWeek)
        setIsAuthenticated(true)
        setIsAdmin(false)
      } else {
        // Yangi hafta boshlangan, avvalgi ma'lumotlarni o'chiramiz
        localStorage.removeItem('userRoom')
        localStorage.removeItem('userName')
        localStorage.removeItem('registrationWeek')
        setIsAuthenticated(false)
      }
    }
  }, [])

  const login = (roomNumber, fullName) => {
    const currentWeek = getCurrentWeek()
    setUserRoom(roomNumber)
    setUserName(fullName)
    setRegistrationWeek(currentWeek)
    localStorage.setItem('userRoom', roomNumber)
    localStorage.setItem('userName', fullName)
    localStorage.setItem('registrationWeek', currentWeek)
    setIsAuthenticated(true)
    setIsAdmin(false)
  }

 const logout = () => {
  setUserRoom('')
  setUserName('')
  setRegistrationWeek('')
  localStorage.removeItem('userRoom')
  localStorage.removeItem('userName')
  localStorage.removeItem('registrationWeek')
  setIsAuthenticated(false)
  setIsAdmin(false)
  }

  const adminLogin = () => {
    setIsAuthenticated(true)
    setIsAdmin(true)
    setUserRoom('')
    setUserName('')
    setRegistrationWeek('')
    localStorage.removeItem('userRoom')
    localStorage.removeItem('userName')
    localStorage.removeItem('registrationWeek')
  }

  const adminLogout = () => {
    setIsAuthenticated(false)
    setIsAdmin(false)
    setUserRoom('')
    setUserName('')
    setRegistrationWeek('')
    localStorage.removeItem('userRoom')
    localStorage.removeItem('userName')
    localStorage.removeItem('registrationWeek')
  }

  // Hafta tekshiruvi
  const checkWeekValidity = () => {
    const currentWeek = getCurrentWeek()
    const savedWeek = localStorage.getItem('registrationWeek')
    
    if (savedWeek && savedWeek !== currentWeek) {
      // Yangi hafta boshlangan, logout qilamiz
      logout()
      return false
    }
    return true
  }

  const value = {
    isAuthenticated,
    userRoom,
    userName,
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