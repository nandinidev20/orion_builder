import NewExperience from '../model/NewExperience.js';
import Studio from '../model/Studio.js';
import mongoose from 'mongoose';
import { ValidationError } from '../utils/ApiError.js';
import { loggerInstance } from '../middleware/logger.js';
import fs from 'node:fs';
import { pipeline } from 'node:stream/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { createReadStream, existsSync } from 'fs';
import { randomBytes, createHmac } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get a public experience by ID (NewExperience model with stages)
const getPublicExperienceByIdV2 = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const experience = await NewExperience.findOne({ title: id })
      .populate({
        path: 'studioId',
        select: 'name logo brandColor'
      })
      .lean();

    if (!experience) {
      return next(new ValidationError('Experience not found'));
    }

    // Only allow access to non-expired experiences
    if (experience.status === 'expired') {
      return next(new ValidationError('Experience has expired'));
    }

    // Format the response for public access
    const formattedExperience = {
      id: experience._id,
      title: experience.title,
      subtitle: experience.subtitle,
      description: experience.description,
      studioName: experience.studioId?.name || 'Studio Name',
      primaryColor: experience.primaryColor,
      secondaryColor: experience.secondaryColor,
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
      icon: experience.icon,
      iconName: experience.iconName,
      logo: experience.studioId?.logo || null,
      allowComments: experience.allowComments,
      autoPlayMedia: experience.autoPlayMedia,
      emailNotifications: experience.emailNotifications,
      pushNotifications: experience.pushNotifications,
      passwordProtection: experience.passwordProtection,
      twoFactorAuth: experience.twoFactorAuth,
      trackInteractions: experience.trackInteractions,
      shareAnonymousData: experience.shareAnonymousData,
      showPlayPauseButton: experience.showPlayPauseButton,
      showBackButton: experience.showBackButton,
      showNextButton: experience.showNextButton,
      enableLoopTracks: experience.enableLoopTracks,
      enableShuffleTracks: experience.enableShuffleTracks,
      enableStageNavigation: experience.enableStageNavigation,
      autoAdvanceStage: experience.autoAdvanceStage,
      playerBackgroundColor: experience.playerBackgroundColor,
      playerBackgroundOpacity: experience.playerBackgroundOpacity,
      playerControllersColor: experience.playerControllersColor,
      audioPlayerButtonColor: experience.audioPlayerButtonColor,
      loadingScreenBorderColor: experience.loadingScreenBorderColor,
      mediaPlayerBorderColor: experience.mediaPlayerBorderColor,
      mediaPlayerControlsBorderColor: experience.mediaPlayerControlsBorderColor,
      completionTitle: experience.completionTitle,
      completionDescription: experience.completionDescription,
      analytics: experience.analytics,
      // Format stages without direct file URLs for security
      stages: experience.stages.map(stage => ({
        id: stage.id,
        position: stage.position,
        type: stage.type,
        title: stage.title,
        description: stage.description,
        buttonSettings: stage.buttonSettings,
        buttonName: stage.buttonName,
        // Instead of direct URLs, we'll provide a secure access endpoint
        mediaUrl: `/api/experiences/${id}/stages/${stage.id}/stream`,
        uploadedFile: stage.uploadedFile || null,
        pastedText: stage.pastedText || null,
        hasUnlockCode: stage.buttonSettings === 'code',
        unlockCode: stage.buttonSettings === 'code' ? stage.codeValue : null,
        createdAt: stage.createdAt,
        updatedAt: stage.updatedAt
      }))
    };

    res.success(formattedExperience, 'Public experience retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// Validate unlock code for a stage
const validateUnlockCodeV2 = async (req, res, next) => {
  try {
    const { id, stageId } = req.params;
    const { code } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new ValidationError('Invalid experience ID'));
    }

    if (!code) {
      return next(new ValidationError('Unlock code is required'));
    }

    // Verify that the experience exists and is not expired
    const experience = await NewExperience.findById(id).lean();
    if (!experience || experience.status === 'expired') {
      return next(new ValidationError('Experience not found or has expired'));
    }

    // Find the stage within the experience
    const stage = experience.stages.find(s => s.id === stageId);
    if (!stage) {
      return next(new ValidationError('Stage not found'));
    }

    // Check if the stage has button settings of 'code' and validate the code
    if (stage.buttonSettings !== 'code') {
      return next(new ValidationError('This stage does not require an unlock code'));
    }

    if (stage.codeValue !== code) {
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

// Validate stage access and generate temporary access token
const validateStageAccessV2 = async (req, res, next) => {
  try {
    const { id, stageId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new ValidationError('Invalid experience ID'));
    }

    const experience = await NewExperience.findById(id).lean();
    if (!experience || experience.status === 'expired') {
      return next(new ValidationError('Experience not found or has expired'));
    }

    const stage = experience.stages.find(s => s.id === stageId);
    if (!stage) {
      return next(new ValidationError('Stage not found'));
    }

    // Define what this token can access
    // For HLS streams, use the uploadedFile path as the manifest file
    const manifestFile = stage.uploadedFile || null;
    const payload = {
      stageId: stage.id,
      experienceId: experience._id,
      mediaType: stage.type,
      manifestFile: manifestFile
    };

    // Create the JWT token
    const secret = process.env.JWT_SECRET || "my-secret-string-for-jwt";
    const token = jwt.sign(payload, secret, {
      expiresIn: '10m'
    });

    // Determine the manifest URL based on the stage type and file
    let manifestUrl;
    if (stage.uploadedFile) {
      const isHls = stage.uploadedFile.includes('.m3u8');
      if (isHls) {
        // For HLS streams, construct the path
        const fileName = stage.uploadedFile.split('/').pop();
        manifestUrl = `/api/media-v2/${stage.id}/${fileName}`;
      } else {
        // For regular media files
        const fileName = stage.uploadedFile.split('/').pop();
        manifestUrl = `/api/media-v2/${stage.id}/${fileName}`;
      }
    } else {
      // If no file, construct a generic URL
      const mediaExt = stage.type === 'audio' ? 'mp3' : stage.type === 'video' ? 'mp4' : 'txt';
      manifestUrl = `/api/media-v2/${stage.id}/stream.${mediaExt}`;
    }

    res.success({
      manifestUrl: manifestUrl,
      token: token,
      mediaType: stage.type,
      uploadedFile: stage.uploadedFile
    });

  } catch (error) {
    next(error);
  }
};

// Get stream access for a stage (JWT "Ticket Booth")
const getStreamAccessV2 = async (req, res, next) => {
  try {
    const { id, stageId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new ValidationError('Invalid experience ID'));
    }

    const experience = await NewExperience.findById(id).lean();
    if (!experience || experience.status === 'expired') {
      return next(new ValidationError('Experience not found or has expired'));
    }

    const stage = experience.stages.find(s => s.id === stageId);
    if (!stage) {
      return next(new ValidationError('Stage not found'));
    }

    // Define what this token can access
    const manifestFile = stage.hlsPath || stage.uploadedFile || null;
    const payload = {
      stageId: stage.id,
      experienceId: experience._id,
      mediaType: stage.type,
      manifestFile: manifestFile
    };

    // Create the JWT token
    const secret = process.env.JWT_SECRET || "my-secret-string-for-jwt";
    const token = jwt.sign(payload, secret, {
      expiresIn: '10m'
    });

    // Construct the manifest URL - prefer HLS path if available
    let manifestUrl;
    if (stage.hlsPath) {
      // Use HLS manifest if it's been transcoded
      // hlsPath should be like /media/hls/{fileId}/index.m3u8
      manifestUrl = `/api/media-v2/${stage.id}/index.m3u8`;
    } else if (stage.uploadedFile) {
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
      uploadedFile: stage.uploadedFile,
      hlsPath: stage.hlsPath
    }, 'Stream access granted');

  } catch (error) {
    next(error);
  }
};

