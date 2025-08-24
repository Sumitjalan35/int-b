#!/usr/bin/env node

/**
 * Check MongoDB Data Script
 * 
 * This script checks what data currently exists in MongoDB
 * to help diagnose data issues.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('../models/Project');
const User = require('../models/User');

const connectDB = require('../config/database');

const checkMongoData = async () => {
  try {
    console.log('🔍 Checking MongoDB data...');
    
    // Connect to MongoDB
    await connectDB();
    console.log('✅ Connected to MongoDB');
    
    // Check Projects
    console.log('\n📊 Projects in MongoDB:');
    const projects = await Project.find({}).select('title description category sequence -_id');
    console.log(`Total projects: ${projects.length}`);
    
    if (projects.length > 0) {
      projects.forEach((project, index) => {
        console.log(`\n${index + 1}. ${project.title}`);
        console.log(`   Description: ${project.description || 'MISSING'}`);
        console.log(`   Category: ${project.category || 'MISSING'}`);
        console.log(`   Sequence: ${project.sequence || 0}`);
      });
    } else {
      console.log('   No projects found');
    }
    
    // Check Users
    console.log('\n👥 Users in MongoDB:');
    const users = await User.find({}).select('username email role -_id');
    console.log(`Total users: ${users.length}`);
    
    if (users.length > 0) {
      users.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.username}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
      });
    } else {
      console.log('   No users found');
    }
    
    // Check for projects without descriptions
    console.log('\n⚠️  Projects with missing descriptions:');
    const projectsWithoutDescription = await Project.find({
      $or: [
        { description: { $exists: false } },
        { description: null },
        { description: '' }
      ]
    }).select('title -_id');
    
    if (projectsWithoutDescription.length > 0) {
      projectsWithoutDescription.forEach(project => {
        console.log(`   - ${project.title}`);
      });
    } else {
      console.log('   All projects have descriptions');
    }
    
  } catch (error) {
    console.error('❌ Error checking MongoDB data:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
    process.exit(0);
  }
};

// Run the script
checkMongoData(); 
