import express from 'express';
const router = express.Router();
import { auth } from '../middleware/auth.js';
import experienceUpload, { handleMulterErrors } from '../middleware/experienceUpload.js';
import {
  createNewExperienceController,
  getNewExperiencesController,
  getNewExperienceByIdController,
  getNewExperienceBySlugController,
  updateNewExperienceController,
  deleteNewExperienceController,
  getStageStreamAccessController,
  getProgressController
} from '../controler/newExperienceController.js';
import {
  getEditStreamAccessV2,
  serveEditStageMediaFileV2
} from '../controler/experienceControllerV2.js';

// New Experience routes - all require authentication
// Use experienceUpload.any() to handle multiple files from different stages
router.post('/new-experiences', auth, experienceUpload.any(), handleMulterErrors, createNewExperienceController);
router.get('/new-experiences', auth, getNewExperiencesController);
router.get('/new-experiences/:id', auth, getNewExperienceByIdController);
router.get('/new-experiences/:id/stages/:stageId/stream', auth, getStageStreamAccessController);
router.get('/new-experiences/:id/progress', auth, getProgressController);
router.put('/new-experiences/:id', auth, experienceUpload.any(), handleMulterErrors, updateNewExperienceController);
router.delete('/new-experiences/:id', auth, deleteNewExperienceController);

// Public route to get experience by slug (no auth required)
router.get('/public/experience/:slug', getNewExperienceBySlugController);

// Edit experience routes - for studio owners to access media during editing
router.get('/new-experiences/:id/stages/:stageId/edit-stream', auth, getEditStreamAccessV2);
router.get('/edit-media/:stageId/:filename', auth, serveEditStageMediaFileV2);

export default router;
