// src/pages/Home.js
import { addDays, format, isBefore, startOfWeek } from 'date-fns'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom' // <- navigate import qo'shildi
import '../App.css'
import './Home.css'

import Alert from '../components/Alert'
import Register from '../components/Register'
import { bookingAPI, machineAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

const Home = () => {
  const { t } = useTranslation()
  const { userRoom, login, isAuthenticated, checkWeekValidity } = useAuth()
  const navigate = useNavigate() // <- navigate qo'shildi

  const [machines, setMachines] = useState([])
  const [bookings, setBookings] = useState([])
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
      showAlert('error', 'Mashinalarni yuklashda xatolik')
    }
  }

  const loadBookings = async () => {
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      const res = await bookingAPI.getAll(dateStr)
      setBookings(res.data.data || [])
    } catch {
      showAlert('error', 'Bronlarni yuklashda xatolik')
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
      showAlert('error', 'Iltimos, mashina tanlang')
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

      showAlert('success', 'Muvaffaqiyatli bron qilindi!')
      setSelectedMachine(null)
      setSelectedTimeSlot('')
      loadBookings()
    } catch (err) {
      console.error(err)
      const errorMessage =
        err.response?.data?.message ||
        'Bron qilishda noma\'lum xatolik yuz berdi'
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

  // "Mening bronlarim" tugmasi uchun funksiya
  const handleViewBookings = () => {
    navigate(`/bookings/${userRoom}`)
  }

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
          <span>Xona: {userRoom}</span>
          <button 
            onClick={handleViewBookings} // <- navigate bilan almashtirildi
            className='btn btn-info'
            style={{ marginLeft: '1rem', padding: '0.5rem 1rem' }}
          >
            Mening bronlarim
          </button>
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
    </div>
  )
}

export default Home