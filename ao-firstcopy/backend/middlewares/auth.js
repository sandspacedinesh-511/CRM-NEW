const jwt = require('jsonwebtoken');
const { User } = require('../models');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {      return res.status(401).json({ 
        message: 'Access token required',
        errorType: 'NO_TOKEN'
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error('Auth middleware: JWT_SECRET is not configured');
      return res.status(500).json({ 
        message: 'Server configuration error',
        errorType: 'CONFIG_ERROR'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ where: { id: decoded.id } });

    if (!user) {      return res.status(401).json({ 
        message: 'Invalid token - user not found',
        errorType: 'USER_NOT_FOUND'
      });
    }

    if (!user.active) {      return res.status(401).json({ 
        message: 'Account is inactive',
        errorType: 'ACCOUNT_INACTIVE'
      });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Invalid token',
        errorType: 'INVALID_TOKEN'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token expired',
        errorType: 'TOKEN_EXPIRED'
      });
    }
    
    res.status(401).json({ 
      message: 'Authentication failed',
      errorType: 'AUTH_FAILED'
    });
  }
};

const checkRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
};

module.exports = {
  auth,
  checkRole
}; 