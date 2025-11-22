#!/usr/bin/env node

/**
 * Script to regenerate HLS files for existing tracks
 * Usage: node scripts/regenerateHls.js [--all] [--experience <id>] [--track <id>]
 */

import mongoose from 'mongoose';
import { regenerateHlsForTrack, regenerateHlsForExperience, regenerateHlsForAllTracks } from '../server/utils/hlsRegenerator.js';

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/orionartd', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

// Disconnect from MongoDB
const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  } catch (error) {
    console.error(`Error disconnecting from MongoDB: ${error.message}`);
  }
};

// Main function
const main = async () => {
  const args = process.argv.slice(2);
  
  // Parse command line arguments
  const options = {};
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--all':
        options.all = true;
        break;
      case '--experience':
        options.experienceId = args[++i];
        break;
      case '--track':
        options.trackId = args[++i];
        break;
      case '--help':
      case '-h':
        console.log(`
Usage: node scripts/regenerateHls.js [options]

Options:
  --all               Regenerate HLS for all tracks
  --experience <id>   Regenerate HLS for all tracks in an experience
  --track <id>        Regenerate HLS for a specific track
  --help, -h          Show this help message

Examples:
  node scripts/regenerateHls.js --all
  node scripts/regenerateHls.js --experience 68f5de289efee6fd652f5524
  node scripts/regenerateHls.js --track 68f5de289efee6fd652f5525
        `);
        process.exit(0);
        break;
      default:
        console.error(`Unknown argument: ${args[i]}`);
        process.exit(1);
    }
  }
  
  // Validate arguments
  const optionCount = [options.all, options.experienceId, options.trackId].filter(Boolean).length;
  if (optionCount === 0) {
    console.error('Error: Please specify at least one option (--all, --experience, or --track)');
    console.error('Use --help for more information');
    process.exit(1);
  }
  
  if (optionCount > 1) {
    console.error('Error: Please specify only one option (--all, --experience, or --track)');
    process.exit(1);
  }
  
  try {
    // Connect to database
    await connectDB();
    
    // Execute the appropriate function based on arguments
    if (options.all) {
      console.log('Regenerating HLS for all tracks...');
      const results = await regenerateHlsForAllTracks();
      console.log(`Completed. Processed ${results.length} tracks.`);
    } else if (options.experienceId) {
      console.log(`Regenerating HLS for all tracks in experience ${options.experienceId}...`);
      const results = await regenerateHlsForExperience(options.experienceId);
      console.log(`Completed. Processed ${results.length} tracks.`);
    } else if (options.trackId) {
      console.log(`Regenerating HLS for track ${options.trackId}...`);
      const result = await regenerateHlsForTrack(options.trackId);
      console.log('Completed.');
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  } finally {
    // Disconnect from database
    await disconnectDB();
  }
};

// Run the script
main();
