const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  email:     { type: String, required: true },
  review:    { type: String, required: true },
  rating:    { type: Number, min: 1, max: 5, required: true },
  date:      { type: Date, default: Date.now }
});

module.exports = mongoose.model('Review', reviewSchema);
