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
            
            {/* ✅ Footer with contact information and details */}
            <footer className="app-footer">
              <div className="footer-content">
                <div className="footer-info">
                  <p className="system-description">
                    Данная система предназначена для бронирования стиральных машин в университетском общежитии.
                  </p>
                  <p className="system-scope">
                    Сервис действует только для общежития №3.
                  </p>
                </div>
                <div className="contact-info">
                  <div className="contact-item">
                    <span className="contact-icon">📞</span>
                    <span>+7 967 981 86 70</span>
                  </div>
                  <a 
                    href="https://t.me/rus1amm" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="contact-item telegram-link"
                  >
                     <img 
                      src="https://telegram.org/img/t_logo.svg"
                      alt="Telegram"
                      className="contact-icon"
                      style={{ width: '20px', height: '20px', marginRight: '6px' }}
                    />
                    <span>Telegram: @rus1amm</span>
                  </a>
                </div>
                <p className="copyright">
                    © 2025 Система бронирования стиральных машин. Все права защищены.
                  </p>
              </div>
            </footer>
          </div>
        </Router>
      </AuthProvider>
    </I18nextProvider>
  )
}

export default App