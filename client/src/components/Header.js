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
  const menuDropdownRef = useRef(null)
  
  const { logout, adminLogout, isAuthenticated, userRoom, isAdmin } = useAuth()
  const navigate = useNavigate()

  // Language dropdown uchun click outside
  useEffect(() => {
    const handleLanguageClickOutside = (event) => {
      if (languageDropdownOpen && 
          languageDropdownRef.current && 
          !languageDropdownRef.current.contains(event.target)) {
        setLanguageDropdownOpen(false);
      }
    };

    if (languageDropdownOpen) {
      document.addEventListener('mousedown', handleLanguageClickOutside);
    } else {
      document.removeEventListener('mousedown', handleLanguageClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleLanguageClickOutside);
    };
  }, [languageDropdownOpen]);

  // Menu dropdown uchun click outside
  useEffect(() => {
    const handleMenuClickOutside = (event) => {
      if (menuOpen && 
          menuDropdownRef.current && 
          !menuDropdownRef.current.contains(event.target) &&
          !event.target.closest('.menu-toggle')) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleMenuClickOutside);
    } else {
      document.removeEventListener('mousedown', handleMenuClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleMenuClickOutside);
    };
  }, [menuOpen]);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setLanguageDropdownOpen(false);
  };

  const handleExit = () => {
    if (isAuthenticated) {
      if (isAdmin) {
        adminLogout();
      } else {
        logout();
      }
      navigate('/');
      setMenuOpen(false);
    } else {
      console.log('Exit clicked - not authenticated');
    }
  };

  // Tillar ma'lumotlari obyekti
  const languages = [
    { code: 'uz', name: 'Oʻzbekcha', flag: '🇺🇿' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' }
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  return (
    <>
      <header className='main-header'>
        <div className='header-container'>
          <div className='header-left'>
            <button
              className='menu-toggle'
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={t('header.toggleMenu')}
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <div className='logo'>
              <div className='logo-text'>
                <div className='logo-title'>{t('header.logo')}</div>
              </div>
            </div>
          </div>

          <div className='header-right'>
            <div className="language-wrapper" ref={languageDropdownRef}>
              <button 
    className="global-icon-btn"
    onClick={() => setLanguageDropdownOpen(!languageDropdownOpen)}
    aria-label={t('header.changeLanguage')}
  >
    <div className="language-display">
      <Globe size={16} className="globe-icon" />
      <span className="current-language-flag">{currentLanguage.flag}</span>
    </div>
  </button>
  
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

            <button className='exit-btn-icon-only' onClick={handleExit}>
              <div className="exit-icon-wrapper">
                <LogOut size={20} className="exit-icon" />
                <div className="exit-icon-circle"></div>
              </div>
            </button>
          </div>
        </div>

        {/* Dropdown Menu - ref qo'shildi */}
        <div className={`dropdown-menu ${menuOpen ? 'open' : ''}`} ref={menuDropdownRef}>
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

export default Header;