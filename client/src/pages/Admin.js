import { format } from 'date-fns'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import '../App.css'
import Alert from '../components/Alert'
import Loading from '../components/Loading'
import { bookingAPI, machineAPI, userAPI } from '../services/api'

const Admin = () => {
	const { t } = useTranslation()
	const [users, setUsers] = useState([])
	const [bookings, setBookings] = useState([])
	const [machines, setMachines] = useState([])
	const [selectedDate, setSelectedDate] = useState(new Date())
	const [alert, setAlert] = useState({ type: '', message: '' })
	const [loading, setLoading] = useState(false)
	const [auth, setAuth] = useState({ username: '', password: '' })
	const [isAuthenticated, setIsAuthenticated] = useState(false)

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

	const showAlert = (type, message) => {
		setAlert({ type, message })
		setTimeout(() => setAlert({ type: '', message: '' }), 4000)
	}

	const handleLogin = e => {
		e.preventDefault()
		if (auth.username === 'rustam' && auth.password === '12345678') {
			setIsAuthenticated(true)
			showAlert('success', t('admin.loginSuccess'))
		} else {
			showAlert('error', t('admin.invalidCredentials'))
		}
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
					<button type='submit' className='btn-primary'>
						{t('admin.login')}
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
				<button
					onClick={() => setIsAuthenticated(false)}
					className='btn-danger logout-btn'
				>
					{t('admin.logout')}
				</button>
			</header>

			<Alert type={alert.type} message={alert.message} />

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

			<section className='date-section'>
				<label>{t('admin.selectDate')}</label>
				<input
					type='date'
					value={format(selectedDate, 'yyyy-MM-dd')}
					onChange={e => setSelectedDate(new Date(e.target.value))}
				/>
			</section>

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

			<section className='users-section'>
				<h2>{t('admin.users')}</h2>
				<div className='table-container'>
					{users.length ? (
						<table>
							<thead>
								<tr>
									<th>{t('register.fullName')}</th>
									<th>{t('common.room')}</th>
									<th>{t('booking.bookedDate')}</th>
								</tr>
							</thead>
							<tbody>
								{users.map(u => (
									<tr key={u.id}>
										<td>{u.full_name}</td>
										<td>{u.room_number}</td>
										<td>
											{format(new Date(u.created_at), 'dd.MM.yyyy HH:mm')}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					) : (
						<p className='no-data'>{t('admin.noUsers')}</p>
					)}
				</div>
			</section>
		</div>
	)
}

export default Admin
