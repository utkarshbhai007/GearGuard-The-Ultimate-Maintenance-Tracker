const express = require('express');
const Joi = require('joi');
const { Op } = require('sequelize');
const { User, Team } = require('../models');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Middleware to ensure only admins can access these routes
router.use(authenticateToken);
router.use(requireRole(['admin']));

// Get all users with pagination and filtering
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 10, role, team_id, search, status } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    
    if (role) whereClause.role = role;
    if (team_id) whereClause.team_id = team_id;
    if (status) whereClause.is_active = status === 'active';
    
    if (search) {
      whereClause[Op.or] = [
        { first_name: { [Op.like]: `%${search}%` } },
        { last_name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { username: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      include: [{ model: Team, as: 'team' }],
      attributes: { exclude: ['password'] },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.json({
      users,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch users', 
      error: error.message 
    });
  }
});

// Get user by ID
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      include: [{ model: Team, as: 'team' }],
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch user', 
      error: error.message 
    });
  }
});

// Create new user
router.post('/users', async (req, res) => {
  try {
    const createUserSchema = Joi.object({
      username: Joi.string().min(3).max(50).required(),
      email: Joi.string().email().required(),
      password: Joi.string().min(6).required(),
      first_name: Joi.string().min(1).max(50).required(),
      last_name: Joi.string().min(1).max(50).required(),
      role: Joi.string().valid('admin', 'manager', 'technician', 'user').required(),
      team_id: Joi.number().integer().positive().optional(),
      phone: Joi.string().max(20).optional(),
      is_active: Joi.boolean().default(true)
    });

    const { error, value } = createUserSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        message: 'Validation error', 
        details: error.details[0].message 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { email: value.email },
          { username: value.username }
        ]
      }
    });

    if (existingUser) {
      return res.status(409).json({ 
        message: 'User with this email or username already exists' 
      });
    }

    // Validate team exists if provided
    if (value.team_id) {
      const team = await Team.findByPk(value.team_id);
      if (!team) {
        return res.status(400).json({ message: 'Invalid team ID' });
      }
    }

    const user = await User.create(value);
    
    const userData = await User.findByPk(user.id, {
      include: [{ model: Team, as: 'team' }],
      attributes: { exclude: ['password'] }
    });

    // Emit real-time update
    req.io.emit('user-created', userData);

    res.status(201).json({
      message: 'User created successfully',
      user: userData
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ 
      message: 'Failed to create user', 
      error: error.message 
    });
  }
});

// Update user
router.put('/users/:id', async (req, res) => {
  try {
    const updateUserSchema = Joi.object({
      username: Joi.string().min(3).max(50).optional(),
      email: Joi.string().email().optional(),
      first_name: Joi.string().min(1).max(50).optional(),
      last_name: Joi.string().min(1).max(50).optional(),
      role: Joi.string().valid('admin', 'manager', 'technician', 'user').optional(),
      team_id: Joi.number().integer().positive().allow(null).optional(),
      phone: Joi.string().max(20).allow('').optional(),
      is_active: Joi.boolean().optional()
    });

    const { error, value } = updateUserSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        message: 'Validation error', 
        details: error.details[0].message 
      });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email/username already exists (excluding current user)
    if (value.email || value.username) {
      const whereClause = {
        id: { [Op.ne]: req.params.id }
      };
      
      if (value.email && value.username) {
        whereClause[Op.or] = [
          { email: value.email },
          { username: value.username }
        ];
      } else if (value.email) {
        whereClause.email = value.email;
      } else if (value.username) {
        whereClause.username = value.username;
      }

      const existingUser = await User.findOne({ where: whereClause });
      if (existingUser) {
        return res.status(409).json({ 
          message: 'User with this email or username already exists' 
        });
      }
    }

    // Validate team exists if provided
    if (value.team_id) {
      const team = await Team.findByPk(value.team_id);
      if (!team) {
        return res.status(400).json({ message: 'Invalid team ID' });
      }
    }

    await user.update(value);
    
    const updatedUser = await User.findByPk(user.id, {
      include: [{ model: Team, as: 'team' }],
      attributes: { exclude: ['password'] }
    });

    // Emit real-time update
    req.io.emit('user-updated', updatedUser);

    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ 
      message: 'Failed to update user', 
      error: error.message 
    });
  }
});

// Delete user (soft delete by deactivating)
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from deleting themselves
    if (user.id === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    await user.update({ is_active: false });

    // Emit real-time update
    req.io.emit('user-deleted', { id: user.id });

    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ 
      message: 'Failed to delete user', 
      error: error.message 
    });
  }
});

// Reset user password
router.post('/users/:id/reset-password', async (req, res) => {
  try {
    const resetPasswordSchema = Joi.object({
      new_password: Joi.string().min(6).required()
    });

    const { error, value } = resetPasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        message: 'Validation error', 
        details: error.details[0].message 
      });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.update({ password: value.new_password });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ 
      message: 'Failed to reset password', 
      error: error.message 
    });
  }
});

// Get system statistics
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { is_active: true } });
    const usersByRole = await User.findAll({
      attributes: [
        'role',
        [User.sequelize.fn('COUNT', User.sequelize.col('id')), 'count']
      ],
      group: ['role'],
      raw: true
    });

    const recentUsers = await User.findAll({
      limit: 5,
      order: [['created_at', 'DESC']],
      include: [{ model: Team, as: 'team' }],
      attributes: { exclude: ['password'] }
    });

    res.json({
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      usersByRole,
      recentUsers
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch statistics', 
      error: error.message 
    });
  }
});

// System settings endpoints
router.get('/settings', async (req, res) => {
  try {
    // For now, return basic system info
    // In a real app, you'd have a settings table
    const settings = {
      system_name: 'GearGuard Maintenance System',
      version: '1.0.0',
      maintenance_mode: false,
      registration_enabled: true,
      max_file_size: '10MB',
      session_timeout: '7d',
      backup_frequency: 'daily',
      notification_settings: {
        email_notifications: true,
        push_notifications: true,
        maintenance_reminders: true
      }
    };

    res.json({ settings });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch settings', 
      error: error.message 
    });
  }
});

router.put('/settings', async (req, res) => {
  try {
    const settingsSchema = Joi.object({
      system_name: Joi.string().max(100).optional(),
      maintenance_mode: Joi.boolean().optional(),
      registration_enabled: Joi.boolean().optional(),
      max_file_size: Joi.string().optional(),
      session_timeout: Joi.string().optional(),
      backup_frequency: Joi.string().valid('hourly', 'daily', 'weekly').optional(),
      notification_settings: Joi.object({
        email_notifications: Joi.boolean().optional(),
        push_notifications: Joi.boolean().optional(),
        maintenance_reminders: Joi.boolean().optional()
      }).optional()
    });

    const { error, value } = settingsSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        message: 'Validation error', 
        details: error.details[0].message 
      });
    }

    // In a real app, you'd save these to a settings table
    // For now, just return success
    res.json({ 
      message: 'Settings updated successfully',
      settings: value
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ 
      message: 'Failed to update settings', 
      error: error.message 
    });
  }
});

module.exports = router;