// Serve stage media file with JWT authentication ("Bouncer")
const serveStageMediaFileV2 = async (req, res, next) => {
  try {
    const { stageId, filename } = req.params;
    const { token } = req.query;

    if (!token) {
      return next(new ValidationError('Access token is required', 401));
    }

    // Verify the JWT token
    const secret = process.env.JWT_SECRET || "my-secret-string-for-jwt";
    let payload;
    try {
      payload = jwt.verify(token, secret);
    } catch (jwtError) {
      return next(new ValidationError('Invalid or expired access token', 401));
    }

    // Verify that the token is for the requested stage
    /* if (payload.stageId !== stageId) {
      return next(new ValidationError('Token does not authorize access to this stage', 403));
    }
 */
    // Verify the experience still exists and is published
    const experience = await NewExperience.findById(payload.experienceId).lean();
    if (!experience) {
      return next(new ValidationError('Experience not found or not published', 404));
    }
    console.log('Experience:', experience);
    console.log('Stage:', stageId);
    // Find the stage
    const stage = experience.stages.find(s => s.id === stageId);
    if (!stage) {
      return next(new ValidationError('Stage not found', 404));
    }

    // Note: If HLS version exists, it should be requested via index.m3u8
    // If a specific media file is requested (e.g., file.wav), serve that file with correct content type
    // Do not try to serve HLS playlist for direct media file requests

    // Determine file path - handle various scenarios
    let filePath;

    // If stage has an HLS path (transcoded file), use that directory
    if (stage.hlsPath && stage.fileId) {
      // hlsPath is like /media/hls/{fileId}/index.m3u8
      // Use the fileId to construct the path
      if (filename.startsWith('seg') || filename === 'index.m3u8') {
        filePath = path.join(__dirname, '..', 'media', 'hls', stage.fileId, filename);
        console.log('Serving HLS file from transcoded directory:', filePath);
      } else {
        return next(new ValidationError('Invalid file request for transcoded stage', 400));
      }
    } else if (stage.uploadedFile) {
      // If it's an HLS URL (e.g., /media/hls/fileId/index.m3u8)
      if (stage.uploadedFile.includes('media/hls')) {
        // Extract the directory and construct the full path
        const parts = stage.uploadedFile.split('/');
        const fileId = parts.find((p, i) => parts[i - 1] === 'hls');

        if (fileId && (filename === 'index.m3u8' || filename.startsWith('seg'))) {
          filePath = path.join(__dirname, '..', 'media', 'hls', fileId, filename);
          console.log(filePath);
        } else if (filename === 'index.m3u8' || filename === stage.uploadedFile.split('/').pop()) {
          filePath = path.join(__dirname, '..', stage.uploadedFile);
          console.log(filePath);
        } else {
          return next(new ValidationError('Invalid file request', 400));
        }
      } else {
        // For segment files, always check the HLS directory for this stageId
        // This handles cases where stage.uploadedFile might not contain 'media/hls'
        // but we're still requesting HLS segments
        if (filename.startsWith('seg')) {
          filePath = path.join(__dirname, '..', 'media', 'hls', stageId, filename);
          console.log('Serving segment from HLS directory:', filePath);
        } else if (filename === 'index.m3u8') {
          filePath = path.join(__dirname, '..', 'media', 'hls', stageId, filename);
          console.log('Serving playlist from HLS directory:', filePath);
        } else {
          // For regular uploaded files
          // The uploadedFile path starts with /uploads, so we need to join with the project root
          filePath = path.join(__dirname, '..', '..', stage.uploadedFile);
        }
      }
    } else {
      // If no uploadedFile is associated with the stage but we're requesting segments,
      // try the HLS directory for this stageId
      if (filename.startsWith('seg') || filename === 'index.m3u8') {
        filePath = path.join(__dirname, '..', 'media', 'hls', stageId, filename);
        console.log('Serving from default HLS directory:', filePath);
      } else {
        return next(new ValidationError('No media file associated with this stage', 404));
      }
    }

    // Check if file exists
    if (!existsSync(filePath)) {
      loggerInstance.error(`File not found: ${filePath}`);
      return next(new ValidationError('Media file not found', 404));
    }

    // For HLS playlist files (.m3u8), we need to rewrite the paths
    if (filename === 'index.m3u8' || filename.endsWith('.m3u8')) {
      try {
        let playlistContent = fs.readFileSync(filePath, 'utf8');

        // Rewrite segment paths to use the new API endpoint with the token
        const segmentPattern = /^(seg\d+\.ts|.*\.ts)$/gm;
        playlistContent = playlistContent.replace(segmentPattern, (match) => {
          return `/api/media-v2/${stageId}/${match}?token=${token}`;
        });

        // Rewrite the EXT-X-KEY URI to include the token for encrypted streams
        const keyPattern = /#EXT-X-KEY:METHOD=([^,]+),URI="([^"]+)",IV=([^,\s]+)/g;
        playlistContent = playlistContent.replace(keyPattern, (match, method, uri, iv) => {
          // Parse the existing URI to extract the track parameter
          const url = new URL(uri, 'http://localhost');
          const track = url.searchParams.get('track') || stageId;
          
          // Create the new URI with the token
          const newUri = `/api/get-key-v2?track=${track}&token=${token}`;
          
          return `#EXT-X-KEY:METHOD=${method},URI="${newUri}",IV=${iv}`;
        });

        // Set appropriate headers for HLS
        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.send(playlistContent);
        return;
      } catch (error) {
        loggerInstance.error(`Error reading playlist file: ${error.message}`);
        return next(new ValidationError('Error serving playlist', 500));
      }
    }

    // For regular media files or HLS segments
    try {
      const stat = fs.statSync(filePath);
      res.setHeader('Accept-Ranges', 'bytes');
      
      // Check if the request includes a Range header for partial content
      const range = req.headers.range;
      if (range) {
        // Handle range requests for partial content
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
        const chunksize = (end - start) + 1;
        
        const fileStream = fs.createReadStream(filePath, { start, end });
        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${stat.size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': filename.endsWith('.ts') ? 'video/MP2T' : getMimeType(filename)
        });
        fileStream.pipe(res);
        
        fileStream.on('error', (error) => {
          loggerInstance.error(`Stream error: ${error.message}`);
          if (!res.headersSent) {
            next(new ValidationError('Error streaming file', 500));
          }
        });
      } else {
        // For non-range requests
        res.setHeader('Content-Type', filename.endsWith('.ts') ? 'video/MP2T' : getMimeType(filename));
        res.setHeader('Content-Length', stat.size);
        res.setHeader('Cache-Control', 'public, max-age=3600');

        const stream = createReadStream(filePath);
        stream.pipe(res);

        stream.on('error', (error) => {
          loggerInstance.error(`Stream error: ${error.message}`);
          if (!res.headersSent) {
            next(new ValidationError('Error streaming file', 500));
          }
        });
      }
    } catch (error) {
      loggerInstance.error(`Error serving file: ${error.message}`);
      next(new ValidationError('Error serving file', 500));
    }

  } catch (error) {
    next(error);
  }
};

