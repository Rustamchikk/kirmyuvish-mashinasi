// components/Header.js
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Home, UserCog, Globe, Menu, X, LogOut } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

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
							aria-label='Toggle menu'
						>
							{menuOpen ? <X size={24} /> : <Menu size={24} />}
						</button>

						{/* Logo */}
						<div className='logo'>
							<div className='logo-text'>
								<div className='logo-title'>Стиральная Машина</div>
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
											{lang.toUpperCase()}
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
										{lang.toUpperCase()}
									</button>
								))}
							</div>
						</div>

						{/* Exit Button */}
						<button className='exit-btn' onClick={handleExit}>
							<LogOut size={18} />
							<span className='exit-text'>Exit</span>
							<span className='exit-icon'>Exit</span>
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

			{/* STYLE */}
			<style jsx>{`
				/* ==== HEADER ==== */
				.main-header {
					background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
					color: white;
					position: sticky;
					top: 0;
					width: 100%;
					z-index: 1000;
					box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
					border-bottom: 1px solid rgba(255, 255, 255, 0.1);
				}

				.header-container {
					width: 95%;
					max-width: 1200px;
					margin: 0 auto;
					padding: 0.75rem 0;
					display: flex;
					justify-content: space-between;
					align-items: center;
					gap: 1rem;
				}

				/* Chap tomondagi elementlar */
				.header-left {
					display: flex;
					align-items: center;
					gap: 1rem;
					flex: 1;
					min-width: 0;
				}

				/* Menu Toggle */
				.menu-toggle {
					display: flex;
					align-items: center;
					justify-content: center;
					background: rgba(255, 255, 255, 0.1);
					border: 1.5px solid rgba(255, 255, 255, 0.2);
					color: white;
					cursor: pointer;
					padding: 0.5rem;
					border-radius: 8px;
					transition: all 0.3s ease;
					backdrop-filter: blur(10px);
					flex-shrink: 0;
					width: 42px;
					height: 42px;
				}

				.menu-toggle:hover {
					background: rgba(255, 255, 255, 0.2);
					transform: translateY(-1px);
				}

				/* Logo */
				.logo {
					display: flex;
					align-items: center;
					min-width: 0;
				}

				.logo-text {
					display: flex;
					flex-direction: column;
				}

				.logo-title {
					font-size: 1.2rem;
					font-weight: 700;
					letter-spacing: 0.3px;
					white-space: nowrap;
					overflow: hidden;
					text-overflow: ellipsis;
				}

				/* O'ng tomondagi elementlar */
				.header-right {
					display: flex;
					align-items: center;
					gap: 0.75rem;
					flex-shrink: 0;
				}

				/* Language Section */
				.language-section {
					display: flex;
					align-items: center;
				}

				/* Desktop uchun language switcher */
				.language-switcher-desktop {
					display: flex;
					align-items: center;
					gap: 0.25rem;
					background: rgba(255, 255, 255, 0.1);
					padding: 0.25rem;
					border-radius: 8px;
					border: 1px solid rgba(255, 255, 255, 0.2);
					backdrop-filter: blur(10px);
				}

				.lang-btn {
					background: transparent;
					color: #fff;
					border: none;
					border-radius: 6px;
					padding: 0.35rem 0.6rem;
					font-size: 0.75rem;
					cursor: pointer;
					transition: all 0.3s ease;
					font-weight: 500;
					min-width: 32px;
				}

				.lang-btn:hover {
					background: rgba(255, 255, 255, 0.15);
				}

				.lang-btn.active {
					background: rgba(255, 255, 255, 0.25);
					color: #fff;
					font-weight: 600;
				}

				/* Mobile uchun language select */
				.language-switcher-compact {
					display: none;
					align-items: center;
					gap: 0.5rem;
					background: rgba(255, 255, 255, 0.1);
					padding: 0.4rem 0.6rem;
					border-radius: 8px;
					border: 1px solid rgba(255, 255, 255, 0.2);
					backdrop-filter: blur(10px);
				}

				.language-select {
					background: transparent;
					color: white;
					border: none;
					font-size: 0.8rem;
					font-weight: 500;
					cursor: pointer;
					outline: none;
					min-width: 50px;
				}

				.language-select option {
					background: #667eea;
					color: white;
				}

				/* Exit Button */
				.exit-btn {
					display: flex;
					align-items: center;
					gap: 0.5rem;
					color: white;
					background: rgba(239, 68, 68, 0.2);
					border: 1.5px solid rgba(239, 68, 68, 0.4);
					padding: 0.5rem 0.8rem;
					border-radius: 8px;
					font-weight: 500;
					font-size: 0.85rem;
					cursor: pointer;
					transition: all 0.3s ease;
					backdrop-filter: blur(10px);
					flex-shrink: 0;
					height: 42px;
				}

				.exit-btn:hover {
					background: rgba(239, 68, 68, 0.3);
					transform: translateY(-1px);
					box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
				}

				.exit-text {
					display: inline;
				}

				.exit-icon {
					display: none;
				}

				/* Dropdown Menu */
				.dropdown-menu {
					position: absolute;
					top: 100%;
					left: 2.5%;
					right: 2.5%;
					background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
					border: 1px solid rgba(255, 255, 255, 0.2);
					border-radius: 12px;
					padding: 0.5rem;
					box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
					backdrop-filter: blur(20px);
					opacity: 0;
					visibility: hidden;
					transform: translateY(-10px);
					transition: all 0.3s ease;
					z-index: 1001;
				}

				.dropdown-menu.open {
					opacity: 1;
					visibility: visible;
					transform: translateY(0);
				}

				.dropdown-item {
					display: flex;
					align-items: center;
					gap: 0.75rem;
					color: white;
					text-decoration: none;
					padding: 0.75rem 1rem;
					border-radius: 8px;
					font-weight: 500;
					transition: all 0.3s ease;
					border: 1px solid transparent;
				}

				.dropdown-item:hover {
					background: rgba(255, 255, 255, 0.15);
					border-color: rgba(255, 255, 255, 0.3);
					transform: translateX(5px);
				}

				/* ==== RESPONSIVE ==== */
				@media (max-width: 1024px) {
					.header-container {
						width: 96%;
						padding: 0.7rem 0;
					}

					.logo-title {
						font-size: 1.1rem;
					}

					.header-right {
						gap: 0.6rem;
					}
				}

				@media (max-width: 768px) {
					.header-container {
						width: 97%;
						padding: 0.6rem 0;
					}

					.header-left {
						gap: 0.75rem;
					}

					.menu-toggle {
						width: 38px;
						height: 38px;
						padding: 0.4rem;
					}

					.logo-title {
						font-size: 1rem;
					}

					/* Desktop language switcherni yashirish */
					.language-switcher-desktop {
						display: none;
					}

					/* Mobile language selectni ko'rsatish */
					.language-switcher-compact {
						display: flex;
					}

					.exit-btn {
						padding: 0.5rem;
						height: 38px;
					}

					.exit-text {
						display: none;
					}

					.exit-icon {
						display: inline;
						font-size: 0;
					}

					.exit-icon::after {
						content: "E";
						font-size: 0.85rem;
						font-weight: 600;
					}
				}

				@media (max-width: 480px) {
					.header-container {
						padding: 0.5rem 0;
						gap: 0.5rem;
					}

					.header-left {
						gap: 0.5rem;
					}

					.menu-toggle {
						width: 36px;
						height: 36px;
					}

					.logo-title {
						font-size: 0.9rem;
					}

					.header-right {
						gap: 0.5rem;
					}

					.language-switcher-compact {
						padding: 0.3rem 0.5rem;
						gap: 0.3rem;
					}

					.language-select {
						font-size: 0.75rem;
						min-width: 45px;
					}

					.exit-btn {
						height: 36px;
						padding: 0.4rem;
					}

					.dropdown-menu {
						left: 1%;
						right: 1%;
					}

					.dropdown-item {
						padding: 0.6rem 0.8rem;
						font-size: 0.9rem;
					}
				}

				@media (max-width: 360px) {
					.logo-title {
						font-size: 0.85rem;
					}

					.menu-toggle,
					.exit-btn {
						width: 34px;
						height: 34px;
					}

					.language-switcher-compact {
						padding: 0.25rem 0.4rem;
					}

					.language-select {
						min-width: 40px;
						font-size: 0.7rem;
					}
				}

				/* Juda kichik ekranlar uchun */
				@media (max-width: 320px) {
					.logo-title {
						font-size: 0.8rem;
					}

					.header-container {
						width: 98%;
					}
				}

				/* Landscape mode for mobile */
				@media (max-height: 500px) and (orientation: landscape) {
					.header-container {
						padding: 0.4rem 0;
					}

					.dropdown-menu {
						max-height: 150px;
						overflow-y: auto;
					}
				}
			`}</style>
		</>
	)
}

export default Header