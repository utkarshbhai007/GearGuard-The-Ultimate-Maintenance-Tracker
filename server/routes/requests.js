const express = require('express');
const Joi = require('joi');
const { Op } = require('sequelize');
const { MaintenanceRequest, Equipment, Team, User } = require('../models');
const { authenticateToken, authorize } = require('../middleware/auth');

const router = express.Router();

// Validation schema
const requestSchema = Joi.object({
  subject: Joi.string().min(5).max(200).required(),
  description: Joi.string().optional(),
  equipment_id: Joi.number().integer().positive().required(),
  request_type: Joi.string().valid('corrective', 'preventive').required(),
  priority: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
  scheduled_date: Joi.date().optional(),
  cost: Joi.number().positive().optional(),
  parts_used: Joi.array().optional(),
  resolution_notes: Joi.string().optional()
});

// Get all maintenance requests with filtering and pagination
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      priority,
      request_type,
      team_id,
      assigned_to,
      equipment_id,
      overdue_only
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    // Build search conditions
    if (search) {
      where[Op.or] = [
        { subject: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (request_type) where.request_type = request_type;
    if (team_id) where.team_id = team_id;
    if (assigned_to) where.assigned_to = assigned_to;
    if (equipment_id) where.equipment_id = equipment_id;

    // Filter for overdue requests
    if (overdue_only === 'true') {
      where.scheduled_date = { [Op.lt]: new Date() };
      where.status = { [Op.in]: ['new', 'in_progress'] };
    }

    // Role-based filtering
    if (req.user.role === 'technician' && req.user.team_id) {
      where.team_id = req.user.team_id;
    }

    const { count, rows } = await MaintenanceRequest.findAndCountAll({
      where,
      include: [
        { 
          model: Equipment, 
          as: 'equipment',
          attributes: ['id', 'name', 'serial_number', 'category', 'location']
        },
        { 
          model: Team, 
          as: 'team',
          attributes: ['id', 'name', 'specialization', 'color']
        },
        { 
          model: User, 
          as: 'assignedTechnician',
          attributes: ['id', 'first_name', 'last_name', 'email', 'avatar_url'],
          required: false
        },
        { 
          model: User, 
          as: 'creator',
          attributes: ['id', 'first_name', 'last_name', 'email']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [
        ['priority', 'DESC'],
        ['created_at', 'DESC']
      ]
    });

    res.json({
      requests: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Requests fetch error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch maintenance requests', 
      error: error.message 
    });
  }
});

// Get requests for Kanban board
router.get('/kanban', authenticateToken, async (req, res) => {
  try {
    const { team_id } = req.query;
    const where = {};

    // Role-based filtering
    if (req.user.role === 'technician' && req.user.team_id) {
      where.team_id = req.user.team_id;
    } else if (team_id) {
      where.team_id = team_id;
    }

    const requests = await MaintenanceRequest.findAll({
      where,
      include: [
        { 
          model: Equipment, 
          as: 'equipment',
          attributes: ['id', 'name', 'serial_number', 'category', 'location']
        },
        { 
          model: Team, 
          as: 'team',
          attributes: ['id', 'name', 'color']
        },
        { 
          model: User, 
          as: 'assignedTechnician',
          attributes: ['id', 'first_name', 'last_name', 'avatar_url'],
          required: false
        }
      ],
      order: [
        ['priority', 'DESC'],
        ['created_at', 'ASC']
      ]
    });

    // Group by status for Kanban board
    const kanbanData = {
      new: [],
      in_progress: [],
      repaired: [],
      scrap: []
    };

    requests.forEach(request => {
      kanbanData[request.status].push(request);
    });

    res.json({ kanban: kanbanData });
  } catch (error) {
    console.error('Kanban fetch error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch kanban data', 
      error: error.message 
    });
  }
});

// Get requests for calendar view
router.get('/calendar', authenticateToken, async (req, res) => {
  try {
    const { start_date, end_date, team_id } = req.query;
    const where = {
      request_type: 'preventive',
      scheduled_date: {
        [Op.between]: [start_date, end_date]
      }
    };

    // Role-based filtering
    if (req.user.role === 'technician' && req.user.team_id) {
      where.team_id = req.user.team_id;
    } else if (team_id) {
      where.team_id = team_id;
    }

    const requests = await MaintenanceRequest.findAll({
      where,
      include: [
        { 
          model: Equipment, 
          as: 'equipment',
          attributes: ['id', 'name', 'serial_number', 'location']
        },
        { 
          model: Team, 
          as: 'team',
          attributes: ['id', 'name', 'color']
        },
        { 
          model: User, 
          as: 'assignedTechnician',
          attributes: ['id', 'first_name', 'last_name', 'avatar_url'],
          required: false
        }
      ],
      order: [['scheduled_date', 'ASC']]
    });

    res.json({ events: requests });
  } catch (error) {
    console.error('Calendar fetch error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch calendar events', 
      error: error.message 
    });
  }
});

