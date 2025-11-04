// Soddalik uchun JWT o'rniga basic auth middleware
exports.requireAdmin = (req, res, next) => {
	const authHeader = req.headers.authorization

	if (!authHeader || !authHeader.startsWith('Basic ')) {
		return res.status(401).json({
			success: false,
			message: 'Admin huquqi talab qilinadi',
		})
	}

	const credentials = Buffer.from(authHeader.slice(6), 'base64').toString()
	const [username, password] = credentials.split(':')

	// Soddalik uchun hardcoded admin ma'lumotlari
	if (username === 'admin' && password === 'admin123') {
		next()
	} else {
		res.status(401).json({
			success: false,
			message: "Noto'g'ri login yoki parol",
		})
	}
}
