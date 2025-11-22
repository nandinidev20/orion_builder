import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { spawn, execSync } from 'child_process';
import Track from '../model/Track.js';
import { hlsWorkerPool } from './workerPool.js';

// Function to check if ffmpeg is available
const checkFfmpeg = () => {
  try {
    execSync('ffmpeg -version', { stdio: 'pipe' });
    return true;
  } catch (error) {
    console.warn('FFmpeg is not installed or not available in PATH. HLS transcoding will not work.');
    return false;
  }
};

// Check if ffmpeg is available at module load time
const ffmpegAvailable = checkFfmpeg();

// Function to ensure the key file exists (deterministic key generation)
const ensureKeyFile = async (keyPath) => {
  try {
    // Check if key file already exists
    await fs.access(keyPath);
    console.log(`Key file already exists: ${keyPath}`);
  } catch (error) {
    // If key file doesn't exist, create a new one
    console.log(`Creating new key file: ${keyPath}`);

    // Generate a 16-byte random key for AES encryption
    const key = crypto.randomBytes(16);

    // Write the key to the file (binary format)
    await fs.writeFile(keyPath, key);
    console.log(`Key file created: ${keyPath}`);
  }
};

// Function to create keyinfo file for ffmpeg (proper format for Windows)
const createKeyInfoFile = async (keyInfoPath, fileId, outDir) => {
  try {
    // Get the absolute path to the key file (for ffmpeg to read during transcoding)
    const absoluteKeyPath = path.resolve(`${outDir}/${fileId}.key`);

    // Generate a random IV (Initialization Vector) for this session
    const iv = crypto.randomBytes(16).toString('hex');

    // Create keyinfo file content in the correct format:
    // Line 1: Key URL (API endpoint that will serve the key with authentication)
    // Line 2: Key file path (for ffmpeg to read during transcoding)
    // Line 3: IV (Initialization Vector)
    // The first line is what gets written to the manifest file
    // For HLS, the key URL in the manifest should be absolute path starting with /
    // so it's resolved relative to the domain root, not the manifest directory
    // Use the new JWT-based endpoint for key encryption
    const keyUrl = `/api/get-key-v2?track=${fileId}`;
    const keyInfoContent = `${keyUrl}\n${absoluteKeyPath}\n${iv}\n`;

    await fs.writeFile(keyInfoPath, keyInfoContent, 'utf8');
    console.log(`Created keyinfo file: ${keyInfoPath}`);
    console.log(`Key will be served from: ${keyUrl}`);
  } catch (error) {
    console.error(`Error creating keyinfo file: ${error.message}`);
    throw error;
  }
};

// Function to transcode media file to HLS format with encryption using worker pool
const transcodeToHls = async (inputPath, fileId, onProgress = null) => {
  if (!ffmpegAvailable) {
    throw new Error('FFmpeg is not available. Please install FFmpeg to enable HLS transcoding.');
  }

  try {
    const result = await hlsWorkerPool.execute({
      inputPath,
      fileId
    });

    if (onProgress) {
      onProgress({ progress: 100, stage: 'encoding' });
    }

    return result.hlsPath;
  } catch (error) {
    console.error(`Error during HLS transcoding: ${error.message}`);
    throw error;
  }
};

// Function to update track with HLS path and file ID
const updateTrackWithHlsData = async (trackId, hlsPath, fileId) => {
  try {
    const track = await Track.findById(trackId);
    if (!track) {
      throw new Error('Track not found');
    }

    track.hlsPath = hlsPath;
    track.fileId = fileId;

    await track.save();
    console.log(`Updated track ${trackId} with HLS path and file ID`);
    return track;
  } catch (error) {
    console.error(`Error updating track with HLS data: ${error.message}`);
    throw error;
  }
};

// Function to clean up HLS files (call this manually when needed)
const cleanupHlsFiles = async (fileId) => {
  const outDir = `server/media/hls/${fileId}`;
  try {
    await fs.rm(outDir, { recursive: true, force: true });
    console.log(`Cleaned up HLS files for ${fileId}`);
  } catch (error) {
    console.error(`Error cleaning up HLS files for ${fileId}: ${error.message}`);
  }
};

// Main function to process track after upload
const processTrackForHls = async (trackId, inputPath, cdnHost = 'localhost') => {
  try {
    console.log(`Starting HLS processing for track ${trackId} with file ${inputPath}`);

    // Use the MongoDB _id as the fileId
    const fileId = trackId;

    // Perform the HLS transcoding
    const hlsPath = await transcodeToHls(inputPath, fileId);

    // Update the track document with HLS path and file ID
    const updatedTrack = await updateTrackWithHlsData(trackId, hlsPath, fileId);

    console.log(`HLS processing completed for track ${trackId}`);
    return updatedTrack;
  } catch (error) {
    console.error(`HLS processing failed for track ${trackId}: ${error.message}`);
    throw error;
  }
};

export {
  transcodeToHls,
  processTrackForHls,
  ensureKeyFile,
  cleanupHlsFiles
};
