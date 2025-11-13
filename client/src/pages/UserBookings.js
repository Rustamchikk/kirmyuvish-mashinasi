// src/pages/UserBookings.js
import { format } from 'date-fns'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import '../App.css'
import Loading from '../components/Loading'
import { bookingAPI, userAPI } from '../services/api' // userAPI qo'shildi
import { useAuth } from '../contexts/AuthContext'

const UserBookings = () => {
  const navigate = useNavigate()
  const { roomNumber } = useParams()
  const { userRoom, userName } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [verified, setVerified] = useState(false)

  useEffect(() => {
    const targetRoom = roomNumber || userRoom
    
    if (targetRoom && userName) {
      verifyAndLoadBookings(targetRoom, userName)
    } else {
      navigate('/')
    }
  }, [userRoom, userName, roomNumber, navigate])

  const verifyAndLoadBookings = async (room, name) => {
    try {
      // Foydalanuvchini qayta tekshiramiz
      const verifyResponse = await userAPI.verifyUser(room, name)
      
      if (verifyResponse.data.exists) {
        setVerified(true)
        await loadUserBookings(room)
      } else {
        navigate('/')
      }
    } catch (error) {
      console.log('Foydalanuvchini tekshirishda xatolik:', error)
      navigate('/')
    }
  }

  const loadUserBookings = async (room) => {
    try {
      const response = await bookingAPI.getUserBookings(room)
      setBookings(response.data.data || [])
    } catch (error) {
      console.log('Bronlarni yuklashda xatolik:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Loading />

  if (!verified) {
    return (
      <div className='container'>
        <div className='form-container'>
          <h2>Kirish rad etildi</h2>
          <p>Ism va xona raqami mos kelmadi yoki sizga ruxsat yo'q.</p>
          <button onClick={() => navigate('/')} className='btn btn-primary'>
            Bosh sahifaga qaytish
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className='container'>
      <div className='user-info'>
        <h2>Ism Familiya: {userName}</h2>
        <h2>Xona raqami: {roomNumber || userRoom}</h2>
      </div>

      <div className='form-container'>
        <h2>Bronlar ro'yxati</h2>
        
        {bookings.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#666', padding: '3rem' }}>
            <h3>Hozircha bronlar mavjud emas</h3>
          </div>
        ) : (
          <div className='table-responsive'>
            <table className='table'>
              <thead>
                <tr>
                  <th>Sana</th>
                  <th>Vaqt oralig'i</th>
                  <th>Mashina nomi</th>
                  <th>Bron qilingan vaqt</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(booking => (
                  <tr key={booking.id}>
                    <td>
                      {format(new Date(booking.booking_date), 'dd.MM.yyyy')}
                    </td>
                    <td>
                      <strong>{booking.time_slot}</strong>
                    </td>
                    <td>
                      {booking.machine_name}
                    </td>
                    <td>
                      {format(new Date(booking.created_at), 'dd.MM.yyyy HH:mm')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style jsx>{`
        .user-info {
          background: #f8f9fa;
          padding: 2rem;
          border-radius: 8px;
          margin: 2rem 0;
          text-align: center;
        }
        .user-info h2 {
          margin: 0.5rem 0;
          color: #333;
        }
        .table-responsive {
          overflow-x: auto;
        }
        .table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 1rem;
        }
        .table th,
        .table td {
          padding: 1rem;
          text-align: left;
          border-bottom: 1px solid #dee2e6;
        }
        .table th {
          background-color: #3d5deb;
          color: white;
          font-weight: 600;
        }
        .table tr:hover {
          background-color: #f8f9fa;
        }
      `}</style>
    </div>
  )
}

export default UserBookings