// Get encryption key with JWT authentication
const getEncryptionKeyWithAuthV2 = async (req, res, next) => {
  try {
    const { token, track } = req.query;

    if (!token) {
      console.warn('GET /api/get-key-v2 called without token');
      return next(new ValidationError('Access token is required', 401));
    }

    // Verify the JWT token
    const secret = process.env.JWT_SECRET || "my-secret-string-for-jwt";
    let payload;
    try {
      payload = jwt.verify(token, secret);
      console.log('Token verified for track:', track, 'Experience:', payload.experienceId);
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError.message);
      return next(new ValidationError('Invalid or expired access token', 401));
    }

    // Verify the experience still exists and is published
    const experience = await NewExperience.findById(payload.experienceId).lean();
    if (!experience) {
      console.error('Experience not found:', payload.experienceId);
      return next(new ValidationError('Experience not found', 404));
    }

    // Find the stage
    const stage = experience.stages.find(s => s.id === payload.stageId);
    if (!stage) {
      console.error('Stage not found:', payload.stageId);
      return next(new ValidationError('Stage not found', 404));
    }

    // Try to find and serve the encryption key
    // The track parameter helps us identify which file's key to serve
    const fileId = track || payload.stageId;

    // Check both with hlsPath and in the media/hls directory
    let keyFilePath = null;

    if (stage.uploadedFile && stage.uploadedFile.includes('media/hls')) {
      const parts = stage.uploadedFile.split('/');
      const hlsIndex = parts.indexOf('hls');
      if (hlsIndex !== -1 && parts[hlsIndex + 1]) {
        const foundFileId = parts[hlsIndex + 1];
        keyFilePath = path.join(__dirname, '..', 'media', 'hls', foundFileId, `${foundFileId}.key`);
      }
    }

    // Fallback: try with the track/fileId
    if (!keyFilePath || !existsSync(keyFilePath)) {
      keyFilePath = path.join(__dirname, '..', 'media', 'hls', fileId, `${fileId}.key`);
    }

    console.log('Looking for key file:', keyFilePath);

    if (existsSync(keyFilePath)) {
      try {
        const keyContent = fs.readFileSync(keyFilePath);
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Length', keyContent.length);
        res.send(keyContent);
        console.log('Served encryption key for track:', fileId);
        return;
      } catch (error) {
        console.error(`Error reading key file: ${error.message}`);
        return next(new ValidationError('Error serving key', 500));
      }
    }

    // If no encryption key is available, return empty response
    console.log('No encryption key found for track:', fileId);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', 0);
    res.send(Buffer.alloc(0));

  } catch (error) {
    console.error('getEncryptionKeyWithAuthV2 error:', error);
    next(error);
  }
};

