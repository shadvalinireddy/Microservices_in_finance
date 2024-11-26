const express = require('express');
const mongoose = require('mongoose');
const amqp = require('amqplib');
const Insurance = require('./insuranceModel'); // Ensure the path is correct

const app = express();
const PORT = 3003; // or any other port you want

const cors = require('cors');
app.use(cors({
    origin: '*',
    methods: 'GET,POST,PUT,DELETE',
    allowedHeaders: 'Content-Type'
}));

// Middleware to parse JSON requests
app.use(express.json());

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/insuranceDB1', {
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
        console.log('RabbitMQ channel established');
    } catch (error) {
        console.error('Error connecting to RabbitMQ:', error);
    }
}

connectToRabbitMQ();

function isChannelReady(req, res, next) {
    if (!channel) {
        return res.status(500).json({ message: 'RabbitMQ channel not ready' });
    }
    next();
}

// Test route
app.get('/test', async (req, res) => {
    try {
        const insurances = await Insurance.find();
        res.status(200).send(insurances);
    } catch (error) {
        res.status(500).send(`Error: ${error.message}`);
    }
});

// Get all insurance details
app.get('/insurance', async (req, res) => {
    try {
        const insurances = await Insurance.find({});
        res.status(200).json(insurances);
    } catch (err) {
        console.error('Error fetching insurance details:', err);
        res.status(500).send('Error fetching insurance details');
    }
});

// POST route to create a new insurance
app.post('/insurance', isChannelReady, async (req, res) => {
    const { email, insuranceid, insuranceType, claimAmount } = req.body;

    try {
        // Create new insurance record
        const newInsurance = new Insurance({
            insuranceid,
            email,
            insuranceType,
            claimAmount,
            status: 'Active', // Default status can be 'Active'
        });

        const savedInsurance = await newInsurance.save();

        // Send message to notification queue about new insurance creation
        const message = {
            email: savedInsurance.email,
            message: `New insurance created for ${savedInsurance.email}`,
        };

        // Send the message to the notifications queue
        channel.sendToQueue('notifications', Buffer.from(JSON.stringify(message)), { persistent: true });

        console.log('New insurance created and notification sent successfully:', savedInsurance);
        res.status(201).json(savedInsurance);  // Send a response with the new insurance data
    } catch (error) {
        console.error('Error creating new insurance:', error);
        res.status(500).json({ message: 'Error creating new insurance' });
    }
});


// PUT route to update insurance by customer ID (or email)
// PUT route to update insurance details by email
app.put('/insurance/:insuranceid', isChannelReady, async (req, res) => {
    const { insuranceid } = req.params;
    const updatedData = req.body;

    try {
        const updatedInsurance = await Insurance.findOneAndUpdate(
            { insuranceid: insuranceid }, 
            updatedData, 
            { new: true }
        );

        if (!updatedInsurance) {
            return res.status(404).json({ message: 'Insurance not found' });
        }

        // Send message to notification queue about insurance update
        const message = {
            email: updatedInsurance.email,
            message: `Insurance updated for customer with email ${updatedInsurance.email}. New details: ${JSON.stringify(updatedData)}`,
        };

        // Send the message to the notifications queue
        channel.sendToQueue('notifications', Buffer.from(JSON.stringify(message)), { persistent: true });

        console.log('Insurance updated and notification sent successfully:', updatedInsurance);
        res.status(200).json(updatedInsurance);  // Return the updated insurance data
    } catch (error) {
        console.error('Error updating insurance:', error);
        res.status(500).json({ message: 'Error updating insurance' });
    }
});




// DELETE route to delete insurance by email
app.delete('/insurance/:insuranceid', isChannelReady, async (req, res) => {
    const { insuranceid } = req.params;

    try {
        // Delete insurance based on insuranceid
        const deletedInsurance = await Insurance.findOneAndDelete({ insuranceid });

        if (!deletedInsurance) {
            return res.status(404).json({ message: 'Insurance not found' });
        }

        // Send message to notification queue about insurance deletion
        const message = {
            email: deletedInsurance.email,
            message: `Insurance deleted for customer with email ${deletedInsurance.email}`,
        };

        // Send the message to the notifications queue
        channel.sendToQueue('notifications', Buffer.from(JSON.stringify(message)), { persistent: true });

        console.log('Insurance deleted and notification sent successfully:', deletedInsurance);
        res.status(204).send();  // Send a 204 status indicating successful deletion with no content
    } catch (error) {
        console.error('Error deleting insurance:', error);
        res.status(500).json({ message: 'Error deleting insurance' });
    }
});


// GET route to fetch insurance details by email
app.get('/insurance/:email', async (req, res) => {
    try {
        const email = req.params.email;
        console.log(`Fetching insurance details for customer email: ${email}`);

        // Fetch insurance records based on the email
        const insuranceRecords = await Insurance.find({ email: email });

        if (insuranceRecords.length === 0) {
            console.log(`No insurance found for email: ${email}`);
            return res.status(404).json({ message: 'No insurance policies found for this customer.' });
        }

        console.log(`Insurance details found: ${JSON.stringify(insuranceRecords)}`);
        res.status(200).json(insuranceRecords); // Return the insurance details as JSON
    } catch (error) {
        console.error('Error fetching insurance data:', error);
        res.status(500).json({ message: 'Error fetching insurance details.' });
    }
});

// GET route to fetch insurance details by customer ID
app.get('/insurance/:custid', async (req, res) => {
    try {
        const custid = req.params.custid;

        // Fetch insurance data for the customer ID
        const insurances = await Insurance.find({ custid: custid });

        if (insurances.length === 0) {
            return res.status(404).json({ message: 'No insurance policies found for this customer.' });
        }

        res.json(insurances); // Return the insurance details as JSON
    } catch (error) {
        console.error('Error fetching insurance data:', error);
        res.status(500).json({ message: 'Error fetching insurance details.' });
    }
});

app.listen(PORT, () => {
    console.log(`Insurance service running on port ${PORT}`);
});
