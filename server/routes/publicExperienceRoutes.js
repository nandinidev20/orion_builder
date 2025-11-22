import express from 'express';
const router = express.Router();
import { 
  getPublicExperienceById,
  validateTrackAccess,
  streamTrackContent, // Updated to use the correct function name
  validateUnlockCode,
  getEncryptionKey,
  // New JWT-based functions
  getStreamAccess,    // This replaces streamTrackContentSecure
  serveMediaFile,     // New endpoint for serving media files with JWT auth
  getEncryptionKeyWithAuth  // New endpoint for serving encryption keys with JWT auth
} from '../controler/experienceController.js';

// Public route for accessing published experiences
router.get('/experiences/:id/public', getPublicExperienceById);

// Route for validating track access and generating temporary access
router.post('/experiences/:id/tracks/:trackId/access', validateTrackAccess);

// Route for validating unlock code for a track
router.post('/experiences/:id/tracks/:trackId/unlock', validateUnlockCode);

// --- NEW JWT-BASED ROUTES ---

// Route for getting stream access (replaces the old stream route)
// This is the new "Ticket Booth" that gives JWT tokens
router.get('/experiences/:id/tracks/:trackId/stream', getStreamAccess);

// Route for serving media files (new "Bouncer")
// This is the new endpoint that serves media files with JWT authentication
router.get('/media/:trackId/:filename', serveMediaFile);

// Route for getting encryption keys with JWT authentication (new "Key Server")
router.get('/get-key', getEncryptionKeyWithAuth);

// --- END OF NEW JWT-BASED ROUTES ---

// Route for getting encryption keys (protected by Cloudflare WAF) - DEPRECATED but kept for backward compatibility
router.get('/get-key-old', getEncryptionKey);

export default router;