// Helper function to get MIME type based on file extension
const getMimeType = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    '.mp3': 'audio/mpeg',
    '.mp4': 'video/mp4',
    '.m4a': 'audio/mp4',
    '.wav': 'audio/wav',
    '.aac': 'audio/aac',
    '.flac': 'audio/flac',
    '.ogg': 'audio/ogg',
    '.webm': 'video/webm',
    '.ts': 'video/mp2t',
    '.avi': 'video/avi',
    '.mov': 'video/quicktime',
    '.wmv': 'video/x-ms-wmv',
    '.m3u8': 'application/vnd.apple.mpegurl',
    '.keyinfo': 'text/plain',
    '.txt': 'text/plain',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif'
  };
  return mimeTypes[ext] || 'application/octet-stream';
};

// Get stream access for editing (authenticated studio owner)
const getEditStreamAccessV2 = async (req, res, next) => {
  try {
    const { id, stageId } = req.params;
    const studioId = req.user.studio;

    if (!studioId) {
      return next(new ValidationError('Studio ID is required', 403));
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new ValidationError('Invalid experience ID'));
    }

    const experience = await NewExperience.findById(id).lean();
    if (!experience) {
      return next(new ValidationError('Experience not found', 404));
    }

    // Verify that the experience belongs to the user's studio
    if (experience.studioId.toString() !== studioId.toString()) {
      return next(new ValidationError('You do not have access to this experience', 403));
    }

    const stage = experience.stages.find(s => s.id === stageId);
    if (!stage) {
      return next(new ValidationError('Stage not found', 404));
    }

    // Define what this token can access
    const manifestFile = stage.uploadedFile || null;
    const payload = {
      stageId: stage.id,
      experienceId: experience._id,
      studioId: studioId,
      mediaType: stage.type,
      manifestFile: manifestFile,
      mode: 'edit'
    };

    // Create the JWT token
    const secret = process.env.JWT_SECRET || "my-secret-string-for-jwt";
    const token = jwt.sign(payload, secret, {
      expiresIn: '30m'
    });

    // Construct the manifest URL
    let manifestUrl;
    if (stage.uploadedFile) {
      const fileName = stage.uploadedFile.split('/').pop();
      manifestUrl = `/api/studio/edit-media/${stage.id}/${fileName}`;
    } else {
      const mediaExt = stage.type === 'audio' ? 'mp3' : stage.type === 'video' ? 'mp4' : 'txt';
      manifestUrl = `/api/studio/edit-media/${stage.id}/stream.${mediaExt}`;
    }

    res.success({
      manifestUrl: manifestUrl,
      token: token,
      mediaType: stage.type,
      uploadedFile: stage.uploadedFile
    }, 'Edit stream access granted');

  } catch (error) {
    next(error);
  }
};

