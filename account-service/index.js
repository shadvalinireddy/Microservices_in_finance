const express = require('express');
const mongoose = require('mongoose');
const amqp = require('amqplib');
const Account = require('./accountModel');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

const cors = require('cors');
app.use(cors({
    origin: '*',
    methods: 'GET,POST,PUT,DELETE',
    allowedHeaders: 'Content-Type'
}));

// Middleware to parse JSON requests
app.use(express.json());

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/accountDB', {
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
let accounts = [];

// POST route to create a new account
app.post('/accounts', async (req, res) => {
    try {
        const { custid, customerName, accountType, email, phone, aadharcard } = req.body;

        const newAccount = new Account({ custid, customerName, accountType, email, phone, aadharcard });
        await newAccount.save();

        // Send message to notification queue
        const message = {
            custid: newAccount.custid,
            message: `New account created for ${customerName}`,
        };
        channel.sendToQueue('notifications', Buffer.from(JSON.stringify(message)), { persistent: true });

        res.status(201).json(newAccount);
    } catch (error) {
        console.error('Error creating account:', error);
        res.status(500).json({ message: 'Error creating account' });
    }
});

// Login route
app.post('/accounts/login', async (req, res) => {
    const { email, custid } = req.body;
    try {
        const account = await findAccountByEmailAndCustid(email, custid);
        if (account) {
            res.status(200).json({ message: "Login successful", name: account.customerName });
        } else {
            res.status(401).json({ message: "Login failed" });
        }
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
});

async function findAccountByEmailAndCustid(email, custid) {
    return await Account.findOne({ email: email, custid: custid });
}

// PUT route to update an account
app.put('/accounts/:custid', async (req, res) => {
    try {
        const accountId = req.params.id;
        const updatedAccount = await Account.findByIdAndUpdate(accountId, req.body, { new: true });

        if (!updatedAccount) {
            return res.status(404).json({ message: 'Account not found' });
        }

        // Send message to notification queue
        const message = {
            email: updatedAccount.email,
            message: `Account updated for ${updatedAccount.customerName}`,
        };
        channel.sendToQueue('notifications', Buffer.from(JSON.stringify(message)), { persistent: true });

        res.status(200).json(updatedAccount);
    } catch (error) {
        console.error('Error updating account:', error);
        res.status(500).json({ message: 'Error updating account' });
    }
});

app.get('/accounts/:email', async (req, res) => {
    const email = req.params.email;
    console.log(`Received request for email: ${email}`);

    try {
        // Fetch account from the database
        const account = await Account.findOne({ email: email });

        if (account) {
            res.status(200).json(account);
        } else {
            console.warn(`No account found for email: ${email}`);
            res.status(404).json({ message: 'Account not found' });
        }
    } catch (error) {
        console.error('Error fetching account details:', error.message);
        res.status(500).json({ message: 'Error loading account details. Please try again.' });
    }
});



// DELETE route to delete an account
app.delete('/:custid', async (req, res)  => {
    try {
        const accountId = req.params.id;
        const deletedAccount = await Account.findByIdAndDelete(accountId);

        if (!deletedAccount) {
            return res.status(404).json({ message: 'Account not found' });
        }

        // Send message to notification queue
        const message = {
            email: deletedAccount.email,
            message: `Account deleted for ${deletedAccount.customerName}`,
        };
        channel.sendToQueue('notifications', Buffer.from(JSON.stringify(message)), { persistent: true });

        res.status(204).send();
    } catch (error) {
        console.error('Error deleting account:', error);
        res.status(500).json({ message: 'Error deleting account' });
    }
});

// PUT route to update an account by email
// PUT route to update account by email
app.put('/accounts/:email', async (req, res) => {
    try {
        const email = req.params.email;
        const updateData = req.body;

        console.log('Update request for email:', email);
        console.log('Update data received:', updateData);

        // Update account in the database
        const updatedAccount = await Account.findOneAndUpdate(
            { email },
            { $set: updateData },
            { new: true }
        );

        if (!updatedAccount) {
            return res.status(404).json({ message: 'Account not found' });
        }

        // Send notification message to RabbitMQ if the channel is available
        if (channel) {
            const message = {
                email: updatedAccount.email,
                message: `Account for ${updatedAccount.customerName || 'User'} updated successfully.`,
            };
            channel.sendToQueue('notifications', Buffer.from(JSON.stringify(message)), { persistent: true });
            console.log('Notification sent to queue:', message);
        } else {
            console.warn('RabbitMQ channel not available. Notification not sent.');
        }

        // Send the updated account data in response
        res.status(200).json({ message: 'Account updated successfully', updatedAccount });
    } catch (error) {
        console.error('Error updating account:', error);
        res.status(500).json({ message: 'Error updating account', error: error.message });
    }
});



app.delete('/accounts/:email', async (req, res) => {
    const email = req.params.email;
    try {
        const account = await Account.findOne({ email });
        if (!account) {
            return res.status(404).json({ message: 'Account not found' });
        }

        const custid = account.custid;
        
        // Delete the account
        await Account.deleteOne({ email });

        // Prepare the message for the notification service
        const message = {
            email: email, // Make sure this is defined
            message: `Account deleted for ${account.customerName}`,
        };

        // Check if custid is defined before sending the message
        if (!custid) {
            console.error('custid is undefined. Cannot send notification.');
            return res.status(500).json({ message: 'Error: custid is missing' });
        }

        // Send the notification to the queue
        channel.sendToQueue('notifications', Buffer.from(JSON.stringify(message)), { persistent: true });

        res.status(200).json({ message: 'Account deleted successfully' });
    } catch (error) {
        console.error('Error deleting account:', error);
        res.status(500).json({ message: 'Error deleting account', error: error.message });
    }
});



app.listen(PORT, () => {
    console.log(`Account service running on port ${PORT}`);
});
