const express = require('express');
const Joi = require('joi');
const { Op } = require('sequelize');
const { Equipment, Team, User, MaintenanceRequest } = require('../models');
const { authenticateToken, authorize } = require('../middleware/auth');

const router = express.Router();

// Validation schema
const equipmentSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  serial_number: Joi.string().min(1).max(100).required(),
  category: Joi.string().valid('machinery', 'vehicle', 'computer', 'tool', 'facility', 'other').required(),
  department: Joi.string().min(2).max(100).required(),
  assigned_employee: Joi.string().max(100).optional(),
  location: Joi.string().min(2).max(200).required(),
  purchase_date: Joi.date().optional(),
  warranty_expiry: Joi.date().optional(),
  manufacturer: Joi.string().max(100).optional(),
  model: Joi.string().max(100).optional(),
  specifications: Joi.object().optional(),
  maintenance_team_id: Joi.number().integer().positive().required(),
  assigned_technician_id: Joi.number().integer().positive().optional(),
  condition: Joi.string().valid('excellent', 'good', 'fair', 'poor', 'critical').optional(),
  purchase_cost: Joi.number().positive().optional(),
  image_url: Joi.string().uri().optional(),
  notes: Joi.string().optional()
});

// Get all equipment with filtering and pagination
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      department,
      status,
      team_id,
      condition
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    // Build search conditions
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { serial_number: { [Op.like]: `%${search}%` } },
        { assigned_employee: { [Op.like]: `%${search}%` } }
      ];
    }

    if (category) where.category = category;
    if (department) where.department = department;
    if (status) where.status = status;
    if (team_id) where.maintenance_team_id = team_id;
    if (condition) where.condition = condition;

    const { count, rows } = await Equipment.findAndCountAll({
      where,
      include: [
        { 
          model: Team, 
          as: 'maintenanceTeam',
          attributes: ['id', 'name', 'specialization', 'color']
        },
        { 
          model: User, 
          as: 'assignedTechnician',
          attributes: ['id', 'first_name', 'last_name', 'email', 'avatar_url']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.json({
      equipment: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Equipment fetch error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch equipment', 
      error: error.message 
    });
  }
});

// Get equipment by ID with maintenance requests count (Smart Button)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const equipment = await Equipment.findByPk(req.params.id, {
      include: [
        { 
          model: Team, 
          as: 'maintenanceTeam',
          attributes: ['id', 'name', 'specialization', 'color']
        },
        { 
          model: User, 
          as: 'assignedTechnician',
          attributes: ['id', 'first_name', 'last_name', 'email', 'avatar_url']
        }
      ]
    });

    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }

    // Get maintenance requests count for smart button
    const maintenanceRequestsCount = await MaintenanceRequest.count({
      where: { 
        equipment_id: equipment.id,
        status: { [Op.in]: ['new', 'in_progress'] }
      }
    });

    res.json({
      equipment,
      maintenanceRequestsCount
    });
  } catch (error) {
    console.error('Equipment fetch error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch equipment', 
      error: error.message 
    });
  }
});

// Get maintenance requests for specific equipment (Smart Button functionality)
router.get('/:id/maintenance-requests', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;
    
    const where = { equipment_id: req.params.id };
    if (status) where.status = status;

    const { count, rows } = await MaintenanceRequest.findAndCountAll({
      where,
      include: [
        { 
          model: User, 
          as: 'assignedTechnician',
          attributes: ['id', 'first_name', 'last_name', 'email', 'avatar_url']
        },
        { 
          model: User, 
          as: 'creator',
          attributes: ['id', 'first_name', 'last_name', 'email']
        },
        { 
          model: Team, 
          as: 'team',
          attributes: ['id', 'name', 'color']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
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
    console.error('Equipment maintenance requests fetch error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch maintenance requests', 
      error: error.message 
    });
  }
});

// Create equipment
router.post('/', authenticateToken, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { error, value } = equipmentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        message: 'Validation error', 
        details: error.details[0].message 
      });
    }

    // Check if serial number already exists
    const existingEquipment = await Equipment.findOne({
      where: { serial_number: value.serial_number }
    });

    if (existingEquipment) {
      return res.status(409).json({ 
        message: 'Equipment with this serial number already exists' 
      });
    }

    // Validate team exists
    const team = await Team.findByPk(value.maintenance_team_id);
    if (!team) {
      return res.status(400).json({ message: 'Invalid maintenance team ID' });
    }

    // Validate technician exists and belongs to the team
    if (value.assigned_technician_id) {
      const technician = await User.findByPk(value.assigned_technician_id);
      if (!technician || technician.team_id !== value.maintenance_team_id) {
        return res.status(400).json({ 
          message: 'Invalid technician ID or technician does not belong to the specified team' 
        });
      }
    }

    const equipment = await Equipment.create({
      ...value,
      created_by: req.user.id
    });

    const createdEquipment = await Equipment.findByPk(equipment.id, {
      include: [
        { 
          model: Team, 
          as: 'maintenanceTeam',
          attributes: ['id', 'name', 'specialization', 'color']
        },
        { 
          model: User, 
          as: 'assignedTechnician',
          attributes: ['id', 'first_name', 'last_name', 'email', 'avatar_url']
        }
      ]
    });

    // Emit real-time update
    req.io.emit('equipment:created', createdEquipment);

    res.status(201).json({
      message: 'Equipment created successfully',
      equipment: createdEquipment
    });
  } catch (error) {
    console.error('Equipment creation error:', error);
    res.status(500).json({ 
      message: 'Failed to create equipment', 
      error: error.message 
    });
  }
});

