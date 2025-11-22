import Track from '../model/Track.js';
import { processTrackForHls } from '../services/hlsTranscodingService.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * Regenerate HLS files for a specific track
 * @param {string} trackId - The ID of the track to regenerate HLS for
 * @returns {Promise<Object>} The updated track
 */
const regenerateHlsForTrack = async (trackId) => {
  try {
    // Find the track
    const track = await Track.findById(trackId);
    if (!track) {
      throw new Error(`Track with ID ${trackId} not found`);
    }

    // Check if the track has an audio or video file
    if (!track.audioFile && !track.videoFile) {
      throw new Error(`Track ${trackId} does not have an audio or video file`);
    }

    // Determine the input file path
    const inputPath = track.audioFile || track.videoFile;
    const absoluteInputPath = path.resolve(`.${inputPath}`); // Convert to absolute path relative to project root
    
    // Check if the input file exists
    try {
      await fs.access(absoluteInputPath);
    } catch (error) {
      throw new Error(`Input file ${absoluteInputPath} not found`);
    }

    console.log(`Regenerating HLS for track ${trackId} with file ${absoluteInputPath}`);

    // Process the track for HLS
    const updatedTrack = await processTrackForHls(track._id.toString(), absoluteInputPath, process.env.CDN_HOST || 'localhost');
    
    console.log(`Successfully regenerated HLS for track ${trackId}`);
    return updatedTrack;
  } catch (error) {
    console.error(`Error regenerating HLS for track ${trackId}:`, error.message);
    throw error;
  }
};

/**
 * Regenerate HLS files for all tracks in an experience
 * @param {string} experienceId - The ID of the experience
 * @returns {Promise<Array>} Array of updated tracks
 */
const regenerateHlsForExperience = async (experienceId) => {
  try {
    // Find all tracks for the experience
    const tracks = await Track.find({ experienceId });
    
    if (!tracks.length) {
      console.log(`No tracks found for experience ${experienceId}`);
      return [];
    }

    console.log(`Found ${tracks.length} tracks for experience ${experienceId}`);
    
    // Process each track
    const results = [];
    for (const track of tracks) {
      try {
        // Only process tracks with audio or video files
        if (track.audioFile || track.videoFile) {
          const updatedTrack = await regenerateHlsForTrack(track._id.toString());
          results.push(updatedTrack);
        }
      } catch (error) {
        console.error(`Failed to regenerate HLS for track ${track._id}:`, error.message);
        // Continue with other tracks even if one fails
      }
    }
    
    console.log(`Successfully regenerated HLS for ${results.length} tracks in experience ${experienceId}`);
    return results;
  } catch (error) {
    console.error(`Error regenerating HLS for experience ${experienceId}:`, error.message);
    throw error;
  }
};

/**
 * Regenerate HLS files for all tracks in the database
 * @returns {Promise<Array>} Array of updated tracks
 */
const regenerateHlsForAllTracks = async () => {
  try {
    // Find all tracks with audio or video files
    const tracks = await Track.find({
      $or: [
        { audioFile: { $exists: true, $ne: null } },
        { videoFile: { $exists: true, $ne: null } }
      ]
    });
    
    if (!tracks.length) {
      console.log('No tracks with audio or video files found');
      return [];
    }

    console.log(`Found ${tracks.length} tracks with audio or video files`);
    
    // Process each track
    const results = [];
    for (const track of tracks) {
      try {
        const updatedTrack = await regenerateHlsForTrack(track._id.toString());
        results.push(updatedTrack);
      } catch (error) {
        console.error(`Failed to regenerate HLS for track ${track._id}:`, error.message);
        // Continue with other tracks even if one fails
      }
    }
    
    console.log(`Successfully regenerated HLS for ${results.length} tracks`);
    return results;
  } catch (error) {
    console.error('Error regenerating HLS for all tracks:', error.message);
    throw error;
  }
};

export {
  regenerateHlsForTrack,
  regenerateHlsForExperience,
  regenerateHlsForAllTracks
};
