// pages/Admin.js - TO'LIQ YANGILANGAN VERSIYA (LOGIN LIMIT BILAN)
import { format } from 'date-fns'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import '../App.css'
import '../pages/SuperAdmin.css';
import Alert from '../components/Alert'
import Loading from '../components/Loading'
import SessionModal from '../components/SessionModal'
import { 
  bookingAPI, 
  machineAPI, 
  userAPI, 
  adminAuthAPI, 
  adminMonitoringAPI,
  adminUsersAPI,
  adminUsersHistoryAPI
} from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import favicon from './favicon.png';

const Admin = () => {
  const { t, i18n } = useTranslation()
  const { adminLogin } = useAuth()

  const [users, setUsers] = useState([])
  const [bookings, setBookings] = useState([])
  const [machines, setMachines] = useState([])
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [alert, setAlert] = useState({ type: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [auth, setAuth] = useState({ username: '', password: '' })
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [adminType, setAdminType] = useState('')

  // ✅ YANGI: Login limit state lari
  const [loginAttempts, setLoginAttempts] = useState(0)
  const [isLocked, setIsLocked] = useState(false)
  const [lockedUntil, setLockedUntil] = useState(null)
  const [remainingTime, setRemainingTime] = useState(0)
  const [remainingAttempts, setRemainingAttempts] = useState(4)

  // Foydalanuvchilarni qidirish uchun state
  const [userSearch, setUserSearch] = useState('')

  // Session monitoring state lari
  const [sessions, setSessions] = useState([])
  const [sessionStats, setSessionStats] = useState(null)
  const [showSessionModal, setShowSessionModal] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // ✅ YANGI: usersadmin state lari
  const [historyUsers, setHistoryUsers] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [historySearch, setHistorySearch] = useState('')
  const [historyStats, setHistoryStats] = useState(null)
  
  // ✅ YANGI: Foydalanuvchi bronlari state lari
  const [userBookings, setUserBookings] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [showUserBookings, setShowUserBookings] = useState(false)

  // 🔧 ALERT FUNCTIONS
  const showAlert = (type, message) => {
    setAlert({ type, message })
    
    // 5 soniyadan so'ng avtomatik yopilish
    setTimeout(() => {
      setAlert({ type: '', message: '' })
    }, 5000)
  }

  const handleCloseAlert = () => {
    setAlert({ type: '', message: '' })
  }

  // 🔧 SERVER ERROR KEY NORMALIZER
  const resolveServerKey = (key) => {
    if (!key || typeof key !== "string") return null;

    key = key.trim();

    if (i18n.exists(key)) return key;

    // errors.xxx → error.xxx
    if (key.startsWith("errors.")) {
      const alt = "error." + key.slice(7);
      if (i18n.exists(alt)) return alt;
    }

    // error.xxx → errors.xxx
    if (key.startsWith("error.")) {
      const alt = "errors." + key.slice(6);
      if (i18n.exists(alt)) return alt;
    }

    // fallback
    if (i18n.exists("errors." + key)) return "errors." + key;
    if (i18n.exists("error." + key)) return "error." + key;

    return null;
  };

  // ✅ YANGI: Countdown timer funksiyasi
  const startCountdown = (minutes) => {
    let timeLeft = minutes * 60; // sekundlarda
    
    const timer = setInterval(() => {
      timeLeft -= 1;
      setRemainingTime(Math.ceil(timeLeft / 60));
      
      if (timeLeft <= 0) {
        clearInterval(timer);
        setIsLocked(false);
        setLoginAttempts(0);
        setRemainingAttempts(4);
        showAlert('success', t('auth.accountUnlocked'));
      }
    }, 1000);
  };

  // ✅ YANGILANGAN: Backend orqali login (LIMIT BILAN)
  const handleLogin = async e => {
    e.preventDefault()
    
    if (isLocked) {
      showAlert('error', t('auth.accountLockedMessage', { remainingTime }));
      return;
    }

    setLoading(true)
    
    try {
      const response = await adminAuthAPI.login(auth.username, auth.password)
      
      if (response.data.success) {
        // Muvaffaqiyatli login
        localStorage.setItem('adminToken', response.data.token)
        localStorage.setItem('adminType', response.data.adminType)
        
        adminLogin()
        setIsAuthenticated(true)
        setAdminType(response.data.adminType)
        setLoginAttempts(0)
        setRemainingAttempts(4)
        setIsLocked(false)
        
        showAlert('success', t('admin.loginSuccess'))
        
        if (response.data.adminType === 'super') {
          loadSessionData()
        }
      }
    } catch (error) {
      console.log('🔴 Login xatosi:', error.response?.data);
      
      const responseData = error.response?.data;
      
      if (error.response?.status === 429) {
        // Account locked
        setIsLocked(true);
        setLockedUntil(responseData.data?.lockedUntil);
        
        const lockMinutes = responseData.data?.lockedMinutes || 4;
        
        // ✅ TO'G'RI: lockMessage ni aniqlang va tarjima qilish
        const lockMessage = responseData.data?.message || 
          t('auth.accountLockedDuration', { lockMinutes });
        
        showAlert('error', lockMessage);
        
        // Countdown timer
        startCountdown(lockMinutes);
        
      } else if (error.response?.status === 401) {
        // Noto'g'ri login yoki parol
        const attempts = responseData.data?.remainingAttempts !== undefined 
          ? responseData.data.remainingAttempts 
          : (4 - loginAttempts - 1);
        
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);
        setRemainingAttempts(attempts);
        
        // ✅ TO'G'RI: Faqat "Noto'g'ri login yoki parol" xabari
        const errorMessage = responseData.data?.message || t('auth.invalidCredentials');
        
        showAlert('error', errorMessage);
        
        // 3-chi urinishda ogohlantirish
        if (newAttempts >= 3) {
          showAlert('warning', t('auth.warningLastAttempt'));
        }
      } else {
        // Boshqa xatoliklar
        const rawKey = error.response?.data?.message;
        const resolved = resolveServerKey(rawKey);
        const message = resolved ? t(resolved) : t('admin.invalidCredentials');
        showAlert('error', message);
      }
    } finally {
      setLoading(false)
    }
  }

  // ✅ YANGI: Reset login attempts
  const resetLoginAttempts = () => {
    setLoginAttempts(0);
    setRemainingAttempts(4);
    setIsLocked(false);
    setRemainingTime(0);
  }

  useEffect(() => {
    if (isAuthenticated) loadData()
  }, [isAuthenticated, selectedDate])

  const loadData = async () => {
    setLoading(true)
    try {
      const [usersRes, bookingsRes, machinesRes] = await Promise.all([
        userAPI.getAll(),
        bookingAPI.getAll(format(selectedDate, 'yyyy-MM-dd')),
        machineAPI.getAll(),
      ])
      setUsers(usersRes.data.data)
      setBookings(bookingsRes.data.data)
      setMachines(machinesRes.data.data)
    } catch (error) {
      const rawKey = error.response?.data?.message;
      const resolved = resolveServerKey(rawKey);
      const message = resolved ? t(resolved) : t('error.serverError');
      showAlert('error', message)
    } finally {
      setLoading(false)
    }
  }

  // Session ma'lumotlarini yuklash
  const loadSessionData = async () => {
    try {
      const [sessionsRes, statsRes] = await Promise.all([
        adminMonitoringAPI.getSessions(),
        adminMonitoringAPI.getSessionStats()
      ])
      
      // Faqat active sessionlarni olish
      const activeSessions = sessionsRes.data.data.filter(session => session.is_active)
      setSessions(activeSessions)
      setSessionStats(statsRes.data.data)
    } catch (error) {
      console.error('Session data load error:', error)
      const rawKey = error.response?.data?.message;
      const resolved = resolveServerKey(rawKey);
      const message = resolved ? t(resolved) : t('error.serverError');
      showAlert('error', message)
      setSessions([])
    }
  }

  // ✅ YANGI: usersadmin ma'lumotlarini yuklash (usersadmin jadvalidan)
  const loadHistoryUsers = async () => {
    setHistoryLoading(true)
    try {
      // 1. Avval statistikani olish
      const statsResponse = await adminUsersHistoryAPI.getStats()
      setHistoryStats(statsResponse.data.data)
      
      // 2. Keyin barcha foydalanuvchilarni olish
      const response = await adminUsersHistoryAPI.getAllUsers()
      setHistoryUsers(response.data.data)
      
    } catch (error) {
      console.error('❌ History users load error:', error)
      console.error('Error details:', error.response?.data)
      const rawKey = error.response?.data?.message;
      const resolved = resolveServerKey(rawKey);
      const message = resolved ? t(resolved) : t('error.serverError');
      showAlert('error', message)
    } finally {
      setHistoryLoading(false)
    }
  }

  // ✅ YANGI: usersadmin qidirish (usersadmin jadvalidan)
  const handleHistorySearch = async () => {
    if (!historySearch.trim()) {
      loadHistoryUsers() // Bo'sh qidiruvda barchasini ko'rsatish
      return
    }

    setHistoryLoading(true)
    try {
      const response = await adminUsersHistoryAPI.searchUsers(historySearch)
      setHistoryUsers(response.data.data)
    } catch (error) {
      console.error('❌ History search error:', error)
      const rawKey = error.response?.data?.message;
      const resolved = resolveServerKey(rawKey);
      const message = resolved ? t(resolved) : t('error.serverError');
      showAlert('error', message)
    } finally {
      setHistoryLoading(false)
    }
  }

  // ✅ YANGI: Foydalanuvchining bron tarixini yuklash
  const loadUserBookings = async (userId, userName) => {
    setHistoryLoading(true)
    try {
      const response = await adminUsersHistoryAPI.getUserBookings(userId)
      setUserBookings(response.data.data)
      setSelectedUser({ id: userId, name: userName })
      setShowUserBookings(true)
    } catch (error) {
      console.error('❌ Load user bookings error:', error)
      const rawKey = error.response?.data?.message
      const resolved = resolveServerKey(rawKey)
      const message = resolved ? t(resolved) : t('error.serverError')
      showAlert('error', message)
    } finally {
      setHistoryLoading(false)
    }
  }

  // ✅ YANGI: handleDeleteAllUsers funksiyasi
  const handleDeleteAllUsers = async () => {
    if (!window.confirm(t('admin.confirmDeleteAllUsers'))) {
      return;
    }

    setLoading(true);
    try {
      const response = await adminUsersAPI.deleteAllUsers();
      if (response.data.success) {
        showAlert('success', t('admin.allUsersDeleted'));
        // Foydalanuvchilar ro'yxatini yangilash
        const usersRes = await userAPI.getAll();
        setUsers(usersRes.data.data);
      }
    } catch (error) {
      const rawKey = error.response?.data?.message;
      const resolved = resolveServerKey(rawKey);
      const message = resolved ? t(resolved) : t('error.serverError');
      showAlert('error', message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ YANGI: handleDeleteUser funksiyasi
  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`${t('admin.confirmDeleteUser')} ${userName}?`)) {
      return;
    }

    try {
      const response = await adminUsersAPI.deleteUser(userId);
      if (response.data.success) {
        showAlert('success', t('admin.userDeleted'));
        // Foydalanuvchilar ro'yxatini yangilash
        const usersRes = await userAPI.getAll();
        setUsers(usersRes.data.data);
      }
    } catch (error) {
      const rawKey = error.response?.data?.message;
      const resolved = resolveServerKey(rawKey);
      const message = resolved ? t(resolved) : t('error.serverError');
      showAlert('error', message);
    }
  };

  // ✅ YANGI: handleDeleteBooking funksiyasi
  const handleDeleteBooking = async (bookingId) => {
    if (!window.confirm(t('admin.confirmDeleteBooking'))) {
      return;
    }

    try {
      const response = await bookingAPI.delete(bookingId);
      if (response.data.success) {
        showAlert('success', t('admin.bookingDeleted'));
        // Band qilishlar ro'yxatini yangilash
        const bookingsRes = await bookingAPI.getAll(format(selectedDate, 'yyyy-MM-dd'));
        setBookings(bookingsRes.data.data);
      }
    } catch (error) {
      const rawKey = error.response?.data?.message;
      const resolved = resolveServerKey(rawKey);
      const message = resolved ? t(resolved) : t('error.serverError');
      showAlert('error', message);
    }
  };

  // ✅ YANGI: handleMachineToggle funksiyasi
  const handleMachineToggle = async (machineId, isActive) => {
    try {
      const response = await machineAPI.update(machineId, { is_active: !isActive });
      if (response.data.success) {
        showAlert('success', t('admin.machineStatusUpdated'));
        // Mashinalar ro'yxatini yangilash
        const machinesRes = await machineAPI.getAll();
        setMachines(machinesRes.data.data);
      }
    } catch (error) {
      const rawKey = error.response?.data?.message;
      const resolved = resolveServerKey(rawKey);
      const message = resolved ? t(resolved) : t('error.serverError');
      showAlert('error', message);
    }
  };

  // ✅ YANGI: handleEndSession funksiyasi
  const handleEndSession = async (sessionId) => {
    try {
      const response = await adminMonitoringAPI.endSession(sessionId);
      if (response.data.success) {
        showAlert('success', t('admin.sessionEnded'));
        // Session ma'lumotlarini yangilash
        loadSessionData();
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (error) {
      const rawKey = error.response?.data?.message;
      const resolved = resolveServerKey(rawKey);
      const message = resolved ? t(resolved) : t('error.serverError');
      showAlert('error', message);
    }
  };

  // ✅ YANGI: handleEndAllSessions funksiyasi
  const handleEndAllSessions = async () => {
    if (!window.confirm(t('admin.confirmEndAllSessions'))) {
      return;
    }

    try {
      const response = await adminMonitoringAPI.endAllSessions();
      if (response.data.success) {
        showAlert('success', t('admin.allSessionsEnded'));
        // Session ma'lumotlarini yangilash
        loadSessionData();
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (error) {
      const rawKey = error.response?.data?.message;
      const resolved = resolveServerKey(rawKey);
      const message = resolved ? t(resolved) : t('error.serverError');
      showAlert('error', message);
    }
  };

  // Foydalanuvchilarni filtrlash
  const filteredUsers = userSearch 
    ? users.filter(user =>
        user.full_name.toLowerCase().includes(userSearch.toLowerCase()) ||
        user.room_number.toLowerCase().includes(userSearch.toLowerCase())
      )
    : users

  // ✅ YANGI: Filtrlangan history foydalanuvchilar
  const filteredHistoryUsers = historySearch 
    ? historyUsers.filter(user =>
        user.full_name?.toLowerCase().includes(historySearch.toLowerCase()) ||
        user.room_number?.toLowerCase().includes(historySearch.toLowerCase())
      )
    : historyUsers

  // Login page
  if (!isAuthenticated) {
    return (
      <div className='admin-login'>
        <form onSubmit={handleLogin} className='admin-login-form'>
          <h2>{t('admin.login')}</h2>
          
          {/* ✅ YANGI: Login limit ogohlantirishlari */}
          {isLocked && (
            <div className="lock-warning">
              <p>{t('auth.accountLocked')}</p>
            </div>
          )}

          {loginAttempts > 0 && !isLocked && (
            <div className="attempts-warning">
            </div>
          )}

          <Alert type={alert.type} message={alert.message} />
          
          <div className='form-group'>
            <label>{t('admin.username')}</label>
            <input
              type='text'
              value={auth.username}
              onChange={e => setAuth({ ...auth, username: e.target.value })}
              required
              disabled={isLocked}
            />
          </div>
          <div className='form-group'>
            <label>{t('admin.password')}</label>
            <input
              type='password'
              value={auth.password}
              onChange={e => setAuth({ ...auth, password: e.target.value })}
              required
              disabled={isLocked}
            />
          </div>
          
          <div className="login-actions">
            <button 
              type='submit' 
              className='btn-primary' 
              disabled={loading || isLocked}
            >
              {loading ? t('common.loading') : t('admin.login')}
            </button>
            
            {loginAttempts > 0 && (
              <button 
                type="button" 
                className="btn-secondary btn-sm"
                onClick={resetLoginAttempts}
              >
              </button>
            )}
          </div>
        </form>
      </div>
    )
  }

  if (loading) return <Loading />

  return (
    <div className='admin-container'>
      {/* 🔥 YANGILANGAN ALERT - FIXED POSITION */}
      <Alert 
        type={alert.type} 
        message={alert.message} 
        onClose={handleCloseAlert}
      />

      {/* Session Monitoring Section - FAQAT SUPER ADMIN UCHUN */}
      {adminType === 'super' && (
        <section className='session-monitoring-section'>
          <div className='section-header'>
            <h2>{t('admin.sessionMonitoring')}</h2>
            <div className='session-stats'>
              <button 
                onClick={() => setShowSessionModal(true)}
                className='btn-info'
              >
                📊 {t('admin.viewSessions')}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Statistika - Ikkala admin uchun ham */}
      <section className='stats-section'>
        <div className='stat-card'>
          <span>{users.length}</span>
          <p>{t('admin.registeredUsers')}</p>
        </div>
        <div className='stat-card'>
          <span>{bookings.length}</span>
          <p>{t('admin.todayBookings')}</p>
        </div>
        <div className='stat-card'>
          <span>{machines.length}</span>
          <p>{t('admin.totalMachines')}</p>
        </div>
      </section>
      {/* Sana tanlash - Ikkala admin uchun ham */}
      <section className='date-section'>
        <div className='section-header'>
          <h2>{t('admin.selectDate')}</h2>
        </div>
        <div className='date-input-container'>
          <input
            type='date'
            value={format(selectedDate, 'yyyy-MM-dd')}
            onChange={e => setSelectedDate(new Date(e.target.value))}
            className='date-picker'
          />
        </div>
      </section>

      {/* Band qilishlar - Ikkala admin uchun ham */}
<section className='bookings-section'>
  <h2>
    {t('admin.bookings')} ({format(selectedDate, 'dd.MM.yyyy')})
  </h2>
  
  {/* Vaqt oralig'iga qarab guruhlash */}
  <div className='bookings-group-container'>
    {/* 19:00-20:00 guruh */}
    <div className='time-group'>
      <h3 className='time-group-title'>🕖 19:00 - 20:00</h3>
      <div className='table-container'>
        {bookings.filter(b => b.time_slot === '19:00-20:00').length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>{t('register.fullName')}</th>
                <th>{t('common.room')}</th>
                <th>{t('admin.machines')}</th>
                <th>{t('booking.time')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {bookings
                .filter(b => b.time_slot === '19:00-20:00')
                .map(b => (
                  <tr key={b.id}>
                    <td>{b.full_name}</td>
                    <td>{b.room_number}</td>
                    <td>{b.machine_name}</td>
                    <td>
                      <span className='time-badge evening'>{b.time_slot}</span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleDeleteBooking(b.id)}
                        className='btn-danger btn-sm'
                      >
                        {t('common.delete')}
                      </button>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        ) : (
          <div className='no-bookings-group'>
            <p className='no-data-text'>🕖 {t('booking.noBookingsForTime')}</p>
          </div>
        )}
      </div>
    </div>

    {/* 20:00-21:00 guruh */}
    <div className='time-group'>
      <h3 className='time-group-title'>🕗 20:00 - 21:00</h3>
      <div className='table-container'>
        {bookings.filter(b => b.time_slot === '20:00-21:00').length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>{t('register.fullName')}</th>
                <th>{t('common.room')}</th>
                <th>{t('admin.machines')}</th>
                <th>{t('booking.time')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {bookings
                .filter(b => b.time_slot === '20:00-21:00')
                .map(b => (
                  <tr key={b.id}>
                    <td>{b.full_name}</td>
                    <td>{b.room_number}</td>
                    <td>{b.machine_name}</td>
                    <td>
                      <span className='time-badge night'>{b.time_slot}</span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleDeleteBooking(b.id)}
                        className='btn-danger btn-sm'
                      >
                        {t('common.delete')}
                      </button>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        ) : (
          <div className='no-bookings-group'>
            <p className='no-data-text'>🕗 {t('booking.noBookingsForTime')}</p>
          </div>
        )}
      </div>
    </div>
    {/* 21:00-22:00 guruh */}
    {/* <div className='time-group'>
      <h3 className='time-group-title'>🕘 21:00 - 22:00</h3>
      <div className='table-container'>
        {bookings.filter(b => b.time_slot === '21:00-22:00').length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>{t('register.fullName')}</th>
                <th>{t('common.room')}</th>
                <th>{t('admin.machines')}</th>
                <th>{t('booking.time')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {bookings
                .filter(b => b.time_slot === '21:00-22:00')
                .map(b => (
                  <tr key={b.id}>
                    <td>{b.full_name}</td>
                    <td>{b.room_number}</td>
                    <td>{b.machine_name}</td>
                    <td>
                      <span className='time-badge late-night'>{b.time_slot}</span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleDeleteBooking(b.id)}
                        className='btn-danger btn-sm'
                      >
                        {t('common.delete')}
                      </button>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        ) : (
          <div className='no-bookings-group'>
            <p className='no-data-text'>🕘 {t('booking.noBookingsForTime')}</p>
          </div>
        )}
      </div>
    </div> */}
  </div>
</section>

      {/* Foydalanuvchilar - FAQAT SUPER ADMIN UCHUN */}
{adminType === 'super' && (
  <section className='users-section'>
    <div className='section-header'>
      <h2>👥 {t('admin.registeredUsers')}</h2>
      <div className='users-actions'>
        <div className='search-box'>
          <input
            type='text'
            placeholder={t('admin.searchUsers')}
            value={userSearch}
            onChange={e => setUserSearch(e.target.value)}
            className='search-input'
          />
        </div>
        
        {/* ✅ YANGI: Barcha foydalanuvchilarni o'chirish tugmasi */}
        <button
          onClick={() => {
            if (window.confirm(t('admin.confirmDeleteAllUsers'))) {
              handleDeleteAllUsers();
            }
          }}
          className='btn-delete-all'
          title={t('admin.deleteAllUsers')}
          disabled={users.length === 0}
        >
          <span className="delete-all-icon">🗑️</span>
          {t('admin.deleteAllUsers')}
        </button>
      </div>
    </div>
    
    <div className='table-container'>
      {filteredUsers.length ? (
        <table className='users-table'>
          <thead>
            <tr>
              <th>{t('common.name')}</th>
              <th>{t('common.room')}</th>
              <th>{t('admin.registeredAt')}</th>
              <th>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(u => (
              <tr key={u.id}>
                <td className='user-name'>{u.full_name}</td>
                <td className='room-number'>{u.room_number}</td>
                <td className='registration-date'>
                  {format(new Date(u.created_at), 'dd.MM.yyyy HH:mm')}
                </td>
                <td className='user-actions'>
                  <button
                    onClick={() => handleDeleteUser(u.id, u.full_name)}
                    className='btn-danger btn-sm'
                    title={t('admin.deleteUser')}
                  >
                    {t('common.delete')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className='no-users'>
          <div className='no-users-icon'>👥</div>
          <h4>{t('admin.noUsersFound')}</h4>
          <p>{t('admin.noUsersMessage')}</p>
        </div>
      )}
    </div>
  </section>
)}
      {/* Mashinalarni boshqarish - Ikkala admin uchun ham */}
<section className='machine-section'>
  <div className='section-header'>
    <h2>{t('admin.machineManagement')}</h2>
  </div>

  <div className='table-container'>
    <table>
      <thead>
        <tr>
          <th>{t('admin.machines')}</th>
          <th>{t('admin.status')}</th>
          <th>{t('common.actions')}</th>
        </tr>
      </thead>
      <tbody>
        {machines.map(machine => (
          <tr key={machine.id}>
            <td className="machine-name-cell">
              <div className="machine-name-wrapper">
                <img src={favicon} alt="Favicon" width="20" height="20" />
                <span className="machine-name-text">{machine.name}</span>
              </div>
            </td>
            <td>
              <div className="status-dot-wrapper">
                <span className={`pulsating-dot ${machine.is_active ? 'online' : 'offline'}`}></span>
                <span className="status-text">
                  {machine.is_active ? t('admin.active') : t('admin.inactive')}
                </span>
              </div>
            </td>
            <td>
              <label className="tg-toggle">
                <input 
                  type="checkbox" 
                  checked={machine.is_active}
                  onChange={() => handleMachineToggle(machine.id, machine.is_active)}
                />
                <span className="tg-toggle-slider"></span>
              </label>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</section>
      {/* ✅ YANGILANGAN: Usersadmin Panel - ENG PASTDA FAQAT SUPER ADMIN UCHUN */}
      {adminType === 'super' && (
        <section className='history-section'>
          <div className='section-header'>
            <h2>📈 Barcha Ro'yxatdan O'tgan Foydalanuvchilar (Arxiv)</h2>
            <div className='section-actions'>
              <div className='search-box'>
                <input
                  type='text'
                  placeholder='Ism yoki xona raqami boʻyicha qidirish...'
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleHistorySearch()}
                  className='search-input'
                />
                <button 
                onClick={() => {
                  setShowHistory(!showHistory)
                  if (!showHistory) {
                    loadHistoryUsers()
                  }
                }}
                className={showHistory ? 'btn-secondary' : 'btn-primary'}
              >
                {showHistory ? 'Yopish' : '📋 Arxivi Koʻrish'}
              </button>
              </div>
            </div>
          </div>

          {/* Ko'rsatish/Yashirish */}
          {showHistory && (
            <>
              {/* Statistika */}
              {historyStats && (
                <div className='stats-section'>
                  <div className='stat-card'>
                    <span className='stat-number'>{historyStats.totalUsers}</span>
                    <p className='stat-label'>Jami Roʻyxatdan Oʻtganlar</p>
                    <small style={{opacity: 0.7, fontSize: '0.75rem'}}>usersadmin bazasida</small>
                  </div>
                  <div className='stat-card'>
                    <span className='stat-number'>{historyStats.usersWithBookings || 0}</span>
                    <p className='stat-label'>Bron Qilganlar</p>
                    <small style={{opacity: 0.7, fontSize: '0.75rem'}}>faol foydalanuvchilar</small>
                  </div>
                  <div className='stat-card'>
                    <span className='stat-number'>{historyStats.totalBookings || 0}</span>
                    <p className='stat-label'>Jami Bronlar</p>
                    <small style={{opacity: 0.7, fontSize: '0.75rem'}}>barcha vaqtlar uchun</small>
                  </div>
                </div>
              )}

              {/* Jadval */}
              <div className='table-container'>
                {historyLoading ? (
                  <Loading />
                ) : filteredHistoryUsers.length > 0 ? (
                  <table className='users-table'>
                    <thead>
                      <tr>
                        <th>Ism</th>
                        <th>Xona</th>
                        <th>Status</th>
                        <th>Mashina</th>
                        <th>Bron Sanasi</th>
                        <th>Vaqt Oralig'i</th>
                        <th>Ro'yxatdan O'tgan Sana</th>
                        <th>Harakatlar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHistoryUsers.map(record => (
                        <tr key={record.id}>
                          <td className='user-name'>{record.full_name}</td>
                          <td className='room-number'>{record.room_number}</td>
                          <td className='user-status'>
                            <span className={`status-badge ${
                              record.status === 'BRON_QILGAN' ? 'status-active' : 'status-inactive'
                            }`}>
                              {record.status === 'BRON_QILGAN' ? '✅ Bron qilgan' : '📝 Faqat roʻyxatdan oʻtgan'}
                            </span>
                          </td>
                          <td className='machine-name'>
                            {record.machine_name || '—'}
                          </td>
                          <td className='booking-date'>
                            {record.booking_date ? format(new Date(record.booking_date), 'dd.MM.yyyy') : '—'}
                          </td>
                          <td className='time-slot'>
                            {record.time_slot || '—'}
                          </td>
                          <td className='registration-date'>
                            {record.registered_at ? format(new Date(record.registered_at), 'dd.MM.yyyy HH:mm') : 'Noma\'lum'}
                          </td>
                          <td className='user-actions'>
                            {record.user_id && record.status === 'BRON_QILGAN' && (
                              <button
                                onClick={() => loadUserBookings(record.user_id, record.full_name)}
                                className='btn-info btn-sm'
                                title="Barcha bronlarni ko'rish"
                              >
                                📊 Bronlar
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className='no-data'>
                    <p>Hech qanday ma'lumot topilmadi</p>
                    <small>usersadmin bazasida ma'lumot yo'q</small>
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      )}

      {/* Session Modal */}
      {showSessionModal && (
        <SessionModal
          sessions={sessions}
          onClose={() => setShowSessionModal(false)}
          onEndSession={handleEndSession}
          onEndAllSessions={handleEndAllSessions}
          refreshTrigger={refreshTrigger}
        />
      )}

      {/* ✅ YANGI: Foydalanuvchi bronlari modali */}
      {showUserBookings && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>📊 {selectedUser?.name} - Barcha Bron Tarixi</h3>
              <button 
                onClick={() => setShowUserBookings(false)}
                className="close-btn"
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              {historyLoading ? (
                <Loading />
              ) : userBookings.length > 0 ? (
                <div className="modal-table-container">
                  <table className="bookings-table">
                    <thead>
                      <tr>
                        <th>Mashina</th>
                        <th>Bron Sanasi</th>
                        <th>Vaqt Oralig'i</th>
                        <th>Bron Qilingan Vaqt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userBookings.map(booking => (
                        <tr key={booking.id}>
                          <td>{booking.machine_name}</td>
                          <td>{format(new Date(booking.booking_date), 'dd.MM.yyyy')}</td>
                          <td>{booking.time_slot}</td>
                          <td>{format(new Date(booking.booking_created_at), 'dd.MM.yyyy HH:mm')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="no-data">
                  <p>Bu foydalanuvchining bronlari topilmadi</p>
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button 
                onClick={() => setShowUserBookings(false)}
                className="btn-secondary"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Admin