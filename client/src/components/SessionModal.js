// components/SessionModal.js - YANGILANGAN VERSIYA
import React from 'react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

const SessionModal = ({ sessions, onClose, onEndSession, onEndAllSessions }) => {
  const { t } = useTranslation();

  const getDeviceIcon = (deviceType) => {
    switch (deviceType) {
      case 'Mobile': return '📱';
      case 'Tablet': return '📟';
      case 'Desktop': return '💻';
      default: return '🖥️';
    }
  };

  const getBrowserIcon = (browser) => {
    switch (browser) {
      case 'Chrome': return '🌐';
      case 'Firefox': return '🦊';
      case 'Safari': return '🧭';
      case 'Edge': return '🔵';
      default: return '🌍';
    }
  };

  const getOSIcon = (os) => {
    switch (os) {
      case 'Windows': return '🪟';
      case 'MacOS': return '🍎';
      case 'Linux': return '🐧';
      case 'Android': return '🤖';
      case 'iOS': return '📱';
      default: return '💻';
    }
  };

  return (
    <div className='modal-overlay' onClick={onClose}>
      <div className='modal-content' onClick={(e) => e.stopPropagation()}>
        <div className='modal-header'>
          <div className='modal-title'>
            <h3>{t('sessionModal.title')}</h3>
            <p className='modal-subtitle'>{t('sessionModal.subtitle')}</p>
          </div>
          <button onClick={onClose} className='btn-close'>
            ✕
          </button>
        </div>
        
        <div className='modal-body'>
          {/* Statistik panel */}
          {sessions.length > 0 && (
            <div className='session-stats-panel'>
              <div className='stat-item'>
                <span className='stat-number'>{sessions.length}</span>
                <span className='stat-label'>{t('sessionModal.totalSessions')}</span>
              </div>
              <div className='stat-item'>
                <span className='stat-number'>
                  {new Set(sessions.map(s => s.ip_address)).size}
                </span>
                <span className='stat-label'>{t('sessionModal.uniqueIPs')}</span>
              </div>
              <div className='stat-item'>
                <span className='stat-number'>
                  {new Set(sessions.map(s => s.device_info?.device)).size}
                </span>
                <span className='stat-label'>{t('sessionModal.deviceTypes')}</span>
              </div>
            </div>
          )}

          {sessions.length === 0 ? (
            <div className='no-sessions'>
              <div className='no-sessions-icon'>🕒</div>
              <h4>{t('sessionModal.noSessionsTitle')}</h4>
              <p>{t('sessionModal.noSessionsMessage')}</p>
            </div>
          ) : (
            <div className='sessions-grid'>
              {sessions.map((session, index) => (
                <div key={session.id} className='session-card'>
                  <div className='session-header'>
                    <div className='session-user-info'>
                      <div className='user-avatar'>
                        {session.admin_username.charAt(0).toUpperCase()}
                      </div>
                      <div className='user-details'>
                        <div className='username'>{session.admin_username}</div>
                        <div className='session-id'>ID: {session.id}</div>
                      </div>
                    </div>
                    <div className='session-status active'>{t('sessionModal.active')}</div>
                  </div>

                  <div className='session-details'>
                    <div className='detail-row'>
                      <span className='detail-label'>{t('sessionModal.loginTime')}</span>
                      <span className='detail-value'>
                        {format(new Date(session.login_time), 'dd.MM.yyyy HH:mm')}
                      </span>
                    </div>
                    <div className='detail-row'>
                      <span className='detail-label'>{t('sessionModal.ipAddress')}</span>
                      <span className='detail-value ip-address'>{session.ip_address}</span>
                    </div>
                    <div className='device-info'>
                      <div className='device-icons'>
                        <span className='device-icon' title={session.device_info?.device}>
                          {getDeviceIcon(session.device_info?.device)}
                        </span>
                        <span className='device-icon' title={session.device_info?.os}>
                          {getOSIcon(session.device_info?.os)}
                        </span>
                        <span className='device-icon' title={session.device_info?.browser}>
                          {getBrowserIcon(session.device_info?.browser)}
                        </span>
                      </div>
                      <div className='device-details'>
                        <span>{session.device_info?.device || t('sessionModal.unknown')}</span>
                        <span>•</span>
                        <span>{session.device_info?.os || t('sessionModal.unknown')}</span>
                        <span>•</span>
                        <span>{session.device_info?.browser || t('sessionModal.unknown')}</span>
                      </div>
                    </div>
                  </div>

                  <div className='session-actions'>
                    <button 
                      onClick={() => onEndSession(session.id)}
                      className='btn-end-session'
                      title={t('sessionModal.endSessionTooltip')}
                    >
                      🚫 {t('sessionModal.endSession')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className='modal-footer'>
          {sessions.length > 0 && (
            <button 
              onClick={() => onEndAllSessions()}
              className='btn-end-all'
            >
              🚫 {t('sessionModal.endAllSessions')}
            </button>
          )}
          <button onClick={onClose} className='btn-close-modal'>
            {t('sessionModal.close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionModal;