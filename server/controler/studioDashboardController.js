import Studio from '../model/Studio.js';
import NewExperience from '../model/NewExperience.js';
import Analytics from '../model/Analytics.js';
import User from '../model/User.js';
import Invite from '../model/invite.js';
import mongoose from 'mongoose';
import fs from 'fs'; // Import fs module for file operations
import { loggerInstance } from '../middleware/logger.js';
import { ValidationError } from '../utils/ApiError.js';
import { sendStudioInviteEmail, sendUserInviteEmail } from '../services/emailService.js';
import { hashPassword, generateToken } from '../services/authService.js'; // Import the password hashing function and generateToken
import { getNewExperiences } from '../services/newExperienceService.js';

// Get studio dashboard statistics
const getStudioDashboardStats = async (req, res, next) => {
  try {
    // Get the studio ID from the authenticated user
    const studioId = req.user.studio;
    
    if (!studioId) {
      return next(new ValidationError('Studio ID is required'));
    }

    // Count total experiences for this studio
    const totalExperiences = await NewExperience.countDocuments({ studioId });
    
    // Get analytics data for this studio
    const analyticsData = await Analytics.aggregate([
      { $match: { studioId: new mongoose.Types.ObjectId(studioId) } },
      {
        $group: {
          _id: null,
          totalViews: { $sum: "$metrics.totalViews" },
          uniqueVisitors: { $sum: "$metrics.uniqueVisitors" },
          completions: { $sum: "$metrics.completions" }
        }
      }
    ]);

    const stats = {
      totalExperiences,
      totalViews: analyticsData[0]?.totalViews || 0,
      uniqueVisitors: analyticsData[0]?.uniqueVisitors || 0,
      completionRate: analyticsData[0]?.completions ? 
        Math.round((analyticsData[0].completions / analyticsData[0].uniqueVisitors) * 100) + '%' : '0%'
    };

    // Calculate changes from previous period (comparing last 7 days with the 7 days before that)
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 1000);
    
    // Get analytics for the last 7 days
    const recentAnalytics = await Analytics.aggregate([
      { $match: { 
        studioId: new mongoose.Types.ObjectId(studioId),
        createdAt: { $gte: sevenDaysAgo }
      }},
      {
        $group: {
          _id: null,
          totalViews: { $sum: "$metrics.totalViews" },
          uniqueVisitors: { $sum: "$metrics.uniqueVisitors" },
          completions: { $sum: "$metrics.completions" }
        }
      }
    ]);
    
    // Get analytics for the 7 days before that
    const previousAnalytics = await Analytics.aggregate([
      { $match: { 
        studioId: new mongoose.Types.ObjectId(studioId),
        createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo }
      }},
      {
        $group: {
          _id: null,
          totalViews: { $sum: "$metrics.totalViews" },
          uniqueVisitors: { $sum: "$metrics.uniqueVisitors" },
          completions: { $sum: "$metrics.completions" }
        }
      }
    ]);
    
    // Calculate changes
    const recentExpCount = await NewExperience.countDocuments({ 
      studioId, 
      createdAt: { $gte: sevenDaysAgo } 
    });
    
    const previousExpCount = await NewExperience.countDocuments({ 
      studioId, 
      createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo } 
    });

    // Calculate changes
    const totalExperiencesChange = recentExpCount - previousExpCount;
    const totalViewsChange = (recentAnalytics[0]?.totalViews || 0) - (previousAnalytics[0]?.totalViews || 0);
    const uniqueVisitorsChange = (recentAnalytics[0]?.uniqueVisitors || 0) - (previousAnalytics[0]?.uniqueVisitors || 0);
    const completionRateChange = recentAnalytics[0] && previousAnalytics[0] ?
      Math.round(((recentAnalytics[0].completions / recentAnalytics[0].uniqueVisitors) - (previousAnalytics[0].completions / previousAnalytics[0].uniqueVisitors)) * 10) + '%' :
      '0%';

    stats.changes = {
      totalExperiences: totalExperiencesChange >= 0 ? `+${totalExperiencesChange}` : `${totalExperiencesChange}`,
      totalViews: totalViewsChange >= 0 ? `+${totalViewsChange}` : `${totalViewsChange}`,
      uniqueVisitors: uniqueVisitorsChange >= 0 ? `+${uniqueVisitorsChange}` : `${uniqueVisitorsChange}`,
      completionRate: completionRateChange
    };

    res.success(stats, 'Studio dashboard statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// Get recent experiences for the studio
const getRecentExperiences = async (req, res, next) => {
  try {
    const studioId = req.user.studio;
    
    if (!studioId) {
      return next(new ValidationError('Studio ID is required'));
    }

    // Use the same parameters as getNewExperiencesController but default to sorting by createdAt for "recent" experiences
    const { page = 1, limit = 10, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // Use the service function to get experiences
    const result = await getNewExperiences(studioId, { page, limit, status, sortBy, sortOrder });

    // Format the response to match the frontend requirements for recent experiences
    const formattedExperiences = result.experiences.map(exp => ({
      id: exp._id,
      slug: exp.slug || generateSlug(exp.title),
      title: exp.title,
      subtitle: exp.subtitle,
      description: exp.description,
      startDate: exp.startDate,
      endDate: exp.endDate,
      status: exp.status,
      createdAt: exp.createdAt,
      updatedAt: exp.updatedAt,
      isActive: exp.isActive,
      stageCount: exp.stages ? exp.stages.length : 0,
      icon: exp.icon ? `${req.protocol}://${req.get('host')}${exp.icon}` : null,
      iconName: exp.iconName,
      analytics: {
        totalViews: exp.analytics?.totalViews || 0,
        uniqueVisitors: exp.analytics?.uniqueVisitors || 0,
        completionRate: exp.analytics?.completionRate || 0
      }
    }));

    res.success({
      experiences: formattedExperiences,
      pagination: result.pagination
    }, 'Recent experiences retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// Get studio information
const getStudioInfo = async (req, res, next) => {
 try {
    const studioId = req.user.studio;
    console.log(studioId,"LLLLLLLLLLLLLLLLLLL");
    console.log(req.user,"LLLLLLLLLLLLLLLLLLL");
    
    if (!studioId) {
      return next(new ValidationError('Studio ID is required'));
    }

    const studio = await Studio.findById(studioId).lean();
    console.log(studio,"LLLLLLLLLLLLLLLLLLLkuhkhkjhkj");
    if (!studio) {
      return next(new ValidationError('Studio not found'));
    }

    const studioInfo = {
      studioName: studio.studioName,
      plan: studio.subscriptionPlan || 'Free',
      created: studio.createdAt,
      subdomain: studio.subdomain,
      description: studio.description,
      brandColor: studio.brandColor,
      logo: studio.logo
    };

    res.success(studioInfo, 'Studio information retrieved successfully');
  } catch (error) {
    next(error);
 }
};

// Get performance overview data for charts
const getPerformanceOverview = async (req, res, next) => {
  try {
    const studioId = req.user.studio;
    
    if (!studioId) {
      return next(new ValidationError('Studio ID is required'));
    }

    // Get analytics data for daily views over the last 7 days
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 1000);
    
    // Daily views aggregation
    const dailyViews = await Analytics.aggregate([
      { $match: { 
        studioId: new mongoose.Types.ObjectId(studioId),
        createdAt: { $gte: sevenDaysAgo }
      }},
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          totalViews: { $sum: "$metrics.totalViews" }
        }
      },
      { $sort: { "_id": 1 } }
    ]);
    
    // Convert to the expected format
    const formattedDailyViews = dailyViews.map(day => ({
      date: day._id,
      count: day.totalViews
    }));

    // Weekly completions aggregation (last 4 weeks)
    const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 1000);
    const weeklyCompletions = await Analytics.aggregate([
      { $match: { 
        studioId: new mongoose.Types.ObjectId(studioId),
        createdAt: { $gte: fourWeeksAgo }
      }},
      {
        $group: {
          _id: { $isoWeekYear: "$createdAt", week: { $isoWeek: "$createdAt" } },
          totalCompletions: { $sum: "$metrics.completions" }
        }
      },
      { $sort: { "_id": 1 } },
      { $limit: 4 }
    ]);
    
    const formattedWeeklyCompletions = weeklyCompletions.map((week, index) => ({
      week: `Week ${index + 1}`,
      count: week.totalCompletions
    }));

    // Top experiences by views and completion rate
    const topExperiences = await NewExperience.find({ studioId })
      .sort({ 'analytics.totalViews': -1 })
      .limit(4)
      .select('title analytics.status analytics.totalViews analytics.completions');
    
    const experiencePerformance = topExperiences.map(exp => ({
      title: exp.title,
      views: exp.analytics?.totalViews || 0,
      completionRate: exp.analytics?.totalViews && exp.analytics?.completions ?
        Math.round((exp.analytics.completions / exp.analytics.totalViews) * 100) : 0
    }));

    const performanceData = {
      dailyViews: formattedDailyViews,
      weeklyCompletions: formattedWeeklyCompletions,
      experiencePerformance: experiencePerformance
    };

    res.success(performanceData, 'Performance overview data retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// Admin studio management functions

// Create a new studio by admin
const createStudio = async (req, res, next) => {
  try {
    const { name, subdomain, description, ownerEmail } = req.body;

    // Validate required fields
    if (!name || !subdomain || !ownerEmail) {
      return res.status(400).json({
        success: false,
        message: 'Name, subdomain, and owner email are required'
      });
    }

    // Check if subdomain already exists
    const existingStudio = await Studio.findOne({ subdomain });
    if (existingStudio) {
      return res.status(400).json({
        success: false,
        message: 'Subdomain already exists'
      });
    }

    // Create a new studio with invite
    const studioData = {
      name,
      subdomain,
      description,
      ownerEmail
    };

    const studio = await Studio.createInvite(studioData);
    
    res.success({ studio }, 'Studio created successfully with invite');
  } catch (error) {
    next(error);
  }
};

// Send invite link to studio owner
const sendInviteLink = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { ownerEmail } = req.body; // Allow re-sending to different email if needed

    // Find the studio by ID
    const studio = await Studio.findById(id);
    if (!studio) {
      return res.status(404).json({
        success: false,
        message: 'Studio not found'
      });
    }

    // If studio already has an owner and is accepted, can't send invite
    if (studio.isInviteAccepted) {
      return res.status(400).json({
        success: false,
        message: 'Studio already has an owner'
      });
    }

    // Update the owner email if provided
    if (ownerEmail) {
      studio.ownerEmail = ownerEmail;
      await studio.save();
    }

    // Send the invite email with the invite code
    const emailResult = await sendStudioInviteEmail(studio.ownerEmail, studio.subdomain, studio.inviteCode, studio.name);
    
    if (!emailResult.success) {
      // If email sending fails, log the error but still return success since invite was processed
      console.error('Failed to send studio invite email:', emailResult.error);
    } else {
      console.log(`Studio invite email sent successfully to: ${studio.ownerEmail}`);
    }
    
    res.success({ studio }, 'Invite link sent successfully');
  } catch (error) {
    next(error);
  }
};

// Create invite for a user and send it
const createInvite = async (req, res, next) => {
  try {
    const { email, name } = req.body;

    // Validate required fields
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Check if email already exists in users or invites
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    const existingInvite = await Invite.findOne({ email });
    if (existingInvite) {
      return res.status(400).json({
        success: false,
        message: 'An invite already exists for this email'
      });
    }

    // Generate a unique invite code
    const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    
    // Set expiration time (e.g., 7 days from now)
    const inviteCodeExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 1000); // 7 days

    // Create the invite
    const invite = await Invite.create({
      email,
      name,
      inviteCode,
      inviteCodeExpiresAt,
      status: 'invited'
    });

    // Generate the invite link
    const BASE_DOMAIN = process.env.SERVER_BASE_DOMAIN || 'lvh.me:5173';
    const encodedEmail = encodeURIComponent(email);
    const encodedName = encodeURIComponent(name || '');
    const inviteLink = `http://${BASE_DOMAIN}/accept-invite?code=${inviteCode}&email=${encodedEmail}&name=${encodedName}`;
    
    // Update the invite with the generated link
    invite.generatedInvitelink = inviteLink;
    await invite.save();

    // Send the invite email with the invite link
    const emailResult = sendUserInviteEmail(invite.email, invite.name, invite.inviteCode);
    
    if (!emailResult.success) {
      // If email sending fails, log the error but still return success since invite was created
      console.error('Failed to send user invite email:', emailResult.error);
    } else {
      console.log(`User invite email sent successfully to: ${email}`);
    }

    res.success({ invite }, 'Invite created and sent successfully');
  } catch (error) {
    next(error);
  }
};

// Create a studio using an invite code
const createStudioWithInvite = async (req, res, next) => {
  try {
    const { inviteCode, studioName, subdomain, email } = req.body;

    // Validate required fields
    if (!inviteCode || !studioName || !subdomain || !email) {
      return res.status(400).json({
        success: false,
        message: 'Invite code, studio name, subdomain, and email are required'
      });
    }

    // Find the invite by both code and email to ensure security
    const invite = await Invite.findOne({ 
      inviteCode: inviteCode,
      email: email.toLowerCase()
    });
    
    if (!invite) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired invite code, or email does not match invite recipient'
      });
    }
    if (invite.inviteCodeExpiresAt < new Date()) {
      // Update the invite status to expired
      invite.status = 'expired';
      await invite.save();
      return res.status(400).json({
        success: false,
        message: 'Invite code has expired'
      });
    }

    // Check if invite has already been used
    if (invite.isInviteAccepted) {
      return res.status(400).json({
        success: false,
        message: 'Invite code has already been used'
      });
    }

    // Check if subdomain already exists
    const existingStudio = await Studio.findOne({ subdomain });
    if (existingStudio) {
      return res.status(400).json({
        success: false,
        message: 'Subdomain already exists'
      });
    }

    // Create the studio using the invite information
    const studioData = {
      studioName: studioName,
      subdomain,
      ownerEmail: invite.email, // Use the email from the invite
    };

    const studio = await Studio.createStudioAccount(studioData);

    // Update the invite status to indicate it has been used
    invite.isInviteAccepted = false;
    invite.status = 'pending'; // As requested, change status to pending
    await invite.save();

    res.success({ studio }, 'Studio created successfully using invite');
  } catch (error) {
    next(error);
  }
};

// Suspend a studio
const suspendStudio = async (req, res, next) => {
  try {
    const { id } = req.params;

    const studio = await Studio.findById(id);
    if (!studio) {
      return res.status(404).json({
        success: false,
        message: 'Studio not found'
      });
    }

    // Update studio status to suspended
    studio.isSuspended = true;
    studio.isReactivated = false; // Reset reactivated flag
    await studio.save();
    
    res.success({ studio }, 'Studio suspended successfully');
  } catch (error) {
    next(error);
  }
};

// Reactivate a suspended studio
const reactivateStudio = async (req, res, next) => {
  try {
    const { id } = req.params;

    const studio = await Studio.findById(id);
    if (!studio) {
      return res.status(404).json({
        success: false,
        message: 'Studio not found'
      });
    }

    // Update studio status to reactivated
    studio.isSuspended = false;
    studio.isReactivated = true;
    await studio.save();
    
    res.success({ studio }, 'Studio reactivated successfully');
  } catch (error) {
    next(error);
  }
};

// Reset studio owner access
const resetStudioOwner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newOwnerEmail } = req.body;

    if (!newOwnerEmail) {
      return res.status(400).json({
        success: false,
        message: 'New owner email is required'
      });
    }

    const studio = await Studio.findById(id);
    if (!studio) {
      return res.status(404).json({
        success: false,
        message: 'Studio not found'
      });
    }

    // Use the model's method to reset owner access
    await studio.resetOwnerAccess(newOwnerEmail);
    
    res.success({ studio }, 'Studio owner access reset successfully');
  } catch (error) {
    next(error);
  }
};

// Accept studio invite and create user account
const acceptInvite = async (req, res, next) => {
  try {
    const { inviteCode, userData, branding } = req.body;
    const logoFile = req.file; // Get the uploaded logo file

    // Get email and studio from URL query parameters (for additional verification)
    const { email: queryEmail, studio: queryStudio } = req.query;

    // Parse JSON fields if they're sent as strings (common with multipart form data)
    let parsedUserData = userData;
    let parsedBranding = branding;
    
    if (typeof userData === 'string') {
      try {
        parsedUserData = JSON.parse(userData);
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user data format'
        });
      }
    }
    
    if (typeof branding === 'string') {
      try {
        parsedBranding = JSON.parse(branding);
      } catch (e) {
        // branding is optional, so if it's not valid JSON and not provided, set to null
        parsedBranding = null;
      }
    }

    // Validate required fields
    if (!inviteCode || !parsedUserData || !parsedUserData.email || !parsedUserData.password) {
      return res.status(400).json({
        success: false,
        message: 'Invite code and user data (email, password) are required'
      });
    }

    // Find studio by invite code
    const studio = await Studio.findOne({ inviteCode });
    if (!studio) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired invite code'
      });
    }

    // Check if invite has expired
    if (studio.isInviteExpired) {
      return res.status(400).json({
        success: false,
        message: 'Invite code has expired'
      });
    }

    // Check if invite has already been accepted
    if (studio.isInviteAccepted) {
      return res.status(400).json({
        success: false,
        message: 'Invite has already been accepted'
      });
    }

    // Check if user with this email already exists
    const existingUser = await User.findOne({ email: parsedUserData.email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Additional verification: check if the email from the URL matches the email in the request
    if (queryEmail && studio.ownerEmail.toLowerCase() !== queryEmail.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: 'Email verification failed'
      });
    }

    // Additional verification: check if the studio name from the URL matches the studio name in the database
    if (queryStudio && studio.name.toLowerCase() !== queryStudio.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: 'Studio name verification failed'
      });
    }

    // Hash the password
    const hashedPassword = await hashPassword(parsedUserData.password);

    // Create a new user
    const newUser = new User({
      email: parsedUserData.email,
      password: hashedPassword,
      username: parsedUserData.username || parsedUserData.email.split('@')[0], // Use email prefix as username if not provided
      role: 'studio-owner', // Assign studio owner role
      studio: studio._id, // Link to the studio
      isEmailVerified: true // Since they came through invite, consider email verified
    });

    // Save the new user
    const savedUser = await newUser.save();

    // Update studio with branding information if provided
    if (parsedBranding) {
      if (parsedBranding.brandColor) studio.brandColor = parsedBranding.brandColor;
      if (parsedBranding.name) studio.name = parsedBranding.name; // Allow updating studio name during onboarding
    }

    // Handle logo upload if a file was provided
    if (logoFile) {
      studio.logo = `/uploads/studios/${logoFile.filename}`; // Store the file path for the logo
    }

    // Use the model's acceptInvite method to update studio status
    await studio.acceptInvite(savedUser._id);

    // Return success response with user and studio info
    res.success({
      user: {
        id: savedUser._id,
        email: savedUser.email,
        username: savedUser.username,
        role: savedUser.role
      },
      studio: {
        id: studio._id,
        name: studio.name,
        subdomain: studio.subdomain,
        brandColor: studio.brandColor,
        logo: studio.logo
      }
    }, 'Invite accepted successfully. User account created.');
  } catch (error) {
    // Clean up uploaded file if there was an error after file upload
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path); // Delete the uploaded file on error
      } catch (unlinkErr) {
        console.error('Error deleting uploaded file:', unlinkErr);
      }
    }
    next(error);
  }
};

