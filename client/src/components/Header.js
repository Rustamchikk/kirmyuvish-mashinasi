// components/Header.js
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Home, UserCog, Globe, Menu, X, LogOut } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import './Header.css'

const Header = () => {
	const { t, i18n } = useTranslation()
	const [menuOpen, setMenuOpen] = useState(false)
	const { logout, adminLogout, isAuthenticated, userRoom, isAdmin } = useAuth()
	const navigate = useNavigate()

	const changeLanguage = lng => {
		i18n.changeLanguage(lng)
	}

	const handleExit = () => {
		if (isAuthenticated) {
			if (isAdmin) {
				adminLogout()
			} else {
				logout()
			}
			navigate('/')
			setMenuOpen(false)
		} else {
			console.log('Exit clicked - not authenticated')
		}
	}

	// Til nomlari obyekti
	const languageNames = {
		uz: "O'Z",
		en: "EN", 
		ru: "RU"
	}

	return (
		<>
			{/* HEADER */}
			<header className='main-header'>
				<div className='header-container'>
					{/* Chap tomondagi elementlar */}
					<div className='header-left'>
						{/* Menu Toggle */}
						<button
							className='menu-toggle'
							onClick={() => setMenuOpen(!menuOpen)}
							aria-label={t('header.toggleMenu')}
						>
							{menuOpen ? <X size={24} /> : <Menu size={24} />}
						</button>

						{/* Logo */}
						<div className='logo'>
							<div className='logo-text'>
								<div className='logo-title'>{t('header.logo')}</div>
							</div>
						</div>
					</div>

					{/* O'ng tomondagi elementlar */}
					<div className='header-right'>
						{/* Language Switcher - Kichik ekranlarda optimallashtirilgan */}
						<div className='language-section'>
							<div className='language-switcher-compact'>
								<Globe size={18} />
								<select 
									value={i18n.language} 
									onChange={(e) => changeLanguage(e.target.value)}
									className='language-select'
								>
									{['uz', 'en', 'ru'].map(lang => (
										<option key={lang} value={lang}>
											{languageNames[lang]}
										</option>
									))}
								</select>
							</div>
							
							{/* Desktop uchun buttonlar */}
							<div className='language-switcher-desktop'>
								<Globe size={18} />
								{['uz', 'en', 'ru'].map(lang => (
									<button
										key={lang}
										onClick={() => changeLanguage(lang)}
										className={`lang-btn ${i18n.language === lang ? 'active' : ''}`}
									>
										{languageNames[lang]}
									</button>
								))}
							</div>
						</div>

						{/* Exit Button */}
						<button className='exit-btn' onClick={handleExit}>
							<LogOut size={18} />
							<span className='exit-text'>{t('header.exit')}</span>
							<span className='exit-icon'>{t('header.exit')}</span>
						</button>
					</div>
				</div>

				{/* Dropdown Menu */}
				<div className={`dropdown-menu ${menuOpen ? 'open' : ''}`}>
					<Link to='/' className='dropdown-item' onClick={() => setMenuOpen(false)}>
						<Home size={20} />
						<span>{t('header.home')}</span>
					</Link>
					<Link to='/admin' className='dropdown-item' onClick={() => setMenuOpen(false)}>
						<UserCog size={20} />
						<span>{t('header.admin')}</span>
					</Link>
				</div>
			</header>
		</>
	)
}

export default Header