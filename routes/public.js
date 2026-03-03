const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const fs = require('fs/promises');
const path = require('path');

const PortfolioCard = require('../models/PortfolioCard');
const ServiceCard = require('../models/ServiceCard');
const SlideshowImage = require('../models/SlideshowImage');

const router = express.Router();

const dataDir = path.join(__dirname, '../data');
const files = {
  portfolio: path.join(dataDir, 'portfolio.json'),
  services: path.join(dataDir, 'services.json'),
  slideshow: path.join(dataDir, 'slideshow.json'),
};

// Helper to read JSON
async function readJson(file) {
  const data = await fs.readFile(file, 'utf-8');
  return JSON.parse(data);
}

function toLegacyPortfolioShape(card) {
  const { legacyId, ...rest } = card;
  return { ...rest, id: legacyId };
}

// @desc    Get portfolio data for main website
// @route   GET /api/portfolio
// @access  Public
router.get('/portfolio', asyncHandler(async (req, res) => {
  try {
    let cards = await PortfolioCard.find({}).sort({ sequence: 1, legacyId: 1 }).lean();

    // One-time migration fallback: if DB is empty, seed from bundled JSON
    if (!cards.length) {
      const json = await readJson(files.portfolio);
      if (Array.isArray(json) && json.length) {
        await PortfolioCard.bulkWrite(
          json
            .filter((item) => item && typeof item.id === 'number')
            .map((item) => ({
              updateOne: {
                filter: { legacyId: item.id },
                update: {
                  $setOnInsert: {
                    legacyId: item.id,
                    title: item.title || '',
                    subtitle: item.subtitle || '',
                    description: item.description || '',
                    longDescription: item.longDescription || '',
                    category: item.category || '',
                    image: item.image || '',
                    mainImage: item.mainImage || item.image || '',
                    images: Array.isArray(item.images) ? item.images : [],
                    sequence: item.sequence || 0,
                    location: item.location || '',
                    year: item.year || '',
                    area: item.area || '',
                    duration: item.duration || '',
                    budget: item.budget || '',
                    features: Array.isArray(item.features) ? item.features : [],
                    testimonials: Array.isArray(item.testimonials) ? item.testimonials : [],
                  },
                },
                upsert: true,
              },
            })),
          { ordered: false }
        );
        cards = await PortfolioCard.find({}).sort({ sequence: 1, legacyId: 1 }).lean();
      }
    }

    res.json(cards.map(toLegacyPortfolioShape));
  } catch (error) {
    res.status(500).json({ error: 'Failed to load portfolio data' });
  }
}));

// @desc    Get services data for main website
// @route   GET /api/services
// @access  Public
router.get('/services', asyncHandler(async (req, res) => {
  try {
    let items = await ServiceCard.find({}).sort({ title: 1 }).lean();

    // One-time migration fallback if DB is empty
    if (!items.length) {
      const json = await readJson(files.services);
      if (Array.isArray(json) && json.length) {
        await ServiceCard.bulkWrite(
          json
            .filter((item) => item && item.id)
            .map((item) => ({
              updateOne: {
                filter: { id: String(item.id) },
                update: {
                  $setOnInsert: {
                    id: String(item.id),
                    title: item.title || '',
                    description: item.description || '',
                    image: item.image || '',
                    icon: item.icon || '',
                  },
                },
                upsert: true,
              },
            })),
          { ordered: false }
        );
        items = await ServiceCard.find({}).sort({ title: 1 }).lean();
      }
    }

    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load services data' });
  }
}));

// @desc    Get slideshow data for main website
// @route   GET /api/slideshow
// @access  Public
router.get('/slideshow', asyncHandler(async (req, res) => {
  try {
    let images = await SlideshowImage.find({}).sort({ sequence: 1, createdAt: 1 }).lean();

    // One-time migration fallback if DB is empty
    if (!images.length) {
      const json = await readJson(files.slideshow);
      if (Array.isArray(json) && json.length) {
        await SlideshowImage.bulkWrite(
          json
            .filter((url) => typeof url === 'string' && url.trim())
            .map((url, idx) => ({
              updateOne: {
                filter: { url },
                update: { $setOnInsert: { url, sequence: idx } },
                upsert: true,
              },
            })),
          { ordered: false }
        );
        images = await SlideshowImage.find({}).sort({ sequence: 1, createdAt: 1 }).lean();
      }
    }

    res.json(images.map((i) => i.url));
  } catch (error) {
    res.status(500).json({ error: 'Failed to load slideshow data' });
  }
}));

// @desc    Get individual project details for main website
// @route   GET /api/project/:id
// @access  Public
router.get('/project/:id', asyncHandler(async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const card = await PortfolioCard.findOne({ legacyId: projectId }).lean();
    
    if (card) {
      return res.json(toLegacyPortfolioShape(card));
    }

    // Fallback to bundled JSON for older deployments / initial state
    const data = await readJson(files.portfolio);
    const project = Array.isArray(data) ? data.find(item => item.id === projectId) : null;
    if (!project) return res.status(404).json({ error: 'Project not found' });
    return res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load project data' });
  }
}));

module.exports = router; 