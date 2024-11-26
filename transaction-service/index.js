const express = require('express');
const mongoose = require('mongoose');
const amqp = require('amqplib');
const Transaction = require('./transactionModel');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3004;

const cors = require('cors');
app.use(cors({
    origin: '*',
    methods: 'GET,POST,PUT,DELETE',
    allowedHeaders: 'Content-Type'
}));

// Middleware to parse JSON requests
app.use(express.json());

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/transactionDB1', {
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

// POST route to create a new transaction
// Assuming you have already required necessary modules like `Transaction` model and `channel` (RabbitMQ connection)

app.post('/transaction', async (req, res) => {
    try {
      // Destructure request body to extract transaction details
      const { senderemail, receiveremail, transactionId, amount, description } = req.body;
  
      // Validate required fields
      if (!senderemail || !receiveremail || !transactionId || !amount || !description) {
        return res.status(400).json({ message: 'All fields are required' });
      }
  
      // Optionally, check if senderemail and receiveremail exist in your users database
      const senderExists = await User.findOne({ email: senderemail });
      if (!senderExists) {
        return res.status(404).json({ message: 'Sender not found' });
      }
  
      const receiverExists = await User.findOne({ email: receiveremail });
      if (!receiverExists) {
        return res.status(404).json({ message: 'Receiver not found' });
      }
  
      // Create the new transaction
      const newTransaction = new Transaction({
        senderemail,
        receiveremail,
        transactionId,
        amount,
        description,
      });
  
      // Save the transaction in the database
      await newTransaction.save();
  
      // Prepare message for the notification queue
      const message = {
        email: senderemail,
        message: `Transaction of amount $${amount} sent from ${senderemail} to ${receiveremail}. Description: ${description}`,
      };
  
      // Send message to RabbitMQ notification queue
      channel.sendToQueue('notifications', Buffer.from(JSON.stringify(message)), { persistent: true });
  
      // Respond with the created transaction details
      res.status(201).json(newTransaction);
    } catch (error) {
      console.error('Error creating transaction:', error);
      res.status(500).json({ message: 'Error creating transaction' });
    }
  });
  

// DELETE route to delete a transaction
app.delete('/transaction/:transactionId', async (req, res) => {
    try {
        const transactionId = req.params.transactionId;
        const deletedTransaction = await Transaction.findOneAndDelete({ transactionId });

        if (!deletedTransaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        // Send message to notification queue
        const message = {
            senderemail: deletedTransaction.senderemail,
            message: `Transaction with ID ${transactionId} deleted for sender ${deletedTransaction.senderemail}`,
        };
        channel.sendToQueue('notifications', Buffer.from(JSON.stringify(message)), { persistent: true });

        res.status(204).send();
    } catch (error) {
        console.error('Error deleting transaction:', error);
        res.status(500).json({ message: 'Error deleting transaction' });
    }
});

// Assuming you have required necessary modules like `Transaction` model

// Route to fetch transactions based on email
app.get('/transactions/:senderemail', async (req, res) => {
    try {
      const email = req.params.senderemail; // Extract the senderemail from the URL parameter
      console.log(`Fetching transactions for: ${email}`);
  
      // Find transactions where the sender or receiver email matches the provided email
      const transactions = await Transaction.find({
        $or: [
          { senderemail: email }, // Transactions where the email is the sender
          { receiveremail: email }, // Transactions where the email is the receiver
        ],
      });
  
      if (transactions.length === 0) {
        console.log('No transactions found for this email');
        return res.status(404).json({ message: 'No transactions found for this email' });
      }
  
      console.log('Transactions found:', transactions);
      // Return the transactions as JSON response
      res.status(200).json(transactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({ message: 'Error fetching transactions' });
    }
  });
  
  
  

app.listen(PORT, () => {
    console.log(`Transaction service running on port ${PORT}`);
});
