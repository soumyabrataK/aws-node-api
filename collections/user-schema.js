const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        //required: true,
        trim: true,
        // minlength: 2,
        // maxlength: 12
    },
    // lastname: {
    //     type: String,
    //     // required: true,
    //     // minlength: 2,
    //     // maxlength: 12
    // },
    // type: {
    //     type: String,
    //     // required: true,
    // },
    address: {
        type: String,
    },
    // descriptions: {
    //     type: String,
    // },
    state: {
        type: String,
    },
    location: {
        type: Array,
    },
    city: {
        type: Array,
    },

    status: {
        type: Number,

    },

    zip: {
        type: Number,
    },

    email: {
        type: String,
        // unique: true,
        trim: true,
        validate: {
            isAsync: true,
            validator: function(v, callback) {
                var re =
                    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                let testres = re.test(String(v).toLowerCase());
                if (testres == false) return testres;
                
            },
            message: props =>
                `${props.value} is not a valid email id !!!`,
        },
        // required: [true, "Email required"],
    },
    secondary_email: {
        type: String,
        // unique: true,
        trim: true,

        validate: {
            isAsync: true,
            validator: function(v, callback) {
                console.log("v==", v);
                if (!v) { // this is for bypassing if this field was not put by user, "" will pass.
                    console.log("empty secondary email.");
                    return;
                } else {
                    var re =
                        /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                    let testres = re.test(String(v).toLowerCase());
                    if (testres == false) return testres;
                   
                }

            },
            message: props =>
                `${props.value} is not a valid email id !!!`,
        }
    },
    password: {
        type: String,
        minlength: 6,
        trim: true,
        // required: true
    },

    logincounts: {
        type: Number,
        // maxlength: 2
    },

    login_time: {
        type: Number,
    },
    phone: {
        type: String,

    },
    secondary_phone: {
        type: String,
    },
    notes: {
        type: Array,
        default: undefined,
    },

    verification_code: {
        type: String,
    },
    verification_code_added_time: { type: Number },
    notescount: {
        type: Number,
    },
    last_login_datetime: {
        type: Number,
    },
    created_by: {
        // type: String,
        type: mongoose.Schema.Types.ObjectId,
    },
    createdon_datetime: { type: Number, default: Math.round(new Date().getTime()) },
    status: {
        type: Number,
        enum: [1, 0],
        default: 0,
    },
    priority: {
        type: Number,
       
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
    },
    updated_at: {
        type: Number,
    },
    // image:{
    //     type: Array,
    // },
});
module.exports = mongoose.models['users'] || mongoose.model("users", userSchema);