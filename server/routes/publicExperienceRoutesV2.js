import express from 'express';
const router = express.Router();
import { 
  getPublicExperienceByIdV2,
  validateStageAccessV2,
  validateUnlockCodeV2,
  getStreamAccessV2,
  serveStageMediaFileV2,
  getEncryptionKeyWithAuthV2
} from '../controler/experienceControllerV2.js';

// Public route for accessing published experiences (NewExperience model)
router.get('/experiences/:id/public-v2', getPublicExperienceByIdV2);

// Route for validating stage access and generating temporary access
router.post('/experiences/:id/stages/:stageId/access', validateStageAccessV2);

// Route for validating unlock code for a stage
router.post('/experiences/:id/stages/:stageId/unlock', validateUnlockCodeV2);

// --- JWT-BASED ROUTES FOR STAGES ---

// Route for getting stream access (returns JWT token for stage media)
router.get('/experiences/:id/stages/:stageId/stream', getStreamAccessV2);

// Route for serving stage media files with JWT authentication
router.get('/media-v2/:stageId/:filename', serveStageMediaFileV2);

// Route for getting encryption keys with JWT authentication
router.get('/get-key-v2', getEncryptionKeyWithAuthV2);

export default router;
