const mongoose = require("mongoose");
const mail_datas = new mongoose.Schema({
  sender: {
    type: String,
    required: true,
  },
  recipients: {
    type: Array,
    required: true,
  },
  subject: {
    type: String,
  },
  body: {
    type: String,
  },
  response_url: {
    type: String,
    required: true
  },
  createdon_datetime: {
    type: Number,
    default: Math.round(new Date().getTime()),
  },
  email_sent: {
    type: Number,
    default: 0
  },
});
module.exports = mongoose.models["mail_datas"] || mongoose.model("mail_datas", mail_datas);
