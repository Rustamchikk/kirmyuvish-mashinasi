// pages/Admin.js
import { format } from 'date-fns'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import '../App.css'
import '../brons.css';
import Alert from '../components/Alert'
import Loading from '../components/Loading'
import SessionModal from '../components/SessionModal'
import { 
  bookingAPI, 
  machineAPI, 
  userAPI, 
  adminAuthAPI, 
  adminMonitoringAPI,
  adminUsersAPI 
} from '../services/api'
import { useAuth } from '../contexts/AuthContext'

const Admin = () => {
  const { t } = useTranslation()
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

  // Foydalanuvchilarni qidirish uchun state
  const [userSearch, setUserSearch] = useState('')

  // Session monitoring state lari
  const [sessions, setSessions] = useState([])
  const [sessionStats, setSessionStats] = useState(null)
  const [showSessionModal, setShowSessionModal] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Backend orqali login
  const handleLogin = async e => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const response = await adminAuthAPI.login(auth.username, auth.password)
      
      if (response.data.success) {
        // Token ni saqlash
        localStorage.setItem('adminToken', response.data.token)
        localStorage.setItem('adminType', response.data.adminType)
        
        adminLogin()
        setIsAuthenticated(true)
        setAdminType(response.data.adminType)
        showAlert('success', t('admin.loginSuccess'))
        
        // Agar super admin bo'lsa, session ma'lumotlarini yuklash
        if (response.data.adminType === 'super') {
          loadSessionData()
        }
      }
    } catch (error) {
      const message = error.response?.data?.message || t('admin.invalidCredentials')
      showAlert('error', message)
    } finally {
      setLoading(false)
    }
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
    } catch {
      showAlert('error', t('error.serverError'))
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
      setSessions([])
    }
  }

  const showAlert = (type, message) => {
    setAlert({ type, message })
    setTimeout(() => setAlert({ type: '', message: '' }), 4000)
  }

  const handleDeleteBooking = async id => {
    if (!window.confirm(t('admin.deleteConfirmation'))) return
    try {
      await bookingAPI.delete(id)
      showAlert('success', t('booking.cancelSuccess'))
      loadData()
    } catch {
      showAlert('error', t('error.cancelBooking'))
    }
  }

  const handleMachineToggle = async (id, isActive) => {
    try {
      await machineAPI.update(id, { is_active: !isActive })
      showAlert('success', t('admin.machineStatusUpdated'))
      loadData()
    } catch {
      showAlert('error', t('error.updateMachine'))
    }
  }

  // Session boshqaruv funksiyalari - YANGILANDI
  const handleEndSession = async (sessionId) => {
    if (!window.confirm(t('admin.endSessionConfirmation'))) return
    
    try {
      const response = await adminMonitoringAPI.endSession(sessionId)
      
      if (response.data.success) {
        // State ni darhol yangilash
        setSessions(prevSessions => prevSessions.filter(session => session.id !== sessionId))
        
        // Statistikani yangilash
        if (sessionStats) {
          setSessionStats(prevStats => ({
            ...prevStats,
            active_sessions: Math.max(0, prevStats.active_sessions - 1)
          }))
        }
        
        // Refresh trigger ni yangilash
        setRefreshTrigger(prev => prev + 1)
        
        showAlert('success', response.data.message)
      }
    } catch (error) {
      const message = error.response?.data?.message || t('admin.endSessionError')
      showAlert('error', message)
    }
  }

  const handleEndAllSessions = async () => {
    if (!window.confirm(t('admin.endAllSessionsConfirmation'))) return
    
    try {
      const response = await adminMonitoringAPI.endAllSessions()
      
      if (response.data.success) {
        // Local state larni yangilash
        setSessions([])
        if (sessionStats) {
          setSessionStats(prevStats => ({
            ...prevStats,
            active_sessions: 0
          }))
        }
        
        // Refresh trigger ni yangilash
        setRefreshTrigger(prev => prev + 1)
        
        showAlert('success', response.data.message)
      }
    } catch (error) {
      const message = error.response?.data?.message || t('admin.endAllSessionsError')
      showAlert('error', message)
    }
  }

  // Foydalanuvchini o'chirish
  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(t('admin.deleteUserConfirmation', { name: userName }))) return
    
    try {
      await adminUsersAPI.deleteUser(userId)
      showAlert('success', t('admin.userDeleted'))
      loadData()
    } catch (error) {
      showAlert('error', t('admin.deleteUserError'))
    }
  }

  // Barcha foydalanuvchilarni o'chirish
  const handleDeleteAllUsers = async () => {
    if (!window.confirm(t('admin.deleteAllUsersConfirmation'))) return
    
    try {
      await adminUsersAPI.deleteAllUsers()
      showAlert('success', t('admin.allUsersDeleted'))
      loadData()
    } catch (error) {
      showAlert('error', t('admin.deleteAllUsersError'))
    }
  }

  // Foydalanuvchilarni filtrlash
  const filteredUsers = userSearch 
    ? users.filter(user =>
        user.full_name.toLowerCase().includes(userSearch.toLowerCase()) ||
        user.room_number.toLowerCase().includes(userSearch.toLowerCase())
      )
    : users

  // Login page
  if (!isAuthenticated) {
    return (
      <div className='admin-login'>
        <form onSubmit={handleLogin} className='admin-login-form'>
          <h2>{t('admin.login')}</h2>
          <Alert type={alert.type} message={alert.message} />
          <div className='form-group'>
            <label>{t('admin.username')}</label>
            <input
              type='text'
              value={auth.username}
              onChange={e => setAuth({ ...auth, username: e.target.value })}
              required
            />
          </div>
          <div className='form-group'>
            <label>{t('admin.password')}</label>
            <input
              type='password'
              value={auth.password}
              onChange={e => setAuth({ ...auth, password: e.target.value })}
              required
            />
          </div>
          <button type='submit' className='btn-primary' disabled={loading}>
            {loading ? t('common.loading') : t('admin.login')}
          </button>
        </form>
      </div>
    )
  }

  if (loading) return <Loading />

  return (
    <div className='admin-container'>
      <header className='admin-header'>
        <h1>{t('admin.title')}</h1>
        <div className='admin-info'>
          <span className={`admin-badge ${adminType === 'super' ? 'super-admin' : 'regular-admin'}`}>
            {adminType === 'super' ? t('admin.superAdmin') : t('admin.admin')}
          </span>
        </div>
      </header>

      <Alert type={alert.type} message={alert.message} />

      {/* Session Monitoring Section - FAQAT SUPER ADMIN UCHUN */}
      {adminType === 'super' && (
        <section className='session-monitoring-section'>
          <div className='section-header'>
            <h2>{t('admin.sessionMonitoring')}</h2>
            <div className='session-stats'>
              {sessionStats && (
                <div className='stats-badge'>
                  <span className='stat-number'>{sessionStats.active_sessions}</span>
                  <span className='stat-label'>{t('admin.activeSessions')}</span>
                </div>
              )}
              {sessionStats && (
                <div className='stats-badge'>
                  <span className='stat-number'>{sessionStats.unique_devices}</span>
                  <span className='stat-label'>{t('admin.devices')}</span>
                </div>
              )}
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
        <label>{t('admin.selectDate')}</label>
        <input
          type='date'
          value={format(selectedDate, 'yyyy-MM-dd')}
          onChange={e => setSelectedDate(new Date(e.target.value))}
        />
      </section>

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
                  <td>{machine.name}</td>
                  <td>
                    <span
                      className={
                        machine.is_active ? 'status-active' : 'status-inactive'
                      }
                    >
                      {machine.is_active
                        ? t('admin.active')
                        : t('admin.inactive')}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() =>
                        handleMachineToggle(machine.id, machine.is_active)
                      }
                      className={
                        machine.is_active ? 'btn-warning' : 'btn-success'
                      }
                    >
                      {machine.is_active
                        ? t('admin.turnOff')
                        : t('admin.turnOn')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Band qilishlar - Ikkala admin uchun ham */}
      <section className='bookings-section'>
        <h2>
          {t('admin.bookings')} ({format(selectedDate, 'dd.MM.yyyy')})
        </h2>
        <div className='table-container'>
          {bookings.length ? (
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
                {bookings.map(b => (
                  <tr key={b.id}>
                    <td>{b.full_name}</td>
                    <td>{b.room_number}</td>
                    <td>{b.machine_name}</td>
                    <td>{b.time_slot}</td>
                    <td>
                      <button
                        onClick={() => handleDeleteBooking(b.id)}
                        className='btn-danger btn-sm'
                      >
                        {t('common.delete')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className='no-data'>{t('booking.noBookings')}</p>
          )}
        </div>
      </section>

      {/* Foydalanuvchilar - FAQAT SUPER ADMIN UCHUN */}
      {adminType === 'super' && (
        <section className='users-section'>
          <div className='section-header'>
            <h2>👥 {t('admin.users')}</h2>
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
              <button 
                onClick={handleDeleteAllUsers}
                className='btn-danger'
                disabled={users.length === 0}
              >
                🗑️ {t('admin.deleteAllUsers')}
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
                          🗑️ {t('common.delete')}
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
    </div>
  )
}

export default Admin