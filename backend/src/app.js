require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');
const { sequelize } = require('./models');

// Import routes
const authRoutes = require('./routes/auth');
const documentRoutes = require('./routes/documents');
const userRoutes = require('./routes/users');
const activityLogRoutes = require('./routes/activityLogs');

const app = express();

// Early explicit CORS middleware (runs before other middleware).
// This ensures we echo the incoming Origin header (never '*') and always
// set Access-Control-Allow-Credentials when an Origin is present. It also
// handles OPTIONS preflight requests so nothing downstream can short-circuit
// and send a wildcard origin.
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    // echo origin (do NOT use '*') when credentials are required by the frontend
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
    // allow common headers (extend as needed)
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    // ensure preflight responses are not cached incorrectly
    res.setHeader('Vary', 'Origin');
  }

  if (req.method === 'OPTIONS') {
    // short-circuit OPTIONS preflight
    return res.sendStatus(204);
  }

  next();
});

// CORS setup: keep the cors package as a fallback for other cases
app.use(cors({ origin: true, credentials: true }));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Static file serving
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Swagger documentation
// Let the early CORS middleware handle preflight/origin echoing. Avoid setting a
// per-route wildcard origin which would break credentialed requests from the UI.
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Document Management System API',
  swaggerOptions: {
    persistAuthorization: true
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/activity-logs', activityLogRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Create uploads directory if it doesn't exist
const fs = require('fs');
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Database connection and server start
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    
    // Sync database (in development)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('Database synchronized');
    }

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server is running on http://0.0.0.0:${PORT}`);
      console.log(`Access from external: http://10.184.0.2:${PORT}`);
      console.log(`Swagger UI: http://10.184.0.2:${PORT}/api-docs/`);
    });

    return server;
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

let server;

// Only start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  server = startServer();
}

module.exports = { app, server, startServer };