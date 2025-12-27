const express = require('express');
const Joi = require('joi');
const { Op } = require('sequelize');
const { Team, User, Equipment, MaintenanceRequest } = require('../models');
const { authenticateToken, authorize } = require('../middleware/auth');

const router = express.Router();

// Validation schema
const teamSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().optional(),
  specialization: Joi.string().valid('mechanical', 'electrical', 'it_support', 'general', 'hvac', 'plumbing').required(),
  color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).optional()
});

// Get all teams with member count and statistics
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { search, specialization, is_active } = req.query;
    const where = {};

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    if (specialization) where.specialization = specialization;
    if (is_active !== undefined) where.is_active = is_active === 'true';

    const teams = await Team.findAll({
      where,
      include: [
        {
          model: User,
          as: 'members',
          attributes: ['id', 'first_name', 'last_name', 'email', 'role', 'avatar_url'],
          where: { is_active: true },
          required: false
        }
      ],
      order: [['name', 'ASC']]
    });

    // Get additional statistics for each team
    const teamsWithStats = await Promise.all(
      teams.map(async (team) => {
        const equipmentCount = await Equipment.count({
          where: { maintenance_team_id: team.id }
        });

        const activeRequestsCount = await MaintenanceRequest.count({
          where: { 
            team_id: team.id,
            status: { [Op.in]: ['new', 'in_progress'] }
          }
        });

        const completedRequestsCount = await MaintenanceRequest.count({
          where: { 
            team_id: team.id,
            status: 'repaired'
          }
        });

        return {
          ...team.toJSON(),
          memberCount: team.members.length,
          equipmentCount,
          activeRequestsCount,
          completedRequestsCount
        };
      })
    );

    res.json({ teams: teamsWithStats });
  } catch (error) {
    console.error('Teams fetch error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch teams', 
      error: error.message 
    });
  }
});

// Get team by ID with detailed information
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const team = await Team.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'members',
          attributes: ['id', 'first_name', 'last_name', 'email', 'role', 'avatar_url', 'phone'],
          where: { is_active: true },
          required: false
        }
      ]
    });

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Get team statistics
    const equipmentCount = await Equipment.count({
      where: { maintenance_team_id: team.id }
    });

    const requestsStats = await MaintenanceRequest.findAll({
      where: { team_id: team.id },
      attributes: [
        'status',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    const stats = {
      equipmentCount,
      memberCount: team.members.length,
      requests: requestsStats.reduce((acc, stat) => {
        acc[stat.status] = parseInt(stat.count);
        return acc;
      }, {})
    };

    res.json({
      team,
      stats
    });
  } catch (error) {
    console.error('Team fetch error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch team', 
      error: error.message 
    });
  }
});

// Create team
router.post('/', authenticateToken, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { error, value } = teamSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        message: 'Validation error', 
        details: error.details[0].message 
      });
    }

    // Check if team name already exists
    const existingTeam = await Team.findOne({
      where: { name: value.name }
    });

    if (existingTeam) {
      return res.status(409).json({ 
        message: 'Team with this name already exists' 
      });
    }

    const team = await Team.create({
      ...value,
      created_by: req.user.id
    });

    const createdTeam = await Team.findByPk(team.id, {
      include: [
        {
          model: User,
          as: 'members',
          attributes: ['id', 'first_name', 'last_name', 'email', 'role', 'avatar_url'],
          where: { is_active: true },
          required: false
        }
      ]
    });

    // Emit real-time update
    req.io.emit('team:created', createdTeam);

    res.status(201).json({
      message: 'Team created successfully',
      team: createdTeam
    });
  } catch (error) {
    console.error('Team creation error:', error);
    res.status(500).json({ 
      message: 'Failed to create team', 
      error: error.message 
    });
  }
});

// Update team
router.put('/:id', authenticateToken, authorize('admin', 'manager'), async (req, res) => {
  try {
    const team = await Team.findByPk(req.params.id);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const updateSchema = teamSchema.fork(['name', 'specialization'], (schema) => schema.optional());
    
    const { error, value } = updateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        message: 'Validation error', 
        details: error.details[0].message 
      });
    }

    // Check name uniqueness if changed
    if (value.name && value.name !== team.name) {
      const existingTeam = await Team.findOne({
        where: { 
          name: value.name,
          id: { [Op.ne]: team.id }
        }
      });

      if (existingTeam) {
        return res.status(409).json({ 
          message: 'Team with this name already exists' 
        });
      }
    }

    await team.update(value);

    const updatedTeam = await Team.findByPk(team.id, {
      include: [
        {
          model: User,
          as: 'members',
          attributes: ['id', 'first_name', 'last_name', 'email', 'role', 'avatar_url'],
          where: { is_active: true },
          required: false
        }
      ]
    });

    // Emit real-time update
    req.io.emit('team:updated', updatedTeam);

    res.json({
      message: 'Team updated successfully',
      team: updatedTeam
    });
  } catch (error) {
    console.error('Team update error:', error);
    res.status(500).json({ 
      message: 'Failed to update team', 
      error: error.message 
    });
  }
});

