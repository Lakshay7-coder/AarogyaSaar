const User = require('../models/User');
const jwt = require('jsonwebtoken');

const DEMO_CREDENTIALS = {
  'patient@sih26047.local': {
    password: 'patient123',
    _id: 'demo-patient-id-sih26047',
    name: 'Priya Sharma',
    role: 'patient',
    specialty: 'Patient / Kiosk User',
    registrationNumber: ''
  },
  'doctor@sih26047.local': {
    password: 'doctor123',
    _id: 'demo-doctor-id-sih26047',
    name: 'Dr. Ananya Verma',
    role: 'doctor',
    specialty: 'General Medicine & AYUSH Integrator',
    registrationNumber: 'NMC-SIH26047-DEMO'
  },
  'admin@sih26047.local': {
    password: 'admin123',
    _id: 'demo-admin-id-sih26047',
    name: 'Neha Kapoor',
    role: 'admin',
    specialty: 'Hospital Administration',
    registrationNumber: ''
  }
};

const signToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      specialty: user.specialty
    },
    process.env.JWT_SECRET || 'aarogyasaar_sih26047_secret_key_2026',
    { expiresIn: '7d' }
  );
};

// @desc Register user
// @route POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password, role, specialty, registrationNumber, phone } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Email is already registered' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'patient',
      specialty: specialty || 'General Medicine',
      registrationNumber: registrationNumber || '',
      phone: phone || ''
    });

    const token = signToken(user);
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        specialty: user.specialty,
        registrationNumber: user.registrationNumber
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc Login user
// @route POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    // ZIP 2-compatible deterministic demo credentials. These work even when
    // the MongoDB demo users have not been created yet. The token is marked as
    // a demo token, so the existing ZIP 1 auth middleware can validate it
    // without changing the database-backed authentication flow.
    const demo = DEMO_CREDENTIALS[email];
    if (demo && password === demo.password) {
      const token = signToken(demo);
      return res.json({
        success: true,
        token,
        user: {
          id: demo._id,
          name: demo.name,
          email,
          role: demo.role,
          specialty: demo.specialty,
          registrationNumber: demo.registrationNumber
        },
        isDemo: true
      });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = signToken(user);
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        specialty: user.specialty,
        registrationNumber: user.registrationNumber
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc Demo Login (instant access for SIH Evaluators)
// @route POST /api/auth/demo-login
const demoLogin = async (req, res, next) => {
  try {
    const { role = 'doctor' } = req.body;
    let mockUser;

    if (role === 'doctor') {
      mockUser = {
        _id: 'demo-doctor-id-sih26047',
        name: 'Dr. Vikramaditya Sharma, MD',
        email: 'doctor@aarogyasaar.gov.in',
        role: 'doctor',
        specialty: 'Internal Medicine & AYUSH Integrated Care',
        registrationNumber: 'NMC-DEL-2018-84729'
      };
    } else if (role === 'patient') {
      mockUser = {
        _id: 'demo-patient-id-sih26047',
        name: 'Ramesh Kumar',
        email: 'patient@aarogyasaar.gov.in',
        role: 'patient',
        specialty: 'Patient / Kiosk User',
        registrationNumber: ''
      };
    } else {
      mockUser = {
        _id: 'demo-admin-id-sih26047',
        name: 'AarogyaSaar System Admin',
        email: 'admin@aarogyasaar.gov.in',
        role: 'admin',
        specialty: 'Health Informatics & ABDM Node Admin',
        registrationNumber: ''
      };
    }

    const token = signToken(mockUser);
    res.json({
      success: true,
      token,
      user: {
        id: mockUser._id,
        name: mockUser.name,
        email: mockUser.email,
        role: mockUser.role,
        specialty: mockUser.specialty,
        registrationNumber: mockUser.registrationNumber
      },
      isDemo: true
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get current user
// @route GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  demoLogin,
  getMe
};
