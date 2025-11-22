import NewExperience from '../model/NewExperience.js';
import Studio from '../model/Studio.js';
import { transcodeToHls } from './hlsTranscodingService.js';
import { ValidationError } from '../utils/ApiError.js';
import { loggerInstance } from '../middleware/logger.js';
import { progressService } from './progressService.js';
import { generateSlug, generateUniqueSlug } from '../utils/slugGenerator.js';
import { processExperienceDates } from '../utils/dateTimeHelper.js';
import fs from 'node:fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Process all stage files with HLS transcoding
const processStageFiles = async (stages, experienceId = null) => {
  const processedStages = [];

  // Filter stages that need processing - only those with uploadedFile but no existing hlsPath
  // Stages that already have hlsPath/fileId have been processed before and should not be re-processed
  const stagesToProcess = stages.filter(s => {
    // Only process if:
    // 1. uploadedFile exists AND
    // 2. NO existing hlsPath (hasn't been processed yet)
    if (!s.uploadedFile) return false;
    if (s.hlsPath) return false; // Already processed

    const fileExtension = path.extname(s.uploadedFile).toLowerCase();
    return ['.mp3', '.wav', '.aac', '.flac', '.ogg', '.mp4', '.avi', '.mov', '.wmv'].includes(fileExtension);
  }).length;

  if (experienceId && stagesToProcess > 0) {
    progressService.setTotalStages(experienceId, stagesToProcess);
  }

  for (let index = 0; index < stages.length; index++) {
    const stage = stages[index];
    const processedStage = { ...stage };

    // Only process if uploadedFile exists AND there's no existing hlsPath (not already processed)
    if (stage.uploadedFile && !stage.hlsPath) {
      try {
        // Extract the file extension to determine if it's a media file
        const fileExtension = path.extname(stage.uploadedFile).toLowerCase();
        const isMediaFile = ['.mp3', '.wav', '.aac', '.flac', '.ogg', '.mp4', '.avi', '.mov', '.wmv'].includes(fileExtension);

        if (isMediaFile) {
          // Generate a unique fileId for this stage
          const fileId = stage.id || Date.now().toString();

          // Resolve the absolute path to the uploaded file
          // stage.uploadedFile is a relative path like /uploads/experiences/audio/experience-xxx.mp3
          // Remove leading slash if present, then join with project root
          const filePath = stage.uploadedFile.startsWith('/') ? stage.uploadedFile.slice(1) : stage.uploadedFile;
          const absoluteFilePath = path.resolve(path.join(__dirname, '..', '..', filePath));

          // Check if the file exists before attempting transcoding
          if (!fs.existsSync(absoluteFilePath)) {
            console.error(`Uploaded file not found: ${absoluteFilePath}`);
            processedStage.hlsPath = null;
            processedStage.fileId = null;
          } else {
            // Process the file with HLS transcoding using the absolute path
            const onProgress = experienceId ? (data) => {
              progressService.updateEncodingProgress(experienceId, index, data.progress);
            } : null;

            const hlsPath = await transcodeToHls(absoluteFilePath, fileId, onProgress);

            // Update the stage with HLS path and file ID
            processedStage.hlsPath = hlsPath;
            processedStage.fileId = fileId;

            if (experienceId) {
              progressService.completeStage(experienceId);
            }
          }
        }
      } catch (error) {
        console.error(`Error processing stage file for stage ${stage.id}:`, error.message);
        // Don't fail the entire process if one file fails, just log the error
        processedStage.hlsPath = null;
        processedStage.fileId = null;
      }
    }

    processedStages.push(processedStage);
  }

  return processedStages;
};

