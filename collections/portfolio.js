const mongoose = require('mongoose');
const portfolios = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  image: {
    type: Array
  },
  youtubeVideo: {
    type: Array
  },
  priority: {
    type: Number
  },
  status: {
    type: Number
  },
  created_by: {
    type: String
  },
  updated_by: {
    type: String
  },
  createdon_datetime: {
    type: Number,
    default: Math.round((new Date()).getTime())
  },
  updated_datetime: {
    type: Number,
    default: Math.round((new Date()).getTime())
  },
});
module.exports = mongoose.models['portfolios'] || mongoose.model('portfolios', portfolios);