// Verify if an invite is genuine by checking email, studio name, and invite code
const verifyInvite = async (req, res, next) => {
  try {
    const { ownerEmail, studioName, inviteCode } = req.body;

    // Validate required fields
    if (!ownerEmail || !studioName || !inviteCode) {
      return res.status(400).json({
        success: false,
        isValid: false,
        message: 'Owner email, studio name, and invite code are required'
      });
    }

    // Find studio by invite code
    const studio = await Studio.findOne({ inviteCode });
    if (!studio) {
      return res.success({
        isValid: false
      }, 'Invite verification completed');
    }

    // Check if the invite has expired
    if (studio.isInviteExpired) {
      return res.success({
        isValid: false
      }, 'Invite verification completed');
    }

    // Check if the invite has already been accepted
    if (studio.isInviteAccepted) {
      return res.success({
        isValid: false
      }, 'Invite verification completed');
    }

    // Verify that the provided email and studio name match the stored invite details
    const isEmailMatch = studio.ownerEmail.toLowerCase() === ownerEmail.toLowerCase();
    const isStudioNameMatch = studio.name.toLowerCase() === studioName.toLowerCase();

    // Return validation result
    res.success({
      isValid: isEmailMatch && isStudioNameMatch
    }, 'Invite verification completed');
  } catch (error) {
    next(error);
  }
};

