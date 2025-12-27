const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MaintenanceRequest = sequelize.define('MaintenanceRequest', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  subject: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      len: [5, 200],
      notEmpty: true
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  equipment_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'equipment',
      key: 'id'
    }
  },
  team_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'teams',
      key: 'id'
    }
  },
  request_type: {
    type: DataTypes.ENUM('corrective', 'preventive'),
    allowNull: false,
    defaultValue: 'corrective'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    allowNull: false,
    defaultValue: 'medium'
  },
  status: {
    type: DataTypes.ENUM('new', 'in_progress', 'repaired', 'scrap'),
    allowNull: false,
    defaultValue: 'new'
  },
  scheduled_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  started_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  duration_hours: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  completion_percentage: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    }
  },
  progress_notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  estimated_completion: {
    type: DataTypes.DATE,
    allowNull: true
  },
  assigned_to: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  cost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  parts_used: {
    type: DataTypes.JSON,
    allowNull: true
  },
  resolution_notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  attachments: {
    type: DataTypes.JSON,
    allowNull: true
  },
  is_overdue: {
    type: DataTypes.VIRTUAL,
    get() {
      if (!this.scheduled_date || this.status === 'repaired' || this.status === 'scrap') {
        return false;
      }
      return new Date() > new Date(this.scheduled_date);
    }
  }
}, {
  tableName: 'maintenance_requests',
  hooks: {
    beforeUpdate: (request) => {
      if (request.changed('status')) {
        if (request.status === 'in_progress' && !request.started_at) {
          request.started_at = new Date();
        }
        if ((request.status === 'repaired' || request.status === 'scrap') && !request.completed_at) {
          request.completed_at = new Date();
        }
      }
    }
  }
});

module.exports = MaintenanceRequest;