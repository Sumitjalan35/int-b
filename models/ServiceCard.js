const mongoose = require('mongoose');

const ServiceCardSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    icon: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ServiceCard', ServiceCardSchema);

