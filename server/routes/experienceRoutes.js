import express from 'express';
const router = express.Router();
import { auth } from '../middleware/auth.js';
import experienceUpload, { handleMulterErrors } from '../middleware/experienceUpload.js';
import {
  createExperience,
  getExperiences,
  getExperienceById,
  updateExperience,
  deleteExperience,
  publishExperience,
  archiveExperience,
  checkTitleUniqueness,
  checkExperienceNameAvailability
} from '../controler/experienceController.js';

// Experience validation routes
router.get('/check-experience-name/:title', auth, checkExperienceNameAvailability);

// Experience routes - all require authentication
router.post('/experiences', auth, experienceUpload.single('logo'), handleMulterErrors, createExperience);
router.get('/experiences', auth, getExperiences);
router.get('/experiences/:id', auth, getExperienceById);
router.put('/experiences/:id', auth, experienceUpload.single('logo'), handleMulterErrors, updateExperience);
router.delete('/experiences/:id', auth, deleteExperience);
router.put('/experiences/:id/publish', auth, publishExperience);
router.put('/experiences/:id/archive', auth, archiveExperience);
router.get('/experiences/check-title-uniqueness', auth, checkTitleUniqueness);

export default router;
