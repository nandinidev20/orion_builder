import express from 'express';
const router = express.Router();
import { auth } from '../middleware/auth.js';
import experienceUpload, { handleMulterErrors } from '../middleware/experienceUpload.js';
import { 
  uploadTrackFiles,
  getTrackById,
  updateTrack,
  deleteTrack
} from '../controler/trackController.js';

// Track routes - all require authentication
// Multiple files can be uploaded in a single request: audioFile, videoFile, imageFile
// Text content is handled as a regular form field
router.post('/tracks/upload', auth,
  experienceUpload.fields([
    { name: 'audioFile', maxCount: 1 },
    { name: 'videoFile', maxCount: 1 },
    { name: 'imageFile', maxCount: 1 }
  ]),
  handleMulterErrors,
  uploadTrackFiles
);

router.get('/tracks/:id', auth, getTrackById);
router.put('/tracks/:id', auth, updateTrack);
router.delete('/tracks/:id', auth, deleteTrack);

export default router;
