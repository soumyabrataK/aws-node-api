const mongoose = require('mongoose');
const services = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  images: {
    type: Array,
    default: []
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
module.exports = mongoose.models['services'] || mongoose.model('services', services);