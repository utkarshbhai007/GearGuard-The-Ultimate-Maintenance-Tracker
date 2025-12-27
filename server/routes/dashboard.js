const express = require('express');
const { Op, fn, col, literal } = require('sequelize');
const { MaintenanceRequest, Equipment, Team, User } = require('../models');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get dashboard overview statistics
router.get('/overview', authenticateToken, async (req, res) => {
  try {
    const { team_id, date_range = '30' } = req.query;
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - parseInt(date_range));

    let whereClause = {};
    
    // Role-based filtering
    if (req.user.role === 'technician' && req.user.team_id) {
      whereClause.team_id = req.user.team_id;
    } else if (team_id) {
      whereClause.team_id = team_id;
    }

    // Total equipment count
    const totalEquipment = await Equipment.count({
      where: req.user.role === 'technician' && req.user.team_id 
        ? { maintenance_team_id: req.user.team_id }
        : team_id ? { maintenance_team_id: team_id } : {}
    });

    // Equipment by status
    const equipmentByStatus = await Equipment.findAll({
      attributes: [
        'status',
        [fn('COUNT', col('id')), 'count']
      ],
      where: req.user.role === 'technician' && req.user.team_id 
        ? { maintenance_team_id: req.user.team_id }
        : team_id ? { maintenance_team_id: team_id } : {},
      group: ['status'],
      raw: true
    });

    // Requests statistics
    const totalRequests = await MaintenanceRequest.count({ where: whereClause });
    
    const requestsByStatus = await MaintenanceRequest.findAll({
      attributes: [
        'status',
        [fn('COUNT', col('id')), 'count']
      ],
      where: whereClause,
      group: ['status'],
      raw: true
    });

    const requestsByPriority = await MaintenanceRequest.findAll({
      attributes: [
        'priority',
        [fn('COUNT', col('id')), 'count']
      ],
      where: whereClause,
      group: ['priority'],
      raw: true
    });

    // Overdue requests
    const overdueRequests = await MaintenanceRequest.count({
      where: {
        ...whereClause,
        scheduled_date: { [Op.lt]: new Date() },
        status: { [Op.in]: ['new', 'in_progress'] }
      }
    });

    // Recent activity (last 7 days)
    const recentActivity = await MaintenanceRequest.findAll({
      where: {
        ...whereClause,
        created_at: { [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      },
      include: [
        { 
          model: Equipment, 
          as: 'equipment',
          attributes: ['name', 'serial_number']
        },
        { 
          model: User, 
          as: 'creator',
          attributes: ['first_name', 'last_name']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: 10
    });

    // Average resolution time (in hours)
    const avgResolutionTime = await MaintenanceRequest.findOne({
      attributes: [
        [fn('AVG', literal('TIMESTAMPDIFF(HOUR, started_at, completed_at)')), 'avg_hours']
      ],
      where: {
        ...whereClause,
        status: 'repaired',
        started_at: { [Op.not]: null },
        completed_at: { [Op.not]: null }
      },
      raw: true
    });

    // Monthly trends (last 6 months)
    const monthlyTrends = await MaintenanceRequest.findAll({
      attributes: [
        [fn('DATE_FORMAT', col('created_at'), '%Y-%m'), 'month'],
        [fn('COUNT', col('id')), 'count']
      ],
      where: {
        ...whereClause,
        created_at: { [Op.gte]: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) }
      },
      group: [fn('DATE_FORMAT', col('created_at'), '%Y-%m')],
      order: [[fn('DATE_FORMAT', col('created_at'), '%Y-%m'), 'ASC']],
      raw: true
    });

    res.json({
      overview: {
        totalEquipment,
        totalRequests,
        overdueRequests,
        avgResolutionTime: avgResolutionTime?.avg_hours || 0
      },
      equipmentByStatus: equipmentByStatus.reduce((acc, item) => {
        acc[item.status] = parseInt(item.count);
        return acc;
      }, {}),
      requestsByStatus: requestsByStatus.reduce((acc, item) => {
        acc[item.status] = parseInt(item.count);
        return acc;
      }, {}),
      requestsByPriority: requestsByPriority.reduce((acc, item) => {
        acc[item.priority] = parseInt(item.count);
        return acc;
      }, {}),
      recentActivity,
      monthlyTrends
    });
  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch dashboard overview', 
      error: error.message 
    });
  }
});

