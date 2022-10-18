const mongoose = require('mongoose');
const loginschema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
    },
    email: {
        type: String,
        trim: true,
    },
    logincounts: {
        type: Number,
        // maxlength: 2
    },
    ip: {
        type: String
    },
    hostname: {
        type: String
    },
    city: {
        type: String
    },
    region: {
        type: String
    },
    country: {
        type: String
    },
    loc: {
        type: String
    },
    org: {
        type: String
    },
    postal: {
        type: String
    },
    timezone: {
        type: String
    },
    login_time: {
        type: Number,
    },
    secret: {
        type: String
    },


    createdon_datetime: { type: Number, default: Math.round((new Date()).getTime()) },

});
module.exports = mongoose.models['user_login_details'] || mongoose.model('user_login_details', loginschema);