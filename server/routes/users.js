// routes/userRoutes.js
const express = require('express')
const router = express.Router()
const userController = require('../controllers/userController')

router.post('/register', userController.register)
router.get('/', userController.getAllUsers)
router.get('/available-rooms', userController.getAvailableRooms) // YANGI
router.get('/verify', userController.verifyUser)

module.exports = router