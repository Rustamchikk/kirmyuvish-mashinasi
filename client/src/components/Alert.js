// components/Alert.js
const Alert = ({ type, message, onClose }) => {
  if (!message) return null

  return (
    <div className={`alert alert-${type} alert-fixed`}>
      <div className="alert-content">
        <span className="alert-message">{message}</span>
        {onClose && (
          <button
            onClick={onClose}
            className="alert-close"
          >
            ×
          </button>
        )}
      </div>
    </div>
  )
}

export default Alert