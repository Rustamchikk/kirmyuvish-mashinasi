import { format } from 'date-fns'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import '../App.css'
import Alert from '../components/Alert'
import Loading from '../components/Loading'
import { bookingAPI } from '../services/api'
import './UserBookings.css'

const UserBookings = () => {
	const { t } = useTranslation()
	const { roomNumber } = useParams()
	const navigate = useNavigate()
	const [bookings, setBookings] = useState([])
	const [loading, setLoading] = useState(true)
	const [alert, setAlert] = useState({ type: '', message: '' })

	useEffect(() => {
		loadUserBookings()
	}, [roomNumber])

	const showAlert = (type, message) => {
		setAlert({ type, message })
		setTimeout(() => setAlert({ type: '', message: '' }), 5000)
	}

	const loadUserBookings = async () => {
		try {
			const response = await bookingAPI.getUserBookings(Number(roomNumber))
			setBookings(response.data.data)
		} catch (error) {
			showAlert('error', t('error.loadBookings'))
		} finally {
			setLoading(false)
		}
	}

	const handleDeleteBooking = async id => {
		if (!window.confirm(t('common.confirmDelete'))) return
		try {
			await bookingAPI.delete(id)
			showAlert('success', t('booking.cancelSuccess'))
			loadUserBookings()
		} catch (error) {
			showAlert('error', t('error.cancelBooking'))
		}
	}

	const handleBackToHome = () => navigate('/')

	if (loading) return <Loading />

	return (
		<div className='container'>
			<div className='hero'>
				<h1>{t('booking.myBookings')}</h1>
				<p>
					{t('common.room')}: <strong>{roomNumber}</strong>
				</p>
				<div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
					<button onClick={handleBackToHome} className='btn'>
						{t('header.home')}
					</button>
					<button
						onClick={() => navigate('/')}
						className='btn'
						style={{ background: '#28a745' }}
					>
						{t('booking.newBooking')}
					</button>
				</div>
			</div>

			<Alert type={alert.type} message={alert.message} />

			<div className='form-container'>
				<h2>{t('booking.bookingList')}</h2>
				{bookings.length === 0 ? (
					<p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
						{t('booking.noBookings')}
					</p>
				) : (
					<table className='table'>
						<thead>
							<tr>
								<th>{t('booking.date')}</th>
								<th>{t('booking.time')}</th>
								<th>{t('admin.machines')}</th>
								<th>{t('booking.bookedDate')}</th>
								<th>{t('common.actions')}</th>
							</tr>
						</thead>
						<tbody>
							{bookings.map(booking => (
								<tr key={booking.id}>
									<td>
										{format(new Date(booking.booking_date), 'dd.MM.yyyy')}
									</td>
									<td>{booking.time_slot}</td>
									<td>{booking.machine_name}</td>
									<td>
										{format(new Date(booking.created_at), 'dd.MM.yyyy HH:mm')}
									</td>
									<td>
										<button
											onClick={() => handleDeleteBooking(booking.id)}
											className='btn btn-danger'
											style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
										>
											{t('booking.cancel')}
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>
		</div>
	)
}

export default UserBookings
