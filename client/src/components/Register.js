import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { userAPI } from '../services/api'
import Alert from './Alert'

const Register = ({ onRegister }) => {
	const { t } = useTranslation()
	const [user, setUser] = useState({ full_name: '', room_number: '' })
	const [alert, setAlert] = useState({ type: '', message: '' })
	const [loading, setLoading] = useState(false)

	const showAlert = (type, message) => {
		setAlert({ type, message })
		setTimeout(() => setAlert({ type: '', message: '' }), 5000)
	}

	const handleSubmit = async e => {
		e.preventDefault()

		if (!user.full_name.trim()) {
			showAlert('error', t('register.nameRequired'))
			return
		}

		const nameParts = user.full_name.trim().split(/\s+/)
		if (nameParts.length < 2) {
			showAlert('error', t('register.nameRequired'))
			return
		}

		if (user.full_name.trim().length < 5) {
			showAlert('error', t('register.nameLength'))
			return
		}

		if (!user.room_number.trim()) {
			showAlert('error', t('register.roomRequired'))
			return
		}

		if (!/^[0-9]{3}$/.test(user.room_number.trim())) {
			showAlert('error', t('register.roomFormat'))
			return
		}

		setLoading(true)

		try {
			await userAPI.register(user)
			showAlert('success', t('register.success'))
			onRegister(user.room_number)
		} catch (error) {
			showAlert('error', error.response?.data?.message || t('error.booking'))
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className='form-container'>
			<h2>{t('register.title')}</h2>
			<Alert type={alert.type} message={alert.message} />
			<form onSubmit={handleSubmit}>
				<div className='form-group'>
					<label>{t('register.fullName')}</label>
					<input
						type='text'
						value={user.full_name}
						onChange={e => setUser({ ...user, full_name: e.target.value })}
						required
					/>
				</div>

				<div className='form-group'>
					<label>{t('register.roomNumber')} </label>
					<input
						type='text'
						value={user.room_number}
						onChange={e => setUser({ ...user, room_number: e.target.value })}
						required
						maxLength='3'
					/>
				</div>

				<button type='submit' className='btn' disabled={loading}>
					{loading ? t('register.loading') : t('register.submit')}
				</button>
			</form>
		</div>
	)
}

export default Register
