import FormData from 'form-data';
import fs from 'fs';
import axios from 'axios';

// This is a test script to verify brandColor is being sent correctly
// You'll need to have a valid JWT token to run this test

const testBrandColorUpload = async () => {
  try {
    // Create form data
    const formData = new FormData();
    
    // Add the brand color
    formData.append('brandColor', '#ff5733'); // Using a test color
    
    // Add other required fields
    formData.append('title', 'Test Experience');
    formData.append('description', 'Test description');
    formData.append('startDate', new Date().toISOString());
    formData.append('endDate', new Date(Date.now() + 7 * 24 * 60 * 1000).toISOString()); // 7 days from now
    formData.append('trackVisibility', 'show-all');
    
    // Optional: add a logo file (create a simple text file for testing)
    const fakeLogo = Buffer.from('fake logo content');
    formData.append('logo', fakeLogo, { filename: 'test-logo.png' });

    console.log('Testing brandColor upload...');
    console.log('Brand color being sent:', '#ff5733');
    
    // Log the form data keys to see what's being sent
    for (let [key, value] of formData.entries()) {
      console.log(`FormData key: ${key}, value:`, typeof value === 'object' ? (value.filename || 'object') : value);
    }

    // You would need to make a real request here with proper authentication
    // This is just to show the structure
    console.log('\nForm data prepared. In a real scenario, you would send this to the server with axios:');
    console.log('POST /api/studio/experiences with the above form data');
    
  } catch (error) {
    console.error('Error in test:', error);
  }
};

testBrandColorUpload();
