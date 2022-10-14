const mongoose = require("mongoose");
const get_quote = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  name: {
    type: String,
  },
  description: {
    type: String,
  },
  priority: {
    type: Number,
  },
  createdon_datetime: {
    type: Number,
    default: Math.round(new Date().getTime()),
  },
  last_checked: {
    type: Number,
    default: Math.round(new Date().getTime()),
  },
  email_sent: {
    type: Number, 
    default: 0
  },
});
module.exports =
  mongoose.models["get_quote"] || mongoose.model("get_quote", get_quote);