// Change studio password
const changeStudioPassword = async (req, res, next) => {
  try {
    const { _id: userId } = req.user;
    console.log("called",userId);
    const { currentPassword, newPassword } = req.body;

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    // Validate password length
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long'
      });
    }
    console.log(userId),"LLLLLLLLLLLLLLLLLL";
    // Find the studio owned by the current user
    const user = await User.findById(userId);
   const studio = await Studio.findById(user.studio).select('+password');
    if (!studio) {
      return res.status(404).json({
        success: false,
        message: 'Studio not found for this user'
      });
    }

    // Verify current password
    console.log(currentPassword);
    const isPasswordValid = await studio.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Set the new password - the pre-save hook will hash it automatically
    studio.password = newPassword;
    console.log(studio.password);
    await studio.save();

    res.success(
      { studio: { id: studio._id, name: studio.name } },
      'Password changed successfully'
    );
  } catch (error) {
    next(error);
  }
};

// Add password to studio and accept invite
const addPasswordAndCreateUser = async (req, res, next) => {
  try {
    const { studioId, password } = req.body;

    // Validate required fields
    if (!studioId || !password) {
      return res.status(400).json({
        success: false,
        message: 'Studio ID and password are required'
      });
    }

    // Find the studio by studioId
    const studio = await Studio.findById(studioId);
    if (!studio) {
      return res.status(404).json({
        success: false,
        message: 'Studio not found'
      });
    }

    // Get the invite code from the studio to find the associated invite
    const invite = await Invite.findOne({ email: studio.ownerEmail });
    if (!invite) {
      return res.status(404).json({
        success: false,
        message: 'Invite not found for this studio'
      });
    }

    // Check if invite has already been used
    if (invite.isInviteAccepted) {
      return res.status(400).json({
        success: false,
        message: 'Invite code has already been used'
      });
    }

    // Check if user with this email already exists
    const existingUser = await User.findOne({ email: studio.ownerEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Set the password - the pre-save hook will hash it automatically
    studio.password = password;
    await studio.save();

    // Create a new user for the studio owner
    const newUser = new User({
      email: studio.ownerEmail,
      inviteId: invite._id, // Add the invite ID from the fetched invite
      // Note: password field is not set here since User model handles password hashing in pre-save hook
      // and in this context we're not storing user passwords directly
      username: studio.ownerEmail.split('@')[0], // Use email prefix as username
      role: 'studio', // Assign studio owner role
      studio: studio._id, // Link to the studio
      isEmailVerified: true // Since they're accepting the invite, consider email verified
    });

    // Save the new user
    const savedUser = await newUser.save();

    // Update the invite to mark it as accepted
    invite.isInviteAccepted = true;
    invite.status = 'accepted';
    await invite.save();

    // Update the studio to mark the invite as accepted
    studio.isInviteAccepted = true;
    await studio.save();

    // Generate JWT token for studio authentication using authService
    const token = generateToken(savedUser._id, 'studio');

    // Set JWT as HTTP cookie
    res.cookie('token', token, {
      httpOnly: true,  // Prevents XSS attacks
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
      maxAge: 15 * 24 * 60 * 1000, // 15 days in milliseconds
      sameSite: 'strict' // CSRF protection
    });

    // Return success response with user and token info matching authService format
    res.success({
      message: 'Password added to studio successfully.',
      token,
      user: {
        id: savedUser._id, // Use the actual user ID
        email: savedUser.email,
        role: savedUser.role,
        studioId: savedUser.studio,
        studioName: studio.name,
        studio_subdomain: studio.subdomain
      }
    }, 'Password added to studio successfully.');
  } catch (error) {
    next(error);
  }
};

export {
  getStudioDashboardStats,
  getRecentExperiences,
  getStudioInfo,
  getPerformanceOverview,
  createInvite,
  // Admin studio management functions
 createStudio,
  sendInviteLink,
  suspendStudio,
  reactivateStudio,
  resetStudioOwner,
  createStudioWithInvite,
  // Public invite acceptance function
  acceptInvite,
  // Public invite verification function
 verifyInvite,
  // Change studio password function
  changeStudioPassword,
  // Add password and create user function
  addPasswordAndCreateUser
};
