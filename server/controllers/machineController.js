const Machine = require('../models/Machine')

exports.getAllMachines = async (req, res) => {
    try {
        const machines = await Machine.getAll()
        res.json({
            success: true,
            data: machines,
        })
    } catch (error) {
        console.error('Get machines error:', error)
        res.status(500).json({
            success: false,
            message: 'errors.server_error',
        })
    }
}

exports.updateMachine = async (req, res) => {
    try {
        const { id } = req.params
        const { is_active } = req.body

        const machine = await Machine.updateStatus(id, is_active)
        if (!machine) {
            return res.status(404).json({
                success: false,
                message: 'errors.machine_not_found',
            })
        }

        res.json({
            success: true,
            message: 'success.machine_updated',
            data: machine,
        })
    } catch (error) {
        console.error('Update machine error:', error)
        res.status(500).json({
            success: false,
            message: 'errors.server_error',
        })
    }
}

exports.createMachine = async (req, res) => {
    try {
        const { name } = req.body

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'errors.machine_name_required',
            })
        }

        const machine = await Machine.create(name)
        res.status(201).json({
            success: true,
            message: "success.machine_created",
            data: machine,
        })
    } catch (error) {
        console.error('Create machine error:', error)
        res.status(500).json({
            success: false,
            message: 'errors.server_error',
        })
    }
}

exports.deleteMachine = async (req, res) => {
    try {
        const { id } = req.params

        const machine = await Machine.delete(id)
        if (!machine) {
            return res.status(404).json({
                success: false,
                message: 'errors.machine_not_found',
            })
        }

        res.json({
            success: true,
            message: "success.machine_deleted",
            data: machine,
        })
    } catch (error) {
        console.error('Delete machine error:', error)
        res.status(500).json({
            success: false,
            message: 'errors.server_error',
        })
    }
}