// Get request by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const request = await MaintenanceRequest.findByPk(req.params.id, {
      include: [
        { 
          model: Equipment, 
          as: 'equipment',
          include: [
            { model: Team, as: 'maintenanceTeam' },
            { model: User, as: 'assignedTechnician' }
          ]
        },
        { 
          model: Team, 
          as: 'team',
          attributes: ['id', 'name', 'specialization', 'color']
        },
        { 
          model: User, 
          as: 'assignedTechnician',
          attributes: ['id', 'first_name', 'last_name', 'email', 'avatar_url'],
          required: false
        },
        { 
          model: User, 
          as: 'creator',
          attributes: ['id', 'first_name', 'last_name', 'email']
        }
      ]
    });

    if (!request) {
      return res.status(404).json({ message: 'Maintenance request not found' });
    }

    // Check access permissions
    if (req.user.role === 'technician' && req.user.team_id !== request.team_id) {
      return res.status(403).json({ message: 'Access denied to this request' });
    }

    res.json({ request });
  } catch (error) {
    console.error('Request fetch error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch maintenance request', 
      error: error.message 
    });
  }
});

// Create maintenance request with auto-fill logic
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { error, value } = requestSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        message: 'Validation error', 
        details: error.details[0].message 
      });
    }

    // Get equipment details for auto-fill logic
    const equipment = await Equipment.findByPk(value.equipment_id, {
      include: [{ model: Team, as: 'maintenanceTeam' }]
    });

    if (!equipment) {
      return res.status(400).json({ message: 'Invalid equipment ID' });
    }

    // Auto-fill team from equipment
    const requestData = {
      ...value,
      team_id: equipment.maintenance_team_id,
      created_by: req.user.id
    };

    // Auto-assign to equipment's default technician if available
    if (equipment.assigned_technician_id && !value.assigned_to) {
      requestData.assigned_to = equipment.assigned_technician_id;
    }

    const request = await MaintenanceRequest.create(requestData);

    const createdRequest = await MaintenanceRequest.findByPk(request.id, {
      include: [
        { 
          model: Equipment, 
          as: 'equipment',
          attributes: ['id', 'name', 'serial_number', 'category', 'location']
        },
        { 
          model: Team, 
          as: 'team',
          attributes: ['id', 'name', 'specialization', 'color']
        },
        { 
          model: User, 
          as: 'assignedTechnician',
          attributes: ['id', 'first_name', 'last_name', 'email', 'avatar_url'],
          required: false
        },
        { 
          model: User, 
          as: 'creator',
          attributes: ['id', 'first_name', 'last_name', 'email']
        }
      ]
    });

    // Update equipment status if corrective maintenance
    if (value.request_type === 'corrective') {
      await equipment.update({ status: 'maintenance' });
    }

    // Emit real-time updates
    req.io.emit('request:created', createdRequest);
    req.io.to(`team:${equipment.maintenance_team_id}`).emit('request:assigned', createdRequest);

    res.status(201).json({
      message: 'Maintenance request created successfully',
      request: createdRequest
    });
  } catch (error) {
    console.error('Request creation error:', error);
    res.status(500).json({ 
      message: 'Failed to create maintenance request', 
      error: error.message 
    });
  }
});

// Update request status (for Kanban drag & drop)
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['new', 'in_progress', 'repaired', 'scrap'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const request = await MaintenanceRequest.findByPk(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Maintenance request not found' });
    }

    // Check permissions
    if (req.user.role === 'technician' && req.user.team_id !== request.team_id) {
      return res.status(403).json({ message: 'Access denied to this request' });
    }

    // Auto-assign to current user if moving to in_progress
    const updateData = { status };
    if (status === 'in_progress' && !request.assigned_to) {
      updateData.assigned_to = req.user.id;
    }

    await request.update(updateData);

    const updatedRequest = await MaintenanceRequest.findByPk(request.id, {
      include: [
        { 
          model: Equipment, 
          as: 'equipment',
          attributes: ['id', 'name', 'serial_number', 'category', 'location']
        },
        { 
          model: Team, 
          as: 'team',
          attributes: ['id', 'name', 'color']
        },
        { 
          model: User, 
          as: 'assignedTechnician',
          attributes: ['id', 'first_name', 'last_name', 'avatar_url'],
          required: false
        }
      ]
    });

    // Update equipment status based on request status
    const equipment = await Equipment.findByPk(request.equipment_id);
    if (status === 'repaired') {
      await equipment.update({ status: 'active' });
    } else if (status === 'scrap') {
      await equipment.update({ status: 'scrapped' });
    }

    // Emit real-time update
    req.io.emit('request:status-updated', updatedRequest);

    res.json({
      message: 'Request status updated successfully',
      request: updatedRequest
    });
  } catch (error) {
    console.error('Request status update error:', error);
    res.status(500).json({ 
      message: 'Failed to update request status', 
      error: error.message 
    });
  }
});

