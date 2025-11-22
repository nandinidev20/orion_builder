import Track from '../model/Track.js';
import Experience from '../model/Experience.js';
import mongoose from 'mongoose';
import { ValidationError } from '../utils/ApiError.js';
import { processTrackForHls } from '../services/hlsTranscodingService.js';

// Upload track files
const uploadTrackFiles = async (req, res, next) => {
  try {
    const { experienceId, trackId, title, progressRule, unlockCode, trackType, textContent, keyId } = req.body;
    
    // Validate experience ID
    if (!experienceId || !mongoose.Types.ObjectId.isValid(experienceId)) {
      return next(new ValidationError('Valid experience ID is required'));
    }
    
    // Check if the user has access to this experience
    const experience = await Experience.findById(experienceId);
    if (!experience) {
      return next(new ValidationError('Experience not found'));
    }
    
    if (experience.studioId.toString() !== req.user.studio.toString()) {
      return next(new ValidationError('Access denied. Experience does not belong to your studio'));
    }
    
    // Prepare file paths from uploaded files
    const files = {};
    if (req.files) {
      if (req.files.audioFile) {
        files.audioFile = `/uploads/experiences/audio/${req.files.audioFile[0].filename}`;
      }
      if (req.files.videoFile) {
        files.videoFile = `/uploads/experiences/video/${req.files.videoFile[0].filename}`;
      }
      if (req.files.imageFile) {
        files.imageFile = `/uploads/experiences/images/${req.files.imageFile[0].filename}`;
      }
    }
    
    let track;
    
    if (trackId) {
      // Update existing track
      const updateData = {
        ...files,
        trackType: trackType || 'audio',
        title: title || undefined,
        progressRule: progressRule || undefined,
        unlockCode: progressRule === 'code' ? unlockCode : null,
        textContent: trackType === 'text' ? textContent : undefined,
        keyId: keyId || undefined
      };
      
      // Only add duration if it's provided, otherwise don't update it
      if (req.body.duration) {
        updateData.duration = req.body.duration;
      } else if ((trackType || 'audio') !== 'text') {
        // For non-text tracks, ensure duration is set to a default if not provided
        updateData.duration = '0:00';
      } else {
        // For text tracks, remove duration if it exists
        updateData.duration = undefined;
      }
      
      track = await Track.findOneAndUpdate(
        { _id: trackId, experienceId: experienceId },
        updateData,
        { new: true }
      );
    } else {
      // Create new track
      const allTracks = await Track.find({ experienceId }).sort({ order: -1 });
      const nextOrder = allTracks.length > 0 ? allTracks[0].order + 1 : 1;
      
      track = new Track({
        title: title || 'New Track',
        experienceId: experienceId,
        order: nextOrder,
        trackType: trackType || 'audio',
        progressRule: progressRule || 'tap',
        unlockCode: progressRule === 'code' ? unlockCode : null,
        duration: trackType !== 'text' ? '0:00' : undefined, // Duration not required for text tracks
        textContent: trackType === 'text' ? textContent : undefined,
        keyId: keyId || undefined,
        ...files
      });
      
      await track.save();
      
      // Add track to experience
      experience.tracks.push(track._id);
      await experience.save();
    }
    
    if (!track) {
      return next(new ValidationError('Failed to create or update track'));
    }
    
    // Trigger HLS transcoding if an audio or video file was uploaded
    if (files.audioFile || files.videoFile) {
      // Determine the input file path
      const inputPath = files.audioFile || files.videoFile;
      const absoluteInputPath = `.${inputPath}`; // Convert to absolute path relative to project root
      
      // Process the track for HLS in the background
      processTrackForHls(track._id.toString(), absoluteInputPath, process.env.CDN_HOST || 'localhost')
        .catch(error => {
          console.error(`Error processing HLS for track ${track._id}:`, error.message);
          // Don't send error response here as the upload was successful
        });
    }
    
    res.success(track, 'Track files uploaded successfully', 201);
  } catch (error) {
    next(error);
  }
};


// Get a specific track by ID
const getTrackById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new ValidationError('Invalid track ID'));
    }
    
    const track = await Track.findById(id);
    
    if (!track) {
      return next(new ValidationError('Track not found'));
    }
    
    // Check if the user has access to this track's experience
    const experience = await Experience.findById(track.experienceId);
    if (!experience || experience.studioId.toString() !== req.user.studio.toString()) {
      return next(new ValidationError('Access denied'));
    }
    
    res.success(track, 'Track retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// Update a track
const updateTrack = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new ValidationError('Invalid track ID'));
    }
    
    const track = await Track.findById(id);
    
    if (!track) {
      return next(new ValidationError('Track not found'));
    }
    
    // Check if the user has access to this track's experience
    const experience = await Experience.findById(track.experienceId);
    if (!experience || experience.studioId.toString() !== req.user.studio.toString()) {
      return next(new ValidationError('Access denied'));
    }
    
    // Update track with new files if provided
    if (req.file) {
      track.audioFile = `/uploads/experiences/audio/${req.file.filename}`;
    }
    
    // Update other fields from req.body if provided
    if (req.body.title) track.title = req.body.title;
    if (req.body.progressRule) track.progressRule = req.body.progressRule;
    if (req.body.progressRule === 'code' && req.body.unlockCode) {
      track.unlockCode = req.body.unlockCode;
    }
    
    await track.save();
    
    res.success(track, 'Track updated successfully');
  } catch (error) {
    next(error);
  }
};

// Delete a track
const deleteTrack = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new ValidationError('Invalid track ID'));
    }
    
    const track = await Track.findById(id);
    
    if (!track) {
      return next(new ValidationError('Track not found'));
    }
    
    // Check if the user has access to this track's experience
    const experience = await Experience.findById(track.experienceId);
    if (!experience || experience.studioId.toString() !== req.user.studio.toString()) {
      return next(new ValidationError('Access denied'));
    }
    
    // Remove track from experience
    experience.tracks.pull(track._id);
    await experience.save();
    
    // Delete the track
    await track.deleteOne();
    
    res.success(null, 'Track deleted successfully');
  } catch (error) {
    next(error);
  }
};

export {
  uploadTrackFiles,
  getTrackById,
  updateTrack,
  deleteTrack
};
