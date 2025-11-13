// components/Register.js
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { userAPI } from '../services/api'
import Alert from './Alert'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

const Register = ({ onRegister }) => {
  const { t } = useTranslation()
  const { login } = useAuth()
  const navigate = useNavigate()
  const [user, setUser] = useState({ full_name: '', room_number: '' })
  const [alert, setAlert] = useState({ type: '', message: '' })
  const [loading, setLoading] = useState(false)

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

    const nameParts = user.full_name.trim().split(/\s+/)
    if (nameParts.length < 2) {
      showAlert('error', t('register.nameRequired'))
      return
    }

    if (user.full_name.trim().length < 5) {
      showAlert('error', t('register.nameLength'))
      return
    }

    if (!user.room_number.trim()) {
      showAlert('error', t('register.roomRequired'))
      return
    }

    if (!/^[0-9]{3}$/.test(user.room_number.trim())) {
      showAlert('error', t('register.roomFormat'))
      return
    }

    setLoading(true)

    try {
      await userAPI.register(user)
      showAlert('success', t('register.success'))
      login(user.room_number, user.full_name)
      onRegister(user.room_number)
    } catch (error) {
      showAlert('error', 'Bu xona raqami bilan allaqachon ro\'yxatdan o\'tilgan')
    } finally {
      setLoading(false)
    }
  }

  // Yangilangan handleViewBookings funksiyasi
  const handleViewBookings = async e => {
    e.preventDefault()

    if (!user.full_name.trim() || !user.room_number.trim()) {
      showAlert('error', 'Bronlarni ko\'rish uchun ism va xona raqamini kiriting')
      return
    }

    setLoading(true)
    try {
      // Foydalanuvchi mavjudligini tekshiramiz
      const response = await userAPI.verifyUser(user.room_number, user.full_name)
      
      if (response.data.exists) {
        // Foydalanuvchi login qilamiz
        login(user.room_number, user.full_name)
        // UserBookings sahifasiga o'tamiz
        navigate(`/bookings/${user.room_number}`)
      } else {
        showAlert('error', 'Bu ism va xona raqami bilan ro\'yxatdan o\'tilmagan')
      }
    } catch (error) {
      console.error('Foydalanuvchini tekshirishda xatolik:', error)
      showAlert('error', 'Foydalanuvchi mavjud emas yoki xatolik yuz berdi')
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
            placeholder='Ism Familiya'
          />
        </div>

        <div className='form-group'>
          <label>{t('register.roomNumber')} </label>
          <input
            type='text'
            value={user.room_number}
            onChange={e => setUser({ ...user, room_number: e.target.value })}
            required
            maxLength='3'
            placeholder='123'
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
          <button 
            type='button' 
            onClick={handleSubmit} 
            className='btn btn-primary' 
            disabled={loading}
          >
            {loading ? t('register.loading') : 'Ro\'yxatdan o\'tish'}
          </button>
          
          <button 
            type='button' 
            onClick={handleViewBookings} 
            className='btn btn-secondary'
            disabled={loading}
            style={{ background: '#6c757d', color: 'white' }}
          >
            Mening bronlarimni ko'rish
          </button>
        </div>
      </form>

      <style jsx>{`
        .btn-primary {
          background: #3d5deb;
          color: white;
        }
        .btn-secondary {
          background: #6c757d;
          color: white;
        }
        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  )
}

export default Register