const mongoose = require('mongoose');

const SlideshowImageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, unique: true, index: true, trim: true },
    sequence: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SlideshowImage', SlideshowImageSchema);

