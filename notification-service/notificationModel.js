const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    email:{
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    createdTimestamp: {
        type: Date,
        default: Date.now,
    },
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
