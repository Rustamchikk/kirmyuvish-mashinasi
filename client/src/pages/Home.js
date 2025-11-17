// src/pages/Home.js
import { addDays, format, isBefore, startOfWeek } from 'date-fns'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import '../App.css'
import './Home.css'

import Alert from '../components/Alert'
import Register from '../components/Register'
import { bookingAPI, machineAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

const Home = () => {
  const { t } = useTranslation()
  const { userRoom, login, isAuthenticated, checkWeekValidity } = useAuth()
  const navigate = useNavigate()

  const [machines, setMachines] = useState([])
  const [bookings, setBookings] = useState([])
  const [userBookings, setUserBookings] = useState([]) // Foydalanuvchi bronlari uchun yangi state
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('')
  const [selectedMachine, setSelectedMachine] = useState(null)
  const [alert, setAlert] = useState({ type: '', message: '' })
  const [loading, setLoading] = useState(false)

  // Backend bilan mos vaqt oralig'i
  const timeSlots = ['19:00-20:00', '20:00-21:00', '21:00-22:00']

  useEffect(() => {
    // Har safar komponent yuklanganda hafta tekshiriladi
    const isValid = checkWeekValidity()
    
    if (isAuthenticated && userRoom && isValid) {
      loadMachines()
      loadBookings()
      loadUserBookings() // Foydalanuvchi bronlarini yuklash
    }
  }, [selectedDate, isAuthenticated, userRoom, checkWeekValidity])

  const showAlert = (type, message) => {
    setAlert({ type, message })
    setTimeout(() => setAlert({ type: '', message: '' }), 5000)
  }

  const loadMachines = async () => {
    try {
      const res = await machineAPI.getAll()
      setMachines(res.data.data || [])
    } catch {
      showAlert('error', t('home.loadMachinesError'))
    }
  }

  const loadBookings = async () => {
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      const res = await bookingAPI.getAll(dateStr)
      setBookings(res.data.data || [])
    } catch {
      showAlert('error', t('home.loadBookingsError'))
    }
  }

  // Foydalanuvchi bronlarini yuklash
  const loadUserBookings = async () => {
    try {
      const response = await bookingAPI.getUserBookings(userRoom)
      setUserBookings(response.data.data || [])
    } catch (error) {
      console.log('Foydalanuvchi bronlarini yuklashda xatolik:', error)
    }
  }

  const handleRegister = roomNumber => {
    login(roomNumber)
    showAlert('success', t('register.success'))
  }

  const handleMachineSelect = machineId => {
    if (selectedMachine === machineId) {
      setSelectedMachine(null)
    } else {
      setSelectedMachine(machineId)
    }
  }

  const handleBooking = async e => {
    e.preventDefault()
    if (!selectedTimeSlot) {
      showAlert('error', t('booking.chooseTime'))
      return
    }
    if (!selectedMachine) {
      showAlert('error', t('home.chooseMachine'))
      return
    }

    setLoading(true)
    try {
      const bookingData = {
        room_number: userRoom,
        machine_ids: [selectedMachine],
        booking_date: format(selectedDate, 'yyyy-MM-dd'),
        time_slot: selectedTimeSlot,
      }

      await bookingAPI.create(bookingData)

      showAlert('success', t('home.bookingSuccess'))
      setSelectedMachine(null)
      setSelectedTimeSlot('')
      loadBookings()
      loadUserBookings() // Bron qilgandan so'ng foydalanuvchi bronlarini yangilash
    } catch (err) {
      console.error(err)
      const errorMessage =
        err.response?.data?.message || t('home.bookingError')
      showAlert('error', errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const isMachineBooked = (machineId, timeSlot) =>
    bookings.some(b => b.machine_id === machineId && b.time_slot === timeSlot)

  const isPastDate = date => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return isBefore(date, today)
  }

  const getWeekDates = () => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 })
    return Array.from({ length: 5 }, (_, i) => addDays(start, i))
  }

  // "Mening bronlarim" tugmasi uchun funksiya (OLIB TASHLANDI)

  // Agar foydalanuvchi authenticated bo'lmasa, register ko'rsatiladi
  if (!isAuthenticated || !userRoom) {
    return (
      <div className='admin-login'>
        <Register onRegister={handleRegister} />
        <Alert type={alert.type} message={alert.message} />
      </div>
    )
  }

  return (
    <div className='admin-container'>
      <header className='admin-header'>
        <h1>{t('home.booking')}</h1>
        <div className='user-info'>
          <span>{t('home.room')}: {userRoom}</span>
          {/* "Mening bronlarim" tugmasi OLIB TASHLANDI */}
        </div>
      </header>

      <Alert type={alert.type} message={alert.message} />

      <section>
        <label>{t('booking.selectDate')}</label>
        <div className='calendar-grid'>
          {getWeekDates().map((date, idx) => (
            <div
              key={idx}
              className={`calendar-day ${
                format(date, 'yyyy-MM-dd') ===
                format(selectedDate, 'yyyy-MM-dd')
                  ? 'selected'
                  : ''
              } ${isPastDate(date) ? 'disabled' : ''}`}
              onClick={() => {
                if (!isPastDate(date)) {
                  setSelectedDate(date)
                  setSelectedTimeSlot('')
                  setSelectedMachine(null)
                }
              }}
            >
              <div>{format(date, 'EEE')}</div>
              <div>{format(date, 'dd')}</div>
              <div>{format(date, 'MMM')}</div>
            </div>
          ))}
        </div>
      </section>

      {!isPastDate(selectedDate) && (
        <section>
          <form onSubmit={handleBooking}>
            <div className='form-group'>
              <label>{t('booking.selectTime')}</label>
              <select
                value={selectedTimeSlot}
                onChange={e => {
                  setSelectedTimeSlot(e.target.value)
                  setSelectedMachine(null)
                }}
                required
              >
                <option value=''>{t('booking.chooseTime')}</option>
                {timeSlots.map(slot => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>

            {selectedTimeSlot && (
              <div className='machine-list'>
                {machines.map(machine => {
                  const isBooked = isMachineBooked(machine.id, selectedTimeSlot)
                  const isSelected = selectedMachine === machine.id
                  const isActive = machine.is_active

                  return (
                    <div
                      key={machine.id}
                      className={`machine-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        if (!isBooked && isActive)
                          handleMachineSelect(machine.id)
                      }}
                    >
                      <input
                        type='radio'
                        checked={isSelected}
                        readOnly
                        disabled={isBooked || !isActive}
                      />
                      <span>{machine.name}</span>
                      {!isActive && (
                        <span className='maintenance'>
                          ({t('booking.underMaintenance')})
                        </span>
                      )}
                      <span
                        className={`machine-status ${
                          !isActive
                            ? 'status-booked'
                            : isBooked
                            ? 'status-booked'
                            : 'status-available'
                        }`}
                      >
                        {!isActive
                          ? t('booking.inactive')
                          : isBooked
                          ? t('booking.busy')
                          : t('booking.available')}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}

            <div className='selected-summary'>
              <p>
                {t('booking.selectedMachines')}:{' '}
                <strong>{selectedMachine ? 1 : 0}/1</strong>
              </p>
            </div>

            <button
              type='submit'
              className='btn btn-success'
              disabled={loading || !selectedMachine || !selectedTimeSlot}
            >
              {loading ? t('booking.booking') : t('booking.book')}
            </button>
          </form>
        </section>
      )}

      {/* Foydalanuvchi bronlari ko'rsatiladigan qism */}
      {userBookings.length > 0 && (
        <section className='user-bookings-section'>
          <h2>{t('home.myBookings')}</h2>
          <div className='user-bookings-grid'>
            {userBookings.slice(0, 3).map(booking => ( // Faqat oxirgi 3 tasini ko'rsatamiz
              <div key={booking.id} className='user-booking-card'>
                <div className='booking-date'>
                  <strong>{format(new Date(booking.booking_date), 'dd.MM.yyyy')}</strong>
                </div>
                <div className='booking-time'>{booking.time_slot}</div>
                <div className='booking-machine'>{booking.machine_name}</div>
                <div className='booking-status'>
                  <span className='status-active'>{t('userBookings.active')}</span>
                </div>
              </div>
            ))}
          </div>
          {userBookings.length > 3 && (
            <div className='view-all-bookings'>
              <button 
                onClick={() => navigate(`/bookings/${userRoom}`)}
                className='btn btn-outline'
              >
                {t('home.viewAllBookings')}
              </button>
            </div>
          )}
        </section>
      )}

      <style jsx>{`
        .user-bookings-section {
          margin-top: 2rem;
          padding: 1.5rem;
          background: #f8f9fa;
          border-radius: 12px;
          border: 1px solid #e9ecef;
        }

        .user-bookings-section h2 {
          margin-bottom: 1rem;
          color: #333;
          text-align: center;
        }

        .user-bookings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .user-booking-card {
          background: white;
          padding: 1rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          border-left: 4px solid #3d5deb;
        }

        .booking-date {
          font-size: 1.1rem;
          color: #333;
          margin-bottom: 0.5rem;
        }

        .booking-time {
          font-size: 1rem;
          color: #3d5deb;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .booking-machine {
          color: #666;
          margin-bottom: 0.5rem;
        }

        .status-active {
          background: #d4edda;
          color: #155724;
          padding: 0.3rem 0.8rem;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .view-all-bookings {
          text-align: center;
          margin-top: 1rem;
        }

        .btn-outline {
          background: transparent;
          color: #3d5deb;
          border: 2px solid #3d5deb;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-outline:hover {
          background: #3d5deb;
          color: white;
        }

        @media (max-width: 768px) {
          .user-bookings-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}

export default Home