// Create a new experience with HLS processing for stage files
const createNewExperience = async (studioId, experienceData) => {
  try {
    console.log('Creating new experience with data:', experienceData);
    // Validate required fields
    if (!studioId) {
      throw new ValidationError('Studio ID is required');
    }
    if (!experienceData.title || !experienceData.startDate || !experienceData.endDate) {
      throw new ValidationError('Title, start date, and end date are required');
    }

    // Process dates - combine date and time fields into proper ISO datetime strings
    const processedData = processExperienceDates(experienceData);

    // Validate date range
    const start = new Date(processedData.startDate);
    const end = new Date(processedData.endDate);
    if (start > end) {
      throw new ValidationError('Start date must be before end date');
    }

    // Generate slug from title
    const baseSlug = generateSlug(experienceData.title);
    const slug = await generateUniqueSlug(baseSlug, async (testSlug) => {
      const exists = await NewExperience.findOne({ slug: testSlug });
      return !!exists;
    });

    // Create the new experience with processed stages (without saving yet)
    const newExperience = new NewExperience({
      ...processedData,
      studioId,
      slug,
      stages: []
    });

    // Get the actual experience ID that will be used
    const experienceId = newExperience._id.toString();
    progressService.startTracking(experienceId);

    // Process stage files with HLS transcoding
    let processedStages = [];
    if (experienceData.stages && experienceData.stages.length > 0) {
      processedStages = await processStageFiles(experienceData.stages, experienceId);
    }

    // Add processed stages to the experience
    newExperience.stages = processedStages;

    // Save the experience to the database
    const savedExperience = await newExperience.save();
    progressService.completeTracking(experienceId);

    return savedExperience;
  } catch (error) {
    console.error('Error creating new experience:', error.message);
    throw error;
  }
};

// Update an existing experience with HLS processing for stage files
const updateNewExperience = async (experienceId, studioId, updateData) => {
  try {
    // Validate required fields
    if (!experienceId || !studioId) {
      throw new ValidationError('Experience ID and Studio ID are required');
    }

    // Find the existing experience
    const existingExperience = await NewExperience.findById(experienceId);
    if (!existingExperience) {
      throw new ValidationError('Experience not found');
    }

    // Ensure the experience belongs to the user's studio
    if (existingExperience.studioId.toString() !== studioId.toString()) {
      throw new ValidationError('Access denied. Experience does not belong to your studio');
    }

    // Check if the update includes new file uploads that require processing
    // Compare the updated stages with existing stages to identify actual new uploads
    let hasNewFileUploads = false;
    if (updateData.stages && updateData.stages.length > 0) {
      // Create a map of existing stages by ID for easy comparison
      const existingStagesMap = {};
      existingExperience.stages.forEach(stage => {
        existingStagesMap[stage.id] = stage;
      });

      // Check each updated stage
      for (const updatedStage of updateData.stages) {
        const existingStage = existingStagesMap[updatedStage.id];
        if (existingStage) {
          // If the stage exists, check if the uploadedFile has changed
          if (updatedStage.uploadedFile && existingStage.uploadedFile !== updatedStage.uploadedFile) {
            // Check if it's a new upload (not just a URL)
            if (typeof updatedStage.uploadedFile === 'string' && !updatedStage.uploadedFile.startsWith('http') && !updatedStage.uploadedFile.startsWith('blob:')) {
              hasNewFileUploads = true;
              break;
            }
          }
        } else {
          // If the stage doesn't exist in the original, it's a new stage
          if (updatedStage.uploadedFile && typeof updatedStage.uploadedFile === 'string' && !updatedStage.uploadedFile.startsWith('http') && !updatedStage.uploadedFile.startsWith('blob:')) {
            hasNewFileUploads = true;
            break;
          }
        }
      }
    }

    // Start progress tracking only if there are new file uploads
    if (hasNewFileUploads) {
      progressService.startTracking(experienceId);
    }

    // Process stage files with HLS transcoding only if there are new file uploads
    if (hasNewFileUploads && updateData.stages && updateData.stages.length > 0) {
      updateData.stages = await processStageFiles(updateData.stages, experienceId);
    }

    // Process dates - combine date and time fields if they were updated
    const processedData = processExperienceDates(updateData);

    // Update fields
    Object.keys(processedData).forEach(key => {
      if (processedData[key] !== undefined) {
        existingExperience[key] = processedData[key];
      }
    });

    // Validate date range if dates were updated
    if (processedData.startDate || processedData.endDate) {
      const start = new Date(existingExperience.startDate);
      const end = new Date(existingExperience.endDate);
      if (start > end) {
        throw new ValidationError('Start date must be before end date');
      }
    }

    // Save the updated experience
    const updatedExperience = await existingExperience.save();
    
    // Complete progress tracking only if there were new file uploads
    if (hasNewFileUploads) {
      progressService.completeTracking(experienceId);
    }

    return updatedExperience;
  } catch (error) {
    console.error('Error updating new experience:', error.message);
    // Only complete tracking if it was started
    if (updateData.stages && updateData.stages.length > 0) {
      // Re-check if there were new uploads to determine if tracking was started
      const existingExperience = await NewExperience.findById(experienceId);
      if (existingExperience) {
        const existingStagesMap = {};
        existingExperience.stages.forEach(stage => {
          existingStagesMap[stage.id] = stage;
        });

        let hasNewFileUploads = false;
        for (const updatedStage of updateData.stages) {
          const existingStage = existingStagesMap[updatedStage.id];
          if (existingStage) {
            if (updatedStage.uploadedFile && existingStage.uploadedFile !== updatedStage.uploadedFile) {
              if (typeof updatedStage.uploadedFile === 'string' && !updatedStage.uploadedFile.startsWith('http') && !updatedStage.uploadedFile.startsWith('blob:')) {
                hasNewFileUploads = true;
                break;
              }
            }
          } else {
            if (updatedStage.uploadedFile && typeof updatedStage.uploadedFile === 'string' && !updatedStage.uploadedFile.startsWith('http') && !updatedStage.uploadedFile.startsWith('blob:')) {
              hasNewFileUploads = true;
              break;
            }
          }
        }

        if (hasNewFileUploads) {
          progressService.completeTracking(experienceId);
        }
      }
    }
    throw error;
  }
};

