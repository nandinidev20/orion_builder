import Experience from '../model/Experience.js';
import User from '../model/User.js';
import Studio from '../model/Studio.js';
import Analytics from '../model/Analytics.js';
import Invite from '../model/invite.js';
import { loggerInstance } from '../middleware/logger.js';
import { ValidationError } from '../utils/ApiError.js';
import { sendUserInviteEmail, sendResendInviteEmail } from '../services/emailService.js';
import { hashPassword } from '../services/authService.js';

// Get dashboard statistics
const getDashboardStats = async (req, res, next) => {
  try {
    // Count total studios
    const totalStudios = await Studio.countDocuments();
    
    // Count total experiences
    const totalExperiences = await Experience.countDocuments();
    
    // Count active users
    const activeUsers = await User.countDocuments({ isActive: true });
    
    // Calculate total revenue (mock calculation - in real app this would come from payment records)
    const totalRevenue = await Analytics.aggregate([
      { $group: { _id: null, total: { $sum: "$revenue" } } }
    ]);
    
    const revenue = totalRevenue[0] ? totalRevenue[0].total : 0;

    const stats = {
      totalStudios,
      totalExperiences,
      activeUsers: activeUsers.toLocaleString(),
      totalRevenue: `$${(revenue / 1000).toFixed(1)}K` // Convert to thousands format
    };

    // Calculate changes from previous period (mock data)
    stats.changes = {
      totalStudios: '+2',
      totalExperiences: '+12',
      activeUsers: '+120',
      totalRevenue: '+$2.4K'
    };

    res.success(stats, 'Dashboard statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// Get recent studios
const getRecentStudios = async (req, res, next) => {
  try {
    const { limit = 10, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    const recentStudios = await Studio.find()
      .populate('owner', 'email username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Format the response to match the frontend requirements
    const formattedStudios = recentStudios.map(studio => ({
      id: studio._id,
      name: studio.name,
      owner: studio.owner ? studio.owner.email || studio.owner.username : 'Unknown',
      experiences: studio.experiencesCount || 0, // This would need to be populated based on actual experience counts
      status: studio.isActive ? 'Active' : 'Inactive',
      createdAt: studio.createdAt
    }));

    res.success({
      studios: formattedStudios,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: await Studio.countDocuments()
      }
    }, 'Recent studios retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// Get recent experiences
const getRecentExperiences = async (req, res, next) => {
  try {
    const { limit = 10, page = 1, status } = req.query;
    const skip = (page - 1) * limit;
    
    let filter = {};
    if (status) {
      filter.status = status;
    }

    const recentExperiences = await Experience.find(filter)
      .populate('studio', 'name')
      .populate('creator', 'email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Format the response to match the frontend requirements
    const formattedExperiences = recentExperiences.map(exp => ({
      id: exp._id,
      title: exp.title,
      studio: exp.studio ? exp.studio.name : 'Unknown',
      views: exp.analytics?.views || 0,
      status: exp.status || 'Draft',
      createdAt: exp.createdAt
    }));

    res.success({
      experiences: formattedExperiences,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: await Experience.countDocuments(filter)
      }
    }, 'Recent experiences retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// Get platform overview data for charts
const getPlatformOverview = async (req, res, next) => {
  try {
    // This would typically aggregate data over time periods
    // Mock data structure for the chart
    const platformData = {
      // Mock data for chart visualization
      dailyActiveUsers: [
        { date: '2023-01-01', count: 120 },
        { date: '2023-01-02', count: 150 },
        { date: '2023-01-03', count: 180 },
        { date: '2023-01-04', count: 210 },
        { date: '2023-01-05', count: 190 },
        { date: '2023-01-06', count: 230 },
        { date: '2023-01-07', count: 270 },
      ],
      newStudios: [
        { date: '2023-01-01', count: 2 },
        { date: '2023-01-02', count: 3 },
        { date: '2023-01-03', count: 1 },
        { date: '2023-01-04', count: 4 },
        { date: '2023-01-05', count: 2 },
        { date: '2023-01-06', count: 5 },
        { date: '2023-01-07', count: 3 },
      ],
      newExperiences: [
        { date: '2023-01-01', count: 5 },
        { date: '2023-01-02', count: 8 },
        { date: '2023-01-03', count: 12 },
        { date: '2023-01-04', count: 7 },
        { date: '2023-01-05', count: 10 },
        { date: '2023-01-06', count: 15 },
        { date: '2023-01-07', count: 9 },
      ]
    };

    res.success(platformData, 'Platform overview data retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// Additional studio management functions for admin panel

// Get all studios with detailed information
const getAllStudios = async (req, res, next) => {
  try {
    const { limit = 10, page = 1, search, status } = req.query;
    const skip = (page - 1) * limit;
    
    let filter = {};
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }
    if (status) {
      switch(status) {
        case 'active':
          filter.isActive = true;
          filter.isSuspended = false;
          break;
        case 'suspended':
          filter.isSuspended = true;
          break;
        case 'pending':
          filter.isInviteAccepted = false;
          filter.isSuspended = false;
          break;
        default:
          break;
      }
    }

    const studios = await Studio.find(filter)
      .populate('owner', 'email username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Format the response
    const formattedStudios = studios.map(studio => ({
      id: studio._id,
      name: studio.name,
      subdomain: studio.subdomain,
      customDomain: studio.customDomain,
      owner: studio.owner ? studio.owner.email || studio.owner.username : studio.ownerEmail || 'No owner',
      ownerEmail: studio.ownerEmail,
      isInviteAccepted: studio.isInviteAccepted,
      isActive: studio.isActive,
      isSuspended: studio.isSuspended,
      isReactivated: studio.isReactivated,
      isOwnerReset: studio.isOwnerReset,
      createdAt: studio.createdAt,
      updatedAt: studio.updatedAt
    }));

    res.success({
      studios: formattedStudios,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: await Studio.countDocuments(filter)
      }
    }, 'Studios retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// Get studio details by ID
const getStudioDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    const studio = await Studio.findById(id)
      .populate('owner', 'email username')
      .populate('ownerHistory.ownerId', 'email username')
      .lean();

    if (!studio) {
      return res.status(404).json({
        success: false,
        message: 'Studio not found'
      });
    }

    // Format the response
    const formattedStudio = {
      id: studio._id,
      name: studio.name,
      subdomain: studio.subdomain,
      customDomain: studio.customDomain,
      description: studio.description,
      owner: studio.owner ? studio.owner.email || studio.owner.username : studio.ownerEmail || 'No owner',
      ownerEmail: studio.ownerEmail,
      ownerHistory: studio.ownerHistory.map(history => ({
        id: history.ownerId._id,
        email: history.email,
        removedAt: history.removedAt
      })),
      brandColor: studio.brandColor,
      logo: studio.logo,
      isActive: studio.isActive,
      isSuspended: studio.isSuspended,
      isReactivated: studio.isReactivated,
      isOwnerReset: studio.isOwnerReset,
      isInviteAccepted: studio.isInviteAccepted,
      inviteCode: studio.inviteCode,
      inviteCodeExpiresAt: studio.inviteCodeExpiresAt,
      isInviteExpired: studio.isInviteExpired,
      softCapacity: studio.softCapacity,
      createdAt: studio.createdAt,
      updatedAt: studio.updatedAt
    };

    res.success(formattedStudio, 'Studio details retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// Create a new studio (admin function)
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

// Update studio details
const updateStudio = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, brandColor, softCapacity } = req.body;

    const studio = await Studio.findById(id);
    if (!studio) {
      return res.status(404).json({
        success: false,
        message: 'Studio not found'
      });
    }

    // Update allowed fields
    if (name) studio.name = name;
    if (description) studio.description = description;
    if (brandColor) studio.brandColor = brandColor;
    if (softCapacity !== undefined) studio.softCapacity = softCapacity;

    await studio.save();
    
    res.success({ studio }, 'Studio updated successfully');
  } catch (error) {
    next(error);
  }
};

// Delete studio (soft delete or hard delete based on requirements)
const deleteStudio = async (req, res, next) => {
  try {
    const { id } = req.params;

    const studio = await Studio.findById(id);
    if (!studio) {
      return res.status(404).json({
        success: false,
        message: 'Studio not found'
      });
    }

    // For now, we'll deactivate the studio rather than delete it
    // In a real application, you might want to have a proper deletion process
    studio.isActive = false;
    await studio.save();
    
    res.success({ studio }, 'Studio deactivated successfully');
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
    const BASE_DOMAIN = process.env.BASE_DOMAIN || 'apb.in';
    const encodedEmail = encodeURIComponent(email);
    const encodedName = encodeURIComponent(name || '');
    const inviteLink = `https://${BASE_DOMAIN}/accept-invite?code=${inviteCode}&email=${encodedEmail}&name=${encodedName}`;
    
    // Update the invite with the generated link
    invite.generatedInvitelink = inviteLink;
    await invite.save();

    // Send the invite email with the invite link
    const emailResult = await sendUserInviteEmail(invite.email, invite.name, invite.inviteCode);
    
    if (!emailResult.success) {
      // If email sending fails, log the error but still return success since invite was created
      console.error('Failed to send invite email:', emailResult.error);
    } else {
      console.log(`Invite email sent successfully to: ${email}`);
    }

    res.success({ invite }, 'Invite created and sent successfully');
  } catch (error) {
    next(error);
  }
};

// Get all users/invites with their status
const getAllUsers = async (req, res, next) => {
  try {
    const { limit = 10, page = 1, search, status } = req.query;
    const skip = (page - 1) * limit;

    // Build invite filter (main source)
    const inviteFilter = {};
    if (search) {
      inviteFilter.email = { $regex: search, $options: 'i' };
    }
    if (status) {
      inviteFilter.status = status;
    }

    // Fetch invites with pagination
    const invites = await Invite.find(inviteFilter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Collect all invite emails to look up matching users
    const inviteEmails = invites.map(invite => invite.email);
    const users = await User.find({ email: { $in: inviteEmails } })
      .populate('studio', 'studioName')
      .lean();

    // Create a map for quick lookup
    const userMap = {};
    users.forEach(user => {
      userMap[user.email] = user;
    });

    // Merge invite and user data
    const combined = invites.map((invite, index) => {
      const user = userMap[invite.email];

      return {
        id: user?._id || invite._id,
        sno: skip + index + 1,
        name: user?.username || invite.name || 'N/A',
        email: invite.email,
        studioName: user?.studio?.studioName || 'Not Registered',
        status: user
          ? (user.isActive ? (user.studio && user.studio.isSuspended ? 'suspended' : 'active') : 'inactive')
          : invite.status || 'invited',
        createdAt: user?.createdAt || invite.createdAt,
        type: user ? 'user' : 'invite',
        inviteInfo: {
          id: invite._id,
          email: invite.email,
          name: invite.name,
          inviteCode: invite.inviteCode,
          status: invite.status,
          isInviteAccepted: invite.isInviteAccepted,
          createdAt: invite.createdAt,
        },
      };
    });

    // Total count for pagination (matching invites)
    const total = await Invite.countDocuments(inviteFilter);

    res.success(
      {
        users: combined,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
        },
      },
      'Invites and related users retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};


// Resend an invite
const resendInvite = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Try to find the invite by ID first
    let invite = await Invite.findById(id);

    // If not found by ID, try to find by user ID
    if (!invite) {
      const user = await User.findById(id);
      if (user) {
        // Look for invite by user's email
        invite = await Invite.findOne({ email: user.email });
      }
    }

    if (!invite) {
      return res.status(404).json({
        success: false,
        message: 'Invite not found for this user'
      });
    }

    // Validate that invite can be resent
    if (invite.isInviteAccepted) {
      return res.status(400).json({
        success: false,
        message: 'This invite has already been accepted'
      });
    }

    if (invite.isSuspended) {
      return res.status(400).json({
        success: false,
        message: 'This invite is suspended and cannot be resent'
      });
    }

    // Allow resend if status is 'expired' or 'invited'
    if (invite.status !== 'expired' && invite.status !== 'invited' && invite.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot resend invite with status: ${invite.status}`
      });
    }

    // Update the invite expiration time (extend by 7 days from now)
    invite.inviteCodeExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 1000); // 7 days
    invite.status = 'invited'; // Reset status to invited
    invite.isResended = true;
    await invite.save();

    // Generate the invite link
    const BASE_DOMAIN = process.env.BASE_DOMAIN || 'apb.in';
    const encodedEmail = encodeURIComponent(invite.email);
    const encodedName = encodeURIComponent(invite.name || '');
    const inviteLink = `https://${BASE_DOMAIN}/accept-invite?code=${invite.inviteCode}&email=${encodedEmail}&name=${encodedName}`;

    // Update the invite with the new link
    invite.generatedInvitelink = inviteLink;
    await invite.save();

    // Send the resend invite email with the invite link
    const emailResult = await sendResendInviteEmail(invite.email, invite.name, invite.inviteCode);

    if (!emailResult.success) {
      // If email sending fails, log the error but still return success since invite was updated
      console.error('Failed to send resend invite email:', emailResult.error);
    } else {
      console.log(`Resend invite email sent successfully to: ${invite.email}`);
    }

    res.success({ invite }, 'Invite resent successfully');
  } catch (error) {
    next(error);
  }
};

// Suspend a user
const suspendUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Try to find the user by ID
    let user = await User.findById(id);

    if (user) {
      // Suspend the user
      user.isActive = false;
      await user.save();

      // Suspend the associated studio if it exists
      if (user.studio) {
        const studio = await Studio.findById(user.studio);
        if (studio) {
          studio.isSuspended = true;
          await studio.save();
        }
      }

      // Suspend related invite (if any)
      const invite = await Invite.findOne({ email: user.email });
      if (invite) {
        invite.status = 'suspended';
        invite.isSuspended = true;
        await invite.save();
      }

      return res.success({ user }, 'User, associated studio, and invite suspended successfully');
    }

    // If not a user, try to find the invite directly by ID
    const invite = await Invite.findById(id);

    if (invite) {
      invite.status = 'suspended';
      invite.isSuspended = true;
      await invite.save();

      // Also suspend user if they exist for that invite email
      const relatedUser = await User.findOne({ email: invite.email });
      if (relatedUser) {
        relatedUser.isActive = false;
        await relatedUser.save();

        // Suspend studio if applicable
        if (relatedUser.studio) {
          const studio = await Studio.findById(relatedUser.studio);
          if (studio) {
            studio.isSuspended = true;
            await studio.save();
          }
        }
      }

      return res.success({ invite }, 'Invite and related user suspended successfully');
    }

    // If neither found
    return res.status(404).json({
      success: false,
      message: 'User or invite not found'
    });

  } catch (error) {
    next(error);
  }
};


// Reactivate a suspended user
const reactivateUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Try to find the user by ID
    let user = await User.findById(id);

    if (user) {
      // Reactivate the user
      user.isActive = true;
      await user.save();

      // Reactivate associated studio if it exists
      if (user.studio) {
        const studio = await Studio.findById(user.studio);
        if (studio) {
          studio.isSuspended = false;
          await studio.save();
        }
      }

      // Reactivate related invite (if any)
      const invite = await Invite.findOne({ email: user.email });
      if (invite) {
        invite.status = 'accepted';
        invite.isSuspended = false;
        await invite.save();
      }

      return res.success(
        { user },
        'User, associated studio, and invite reactivated successfully'
      );
    }

    // If not a user, try to find the invite directly by ID
    const invite = await Invite.findById(id);

    if (invite) {
      invite.status = 'invited';
      invite.isSuspended = false;
      await invite.save();

      // Also reactivate the related user if they exist
      const relatedUser = await User.findOne({ email: invite.email });
      if (relatedUser) {
        relatedUser.isActive = true;
        await relatedUser.save();

        // Reactivate studio if applicable
        if (relatedUser.studio) {
          const studio = await Studio.findById(relatedUser.studio);
          if (studio) {
            studio.isSuspended = false;
            await studio.save();
          }
        }
      }

      return res.success(
        { invite },
        'Invite and related user reactivated successfully'
      );
    }

    // If neither found
    return res.status(404).json({
      success: false,
      message: 'User or invite not found',
    });

  } catch (error) {
    console.error(error);
    next(error);
  }
};


// Change admin email
const changeAdminEmail = async (req, res, next) => {
  try {
    const { _id: userId } = req.user;
    const { newEmail, password } = req.body;

    // Validate required fields
    if (!newEmail || !password) {
      return res.status(400).json({
        success: false,
        message: 'New email and password are required'
      });
    }

    // Find the user
    const user = await User.findById(userId);
  
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find the studio and verify password against studio password
    let isPasswordValid = false;

    if (user.studio) {
      // If user has a studio, verify against studio password
      const studio = await Studio.findById(user.studio).select('+password');
      console.log('Verifying password for studio:', studio ? studio._id : 'No studio found');
      if (studio) {
        isPasswordValid = await studio.comparePassword(password);
      }
    }

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Check if new email already exists (case-insensitive)
    const existingUser = await User.findOne({ email: newEmail.toLowerCase() });
    if (existingUser && existingUser._id.toString() !== userId) {
      return res.status(400).json({
        success: false,
        message: 'Email already in use'
      });
    }

    // Update email
    user.email = newEmail.toLowerCase();
    await user.save();

    res.success(
      { user: { id: user._id, email: user.email } },
      'Email changed successfully'
    );
  } catch (error) {
    next(error);
  }
};

// Change admin password
const changeAdminPassword = async (req, res, next) => {
  try {
    const { _id: userId } = req.user;
    const { currentPassword, newPassword } = req.body;
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

    // Find the studio owned by the current user
    const studio = await Studio.findOne({ owner: userId });
    if (!studio) {
      return res.status(404).json({
        success: false,
        message: 'Studio not found for this user'
      });
    }

    // Verify current password
    const isPasswordValid = await studio.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Check if new password is same as current
    const isSamePassword = await studio.comparePassword(newPassword);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password'
      });
    }

    // Hash new password and update studio
    studio.password = newPassword; // The pre-save hook will hash this automatically
    await studio.save();

    res.success(
      { studio: { id: studio._id, name: studio.name } },
      'Password changed successfully'
    );
  } catch (error) {
    next(error);
  }
};

// Delete a user and associated studio
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Try to find the user by ID
    let user = await User.findById(id);

    if (user) {
      // Delete the associated studio if it exists
      if (user.studio) {
        await Studio.findByIdAndDelete(user.studio);
      }

      // Delete the user
      await User.findByIdAndDelete(id);

      // Delete any invites associated with this user's email
      await Invite.deleteMany({ email: user.email });

      return res.success(
        { user: { id: user._id, email: user.email } },
        'User, associated studio, and invites deleted successfully'
      );
    }

    // If not a user, try to find the invite directly by ID
    const invite = await Invite.findById(id);

    if (invite) {
      // Find and delete the related user if they exist
      const relatedUser = await User.findOne({ email: invite.email });
      if (relatedUser) {
        // Delete the associated studio if it exists
        if (relatedUser.studio) {
          await Studio.findByIdAndDelete(relatedUser.studio);
        }
        // Delete the user
        await User.findByIdAndDelete(relatedUser._id);
      }

      // Delete the invite
      await Invite.findByIdAndDelete(id);

      return res.success(
        { invite: { id: invite._id, email: invite.email } },
        'Invite and related user deleted successfully'
      );
    }

    // If neither found
    return res.status(404).json({
      success: false,
      message: 'User or invite not found'
    });

  } catch (error) {
    next(error);
  }
};

// Make a studio user into an admin
const makeAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    // Only super admin can make users admins
    if (!currentUser.isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only super admin can promote users to admin'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Can only promote studio users to admin
    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'User is already an admin'
      });
    }

    user.role = 'admin';
    await user.save();

    res.success({ user }, 'User promoted to admin successfully');
  } catch (error) {
    next(error);
  }
};

// Remove admin role from a user
const removeAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    // Only super admin can remove admin roles
    if (!currentUser.isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only super admin can remove admin privileges'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Cannot remove admin from super admin
    if (user.isSuperAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove admin role from the super admin'
      });
    }

    // Can only demote admin users
    if (user.role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'User is not an admin'
      });
    }

    user.role = 'studio';
    await user.save();

    res.success({ user }, 'User demoted to studio user successfully');
  } catch (error) {
    next(error);
  }
};

