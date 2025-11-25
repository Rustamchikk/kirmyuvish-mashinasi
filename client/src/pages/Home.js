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
  const { userRoom, login, isAuthenticated, checkWeekValidity } = useAuth()
  const navigate = useNavigate()

  const [machines, setMachines] = useState([])
  const [bookings, setBookings] = useState([])
  const [userBookings, setUserBookings] = useState([])
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('')
  const [selectedMachine, setSelectedMachine] = useState(null)
  const [alert, setAlert] = useState({ type: '', message: '' })
  const [loading, setLoading] = useState(false)

  const timeSlots = ['19:00-20:00', '20:00-21:00', '21:00-22:00']

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
    
    if (timeSlot === '21:00-22:00' && currentTimeInMinutes > 21 * 60 + 1) {
      return true;
    }
    
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
        <h1>{t('home.booking')}</h1>
        <div className='user-info'>
          <span>{t('home.room')}: {userRoom}</span>
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
              className='btn btn-success'
              disabled={loading || !selectedMachine}
            >
              {loading ? t('booking.booking') : t('booking.book')}
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

      <style jsx>{`
        .booking-step {
          margin-bottom: 2rem;
          padding: 1.5rem;
          background: #f8f9fa;
          border-radius: 12px;
          border: 1px solid #e9ecef;
        }

        .booking-step h3 {
          margin-bottom: 1rem;
          color: #333;
          border-bottom: 2px solid #3d5deb;
          padding-bottom: 0.5rem;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .moscow-time {
          font-size: 0.9rem;
          color: #666;
          background: #f0f0f0;
          padding: 0.3rem 0.6rem;
          border-radius: 4px;
          border: 1px solid #ddd;
          font-weight: 500;
        }

        /* === TIME SLOTS === */
        .time-slots-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .time-slot {
          padding: 1rem;
          background: white;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s;
          font-weight: 600;
          position: relative;
        }

        .time-slot:hover {
          border-color: #3d5deb;
          background: #f0f4ff;
        }

        .time-slot.selected {
          border-color: #3d5deb;
          background: #3d5deb;
          color: white;
        }

        /* ✅ YANGI: Vaqt oralig'i nofaol holatdagi stillar */
        .time-slot.disabled {
          opacity: 0.5;
          cursor: not-allowed;
          background: #e9ecef;
          border-color: #ced4da;
          position: relative;
        }

        .time-slot.disabled:hover {
          border-color: #ced4da;
          background: #e9ecef;
        }

        .time-slot-disabled-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .selected-date-info,
        .selected-time-info {
          margin-top: 1rem;
          padding: 0.5rem;
          background: #d4edda;
          border-radius: 6px;
          color: #155724;
        }

        .booking-form {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e9ecef;
        }

        /* === SELECTED SUMMARY === */
        .selected-summary {
          background: white;
          padding: 1rem;
          border-radius: 8px;
          border: 1px solid #e9ecef;
          margin-bottom: 1rem;
        }

        /* === MACHINE STATUS === */
        .machine-item.booked {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .machine-item.inactive {
          background: #f8d7da;
          cursor: not-allowed;
        }

        .status-inactive {
          background: #f8d7da;
          color: #721c24;
        }

        /* === USER BOOKINGS === */
        .user-bookings-section {
          margin-top: 2rem;
          padding: 1.5rem;
          background: #f8f9fa;
          border-radius: 12px;
          border: 1px solid #e9ecef;
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

        /* ====================================== */
        /* ========== CALENDAR SECTION ========== */
        /* ====================================== */

        .calendar-grid {
          display: grid !important;
          grid-template-columns: repeat(5, 1fr);
          gap: 0.5rem;
          margin-top: 0.5rem;
        }

        .calendar-day {
          background: #f8f9fa;
          border-radius: 12px;
          padding: 0.75rem 0;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
        }

        .calendar-day div {
          margin: 2px 0;
        }

        .calendar-day.selected {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          font-weight: bold;
          transform: scale(1.05);
        }

        .calendar-day:hover:not(.disabled):not(.selected) {
          background: #667eea33;
          transform: translateY(-3px);
        }

        .calendar-day.disabled {
          opacity: 0.4;
          cursor: not-allowed;
          background: #e9ecef;
        }

        /* ========== RESPONSIVE ========== */

        @media (max-width: 768px) {
          .time-slots-grid {
            grid-template-columns: 1fr;
          }

          .user-bookings-grid {
            grid-template-columns: 1fr;
          }

          .user-info {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }

          .moscow-time {
            align-self: flex-start;
          }

          /* 3 ta qatorga tushadi */
          .calendar-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }

        /* 📱 TELEFON: 1 QATOR SCROLL */
        @media (max-width: 480px) {
          .calendar-grid {
            display: grid !important;
            grid-template-columns: repeat(5, 120px) !important;
            overflow-x: auto;
            white-space: nowrap;
          }
        }
      `}</style>
    </div>
  )
}

export default Home