import {
  createNewExperience,
  updateNewExperience,
  getNewExperiences,
  getNewExperienceById,
  getNewExperienceBySlug,
  deleteNewExperience
} from '../services/newExperienceService.js';
import { generateSlug } from '../utils/slugGenerator.js';
import { progressService } from '../services/progressService.js';
import { ValidationError } from '../utils/ApiError.js';
import { loggerInstance } from '../middleware/logger.js';
import fs from 'node:fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a new experience with HLS processing for stage files
const createNewExperienceController = async (req, res, next) => {
  try {
    const studioId = req.user.studio;
    
    if (!studioId) {
      return next(new ValidationError('Studio ID is required'));
    }

    // Debug logging to see what's in req.body
    console.log('Create New Experience - req.body:', req.body);
    console.log('Create New Experience - req.files:', req.files);

    // Parse experience data from req.body, handling potential JSON strings
    let experienceData;
    if (typeof req.body.experienceData === 'string') {
      experienceData = JSON.parse(req.body.experienceData);
    } else {
      // If experienceData is not in a nested object, the entire body might be the experience data
      experienceData = { ...req.body };
      
      // Remove file-related fields that are not part of the experience data
      delete experienceData.icon;
      delete experienceData.backgroundImage;
    }

    // Handle file uploads - req.files is an ARRAY, not an object
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      req.files.forEach(file => {
        const fieldName = file.fieldname;

        // Handle icon upload
        if (fieldName === 'icon') {
          // Use forward slashes for consistency across platforms
          experienceData.icon = `/uploads/experiences/images/${file.filename}`;
        }

        // Handle background image upload
        if (fieldName === 'backgroundImage') {
          // Use forward slashes for consistency across platforms
          experienceData.backgroundImage = `/uploads/experiences/images/${file.filename}`;
        }

        // Handle stage files - format: 'stages.0.uploadedFile'
        const stageFileMatch = fieldName.match(/^stages\.(\d+)\.(.+)$/);
        if (stageFileMatch) {
          const stageIndex = parseInt(stageFileMatch[1]);
          const field = stageFileMatch[2];
          
          // Ensure stages array exists
          if (!experienceData.stages) {
            experienceData.stages = [];
          }
          
          if (experienceData.stages[stageIndex]) {
            // Update the specific field in the stage with the uploaded file path
            // Use forward slashes for consistency across platforms
            // Determine the correct subdirectory based on the file's MIME type
            let subDir = 'images'; // default to images
            const fileExt = path.extname(file.originalname).toLowerCase();

            // Check by extension first (more reliable for documents)
            if (['.txt', '.pdf', '.docx', '.doc'].includes(fileExt)) {
              subDir = 'documents';
            } else if (file.mimetype.startsWith('audio/')) {
              subDir = 'audio';
            } else if (file.mimetype.startsWith('video/')) {
              subDir = 'video';
            } else if (file.mimetype.startsWith('image/')) {
              subDir = 'images';
            } else if (file.mimetype === 'application/pdf' ||
                       file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                       file.mimetype.includes('text') || file.mimetype.includes('word')) {
              subDir = 'documents';
            } else {
              subDir = 'other';
            }
            experienceData.stages[stageIndex][field] = `/uploads/experiences/${subDir}/${file.filename}`;
          }
        }
      });
    }

    // Create the new experience with HLS processing
    const experience = await createNewExperience(studioId, experienceData);

    res.success(experience, 'Experience created successfully', 201);
  } catch (error) {
    console.error('Error in createNewExperienceController:', error);
    next(error);
  }
};

