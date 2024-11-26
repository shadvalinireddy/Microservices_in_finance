const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    senderemail: { type: String, required: true },
    receiveremail: { type: String, required: true },
    transactionId: { type: String, required: true, unique: true },
    amount: { type: Number, required: true },
    description: { type: String }
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