// Assign request to technician
router.patch('/:id/assign', authenticateToken, authorize('admin', 'manager', 'technician'), async (req, res) => {
  try {
    const { assigned_to } = req.body;
    
    const request = await MaintenanceRequest.findByPk(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Maintenance request not found' });
    }

    // Check permissions
    if (req.user.role === 'technician' && req.user.team_id !== request.team_id) {
      return res.status(403).json({ message: 'Access denied to this request' });
    }

    // Validate technician belongs to the same team
    if (assigned_to) {
      const technician = await User.findByPk(assigned_to);
      if (!technician || technician.team_id !== request.team_id) {
        return res.status(400).json({ 
          message: 'Technician must belong to the same team as the request' 
        });
      }
    }

    await request.update({ assigned_to });

    const updatedRequest = await MaintenanceRequest.findByPk(request.id, {
      include: [
        { 
          model: Equipment, 
          as: 'equipment',
          attributes: ['id', 'name', 'serial_number', 'category', 'location']
        },
        { 
          model: Team, 
          as: 'team',
          attributes: ['id', 'name', 'color']
        },
        { 
          model: User, 
          as: 'assignedTechnician',
          attributes: ['id', 'first_name', 'last_name', 'avatar_url'],
          required: false
        }
      ]
    });

    // Emit real-time update
    req.io.emit('request:assigned', updatedRequest);

    res.json({
      message: 'Request assigned successfully',
      request: updatedRequest
    });
  } catch (error) {
    console.error('Request assignment error:', error);
    res.status(500).json({ 
      message: 'Failed to assign request', 
      error: error.message 
    });
  }
});

// Update request details
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const request = await MaintenanceRequest.findByPk(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Maintenance request not found' });
    }

    // Check permissions
    if (req.user.role === 'technician' && req.user.team_id !== request.team_id) {
      return res.status(403).json({ message: 'Access denied to this request' });
    }

    const updateSchema = requestSchema.fork(['subject', 'equipment_id', 'request_type'], (schema) => schema.optional());
    
    const { error, value } = updateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        message: 'Validation error', 
        details: error.details[0].message 
      });
    }

    await request.update(value);

    const updatedRequest = await MaintenanceRequest.findByPk(request.id, {
      include: [
        { 
          model: Equipment, 
          as: 'equipment',
          attributes: ['id', 'name', 'serial_number', 'category', 'location']
        },
        { 
          model: Team, 
          as: 'team',
          attributes: ['id', 'name', 'specialization', 'color']
        },
        { 
          model: User, 
          as: 'assignedTechnician',
          attributes: ['id', 'first_name', 'last_name', 'email', 'avatar_url'],
          required: false
        },
        { 
          model: User, 
          as: 'creator',
          attributes: ['id', 'first_name', 'last_name', 'email']
        }
      ]
    });

    // Emit real-time update
    req.io.emit('request:updated', updatedRequest);

    res.json({
      message: 'Request updated successfully',
      request: updatedRequest
    });
  } catch (error) {
    console.error('Request update error:', error);
    res.status(500).json({ 
      message: 'Failed to update request', 
      error: error.message 
    });
  }
});

// Delete request
router.delete('/:id', authenticateToken, authorize('admin', 'manager'), async (req, res) => {
  try {
    const request = await MaintenanceRequest.findByPk(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Maintenance request not found' });
    }

    // Don't allow deletion of in-progress requests
    if (request.status === 'in_progress') {
      return res.status(400).json({ 
        message: 'Cannot delete request that is in progress' 
      });
    }

    await request.destroy();

    // Emit real-time update
    req.io.emit('request:deleted', { id: request.id });

    res.json({ message: 'Request deleted successfully' });
  } catch (error) {
    console.error('Request deletion error:', error);
    res.status(500).json({ 
      message: 'Failed to delete request', 
      error: error.message 
    });
  }
});

module.exports = router;