// Add member to team
router.post('/:id/members', authenticateToken, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { user_id } = req.body;
    
    if (!user_id) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const team = await Team.findByPk(req.params.id);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.team_id) {
      return res.status(400).json({ message: 'User is already assigned to a team' });
    }

    await user.update({ team_id: team.id });

    const updatedTeam = await Team.findByPk(team.id, {
      include: [
        {
          model: User,
          as: 'members',
          attributes: ['id', 'first_name', 'last_name', 'email', 'role', 'avatar_url'],
          where: { is_active: true },
          required: false
        }
      ]
    });

    // Emit real-time update
    req.io.emit('team:member-added', { team: updatedTeam, user });

    res.json({
      message: 'Member added to team successfully',
      team: updatedTeam
    });
  } catch (error) {
    console.error('Add team member error:', error);
    res.status(500).json({ 
      message: 'Failed to add member to team', 
      error: error.message 
    });
  }
});

// Remove member from team
router.delete('/:id/members/:userId', authenticateToken, authorize('admin', 'manager'), async (req, res) => {
  try {
    const team = await Team.findByPk(req.params.id);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const user = await User.findByPk(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.team_id !== team.id) {
      return res.status(400).json({ message: 'User is not a member of this team' });
    }

    // Check if user has active assignments
    const activeAssignments = await MaintenanceRequest.count({
      where: { 
        assigned_to: user.id,
        status: { [Op.in]: ['new', 'in_progress'] }
      }
    });

    if (activeAssignments > 0) {
      return res.status(400).json({ 
        message: 'Cannot remove user with active maintenance assignments' 
      });
    }

    await user.update({ team_id: null });

    const updatedTeam = await Team.findByPk(team.id, {
      include: [
        {
          model: User,
          as: 'members',
          attributes: ['id', 'first_name', 'last_name', 'email', 'role', 'avatar_url'],
          where: { is_active: true },
          required: false
        }
      ]
    });

    // Emit real-time update
    req.io.emit('team:member-removed', { team: updatedTeam, userId: user.id });

    res.json({
      message: 'Member removed from team successfully',
      team: updatedTeam
    });
  } catch (error) {
    console.error('Remove team member error:', error);
    res.status(500).json({ 
      message: 'Failed to remove member from team', 
      error: error.message 
    });
  }
});

// Delete team
router.delete('/:id', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const team = await Team.findByPk(req.params.id);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if team has equipment or active requests
    const equipmentCount = await Equipment.count({
      where: { maintenance_team_id: team.id }
    });

    const activeRequests = await MaintenanceRequest.count({
      where: { 
        team_id: team.id,
        status: { [Op.in]: ['new', 'in_progress'] }
      }
    });

    if (equipmentCount > 0 || activeRequests > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete team with assigned equipment or active requests' 
      });
    }

    // Remove team assignment from users
    await User.update(
      { team_id: null },
      { where: { team_id: team.id } }
    );

    await team.destroy();

    // Emit real-time update
    req.io.emit('team:deleted', { id: team.id });

    res.json({ message: 'Team deleted successfully' });
  } catch (error) {
    console.error('Team deletion error:', error);
    res.status(500).json({ 
      message: 'Failed to delete team', 
      error: error.message 
    });
  }
});

// Get available users (not assigned to any team)
router.get('/available-users', authenticateToken, authorize('admin', 'manager'), async (req, res) => {
  try {
    const users = await User.findAll({
      where: { 
        team_id: null,
        is_active: true,
        role: { [Op.in]: ['technician', 'manager'] }
      },
      attributes: ['id', 'first_name', 'last_name', 'email', 'role', 'avatar_url'],
      order: [['first_name', 'ASC']]
    });

    res.json({ users });
  } catch (error) {
    console.error('Available users fetch error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch available users', 
      error: error.message 
    });
  }
});

module.exports = router;