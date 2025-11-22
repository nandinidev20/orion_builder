import Experience from '../model/Experience.js';
import Track from '../model/Track.js';
import Studio from '../model/Studio.js';
import mongoose from 'mongoose';
import { ValidationError } from '../utils/ApiError.js';
import { loggerInstance } from '../middleware/logger.js';
import fs from 'node:fs';
import { pipeline } from 'node:stream/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import jwt from 'jsonwebtoken'; // Import jsonwebtoken for JWT implementation
import { createReadStream, existsSync } from 'fs';
import { randomBytes, createHmac } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a new experience
const createExperience = async (req, res, next) => {
  try {
    const studioId = req.user.studio;
    
    if (!studioId) {
      return next(new ValidationError('Studio ID is required'));
    }

    // Debug logging to see what's in req.body and req.file
    console.log('Create Experience - req.body:', req.body);
    console.log('Create Experience - req.file:', req.file);
    console.log('Brand color from req.body:', req.body.brandColor);

    // With multipart form data, fields come through req.body
    const {
      title,
      description,
      startDate,
      endDate,
      timeLimit,
      softCapacity,
      brandColor,
      trackVisibility,
      tracks: tracksString // This will come as a string from FormData.append()
    } = req.body;

    if (!title || !startDate || !endDate) {
      return next(new ValidationError('Title, start date, and end date are required'));
    }

    // Validate brandColor format if provided
    if (brandColor && !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(brandColor)) {
      console.log('Invalid brand color format received:', brandColor);
      return next(new ValidationError('Brand color must be a valid hex color format (e.g., #ff5733)'));
    }

    // Validate date range
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {
      return next(new ValidationError('Start date must be before end date'));
    }

    // Parse tracks if provided as a string
    let tracks = [];
    if (tracksString) {
      try {
        tracks = typeof tracksString === 'string' ? JSON.parse(tracksString) : tracksString;
      } catch (parseError) {
        return next(new ValidationError('Invalid tracks data format'));
      }
    }

    // Create the experience
    const experience = new Experience({
      title,
      description: description || '',
      studioId,
      startDate: start,
      endDate: end,
      timeLimit: timeLimit || null,
      softCapacity: softCapacity || null,
      brandColor: brandColor || '#4f46e5',
      trackVisibility: trackVisibility || 'show-all', // Default to 'show-all'
      tracks: [] // We'll add tracks after creating them
    });

    // If logo was uploaded, add it to the experience
    if (req.file) {
      experience.logo = `/uploads/experiences/${req.file.filename}`;
    }

    await experience.save();

    // Create tracks if provided
    if (tracks && tracks.length > 0) {
      const trackPromises = tracks.map((track, index) => {
        const newTrack = new Track({
          title: track.title,
          experienceId: experience._id,
          order: index + 1,
          // For now, we're just storing the file names; in a real implementation, files would be uploaded separately
          audioFile: track.audioFile || null,
          videoFile: track.videoFile || null,
          imageFile: track.imageFile || null,
          duration: track.duration || '0:00', // This would be calculated from the actual audio file
          progressRule: track.progressRule || 'tap',
          unlockCode: track.progressRule === 'code' ? track.unlockCode : null
        });
        return newTrack.save();
      });

      const createdTracks = await Promise.all(trackPromises);
      
      // Update the experience with the track IDs
      experience.tracks = createdTracks.map(track => track._id);
      await experience.save();
    }

    res.success(experience, 'Experience created successfully', 201);
  } catch (error) {
    next(error);
  }
};