// Set a user as the super admin
const setSuperAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    // Only current super admin can change super admin
    if (!currentUser.isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only super admin can designate another super admin'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // User must be an admin to become super admin
    if (user.role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'User must be an admin to become super admin'
      });
    }

    // If user is already super admin, return success
    if (user.isSuperAdmin) {
      return res.success({ user }, 'User is already super admin');
    }

    // Remove super admin status from current super admin
    await User.updateOne(
      { isSuperAdmin: true, _id: { $ne: id } },
      { isSuperAdmin: false }
    );

    // Set new super admin
    user.isSuperAdmin = true;
    await user.save();

    res.success({ user }, 'Super admin designation updated successfully');
  } catch (error) {
    next(error);
  }
};

// Reset a user's password (super admin only)
const resetUserPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    const currentUser = req.user;

    // Only super admin can reset passwords
    if (!currentUser.isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only super admin can reset user passwords'
      });
    }

    // Validate password
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Cannot reset super admin's password
    if (user.isSuperAdmin && user._id.toString() !== currentUser._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Cannot reset the super admin password'
      });
    }

    // Reset the password on the associated studio if it exists
    if (user.studio) {
      const studio = await Studio.findById(user.studio).select('+password');
      if (studio) {
        studio.password = newPassword;
        await studio.save();
      }
    }

    res.success({ user }, 'Password reset successfully');
  } catch (error) {
    next(error);
  }
};

export {
  getDashboardStats,
  getRecentStudios,
  getRecentExperiences,
  getPlatformOverview,
  getAllStudios,
  getStudioDetails,
  createStudio,
  updateStudio,
  deleteStudio,
  createInvite,
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
};
