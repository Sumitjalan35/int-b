#!/usr/bin/env node

/**
 * Portfolio to MongoDB Sync Script
 * 
 * This script syncs all existing portfolio data from JSON files to MongoDB
 * to ensure data consistency and fix any missing data issues.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const Project = require('../models/Project');
const User = require('../models/User');

const connectDB = require('../config/database');

const PORTFOLIO_FILE = path.join(__dirname, '../data/portfolio.json');

const syncPortfolioToMongo = async () => {
  try {
    console.log('🔄 Starting Portfolio to MongoDB sync...');
    
    // Connect to MongoDB
    await connectDB();
    console.log('✅ Connected to MongoDB');
    
    // Read portfolio data from JSON
    const portfolioData = JSON.parse(await fs.readFile(PORTFOLIO_FILE, 'utf8'));
    console.log(`📊 Found ${portfolioData.length} projects in portfolio.json`);
    
    // Get admin user for createdBy field
    const adminUser = await User.findOne({ role: { $in: ['admin', 'superadmin'] } });
    if (!adminUser) {
      console.log('⚠️  No admin user found, creating one...');
      // Create a default admin user if none exists
      const defaultAdmin = await User.create({
        username: 'admin',
        email: 'admin@beyondblueprint.co.in',
        password: 'admin123',
        role: 'admin'
      });
      console.log('✅ Created default admin user');
    }
    
    const adminUserId = adminUser?._id;
    
    // Sync each project
    let created = 0;
    let updated = 0;
    let errors = 0;
    
    for (const project of portfolioData) {
      try {
        console.log(`\n🔧 Processing: ${project.title}`);
        
        // Check if project exists in MongoDB
        const existingProject = await Project.findOne({ title: project.title });
        
        if (existingProject) {
          // Update existing project
          console.log(`   📝 Updating existing project...`);
          
          existingProject.description = project.description || `${project.title} - Interior Design Project`;
          existingProject.category = project.category || 'residential';
          existingProject.sequence = project.sequence || 0;
          existingProject.images = project.images?.map((img, index) => ({
            url: img,
            alt: `${project.title} - Image ${index + 1}`,
            isPrimary: index === 0
          })) || [];
          existingProject.location = project.location || '';
          // Convert area from string to number (extract numeric value)
          if (project.area && typeof project.area === 'string') {
            const areaMatch = project.area.match(/(\d+)/);
            existingProject.area = areaMatch ? parseInt(areaMatch[1]) : 0;
          } else {
            existingProject.area = project.area || 0;
          }
          
          // Convert budget from string to number (extract numeric value)
          if (project.budget && typeof project.budget === 'string') {
            const budgetMatch = project.budget.match(/(\d+)/);
            existingProject.budget = budgetMatch ? parseInt(budgetMatch[1]) * 1000 : 0; // Convert to thousands
          } else {
            existingProject.budget = project.budget || 0;
          }
          existingProject.duration = project.duration || '';
          existingProject.featured = project.featured || false;
          existingProject.published = project.published !== false;
          
          await existingProject.save();
          updated++;
          console.log(`   ✅ Updated: ${project.title}`);
          
        } else {
          // Create new project
          console.log(`   ➕ Creating new project...`);
          
          const projectData = {
            title: project.title,
            description: project.description || `${project.title} - Interior Design Project`,
            category: project.category || 'residential',
            images: project.images?.map((img, index) => ({
              url: img,
              alt: `${project.title} - Image ${index + 1}`,
              isPrimary: index === 0
            })) || [],
            sequence: project.sequence || 0,
            location: project.location || '',
            // Convert area from string to number (extract numeric value)
            area: (() => {
              if (project.area && typeof project.area === 'string') {
                const areaMatch = project.area.match(/(\d+)/);
                return areaMatch ? parseInt(areaMatch[1]) : 0;
              }
              return project.area || 0;
            })(),
            
            // Convert budget from string to number (extract numeric value)
            budget: (() => {
              if (project.budget && typeof project.budget === 'string') {
                const budgetMatch = project.budget.match(/(\d+)/);
                return budgetMatch ? parseInt(budgetMatch[1]) * 1000 : 0; // Convert to thousands
              }
              return project.budget || 0;
            })(),
            duration: project.duration || '',
            featured: project.featured || false,
            published: project.published !== false,
            createdBy: adminUserId
          };
          
          await Project.create(projectData);
          created++;
          console.log(`   ✅ Created: ${project.title}`);
        }
        
      } catch (error) {
        console.error(`   ❌ Error processing ${project.title}:`, error.message);
        errors++;
      }
    }
    
    // Summary
    console.log('\n📊 Sync Summary:');
    console.log(`   ✅ Created: ${created} projects`);
    console.log(`   📝 Updated: ${updated} projects`);
    console.log(`   ❌ Errors: ${errors} projects`);
    console.log(`   📈 Total processed: ${portfolioData.length} projects`);
    
    if (errors === 0) {
      console.log('\n🎉 Portfolio sync completed successfully!');
    } else {
      console.log('\n⚠️  Sync completed with some errors. Check the logs above.');
    }
    
    // Verify data in MongoDB
    const mongoProjectCount = await Project.countDocuments();
    console.log(`\n🔍 Verification: ${mongoProjectCount} projects now in MongoDB`);
    
  } catch (error) {
    console.error('❌ Error during portfolio sync:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
    process.exit(0);
  }
};

// Run the script
syncPortfolioToMongo(); 
