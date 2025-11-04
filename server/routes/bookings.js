const express = require('express')
const router = express.Router()
const bookingController = require('../controllers/bookingController')

router.post('/', bookingController.createBooking)
router.get('/', bookingController.getAllBookings)
router.get('/user/:room_number', bookingController.getUserBookings)
router.delete('/:id', bookingController.deleteBooking)

module.exports = router
