const mongoose = require('mongoose');

const PortfolioCardSchema = new mongoose.Schema(
  {
    // Keep compatibility with legacy JSON `id`
    legacyId: { type: Number, required: true, unique: true, index: true },

    title: { type: String, required: true, trim: true },
    subtitle: { type: String, default: '' },
    description: { type: String, default: '' },
    longDescription: { type: String, default: '' },
    category: { type: String, default: '' },

    image: { type: String, default: '' },
    mainImage: { type: String, default: '' },
    images: { type: [String], default: [] },

    sequence: { type: Number, default: 0 },

    location: { type: String, default: '' },
    year: { type: String, default: '' },
    area: { type: String, default: '' },
    duration: { type: String, default: '' },
    budget: { type: String, default: '' },

    features: { type: [String], default: [] },
    testimonials: { type: [mongoose.Schema.Types.Mixed], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PortfolioCard', PortfolioCardSchema);

