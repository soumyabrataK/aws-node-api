const mongoose = require('mongoose');
const blogs = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  sub_title_one: {
    type: String,
    default: "NA"
  },
  sub_title_two: {
    type: String,
    default: "NA"
  },
  description: {
    type: String,
    required: true
  },
  date: {
    type: Number
  },
  author: {
    type: String,
    default: "NA"
  },
  role: {
    type: String,
    default: "NA"
  },
  images: {
    type: Array,
    default: []
  },
  category: {
    type: String,
    required: true
  },
  priority: {
    type: Number
  },
  status: {
    type: Number,
    default: 1
  },
  feedback: {
    type: Array,
    default: []
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
module.exports = mongoose.models['blogs'] || mongoose.model('blogs', blogs);