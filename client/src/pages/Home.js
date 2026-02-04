// src/pages/Home.js - TO'LIQ YANGILANGAN VERSIYA MOSCOW VAQTI BILAN
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
  const { userRoom, login, isAuthenticated, checkWeekValidity, userFullName } = useAuth()
  const navigate = useNavigate()

  const [machines, setMachines] = useState([])
  const [bookings, setBookings] = useState([])
  const [userBookings, setUserBookings] = useState([])
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('')
  const [selectedMachine, setSelectedMachine] = useState(null)
  const [alert, setAlert] = useState({ type: '', message: '' })
  const [loading, setLoading] = useState(false)

  const timeSlots = ['19:00-20:00', '20:00-21:00'] //'21:00-22:00' vaqat olib tashlandi

  // ✅ YANGI: Moscow vaqtini olish
  const getMoscowTime = () => {
    const now = new Date();
    return new Date(now.toLocaleString("en-US", { timeZone: "Europe/Moscow" }));
  };

  // ✅ YANGI: Moscow vaqti bo'yicha tekshirish
  const isTimeSlotDisabled = (timeSlot) => {
    const moscowTime = getMoscowTime();
    const hours = moscowTime.getHours();
    const minutes = moscowTime.getMinutes();
    const currentTimeInMinutes = hours * 60 + minutes;
    
    const [startTime, endTime] = timeSlot.split('-');
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const startTimeInMinutes = startHour * 60 + startMinute;
    
    // Moscow vaqti 19:01 dan keyin bo'lsa, 19:00-20:00 ni nofaol qilish
    if (timeSlot === '19:00-20:00' && currentTimeInMinutes > 19 * 60 + 1) {
      return true;
    }
    
    // 20:00-21:00 va 21:00-22:00 uchun ham xuddi shu qoida
    if (timeSlot === '20:00-21:00' && currentTimeInMinutes > 20 * 60 + 1) {
      return true;
    }
    
    // if (timeSlot === '21:00-22:00' && currentTimeInMinutes > 21 * 60 + 1) {
    //   return true;
    // }
    
    return currentTimeInMinutes >= startTimeInMinutes;
  };

  // ✅ YANGI: Tanlangan sana bugungi Moscow sanasimi?
  const isDateToday = (date) => {
    const moscowToday = getMoscowTime();
    return (
      date.getDate() === moscowToday.getDate() &&
      date.getMonth() === moscowToday.getMonth() &&
      date.getFullYear() === moscowToday.getFullYear()
    );
  };

  // ✅ YANGI: Moscow vaqtini ko'rsatish
  const displayMoscowTime = () => {
    const moscowTime = getMoscowTime();
    return moscowTime.toLocaleString('ru-RU', { 
      timeZone: 'Europe/Moscow',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  useEffect(() => {
    const isValid = checkWeekValidity()
    
    if (isAuthenticated && userRoom && isValid) {
      loadMachines()
      loadUserBookings()
      
      if (selectedDate) {
        loadBookings()
      }
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

  const loadUserBookings = async () => {
    try {
      const response = await bookingAPI.getUserBookings(userRoom)
      setUserBookings(response.data.data || [])
    } catch (error) {
      console.log('Foydalanuvchi bronlarini yuklashda xatolik:', error)
    }
  }

  const handleRegister = (roomNumber, fullName = '') => { // ✅ fullName parametri qo'shildi
  login(roomNumber, fullName) // ✅ fullName ni yuborish
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
    
    if (!selectedDate) {
      showAlert('error', t('booking.chooseDateFirst'))
      return
    }
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
      setSelectedDate(null)
      loadBookings()
      loadUserBookings()
    } catch (err) {
      console.error("BRON XATOSI:", err.response?.data)
      
      const rawKey = err.response?.data?.message
      
      if (rawKey === 'errors.weekly_limit') {
        showAlert('error', t('errors.weekly_limit'))
      } else {
        showAlert('error', t('home.bookingError'))
      }
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
    const start = startOfWeek(new Date(), { weekStartsOn: 1 })
    return Array.from({ length: 5 }, (_, i) => addDays(start, i))
  }

  const handleDateSelect = (date) => {
    if (!isPastDate(date)) {
      setSelectedDate(date)
      setSelectedTimeSlot('')
      setSelectedMachine(null)
    }
  }

  const handleTimeSelect = (time) => {
    setSelectedTimeSlot(time)
    setSelectedMachine(null)
  }

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
      {/* ✅ FAQAT BITTA USER INFO */}
      <div className='user-info'>
        <div className="user-profile-minimal">
          <div className="user-avatar-minimal">
            {userFullName ? userFullName.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="user-details-minimal">
            <div className="user-full-name-minimal">
              {userFullName || 'Foydalanuvchi'}
            </div>
            <div className="user-room-info-minimal">
              <span className="room-icon-minimal">🏠</span>
              <span className="room-text-minimal">
                {t('home.room')}: <strong>{userRoom}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>
      
    </header>

    <Alert type={alert.type} message={alert.message} />

      {/* 1-BOSQICH: SANA TANLASH */}
      <section className='booking-step'>
        <h3>1. {t('booking.selectDate')}</h3>
        <div className='calendar-grid'>
          {getWeekDates().map((date, idx) => (
            <div
              key={idx}
              className={`calendar-day ${
                selectedDate && format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
                  ? 'selected'
                  : ''
              } ${isPastDate(date) ? 'disabled' : ''}`}
              onClick={() => handleDateSelect(date)}
            >
              <div>{t(`days.short.${format(date, 'EEE').toLowerCase()}`)}</div>
              <div>{format(date, 'dd')}</div>
              <div>{t(`months.short.${format(date, 'MMM').toLowerCase()}`)}</div>
            </div>
          ))}
        </div>
        
        {selectedDate && (
          <div className='selected-date-info'>
            <strong>{t('booking.selectedDate')}:</strong> {format(selectedDate, 'dd.MM.yyyy')}
          </div>
        )}
      </section>

      {/* 2-BOSQICH: VAQT TANLASH */}
      {selectedDate && (
        <section className='booking-step'>
          <h3>2. {t('booking.selectTime')}</h3>
          <div className='time-slots-grid'>
            {timeSlots.map(slot => {
              const isDisabled = isDateToday(selectedDate) && isTimeSlotDisabled(slot);
              
              return (
                <div
                  key={slot}
                  className={`time-slot ${selectedTimeSlot === slot ? 'selected' : ''} ${
                    isDisabled ? 'disabled' : ''
                  }`}
                  onClick={() => !isDisabled && handleTimeSelect(slot)}
                >
                  {slot}
                  {isDisabled && (
                    <div className='time-slot-disabled-overlay'>
                      <span>{t('booking.timePassed')}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {selectedTimeSlot && (
            <div className='selected-time-info'>
              <strong>{t('booking.selectedTime')}:</strong> {selectedTimeSlot}
            </div>
          )}
        </section>
      )}

      {/* 3-BOSQICH: MASHINA TANLASH */}
      {selectedTimeSlot && (
        <section className='booking-step'>
          <h3>3. {t('booking.selectMachine')}</h3>
          <div className='machine-list'>
            {machines.map(machine => {
              const isBooked = isMachineBooked(machine.id, selectedTimeSlot)
              const isSelected = selectedMachine === machine.id
              const isActive = machine.is_active

              return (
                <div
                  key={machine.id}
                  className={`machine-item ${isSelected ? 'selected' : ''} ${
                    isBooked ? 'booked' : ''} ${!isActive ? 'inactive' : ''}`
                  }
                  onClick={() => {
                    if (!isBooked && isActive) handleMachineSelect(machine.id)
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
                        ? 'status-inactive'
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

          {/* BRON QILISH TUGMASI */}
          <form onSubmit={handleBooking} className='booking-form'>
            <div className='selected-summary'>
              <p>
                <strong>{t('booking.summary')}:</strong><br />
                {t('booking.date')}: {format(selectedDate, 'dd.MM.yyyy')}<br />
                {t('booking.time')}: {selectedTimeSlot}<br />
                {t('booking.machine')}: {selectedMachine ? 
                  machines.find(m => m.id === selectedMachine)?.name : 
                  t('booking.notSelected')}
              </p>
            </div>

                <button
                  type='submit'
                  className={`btn btn-success ${loading ? 'loading' : ''}`}
                  disabled={loading || !selectedMachine}
                >
                  {loading ? '' : t('booking.book')}
                </button>
          </form>
        </section>
      )}

      {/* FOYDALANUVCHI BRONLARI */}
      {userBookings.length > 0 && (
        <section className='user-bookings-section'>
          <h2>{t('home.myBookings')}</h2>
          <div className='user-bookings-grid'>
            {userBookings.slice(0, 3).map(booking => (
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
    </div>
  )
}

export default Home