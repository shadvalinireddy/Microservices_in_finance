const express = require('express');
const mongoose = require('mongoose');
const amqp = require('amqplib');
const Loan = require('./loanModel');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

const cors = require('cors');
app.use(cors({
    origin: '*',
    methods: 'GET,POST,PUT,DELETE',
    allowedHeaders: 'Content-Type'
}));

// Middleware to parse JSON requests
app.use(express.json());

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/loanDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// RabbitMQ connection
let channel;

async function connectToRabbitMQ() {
    try {
        const connection = await amqp.connect('amqp://localhost');
        channel = await connection.createChannel();
        await channel.assertQueue('notifications', { durable: true });
    } catch (error) {
        console.error('Error connecting to RabbitMQ:', error);
    }
}

connectToRabbitMQ();


app.get('/loans/:email', async (req, res) => {
    try {
        const loans = await Loan.find({ email: req.params.email });
        res.status(200).json(loans);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error loading loan details.' });
    }
});

// POST route to create a new loan
app.post('/loans', async (req, res) => {
    try {
        console.log('Request body:', req.body); // Log request body to ensure data is received properly

        const { email, loanid, loanType, loanAmount, status } = req.body;
        if (!email || !loanid || !loanType || !loanAmount || !status) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const newLoan = new Loan({ email, loanid, loanType, loanAmount, status });
        await newLoan.save();

        // Send message to notification queue
        const message = {
            email: newLoan.email,
            message: `New loan created with ID ${loanid} for customer ${email}`,
        };
        channel.sendToQueue('notifications', Buffer.from(JSON.stringify(message)), { persistent: true });

        console.log('Loan created successfully:', newLoan); // Log the new loan details
        res.status(201).json(newLoan);
    } catch (error) {
        console.error('Error creating loan:', error); // Log the error for detailed inspection
        res.status(500).json({ message: 'Error creating loan' });
    }
});

// PUT route to update a loan
app.put('/loans/:loanid', async (req, res) => {
    try {
        const loanId = req.params.loanid;
        const updatedLoan = await Loan.findOneAndUpdate({ loanid: loanId }, req.body, { new: true });

        if (!updatedLoan) {
            return res.status(404).json({ message: 'Loan not found' });
        }

        // Send message to notification queue
        const message = {
            email: updatedLoan.email,
            message: `Loan with ID ${loanId} updated for customer ${updatedLoan.email}`,
        };
        channel.sendToQueue('notifications', Buffer.from(JSON.stringify(message)), { persistent: true });

        res.status(200).json(updatedLoan);
    } catch (error) {
        console.error('Error updating loan:', error);
        res.status(500).json({ message: 'Error updating loan' });
    }
});

// DELETE route to delete a loan
app.delete('/loans/:loanid', async (req, res) => {
    try {
        const loanId = req.params.loanid;
        const deletedLoan = await Loan.findOneAndDelete({ loanid: loanId });

        if (!deletedLoan) {
            return res.status(404).json({ message: 'Loan not found' });
        }

        // Send message to notification queue
        const message = {
            email: deletedLoan.email,
            message: `Loan with ID ${loanId} deleted for customer ${deletedLoan.email}`,
        };
        channel.sendToQueue('notifications', Buffer.from(JSON.stringify(message)), { persistent: true });

        res.status(204).send();
    } catch (error) {
        console.error('Error deleting loan:', error);
        res.status(500).json({ message: 'Error deleting loan' });
    }
});

app.listen(PORT, () => {
    console.log(`Loan service running on port ${PORT}`);
});
