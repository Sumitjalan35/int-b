#!/usr/bin/env node

/**
 * Fix Missing Descriptions Script
 * 
 * This script fixes any existing MongoDB projects that are missing descriptions
 * by adding fallback descriptions based on their titles.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('../models/Project');

const connectDB = require('../config/database');

const fixMissingDescriptions = async () => {
  try {
    console.log('🔧 Starting to fix missing descriptions...');
    
    // Connect to MongoDB
    await connectDB();
    console.log('✅ Connected to MongoDB');
    
    // Find all projects without descriptions
    const projectsWithoutDescription = await Project.find({
      $or: [
        { description: { $exists: false } },
        { description: null },
        { description: '' }
      ]
    });
    
    console.log(`📊 Found ${projectsWithoutDescription.length} projects without descriptions`);
    
    if (projectsWithoutDescription.length === 0) {
      console.log('✅ All projects already have descriptions');
      process.exit(0);
    }
    
    // Fix each project
    for (const project of projectsWithoutDescription) {
      const fallbackDescription = `${project.title} - Interior Design Project`;
      
      console.log(`🔧 Fixing project: ${project.title}`);
      console.log(`   Adding description: ${fallbackDescription}`);
      
      project.description = fallbackDescription;
      await project.save();
      
      console.log(`   ✅ Fixed: ${project.title}`);
    }
    
    console.log('\n🎉 Successfully fixed all missing descriptions!');
    
    // Verify the fix
    const remainingProjects = await Project.find({
      $or: [
        { description: { $exists: false } },
        { description: null },
        { description: '' }
      ]
    });
    
    if (remainingProjects.length === 0) {
      console.log('✅ Verification: All projects now have descriptions');
    } else {
      console.log(`⚠️  Warning: ${remainingProjects.length} projects still missing descriptions`);
    }
    
  } catch (error) {
    console.error('❌ Error fixing missing descriptions:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
    process.exit(0);
  }
};

// Run the script
fixMissingDescriptions(); 
