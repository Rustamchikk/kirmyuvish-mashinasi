// src/pages/UserBookings.js
import { format } from 'date-fns'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import '../App.css'
import Loading from '../components/Loading'
import { bookingAPI, userAPI, machineAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

const UserBookings = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { roomNumber } = useParams()
  const { userRoom, userName } = useAuth()
  const [bookings, setBookings] = useState([])
  const [machines, setMachines] = useState([])
  const [loading, setLoading] = useState(true)
  const [verified, setVerified] = useState(false)

  useEffect(() => {
    const targetRoom = roomNumber || userRoom
    if (targetRoom && userName) {
      verifyAndLoadData(targetRoom, userName)
    } else {
      navigate('/')
    }
  }, [userRoom, userName, roomNumber, navigate])

  const verifyAndLoadData = async (room, name) => {
    try {
      setLoading(true)
      const verifyResponse = await userAPI.verifyUser(room, name)
      
      if (verifyResponse.data.exists) {
        setVerified(true)
        await Promise.all([
          loadUserBookings(room),
          loadMachines()
        ])
      } else {
        navigate('/')
      }
    } catch (error) {
      console.error('Verification error:', error)
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  const loadUserBookings = async (room) => {
    try {
      const response = await bookingAPI.getUserBookings(room)
      setBookings(response.data.data || [])
    } catch (error) {
      console.error('Load bookings error:', error)
    }
  }

  const loadMachines = async () => {
    try {
      const response = await machineAPI.getAll()
      setMachines(response.data.data || [])
    } catch (error) {
      console.error('Load machines error:', error)
    }
  }

  // Mashina faol yoki o'chirilganligini tekshirish
  const isMachineActive = (machineName) => {
    if (!machines.length) return true
    const machine = machines.find(m => m.name === machineName)
    return machine ? machine.is_active : true
  }

  if (loading) {
    return <Loading />
  }

  if (!verified) {
    return (
      <div className='container'>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h2>{t('userBookings.access_denied')}</h2>
          <button onClick={() => navigate('/')} className='btn btn-primary'>
            {t('userBookings.return_to_home')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className='container'>
      {/* Foydalanuvchi ma'lumotlari */}
      <div style={{ textAlign: 'center', marginBottom: '2rem', padding: '1rem', color:'#faf6f6ff' }}>
        <h1>{t('userBookings.my_bookings')}</h1>
        <div style={{ fontSize: '1.1rem', color: '#faf6f6ff', marginTop: '0.5rem' }}>
          <strong>{t('userBookings.name')}: </strong>{userName} | <strong>{t('userBookings.room')}: </strong>{roomNumber || userRoom}
        </div>
      </div>

      {/* Bronlar ro'yxati */}
      {bookings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#fbf6f6ff' }}>
          <h3>{t('userBookings.no_bookings')}</h3>
        </div>
      ) : (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            <thead>
              <tr style={{ backgroundColor: '#3d5deb', color: 'white' }}>
                <th style={{ padding: '1rem', textAlign: 'left' }}>{t('userBookings.date')}</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>{t('userBookings.time')}</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>{t('userBookings.machine')}</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>{t('userBookings.status')}</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(booking => {
                const machineActive = isMachineActive(booking.machine_name)
                
                return (
                  <tr key={booking.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                    <td style={{ padding: '1rem' }}>
                      {format(new Date(booking.booking_date), 'dd.MM.yyyy')}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {booking.time_slot}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {booking.machine_name}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        fontSize: '0.8rem',
                        backgroundColor: machineActive ? '#e8f5e8' : '#ffebee',
                        color: machineActive ? '#2bab31ff' : '#c62828',
                        border: `1px solid ${machineActive ? '#c8e6c9' : '#ffcdd2'}`
                      }}>
                        {machineActive ? t('userBookings.active') : t('userBookings.under_maintenance')}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default UserBookings