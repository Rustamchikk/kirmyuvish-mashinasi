import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

const Header = () => {
	const { t, i18n } = useTranslation()
	const userRoom = localStorage.getItem('userRoom')

	const changeLanguage = lng => {
		i18n.changeLanguage(lng)
	}

	const buttonStyle = {
		background: 'transparent',
		color: '#fff',
		border: '1px solid #fff',
		padding: '0.4rem 1rem',
		borderRadius: '6px',
		cursor: 'pointer',
		fontSize: '0.9rem',
		transition: 'all 0.3s',
		fontWeight: '500',
	}

	const activeButtonStyle = {
		background: '#fff',
		color: '#3d5debff',
		border: '1px solid #fff',
		padding: '0.4rem 1rem',
		borderRadius: '6px',
		cursor: 'pointer',
		fontSize: '0.9rem',
		transition: 'all 0.3s',
		fontWeight: '600',
	}

	const navLinkStyle = {
		color: 'white',
		textDecoration: 'none',
		marginLeft: '1.5rem',
		padding: '0.5rem 1.2rem',
		border: '1px solid rgba(255,255,255,0.3)',
		borderRadius: '6px',
		transition: 'all 0.3s',
		background: 'rgba(255,255,255,0.1)',
		fontWeight: '500',
	}

	const navLinkHoverStyle = {
		background: 'rgba(255,255,255,0.2)',
		borderColor: 'rgba(255,255,255,0.5)',
		transform: 'translateY(-1px)',
	}

	return (
		<header className='header'>
			<div className='container'>
				<div className='header-content'>
					<div
						className='logo'
						style={{ fontSize: '1.6rem', fontWeight: 'bold' }}
					>
						{t('header.title')}
					</div>
					<nav
						className='nav'
						style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}
					>
						<Link
							to='/'
							style={navLinkStyle}
							onMouseOver={e =>
								Object.assign(e.target.style, navLinkHoverStyle)
							}
							onMouseOut={e => Object.assign(e.target.style, navLinkStyle)}
						>
							{t('header.home')}
						</Link>
						<Link
							to='/admin'
							style={navLinkStyle}
							onMouseOver={e =>
								Object.assign(e.target.style, navLinkHoverStyle)
							}
							onMouseOut={e => Object.assign(e.target.style, navLinkStyle)}
						>
							{t('header.admin')}
						</Link>

						{/* Til almashtirish tugmalari */}
						<div
							style={{
								display: 'flex',
								gap: '0.8rem',
								marginLeft: '1rem',
								borderLeft: '1px solid rgba(255,255,255,0.3)',
								paddingLeft: '1.5rem',
							}}
						>
							<button
								onClick={() => changeLanguage('uz')}
								style={i18n.language === 'uz' ? activeButtonStyle : buttonStyle}
								onMouseOver={e => {
									if (i18n.language !== 'uz') {
										e.target.style.background = 'rgba(255,255,255,0.1)'
										e.target.style.transform = 'translateY(-1px)'
									}
								}}
								onMouseOut={e => {
									if (i18n.language !== 'uz') {
										e.target.style.background = 'transparent'
										e.target.style.transform = 'translateY(0)'
									}
								}}
							>
								UZ
							</button>
							<button
								onClick={() => changeLanguage('en')}
								style={i18n.language === 'en' ? activeButtonStyle : buttonStyle}
								onMouseOver={e => {
									if (i18n.language !== 'en') {
										e.target.style.background = 'rgba(255,255,255,0.1)'
										e.target.style.transform = 'translateY(-1px)'
									}
								}}
								onMouseOut={e => {
									if (i18n.language !== 'en') {
										e.target.style.background = 'transparent'
										e.target.style.transform = 'translateY(0)'
									}
								}}
							>
								EN
							</button>
							<button
								onClick={() => changeLanguage('ru')}
								style={i18n.language === 'ru' ? activeButtonStyle : buttonStyle}
								onMouseOver={e => {
									if (i18n.language !== 'ru') {
										e.target.style.background = 'rgba(255,255,255,0.1)'
										e.target.style.transform = 'translateY(-1px)'
									}
								}}
								onMouseOut={e => {
									if (i18n.language !== 'ru') {
										e.target.style.background = 'transparent'
										e.target.style.transform = 'translateY(0)'
									}
								}}
							>
								RU
							</button>
						</div>
					</nav>
				</div>
			</div>
		</header>
	)
}

export default Header
