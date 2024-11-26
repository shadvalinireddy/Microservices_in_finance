const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
    email: {type: String, required:true},
    loanid: { type: String, required: true, unique: true },
    loanType: { type: String, required: true },
    loanAmount: { type: Number, required: true },
    status: { type: String, required: true, enum: ['approved', 'pending', 'rejected'] }
});

const Loan = mongoose.model('Loan', loanSchema);

module.exports = Loan;
