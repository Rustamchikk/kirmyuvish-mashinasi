// components/Register.js
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { userAPI } from '../services/api'
import Alert from './Alert'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

const Register = ({ onRegister }) => {
  const { t, i18n } = useTranslation()
  const { login } = useAuth()
  const navigate = useNavigate()
  const [user, setUser] = useState({ full_name: '', room_number: '' })
  const [alert, setAlert] = useState({ type: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [availableRooms, setAvailableRooms] = useState([])
  const [roomsLoading, setRoomsLoading] = useState(true)

  // 🔧 SERVER ERROR KEY NORMALIZER
  const resolveServerKey = (rawKey) => {
    if (!rawKey || typeof rawKey !== "string") return null;
  
    const key = rawKey.trim();
  
    // 1) Key aynan mavjud bo‘lsa
    if (i18n.exists(key)) return key;
  
    // 2) errors.xxx → error.xxx
    if (key.startsWith("errors.")) {
      const rest = key.slice("errors.".length);
      const alt = `error.${rest}`;
      if (i18n.exists(alt)) return alt;
    }
  
    // 3) error.xxx → errors.xxx
    if (key.startsWith("error.")) {
      const rest = key.slice("error.".length);
      const alt = `errors.${rest}`;
      if (i18n.exists(alt)) return alt;
    }
  
    // 4) Ba’zan backend faqat room_not_exist yuboradi
    const alt1 = `error.${key}`;
    if (i18n.exists(alt1)) return alt1;
  
    const alt2 = `errors.${key}`;
    if (i18n.exists(alt2)) return alt2;
  
    return null;
  };

  // Komponent yuklanganda mavjud xonalarni olish
  useEffect(() => {
    const fetchAvailableRooms = async () => {
      try {
        setRoomsLoading(true)
        const response = await userAPI.getAvailableRooms()
        if (response.data.success) {
          setAvailableRooms(response.data.data.rooms || [])
        }
      } catch (error) {
        console.error('Xonalarni olishda xatolik:', error)
        showAlert('error', t('register.roomsLoadError'))
      } finally {
        setRoomsLoading(false)
      }
    }

    fetchAvailableRooms()
  }, [t])

  const showAlert = (type, message) => {
    setAlert({ type, message })
    setTimeout(() => setAlert({ type: '', message: '' }), 5000)
  }

  const handleSubmit = async e => {
    e.preventDefault()

    if (!user.full_name.trim()) {
      showAlert('error', t('register.nameRequired'))
      return
    }

    if (!user.room_number.trim()) {
      showAlert('error', t('register.roomRequired'))
      return
    }

    setLoading(true)

    try {
      const response = await userAPI.register(user)

      if (response.data.success) {
        const rawKey = response.data.message
        const resolved = resolveServerKey(rawKey)

        showAlert('success', resolved ? t(resolved) : rawKey)

        login(user.room_number, user.full_name)
        onRegister(user.room_number)
      }
    } catch (error) {
      console.log("REGISTER ERROR RAW:", error)
      console.log("REGISTER ERROR DATA:", error.response?.data)
      console.log("REGISTER MESSAGE:", error.response?.data?.message)

      const rawKey = error.response?.data?.message
      const resolved = resolveServerKey(rawKey)
      const errorMessage = resolved ? t(resolved) : t('register.registrationError')

      showAlert('error', errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleViewBookings = async e => {
    e.preventDefault()

    if (!user.full_name.trim() || !user.room_number.trim()) {
      showAlert('error', t('register.viewBookingsRequired'))
      return
    }

    setLoading(true)
    try {
      const response = await userAPI.verifyUser(user.room_number, user.full_name)

      if (response.data.success && response.data.exists) {
        login(user.room_number, user.full_name)
        navigate(`/bookings/${user.room_number}`)
      } else {
        const rawKey = response.data.message
        const resolved = resolveServerKey(rawKey)

        showAlert('error', resolved ? t(resolved) : t('register.userNotRegistered'))
      }
    } catch (error) {
      console.log("VERIFY ERROR RAW:", error)
      console.log("VERIFY ERROR DATA:", error.response?.data)
      console.log("VERIFY MESSAGE:", error.response?.data?.message)

      const rawKey = error.response?.data?.message
      const resolved = resolveServerKey(rawKey)
      const errorMessage = resolved ? t(resolved) : t('register.userNotFound')

      showAlert('error', errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='form-container'>
      <h2>{t('register.title')}</h2>
      <Alert type={alert.type} message={alert.message} />
      
      <form>
        <div className='form-group'>
          <label>{t('register.fullName')}</label>
          <input
            type='text'
            value={user.full_name}
            onChange={e => setUser({ ...user, full_name: e.target.value })}
            required
            disabled={loading}
          />
        </div>

        <div className='form-group'>
          <label>{t('register.roomNumber')}</label>
          <input
            type='text'
            value={user.room_number}
            onChange={e => setUser({ ...user, room_number: e.target.value.replace(/[^0-9]/g, '') })}
            required
            maxLength='3'
            disabled={loading}
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
          <button 
            type='button' 
            onClick={handleSubmit} 
            className='btn btn-primary' 
            disabled={loading}
          >
            {loading ? t('register.loading') : t('register.registerButton')}
          </button>
          
          <button 
            type='button' 
            onClick={handleViewBookings} 
            className='btn btn-secondary'
            disabled={loading}
          >
            {loading ? t('register.checking') : t('register.viewBookingsButton')}
          </button>
        </div>
      </form>

      <style jsx>{`
        .form-container {
          max-width: 400px;
          margin: 0 auto;
          padding: 2rem;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #333;
        }

        .form-group input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
          transition: border-color 0.3s;
        }

        .form-group input:focus {
          outline: none;
          border-color: #3d5deb;
          box-shadow: 0 0 0 2px rgba(61, 94, 235, 0.2);
        }

        .form-group input:disabled {
          background-color: #f8f9fa;
          cursor: not-allowed;
        }

        .btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 4px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          text-align: center;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-primary {
          background: #3d5deb;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #2d4dd0;
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #5a6268;
        }

        h2 {
          text-align: center;
          margin-bottom: 1.5rem;
          color: #333;
        }
      `}</style>
    </div>
  )
}

export default Register
