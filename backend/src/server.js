require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const setupSwagger = require('./config/swagger');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const patientRoutes = require('./routes/patientRoutes');
const consultationRoutes = require('./routes/consultationRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const documentRoutes = require('./routes/documentRoutes');
const caseRoutes = require('./routes/caseRoutes');
const evidenceRoutes = require('./routes/evidenceRoutes');
const completenessRoutes = require('./routes/completenessRoutes');
const timelineRoutes = require('./routes/timelineRoutes');
const ayushRoutes = require('./routes/ayushRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const fhirRoutes = require('./routes/fhirRoutes');
const demoRoutes = require('./routes/demoRoutes');

const app = express();
app.use('/uploads', express.static(
  path.join(__dirname, '../uploads')
));
const PORT = process.env.PORT || 3000;

// Connect to Database
connectDB();

// Middleware
const allowedOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.length === 0) return callback(null, true);
    return allowedOrigins.includes(origin)
      ? callback(null, true)
      : callback(new Error('CORS origin not allowed'));
  },
  credentials: false
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads directory
const uploadsPath = path.join(__dirname, '..', '..', 'uploads');
app.use('/uploads', express.static(uploadsPath));

// Swagger Documentation
setupSwagger(app);

// API Health Check
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({
    service: 'AarogyaSaar Backend API',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatus,
      host: mongoose.connection.host || '127.0.0.1:27017'
    },
    version: '1.0.0',
    endpoints: {
      swagger: '/api-docs',
      auth: '/api/auth',
      patients: '/api/patients',
      consultations: '/api/consultations',
      interview: '/api/interview',
      documents: '/api/documents',
      cases: '/api/cases',
      evidence: '/api/evidence',
      completeness: '/api/completeness',
      timeline: '/api/timeline',
      ayush: '/api/ayush',
      doctor: '/api/doctor',
      fhir: '/api/fhir',
      demo: '/api/demo'
    }
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/evidence', evidenceRoutes);
app.use('/api/completeness', completenessRoutes);
app.use('/api/timeline', timelineRoutes);
app.use('/api/ayush', ayushRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/fhir', fhirRoutes);
app.use('/api/demo', demoRoutes);

// Root greeting
app.get('/', (req, res) => {
  res.json({
    project: 'AarogyaSaar (SIH26047)',
    description: 'AI-powered clinical case intake, reconstruction, evidence, AYUSH assessment and interoperability platform',
    apiHealth: '/api/health',
    apiDocs: '/api-docs'
  });
});

// Centralized error handler
app.use(errorHandler);

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[AarogyaSaar Server] Running on http://localhost:${PORT}`);
  console.log(`[AarogyaSaar Server] Health check at http://localhost:${PORT}/api/health`);
  console.log(`[AarogyaSaar Server] Swagger docs at http://localhost:${PORT}/api-docs`);
});
