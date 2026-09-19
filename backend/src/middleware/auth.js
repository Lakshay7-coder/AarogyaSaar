const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'aarogyasaar_sih26047_secret_key_2026');
      
      // Allow demo bypass user if id is 'demo-doctor-id', etc.
      if (decoded.id && decoded.id.startsWith('demo-')) {
        req.user = {
          _id: decoded.id,
          name: decoded.name || 'Demo User',
          email: decoded.email || 'demo@aarogyasaar.gov.in',
          role: decoded.role || 'doctor',
          specialty: decoded.specialty || 'General Medicine & AYUSH Integrator'
        };
        return next();
      }

      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'User account not found' });
      }

      return next();
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Authentication token invalid or expired' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authorization token required' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user?.role || 'Guest'}' is not authorized to access this resource`
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
