import express from 'express';
const router = express.Router();
import { auth, authorize } from '../middleware/auth.js';
import {
  getCurrentUser,
  getDashboardStats,
  getRecentStudios,
  getRecentExperiences,
  getPlatformOverview,
  // Additional studio management functions
  getAllStudios,
  createStudio,
  updateStudio,
  deleteStudio,
  getStudioDetails,
  // User management functions
  getAllUsers,
  resendInvite,
  suspendUser,
  reactivateUser,
  deleteUser,
  // Admin role management functions
  makeAdmin,
  removeAdmin,
  setSuperAdmin,
  resetUserPassword,
  // Admin settings functions
  changeAdminEmail,
  changeAdminPassword
} from '../controler/adminController.js';
import {
  createStudio as createStudioAdmin,
  sendInviteLink,
  suspendStudio,
  reactivateStudio,
  resetStudioOwner,
  createInvite,
  changeStudioPassword
} from '../controler/studioDashboardController.js';

// Admin user info route
router.get('/current-user', auth, authorize('admin'), getCurrentUser);

// Admin dashboard routes - require admin role
router.get('/dashboard/stats', auth, authorize('admin'), getDashboardStats);
router.get('/dashboard/recent-studios', auth, authorize('admin'), getRecentStudios);
router.get('/dashboard/recent-experiences', auth, authorize('admin'), getRecentExperiences);
router.get('/dashboard/platform-overview', auth, authorize('admin'), getPlatformOverview);

// Admin studio management routes
router.get('/studios', auth, authorize('admin'), getAllStudios);
router.post('/studios', auth, authorize('admin'), createStudio);
router.get('/studios/:id', auth, authorize('admin'), getStudioDetails);
router.put('/studios/:id', auth, authorize('admin'), updateStudio);
router.delete('/studios/:id', auth, authorize('admin'), deleteStudio);

// Additional admin studio management routes
router.post('/studios/:id/send-invite', auth, authorize('admin'), createInvite); //accordingl to flow 
router.post('/studios/:id/suspend', auth, authorize('admin'), suspendStudio);
router.post('/studios/:id/reactivate', auth, authorize('admin'), reactivateStudio);
router.post('/studios/:id/reset-owner', auth, authorize('admin'), resetStudioOwner);

// Admin invite management routes
router.post('/invites', auth, authorize('admin'), createInvite);

// Admin user management routes
router.get('/users', auth, authorize('admin'), getAllUsers);
router.post('/users/:id/resend-invite', auth, authorize('admin'), resendInvite);
router.post('/users/:id/suspend', auth, authorize('admin'), suspendUser);
router.delete('/users/:id', auth, authorize('admin'), deleteUser);
router.post('/users/:id/reactivate', auth, authorize('admin'), reactivateUser);

// Admin role management routes (super admin only)
router.post('/users/:id/make-admin', auth, authorize('admin'), makeAdmin);
router.post('/users/:id/remove-admin', auth, authorize('admin'), removeAdmin);
router.post('/users/:id/set-super-admin', auth, authorize('admin'), setSuperAdmin);
router.post('/users/:id/reset-password', auth, authorize('admin'), resetUserPassword);

// Admin settings routes
router.post('/change-email', auth, authorize('admin'), changeAdminEmail);
router.post('/change-password', auth, authorize('admin'), changeStudioPassword);

export default router;
