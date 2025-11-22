import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.config.js';
import logger from './middleware/logger.js';
import successHandler from './middleware/successHandler.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

const app = express();

// Connect to database
connectDB();

// Middleware
app.use(cors());

// Configure body parser limits to handle large file uploads
// These limits should be larger than multer's fileSize limits
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

// Set request timeout to 30 minutes for large file uploads
app.use((req, res, next) => {
  req.setTimeout(30 * 60 * 1000); // 30 minutes
  res.setTimeout(30 * 60 * 1000); // 30 minutes
  next();
});

app.use('/uploads', express.static('uploads')); // Serve static files from uploads directory
app.use('/media', express.static('server/media')); // Serve HLS media files

// Custom middleware
app.use(logger); // Logging middleware
app.use(successHandler); // Success response handler middleware

// Routes
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import studioDashboardRoutes from './routes/studioDashboardRoutes.js';
import experienceRoutes from './routes/experienceRoutes.js';
import newExperienceRoutes from './routes/newExperienceRoutes.js';
import trackRoutes from './routes/trackRoutes.js'; // Fixed: This should be trackRoutes.js, not 404.js
import publicExperienceRoutes from './routes/publicExperienceRoutes.js';
import publicExperienceRoutesV2 from './routes/publicExperienceRoutesV2.js';
import studioValidationRoutes from './routes/studioValidationRoutes.js';
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes); // Admin dashboard routes
app.use('/api/studio', studioValidationRoutes); // Studio validation routes (public)
app.use('/api/studio', studioDashboardRoutes); // Studio dashboard routes
app.use('/api/studio', experienceRoutes); // Experience routes
app.use('/api/studio', newExperienceRoutes); // New experience routes with HLS processing
app.use('/api/studio', trackRoutes); // Track routes
app.use('/api', publicExperienceRoutes); // Public experience routes
app.use('/api', publicExperienceRoutesV2); // Public experience routes V2 (NewExperience model with stages)
app.get('/health', (req, res) => res.send('Healthy'));
// Handle 404 for undefined routes
app.use(notFoundHandler);

// Error handling middleware (must be the last middleware)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
