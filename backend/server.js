require("dotenv").config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const resumeRoutes = require('./routes/resume');
const contactRoutes = require('./routes/contact');

// Initialize Express app
const app = express();


// ================= MIDDLEWARE =================

// Enable CORS
app.use(cors());

// Parse JSON and form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files (resume uploads)
app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'))
);


// ================= ROUTES =================

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/contact', contactRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'OK',
    message: 'INTERNLY Backend is running 🚀',
  });
});


// ================= DATABASE =================

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/internly';

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB successfully!');
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
  });


// ================= ERROR HANDLING =================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('🔥 Server Error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong on the server',
  });
});


// ================= SERVER =================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 API health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
