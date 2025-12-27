const sequelize = require('../config/database');
const User = require('./User');
const Team = require('./Team');
const Equipment = require('./Equipment');
const MaintenanceRequest = require('./MaintenanceRequest');

// Define associations
User.belongsTo(Team, { foreignKey: 'team_id', as: 'team' });
Team.hasMany(User, { foreignKey: 'team_id', as: 'members' });

Equipment.belongsTo(Team, { foreignKey: 'maintenance_team_id', as: 'maintenanceTeam' });
Equipment.belongsTo(User, { foreignKey: 'assigned_technician_id', as: 'assignedTechnician' });
Team.hasMany(Equipment, { foreignKey: 'maintenance_team_id', as: 'equipment' });

MaintenanceRequest.belongsTo(Equipment, { foreignKey: 'equipment_id', as: 'equipment' });
MaintenanceRequest.belongsTo(User, { foreignKey: 'assigned_to', as: 'assignedTechnician' });
MaintenanceRequest.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
MaintenanceRequest.belongsTo(Team, { foreignKey: 'team_id', as: 'team' });

Equipment.hasMany(MaintenanceRequest, { foreignKey: 'equipment_id', as: 'maintenanceRequests' });
User.hasMany(MaintenanceRequest, { foreignKey: 'assigned_to', as: 'assignedRequests' });
User.hasMany(MaintenanceRequest, { foreignKey: 'created_by', as: 'createdRequests' });
Team.hasMany(MaintenanceRequest, { foreignKey: 'team_id', as: 'requests' });

module.exports = {
  sequelize,
  User,
  Team,
  Equipment,
  MaintenanceRequest
};