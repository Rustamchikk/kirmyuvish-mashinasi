// components/SessionModal.js - YANGILANGAN VERSIYA
import React from 'react';
import { format } from 'date-fns';

const SessionModal = ({ sessions, onClose, onEndSession, onEndAllSessions }) => {
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
            <h3>🖥️ Faol Admin Sessionlari</h3>
            <p className='modal-subtitle'>Barcha faol admin sessionlari va qurilmalar</p>
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
                <span className='stat-label'>Jami Sessionlar</span>
              </div>
              <div className='stat-item'>
                <span className='stat-number'>
                  {new Set(sessions.map(s => s.ip_address)).size}
                </span>
                <span className='stat-label'>Unique IP</span>
              </div>
              <div className='stat-item'>
                <span className='stat-number'>
                  {new Set(sessions.map(s => s.device_info?.device)).size}
                </span>
                <span className='stat-label'>Qurilma Turi</span>
              </div>
            </div>
          )}

          {sessions.length === 0 ? (
            <div className='no-sessions'>
              <div className='no-sessions-icon'>🕒</div>
              <h4>Faol Sessionlar Topilmadi</h4>
              <p>Hozirda hech qanday faol admin sessioni mavjud emas</p>
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
                    <div className='session-status active'>Faol</div>
                  </div>

                  <div className='session-details'>
                    <div className='detail-row'>
                      <span className='detail-label'>🕐 Kirish Vaqti:</span>
                      <span className='detail-value'>
                        {format(new Date(session.login_time), 'dd.MM.yyyy HH:mm')}
                      </span>
                    </div>
                    <div className='detail-row'>
                      <span className='detail-label'>📍 IP Manzil:</span>
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
                        <span>{session.device_info?.device || 'Noma\'lum'}</span>
                        <span>•</span>
                        <span>{session.device_info?.os || 'Noma\'lum'}</span>
                        <span>•</span>
                        <span>{session.device_info?.browser || 'Noma\'lum'}</span>
                      </div>
                    </div>
                  </div>

                  <div className='session-actions'>
                    <button 
                      onClick={() => onEndSession(session.id)}
                      className='btn-end-session'
                      title="Sessionni tugatish"
                    >
                      🚫 Sessionni Tugatish
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
              🚫 Barcha Sessionlarni Tugatish
            </button>
          )}
          <button onClick={onClose} className='btn-close-modal'>
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionModal;