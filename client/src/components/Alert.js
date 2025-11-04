const Alert = ({ type, message, onClose }) => {
	if (!message) return null

	return (
		<div className={`alert alert-${type}`}>
			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
				}}
			>
				<span>{message}</span>
				{onClose && (
					<button
						onClick={onClose}
						style={{
							background: 'none',
							border: 'none',
							fontSize: '1.2rem',
							cursor: 'pointer',
							color: 'inherit',
						}}
					>
						×
					</button>
				)}
			</div>
		</div>
	)
}

export default Alert
