const express = require('express')
const router = express.Router()
const machineController = require('../controllers/machineController')

router.get('/', machineController.getAllMachines)
router.post('/', machineController.createMachine) // YANGI
router.patch('/:id', machineController.updateMachine)
router.delete('/:id', machineController.deleteMachine) // YANGI

module.exports = router
