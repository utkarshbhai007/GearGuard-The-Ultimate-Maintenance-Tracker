const jwt = require('jsonwebtoken');
const { User, Team } = require('../models');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId, {
      include: [{ model: Team, as: 'team' }],
      attributes: { exclude: ['password'] }
    });

    if (!user || !user.is_active) {
      return res.status(401).json({ message: 'Invalid or inactive user' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};

const authorizeTeamAccess = async (req, res, next) => {
  try {
    const { user } = req;
    const resourceTeamId = req.params.teamId || req.body.team_id;

    // Admins and managers can access all teams
    if (user.role === 'admin' || user.role === 'manager') {
      return next();
    }

    // Technicians can only access their own team
    if (user.team_id && user.team_id.toString() === resourceTeamId?.toString()) {
      return next();
    }

    return res.status(403).json({ message: 'Access denied to this team resource' });
  } catch (error) {
    return res.status(500).json({ message: 'Authorization check failed' });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Insufficient permissions. Required roles: ' + roles.join(', ')
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  authorize,
  authorizeTeamAccess,
  requireRole
};