import express from 'express';
const router = express.Router();
import { auth } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import { 
  getStudioDashboardStats, 
  getRecentExperiences,
  getStudioInfo,
  getPerformanceOverview,
  acceptInvite,
  verifyInvite,
  createStudioWithInvite,
  addPasswordAndCreateUser,
  changeStudioPassword
} from '../controler/studioDashboardController.js';

// Studio dashboard routes - all require authentication
router.get('/dashboard/stats', auth, getStudioDashboardStats);
router.get('/dashboard/recent-experiences', auth, getRecentExperiences);
router.get('/dashboard/studio-info', auth, getStudioInfo);
router.get('/dashboard/performance-overview', auth, getPerformanceOverview);

// Studio settings routes
router.post('/change-password', auth, changeStudioPassword);

// Public route for accepting studio invites
router.post('/studio/accept-invite', upload.single('logo'), acceptInvite);

// Public route for verifying studio invite genuineness
router.post('/studio/verify-invite', verifyInvite);

// Public route for creating a studio using an invite code
router.post('/create-with-invite', createStudioWithInvite);

// Public route for adding password and creating user with studio ID
router.post('/add-password', addPasswordAndCreateUser);

export default router;
