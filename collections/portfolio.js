const mongoose = require('mongoose');
const portfolios = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  author: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true
  },
  link: {
    type: String,
    default: "NA"
  },
  date: {
    type: Number
  },
  images: {
    type: Array,
    default: []
  },
  priority: {
    type: Number
  },
  status: {
    type: Number,
    default: 1
  },
  createdon_datetime: {
    type: Number,
    default: Math.round((new Date()).getTime())
  },
  created_by: {
    type: String
  },
  updated_by: {
    type: String
  },
  updated_datetime: {
    type: Number,
    default: Math.round((new Date()).getTime())
  },
});
module.exports = mongoose.models['portfolios'] || mongoose.model('portfolios', portfolios);