// src/App.js
import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18n from './i18n'
import { AuthProvider } from './contexts/AuthContext'
import Header from './components/Header'
import Home from './pages/Home'
import Admin from './pages/Admin'
import UserBookings from './pages/UserBookings'
import './App.css'

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <AuthProvider>
        <Router>
          <div className="App">
            <Header />
            <main>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/bookings/:roomNumber" element={<UserBookings />} />
              </Routes>
            </main>
          </div>
        </Router>
      </AuthProvider>
    </I18nextProvider>
  )
}

export default App