// Get team performance report
router.get('/team-performance', authenticateToken, async (req, res) => {
  try {
    const { date_range = '30' } = req.query;
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - parseInt(date_range));

    // Get all teams first
    const teams = await Team.findAll({
      attributes: ['id', 'name', 'specialization', 'color'],
      include: [
        {
          model: User,
          as: 'members',
          attributes: ['id'],
          where: { is_active: true },
          required: false
        }
      ]
    });

    // Calculate performance metrics for each team
    const performanceData = await Promise.all(
      teams.map(async (team) => {
        const totalRequests = await MaintenanceRequest.count({
          where: { 
            team_id: team.id,
            created_at: { [Op.gte]: dateFrom }
          }
        });

        const completedRequests = await MaintenanceRequest.count({
          where: { 
            team_id: team.id,
            status: 'repaired',
            created_at: { [Op.gte]: dateFrom }
          }
        });

        const avgResolutionTime = await MaintenanceRequest.findOne({
          attributes: [
            [fn('AVG', literal('TIMESTAMPDIFF(HOUR, started_at, completed_at)')), 'avg_hours']
          ],
          where: {
            team_id: team.id,
            status: 'repaired',
            started_at: { [Op.not]: null },
            completed_at: { [Op.not]: null },
            created_at: { [Op.gte]: dateFrom }
          },
          raw: true
        });

        const overdueRequests = await MaintenanceRequest.count({
          where: {
            team_id: team.id,
            scheduled_date: { [Op.lt]: new Date() },
            status: { [Op.in]: ['new', 'in_progress'] }
          }
        });

        return {
          id: team.id,
          name: team.name,
          specialization: team.specialization,
          color: team.color,
          memberCount: team.members.length,
          totalRequests,
          completedRequests,
          completionRate: totalRequests > 0 ? (completedRequests / totalRequests * 100).toFixed(1) : '0',
          avgResolutionTime: parseFloat(avgResolutionTime?.avg_hours || 0).toFixed(1),
          overdueRequests
        };
      })
    );

    res.json({ teamPerformance: performanceData });
  } catch (error) {
    console.error('Team performance error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch team performance', 
      error: error.message 
    });
  }
});

// Get equipment utilization report
router.get('/equipment-utilization', authenticateToken, async (req, res) => {
  try {
    const { date_range = '30', category } = req.query;
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - parseInt(date_range));

    let whereClause = {};
    if (category) whereClause.category = category;

    const equipment = await Equipment.findAll({
      attributes: [
        'id',
        'name',
        'serial_number',
        'category',
        'status',
        'condition'
      ],
      where: whereClause,
      include: [
        {
          model: Team,
          as: 'maintenanceTeam',
          attributes: ['name', 'color']
        }
      ]
    });

    const utilizationData = await Promise.all(
      equipment.map(async (equipmentItem) => {
        const requests = await MaintenanceRequest.findAll({
          where: {
            equipment_id: equipmentItem.id,
            created_at: { [Op.gte]: dateFrom }
          },
          attributes: ['status', 'request_type', 'duration_hours', 'cost']
        });

        const totalRequests = requests.length;
        const correctiveRequests = requests.filter(r => r.request_type === 'corrective').length;
        const preventiveRequests = requests.filter(r => r.request_type === 'preventive').length;
        const totalDowntime = requests.reduce((sum, r) => sum + (parseFloat(r.duration_hours) || 0), 0);
        const totalCost = requests.reduce((sum, r) => sum + (parseFloat(r.cost) || 0), 0);

        return {
          id: equipmentItem.id,
          name: equipmentItem.name,
          serial_number: equipmentItem.serial_number,
          category: equipmentItem.category,
          status: equipmentItem.status,
          condition: equipmentItem.condition,
          maintenanceTeam: equipmentItem.maintenanceTeam,
          totalRequests,
          correctiveRequests,
          preventiveRequests,
          totalDowntime: totalDowntime.toFixed(2),
          totalCost: totalCost.toFixed(2),
          reliability: totalRequests > 0 ? ((totalRequests - correctiveRequests) / totalRequests * 100).toFixed(1) : '100'
        };
      })
    );

    res.json({ equipmentUtilization: utilizationData });
  } catch (error) {
    console.error('Equipment utilization error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch equipment utilization', 
      error: error.message 
    });
  }
});