// Update equipment
router.put('/:id', authenticateToken, authorize('admin', 'manager'), async (req, res) => {
  try {
    const equipment = await Equipment.findByPk(req.params.id);
    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }

    const updateSchema = equipmentSchema.fork(['name', 'serial_number', 'category', 'department', 'location', 'maintenance_team_id'], (schema) => schema.optional());
    
    const { error, value } = updateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        message: 'Validation error', 
        details: error.details[0].message 
      });
    }

    // Check serial number uniqueness if changed
    if (value.serial_number && value.serial_number !== equipment.serial_number) {
      const existingEquipment = await Equipment.findOne({
        where: { 
          serial_number: value.serial_number,
          id: { [Op.ne]: equipment.id }
        }
      });

      if (existingEquipment) {
        return res.status(409).json({ 
          message: 'Equipment with this serial number already exists' 
        });
      }
    }

    // Validate team exists if changed
    if (value.maintenance_team_id) {
      const team = await Team.findByPk(value.maintenance_team_id);
      if (!team) {
        return res.status(400).json({ message: 'Invalid maintenance team ID' });
      }
    }

    // Validate technician if changed
    if (value.assigned_technician_id) {
      const technician = await User.findByPk(value.assigned_technician_id);
      const teamId = value.maintenance_team_id || equipment.maintenance_team_id;
      
      if (!technician || technician.team_id !== teamId) {
        return res.status(400).json({ 
          message: 'Invalid technician ID or technician does not belong to the specified team' 
        });
      }
    }

    await equipment.update(value);

    const updatedEquipment = await Equipment.findByPk(equipment.id, {
      include: [
        { 
          model: Team, 
          as: 'maintenanceTeam',
          attributes: ['id', 'name', 'specialization', 'color']
        },
        { 
          model: User, 
          as: 'assignedTechnician',
          attributes: ['id', 'first_name', 'last_name', 'email', 'avatar_url']
        }
      ]
    });

    // Emit real-time update
    req.io.emit('equipment:updated', updatedEquipment);

    res.json({
      message: 'Equipment updated successfully',
      equipment: updatedEquipment
    });
  } catch (error) {
    console.error('Equipment update error:', error);
    res.status(500).json({ 
      message: 'Failed to update equipment', 
      error: error.message 
    });
  }
});

// Delete equipment
router.delete('/:id', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const equipment = await Equipment.findByPk(req.params.id);
    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }

    // Check if equipment has active maintenance requests
    const activeRequests = await MaintenanceRequest.count({
      where: { 
        equipment_id: equipment.id,
        status: { [Op.in]: ['new', 'in_progress'] }
      }
    });

    if (activeRequests > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete equipment with active maintenance requests' 
      });
    }

    await equipment.destroy();

    // Emit real-time update
    req.io.emit('equipment:deleted', { id: equipment.id });

    res.json({ message: 'Equipment deleted successfully' });
  } catch (error) {
    console.error('Equipment deletion error:', error);
    res.status(500).json({ 
      message: 'Failed to delete equipment', 
      error: error.message 
    });
  }
});

// Get equipment categories and departments for filters
router.get('/meta/filters', authenticateToken, async (req, res) => {
  try {
    const categories = await Equipment.findAll({
      attributes: ['category'],
      group: ['category'],
      raw: true
    });

    const departments = await Equipment.findAll({
      attributes: ['department'],
      group: ['department'],
      raw: true
    });

    const conditions = await Equipment.findAll({
      attributes: ['condition'],
      group: ['condition'],
      raw: true
    });

    res.json({
      categories: categories.map(c => c.category),
      departments: departments.map(d => d.department),
      conditions: conditions.map(c => c.condition)
    });
  } catch (error) {
    console.error('Equipment filters fetch error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch equipment filters', 
      error: error.message 
    });
  }
});

module.exports = router;