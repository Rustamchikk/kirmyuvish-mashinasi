// components/Header.js
import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Home, UserCog, Globe, Menu, X, LogOut } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import './Header.css'

const Header = () => {
  const { t, i18n } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false)
  const languageDropdownRef = useRef(null)
  const { logout, adminLogout, isAuthenticated, userRoom, isAdmin } = useAuth()
  const navigate = useNavigate()

  // Click outside to close language dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target)) {
        setLanguageDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng)
    setLanguageDropdownOpen(false)
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

  // Tillar ma'lumotlari obyekti
  const languages = [
    {
      code: 'uz',
      name: 'Oʻzbekcha',
      flag: '🇺🇿'
    },
    {
      code: 'en', 
      name: 'English',
      flag: '🇬🇧'
    },
    {
      code: 'ru',
      name: 'Русский',
      flag: '🇷🇺'
    }
  ]

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0]

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
            {/* Language Switcher */}
            <div className="language-wrapper" ref={languageDropdownRef}>
              {/* Global Icon Button - Faqat globus rasmi ko'rinadi */}
              <button 
                className="global-icon-btn"
                onClick={() => setLanguageDropdownOpen(!languageDropdownOpen)}
                aria-label={t('header.changeLanguage')}
              >
                <Globe size={20} />
              </button>
              
              {/* Language Dropdown - Faqat globus bosilganda ko'rinadi */}
              <div className={`language-dropdown-container ${languageDropdownOpen ? 'open' : ''}`}>
                <div className="language-dropdown-content">
                  <div className="language-options">
                    {languages.map(lang => (
                      <button
                        key={lang.code}
                        className={`language-option ${i18n.language === lang.code ? 'active' : ''}`}
                        onClick={() => changeLanguage(lang.code)}
                      >
                        <span className="language-flag">{lang.flag}</span>
                        <span className="language-name">{lang.name}</span>
                        {i18n.language === lang.code && (
                          <span className="selected-indicator">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Exit Button */}
            <button className='exit-btn' onClick={handleExit}>
              <LogOut size={18} />
              <span className='exit-text'></span>
              <span className='exit-icon'></span>
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