// Get cost analysis report
router.get('/cost-analysis', authenticateToken, async (req, res) => {
  try {
    const { date_range = '30', team_id, equipment_id } = req.query;
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - parseInt(date_range));

    let whereClause = {
      created_at: { [Op.gte]: dateFrom },
      cost: { [Op.not]: null }
    };

    if (team_id) whereClause.team_id = team_id;
    if (equipment_id) whereClause.equipment_id = equipment_id;

    // Total costs
    const totalCost = await MaintenanceRequest.sum('cost', { where: whereClause });

    // Cost by request type
    const costByType = await MaintenanceRequest.findAll({
      attributes: [
        'request_type',
        [fn('SUM', col('MaintenanceRequest.cost')), 'total_cost'],
        [fn('COUNT', col('MaintenanceRequest.id')), 'count']
      ],
      where: whereClause,
      group: ['request_type'],
      raw: true
    });

    // Cost by team
    const costByTeam = await MaintenanceRequest.findAll({
      attributes: [
        [fn('SUM', col('MaintenanceRequest.cost')), 'total_cost'],
        [fn('COUNT', col('MaintenanceRequest.id')), 'count']
      ],
      include: [
        {
          model: Team,
          as: 'team',
          attributes: ['id', 'name', 'color'],
          required: true
        }
      ],
      where: whereClause,
      group: ['team.id', 'team.name', 'team.color'],
      raw: true
    });

    // Cost by equipment category
    const costByCategory = await MaintenanceRequest.findAll({
      attributes: [
        [fn('SUM', col('MaintenanceRequest.cost')), 'total_cost'],
        [fn('COUNT', col('MaintenanceRequest.id')), 'count']
      ],
      include: [
        {
          model: Equipment,
          as: 'equipment',
          attributes: ['category'],
          required: true
        }
      ],
      where: whereClause,
      group: ['equipment.category'],
      raw: true
    });

    // Monthly cost trends
    const monthlyCosts = await MaintenanceRequest.findAll({
      attributes: [
        [fn('DATE_FORMAT', col('MaintenanceRequest.created_at'), '%Y-%m'), 'month'],
        [fn('SUM', col('MaintenanceRequest.cost')), 'total_cost'],
        [fn('COUNT', col('MaintenanceRequest.id')), 'count']
      ],
      where: whereClause,
      group: [fn('DATE_FORMAT', col('MaintenanceRequest.created_at'), '%Y-%m')],
      order: [[fn('DATE_FORMAT', col('MaintenanceRequest.created_at'), '%Y-%m'), 'ASC']],
      raw: true
    });

    res.json({
      totalCost: totalCost || 0,
      costByType: costByType.reduce((acc, item) => {
        acc[item.request_type] = {
          cost: parseFloat(item.total_cost) || 0,
          count: parseInt(item.count)
        };
        return acc;
      }, {}),
      costByTeam: costByTeam.map(item => ({
        team: {
          id: item['team.id'],
          name: item['team.name'],
          color: item['team.color']
        },
        cost: parseFloat(item.total_cost) || 0,
        count: parseInt(item.count)
      })),
      costByCategory: costByCategory.map(item => ({
        category: item['equipment.category'],
        cost: parseFloat(item.total_cost) || 0,
        count: parseInt(item.count)
      })),
      monthlyCosts: monthlyCosts.map(item => ({
        month: item.month,
        cost: parseFloat(item.total_cost) || 0,
        count: parseInt(item.count)
      }))
    });
  } catch (error) {
    console.error('Cost analysis error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch cost analysis', 
      error: error.message 
    });
  }
});

// Get upcoming maintenance schedule
router.get('/upcoming-maintenance', authenticateToken, async (req, res) => {
  try {
    const { days = '7', team_id } = req.query;
    const dateTo = new Date();
    dateTo.setDate(dateTo.getDate() + parseInt(days));

    let whereClause = {
      request_type: 'preventive',
      scheduled_date: {
        [Op.between]: [new Date(), dateTo]
      },
      status: { [Op.in]: ['new', 'in_progress'] }
    };

    // Role-based filtering
    if (req.user.role === 'technician' && req.user.team_id) {
      whereClause.team_id = req.user.team_id;
    } else if (team_id) {
      whereClause.team_id = team_id;
    }

    const upcomingMaintenance = await MaintenanceRequest.findAll({
      where: whereClause,
      include: [
        { 
          model: Equipment, 
          as: 'equipment',
          attributes: ['id', 'name', 'serial_number', 'location', 'category']
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

    res.json({ upcomingMaintenance });
  } catch (error) {
    console.error('Upcoming maintenance error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch upcoming maintenance', 
      error: error.message 
    });
  }
});

module.exports = router;