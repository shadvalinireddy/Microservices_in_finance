const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
    custid: { type: String, required: true },
    customerName: { type: String, required: true },
    accountType: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true },
    aadharcard: { type: String, required: true, unique: true },
    balance: { type: Number, default: 0 },
});

const Account = mongoose.model('Account', accountSchema);

module.exports = Account;
