const mongoose = require('mongoose');

const insuranceSchema = new mongoose.Schema({
    custid: String,
    email: String,
    insuranceid: String,
    insuranceType: String,
    claimAmount: Number,
    status: String,
});

module.exports = mongoose.model('Insurance', insuranceSchema);
