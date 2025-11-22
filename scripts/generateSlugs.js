#!/usr/bin/env node

/**
 * Script to generate and backfill slugs for existing experiences
 * Usage: node scripts/generateSlugs.js [--all] [--fix-duplicates]
 */

import mongoose from 'mongoose';
import NewExperience from '../server/model/NewExperience.js';
import { generateSlug, generateUniqueSlug } from '../server/utils/slugGenerator.js';

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://shrutigdev2_db_user:qp6WanfpkEG4w2zl@cluster0sample.52xtlvj.mongodb.net/sample?retryWrites=true&w=majority&appName=Cluster0sample';
    const conn = await mongoose.connect(mongoUri);
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

// Generate slugs for experiences
const generateSlugs = async (fixDuplicates = false) => {
  try {
    // Find experiences without slugs or with empty slugs
    const query = fixDuplicates 
      ? {} // Fix all experiences
      : { $or: [{ slug: { $exists: false } }, { slug: null }, { slug: '' }] };

    const experiencesWithoutSlugs = await NewExperience.find(query);
    
    if (experiencesWithoutSlugs.length === 0) {
      console.log('✓ All experiences already have slugs!');
      return 0;
    }

    console.log(`Found ${experiencesWithoutSlugs.length} experience(s) needing slugs...`);

    let updated = 0;
    for (const experience of experiencesWithoutSlugs) {
      try {
        if (!experience.title) {
          console.log(`⚠ Skipping experience ${experience._id} - no title`);
          continue;
        }

        const baseSlug = generateSlug(experience.title);
        const slug = await generateUniqueSlug(baseSlug, async (testSlug) => {
          // If fixing duplicates, check if other experiences have this slug
          const existingSlug = await NewExperience.findOne({ 
            slug: testSlug,
            _id: { $ne: experience._id } // Exclude current experience
          });
          return !!existingSlug;
        });

        experience.slug = slug;
        await experience.save();
        console.log(`✓ Generated slug for "${experience.title}": ${slug}`);
        updated++;
      } catch (error) {
        console.error(`✗ Error processing experience ${experience._id}: ${error.message}`);
      }
    }

    return updated;
  } catch (error) {
    console.error('Error generating slugs:', error.message);
    throw error;
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
      case '--fix-duplicates':
        options.fixDuplicates = true;
        break;
      case '--help':
      case '-h':
        console.log(`
Usage: node scripts/generateSlugs.js [options]

Options:
  --all             Generate slugs for all experiences without slugs
  --fix-duplicates  Regenerate slugs for all experiences (useful if duplicates exist)
  --help, -h        Show this help message

Examples:
  node scripts/generateSlugs.js --all
  node scripts/generateSlugs.js --fix-duplicates
        `);
        process.exit(0);
        break;
      default:
        console.error(`Unknown argument: ${args[i]}`);
        process.exit(1);
    }
  }

  // If no options provided, default to --all
  if (!options.all && !options.fixDuplicates) {
    options.all = true;
  }

  try {
    // Connect to database
    await connectDB();

    // Generate slugs
    const updated = await generateSlugs(options.fixDuplicates);
    console.log(`\n✓ Successfully generated slugs for ${updated} experience(s)`);
  } catch (error) {
    console.error(`\n✗ Error: ${error.message}`);
    process.exit(1);
  } finally {
    // Disconnect from database
    await disconnectDB();
  }
};

// Run the script
main();
