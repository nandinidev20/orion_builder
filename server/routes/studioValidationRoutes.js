import express from 'express';
const router = express.Router();
import {
  checkStudioNameAvailability,
  checkSubdomainAvailability
} from '../controler/studioController.js';

// Public endpoints - no authentication required
// Check if studio name is available
router.get('/check-name/:name', checkStudioNameAvailability);

// Check if subdomain is available
router.get('/check-subdomain/:subdomain', checkSubdomainAvailability);

export default router;