// Get all experiences for a studio
const getNewExperiences = async (studioId, queryOptions = {}) => {
  try {
    if (!studioId) {
      throw new ValidationError('Studio ID is required');
    }

    const { page = 1, limit = 10, status, sortBy = 'createdAt', sortOrder = 'desc' } = queryOptions;

    // Build filter
    let filter = { studioId };
    if (status) {
      filter.status = status;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Get experiences with pagination
    const experiences = await NewExperience.find(filter)
      .sort(sort)
      .limit(parseInt(limit) * 1)
      .skip((parseInt(page) - 1) * parseInt(limit));

    // Get total count for pagination
    const total = await NewExperience.countDocuments(filter);

    return {
      experiences,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    };
  } catch (error) {
    console.error('Error getting new experiences:', error.message);
    throw error;
  }
};

// Get a specific experience by ID
const getNewExperienceById = async (experienceId, studioId) => {
  try {
    if (!experienceId || !studioId) {
      throw new ValidationError('Experience ID and Studio ID are required');
    }

    const experience = await NewExperience.findById(experienceId);

    if (!experience) {
      throw new ValidationError('Experience not found');
    }

    // Ensure the experience belongs to the user's studio
    if (experience.studioId.toString() !== studioId.toString()) {
      throw new ValidationError('Access denied. Experience does not belong to your studio');
    }

    return experience;
  } catch (error) {
    console.error('Error getting new experience by ID:', error.message);
    throw error;
  }
};

// Get a specific experience by slug (public endpoint, no auth required)
const getNewExperienceBySlug = async (slug) => {
  try {
    if (!slug) {
      throw new ValidationError('Slug is required');
    }

    const experience = await NewExperience.findOne({ slug }).populate('studioId', 'subdomain');

    if (!experience) {
      throw new ValidationError('Experience not found');
    }

    return experience;
  } catch (error) {
    console.error('Error getting new experience by slug:', error.message);
    throw error;
  }
};

// Delete an experience
const deleteNewExperience = async (experienceId, studioId) => {
  try {
    if (!experienceId || !studioId) {
      throw new ValidationError('Experience ID and Studio ID are required');
    }

    const experience = await NewExperience.findById(experienceId);

    if (!experience) {
      throw new ValidationError('Experience not found');
    }

    // Ensure the experience belongs to the user's studio
    if (experience.studioId.toString() !== studioId.toString()) {
      throw new ValidationError('Access denied. Experience does not belong to your studio');
    }

    // Delete the experience
    await experience.deleteOne();

    return true;
  } catch (error) {
    console.error('Error deleting new experience:', error.message);
    throw error;
  }
};

export {
  createNewExperience,
  updateNewExperience,
  getNewExperiences,
  getNewExperienceById,
  getNewExperienceBySlug,
  deleteNewExperience
};
