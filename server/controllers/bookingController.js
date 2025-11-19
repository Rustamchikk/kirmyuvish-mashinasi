const Booking = require('../models/Booking')
const User = require('../models/User')
const WeeklyLimit = require('../models/WeeklyLimit')

function getWeekStart(date = new Date()) {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    d.setDate(diff)
    d.setHours(0, 0, 0, 0)
    return d.toISOString().split('T')[0]
}

exports.createBooking = async (req, res) => {
    try {
        const { room_number, machine_ids, booking_date, time_slot } = req.body

        if (!room_number || !machine_ids || !booking_date || !time_slot) {
            return res.status(400).json({
                success: false,
                message: "errors.fill_all_fields",
            })
        }

        const user = await User.findByRoom(room_number)
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "errors.room_not_found",
            })
        }

        const weekStart = getWeekStart(booking_date)
        const weeklyLimit = await WeeklyLimit.getOrCreate(user.id, weekStart)

        if (weeklyLimit.bookings_count + machine_ids.length > 1) {
            return res.status(400).json({
                success: false,
                message: "errors.weekly_limit",
            })
        }

        const validTimeSlots = ['19:00-20:00', '20:00-21:00', '21:00-22:00']
        if (!validTimeSlots.includes(time_slot)) {
            return res.status(400).json({
                success: false,
                message: "errors.invalid_time_slot",
            })
        }

        const bookings = []
        for (const machine_id of machine_ids) {
            try {
                const booking = await Booking.create({
                    user_id: user.id,
                    machine_id,
                    booking_date,
                    time_slot,
                })
                bookings.push(booking)

                await WeeklyLimit.increment(user.id, weekStart)

            } catch (error) {
                for (const booked of bookings) {
                    await Booking.delete(booked.id)
                }
                return res.status(400).json({
                    success: false,
                    message: "errors.machine_busy",
                })
            }
        }

        res.status(201).json({
            success: true,
            message: "success.booking_created",
            data: bookings,
        })

    } catch (error) {
        console.error('Booking creation error:', error)
        res.status(500).json({
            success: false,
            message: "errors.server_error",
        })
    }
}

exports.getUserBookings = async (req, res) => {
    try {
        const { room_number } = req.params
        const user = await User.findByRoom(room_number)
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "errors.user_not_found",
            })
        }
        const bookings = await Booking.getUserBookings(user.id)
        res.json({ success: true, data: bookings })
    } catch (error) {
        res.status(500).json({ success: false, message: "errors.server_error" })
    }
}

exports.getAllBookings = async (req, res) => {
    try {
        const { date } = req.query
        const bookings = await Booking.getAllBookings(date)
        res.json({ success: true, data: bookings })
    } catch (error) {
        res.status(500).json({ success: false, message: "errors.server_error" })
    }
}

exports.deleteBooking = async (req, res) => {
    try {
        const { id } = req.params
        const booking = await Booking.delete(id)
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "errors.booking_not_found",
            })
        }
        res.json({ success: true, message: "success.booking_deleted" })
    } catch (error) {
        res.status(500).json({ success: false, message: "errors.server_error" })
    }
}