// Get all experiences for a studio
const getNewExperiencesController = async (req, res, next) => {
  try {
    const studioId = req.user.studio;
    
    if (!studioId) {
      return next(new ValidationError('Studio ID is required'));
    }

    const { page = 1, limit = 10, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const result = await getNewExperiences(studioId, { page, limit, status, sortBy, sortOrder });

    // Format the response
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
    }, 'Experiences retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// Get a specific experience by ID
const getNewExperienceByIdController = async (req, res, next) => {
  try {
    const studioId = req.user.studio;
    const { id } = req.params;
    
    if (!studioId) {
      return next(new ValidationError('Studio ID is required'));
    }

    const experience = await getNewExperienceById(id, studioId);

      // Format the response
    const formattedExperience = {
      id: experience._id,
      slug: experience.slug || generateSlug(experience.title),
      title: experience.title,
      subtitle: experience.subtitle,
      description: experience.description,
      studioId: experience.studioId,
      startDate: experience.startDate,
      endDate: experience.endDate,
      completionTitle: experience.completionTitle,
      completionDescription: experience.completionDescription,
      // Basic Information
      icon: experience.icon,
      iconName: experience.iconName,
      // Styling options
      primaryColor: experience.primaryColor,
      secondaryTextColor: experience.secondaryTextColor || experience.secondaryColor || '#6b7280',
      backgroundColor: experience.backgroundColor,
      textColor: experience.textColor,
      buttonColor: experience.buttonColor,
      buttonTextColor: experience.buttonTextColor,
      borderColor: experience.borderColor,
      backgroundImage: experience.backgroundImage,
      fontFamily: experience.fontFamily,
      headingSize: experience.headingSize,
      padding: experience.padding,
      margin: experience.margin,
      borderRadius: experience.borderRadius,
      borderWidth: experience.borderWidth,
      // New Border Colors
      loadingScreenBorderColor: experience.loadingScreenBorderColor,
      mediaPlayerBorderColor: experience.mediaPlayerBorderColor,
      mediaPlayerControlsBorderColor: experience.mediaPlayerControlsBorderColor,
      // New Media Player Settings
      playerBackgroundColor: experience.playerBackgroundColor,
      playerBackgroundOpacity: experience.playerBackgroundOpacity,
      playerControllersColor: experience.playerControllersColor,
      audioPlayerButtonColor: experience.audioPlayerButtonColor,
      waveColor: experience.waveColor,
      // Settings configuration
      allowComments: experience.allowComments,
      autoPlayMedia: experience.autoPlayMedia,
      visibility: experience.visibility,
      emailNotifications: experience.emailNotifications,
      pushNotifications: experience.pushNotifications,
      passwordProtection: experience.passwordProtection,
      password: experience.password,
      twoFactorAuth: experience.twoFactorAuth,
      trackInteractions: experience.trackInteractions,
      shareAnonymousData: experience.shareAnonymousData,
      // Player Control Settings
      showPlayPauseButton: experience.showPlayPauseButton,
      showBackButton: experience.showBackButton,
      showNextButton: experience.showNextButton,
      enableLoopTracks: experience.enableLoopTracks,
      enableShuffleTracks: experience.enableShuffleTracks,
      // Stage Configuration Settings
      enableStageNavigation: experience.enableStageNavigation,
      autoAdvanceStage: experience.autoAdvanceStage,
      status: experience.status,
      stages: experience.stages.map(stage => ({
        id: stage.id,
        position: stage.position,
        type: stage.type,
        title: stage.title,
        description: stage.description,
        buttonSettings: stage.buttonSettings,
        buttonName: stage.buttonName,
        codeValue: stage.codeValue,
        uploadedFile: stage.uploadedFile,
        pastedText: stage.pastedText,
        hlsPath: stage.hlsPath,
        fileId: stage.fileId,
        createdAt: stage.createdAt,
        updatedAt: stage.updatedAt
      })),
      analytics: {
        totalViews: experience.analytics?.totalViews || 0,
        uniqueVisitors: experience.analytics?.uniqueVisitors || 0,
        completionRate: experience.analytics?.completionRate || 0,
        avgSessionTime: experience.analytics?.avgSessionTime || '0m 0s'
      },
      createdAt: experience.createdAt,
      updatedAt: experience.updatedAt,
      isActive: experience.isActive
    };

    res.success(formattedExperience, 'Experience retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// Get a specific experience by slug (public endpoint, no auth required)
const getNewExperienceBySlugController = async (req, res, next) => {
  try {
    const { slug } = req.params;

    if (!slug) {
      return next(new ValidationError('Slug is required'));
    }

    const experience = await getNewExperienceBySlug(slug);

    // Format the response (same as getNewExperienceByIdController)
    const formattedExperience = {
      id: experience._id,
      slug: experience.slug || generateSlug(experience.title),
      title: experience.title,
      subtitle: experience.subtitle,
      description: experience.description,
      studioId: experience.studioId._id || experience.studioId,
      studioSubdomain: experience.studioId?.subdomain || null,
      startDate: experience.startDate,
      endDate: experience.endDate,
      completionTitle: experience.completionTitle,
      completionDescription: experience.completionDescription,
      // Basic Information
      icon: experience.icon,
      iconName: experience.iconName,
      // Styling options
      primaryColor: experience.primaryColor,
      secondaryTextColor: experience.secondaryTextColor || experience.secondaryColor || '#6b7280',
      backgroundColor: experience.backgroundColor,
      textColor: experience.textColor,
      buttonColor: experience.buttonColor,
      buttonTextColor: experience.buttonTextColor,
      borderColor: experience.borderColor,
      backgroundImage: experience.backgroundImage,
      fontFamily: experience.fontFamily,
      headingSize: experience.headingSize,
      padding: experience.padding,
      margin: experience.margin,
      borderRadius: experience.borderRadius,
      borderWidth: experience.borderWidth,
      // New Border Colors
      loadingScreenBorderColor: experience.loadingScreenBorderColor,
      mediaPlayerBorderColor: experience.mediaPlayerBorderColor,
      mediaPlayerControlsBorderColor: experience.mediaPlayerControlsBorderColor,
      // New Media Player Settings
      playerBackgroundColor: experience.playerBackgroundColor,
      playerBackgroundOpacity: experience.playerBackgroundOpacity,
      playerControllersColor: experience.playerControllersColor,
      audioPlayerButtonColor: experience.audioPlayerButtonColor,
      waveColor: experience.waveColor || '#3b82f6',
      // Player Control Settings
      showPlayPauseButton: experience.showPlayPauseButton,
      showBackButton: experience.showBackButton,
      showNextButton: experience.showNextButton,
      enableLoopTracks: experience.enableLoopTracks,
      enableShuffleTracks: experience.enableShuffleTracks,
      // Stage Configuration Settings
      enableStageNavigation: experience.enableStageNavigation,
      autoAdvanceStage: experience.autoAdvanceStage,
      // Settings Configuration
      allowComments: experience.allowComments,
      autoPlayMedia: experience.autoPlayMedia,
      visibility: experience.visibility,
      emailNotifications: experience.emailNotifications,
      pushNotifications: experience.pushNotifications,
      passwordProtection: experience.passwordProtection,
      password: experience.password,
      twoFactorAuth: experience.twoFactorAuth,
      trackInteractions: experience.trackInteractions,
      shareAnonymousData: experience.shareAnonymousData,
      // Stages
      stages: (experience.stages || []).map(stage => ({
        id: stage.id,
        position: stage.position,
        type: stage.type,
        title: stage.title,
        description: stage.description,
        buttonSettings: stage.buttonSettings,
        buttonName: stage.buttonName,
        codeValue: stage.codeValue,
        uploadedFile: stage.uploadedFile,
        pastedText: stage.pastedText,
        hlsPath: stage.hlsPath,
        fileId: stage.fileId,
        createdAt: stage.createdAt,
        updatedAt: stage.updatedAt
      })),
      analytics: {
        totalViews: experience.analytics?.totalViews || 0,
        uniqueVisitors: experience.analytics?.uniqueVisitors || 0,
        completionRate: experience.analytics?.completionRate || 0,
        avgSessionTime: experience.analytics?.avgSessionTime || '0m 0s'
      },
      createdAt: experience.createdAt,
      updatedAt: experience.updatedAt,
      isActive: experience.isActive
    };

    res.success(formattedExperience, 'Experience retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// Update an experience
const updateNewExperienceController = async (req, res, next) => {
  try {
    const studioId = req.user.studio;
    const { id } = req.params;
    
    if (!studioId) {
      return next(new ValidationError('Studio ID is required'));
    }

    // Debug logging to see what's in req.body for updates
    console.log('Update New Experience - req.body:', req.body);
    console.log('Update New Experience - req.files:', req.files);

    // Parse update data from req.body, handling potential JSON strings
    let updateData;
    if (typeof req.body.experienceData === 'string') {
      updateData = JSON.parse(req.body.experienceData);
    } else {
      // If experienceData is not in a nested object, the entire body might be the update data
      updateData = { ...req.body };
      
      // Remove file-related fields that are not part of the experience data
      delete updateData.icon; // This will be handled separately if it's a file
      delete updateData.backgroundImage; // This will be handled separately if it's a file
    }

    // Handle file uploads - req.files is an ARRAY, not an object
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      req.files.forEach(file => {
        const fieldName = file.fieldname;

        // Handle icon upload
        if (fieldName === 'icon') {
          // Use forward slashes for consistency across platforms
          updateData.icon = `/uploads/experiences/images/${file.filename}`;
        }

        // Handle background image upload
        if (fieldName === 'backgroundImage') {
          // Use forward slashes for consistency across platforms
          updateData.backgroundImage = `/uploads/experiences/images/${file.filename}`;
        }

        // Handle stage files - format: 'stages.0.uploadedFile'
        const stageFileMatch = fieldName.match(/^stages\.(\d+)\.(.+)$/);
        if (stageFileMatch) {
          const stageIndex = parseInt(stageFileMatch[1]);
          const field = stageFileMatch[2];

          // Ensure stages array exists
          if (!updateData.stages) {
            updateData.stages = [];
          }

          if (updateData.stages[stageIndex]) {
            // Update the specific field in the stage with the uploaded file path
            // Use forward slashes for consistency across platforms
            // Determine the correct subdirectory based on the file's MIME type
            let subDir = 'images'; // default to images
            const fileExt = path.extname(file.originalname).toLowerCase();

            // Check by extension first (more reliable for documents)
            if (['.txt', '.pdf', '.docx', '.doc'].includes(fileExt)) {
              subDir = 'documents';
            } else if (file.mimetype.startsWith('audio/')) {
              subDir = 'audio';
            } else if (file.mimetype.startsWith('video/')) {
              subDir = 'video';
            } else if (file.mimetype.startsWith('image/')) {
              subDir = 'images';
            } else if (file.mimetype === 'application/pdf' ||
                       file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                       file.mimetype.includes('text') || file.mimetype.includes('word')) {
              subDir = 'documents';
            } else {
              subDir = 'other';
            }
            updateData.stages[stageIndex][field] = `/uploads/experiences/${subDir}/${file.filename}`;
          }
        }
      });
    }

    const experience = await updateNewExperience(id, studioId, updateData);

    res.success(experience, 'Experience updated successfully');
  } catch (error) {
    console.error('Error in updateNewExperienceController:', error);
    next(error);
  }
};

// Delete an experience
const deleteNewExperienceController = async (req, res, next) => {
  try {
    const studioId = req.user.studio;
    const { id } = req.params;
    
    if (!studioId) {
      return next(new ValidationError('Studio ID is required'));
    }

    await deleteNewExperience(id, studioId);

    res.success(null, 'Experience deleted successfully');
  } catch (error) {
    next(error);
  }
};

// Get stream access for a stage during editing (authenticated)
const getStageStreamAccessController = async (req, res, next) => {
  try {
    const studioId = req.user.studio;
    const { id, stageId } = req.params;

    if (!studioId) {
      return next(new ValidationError('Studio ID is required'));
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new ValidationError('Invalid experience ID'));
    }

    const NewExperience = (await import('../model/NewExperience.js')).default;

    const experience = await NewExperience.findOne({
      _id: id,
      studioId: studioId
    }).lean();

    if (!experience) {
      return next(new ValidationError('Experience not found or you do not have access to it'));
    }

    const stage = experience.stages.find(s => s.id === stageId);
    if (!stage) {
      return next(new ValidationError('Stage not found'));
    }

    const manifestFile = stage.uploadedFile || null;
    const payload = {
      stageId: stage.id,
      experienceId: experience._id,
      mediaType: stage.type,
      manifestFile: manifestFile
    };

    const secret = process.env.JWT_SECRET || "my-secret-string-for-jwt";
    const token = jwt.sign(payload, secret, {
      expiresIn: '10m'
    });

    let manifestUrl;
    if (stage.uploadedFile) {
      const fileName = stage.uploadedFile.split('/').pop();
      manifestUrl = `/api/media-v2/${stage.id}/${fileName}`;
    } else {
      const mediaExt = stage.type === 'audio' ? 'mp3' : stage.type === 'video' ? 'mp4' : 'txt';
      manifestUrl = `/api/media-v2/${stage.id}/stream.${mediaExt}`;
    }

    res.success({
      manifestUrl: manifestUrl,
      token: token,
      mediaType: stage.type,
      uploadedFile: stage.uploadedFile
    }, 'Stream access granted');

  } catch (error) {
    next(error);
  }
};

// Get upload progress using Server-Sent Events (SSE)
const getProgressController = async (req, res, next) => {
  const { id } = req.params;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const sendProgress = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const initialProgress = progressService.getProgress(id);
  if (initialProgress) {
    sendProgress(initialProgress);
  } else {
    sendProgress({ status: 'pending', uploadProgress: 0, encodingProgress: 0 });
  }

  const progressListener = (data) => {
    sendProgress(data);
    if (data.status === 'complete') {
      res.end();
    }
  };

  progressService.on(`progress:${id}`, progressListener);

  req.on('close', () => {
    progressService.removeListener(`progress:${id}`, progressListener);
    res.end();
  });
};

export {
  createNewExperienceController,
  getNewExperiencesController,
  getNewExperienceByIdController,
  getNewExperienceBySlugController,
  updateNewExperienceController,
  deleteNewExperienceController,
  getStageStreamAccessController,
  getProgressController
};