// Get all experiences for a studio
const getExperiences = async (req, res, next) => {
  try {
    const studioId = req.user.studio;
    
    if (!studioId) {
      return next(new ValidationError('Studio ID is required'));
    }

    const { page = 1, limit = 10, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // Build filter
    let filter = { studioId };
    if (status) {
      filter.status = status;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Get experiences with pagination
    const experiences = await Experience.find(filter)
      .sort(sort)
      .limit(parseInt(limit) * 1)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    // Get total count for pagination
    const total = await Experience.countDocuments(filter);

    // Format the response
    const formattedExperiences = experiences.map(exp => ({
      id: exp._id,
      title: exp.title,
      description: exp.description,
      startDate: exp.startDate,
      endDate: exp.endDate,
      status: exp.status,
      trackVisibility: exp.trackVisibility,
      createdAt: exp.createdAt,
      updatedAt: exp.updatedAt,
      isActive: exp.isActive,
      duration: exp.duration,
      analytics: {
        totalViews: exp.analytics?.totalViews || 0,
        uniqueVisitors: exp.analytics?.uniqueVisitors || 0,
        completionRate: exp.analytics?.completionRate || 0
      }
    }));

    res.success({
      experiences: formattedExperiences,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }, 'Experiences retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// Get a specific experience by ID
const getExperienceById = async (req, res, next) => {
  try {
    const studioId = req.user.studio;
    const { id } = req.params;
    
    if (!studioId) {
      return next(new ValidationError('Studio ID is required'));
    }

    const experience = await Experience.findOne({title: id, studioId: studioId})
      .populate('tracks')
      .lean();

    if (!experience) {
      return next(new ValidationError('Experience not found'));
    }

    // Ensure the experience belongs to the user's studio
    if (experience.studioId.toString() !== studioId.toString()) {
      return next(new ValidationError('Access denied. Experience does not belong to your studio'));
    }

    // Format the response
    const formattedExperience = {
      id: experience._id,
      title: experience.title,
      description: experience.description,
      studioId: experience.studioId,
      startDate: experience.startDate,
      endDate: experience.endDate,
      timeLimit: experience.timeLimit,
      softCapacity: experience.softCapacity,
      brandColor: experience.brandColor,
      logo: experience.logo,
      status: experience.status,
      trackVisibility: experience.trackVisibility,
      tracks: experience.tracks.map(track => ({
        id: track._id,
        title: track.title,
        order: track.order,
        audioFile: track.audioFile,
        videoFile: track.videoFile,
        imageFile: track.imageFile,
        duration: track.duration,
        progressRule: track.progressRule,
        unlockCode: track.progressRule === 'code' ? track.unlockCode : null,
        analytics: {
          plays: track.analytics?.plays || 0,
          completions: track.analytics?.completions || 0,
          avgCompletionTime: track.analytics?.avgCompletionTime || '0m 0s'
        }
      })),
      analytics: {
        totalViews: experience.analytics?.totalViews || 0,
        uniqueVisitors: experience.analytics?.uniqueVisitors || 0,
        completionRate: experience.analytics?.completionRate || 0,
        avgSessionTime: experience.analytics?.avgSessionTime || '0m 0s'
      },
      createdAt: experience.createdAt,
      updatedAt: experience.updatedAt,
      isActive: experience.isActive,
      duration: experience.duration
    };

    res.success(formattedExperience, 'Experience retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// Update an experience
const updateExperience = async (req, res, next) => {
  try {
    const studioId = req.user.studio;
    const { id } = req.params;
    
    if (!studioId) {
      return next(new ValidationError('Studio ID is required'));
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new ValidationError('Invalid experience ID'));
    }

    // Debug logging to see what's in req.body and req.file for updates
    console.log('Update Experience - req.body:', req.body);
    console.log('Update Experience - req.file:', req.file);
    console.log('Brand color from req.body for update:', req.body.brandColor);

    const experience = await Experience.findById(id);

    if (!experience) {
      return next(new ValidationError('Experience not found'));
    }

    // Ensure the experience belongs to the user's studio
    if (experience.studioId.toString() !== studioId.toString()) {
      return next(new ValidationError('Access denied. Experience does not belong to your studio'));
    }

    // Validate brandColor format if provided
    if (req.body.brandColor && !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(req.body.brandColor)) {
      console.log('Invalid brand color format received for update:', req.body.brandColor);
      return next(new ValidationError('Brand color must be a valid hex color format (e.g., #ff5733)'));
    }

    // Update fields
    const updateFields = ['title', 'description', 'startDate', 'endDate', 'timeLimit', 'softCapacity', 'brandColor', 'trackVisibility', 'status'];
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        experience[field] = req.body[field];
      }
    });

    // Handle logo update
    if (req.file) {
      experience.logo = `/uploads/experiences/${req.file.filename}`;
    }

    // Validate date range if dates were updated
    if (req.body.startDate || req.body.endDate) {
      const start = new Date(experience.startDate);
      const end = new Date(experience.endDate);
      if (start > end) {
        return next(new ValidationError('Start date must be before end date'));
      }
    }

    await experience.save();

    res.success(experience, 'Experience updated successfully');
  } catch (error) {
    next(error);
  }
};

// Delete an experience
const deleteExperience = async (req, res, next) => {
  try {
    const studioId = req.user.studio;
    const { id } = req.params;
    
    if (!studioId) {
      return next(new ValidationError('Studio ID is required'));
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new ValidationError('Invalid experience ID'));
    }

    const experience = await Experience.findById(id);

    if (!experience) {
      return next(new ValidationError('Experience not found'));
    }

    // Ensure the experience belongs to the user's studio
    if (experience.studioId.toString() !== studioId.toString()) {
      return next(new ValidationError('Access denied. Experience does not belong to your studio'));
    }

    // Delete associated tracks
    await Track.deleteMany({ experienceId: id });

    // Delete the experience
    await experience.deleteOne();

    res.success(null, 'Experience deleted successfully');
  } catch (error) {
    next(error);
 }
};

// Publish an experience
const publishExperience = async (req, res, next) => {
 try {
    const studioId = req.user.studio;
    const { id } = req.params;
    
    if (!studioId) {
      return next(new ValidationError('Studio ID is required'));
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new ValidationError('Invalid experience ID'));
    }

    const experience = await Experience.findById(id);

    if (!experience) {
      return next(new ValidationError('Experience not found'));
    }

    // Ensure the experience belongs to the user's studio
    if (experience.studioId.toString() !== studioId.toString()) {
      return next(new ValidationError('Access denied. Experience does not belong to your studio'));
    }

    // Check if experience has tracks
    if (!experience.tracks || experience.tracks.length === 0) {
      return next(new ValidationError('Cannot publish experience without tracks'));
    }

    experience.status = 'published';
    await experience.save();

    res.success(experience, 'Experience published successfully');
  } catch (error) {
    next(error);
  }
};

// Archive an experience
const archiveExperience = async (req, res, next) => {
  try {
    const studioId = req.user.studio;
    const { id } = req.params;
    
    if (!studioId) {
      return next(new ValidationError('Studio ID is required'));
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new ValidationError('Invalid experience ID'));
    }

    const experience = await Experience.findById(id);

    if (!experience) {
      return next(new ValidationError('Experience not found'));
    }

    // Ensure the experience belongs to the user's studio
    if (experience.studioId.toString() !== studioId.toString()) {
      return next(new ValidationError('Access denied. Experience does not belong to your studio'));
    }

    experience.status = 'archived';
    await experience.save();

    res.success(experience, 'Experience archived successfully');
 } catch (error) {
    next(error);
 }
};

// Get a public experience by ID (for guest access)
const getPublicExperienceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    

    const experience = await Experience.findOne({title: id})
      .populate('tracks')
      .populate({
        path: 'studioId',
        select: 'name logo brandColor' // Only select the fields we need
      })
      .lean();

    if (!experience) {
      return next(new ValidationError('Experience not found'));
    }

    // Only allow access to published experiences
    if (experience.status !== 'published') {
      return next(new ValidationError('Experience is not published'));
    }
console.log(experience.tracks)
      // Format the response for public access (include unlock code as requested)
      const formattedExperience = {
        id: experience._id,
        title: experience.title,
        studioName: experience.studioId?.name || 'Studio Name',
        brandColor: experience.studioId?.brandColor || experience.brandColor,
        logo: experience.studioId?.logo || experience.logo, // Use the stored path directly
        description: experience.description,
        trackVisibility: experience.trackVisibility,
        // Format tracks without direct file URLs for security
        tracks: experience.tracks.map(track => ({
          id: track._id,
          title: track.title,
          duration: track.duration,
          // Instead of direct URLs, we'll provide a secure access endpoint
          audioUrl: `/api/experiences/${id}/tracks/${track._id}/stream`,
          imageUrl: track.imageFile || null, // Use the stored path directly to avoid duplication
          videoUrl: track.videoFile || null, // Use the stored path directly to avoid duplication
          progressRule: track.progressRule,
          hasUnlockCode: track.progressRule === 'code', // Indicate if there's a code
          unlockCode: track.progressRule === 'code' ? track.unlockCode : null // Expose the actual code when progressRule is 'code'
        }))
      };

      console.log(formattedExperience)

    res.success(formattedExperience, 'Public experience retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// Validate unlock code for a track
const validateUnlockCode = async (req, res, next) => {
  try {
    const { id, trackId } = req.params;
    const { code } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(trackId)) {
      return next(new ValidationError('Invalid experience or track ID'));
    }

    if (!code) {
      return next(new ValidationError('Unlock code is required'));
    }

    // Verify that the track belongs to the experience and the experience is published
    const experience = await Experience.findById(id).lean();
    if (!experience || experience.status !== 'published') {
      return next(new ValidationError('Experience not found or not published'));
    }

    const track = await Track.findOne({ _id: trackId, experienceId: id }).lean();
    if (!track) {
      return next(new ValidationError('Track not found'));
    }

    // Check if the track has a progress rule of 'code' and validate the code
    if (track.progressRule !== 'code') {
      return next(new ValidationError('This track does not require an unlock code'));
    }

    if (track.unlockCode !== code) {
      return next(new ValidationError('Invalid unlock code'));
    }

    // Code is valid, return success
    res.success({ 
      codeValid: true 
    }, 'Unlock code validated successfully');
  } catch (error) {
    next(error);
  }
};

// Validate track access and generate temporary access token
const validateTrackAccess = async (req, res, next) => {
  try {
    const { id, trackId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(trackId)) {
      return next(new ValidationError('Invalid experience or track ID'));
    }

    // Verify that the track belongs to the experience and the experience is published
    const experience = await Experience.findById(id).lean();
    if (!experience || experience.status !== 'published') {
      return next(new ValidationError('Experience not found or not published'));
    }

    const track = await Track.findOne({ _id: trackId, experienceId: id }).lean();
    if (!track) {
      return next(new ValidationError('Track not found'));
    }

    // In a real implementation, you would generate a temporary access token here
    // For now, we'll return a simple success response
    // This would be where you implement your session/token system
    res.success({ 
      accessValid: true, 
      expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes from now
    }, 'Track access validated successfully');
  } catch (error) {
    next(error);
  }
};

// Stream track content with access validation (deprecated but kept for backward compatibility)
const streamTrackContent = async (req, res, next) => {
  try {
    const { id, trackId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(trackId)) {
      return next(new ValidationError('Invalid experience or track ID'));
    }

    // Verify that the track belongs to the experience and the experience is published
    const experience = await Experience.findById(id).lean();
    if (!experience || experience.status !== 'published') {
      return next(new ValidationError('Experience not found or not published'));
    }

    const track = await Track.findOne({ _id: trackId, experienceId: id }).lean();
    if (!track || !track.audioFile) {
      return next(new ValidationError('Track not found or has no audio file'));
    }

    // In a real implementation, you would validate the access token here
    // For now, we'll proceed with the streaming assuming access is valid

    // --- FIX ---
    // Construct the file path for the audio file
    // We assume this controller file is in a folder like /server/controllers/
    // path.join(__dirname, '..') goes up one level to your 'server' root directory.
    const serverRoot = path.join(__dirname, '..'); 

    // track.audioFile is "/uploads/experiences/audio/filename.mp3"
    // We must remove the leading "/" for path.join to work correctly
    const relativeFilePath = track.audioFile.startsWith('/') 
      ? track.audioFile.substring(1) 
      : track.audioFile;

    // This now correctly joins: [C:\...\admin\server] + [uploads\experiences\audio\filename.mp3]
    const filePath = path.join(serverRoot, relativeFilePath);
    // --- END FIX ---
    
    console.log('Corrected file path:', filePath);

    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      return next(new ValidationError('Audio file not found on server'));
    }

    // Get file stats for streaming headers
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    // Determine the content type based on file extension
    const filename = path.basename(filePath);
    let contentType = 'application/octet-stream';
    if (filename.endsWith('.m3u8')) {
      contentType = 'application/vnd.apple.mpegurl';
    } else if (filename.endsWith('.ts')) {
      contentType = 'video/MP2T';
    } else if (filename.endsWith('.mp3')) {
      contentType = 'audio/mpeg';
    } else if (filename.endsWith('.wav')) {
      contentType = 'audio/wav';
    } else if (filename.endsWith('.aac')) {
      contentType = 'audio/aac';
    } else if (filename.endsWith('.flac')) {
      contentType = 'audio/flac';
    } else if (filename.endsWith('.ogg') || filename.endsWith('.oga')) {
      contentType = 'audio/ogg';
    } else if (filename.endsWith('.mp4')) {
      contentType = 'video/mp4';
    } else if (filename.endsWith('.webm')) {
      contentType = 'video/webm';
    } else if (filename.endsWith('.avi')) {
      contentType = 'video/avi';
    } else if (filename.endsWith('.mov')) {
      contentType = 'video/quicktime';
    } else if (filename.endsWith('.wmv')) {
      contentType = 'video/x-ms-wmv';
    } else if (filename.endsWith('.m4a')) {
      contentType = 'audio/mp4';
    }

    if (range) {
      // Handle partial content requests (for seeking in audio player)
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;

      const file = fs.createReadStream(filePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType,
      };

      res.writeHead(206, head);
      file.pipe(res);
    } else {
      // Full file request
      const head = {
        'Content-Length': fileSize,
        'Content-Type': contentType,
      };

      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (error) {
    next(error);
  }
};

// Serve encryption key for HLS streaming (protected by Cloudflare WAF)
const getEncryptionKey = async (req, res, next) => {
  try {
    const { track: trackId } = req.query; // e.g., "track_abc"

    // Prevent hackers from trying to access other files
    if (!trackId || trackId.includes('..') || trackId.includes('/')) {
      return next(new ValidationError('Invalid track identifier'));
    }
    
    // Builds a safe path to the private key
    // This assumes your file is in /server/controllers/, so '..' goes to /server/
    const keyPath = path.join(__dirname, '..', 'private-keys', `${trackId}.key`);

    if (fs.existsSync(keyPath)) {
      res.sendFile(keyPath); // Send the key
    } else {
      return next(new ValidationError('Key not found'));
    }
  } catch (error) {
    next(error);
  }
};

// This is your new "Ticket Booth" function
const getStreamAccess = async (req, res, next) => {
    try {
        const { id, trackId } = req.params;
        
        // --- (Your validation code is still good) ---
        if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(trackId)) {
            return next(new ValidationError('Invalid experience or track ID'));
        }
        const experience = await Experience.findById(id).lean();
        if (!experience || experience.status !== 'published') {
            return next(new ValidationError('Experience not found or not published'));
        }
        const track = await Track.findOne({ _id: trackId, experienceId: id }).lean();
        if (!track) {
            return next(new ValidationError('Track not found'));
        }
        // --- (End of validation) ---

        // --- THIS IS THE NEW PART ---

        // 1. Define what this token can access.
        //    This prevents a user from using a token for one track
        //    to access a *different* track.
        // Use the fileId if available (for HLS), otherwise fall back to the original audio file
        const manifestFile = track.hlsPath || track.audioFile;
        const payload = {
            trackId: track._id,
            keyId: track.fileId || track.keyId || track._id, // Use fileId or track ID as keyId for key access
            manifestFile: manifestFile
        };

        // 2. Create the "ticket" (JWT)
        const secret = process.env.JWT_SECRET || "my-secret-string-for-jwt"; // Use environment variable if available
        const token = jwt.sign(payload, secret, {
            expiresIn: '10m' // Make it expire in 10 minutes
        });

        // 3. Send the manifest URL and the token to the frontend
        // If it's an HLS stream, use the index.m3u8 file; otherwise use the original audio file
        const isHls = track.hlsPath && track.hlsPath.includes('.m3u8');
        let manifestUrl;
        if (isHls) {
            // Use the fileId for the track directory in the URL
            // The fileId should be the same as the track._id (MongoDB ID)
            const fileName = track.hlsPath.split('/').pop(); // Get the index.m3u8 part
            const trackIdFromPath = track.fileId || track._id; // Use fileId if available, otherwise use track ID
            manifestUrl = `/api/media/${trackIdFromPath}/${fileName}`;
        } else {
            // For non-HLS files, we'll use the original approach but with the new route structure
            // Extract track ID from the audio file path or use the track ID directly
            const trackId = track._id; // Use the MongoDB track ID
            const fileName = track.audioFile ? track.audioFile.split('/').pop() : 'default.mp3';
            manifestUrl = `/api/media/${trackId}/${fileName}`;
        }

        res.success({
            manifestUrl: manifestUrl,
            token: token
        });

    } catch (error) {
        next(error);
    }
};

// ---
// We also need the "Bouncer" function that serves the files
// ---

/* const serveMediaFile = async (req, res, next) => {
    try {
        const { file } = req.params;
        const { token } = req.query; // Get token from URL query

        if (!token) {
            return next(new ValidationError('Access token is required', 401));
        }

        // 1. Check the "ticket" (JWT)
        const secret = "my-secret-string-for-jwt";
        let payload;
        try {
            payload = jwt.verify(token, secret);
        } catch (err) {
            return next(new ValidationError('Invalid or expired token', 403));
        }

        // 2. Check if the file requested is allowed by this token
        // This is a CRITICAL security check
        if (file !== payload.manifestFile && !file.startsWith(payload.keyId)) {
             return next(new ValidationError('Token is not valid for this file', 403));
        }

        // 3. Safely build the file path
        // This prevents "directory traversal" (../../) attacks
        const safeFile = path.basename(file);
        const filePath = path.join(
            __dirname,
            '..', // Go up from /controllers
            'uploads', // Go into /uploads
            safeFile
        );

        // 4. Check if file exists and send it
        if (fs.existsSync(filePath)) {
            res.sendFile(filePath);
        } else {
            return next(new ValidationError('File not found', 404));
        }

    } catch (error) {
        next(error);
    }
}; */


const serveMediaFile = async (req, res, next) => {
    try {
        const { trackId, filename } = req.params;
        const { token } = req.query;

        if (!token) {
            return next(new ValidationError('Access token is required', 401));
        }

        // JWT validation
        const secret = "my-secret-string-for-jwt";
        let payload;
        try {
            payload = jwt.verify(token, secret);
        } catch (err) {
            return next(new ValidationError('Invalid or expired token', 403));
        }

        // Extract the track ID from the token to validate against the URL parameter
        const tokenTrackId = payload.trackId;
        if (!tokenTrackId) {
            return next(new ValidationError('Invalid token: missing track ID', 403));
        }

        // Security check: ensure the track ID in the URL matches the one in the token
        if (trackId !== tokenTrackId) {
            return next(new ValidationError('Token is not valid for this track', 403));
        }

        // Validate the filename parameter to prevent directory traversal attacks
        const safeFilename = path.basename(filename);
        const hlsDir = path.join(__dirname, '..', 'media', 'hls', trackId);
        const filePath = path.join(hlsDir, safeFilename);

        // Security check: ensure the resolved path is within the expected HLS directory
        const normalizedPath = path.resolve(filePath);
        const normalizedHlsDir = path.resolve(hlsDir);
        if (!normalizedPath.startsWith(normalizedHlsDir + path.sep) && normalizedPath !== normalizedHlsDir) {
            return next(new ValidationError('Invalid file path', 403));
        }

        // Check if the file exists
        if (!existsSync(filePath)) {
            return next(new ValidationError('File not found', 404));
        }

        // Determine the content type based on file extension
        let contentType = 'application/octet-stream';
        if (safeFilename.endsWith('.m3u8')) {
            contentType = 'application/vnd.apple.mpegurl';
        } else if (safeFilename.endsWith('.ts')) {
            contentType = 'video/MP2T';
        } else if (safeFilename.endsWith('.mp3')) {
            contentType = 'audio/mpeg';
        } else if (safeFilename.endsWith('.wav')) {
            contentType = 'audio/wav';
        } else if (safeFilename.endsWith('.aac')) {
            contentType = 'audio/aac';
        } else if (safeFilename.endsWith('.flac')) {
            contentType = 'audio/flac';
        } else if (safeFilename.endsWith('.ogg') || safeFilename.endsWith('.oga')) {
            contentType = 'audio/ogg';
        } else if (safeFilename.endsWith('.mp4')) {
            contentType = 'video/mp4';
        } else if (safeFilename.endsWith('.webm')) {
            contentType = 'video/webm';
        } else if (safeFilename.endsWith('.avi')) {
            contentType = 'video/avi';
        } else if (safeFilename.endsWith('.mov')) {
            contentType = 'video/quicktime';
        } else if (safeFilename.endsWith('.wmv')) {
            contentType = 'video/x-ms-wmv';
        } else if (safeFilename.endsWith('.m4a')) {
            contentType = 'audio/mp4';
        }

        // Set appropriate headers for HLS streaming
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes

        // Stream the file to the client
        const readStream = createReadStream(filePath);
        readStream.pipe(res);

        // Handle stream errors
        readStream.on('error', (err) => {
            console.error(`Error streaming file ${filePath}:`, err);
            if (!res.headersSent) {
                next(new ValidationError('Error reading file', 500));
            }
        });

    } catch (error) {
        next(error);
    }
};

// Key derivation function
const deriveKeyFromJWT = (jwtPayload, fileIdentifier) => {
    // Use multiple JWT fields for stronger key derivation
    const keyMaterial = `${jwtPayload.sub || jwtPayload.userId}-${jwtPayload.keyId}-${fileIdentifier}-${jwtPayload.iat}`;
    
    // Use environment-specific master key
    const masterKey = process.env.ENCRYPTION_MASTER_KEY || 'dev-master-key-change-in-production';
    
    return createHmac('sha256', masterKey)
        .update(keyMaterial)
        .digest();
};
// ---
// We also need the Key Server
// ---

const getEncryptionKeyWithAuth = async (req, res, next) => {
    try {
        const { track: keyId } = req.query; // This will be the track ID from the URL parameter
        const { token } = req.query;

        if (!token) {
            return next(new ValidationError('Access token is required', 401));
        }

        // 1. Check the "ticket" (JWT)
        const secret = process.env.JWT_SECRET || "my-secret-string-for-jwt";
        let payload;
        try {
            payload = jwt.verify(token, secret);
        } catch (err) {
            return next(new ValidationError('Invalid or expired token', 403));
        }
        
        // 2. Check if the key requested matches the track in the token
        // The keyId in the query parameter should match the trackId or keyId in the token
        if (keyId !== payload.trackId && keyId !== payload.keyId) {
            return next(new ValidationError('Token is not valid for this key', 403));
        }

        // 3. Safely build the key path - the key file is named after the track ID
        const safeKeyId = path.basename(keyId);
        // The key file in the HLS directory has the same name as the track ID
        const keyPath = path.join(__dirname, '..', 'media', 'hls', safeKeyId, `${safeKeyId}.key`);

        if (fs.existsSync(keyPath)) {
            res.sendFile(keyPath);
        } else {
            return next(new ValidationError('Key not found', 404));
        }
    } catch (error) {
        next(error);
    }
};

// Check if an experience title already exists (for uniqueness validation)
const checkTitleUniqueness = async (req, res, next) => {
  try {
    const studioId = req.user.studio;
    const { title } = req.query;

    if (!studioId) {
      return next(new ValidationError('Studio ID is required'));
    }

    if (!title) {
      return next(new ValidationError('Title is required'));
    }

    // Check if an experience with this title already exists for the studio
    const existingExperience = await Experience.findOne({ title: title.trim(), studioId });

    res.success({ unique: !existingExperience }, 'Title uniqueness checked successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Check if experience name/title is available for the current studio
 * GET /api/studio/check-experience-name/:title
 * Protected endpoint - requires authentication
 */
const checkExperienceNameAvailability = async (req, res, next) => {
  try {
    const studioId = req.user.studio;
    const { title } = req.params;

    // Validate input
    if (!title || title.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Experience title is required'
      });
    }

    const trimmedTitle = title.trim();

    // Validate length
    if (trimmedTitle.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Experience title must be at least 3 characters long'
      });
    }

    if (trimmedTitle.length > 200) {
      return res.status(400).json({
        success: false,
        message: 'Experience title must not exceed 200 characters'
      });
    }

    // Check if title exists for this studio (case-insensitive)
    const existingExperience = await Experience.findOne({
      studioId,
      title: { $regex: `^${trimmedTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' }
    }).select('_id');

    if (existingExperience) {
      return res.success(
        { available: false },
        'An experience with this title already exists in your studio'
      );
    }

    res.success(
      { available: true },
      'Experience title is available'
    );
  } catch (error) {
    next(error);
  }
};

export {
  createExperience,
  getExperiences,
  getExperienceById,
  updateExperience,
  deleteExperience,
  publishExperience,
  archiveExperience,
  getPublicExperienceById,
  validateUnlockCode,
  validateTrackAccess,
  streamTrackContent,
  getEncryptionKey, // Original function for backward compatibility
  getStreamAccess, // This replaces streamTrackContentSecure
  serveMediaFile,
  getEncryptionKeyWithAuth, // New function for JWT-authenticated key access
  checkTitleUniqueness, // New function for title uniqueness validation
  checkExperienceNameAvailability // New function for real-time name validation
};