// Serve stage media file for editing (authenticated studio owner)
const serveEditStageMediaFileV2 = async (req, res, next) => {
  try {
    const { stageId, filename } = req.params;
    const { token } = req.query;
    const studioId = req.user.studio;

    if (!studioId) {
      return next(new ValidationError('Studio ID is required', 403));
    }

    if (!token) {
      return next(new ValidationError('Access token is required', 401));
    }

    // Verify the JWT token
    const secret = process.env.JWT_SECRET || "my-secret-string-for-jwt";
    let payload;
    try {
      payload = jwt.verify(token, secret);
    } catch (jwtError) {
      return next(new ValidationError('Invalid or expired access token', 401));
    }

    // Verify token is for editing
    if (payload.mode !== 'edit') {
      return next(new ValidationError('Token is not valid for editing', 403));
    }

    // Verify that the token is for the requested stage
    if (payload.stageId !== stageId) {
      return next(new ValidationError('Token does not authorize access to this stage', 403));
    }

    // Verify the studio owns this experience
    if (payload.studioId.toString() !== studioId.toString()) {
      return next(new ValidationError('You do not have access to this experience', 403));
    }

    // Verify the experience still exists and belongs to the studio
    const experience = await NewExperience.findById(payload.experienceId).lean();
    if (!experience) {
      return next(new ValidationError('Experience not found', 404));
    }

    if (experience.studioId.toString() !== studioId.toString()) {
      return next(new ValidationError('You do not have access to this experience', 403));
    }

    // Find the stage
    const stage = experience.stages.find(s => s.id === stageId);
    if (!stage) {
      return next(new ValidationError('Stage not found', 404));
    }

    // For editing, always serve the direct raw media file, not HLS

    // Determine file path - for editing, always serve the original uploaded file
    let filePath;
    if (!stage.uploadedFile) {
      return next(new ValidationError('No media file associated with this stage', 404));
    }

    // For HLS segments explicitly requested, serve from HLS directory
    if (filename === 'index.m3u8' || filename.startsWith('seg')) {
      if (stage.uploadedFile.includes('media/hls')) {
        const parts = stage.uploadedFile.split('/');
        const fileId = parts.find((p, i) => parts[i - 1] === 'hls');
        if (fileId) {
          filePath = path.join(__dirname, '..', 'media', 'hls', fileId, filename);
        } else {
          return next(new ValidationError('Invalid HLS request', 400));
        }
      } else {
        return next(new ValidationError('HLS files not available for this media', 404));
      }
    } else {
      // For direct media file requests (MP3, MP4, etc.), serve the original uploaded file
      filePath = path.join(__dirname, '..', '..', stage.uploadedFile);
    }

    // Check if file exists
    if (!existsSync(filePath)) {
      loggerInstance.error(`File not found: ${filePath}`);
      return next(new ValidationError('Media file not found', 404));
    }

    // For HLS playlist files (.m3u8), we need to rewrite the paths
    if (filename === 'index.m3u8' || filename.endsWith('.m3u8')) {
      try {
        let playlistContent = fs.readFileSync(filePath, 'utf8');

        // Rewrite segment paths to use the new API endpoint with the token
        const segmentPattern = /^(seg\d+\.ts|.*\.ts)$/gm;
        playlistContent = playlistContent.replace(segmentPattern, (match) => {
          return `/api/studio/edit-media/${stageId}/${match}?token=${token}`;
        });

        // Rewrite the EXT-X-KEY URI to include the token for encrypted streams
        const keyPattern = /#EXT-X-KEY:METHOD=([^,]+),URI="([^"]+)",IV=([^,\s]+)/g;
        playlistContent = playlistContent.replace(keyPattern, (match, method, uri, iv) => {
          // Parse the existing URI to extract the track parameter
          const url = new URL(uri, 'http://localhost');
          const track = url.searchParams.get('track') || stageId;
          
          // Create the new URI with the token
          const newUri = `/api/get-key-v2?track=${track}&token=${token}`;
          
          return `#EXT-X-KEY:METHOD=${method},URI="${newUri}",IV=${iv}`;
        });

        // Set appropriate headers for HLS
        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.send(playlistContent);
        return;
      } catch (error) {
        loggerInstance.error(`Error reading playlist file: ${error.message}`);
        return next(new ValidationError('Error serving playlist', 500));
      }
    }

    // For regular media files or HLS segments
    try {
      const stat = fs.statSync(filePath);
      res.setHeader('Accept-Ranges', 'bytes');
      
      // Check if the request includes a Range header for partial content
      const range = req.headers.range;
      if (range) {
        // Handle range requests for partial content
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
        const chunksize = (end - start) + 1;
        
        const fileStream = fs.createReadStream(filePath, { start, end });
        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${stat.size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': filename.endsWith('.ts') ? 'video/MP2T' : getMimeType(filename)
        });
        fileStream.pipe(res);
        
        fileStream.on('error', (error) => {
          loggerInstance.error(`Stream error: ${error.message}`);
          if (!res.headersSent) {
            next(new ValidationError('Error streaming file', 500));
          }
        });
      } else {
        // For non-range requests
        res.setHeader('Content-Type', filename.endsWith('.ts') ? 'video/MP2T' : getMimeType(filename));
        res.setHeader('Content-Length', stat.size);
        res.setHeader('Cache-Control', 'public, max-age=3600');

        const stream = createReadStream(filePath);
        stream.pipe(res);

        stream.on('error', (error) => {
          loggerInstance.error(`Stream error: ${error.message}`);
          if (!res.headersSent) {
            next(new ValidationError('Error streaming file', 500));
          }
        });
      }
    } catch (error) {
      loggerInstance.error(`Error serving file: ${error.message}`);
      next(new ValidationError('Error serving file', 500));
    }

  } catch (error) {
    next(error);
  }
};

export {
  getPublicExperienceByIdV2,
  validateUnlockCodeV2,
  validateStageAccessV2,
  getStreamAccessV2,
  serveStageMediaFileV2,
  getEncryptionKeyWithAuthV2,
  getEditStreamAccessV2,
  serveEditStageMediaFileV2
};
